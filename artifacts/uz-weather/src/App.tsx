import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  Gauge,
  LocateFixed,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type LocationItem = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
};

type ForecastData = {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
    uv_index: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
  timezone: string;
};

const LOCATIONS: LocationItem[] = [
  { id: 'tashkent', name: 'Toshkent', region: 'Toshkent shahri', lat: 41.2995, lon: 69.2401 },
  { id: 'andijon', name: 'Andijon', region: 'Andijon viloyati', lat: 40.7821, lon: 72.3442 },
  { id: 'bukhara', name: 'Buxoro', region: 'Buxoro viloyati', lat: 39.7747, lon: 64.4286 },
  { id: 'jizzakh', name: 'Jizzax', region: 'Jizzax viloyati', lat: 40.1158, lon: 67.8422 },
  { id: 'qarshi', name: 'Qarshi', region: 'Qashqadaryo viloyati', lat: 38.861, lon: 65.7847 },
  { id: 'navoi', name: 'Navoiy', region: 'Navoiy viloyati', lat: 40.0844, lon: 65.3792 },
  { id: 'namangan', name: 'Namangan', region: 'Namangan viloyati', lat: 41.0011, lon: 71.6683 },
  { id: 'samarkand', name: 'Samarqand', region: 'Samarqand viloyati', lat: 39.6542, lon: 66.9597 },
  { id: 'gulistan', name: 'Guliston', region: 'Sirdaryo viloyati', lat: 40.4897, lon: 68.7842 },
  { id: 'termiz', name: 'Termiz', region: 'Surxondaryo viloyati', lat: 37.2242, lon: 67.2783 },
  { id: 'fergana', name: 'Farg‘ona', region: 'Farg‘ona viloyati', lat: 40.3864, lon: 71.7864 },
  { id: 'urgench', name: 'Urganch', region: 'Xorazm viloyati', lat: 41.55, lon: 60.6333 },
  { id: 'nukus', name: 'Nukus', region: 'Qoraqalpog‘iston Respublikasi', lat: 42.4531, lon: 59.6103 },
  { id: 'shahrisabz', name: 'Shahrisabz', region: 'Qashqadaryo viloyati', lat: 39.0578, lon: 66.8342 },
];

const timeFormat = new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit', minute: '2-digit' });
const UZ_WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const UZ_WEEKDAYS_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const UZ_MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];

type TimePeriod = 'morning' | 'day' | 'evening' | 'night';

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: 'Ertalab',
  day: 'Kunduz',
  evening: 'Kechqurun',
  night: 'Tun',
};

function getTimePeriod(hour = new Date().getHours()): TimePeriod {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 18) return 'day';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

function useTimePeriod() {
  const [period, setPeriod] = useState<TimePeriod>(() => getTimePeriod());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPeriod(getTimePeriod());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return { period, label: TIME_PERIOD_LABELS[period] };
}

function formatUzDate(date: Date) {
  return `${UZ_WEEKDAYS[date.getDay()]}, ${date.getDate()}-${UZ_MONTHS[date.getMonth()]}`;
}

function formatUzShortDate(date: Date) {
  return `${UZ_WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()}-${UZ_MONTHS_SHORT[date.getMonth()]}`;
}

function weatherLabel(code: number) {
  if (code === 0) return 'Ochiq osmon';
  if (code <= 3) return code === 1 ? 'Asosan ochiq' : 'Qisman bulutli';
  if (code <= 48) return 'Tumanli';
  if (code <= 57) return 'Mayda yomg‘ir';
  if (code <= 67) return 'Yomg‘ir';
  if (code <= 77) return 'Qor yog‘ishi';
  if (code <= 82) return 'Jala';
  return 'Momaqaldiroq';
}

function WeatherIcon({ code, size = 42 }: { code: number; size?: number }) {
  const props = { size, strokeWidth: 1.7, 'aria-hidden': true as const };
  if (code === 0) return <Sun {...props} className="text-amber-300" />;
  if (code <= 2) return <CloudSun {...props} className="text-amber-300" />;
  if (code === 3) return <Cloud {...props} className="text-slate-200" />;
  if (code <= 48) return <CloudFog {...props} className="text-slate-300" />;
  if (code <= 57) return <CloudDrizzle {...props} className="text-sky-200" />;
  if (code <= 82) return <CloudRain {...props} className="text-sky-200" />;
  return <CloudLightning {...props} className="text-amber-200" />;
}

