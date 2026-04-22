const DATA_FILES = {
  profiles: './data/profiles.json',
  translations: './data/translations.json',
  weathercodes: './data/weathercodes.json',
};

class Storage {
  static get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`Storage.get failed for ${key}`, error);
      return fallback;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Storage.set failed for ${key}`, error);
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Storage.remove failed for ${key}`, error);
    }
  }
}

const Keys = {
  locations: 'drone_locations',
  activeLocation: 'drone_active_location',
  activeProfile: 'drone_active_profile',
  language: 'drone_language',
  weatherCache: 'drone_weather_cache',
  sunCache: 'drone_sun_cache',
};

const Util = {
  uuid() {
    return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  },
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  formatDate(dateStr, locale = 'de-DE') {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  },
  formatDateTime(dateStr, locale = 'de-DE') {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(locale, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  },
  formatTime(dateStr, locale = 'de-DE') {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  },
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  windDirectionArrow(deg = 0) {
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    return arrows[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
  },
  escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  },
};

const I18n = {
  translations: {},
  lang: 'de',
  init(translations) {
    this.translations = translations;
    this.lang = Storage.get(Keys.language, 'de') || 'de';
  },
  setLanguage(lang) {
    this.lang = lang;
    Storage.set(Keys.language, lang);
  },
  get locale() {
    return this.lang === 'de' ? 'de-DE' : 'en-US';
  },
  t(key, fallback = null) {
    return this.translations?.[this.lang]?.[key] ?? fallback ?? key;
  },
};

const ProfileManager = {
  profiles: [],
  init(profiles) {
    this.profiles = profiles;
    const saved = Storage.get(Keys.activeProfile, profiles[0]?.id || 'djimini');
    if (!this.getById(saved) && profiles[0]) {
      Storage.set(Keys.activeProfile, profiles[0].id);
    }
  },
  getAll() { return this.profiles; },
  getById(id) { return this.profiles.find(profile => profile.id === id); },
  getActive() {
    return this.getById(Storage.get(Keys.activeProfile, this.profiles[0]?.id)) || this.profiles[0];
  },
  setActive(id) {
    Storage.set(Keys.activeProfile, id);
  },
  label(profileId) {
    const profile = this.getById(profileId);
    return profile?.label?.[I18n.lang] || profile?.label?.de || profileId;
  },
};

const LocationManager = {
  getAll() {
    return Storage.get(Keys.locations, []);
  },
  saveAll(locations) {
    Storage.set(Keys.locations, locations);
  },
  add(location) {
    const locations = this.getAll();
    const exists = locations.some(item => Math.abs(item.lat - location.lat) < 0.0005 && Math.abs(item.lon - location.lon) < 0.0005);
    if (exists) {
      UI.toast(I18n.t('toast.locationExists'));
      return null;
    }
    const next = [{
      id: Util.uuid(),
      notes: '',
      logbook: [],
      createdAt: new Date().toISOString(),
      ...location,
    }, ...locations];
    this.saveAll(next);
    Storage.set(Keys.activeLocation, next[0].id);
    return next[0];
  },
  update(id, patch) {
    const next = this.getAll().map(item => item.id === id ? { ...item, ...patch } : item);
    this.saveAll(next);
    return next.find(item => item.id === id);
  },
  remove(id) {
    const next = this.getAll().filter(item => item.id !== id);
    this.saveAll(next);
    if (Storage.get(Keys.activeLocation) === id) {
      Storage.set(Keys.activeLocation, next[0]?.id || null);
    }
  },
  getById(id) {
    return this.getAll().find(item => item.id === id);
  },
  setActive(id) {
    Storage.set(Keys.activeLocation, id);
  },
  addLogEntry(locationId, entry) {
    const location = this.getById(locationId);
    if (!location) return;
    const logbook = [{ id: Util.uuid(), ...entry }, ...(location.logbook || [])];
    this.update(locationId, { logbook });
  },
  removeLogEntry(locationId, entryId) {
    const location = this.getById(locationId);
    if (!location) return;
    const logbook = (location.logbook || []).filter(item => item.id !== entryId);
    this.update(locationId, { logbook });
  },
};

const Nominatim = {
  _lastRequestAt: 0,
  async _throttle() {
    const diff = Date.now() - this._lastRequestAt;
    if (diff < 1000) await Util.wait(1000 - diff);
    this._lastRequestAt = Date.now();
  },
  async search(query) {
    await this._throttle();
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('accept-language', 'de,en');
    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    return response.json();
  },
  async reverse(lat, lon) {
    await this._throttle();
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('accept-language', 'de,en');
    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`Nominatim reverse ${response.status}`);
    return response.json();
  },
};

