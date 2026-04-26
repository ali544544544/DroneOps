import { Keys, Storage } from './core.js';

// WeatherService, BrightSkyService, SunService
// These reference I18n and UI which remain global during transition

export const BrightSkyService = {
  ttlMs: 15 * 60 * 1000,
  getCache() { return Storage.get(Keys.brightSkyCache, {}); },
  setCache(data) { Storage.set(Keys.brightSkyCache, data); },
  async get(location, forceRefresh = false) {
    const cache = this.getCache();
    const cached = cache[location.id];
    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.ttlMs)) {
      return { ...cached, source: 'cache' };
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const url = new URL('https://api.brightsky.dev/weather');
    url.searchParams.set('lat', location.lat);
    url.searchParams.set('lon', location.lon);
    url.searchParams.set('date', today.toISOString().split('T')[0]);
    url.searchParams.set('last_date', tomorrow.toISOString().split('T')[0]);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`BrightSky API Error: ${res.status}`);
      const data = await res.json();
      if (!data.weather) throw new Error('BrightSky: Invalid data format');
      cache[location.id] = { data, timestamp: Date.now() };
      this.setCache(cache);
      return { data, timestamp: cache[location.id].timestamp, source: 'network' };
    } catch (error) {
      console.warn('BrightSkyService Fetch Error:', error);
      if (cached) return { ...cached, source: 'stale-cache', stale: true };
      return null;
    }
  }
};

export const WeatherService = {
  ttlMs: 10 * 60 * 1000,
  getCache() { return Storage.get(Keys.weatherCache, {}); },
  setCache(data) { Storage.set(Keys.weatherCache, data); },
  async get(location, forceRefresh = false) {
    const cache = this.getCache();
    const cached = cache[location.id];
    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.ttlMs)) {
      return { ...cached, source: 'cache' };
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', location.lat);
    url.searchParams.set('longitude', location.lon);
    url.searchParams.set('hourly', [
      'temperature_2m', 'apparent_temperature', 'relativehumidity_2m',
      'precipitation', 'weathercode', 'cloudcover', 'visibility',
      'windspeed_10m', 'windspeed_80m', 'windspeed_120m',
      'windgusts_10m', 'surface_pressure', 'winddirection_10m'
    ].join(','));
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '2');

    try {
      const [res, bsRes] = await Promise.all([
        fetch(url.toString()),
        BrightSkyService.get(location, forceRefresh)
      ]);
      if (!res.ok) throw new Error(`Open-Meteo API Error: ${res.status}`);
      const data = await res.json();
      if (!data.hourly || !data.current_weather) throw new Error('Open-Meteo: Invalid data format');
      const bsData = bsRes?.data || null;
      cache[location.id] = { data, bsData, timestamp: Date.now() };
      this.setCache(cache);
      return { data, bsData, timestamp: cache[location.id].timestamp, source: 'network' };
    } catch (error) {
      console.error('WeatherService Fetch Error:', error);
      if (cached) {
        return { ...cached, source: 'stale-cache', stale: true };
      }
      throw error;
    }
  },
  cleanup() {
    const cache = this.getCache();
    const now = Date.now();
    let changed = false;
    for (const id in cache) {
      if (now - cache[id].timestamp > 24 * 60 * 60 * 1000) {
        delete cache[id];
        changed = true;
      }
    }
    if (changed) this.setCache(cache);
  }
};

export const SunService = {
  ttlMs: 24 * 60 * 60 * 1000,
  getCache() { return Storage.get(Keys.sunCache, {}); },
  setCache(data) { Storage.set(Keys.sunCache, data); },
  dayKey(date) { return date.toISOString().split('T')[0]; },
  async get(location, date = new Date(), forceRefresh = false) {
    const cache = this.getCache();
    const cacheKey = `${location.id}_${this.dayKey(date)}`;
    const cached = cache[cacheKey];
    if (!forceRefresh && cached && (Date.now() - cached.timestamp < this.ttlMs)) {
      return { ...cached, source: 'cache' };
    }

    const url = new URL('https://api.sunrise-sunset.org/json');
    url.searchParams.set('lat', location.lat);
    url.searchParams.set('lng', location.lon);
    url.searchParams.set('formatted', '0');
    url.searchParams.set('date', this.dayKey(date));

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Sun API Error: ${res.status}`);
      const data = await res.json();
      if (data.status !== 'OK') throw new Error(`Sun API returned status: ${data.status}`);
      cache[cacheKey] = { data, timestamp: Date.now() };
      this.setCache(cache);
      return { data, timestamp: cache[cacheKey].timestamp, source: 'network' };
    } catch (error) {
      console.error('SunService Fetch Error:', error);
      if (cached) return { ...cached, source: 'stale-cache', stale: true };
      throw error;
    }
  },
  cleanup() {
    const cache = this.getCache();
    const now = Date.now();
    let changed = false;
    for (const key in cache) {
      if (now - cache[key].timestamp > 48 * 60 * 60 * 1000) {
        delete cache[key];
        changed = true;
      }
    }
    if (changed) this.setCache(cache);
  }
};