function formatHour(value: string) {
  return new Intl.DateTimeFormat('uz-UZ', { hour: '2-digit' }).format(new Date(value));
}

function dateAtMidday(value: string) {
  return new Date(`${value}T12:00:00`);
}

async function fetchForecast(location: LocationItem): Promise<ForecastData> {
  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index',
    hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    forecast_days: '7',
    timezone: 'auto',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error('Ob-havo ma’lumotlarini olishning iloji bo‘lmadi.');
  return response.json() as Promise<ForecastData>;
}

async function searchGeocoding(value: string) {
  const params = new URLSearchParams({
    name: value,
    count: '8',
    language: 'uz',
    format: 'json',
  });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) throw new Error('Qidiruvda xatolik yuz berdi.');
  const data = (await response.json()) as { results?: Array<{ id: number; name: string; latitude: number; longitude: number; country?: string; admin1?: string }> };
  return (data.results ?? [])
    .filter((item) => {
      const country = item.country?.trim().toLocaleLowerCase();
      return country === 'uzbekistan' || country === 'o‘zbekiston' || country === "o'zbekiston";
    })
    .map((item) => ({
      id: `search-${item.id}`,
      name: item.name,
      region: item.admin1 ?? 'O‘zbekiston',
      lat: item.latitude,
      lon: item.longitude,
    }));
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-label="Ma’lumotlar yuklanmoqda" data-testid="status-loading">
      <div className="skeleton h-64 rounded-[1.5rem]" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div className="skeleton h-28 rounded-2xl" key={item} />)}
      </div>
      <div className="skeleton h-52 rounded-2xl" />
    </div>
  );
}