const WeatherService = {
  ttlMs: 10 * 60 * 1000,
  getCache() { return Storage.get(Keys.weatherCache, {}); },
  setCache(cache) { Storage.set(Keys.weatherCache, cache); },
  async get(location) {
    const cache = this.getCache();
    const cached = cache[location.id];
    const isFresh = cached && Date.now() - cached.timestamp < this.ttlMs;
    if (isFresh) return { ...cached, source: 'cache' };

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', location.lat);
    url.searchParams.set('longitude', location.lon);
    url.searchParams.set('hourly', [
      'temperature_2m', 'relativehumidity_2m', 'apparent_temperature', 'precipitation',
      'weathercode', 'cloudcover', 'visibility', 'windspeed_10m', 'windgusts_10m',
      'surface_pressure', 'winddirection_10m'
    ].join(','));
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '2');

    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
      const data = await response.json();
      const entry = { data, timestamp: Date.now() };
      cache[location.id] = entry;
      this.setCache(cache);
      return { ...entry, source: 'network' };
    } catch (error) {
      if (cached) {
        UI.toast(I18n.t('toast.offlineCache'));
        return { ...cached, source: 'stale-cache', stale: true };
      }
      throw error;
    }
  },
};
const SunService = {
  ttlMs: 24 * 60 * 60 * 1000,
  getCache() { return Storage.get(Keys.sunCache, {}); },
  setCache(cache) { Storage.set(Keys.sunCache, cache); },
  async get(location, date = new Date()) {
    const cache = this.getCache();
    const dateKey = new Date(date).toISOString().slice(0, 10);
    const cacheKey = `${location.id}_${dateKey}`;
    const cached = cache[cacheKey];
    const isFresh = cached && Date.now() - cached.timestamp < this.ttlMs;
    if (isFresh) return { ...cached, source: 'cache' };

    const url = new URL('https://api.sunrise-sunset.org/json');
    url.searchParams.set('lat', location.lat);
    url.searchParams.set('lng', location.lon);
    url.searchParams.set('formatted', '0');
    url.searchParams.set('date', dateKey);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Sun API ${response.status}`);
      const data = await response.json();
      const entry = { data, timestamp: Date.now() };
      cache[cacheKey] = entry;
      this.setCache(cache);
      return { ...entry, source: 'network' };
    } catch (error) {
      if (cached) return { ...cached, source: 'stale-cache', stale: true };
      throw error;
    }
  },
};

const ScoreEngine = {
  calculate({ wind = 0, gusts = 0, rain = 0, clouds = 0, visibility = 10000, temp = 20, profile }) {
    let score = 100;
    const factors = [];

    if (wind <= profile.maxWind) {
      factors.push({ key: 'wind', label: I18n.t('factor.windOk'), severity: 'ok' });
    } else if (wind <= profile.critWind) {
      score -= 25;
      factors.push({ key: 'wind', label: I18n.t('factor.windWarn'), severity: 'warn' });
    } else {
      score -= 45;
      factors.push({ key: 'wind', label: I18n.t('factor.windCritical'), severity: 'critical' });
    }

    if (gusts <= profile.maxGusts) {
      factors.push({ key: 'gusts', label: I18n.t('factor.gustsOk'), severity: 'ok' });
    } else if (gusts <= profile.critGusts) {
      score -= 15;
      factors.push({ key: 'gusts', label: I18n.t('factor.gustsWarn'), severity: 'warn' });
    } else {
      score -= 25;
      factors.push({ key: 'gusts', label: I18n.t('factor.gustsCritical'), severity: 'critical' });
    }

    if (profile.rainTolerance === 'none') {
      if (rain > 0) {
        score -= 30;
        factors.push({ key: 'rain', label: I18n.t('factor.rainCritical'), severity: 'critical' });
      }
    } else if (profile.rainTolerance === 'low') {
      if (rain > 2) {
        score -= 30;
        factors.push({ key: 'rain', label: I18n.t('factor.rainCritical'), severity: 'critical' });
      } else if (rain > 0.5) {
        score -= 20;
        factors.push({ key: 'rain', label: I18n.t('factor.rainWarn'), severity: 'warn' });
      }
    } else if (profile.rainTolerance === 'medium') {
      if (rain > 5) {
        score -= 25;
        factors.push({ key: 'rain', label: I18n.t('factor.rainCritical'), severity: 'critical' });
      } else if (rain > 2) {
        score -= 15;
        factors.push({ key: 'rain', label: I18n.t('factor.rainWarn'), severity: 'warn' });
      }
    }

    if (visibility >= 5000) {
      factors.push({ key: 'visibility', label: I18n.t('factor.visibilityOk'), severity: 'ok' });
    } else if (visibility >= 1500) {
      score -= 10;
      factors.push({ key: 'visibility', label: I18n.t('factor.visibilityWarn'), severity: 'warn' });
    } else {
      score -= 20;
      factors.push({ key: 'visibility', label: I18n.t('factor.visibilityCritical'), severity: 'critical' });
    }

    if (temp < -5 || temp > 38) {
      score -= 10;
      factors.push({ key: 'temp', label: I18n.t('factor.tempWarn'), severity: 'warn' });
    }

    if (clouds < 20) {
      factors.push({ key: 'clouds', label: I18n.t('factor.cloudsClear'), severity: 'ok' });
    } else if (clouds < 60) {
      factors.push({ key: 'clouds', label: I18n.t('factor.cloudsPartly'), severity: 'ok' });
    } else if (clouds < 90) {
      factors.push({ key: 'clouds', label: I18n.t('factor.cloudsHeavy'), severity: 'warn' });
    } else {
      factors.push({ key: 'clouds', label: I18n.t('factor.cloudsOvercast'), severity: 'warn' });
    }

    score = Util.clamp(score, 0, 100);
    const status = score >= 70 ? 'fly' : score >= 40 ? 'caution' : 'nogo';
    return { score, status, factors };
  },
};

const GoldenHour = {
  calculate({ sunrise, sunset, civilDawn, civilDusk }) {
    const sunriseDate = new Date(sunrise);
    const sunsetDate = new Date(sunset);
    const civilDawnDate = new Date(civilDawn);
    const civilDuskDate = new Date(civilDusk);
    const morningStart = civilDawnDate;
    const morningEnd = new Date(sunriseDate.getTime() + 60 * 60 * 1000);
    const eveningStart = new Date(sunsetDate.getTime() - 60 * 60 * 1000);
    const eveningEnd = civilDuskDate;
    const now = new Date();

    let whichPhase = null;
    if (now >= morningStart && now <= morningEnd) whichPhase = 'morning';
    if (now >= eveningStart && now <= eveningEnd) whichPhase = 'evening';

    return {
      morningStart, morningEnd, eveningStart, eveningEnd,
      isActiveNow: Boolean(whichPhase), whichPhase,
    };
  },
  isHourInside(dateLike, gh) {
    const date = new Date(dateLike);
    return (date >= gh.morningStart && date <= gh.morningEnd) || (date >= gh.eveningStart && date <= gh.eveningEnd);
  },
};

const Router = {
  show(view, id = null) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    if (view === 'detail') {
      document.getElementById('viewDetail').classList.add('active');
      if (id) LocationManager.setActive(id);
    } else {
      document.getElementById('viewList').classList.add('active');
    }
  },
};

const UI = {
  elements: {},
  weathercodes: {},
  init(weathercodes) {
    this.weathercodes = weathercodes;
    this.elements = {
      profileSelect: document.getElementById('profileSelect'),
      liveClock: document.getElementById('liveClock'),
      locationList: document.getElementById('locationList'),
      searchInput: document.getElementById('locationSearchInput'),
      searchSuggestions: document.getElementById('searchSuggestions'),
      flightStatusPanel: document.getElementById('flightStatusPanel'),
      weatherPanel: document.getElementById('weatherPanel'),
      sunPanel: document.getElementById('sunPanel'),
      mapPanel: document.getElementById('mapPanel'),
      hourlyPanel: document.getElementById('hourlyPanel'),
      notesLogbookPanel: document.getElementById('notesLogbookPanel'),
      detailTitle: document.getElementById('detailTitle'),
      routeBtnTop: document.getElementById('routeBtnTop'),
      toastContainer: document.getElementById('toastContainer'),
    };
  },
  applyI18n() {
    document.documentElement.lang = I18n.lang;
    document.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = I18n.t(node.dataset.i18n);
    });
    this.elements.searchInput.placeholder = I18n.t('search.placeholder');
  },
  toast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3400);
  },
  setClock() {
    this.elements.liveClock.textContent = new Date().toLocaleTimeString(I18n.locale);
  },
  renderProfileSelect() {
    const active = ProfileManager.getActive();
    this.elements.profileSelect.innerHTML = ProfileManager.getAll().map(profile => (
      `<option value="${profile.id}" ${profile.id === active.id ? 'selected' : ''}>${profile.label[I18n.lang] || profile.label.de}</option>`
    )).join('');
  },
  weatherMetaFromCode(code) {
    const fallback = this.weathercodes.default;
    return this.weathercodes[String(code)] || fallback;
  },
  lastVisit(location) {
    const latest = (location.logbook || [])[0];
    if (!latest) return '—';
    return `${Util.formatDate(latest.date, I18n.locale)} · ${ProfileManager.label(latest.drone)}`;
  },
    async renderLocationList() {
    const locations = LocationManager.getAll();
    if (!locations.length) {
      this.elements.locationList.innerHTML = document.getElementById('emptyStateTemplate').innerHTML;
      this.applyI18n();
      return;
    }

    this.elements.locationList.innerHTML = locations.map(location => `
      <article class="location-card" data-location-card="${location.id}">
        <div>
          <h3>${Util.escapeHtml(location.name)}</h3>
          <div class="location-meta">
            <span class="inline-pill">📍 ${Number(location.lat).toFixed(4)}, ${Number(location.lon).toFixed(4)}</span>
            <span class="inline-pill">🗓️ ${Util.formatDate(location.createdAt, I18n.locale)}</span>
          </div>
          <p class="muted">${I18n.t('list.lastVisit')}: ${this.lastVisit(location)}</p>
        </div>

        <div>
          <strong>${I18n.t('list.liveWeather')}</strong>
          <div class="metric-grid" id="weather-mini-${location.id}">
            <span class="metric-chip">…</span>
          </div>
        </div>

        <div>
          <strong>${I18n.t('list.goldenHour')}</strong>
          <div class="metric-grid" id="golden-mini-${location.id}">
            <span class="metric-chip">…</span>
          </div>
        </div>

        <div class="inline-actions">
          <button class="btn" data-action="detail" data-id="${location.id}">${I18n.t('list.details')}</button>
          <button class="btn btn-secondary" data-action="delete" data-id="${location.id}">✕</button>
        </div>
      </article>
    `).join('');

    locations.forEach(async (location) => {
      try {
        const [weather, sun] = await Promise.all([WeatherService.get(location), SunService.get(location)]);
        const profile = ProfileManager.getActive();
        const currentHourIndex = weather.data.hourly.time.indexOf(weather.data.current_weather.time);
        const idx = currentHourIndex >= 0 ? currentHourIndex : 0;
        const score = ScoreEngine.calculate({
          wind: weather.data.current_weather.windspeed,
          gusts: weather.data.hourly.windgusts_10m[idx],
          rain: weather.data.hourly.precipitation[idx],
          clouds: weather.data.hourly.cloudcover[idx],
          visibility: weather.data.hourly.visibility[idx],
          temp: weather.data.current_weather.temperature,
          profile,
        });
        const weatherMeta = this.weatherMetaFromCode(weather.data.current_weather.weathercode);
        const gh = GoldenHour.calculate({
          sunrise: sun.data.results.sunrise,
          sunset: sun.data.results.sunset,
          civilDawn: sun.data.results.civil_twilight_begin,
          civilDusk: sun.data.results.civil_twilight_end,
        });
        const weatherTarget = document.getElementById(`weather-mini-${location.id}`);
        const goldenTarget = document.getElementById(`golden-mini-${location.id}`);
        if (weatherTarget) {
          weatherTarget.innerHTML = `
            <span class="metric-chip">${weatherMeta.icon} ${weather.data.current_weather.temperature}°C</span>
            <span class="metric-chip">💨 ${weather.data.current_weather.windspeed} m/s</span>
            <span class="badge ${score.status}">${I18n.t(`status.${score.status}`)} · ${score.score}</span>
          `;
        }
        if (goldenTarget) {
          goldenTarget.innerHTML = `
            <span class="metric-chip">🌅 ${Util.formatTime(gh.morningStart, I18n.locale)}–${Util.formatTime(gh.morningEnd, I18n.locale)}</span>
            <span class="metric-chip">🌇 ${Util.formatTime(gh.eveningStart, I18n.locale)}–${Util.formatTime(gh.eveningEnd, I18n.locale)}</span>
          `;
        }
      } catch (error) {
        const weatherTarget = document.getElementById(`weather-mini-${location.id}`);
        const goldenTarget = document.getElementById(`golden-mini-${location.id}`);
        if (weatherTarget) weatherTarget.innerHTML = `<span class="metric-chip">${I18n.t('error.dataUnavailable')}</span>`;
        if (goldenTarget) goldenTarget.innerHTML = `<span class="metric-chip">${I18n.t('error.dataUnavailable')}</span>`;
      }
    });
  },
  renderMap(location) {
    const bbox = [location.lon - 0.05, location.lat - 0.04, location.lon + 0.05, location.lat + 0.04].join(',');
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat},${location.lon}`;
    this.elements.routeBtnTop.onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`, '_blank');
    this.elements.mapPanel.innerHTML = `
      <h3>${I18n.t('detail.map')}</h3>
      <iframe class="map-embed" src="${src}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      <div class="info-list" style="margin-top:12px">
        <span class="inline-pill">📍 ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}</span>
        <button class="btn" id="routeBtnBottom">${I18n.t('nav.route')}</button>
      </div>
    `;
    document.getElementById('routeBtnBottom').onclick = this.elements.routeBtnTop.onclick;
  },
  renderFlightStatus({ score, weather, location, profile }) {
    const weatherMeta = this.weatherMetaFromCode(weather.data.current_weather.weathercode);
    const currentHourIndex = weather.data.hourly.time.indexOf(weather.data.current_weather.time);
    const idx = currentHourIndex >= 0 ? currentHourIndex : 0;
    this.elements.flightStatusPanel.innerHTML = `
      <h3>${I18n.t('detail.flightStatus')}</h3>
      <div class="score-hero">
        <div>
          <div class="score-value">${score.score}</div>
          <div class="badge ${score.status}">${I18n.t(`status.${score.status}`)}</div>
          <p class="muted" style="margin-top:10px">${I18n.t(`statusText.${score.status}`)}</p>
        </div>
        <div>
          <div class="inline-pill">🚁 ${profile.label[I18n.lang] || profile.label.de}</div>
          <div class="inline-pill">${weatherMeta.icon} ${weatherMeta[I18n.lang]}</div>
        </div>
      </div>
      <div class="quick-stats">
        <div class="kpi"><span>${I18n.t('weather.wind')}</span><strong>${weather.data.current_weather.windspeed} m/s</strong></div>
        <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${weather.data.hourly.windgusts_10m[idx]} m/s</strong></div>
        <div class="kpi"><span>${I18n.t('weather.rain')}</span><strong>${weather.data.hourly.precipitation[idx]} mm/h</strong></div>
      </div>
      <div class="tag-list" style="margin-top:14px">
        ${score.factors.map(f => `<span class="tag ${f.severity}">${Util.escapeHtml(f.label)}</span>`).join('')}
      </div>
      <p class="muted" style="margin-top:14px">${I18n.t('detail.updated')}: ${Util.formatDateTime(new Date(), I18n.locale)}</p>
    `;
  },
  renderWeather(weather) {
    const currentHourIndex = weather.data.hourly.time.indexOf(weather.data.current_weather.time);
    const idx = currentHourIndex >= 0 ? currentHourIndex : 0;
    const currentCode = weather.data.current_weather.weathercode;
    const meta = this.weatherMetaFromCode(currentCode);
    this.elements.weatherPanel.innerHTML = `
      <h3>${I18n.t('detail.weather')}</h3>
      <div class="quick-stats">
        <div class="kpi"><span>${I18n.t('weather.temp')}</span><strong>${weather.data.current_weather.temperature} °C</strong></div>
        <div class="kpi"><span>${I18n.t('weather.feels')}</span><strong>${weather.data.hourly.apparent_temperature[idx]} °C</strong></div>
        <div class="kpi"><span>${I18n.t('weather.wind')}</span><strong>${weather.data.current_weather.windspeed} m/s</strong></div>
        <div class="kpi"><span>${I18n.t('weather.direction')}</span><strong>${Util.windDirectionArrow(weather.data.hourly.winddirection_10m[idx])} ${weather.data.hourly.winddirection_10m[idx]}°</strong></div>
        <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${weather.data.hourly.windgusts_10m[idx]} m/s</strong></div>
        <div class="kpi"><span>${I18n.t('weather.humidity')}</span><strong>${weather.data.hourly.relativehumidity_2m[idx]}%</strong></div>
        <div class="kpi"><span>${I18n.t('weather.rain')}</span><strong>${weather.data.hourly.precipitation[idx]} mm/h</strong></div>
        <div class="kpi"><span>${I18n.t('weather.clouds')}</span><strong>${weather.data.hourly.cloudcover[idx]}%</strong></div>
        <div class="kpi"><span>${I18n.t('weather.visibility')}</span><strong>${(weather.data.hourly.visibility[idx] / 1000).toFixed(1)} km</strong></div>
        <div class="kpi"><span>${I18n.t('weather.pressure')}</span><strong>${Math.round(weather.data.hourly.surface_pressure[idx])} hPa</strong></div>
      </div>
      <p style="margin-top:14px">${meta.icon} ${meta[I18n.lang]}</p>
    `;
  },
    renderSun(sunData) {
    const sunrise = new Date(sunData.results.sunrise);
    const sunset = new Date(sunData.results.sunset);
    const civilDawn = new Date(sunData.results.civil_twilight_begin);
    const civilDusk = new Date(sunData.results.civil_twilight_end);
    const gh = GoldenHour.calculate({ sunrise, sunset, civilDawn, civilDusk });
    const now = new Date();
    const progress = Util.clamp((now - civilDawn) / (civilDusk - civilDawn), 0, 1);
    const width = 320;
    const height = 140;
    const x = 20 + (width - 40) * progress;
    const radius = (width - 40) / 2;
    const cx = width / 2;
    const cy = height - 20;
    const dx = x - cx;
    const dy = Math.sqrt(Math.max(radius * radius - dx * dx, 0));
    const sunY = cy - dy;
    const dayLengthMin = Math.round((sunset - sunrise) / 60000);
    const hours = Math.floor(dayLengthMin / 60);
    const mins = dayLengthMin % 60;

    this.elements.sunPanel.innerHTML = `
      <h3>${I18n.t('detail.sun')}</h3>
      <div class="sun-times">
        <span class="inline-pill">🌄 ${I18n.t('sun.dawn')}: ${Util.formatTime(civilDawn, I18n.locale)}</span>
        <span class="inline-pill">☀️ ${I18n.t('sun.sunrise')}: ${Util.formatTime(sunrise, I18n.locale)}</span>
        <span class="inline-pill">🌇 ${I18n.t('sun.sunset')}: ${Util.formatTime(sunset, I18n.locale)}</span>
        <span class="inline-pill">🌃 ${I18n.t('sun.dusk')}: ${Util.formatTime(civilDusk, I18n.locale)}</span>
      </div>
      <div class="sun-arc-wrap">
        <svg class="sun-arc" viewBox="0 0 ${width} ${height}" aria-label="Sun path">
          <path d="M 20 ${cy} A ${radius} ${radius} 0 0 1 ${width - 20} ${cy}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="3" />
          <circle cx="${x}" cy="${sunY}" r="8" fill="rgba(255,213,125,0.95)" />
          <circle cx="20" cy="${cy}" r="4" fill="rgba(86,168,255,0.9)" />
          <circle cx="${width - 20}" cy="${cy}" r="4" fill="rgba(239,78,78,0.9)" />
        </svg>
      </div>
      <div class="metric-grid">
        <span class="metric-chip">🌅 ${Util.formatTime(gh.morningStart, I18n.locale)}–${Util.formatTime(gh.morningEnd, I18n.locale)}</span>
        <span class="metric-chip">🌇 ${Util.formatTime(gh.eveningStart, I18n.locale)}–${Util.formatTime(gh.eveningEnd, I18n.locale)}</span>
        <span class="metric-chip">⏱️ ${I18n.t('sun.dayLength')}: ${hours}h ${mins}min</span>
      </div>
      ${gh.isActiveNow ? `<p style="margin-top:12px">✨ ${I18n.t('sun.goldenHourActive')} (${I18n.t(`sun.phase.${gh.whichPhase}`)})</p>` : ''}
    `;

    return gh;
  },
  renderHourly(weather, gh) {
    const profile = ProfileManager.getActive();
    const items = weather.data.hourly.time.slice(0, 48).map((time, index) => {
      const score = ScoreEngine.calculate({
        wind: weather.data.hourly.windspeed_10m[index],
        gusts: weather.data.hourly.windgusts_10m[index],
        rain: weather.data.hourly.precipitation[index],
        clouds: weather.data.hourly.cloudcover[index],
        visibility: weather.data.hourly.visibility[index],
        temp: weather.data.hourly.temperature_2m[index],
        profile,
      });
      const meta = this.weatherMetaFromCode(weather.data.hourly.weathercode[index]);
      return {
        time,
        score,
        meta,
        wind: weather.data.hourly.windspeed_10m[index],
        rain: weather.data.hourly.precipitation[index],
        golden: GoldenHour.isHourInside(time, gh),
      };
    });

    const bestScore = Math.max(...items.map(item => item.score.score));
    this.elements.hourlyPanel.innerHTML = `
      <h3>${I18n.t('detail.hourly')}</h3>
      <div class="hourly-scroll">
        ${items.map(item => `
          <article class="hour-card ${item.score.score === bestScore ? 'best' : ''} ${item.golden ? 'gh' : ''}">
            <span>${new Date(item.time).toLocaleDateString(I18n.locale, { weekday: 'short' })}</span>
            <strong>${Util.formatTime(item.time, I18n.locale)}</strong>
            <div>${item.meta.icon} ${item.score.score}</div>
            <span>${I18n.t('weather.wind')}: ${item.wind} m/s</span>
            <span>${I18n.t('weather.rain')}: ${item.rain} mm/h</span>
            ${item.golden ? '<div>🌅 Golden Hour</div>' : ''}
          </article>
        `).join('')}
      </div>
    `;
  },
  renderNotesLogbook(location) {
    this.elements.notesLogbookPanel.innerHTML = `
      <h3>${I18n.t('detail.notesLogbook')}</h3>
      <div class="notes-grid">
        <div>
          <label class="field">
            <span>${I18n.t('detail.notes')}</span>
            <textarea id="notesArea" placeholder="${I18n.t('detail.notesPlaceholder')}">${Util.escapeHtml(location.notes || '')}</textarea>
          </label>
        </div>
        <div>
          <form id="logbookForm" class="field">
            <span>${I18n.t('detail.addLog')}</span>
            <div class="form-row">
              <input type="date" id="logDate" required value="${new Date().toISOString().slice(0, 10)}" />
              <select id="logDrone">
                ${ProfileManager.getAll().map(profile => `<option value="${profile.id}">${profile.label[I18n.lang] || profile.label.de}</option>`).join('')}
              </select>
            </div>
            <input type="text" id="logNote" maxlength="200" placeholder="${I18n.t('detail.logPlaceholder')}" />
            <button class="btn" type="submit">${I18n.t('detail.saveEntry')}</button>
          </form>
          <div class="logbook-list" id="logbookList" style="margin-top:14px">
            ${(location.logbook || []).length ? (location.logbook || []).map(entry => `
              <article class="log-entry">
                <div>
                  <strong>${Util.formatDate(entry.date, I18n.locale)}</strong>
                  <div>${Util.escapeHtml(ProfileManager.label(entry.drone))}</div>
                  <small>${Util.escapeHtml(entry.note || '')}</small>
                </div>
                <button class="btn btn-secondary" data-log-delete="${entry.id}">🗑️</button>
              </article>
            `).join('') : `<p class="muted">${I18n.t('detail.noLogs')}</p>`}
          </div>
        </div>
      </div>
    `;

    const saveNotes = Util.debounce((event) => {
      LocationManager.update(location.id, { notes: event.target.value });
      UI.toast(I18n.t('toast.notesSaved'));
    }, 1000);
    document.getElementById('notesArea').addEventListener('input', saveNotes);

    document.getElementById('logbookForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const date = document.getElementById('logDate').value;
      const drone = document.getElementById('logDrone').value;
      const note = document.getElementById('logNote').value.trim();
      LocationManager.addLogEntry(location.id, { date, drone, note });
      App.renderCurrentDetail();
      this.toast(I18n.t('toast.logSaved'));
    });

    this.elements.notesLogbookPanel.querySelectorAll('[data-log-delete]').forEach(button => {
      button.addEventListener('click', () => {
        LocationManager.removeLogEntry(location.id, button.dataset.logDelete);
        App.renderCurrentDetail();
      });
    });
  },
};
const App = {
  dataLoaded: false,
  async init() {
    try {
      const [profiles, translations, weathercodes] = await Promise.all([
        fetch(DATA_FILES.profiles).then(r => r.json()),
        fetch(DATA_FILES.translations).then(r => r.json()),
        fetch(DATA_FILES.weathercodes).then(r => r.json()),
      ]);

      I18n.init(translations);
      ProfileManager.init(profiles);
      UI.init(weathercodes);
      UI.applyI18n();
      UI.renderProfileSelect();
      UI.setClock();
      setInterval(() => UI.setClock(), 1000);

      this.bindEvents();
      this.dataLoaded = true;
      await UI.renderLocationList();
    } catch (error) {
      console.error(error);
      document.body.innerHTML = `<main style="padding:24px;color:white">App konnte nicht initialisiert werden. Prüfe, ob alle Dateien im Repository vorhanden sind.</main>`;
    }
  },
  bindEvents() {
    document.getElementById('langDe').addEventListener('click', async () => {
      I18n.setLanguage('de');
      await this.rerenderAll();
    });
    document.getElementById('langEn').addEventListener('click', async () => {
      I18n.setLanguage('en');
      await this.rerenderAll();
    });
    document.getElementById('profileSelect').addEventListener('change', async (event) => {
      ProfileManager.setActive(event.target.value);
      await this.rerenderAll();
    });
    document.getElementById('backBtn').addEventListener('click', async () => {
      Router.show('list');
      await UI.renderLocationList();
    });
    document.getElementById('gpsAddBtn').addEventListener('click', () => this.addCurrentLocation());

    const doSearch = Util.debounce(async (value) => {
      if (!value || value.trim().length < 2) {
        UI.elements.searchSuggestions.classList.add('hidden');
        UI.elements.searchSuggestions.innerHTML = '';
        return;
      }
      try {
        const results = await Nominatim.search(value.trim());
        if (!results.length) {
          UI.toast(I18n.t('toast.notFound'));
          return;
        }
        UI.elements.searchSuggestions.innerHTML = results.map(item => `
          <button class="suggestion-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${Util.escapeHtml(item.display_name)}">
            ${Util.escapeHtml(item.display_name)}
          </button>
        `).join('');
        UI.elements.searchSuggestions.classList.remove('hidden');
        UI.elements.searchSuggestions.querySelectorAll('.suggestion-item').forEach(button => {
          button.addEventListener('click', async () => {
            const location = LocationManager.add({
              name: button.dataset.name,
              lat: Number(button.dataset.lat),
              lon: Number(button.dataset.lon),
            });
            UI.elements.searchInput.value = '';
            UI.elements.searchSuggestions.classList.add('hidden');
            UI.elements.searchSuggestions.innerHTML = '';
            if (location) {
              await UI.renderLocationList();
              this.openDetail(location.id);
            }
          });
        });
      } catch (error) {
        console.error(error);
        UI.toast(I18n.t('error.searchFailed'));
      }
    }, 500);

    UI.elements.searchInput.addEventListener('input', (event) => doSearch(event.target.value));

    document.addEventListener('click', async (event) => {
      const detailBtn = event.target.closest('[data-action="detail"]');
      const deleteBtn = event.target.closest('[data-action="delete"]');
      if (detailBtn) {
        this.openDetail(detailBtn.dataset.id);
      }
      if (deleteBtn) {
        if (window.confirm(I18n.t('confirm.deleteLocation'))) {
          LocationManager.remove(deleteBtn.dataset.id);
          await UI.renderLocationList();
          Router.show('list');
        }
      }
    });
  },
  async addCurrentLocation() {
    if (!('geolocation' in navigator)) {
      UI.toast(I18n.t('error.gpsUnavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const data = await Nominatim.reverse(latitude, longitude);
        const name = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        const location = LocationManager.add({ name, lat: latitude, lon: longitude });
        if (location) {
          await UI.renderLocationList();
          this.openDetail(location.id);
        }
      } catch (error) {
        console.error(error);
        UI.toast(I18n.t('error.searchFailed'));
      }
    }, () => UI.toast(I18n.t('error.gpsDenied')));
  },
  async openDetail(locationId) {
    const location = LocationManager.getById(locationId);
    if (!location) return;
    LocationManager.setActive(locationId);
    Router.show('detail', locationId);
    await this.renderCurrentDetail();
  },
  async renderCurrentDetail() {
    const id = Storage.get(Keys.activeLocation);
    const location = LocationManager.getById(id);
    if (!location) {
      Router.show('list');
      return UI.renderLocationList();
    }
    UI.elements.detailTitle.textContent = location.name;
    UI.renderMap(location);
    UI.renderNotesLogbook(location);

    try {
      const [weather, sun] = await Promise.all([WeatherService.get(location), SunService.get(location)]);
      const profile = ProfileManager.getActive();
      const currentHourIndex = weather.data.hourly.time.indexOf(weather.data.current_weather.time);
      const idx = currentHourIndex >= 0 ? currentHourIndex : 0;
      const score = ScoreEngine.calculate({
        wind: weather.data.current_weather.windspeed,
        gusts: weather.data.hourly.windgusts_10m[idx],
        rain: weather.data.hourly.precipitation[idx],
        clouds: weather.data.hourly.cloudcover[idx],
        visibility: weather.data.hourly.visibility[idx],
        temp: weather.data.current_weather.temperature,
        profile,
      });
      UI.renderFlightStatus({ score, weather, location, profile });
      UI.renderWeather(weather);
      const gh = UI.renderSun(sun.data);
      UI.renderHourly(weather, gh);
    } catch (error) {
      console.error(error);
      UI.elements.flightStatusPanel.innerHTML = `<h3>${I18n.t('detail.flightStatus')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.elements.weatherPanel.innerHTML = `<h3>${I18n.t('detail.weather')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.elements.sunPanel.innerHTML = `<h3>${I18n.t('detail.sun')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.elements.hourlyPanel.innerHTML = `<h3>${I18n.t('detail.hourly')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
    }
  },
  async rerenderAll() {
    UI.applyI18n();
    UI.renderProfileSelect();
    UI.setClock();
    await UI.renderLocationList();
    if (document.getElementById('viewDetail').classList.contains('active')) {
      await this.renderCurrentDetail();
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