function Dashboard() {
  const [selected, setSelected] = useState<LocationItem>(LOCATIONS[0]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const { period, label: periodLabel } = useTimePeriod();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchForecast(selected)
      .then((data) => { if (!cancelled) setForecast(data); })
      .catch((reason: Error) => { if (!cancelled) setError(reason.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selected, refreshToken]);

  useEffect(() => {
    let cancelled = false;
    if (search.trim().length < 2) {
      setSearchResults([]);
      setSearchError('');
      return () => { cancelled = true; };
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError('');
      searchGeocoding(search.trim())
        .then((results) => { if (!cancelled) setSearchResults(results); })
        .catch((reason: Error) => { if (!cancelled) setSearchError(reason.message); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search]);

  const today = forecast?.current;
  const hourlyIndices = useMemo(() => {
    if (!forecast) return [];
    const currentHour = new Date(forecast.current.time).getTime();
    return forecast.hourly.time
      .map((time, index) => ({ time: new Date(time).getTime(), index }))
      .filter(({ time }) => time >= currentHour)
      .slice(0, 12)
      .map(({ index }) => index);
  }, [forecast]);

  function chooseLocation(location: LocationItem) {
    setSelected(location);
    setSelectorOpen(false);
    setSearch('');
    setSearchResults([]);
    setMobileMenu(false);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('Brauzeringiz joylashuvni aniqlashni qo‘llab-quvvatlamaydi.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelected({
          id: 'my-location',
          name: 'Sizning joylashuvingiz',
          region: 'Brauzer joylashuvi',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setGeoLoading(false);
        setSelectorOpen(false);
        setMobileMenu(false);
      },
      () => {
        setGeoLoading(false);
        setGeoError('Joylashuvga ruxsat berilmadi. Shaharni qo‘lda tanlang.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className={`weather-shell time-${period} flex min-h-[100dvh]`} data-time-period={period} aria-label={`Hozirgi rejim: ${periodLabel}`}>
      <aside className={`weather-sidebar fixed inset-y-0 left-0 z-40 w-[274px] shrink-0 px-5 py-6 text-white lg:sticky lg:block ${mobileMenu ? 'block' : 'hidden'}`} data-testid="sidebar-navigation">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]">
              <CloudSun size={23} strokeWidth={1.8} aria-hidden />
            </div>
            <div>
              <div className="text-[15px] font-extrabold tracking-[-.02em]">Ochiq osmon</div>
              <div className="font-mono text-[10px] uppercase tracking-[.18em] text-slate-400">O‘zbekiston</div>
            </div>
          </div>
          <button type="button" onClick={() => setMobileMenu(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Menyuni yopish" data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="mt-12">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-slate-500">Kuzatuv</p>
          <div className="space-y-1">
            <button type="button" className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-left text-sm font-bold text-white" data-testid="nav-dashboard"><Cloud size={17} className="text-teal-300" /> Bugungi ob-havo</button>
            <button type="button" onClick={() => { setSelectorOpen(true); setMobileMenu(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white" data-testid="nav-locations"><MapPin size={17} /> Joylashuvlar</button>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-slate-500">Tez tanlov</p>
          <div className="space-y-1">
            {LOCATIONS.slice(0, 5).map((location) => (
              <button key={location.id} type="button" onClick={() => chooseLocation(location)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/10 ${location.id === selected.id ? 'bg-white/10 font-bold text-white' : 'text-slate-300'}`} data-testid={`button-city-${location.id}`}>
                <span>{location.name}</span>{location.id === selected.id && <Check size={15} className="text-teal-300" />}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-7 left-5 right-5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400"><div className="h-2 w-2 rounded-full bg-teal-300" /> Open-Meteo bilan yangilanadi</div>
          <div className="mt-2 font-mono text-[10px] text-slate-500">Aniqroq kun. Osonroq reja.</div>
        </div>
      </aside>

      <main className="weather-main w-full flex-1">
        <header className="flex h-[74px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.82)] px-5 backdrop-blur-md sm:px-8 lg:px-10" data-testid="header-main">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileMenu(true)} className="rounded-xl p-2 hover:bg-[hsl(var(--muted))] lg:hidden" aria-label="Menyuni ochish" data-testid="button-open-menu"><Menu size={21} /></button>
            <div className="hidden font-mono text-[11px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))] sm:block">Bugun, {formatUzDate(new Date())} <span className="ml-2 opacity-70">/ {periodLabel}</span></div>
            <div className="font-mono text-[11px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))] sm:hidden">OB-HAVO / UZ</div>
          </div>
          <div className="relative flex items-center gap-2">
            <button type="button" onClick={useMyLocation} disabled={geoLoading} className="hidden items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold text-[hsl(var(--secondary-foreground))] transition hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] disabled:opacity-60 sm:flex" data-testid="button-use-location"><LocateFixed size={15} /> {geoLoading ? 'Aniqlanmoqda' : 'Joylashuvim'}</button>
            <button type="button" onClick={() => setSelectorOpen((value) => !value)} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold shadow-sm transition hover:border-[hsl(var(--primary))]" data-testid="button-location-selector"><MapPin size={15} className="text-[hsl(var(--primary))]" /><span className="max-w-[120px] truncate sm:max-w-[160px]">{selected.name}</span><ChevronDown size={15} className={`transition-transform ${selectorOpen ? 'rotate-180' : ''}`} /></button>
            {selectorOpen && (
              <div className="absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-xl" data-testid="location-selector-panel">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" />
                  <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Shahar yoki joy qidiring" className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--muted)/.55)] py-2.5 pl-9 pr-3 text-sm outline-none ring-[hsl(var(--primary))] placeholder:text-[hsl(var(--muted-foreground))] focus:ring-2" data-testid="input-search-location" />
                </div>
                <button type="button" onClick={useMyLocation} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]" data-testid="button-selector-geolocation"><LocateFixed size={16} /> Mening joylashuvimdan foydalanish</button>
                <div className="scrollbar-thin mt-2 max-h-64 overflow-y-auto">
                  {search.trim().length < 2 && LOCATIONS.map((location) => <LocationOption key={location.id} location={location} active={location.id === selected.id} onChoose={chooseLocation} />)}
                  {searching && <div className="px-3 py-4 text-xs text-[hsl(var(--muted-foreground))]">Joylar qidirilmoqda...</div>}
                  {searchError && <div className="px-3 py-3 text-xs text-[hsl(var(--destructive))]" data-testid="status-search-error">{searchError}</div>}
                  {!searching && search.trim().length >= 2 && searchResults.map((location) => <LocationOption key={location.id} location={location} active={location.id === selected.id} onChoose={chooseLocation} />)}
                  {!searching && search.trim().length >= 2 && searchResults.length === 0 && !searchError && <div className="px-3 py-4 text-xs text-[hsl(var(--muted-foreground))]">Mos joy topilmadi.</div>}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-[1420px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
          {geoError && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status" data-testid="status-geolocation-error"><span>{geoError}</span><button type="button" onClick={() => setGeoError('')} aria-label="Xabarni yopish" data-testid="button-dismiss-geo-error"><X size={16} /></button></div>}
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">O‘zbekiston / kuzatuv nuqtasi</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em] text-[hsl(var(--foreground))] sm:text-4xl" data-testid="text-page-title">Osmonni oldindan biling.</h1>
            </div>
            <button type="button" onClick={() => setRefreshToken((value) => value + 1)} disabled={loading} className="flex shrink-0 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold transition hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] disabled:opacity-50" data-testid="button-refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Yangilash</span></button>
          </div>

          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={() => setRefreshToken((value) => value + 1)} />}
          {!loading && !error && forecast && today && (
            <div className="space-y-6">
              <section className="current-card relative overflow-hidden rounded-[1.5rem] p-6 shadow-lg shadow-[hsl(207_68%_26%/.15)] sm:p-8" data-testid="card-current-weather">
                <div className="relative z-10 grid gap-8 md:grid-cols-[1.15fr_.85fr] md:items-end">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-sky-100"><MapPin size={16} /><span data-testid="text-current-location">{selected.name}</span><span className="text-sky-300/70">/</span><span className="text-sky-200/80">{selected.region}</span></div>
                    <div className="mt-8 flex items-center gap-5">
                      <WeatherIcon code={today.weather_code} size={76} />
                      <div className="flex items-start"><span className="text-7xl font-extrabold leading-none tracking-[-.08em] sm:text-8xl" data-testid="text-current-temperature">{Math.round(today.temperature_2m)}</span><span className="mt-1 text-3xl font-light text-sky-200">°C</span></div>
                    </div>
                    <div className="mt-4 text-xl font-bold" data-testid="text-current-condition">{weatherLabel(today.weather_code)}</div>
                    <div className="mt-1 text-sm text-sky-100/80">His qilinadi: {Math.round(today.apparent_temperature)}° · Bugun, {formatUzDate(new Date(today.time))}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat icon={<Wind size={17} />} label="Shamol" value={`${Math.round(today.wind_speed_10m)} km/soat`} />
                    <MiniStat icon={<Droplets size={17} />} label="Namlik" value={`${today.relative_humidity_2m}%`} />
                    <MiniStat icon={<Umbrella size={17} />} label="Yog‘ingarchilik" value={`${today.precipitation} mm`} />
                    <MiniStat icon={<Gauge size={17} />} label="Bosim" value={`${Math.round(today.surface_pressure)} hPa`} />
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <InfoCard icon={<Thermometer />} label="His qilinadigan" value={`${Math.round(today.apparent_temperature)}°`} hint="Havo haroratidan farqi" />
                <InfoCard icon={<Wind />} label="Shamol yo‘nalishi" value={windDirection(today.wind_direction_10m)} hint={`${Math.round(today.wind_speed_10m)} km/soat tezlikda`} />
                <InfoCard icon={<Sun />} label="UV indeksi" value={String(Math.round(today.uv_index))} hint={uvLabel(today.uv_index)} />
                <InfoCard icon={<CalendarDays />} label="Vaqt mintaqasi" value={forecast.timezone.replace('_', ' ')} hint="Mahalliy vaqt" compact />
              </div>

              <section className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm" data-testid="section-hourly">
                <SectionHeading title="Soatbay prognoz" eyebrow="Keyingi 12 soat" icon={<Wind size={16} />} />
                <div className="scrollbar-thin flex gap-2 overflow-x-auto px-5 pb-5">
                  {hourlyIndices.map((index, position) => <HourlyItem key={forecast.hourly.time[index]} time={position === 0 ? 'Hozir' : formatHour(forecast.hourly.time[index])} temp={forecast.hourly.temperature_2m[index]} code={forecast.hourly.weather_code[index]} rain={forecast.hourly.precipitation_probability[index]} active={position === 0} />)}
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
                <section className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm" data-testid="section-daily">
                  <SectionHeading title="7 kunlik prognoz" eyebrow="Hafta qanday ko‘rinadi" icon={<CalendarDays size={16} />} />
                  <div className="divide-y divide-[hsl(var(--border))] px-5">
                    {forecast.daily.time.map((date, index) => <DailyItem key={date} date={date} code={forecast.daily.weather_code[index]} max={forecast.daily.temperature_2m_max[index]} min={forecast.daily.temperature_2m_min[index]} rain={forecast.daily.precipitation_probability_max[index]} first={index === 0} />)}
                  </div>
                </section>
                <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm" data-testid="section-sun">
                  <SectionHeading title="Quyosh ritmi" eyebrow="Bugungi vaqtlar" icon={<Sunrise size={16} />} />
                  <div className="mt-5 rounded-xl bg-[hsl(var(--secondary)/.65)] p-4">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-100 p-2 text-amber-600"><Sunrise size={19} /></div><div><div className="text-xs text-[hsl(var(--muted-foreground))]">Quyosh chiqishi</div><div className="mt-0.5 font-mono text-lg font-medium" data-testid="text-sunrise">{timeFormat.format(new Date(forecast.daily.sunrise[0]))}</div></div></div><div className="h-px w-10 bg-[hsl(var(--border))]" /></div>
                    <div className="my-4 h-px bg-[hsl(var(--border))]" />
                    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-lg bg-indigo-100 p-2 text-indigo-600"><Sunset size={19} /></div><div><div className="text-xs text-[hsl(var(--muted-foreground))]">Quyosh botishi</div><div className="mt-0.5 font-mono text-lg font-medium" data-testid="text-sunset">{timeFormat.format(new Date(forecast.daily.sunset[0]))}</div></div></div></div>
                  </div>
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] p-3 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]"><Compass size={16} className="mt-0.5 shrink-0 text-[hsl(var(--primary))]" /> Ma’lumotlar Open-Meteo global ob-havo modelidan olingan va avtomatik yangilanadi.</div>
                </section>
              </div>

              <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm sm:p-6" data-testid="section-locations">
                <div className="flex flex-wrap items-end justify-between gap-3"><SectionHeading title="O‘zbekiston bo‘ylab" eyebrow="Boshqa nuqtalarni tanlang" icon={<MapPin size={16} />} noMargin /><button type="button" onClick={() => setSelectorOpen(true)} className="text-xs font-bold text-[hsl(var(--primary))] hover:underline" data-testid="button-view-all-locations">Barchasini ko‘rish</button></div>
                <div className="scrollbar-thin mt-5 flex gap-3 overflow-x-auto pb-1">{LOCATIONS.map((location) => <button key={location.id} type="button" onClick={() => chooseLocation(location)} className={`min-w-[138px] rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-[hsl(var(--primary))] ${location.id === selected.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--secondary)/.65)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--background)/.5)]'}`} data-testid={`card-location-${location.id}`}><div className="text-sm font-extrabold">{location.name}</div><div className="mt-1 truncate text-[11px] text-[hsl(var(--muted-foreground))]">{location.region}</div></button>)}</div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LocationOption({ location, active, onChoose }: { location: LocationItem; active: boolean; onChoose: (location: LocationItem) => void }) {
  return <button type="button" onClick={() => onChoose(location)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[hsl(var(--muted))] ${active ? 'bg-[hsl(var(--secondary))]' : ''}`} data-testid={`option-location-${location.id}`}><span><span className="block text-sm font-bold">{location.name}</span><span className="block text-[11px] text-[hsl(var(--muted-foreground))]">{location.region}</span></span>{active && <Check size={16} className="text-[hsl(var(--primary))]" />}</button>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center" role="alert" data-testid="status-error"><AlertTriangle className="mx-auto text-red-500" size={28} /><h2 className="mt-3 text-lg font-extrabold text-red-950">Ma’lumot yuklanmadi</h2><p className="mx-auto mt-1 max-w-md text-sm text-red-800">{message}</p><button type="button" onClick={onRetry} className="mt-5 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800" data-testid="button-retry">Qayta urinish</button></div>;
}

function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm"><div className="flex items-center gap-2 text-xs text-sky-100/80">{icon}{label}</div><div className="mt-2 text-base font-extrabold">{value}</div></div>;
}

function InfoCard({ icon, label, value, hint, compact = false }: { icon: ReactNode; label: string; value: string; hint: string; compact?: boolean }) {
  return <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">{icon}<span className="text-xs font-bold">{label}</span></div><div className={`mt-3 font-extrabold tracking-[-.04em] ${compact ? 'text-base' : 'text-2xl'}`} data-testid={`value-${label}`}>{value}</div><div className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{hint}</div></div>;
}

function SectionHeading({ title, eyebrow, icon, noMargin = false }: { title: string; eyebrow: string; icon: ReactNode; noMargin?: boolean }) {
  return <div className={`${noMargin ? '' : 'mb-5'} flex items-center gap-3`}><div className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">{icon}</div><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-[hsl(var(--muted-foreground))]">{eyebrow}</div><h2 className="mt-0.5 text-lg font-extrabold tracking-[-.03em]">{title}</h2></div></div>;
}

function HourlyItem({ time, temp, code, rain, active }: { time: string; temp: number; code: number; rain: number; active?: boolean }) {
  return <div className={`min-w-[76px] rounded-xl border p-3 text-center ${active ? 'border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]' : 'border-[hsl(var(--border))]'}`} data-testid={`hourly-item-${time}`}><div className="text-[11px] font-bold text-[hsl(var(--muted-foreground))]">{time}</div><div className="my-3 flex justify-center"><WeatherIcon code={code} size={25} /></div><div className="font-mono text-sm font-medium">{Math.round(temp)}°</div><div className="mt-2 font-mono text-[10px] text-[hsl(var(--primary))]">{rain}%</div></div>;
}

function DailyItem({ date, code, max, min, rain, first }: { date: string; code: number; max: number; min: number; rain: number; first?: boolean }) {
  return <div className="flex items-center gap-3 py-3.5" data-testid={`daily-item-${date}`}><div className="w-[86px] shrink-0 text-sm font-bold">{first ? 'Bugun' : formatUzShortDate(dateAtMidday(date))}</div><WeatherIcon code={code} size={27} /><div className="min-w-0 flex-1"><div className="truncate text-xs text-[hsl(var(--muted-foreground))]">{weatherLabel(code)}</div></div><div className="hidden items-center gap-1 text-xs text-[hsl(var(--primary))] sm:flex"><Droplets size={13} /> {rain}%</div><div className="w-[72px] text-right font-mono text-sm"><span className="font-bold">{Math.round(max)}°</span><span className="ml-2 text-[hsl(var(--muted-foreground))]">{Math.round(min)}°</span></div></div>;
}

function windDirection(degrees: number) {
  const directions = ['Shimol', 'Shimoli-sharq', 'Sharq', 'Janubi-sharq', 'Janub', 'Janubi-g‘arb', 'G‘arb', 'Shimoli-g‘arb'];
  return directions[Math.round(degrees / 45) % 8];
}

function uvLabel(value: number) {
  if (value < 3) return 'Past daraja';
  if (value < 6) return 'O‘rtacha daraja';
  if (value < 8) return 'Yuqori daraja';
  return 'Juda yuqori';
}

function Router() {
  return <Switch><Route path="/" component={Dashboard} /><Route component={NotFound} /></Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;