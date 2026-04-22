
const DATA_FILES = {
  profiles: './data/profiles.json',
  translations: './data/translations.json',
  weathercodes: './data/weathercodes.json',
};

// --- Cloud Config (DISABLED FOR DEBUG) ---
const SUPABASE_URL = 'https://kzlcswwwpdqrfmmqffpf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGNzd3d3cGRxcmZtbXFmZnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4Njc0NDIsImV4cCI6MjA5MjQ0MzQ0Mn0.vTOzS_eF3lJAf9G_8bcqoXkXdJf6NvRQ9YtuEoXrPGQ';
let supabaseClient = null;

const CloudManager = {
  user: null,
  async init() {
    try {
      if (typeof window.supabase === 'undefined') return;
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data } = await supabaseClient.auth.getUser();
      this.user = data?.user;
      if (this.user) await this.pullAll();
      this.updateUI();
    } catch (e) { console.warn('CloudManager disabled:', e); }
  },
  async signup(email, password) {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    UI.toast(I18n.t('toast.verifyEmail'));
    return data;
  },
  async login(email, password) {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;
    await this.pullAll();
    this.updateUI();
    UI.toast(I18n.t('toast.loggedIn'));
    location.reload();
  },
  async logout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    this.user = null;
    this.updateUI();
    location.reload();
  },
  updateUI() {
    const authView = document.getElementById('authView');
    const userView = document.getElementById('userView');
    const userEmail = document.getElementById('userEmail');
    const accountBtn = document.getElementById('accountBtn');
    if (this.user) {
      authView?.classList.add('hidden');
      userView?.classList.remove('hidden');
      if (userEmail) userEmail.textContent = this.user.email;
      accountBtn?.classList.add('btn-active');
    } else {
      authView?.classList.remove('hidden');
      userView?.classList.add('hidden');
      accountBtn?.classList.remove('btn-active');
    }
  },
  async push(key, value) {
    if (!this.user || !supabaseClient) return;
    if (key === Keys.weatherCache || key === Keys.sunCache || key === Keys.activeTab) return;
    try {
      await supabaseClient.from('user_data').upsert({
        user_id: this.user.id,
        key: key,
        value: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, key' });
    } catch (e) { console.error('Cloud Push Error:', e); }
  },
  async delete(key) {
    if (!this.user || !supabaseClient) return;
    await supabaseClient.from('user_data').delete().match({ user_id: this.user.id, key: key });
  },
  async pullAll() {
    if (!this.user || !supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.from('user_data').select('key, value');
      if (!error && data) {
        data.forEach(item => localStorage.setItem(item.key, JSON.stringify(item.value)));
      }
    } catch (e) { console.error('Cloud Pull Error:', e); }
  }
};

class Storage {
  static get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (typeof CloudManager !== 'undefined') CloudManager.push(key, value);
    } catch {}
  }
  static remove(key) {
    try {
      localStorage.removeItem(key);
      if (typeof CloudManager !== 'undefined') CloudManager.delete(key);
    } catch {}
  }
}

const Keys = {
  locations: 'drone_locations',
  activeLocation: 'drone_active_location',
  activeProfile: 'drone_active_profile',
  language: 'drone_language',
  activeTab: 'drone_active_tab',
  dashboardSource: 'drone_dashboard_source',
  weatherCache: 'drone_weather_cache',
  sunCache: 'drone_sun_cache',
  checklist: 'drone_checklist',
  homeBase: 'drone_home_base',
  distSource: 'drone_dist_source',
  profiles: 'drone_profiles'
};

const FALLBACK_PROFILES = [
  { 
    id: 'default-drone', 
    label: 'Standard Drohne', 
    style: 'freestyle', 
    weight: 249, 
    size: 5, 
    color: '#f5bc2b',
    maxWind: 35, 
    critWind: 45, 
    maxGusts: 48, 
    critGusts: 60, 
    rainTolerance: 'none'
  }
];

const FALLBACK_TRANSLATIONS = {
  de: {
    'header.profile': 'Profil',
    'header.localTime': 'Lokale Zeit',
    'tab.dashboard': 'Dashboard',
    'tab.locations': 'Locations',
    'tab.drones': 'Drohnen',
    'tab.checklist': 'Checkliste',
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Golden Hour und Flugbedingungen auf einen Blick',
    'dashboard.useGps': 'GPS-Position',
    'dashboard.selectLocation': 'Ort wählen',
    'dashboard.current': 'Aktueller Standort & Wetter',
    'dashboard.golden': 'Golden Hour heute',
    'dashboard.locationsOverview': 'Alle Locations: Übersicht',
    'dashboard.hourly': 'Stündliche Prognose (48h)',
    'dashboard.none': 'Bitte GPS wählen oder einen gespeicherten Ort auswählen.',
    'dashboard.refresh': 'Aktualisieren',
    'locations.title': 'Locations',
    'locations.subtitle': 'Flugspots verwalten, Wetter prüfen, Notizen und Logbuch pflegen',
    'locations.addLocation': 'Ort hinzufügen',
    'search.useGps': 'GPS',
    'search.help': 'Ort eintippen und Vorschlag auswählen.',
    'list.lastVisit': 'Letzter Besuch',
    'list.liveWeather': 'Aktuelles Wetter',
    'list.goldenHour': 'Golden Hour heute',
    'list.details': 'Details →',
    'nav.back': 'Zurück',
    'nav.route': 'Route planen',
    'nav.openMaps': 'In Google Maps öffnen',
    'status.fly': 'FLIEGEN',
    'status.caution': 'VORSICHT',
    'status.nogo': 'NO-GO',
    'statusText.fly': 'Perfekte Bedingungen für einen Flug.',
    'statusText.caution': 'Flug möglich, aber mit erhöhter Vorsicht.',
    'statusText.nogo': 'Aktuell keine guten Bedingungen für sicheren Flug.',
    'detail.flightStatus': 'Flugstatus',
    'detail.map': 'Karte & Navigation',
    'detail.weather': 'Wetterdaten',
    'detail.sun': 'Sonne & Golden Hour',
    'detail.hourly': 'Stündliche Prognose (48h)',
    'detail.notesLogbook': 'Notizen & Logbuch',
    'detail.notes': 'Notizen',
    'detail.notesPlaceholder': 'Spot-Besonderheiten, Parken, Regeln, Hindernisse …',
    'detail.addLog': 'Logbuch-Eintrag erstellen',
    'detail.logPlaceholder': 'Kurznotiz zum Flug',
    'detail.saveEntry': 'Eintrag speichern',
    'detail.noLogs': 'Noch kein Flug aufgezeichnet',
    'detail.saved': 'Gespeichert ✓',
    'detail.updated': 'Aktualisiert',
    'drones.scoreFly': '✅ Score ≥ 70: Fliegen',
    'drones.scoreCaution': '⚠️ Score 40–69: Vorsicht',
    'drones.scoreNogo': '🚫 Score < 40: No-Go',
    'drones.title': 'Drohnen & Setups',
    'drones.subtitle': 'Verwalte deine Flotte. Jedes Profil definiert individuelle Wind- und Wetterlimits.',
    'drones.add': 'Drohne hinzufügen',
    'drones.edit': '✎ Bearbeiten',
    'drones.delete': 'Löschen',
    'drones.name': 'Name der Drohne',
    'drones.style': 'Flugstil',
    'drones.weight': 'Gewicht (g)',
    'drones.size': 'Größe (Zoll)',
    'drones.style.freestyle': 'Freestyle',
    'drones.style.cinematic': 'Cinematic',
    'drones.style.longrange': 'Longrange',
    'drones.style.sub250': 'Sub250 / Mini',
    'drones.active': 'AKTIV ✓',
    'drones.activate': 'Aktivieren',
    'drones.maxWind': 'Max Wind (km/h)',
    'drones.critWind': 'Kritisch',
    'drones.maxGusts': 'Max Böen (km/h)',
    'drones.critGusts': 'Kritisch',
    'drones.rain': 'Regen-Toleranz',
    'drones.color': 'Drohnen-Farbe',
    'drones.always': 'Immer aktiv',
    'checklist.title': 'Packliste',
    'checklist.subtitle': 'Vor dem Flug alles dabeihaben',
    'checklist.reset': 'Alle zurücksetzen',
    'checklist.add': '+ Element hinzufügen',
    'checklist.itemName': 'Name',
    'checklist.itemCount': 'Anzahl',
    'checklist.category': 'Kategorie',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'weather.temp': 'Temperatur',
    'weather.feels': 'Gefühlt',
    'weather.wind': 'Wind',
    'weather.direction': 'Richtung',
    'weather.gusts': 'Böen',
    'weather.humidity': 'Luftfeuchtigkeit',
    'weather.rain': 'Regen',
    'weather.clouds': 'Bewölkung',
    'weather.visibility': 'Sichtweite',
    'weather.pressure': 'Luftdruck',
    'sun.dawn': 'Dämmerung Beginn',
    'sun.sunrise': 'Sonnenaufgang',
    'sun.sunset': 'Sonnenuntergang',
    'sun.dusk': 'Dämmerung Ende',
    'sun.dayLength': 'Tageslänge',
    'sun.morning': 'Morgen Golden Hour',
    'sun.evening': 'Abend Golden Hour',
    'sun.active': '✨ GOLDEN HOUR AKTIV',
    'sun.next': 'Nächste Golden Hour',
    'sun.countdown': 'Countdown',
    'factor.windOk': 'Wind im grünen Bereich',
    'factor.windWarn': 'Wind erhöht',
    'factor.windCritical': 'Wind kritisch',
    'factor.gustsOk': 'Böen stabil',
    'factor.gustsWarn': 'Böen erhöht',
    'factor.gustsCritical': 'Böen kritisch',
    'factor.rainWarn': 'Leichter Regen',
    'factor.rainCritical': 'Niederschlag kritisch',
    'factor.visibilityOk': 'Gute Sicht',
    'factor.visibilityWarn': 'Sicht eingeschränkt',
    'factor.visibilityCritical': 'Sicht kritisch',
    'factor.tempWarn': 'Temperatur grenzwertig',
    'factor.cloudsClear': 'Klarer Himmel',
    'factor.cloudsPartly': 'Teilbewölkt',
    'factor.cloudsHeavy': 'Stark bewölkt',
    'factor.cloudsOvercast': 'Bedeckt',
    'empty.title': 'Noch keine Orte gespeichert',
    'empty.text': 'Füge oben deinen ersten Spot hinzu.',
    'toast.locationExists': 'Ort ist bereits gespeichert.',
    'toast.offlineCache': 'Offline — zeige gecachte Daten.',
    'toast.notFound': 'Ort nicht gefunden.',
    'toast.notesSaved': 'Notizen gespeichert.',
    'toast.logSaved': 'Logbuch-Eintrag gespeichert.',
    'toast.checkSaved': 'Checkliste aktualisiert.',
    'toast.profileChanged': 'Aktives Profil geändert.',
    'error.searchFailed': 'Suche fehlgeschlagen.',
    'error.dataUnavailable': 'Daten nicht verfügbar.',
    'error.gpsUnavailable': 'GPS wird von diesem Gerät nicht unterstützt.',
    'error.gpsDenied': 'GPS-Zugriff verweigert.',
    'confirm.deleteLocation': 'Ort wirklich löschen?',
    'confirm.resetChecklist': 'Alle Elemente wirklich zurücksetzen?',
    'check.akkus': '🔋 Akkus',
    'check.zubehoer': '🎒 Zubehör',
    'check.dokumente': '📄 Dokumente',
    'check.werkzeug': '🛠️ Werkzeug',
    'check.elektronik': '📱 Elektronik',
    'check.sonstiges': '➕ Sonstiges',
    'rain.none': 'Keine Toleranz',
    'rain.low': 'Gering',
    'rain.medium': 'Mittel',
    'rain.waterproof': 'Wasserfest'
  },
  "en": {
    "header.profile": "Profile",
    "header.localTime": "Local time",
    "tab.dashboard": "Dashboard",
    "tab.locations": "Locations",
    "tab.drones": "Drones",
    "tab.checklist": "Checklist",
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Golden hour and flight conditions at a glance",
    "dashboard.useGps": "Use GPS Position",
    "dashboard.selectLocation": "Select Location",
    "dashboard.current": "Current Conditions",
    "dashboard.golden": "Golden Hour",
    "dashboard.locationsOverview": "Your Locations",
    "dashboard.hourly": "Hourly Forecast (48h)",
    "dashboard.none": "Please use GPS or select a saved location.",
    "dashboard.refresh": "Refresh",

    'locations.title': 'Locations',
    'locations.subtitle': 'Manage spots, inspect weather, keep notes and logbook',
    'locations.addLocation': 'Add location',
    'search.useGps': 'GPS',
    'search.help': 'Type a place and pick a suggestion.',
    'list.lastVisit': 'Last visit',
    'list.liveWeather': 'Live weather',
    'list.goldenHour': 'Golden hour today',
    'list.details': 'Details →',
    'nav.back': 'Back',
    'nav.route': 'Plan route',
    'nav.openMaps': 'Open in Google Maps',
    'status.fly': 'FLY',
    'status.caution': 'CAUTION',
    'status.nogo': 'NO-GO',
    'statusText.fly': 'Great conditions for flying.',
    'statusText.caution': 'Possible to fly, but use extra caution.',
    'statusText.nogo': 'Conditions are currently not suitable for safe flight.',
    'detail.flightStatus': 'Flight status',
    'detail.map': 'Map & navigation',
    'detail.weather': 'Weather data',
    'detail.sun': 'Sun & golden hour',
    'detail.hourly': 'Hourly forecast (48h)',
    'detail.notesLogbook': 'Notes & logbook',
    'detail.notes': 'Notes',
    'detail.notesPlaceholder': 'Spot notes, parking, rules, obstacles …',
    'detail.addLog': 'Create logbook entry',
    'detail.logPlaceholder': 'Short note about the flight',
    'detail.saveEntry': 'Save entry',
    'detail.noLogs': 'No flight logged yet',
    'detail.saved': 'Saved ✓',
    'detail.updated': 'Updated',
    'drones.scoreFly': '✅ Score ≥ 70: Fly',
    'drones.scoreCaution': '⚠️ Score 40–69: Caution',
    'drones.scoreNogo': '🚫 Score < 40: No-Go',
    'drones.title': 'Drones',
    'drones.subtitle': 'The active profile affects all flight ratings across the app',
    'drones.active': 'ACTIVE ✓',
    'drones.activate': 'Set as active profile',
    'drones.maxWind': 'Max wind',
    'drones.critWind': 'Critical',
    'drones.maxGusts': 'Max gusts',
    'drones.critGusts': 'Critical',
    'drones.rain': 'Rain',
    'drones.golden': 'Golden hour',
    'drones.always': 'Always active',
    'checklist.title': 'Pack list',
    'checklist.subtitle': 'Make sure everything is packed before flying',
    'checklist.reset': 'Reset all',
    'checklist.add': '+ Add item',
    'checklist.itemName': 'Name',
    'checklist.itemCount': 'Count',
    'checklist.category': 'Category',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'weather.temp': 'Temperature',
    'weather.feels': 'Feels like',
    'weather.wind': 'Wind',
    'weather.direction': 'Direction',
    'weather.gusts': 'Gusts',
    'weather.humidity': 'Humidity',
    'weather.rain': 'Rain',
    'weather.clouds': 'Cloud cover',
    'weather.visibility': 'Visibility',
    'weather.pressure': 'Pressure',
    'sun.dawn': 'Civil dawn',
    'sun.sunrise': 'Sunrise',
    'sun.sunset': 'Sunset',
    'sun.dusk': 'Civil dusk',
    'sun.dayLength': 'Day length',
    'sun.morning': 'Morning golden hour',
    'sun.evening': 'Evening golden hour',
    'sun.active': '✨ GOLDEN HOUR ACTIVE',
    'sun.next': 'Next golden hour',
    'sun.countdown': 'Countdown',
    'factor.windOk': 'Wind in range',
    'factor.windWarn': 'Elevated wind',
    'factor.windCritical': 'Critical wind',
    'factor.gustsOk': 'Stable gusts',
    'factor.gustsWarn': 'Elevated gusts',
    'factor.gustsCritical': 'Critical gusts',
    'factor.rainWarn': 'Light rain',
    'factor.rainCritical': 'Critical precipitation',
    'factor.visibilityOk': 'Good visibility',
    'factor.visibilityWarn': 'Reduced visibility',
    'factor.visibilityCritical': 'Critical visibility',
    'factor.tempWarn': 'Temperature near limit',
    'factor.cloudsClear': 'Clear sky',
    'factor.cloudsPartly': 'Partly cloudy',
    'factor.cloudsHeavy': 'Heavy clouds',
    'factor.cloudsOvercast': 'Overcast',
    'empty.title': 'No saved locations yet',
    'empty.text': 'Add your first spot above.',
    'toast.locationExists': 'Location is already saved.',
    'toast.offlineCache': 'Offline — showing cached data.',
    'toast.notFound': 'Location not found.',
    'toast.notesSaved': 'Notes saved.',
    'toast.logSaved': 'Logbook entry saved.',
    'toast.checkSaved': 'Checklist updated.',
    'toast.profileChanged': 'Active profile changed.',
    'error.searchFailed': 'Search failed.',
    'error.dataUnavailable': 'Data not available.',
    'error.gpsUnavailable': 'GPS is not supported on this device.',
    'error.gpsDenied': 'GPS access denied.',
    'confirm.deleteLocation': 'Delete this location?',
    'confirm.resetChecklist': 'Reset all checklist items?',
    'check.akkus': '🔋 Batteries',
    'check.zubehoer': '🎒 Accessories',
    'check.dokumente': '📄 Documents',
    'check.werkzeug': '🛠️ Tools',
    'check.elektronik': '📱 Electronics',
    'check.sonstiges': '➕ Misc',
    'rain.none': 'No tolerance',
    'rain.low': 'Low',
    'rain.medium': 'Medium',
    'rain.waterproof': 'Waterproof'
  }
};

const FALLBACK_WEATHERCODES = {
  "0": { icon: "☀️", de: "Klarer Himmel", en: "Clear sky" },
  "1": { icon: "🌤️", de: "Überwiegend klar", en: "Mainly clear" },
  "2": { icon: "⛅", de: "Teilweise bewölkt", en: "Partly cloudy" },
  "3": { icon: "☁️", de: "Bedeckt", en: "Overcast" },
  "45": { icon: "🌫️", de: "Nebel", en: "Fog" },
  "48": { icon: "🌫️", de: "Nebel", en: "Fog" },
  "51": { icon: "🌦️", de: "Nieselregen", en: "Drizzle" },
  "53": { icon: "🌦️", de: "Nieselregen", en: "Drizzle" },
  "55": { icon: "🌦️", de: "Nieselregen", en: "Drizzle" },
  "56": { icon: "🌦️", de: "Nieselregen", en: "Drizzle" },
  "57": { icon: "🌦️", de: "Nieselregen", en: "Drizzle" },
  "61": { icon: "🌧️", de: "Regen", en: "Rain" },
  "63": { icon: "🌧️", de: "Regen", en: "Rain" },
  "65": { icon: "🌧️", de: "Regen", en: "Rain" },
  "66": { icon: "🌧️", de: "Regen", en: "Rain" },
  "67": { icon: "🌧️", de: "Regen", en: "Rain" },
  "71": { icon: "❄️", de: "Schnee", en: "Snow" },
  "73": { icon: "❄️", de: "Schnee", en: "Snow" },
  "75": { icon: "❄️", de: "Schnee", en: "Snow" },
  "77": { icon: "❄️", de: "Schnee", en: "Snow" },
  "80": { icon: "🌧️", de: "Regenschauer", en: "Rain showers" },
  "81": { icon: "🌧️", de: "Regenschauer", en: "Rain showers" },
  "82": { icon: "🌧️", de: "Regenschauer", en: "Rain showers" },
  "85": { icon: "🌨️", de: "Schneeschauer", en: "Snow showers" },
  "86": { icon: "🌨️", de: "Schneeschauer", en: "Snow showers" },
  "95": { icon: "⛈️", de: "Gewitter", en: "Thunderstorm" },
  "96": { icon: "⛈️", de: "Gewitter + Hagel", en: "Thunderstorm + hail" },
  "99": { icon: "⛈️", de: "Gewitter + Hagel", en: "Thunderstorm + hail" },
  "default": { icon: "🌦️", de: "Unbekannt", en: "Unknown" }
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
  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },
  clamp(n, min, max) { return Math.max(min, Math.min(max, n)); },
  escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  },
  formatDate(dateStr, locale = 'de-DE') {
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  },
  formatTime(dateStr, locale = 'de-DE') {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  },
  formatDateTime(dateStr, locale = 'de-DE') {
    return new Date(dateStr).toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  windArrow(deg = 0) {
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    return arrows[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
  },
  countdown(from, to) {
    const diff = Math.max(0, new Date(to) - new Date(from));
    const min = Math.floor(diff / 60000);
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  },
  dayKey(date = new Date()) {
    return new Date(date).toISOString().slice(0, 10);
  },
  kmhToMs(kmh = 0) {
    return Math.round((kmh / 3.6) * 10) / 10;
  },
  recommendND(weatherCode, elevation) {
    if (elevation < 0) return 'None';
    if (elevation < 10) return 'ND4';
    
    const isBright = [0, 1].includes(Number(weatherCode));
    const isCloudy = [2, 3, 45, 48].includes(Number(weatherCode));
    
    if (elevation > 30) {
      if (isBright) return 'ND32';
      if (isCloudy) return 'ND16';
      return 'ND8';
    } else {
      if (isBright) return 'ND16';
      if (isCloudy) return 'ND8';
      return 'ND4';
    }
  },
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject('GPS unavailable');
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
  },
  async getTravelTime(lat1, lon1, lat2, lon2) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) return null;
      const duration = Math.round(data.routes[0].duration / 60);
      return duration;
    } catch (e) {
      console.error('OSRM Error:', e);
      return null;
    }
  }
};

const I18n = {
  translations: FALLBACK_TRANSLATIONS,
  lang: 'de',
  init(translations) {
    this.translations = translations || FALLBACK_TRANSLATIONS;
    this.lang = Storage.get(Keys.language, 'de');
  },
  setLanguage(lang) {
    this.lang = lang;
    Storage.set(Keys.language, lang);
  },
  t(key, fallback = null) {
    return this.translations?.[this.lang]?.[key] ?? fallback ?? key;
  },
  get locale() {
    return this.lang === 'de' ? 'de-DE' : 'en-US';
  }
};

const ProfileManager = {
  init() {
    const existing = Storage.get(Keys.profiles, []);
    if (!existing.length) {
      Storage.set(Keys.profiles, FALLBACK_PROFILES);
    }
    const profiles = this.getAll();
    const activeId = Storage.get(Keys.activeProfile, profiles[0]?.id);
    if (!this.getById(activeId)) {
      Storage.set(Keys.activeProfile, profiles[0]?.id);
    }
  },
  getAll() { return Storage.get(Keys.profiles, FALLBACK_PROFILES); },
  saveAll(profiles) { Storage.set(Keys.profiles, profiles); },
  getById(id) { return this.getAll().find(p => p.id === id); },
  getActive() { 
    const profiles = this.getAll();
    return this.getById(Storage.get(Keys.activeProfile, profiles[0]?.id)) || profiles[0]; 
  },
  setActive(id) { Storage.set(Keys.activeProfile, id); },
  add(profile) {
    const profiles = this.getAll();
    const next = { id: Util.uuid(), ...profile };
    profiles.push(next);
    this.saveAll(profiles);
    return next;
  },
  update(id, patch) {
    const profiles = this.getAll().map(p => p.id === id ? { ...p, ...patch } : p);
    this.saveAll(profiles);
  },
  remove(id) {
    const profiles = this.getAll().filter(p => p.id !== id);
    if (profiles.length === 0) return; // Prevent deleting last profile
    this.saveAll(profiles);
    if (Storage.get(Keys.activeProfile) === id) {
      this.setActive(profiles[0].id);
    }
  },
  label(id) {
    const p = this.getById(id);
    return p?.label || id;
  }
};

const ChecklistManager = {
  defaults() {
    return [
      { id: Util.uuid(), name: 'Drohnen-Akku', count: 2, category: 'akkus', checked: false },
      { id: Util.uuid(), name: 'Fernsteuer-Akku', count: 1, category: 'akkus', checked: false },
      { id: Util.uuid(), name: 'Ladegerät', count: 1, category: 'elektronik', checked: false },
      { id: Util.uuid(), name: 'SD-Karte', count: 2, category: 'zubehoer', checked: false },
      { id: Util.uuid(), name: 'Smartphone geladen', count: 1, category: 'elektronik', checked: false },
      { id: Util.uuid(), name: 'ND-Filter Set', count: 1, category: 'zubehoer', checked: false },
      { id: Util.uuid(), name: 'Ersatzpropeller', count: 4, category: 'zubehoer', checked: false },
      { id: Util.uuid(), name: 'Schraubendreher-Set', count: 1, category: 'werkzeug', checked: false },
      { id: Util.uuid(), name: 'Drohnen-Rucksack', count: 1, category: 'zubehoer', checked: false },
      { id: Util.uuid(), name: 'Haftpflicht-Nachweis', count: 1, category: 'dokumente', checked: false },
      { id: Util.uuid(), name: 'EU-Registrierung', count: 1, category: 'dokumente', checked: false },
      { id: Util.uuid(), name: 'EU-Führerschein (A1/A3)', count: 1, category: 'dokumente', checked: false },
    ];
  },
  categories() {
    return ['akkus', 'zubehoer', 'dokumente', 'werkzeug', 'elektronik', 'sonstiges'];
  },
  init() {
    const existing = Storage.get(Keys.checklist, null);
    if (!existing || !Array.isArray(existing) || !existing.length) {
      Storage.set(Keys.checklist, this.defaults());
    }
  },
  getAll() { return Storage.get(Keys.checklist, []); },
  saveAll(items) { Storage.set(Keys.checklist, items); },
  add(item) {
    const items = this.getAll();
    items.push({ id: Util.uuid(), checked: false, ...item });
    this.saveAll(items);
  },
  update(id, patch) {
    this.saveAll(this.getAll().map(item => item.id === id ? { ...item, ...patch } : item));
  },
  remove(id) {
    this.saveAll(this.getAll().filter(item => item.id !== id));
  },
  resetAll() {
    this.saveAll(this.getAll().map(item => ({ ...item, checked: false })));
  }
};

const LocationManager = {
  getAll() { return Storage.get(Keys.locations, []); },
  saveAll(locations) { Storage.set(Keys.locations, locations); },
  getById(id) { return this.getAll().find(l => l.id === id); },
  setActive(id) { Storage.set(Keys.activeLocation, id); },
  getActive() { return this.getById(Storage.get(Keys.activeLocation)); },
  add(location) {
    const items = this.getAll();
    const duplicate = items.some(item => Math.abs(item.lat - location.lat) < 0.0005 && Math.abs(item.lon - location.lon) < 0.0005);
    if (duplicate) {
      UI.toast(I18n.t('toast.locationExists'));
      return null;
    }
    const next = [{
      id: Util.uuid(),
      notes: '',
      logbook: [],
      createdAt: new Date().toISOString(),
      ...location
    }, ...items];
    this.saveAll(next);
    this.setActive(next[0].id);
    return next[0];
  },
  update(id, patch) {
    const next = this.getAll().map(item => item.id === id ? { ...item, ...patch } : item);
    this.saveAll(next);
    return this.getById(id);
  },
  remove(id) {
    const next = this.getAll().filter(item => item.id !== id);
    this.saveAll(next);
    if (Storage.get(Keys.activeLocation) === id) {
      Storage.set(Keys.activeLocation, next[0]?.id || null);
    }
  },
  addLog(locationId, entry) {
    const location = this.getById(locationId);
    if (!location) return;
    const logbook = [{ id: Util.uuid(), ...entry }, ...(location.logbook || [])];
    this.update(locationId, { logbook });
  },
  removeLog(locationId, entryId) {
    const location = this.getById(locationId);
    if (!location) return;
    const logbook = (location.logbook || []).filter(item => item.id !== entryId);
    this.update(locationId, { logbook });
  }
};

const Nominatim = {
  _lastAt: 0,
  async throttle() {
    const diff = Date.now() - this._lastAt;
    if (diff < 1000) await Util.wait(1000 - diff);
    this._lastAt = Date.now();
  },
  async search(query) {
    await this.throttle();
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('accept-language', 'de,en');
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    return res.json();
  },
  async reverse(lat, lon) {
    await this.throttle();
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('accept-language', 'de,en');
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Nominatim reverse ${res.status}`);
    return res.json();
  }
};

const WeatherService = {
  ttlMs: 10 * 60 * 1000,
  getCache() { return Storage.get(Keys.weatherCache, {}); },
  setCache(data) { Storage.set(Keys.weatherCache, data); },
  async get(location) {
    const cache = this.getCache();
    const cached = cache[location.id];
    if (cached && (Date.now() - cached.timestamp < this.ttlMs)) {
      return { ...cached, source: 'cache' };
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', location.lat);
    url.searchParams.set('longitude', location.lon);
    url.searchParams.set('hourly', [
      'temperature_2m',
      'apparent_temperature',
      'relativehumidity_2m',
      'precipitation',
      'weathercode',
      'cloudcover',
      'visibility',
      'windspeed_10m',
      'windspeed_80m',
      'windspeed_120m',
      'windgusts_10m',
      'surface_pressure',
      'winddirection_10m'
    ].join(','));
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '2');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Open-Meteo API Error: ${res.status}`);
      const data = await res.json();
      if (!data.hourly || !data.current_weather) throw new Error('Open-Meteo: Invalid data format');
      cache[location.id] = { data, timestamp: Date.now() };
      this.setCache(cache);
      return { data, timestamp: cache[location.id].timestamp, source: 'network' };
    } catch (error) {
      console.error('WeatherService Fetch Error:', error);
      if (cached) {
        UI.toast(I18n.t('toast.offlineCache'));
        return { ...cached, source: 'stale-cache', stale: true };
      }
      throw error;
    }
  }
};

const SunService = {
  ttlMs: 24 * 60 * 60 * 1000,
  getCache() { return Storage.get(Keys.sunCache, {}); },
  setCache(data) { Storage.set(Keys.sunCache, data); },
  async get(location, date = new Date()) {
    const cache = this.getCache();
    const cacheKey = `${location.id}_${Util.dayKey(date)}`;
    const cached = cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < this.ttlMs)) {
      return { ...cached, source: 'cache' };
    }

    const url = new URL('https://api.sunrise-sunset.org/json');
    url.searchParams.set('lat', location.lat);
    url.searchParams.set('lng', location.lon);
    url.searchParams.set('formatted', '0');
    url.searchParams.set('date', Util.dayKey(date));

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
  }
};

const ScoreEngine = {
  calculate({ wind = 0, gusts = 0, rain = 0, clouds = 0, visibility = 10000, temp = 20, profile }) {
    let score = 100;
    const factors = [];

    if (wind <= profile.maxWind) factors.push({ key: 'wind', label: I18n.t('factor.windOk'), severity: 'ok' });
    else if (wind <= profile.critWind) { score -= 25; factors.push({ key: 'wind', label: I18n.t('factor.windWarn'), severity: 'warn' }); }
    else { score -= 45; factors.push({ key: 'wind', label: I18n.t('factor.windCritical'), severity: 'critical' }); }

    if (gusts <= profile.maxGusts) factors.push({ key: 'gusts', label: I18n.t('factor.gustsOk'), severity: 'ok' });
    else if (gusts <= profile.critGusts) { score -= 15; factors.push({ key: 'gusts', label: I18n.t('factor.gustsWarn'), severity: 'warn' }); }
    else { score -= 25; factors.push({ key: 'gusts', label: I18n.t('factor.gustsCritical'), severity: 'critical' }); }

    if (profile.rainTolerance === 'none') {
      if (rain > 0) { score -= 30; factors.push({ key: 'rain', label: I18n.t('factor.rainCritical'), severity: 'critical' }); }
    } else if (profile.rainTolerance === 'low') {
      if (rain > 2) { score -= 30; factors.push({ key: 'rain', label: I18n.t('factor.rainCritical'), severity: 'critical' }); }
      else if (rain > 0.5) { score -= 20; factors.push({ key: 'rain', label: I18n.t('factor.rainWarn'), severity: 'warn' }); }
    } else if (profile.rainTolerance === 'medium') {
      if (rain > 5) { score -= 25; factors.push({ key: 'rain', label: I18n.t('factor.rainCritical'), severity: 'critical' }); }
      else if (rain > 2) { score -= 15; factors.push({ key: 'rain', label: I18n.t('factor.rainWarn'), severity: 'warn' }); }
    } else if (profile.rainTolerance === 'waterproof') {
      factors.push({ key: 'rain', label: I18n.t('factor.rainOk'), severity: 'ok' });
    }

    if (visibility >= 5000) factors.push({ key: 'visibility', label: I18n.t('factor.visibilityOk'), severity: 'ok' });
    else if (visibility >= 1500) { score -= 10; factors.push({ key: 'visibility', label: I18n.t('factor.visibilityWarn'), severity: 'warn' }); }
    else { score -= 20; factors.push({ key: 'visibility', label: I18n.t('factor.visibilityCritical'), severity: 'critical' }); }

    if (temp < -5 || temp > 38) {
      score -= 10;
      factors.push({ key: 'temp', label: I18n.t('factor.tempWarn'), severity: 'warn' });
    }

    if (clouds < 20) factors.push({ key: 'clouds', label: I18n.t('factor.cloudsClear'), severity: 'ok' });
    else if (clouds < 60) factors.push({ key: 'clouds', label: I18n.t('factor.cloudsPartly'), severity: 'ok' });
    else if (clouds < 90) factors.push({ key: 'clouds', label: I18n.t('factor.cloudsHeavy'), severity: 'warn' });
    else factors.push({ key: 'clouds', label: I18n.t('factor.cloudsOvercast'), severity: 'warn' });

    score = Util.clamp(score, 0, 100);
    const status = score >= 70 ? 'fly' : score >= 40 ? 'caution' : 'nogo';
    return { score, status, factors };
  }
};

const GoldenHour = {
  calculate({ sunrise, sunset, civilDawn, civilDusk }) {
    const sunriseDate = new Date(sunrise);
    const sunsetDate = new Date(sunset);
    const dawnDate = new Date(civilDawn);
    const duskDate = new Date(civilDusk);
    const morningStart = dawnDate;
    const morningEnd = new Date(sunriseDate.getTime() + 60 * 60 * 1000);
    const eveningStart = new Date(sunsetDate.getTime() - 60 * 60 * 1000);
    const eveningEnd = duskDate;
    const now = new Date();

    let whichPhase = null;
    if (now >= morningStart && now <= morningEnd) whichPhase = 'morning';
    if (now >= eveningStart && now <= eveningEnd) whichPhase = 'evening';

    let nextGolden = null;
    if (!whichPhase) {
      if (now < morningStart) nextGolden = morningStart;
      else if (now < eveningStart) nextGolden = eveningStart;
      else nextGolden = new Date(morningStart.getTime() + 24 * 60 * 60 * 1000);
    }

    return { morningStart, morningEnd, eveningStart, eveningEnd, isActiveNow: !!whichPhase, whichPhase, nextGolden };
  },
  isWithin(dateLike, gh) {
    const d = new Date(dateLike);
    return (d >= gh.morningStart && d <= gh.morningEnd) || (d >= gh.eveningStart && d <= gh.eveningEnd);
  }
};

const Router = {
  showPage(page) {
    document.querySelectorAll('.page').forEach(node => node.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === page));
    Storage.set(Keys.activeTab, page);
  }
};


const UI = {
  els: {},
  weathercodes: FALLBACK_WEATHERCODES,
  init(weathercodes) {
    this.weathercodes = weathercodes || FALLBACK_WEATHERCODES;
    this.els = {
      profileSelect: document.getElementById('profileSelect'),
      liveClock: document.getElementById('liveClock'),
      toastContainer: document.getElementById('toastContainer'),
      locationList: document.getElementById('locationList'),
      searchInput: document.getElementById('locationSearchInput'),
      searchSuggestions: document.getElementById('searchSuggestions'),
      detailTitle: document.getElementById('detailTitle'),
      detailFlightPanel: document.getElementById('detailFlightPanel'),
      detailMapPanel: document.getElementById('detailMapPanel'),
      detailWeatherPanel: document.getElementById('detailWeatherPanel'),
      detailSunPanel: document.getElementById('detailSunPanel'),
      detailHourlyPanel: document.getElementById('detailHourlyPanel'),
      detailNotesPanel: document.getElementById('detailNotesPanel'),
      dashboardCurrentPanel: document.getElementById('dashboardCurrentPanel'),
      dashboardGoldenPanel: document.getElementById('dashboardGoldenPanel'),
      dashboardLocationCardsPanel: document.getElementById('dashboardLocationCardsPanel'),
      dashboardHourlyPanel: document.getElementById('dashboardHourlyPanel'),
      dashboardDronePanel: document.getElementById('dashboardDronePanel'),
      dashboardChecklistPanel: document.getElementById('dashboardChecklistPanel'),
      dashboardLocationSelect: document.getElementById('dashboardLocationSelect'),
      dronesList: document.getElementById('dronesList'),
      droneForm: document.getElementById('droneForm'),
      droneName: document.getElementById('droneName'),
      droneStyle: document.getElementById('droneStyle'),
      droneWeight: document.getElementById('droneWeight'),
      droneSize: document.getElementById('droneSize'),
      droneMaxWind: document.getElementById('droneMaxWind'),
      droneMaxGusts: document.getElementById('droneMaxGusts'),
      droneColor: document.getElementById('droneColor'),
      droneRain: document.getElementById('droneRain'),
      droneCancelBtn: document.getElementById('droneCancelBtn'),
      droneAddBtn: document.getElementById('droneAddBtn'),
      checklistGroups: document.getElementById('checklistGroups'),
      checklistCategory: document.getElementById('checklistCategory'),
      checklistProgressText: document.getElementById('checklistProgressText'),
      checklistProgressBar: document.getElementById('checklistProgressBar'),
      dashboardHomeBtn: document.getElementById('dashboardHomeBtn'),
      dashboardHomeSearchWrap: document.getElementById('dashboardHomeSearchWrap'),
      dashboardHomeSearchInput: document.getElementById('dashboardHomeSearchInput'),
      dashboardHomeSuggestions: document.getElementById('dashboardHomeSuggestions'),
    };
  },
  applyI18n() {
    document.documentElement.lang = I18n.lang;
    document.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = I18n.t(node.dataset.i18n);
    });
    if (this.els.searchInput) this.els.searchInput.placeholder = I18n.lang === 'de' ? 'Hamburg, DE' : 'Hamburg, DE';
  },
  toast(message) {
    console.log('Toast:', message);
    const container = document.getElementById('toastContainer') || this.els.toastContainer;
    if (!container) {
      console.warn('Toast failed: no container');
      return;
    }
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    container.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  },
  setClock() {
    this.els.liveClock.textContent = new Date().toLocaleTimeString(I18n.locale);
  },
  weatherMeta(code) {
    return this.weathercodes[String(code)] || this.weathercodes.default;
  },
  renderProfileSelect() {
    const active = ProfileManager.getActive();
    this.els.profileSelect.innerHTML = ProfileManager.getAll().map(p => `
      <option value="${p.id}" ${p.id === active.id ? 'selected' : ''}>${Util.escapeHtml(p.label)}</option>
    `).join('');
  },
  renderDashboardLocationSelect() {
    const locations = LocationManager.getAll();
    const source = Storage.get(Keys.dashboardSource, '');
    this.els.dashboardLocationSelect.innerHTML = `
      <option value="">—</option>
      ${locations.map(l => `<option value="${l.id}" ${source === l.id ? 'selected' : ''}>${Util.escapeHtml(l.name)}</option>`).join('')}
    `;
  },
  lastVisit(location) {
    const entry = (location.logbook || [])[0];
    if (!entry) return '—';
    return `${Util.formatDate(entry.date, I18n.locale)} · ${ProfileManager.label(entry.drone)}`;
  },
  avgWindowScore(weatherData, gh, which = 'morning') {
    const profile = ProfileManager.getActive();
    const start = which === 'morning' ? gh.morningStart : gh.eveningStart;
    const end = which === 'morning' ? gh.morningEnd : gh.eveningEnd;
    let scores = [];
    weatherData.hourly.time.forEach((time, i) => {
      const d = new Date(time);
      if (d >= start && d <= end) {
        scores.push(ScoreEngine.calculate({
          wind: weatherData.hourly.windspeed_10m[i],
          gusts: weatherData.hourly.windgusts_10m[i],
          rain: weatherData.hourly.precipitation[i],
          clouds: weatherData.hourly.cloudcover[i],
          visibility: weatherData.hourly.visibility[i],
          temp: weatherData.hourly.temperature_2m[i],
          profile
        }).score);
      }
    });
    if (!scores.length) return { score: 0, status: 'nogo' };
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const status = score >= 70 ? 'fly' : score >= 40 ? 'caution' : 'nogo';
    return { score, status };
  },
  renderSunArc(sunData, gh) {
    const sunrise = new Date(sunData.results.sunrise);
    const sunset  = new Date(sunData.results.sunset);
    const dawn    = new Date(sunData.results.civil_twilight_begin);
    const dusk    = new Date(sunData.results.civil_twilight_end);
    const now     = new Date();

    const W = 460, H = 265; // Aggressively reduced height
    const padX = 45;
    const arcBaseY = 200; // Slightly raised horizon to save space below
    const arcRadius = (W - padX * 2) / 2;
    const arcCx     = W / 2;
    const total     = dusk - dawn;

    const arcPoint = (prog) => {
      const p  = Util.clamp(prog, 0, 1);
      const ax = padX + (W - padX * 2) * p;
      const dx = ax - arcCx;
      const ry = Math.sqrt(Math.max(arcRadius * arcRadius - dx * dx, 0));
      return { x: ax, y: arcBaseY - ry };
    };

    const prg = (d) => (new Date(d) - dawn) / total;
    const progNow    = prg(now);
    const progSR     = prg(sunrise);
    const progSS     = prg(sunset);
    const progMEnd   = prg(gh.morningEnd);
    const progEStart = prg(gh.eveningStart);

    const ptDawn   = arcPoint(0);
    const ptSR     = arcPoint(progSR);
    const ptSS     = arcPoint(progSS);
    const ptDusk   = arcPoint(1);
    const ptNow    = arcPoint(Util.clamp(progNow, 0, 1));
    const ptMEnd   = arcPoint(Util.clamp(progMEnd, 0, 1));
    const ptEStart = arcPoint(Util.clamp(progEStart, 0, 1));

    const sunVisible = progNow > 0 && progNow < 1;
    const sunRisen   = progNow >= progSR && progNow <= progSS;

    const arcSeg = (p1, p2) => {
      const cp1 = Math.max(0, Math.min(1, p1));
      const cp2 = Math.max(0, Math.min(1, p2));
      if (cp1 >= cp2) return '';
      const a = arcPoint(cp1);
      const b = arcPoint(cp2);
      return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${arcRadius} ${arcRadius} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    };

    const fmt = (d) => new Date(d).toLocaleTimeString(I18n.locale, { hour: '2-digit', minute: '2-digit' });
    const uid = `sa${Math.random().toString(36).slice(2, 7)}`;

    // Robust collision detection and staggering for labels
    const rawLabels = [
      { text: fmt(dawn),    x: ptDawn.x, fill: 'rgba(150,170,255,0.9)', dot: 'rgba(130,160,255,1)' },
      { text: fmt(sunrise), x: ptSR.x,   fill: 'rgba(100,230,180,1)',    dot: 'rgba(80,220,160,1)'  },
      { text: fmt(sunset),  x: ptSS.x,   fill: 'rgba(255,145,80,1)',     dot: 'rgba(255,120,60,1)'  },
      { text: fmt(dusk),    x: ptDusk.x, fill: 'rgba(150,170,255,0.9)', dot: 'rgba(130,160,255,1)' },
    ];

    const processedLabels = [];
    const minXDist = 52; // Minimum horizontal distance between labels
    const ySteps = [18, 36, 54]; // Possible Y offsets

    rawLabels.forEach((l, i) => {
      let level = 0;
      let collision = true;
      
      while (collision && level < ySteps.length) {
        collision = processedLabels.some(prev => 
          prev.level === level && Math.abs(prev.x - l.x) < minXDist
        );
        if (collision) level++;
      }

      // Edge anchoring logic
      let anchor = 'middle';
      if (i === 0) anchor = 'start';
      if (i === rawLabels.length - 1) anchor = 'end';

      processedLabels.push({ 
        ...l, 
        y: arcBaseY + ySteps[level], 
        level, 
        anchor 
      });
    });

    const ghMidX = ((ptDawn.x + ptMEnd.x) / 2).toFixed(1);
    const ghEMidX = ((ptEStart.x + ptDusk.x) / 2).toFixed(1);
    const ghY = (arcBaseY - 18).toFixed(1);

    const sunX = ptNow.x.toFixed(1), sunY = ptNow.y.toFixed(1);
    const sunR = sunRisen ? 10 : 7;
    const sunFill = sunRisen ? 'rgba(255,214,80,1)' : 'rgba(180,190,230,0.7)';
    const sunOp   = sunRisen ? '1' : '0.5';
    const nightX  = (progNow < 0 ? ptDawn.x : ptDusk.x).toFixed(1);

    const travelSeg  = arcSeg(0, Math.min(progNow, 1));
    const morningSeg = arcSeg(0, progMEnd);
    const eveningSeg = arcSeg(progEStart, 1);
    const dayLitSeg  = arcSeg(progSR, progSS);
    const mghW = Math.max(0, ptMEnd.x - ptDawn.x).toFixed(1);
    const eghW = Math.max(0, ptDusk.x - ptEStart.x).toFixed(1);
    const arcH = (arcBaseY - 10).toFixed(1);

    let svg = `<svg class="sun-arc" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-label="Sonnenstandskurve">
  <defs>
    <radialGradient id="${uid}sky" cx="50%" cy="100%" r="75%">
      <stop offset="0%"   stop-color="rgba(245,188,43,0.1)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <filter id="${uid}gh" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="3.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${uid}sun" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="7" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${uid}sky)"/>`;

    if (progMEnd > 0.01)
      svg += `\n  <rect x="${ptDawn.x.toFixed(1)}" y="10" width="${mghW}" height="${arcH}" fill="rgba(245,188,43,0.05)" rx="6"/>`;
    if (progEStart < 0.99)
      svg += `\n  <rect x="${ptEStart.x.toFixed(1)}" y="10" width="${eghW}" height="${arcH}" fill="rgba(255,100,40,0.05)" rx="6"/>`;

    svg += `
  <line x1="${(padX - 10)}" y1="${arcBaseY}" x2="${(W - padX + 10)}" y2="${arcBaseY}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
  <path d="M ${padX} ${arcBaseY} A ${arcRadius} ${arcRadius} 0 0 1 ${W - padX} ${arcBaseY}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round"/>`;

    if (dayLitSeg)
      svg += `\n  <path d="${dayLitSeg}" fill="none" stroke="rgba(255,230,140,0.18)" stroke-width="3" stroke-linecap="round"/>`;
    if (morningSeg)
      svg += `\n  <path d="${morningSeg}" fill="none" stroke="rgba(255,190,50,0.85)" stroke-width="6" stroke-linecap="round" filter="url(#${uid}gh)"/>`;
    if (eveningSeg)
      svg += `\n  <path d="${eveningSeg}" fill="none" stroke="rgba(255,110,40,0.85)" stroke-width="6" stroke-linecap="round" filter="url(#${uid}gh)"/>`;
    if (travelSeg && progNow > 0.01)
      svg += `\n  <path d="${travelSeg}" fill="none" stroke="rgba(255,220,100,0.4)" stroke-width="2.5" stroke-linecap="round"/>`;

    if (sunVisible)
      svg += `\n  <line x1="${sunX}" y1="${sunY}" x2="${sunX}" y2="${arcBaseY}" stroke="rgba(255,214,80,0.25)" stroke-width="1.5" stroke-dasharray="3 3"/>`;

    svg += '\n  ' + processedLabels.map(l => `<circle cx="${l.x.toFixed(1)}" cy="${arcBaseY}" r="4.5" fill="${l.dot}"/>`).join('\n  ');

    if (sunVisible)
      svg += `\n  <circle cx="${sunX}" cy="${sunY}" r="22" fill="rgba(255,200,50,0.1)" filter="url(#${uid}sun)"/>
  <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="${sunFill}" filter="url(#${uid}sun)"/>
  <circle cx="${sunX}" cy="${sunY}" r="5" fill="white" opacity="${sunOp}"/>`;
    else
      svg += `\n  <circle cx="${nightX}" cy="${arcBaseY}" r="10" fill="rgba(80,100,160,0.6)"/>
  <text x="${(W / 2).toFixed(1)}" y="${(arcBaseY - 20).toFixed(1)}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.35)" font-family="inherit">Sonne unter dem Horizont</text>`;

    svg += '\n  ' + processedLabels.map(l =>
      `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="${l.anchor}" font-size="9.5" fill="${l.fill}" font-family="inherit" font-weight="700">${l.text}</text>`
    ).join('\n  ');

    if (progMEnd > 0.02 && progMEnd < 0.98)
      svg += `\n  <text x="${ghMidX}" y="${ghY}" text-anchor="middle" font-size="9" fill="rgba(255,190,50,0.9)" font-family="inherit" font-weight="800">\uD83C\uDF05 GH</text>`;
    if (progEStart > 0.02 && progEStart < 0.98)
      svg += `\n  <text x="${ghEMidX}" y="${ghY}" text-anchor="middle" font-size="9" fill="rgba(255,110,40,0.9)" font-family="inherit" font-weight="800">\uD83C\uDF07 GH</text>`;

    svg += '\n</svg>';
    return svg;
  },
  renderHourly(target, weatherData, gh, location) {
    const profile = ProfileManager.getActive();
    const nowHour = new Date().getHours();
    const todayKey = Util.dayKey();
    const items = weatherData.hourly.time.slice(0, 48).map((time, i) => {
      const score = ScoreEngine.calculate({
        wind: weatherData.hourly.windspeed_10m[i],
        gusts: weatherData.hourly.windgusts_10m[i],
        rain: weatherData.hourly.precipitation[i],
        clouds: weatherData.hourly.cloudcover[i],
        visibility: weatherData.hourly.visibility[i],
        temp: weatherData.hourly.temperature_2m[i],
        profile
      });
      const hDate = new Date(time);
      const pos = App.getSolarPosition(hDate, location.lat, location.lon);
      const nd = Util.recommendND(weatherData.hourly.weathercode[i], pos.elevation);

      return {
        time,
        score,
        nd,
        meta: this.weatherMeta(weatherData.hourly.weathercode[i]),
        wind: Util.kmhToMs(weatherData.hourly.windspeed_10m[i]),
        rain: weatherData.hourly.precipitation[i],
        temp: weatherData.hourly.temperature_2m[i],
        isGolden: GoldenHour.isWithin(time, gh),
        isNow: new Date(time).getHours() === nowHour && Util.dayKey(time) === todayKey
      };
    });
    const best = Math.max(...items.map(x => x.score.score));

    target.innerHTML = `
      <div class="hourly-scroll">
        ${items.map(item => `
          <article class="hour-card ${item.score.score === best ? 'best' : ''} ${item.isGolden ? 'gh' : ''} ${item.isNow ? 'now' : ''} status-${item.score.status}">
            <span class="hour-day">${new Date(item.time).toLocaleDateString(I18n.locale, { weekday: 'short' })}</span>
            <strong class="hour-time">${Util.formatTime(item.time, I18n.locale)}</strong>
            <div class="hour-icon">${item.meta.icon}</div>
            <div class="hour-temp">${item.temp}°</div>
            <div class="badge ${item.score.status} badge-sm">${item.score.score}</div>
            <div class="hour-stats">
              <span>💨 ${item.wind} m/s</span>
              <span>🌧 ${item.rain} mm</span>
            </div>
            <div class="hour-nd" style="font-size:0.7rem;margin-top:4px;font-weight:800;color:var(--blue)">📷 ${item.nd}</div>
            ${item.isGolden ? '<div class="hour-golden">🌅</div>' : ''}
            ${item.isNow ? '<div class="hour-now-dot"></div>' : ''}
          </article>
        `).join('')}
      </div>
    `;
    
    // Center current hour
    setTimeout(() => {
      const nowCard = target.querySelector('.hour-card.now');
      if (nowCard) {
        nowCard.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      }
    }, 100);
  },
  renderDashboardNone() {
    this.els.dashboardCurrentPanel.innerHTML = `<h3>${I18n.t('dashboard.current')}</h3><p>${I18n.t('dashboard.none')}</p>`;
    this.els.dashboardGoldenPanel.innerHTML = `<h3>${I18n.t('dashboard.golden')}</h3><p>${I18n.t('dashboard.none')}</p>`;
    this.els.dashboardHourlyPanel.innerHTML = `<h3>${I18n.t('dashboard.hourly')}</h3><p>${I18n.t('dashboard.none')}</p>`;
  },
  renderChecklistFormOptions() {
    this.els.checklistCategory.innerHTML = ChecklistManager.categories()
      .map(c => `<option value="${c}">${I18n.t(`check.${c}`)}</option>`)
      .join('');
  },
  drawSunLine(map, center, azimuth, color, label, dash = null) {
    if (!map || !azimuth) return;
    const rad = (azimuth - 90) * (Math.PI / 180);
    const dist = 0.015; // ca 1.5km
    const lat2 = center[0] - dist * Math.sin(rad); 
    const lon2 = center[1] + dist * Math.cos(rad);
    L.polyline([[center[0], center[1]], [lat2, lon2]], {
      color,
      weight: 4,
      dashArray: dash,
      opacity: 0.8
    }).addTo(map).bindTooltip(label);
  }
};

const App = {
  editingChecklistId: null,

  async loadJson(path, fallback) {
    try {
      const res = await fetch(path);
      if (!res.ok) return fallback;
      return res.json();
    } catch {
      return fallback;
    }
  },
  getSolarPosition(date, lat, lon) {
    const deg2rad = Math.PI / 180;
    const rad2deg = 180 / Math.PI;
    
    // Julian Day
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const n = jd - 2451545.0;
    
    // Sun position
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    const lambda = (L + 1.915 * Math.sin(g * deg2rad) + 0.020 * Math.sin(2 * g * deg2rad)) * deg2rad;
    const epsilon = (23.439 - 0.0000004 * n) * deg2rad;
    
    const declination = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
    const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) * rad2deg;
    
    // Sidereal Time
    const ut = (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600);
    const gmst = (6.697374558 + 0.06570982441908 * n + ut) * 15;
    const lst = gmst + lon;
    
    // Hour Angle
    let ha = (lst - ra) % 360;
    if (ha < 0) ha += 360;
    const h = ha * deg2rad;
    
    // Altitude
    const phi = lat * deg2rad;
    const sinAlt = Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(h);
    const altitude = Math.asin(sinAlt);
    
    // Azimuth (from North clockwise)
    const azimuth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(declination) * Math.cos(phi)) * rad2deg + 180;
    
    return { 
      azimuth: azimuth % 360, 
      elevation: altitude * rad2deg 
    };
  },

  async init() {
    console.log('App: Starting initialization...');
    try {
      const [profiles, translations, weathercodes] = await Promise.all([
        this.loadJson(DATA_FILES.profiles, FALLBACK_PROFILES),
        this.loadJson(DATA_FILES.translations, FALLBACK_TRANSLATIONS),
        this.loadJson(DATA_FILES.weathercodes, FALLBACK_WEATHERCODES),
      ]);
      console.log('App: Data files loaded.');

      I18n.init(translations);
      ProfileManager.init(profiles);
      ChecklistManager.init();
      UI.init(weathercodes);
      UI.applyI18n();
      UI.renderProfileSelect();
      UI.renderDashboardLocationSelect();
      UI.setClock();
      console.log('App: Core managers initialized.');

      try {
        if (typeof CloudManager !== 'undefined' && CloudManager.init) {
          await CloudManager.init();
          console.log('App: CloudManager initialized.');
        }
      } catch (e) {
        console.error('App: CloudManager init failed:', e);
      }
      
      setInterval(() => UI.setClock(), 1000);
      setInterval(() => this.refreshVisibleData(), 10 * 60 * 1000);

      this.bindEvents();
      console.log('App: Events bound.');

      Router.showPage(Storage.get(Keys.activeTab, 'dashboard'));
      await this.renderAll();
      console.log('App: Initial render complete.');
    } catch (error) {
      console.error('App: Critical initialization error:', error);
      document.body.innerHTML = `<main style="padding:24px;color:white;font-family:sans-serif;background:#111;height:100vh"><h2>App konnte nicht initialisiert werden.</h2><p>${error.message || error}</p><button onclick="location.reload()">Neu laden</button></main>`;
    }
  },

  bindEvents() {
    document.getElementById('langDe').addEventListener('click', async () => {
      I18n.setLanguage('de');
      await this.renderAll();
    });
    document.getElementById('langEn').addEventListener('click', async () => {
      I18n.setLanguage('en');
      await this.renderAll();
    });

    UI.els.droneAddBtn.addEventListener('click', () => {
      this.editingDroneId = null;
      UI.els.droneForm.reset();
      UI.els.droneForm.classList.remove('hidden');
    });

    UI.els.droneCancelBtn.addEventListener('click', () => {
      UI.els.droneForm.classList.add('hidden');
    });

    UI.els.droneForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        label: UI.els.droneName.value.trim(),
        style: UI.els.droneStyle.value,
        weight: parseInt(UI.els.droneWeight.value),
        size: parseFloat(UI.els.droneSize.value),
        maxWind: parseInt(UI.els.droneMaxWind.value),
        critWind: Math.round(parseInt(UI.els.droneMaxWind.value) * 1.4),
        maxGusts: parseInt(UI.els.droneMaxGusts.value),
        critGusts: Math.round(parseInt(UI.els.droneMaxGusts.value) * 1.3),
        color: UI.els.droneColor.value,
        rainTolerance: UI.els.droneRain.value
      };

      if (this.editingDroneId) {
        ProfileManager.update(this.editingDroneId, data);
      } else {
        ProfileManager.add(data);
      }

      UI.els.droneForm.classList.add('hidden');
      await this.renderAll();
    });

    UI.els.droneSize.addEventListener('change', (e) => {
      const size = parseFloat(e.target.value);
      const presets = {
        1.6: { wind: 12, gusts: 16 },
        2: { wind: 15, gusts: 20 },
        2.5: { wind: 18, gusts: 24 },
        3: { wind: 22, gusts: 30 },
        3.5: { wind: 28, gusts: 36 },
        5: { wind: 35, gusts: 48 },
        7: { wind: 45, gusts: 60 },
        8: { wind: 50, gusts: 68 },
        10: { wind: 55, gusts: 75 }
      };
      if (presets[size]) {
        UI.els.droneMaxWind.value = presets[size].wind;
        UI.els.droneMaxGusts.value = presets[size].gusts;
      }
    });

    UI.els.profileSelect.addEventListener('change', async (e) => {
      ProfileManager.setActive(e.target.value);
      UI.toast(I18n.t('toast.profileChanged'));
      await this.renderAll();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        Router.showPage(btn.dataset.tab);
        await this.renderActivePage();
      });
    });

    UI.els.dashboardHomeSearchInput.addEventListener('input', (e) => doHomeBaseSearch(e.target.value));
    document.getElementById('gpsAddBtn').addEventListener('click', () => this.addLocationFromGps());
    UI.els.dashboardLocationSelect.addEventListener('change', async (e) => {
      Storage.set(Keys.dashboardSource, e.target.value || 'gps');
      await this.renderDashboard();
    });

    const doSearch = Util.debounce(async (value) => {
      if (!value || value.trim().length < 2) {
        UI.els.searchSuggestions.classList.add('hidden');
        UI.els.searchSuggestions.innerHTML = '';
        return;
      }
      try {
        const results = await Nominatim.search(value.trim());
        if (!results.length) {
          UI.toast(I18n.t('toast.notFound'));
          return;
        }
        UI.els.searchSuggestions.innerHTML = results.map(item => `
          <button class="suggestion-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${Util.escapeHtml(item.display_name)}">
            ${Util.escapeHtml(item.display_name)}
          </button>
        `).join('');
        UI.els.searchSuggestions.classList.remove('hidden');

        UI.els.searchSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
          btn.addEventListener('click', async () => {
            const location = LocationManager.add({
              name: btn.dataset.name,
              lat: Number(btn.dataset.lat),
              lon: Number(btn.dataset.lon),
            });
            UI.els.searchInput.value = '';
            UI.els.searchSuggestions.innerHTML = '';
            UI.els.searchSuggestions.classList.add('hidden');
            if (location) {
              UI.renderDashboardLocationSelect();
              await this.renderLocationsList();
              await this.renderDashboard();
            }
          });
        });
      } catch (error) {
        console.error(error);
        UI.toast(I18n.t('error.searchFailed'));
      }
    }, 500);

    UI.els.searchInput.addEventListener('input', (e) => doSearch(e.target.value));

    const doHomeBaseSearch = Util.debounce(async (value) => {
      if (!value || value.trim().length < 2) {
        UI.els.dashboardHomeSuggestions.classList.add('hidden');
        UI.els.dashboardHomeSuggestions.innerHTML = '';
        return;
      }
      try {
        const results = await Nominatim.search(value.trim());
        if (!results.length) return;
        
        UI.els.dashboardHomeSuggestions.innerHTML = results.map(item => `
          <button class="suggestion-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${Util.escapeHtml(item.display_name)}">
            ${Util.escapeHtml(item.display_name)}
          </button>
        `).join('');
        UI.els.dashboardHomeSuggestions.classList.remove('hidden');

        UI.els.dashboardHomeSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
          btn.addEventListener('click', async () => {
            const base = {
              name: btn.dataset.name,
              lat: Number(btn.dataset.lat),
              lon: Number(btn.dataset.lon),
            };
            Storage.set(Keys.homeBase, base);
            UI.els.dashboardHomeSearchInput.value = '';
            UI.els.dashboardHomeSearchWrap.classList.add('hidden');
            UI.toast(I18n.t('toast.startPointSaved'));
            await this.renderDashboard();
          });
        });
      } catch (error) {
        console.error(error);
      }
    }, 500);

    UI.els.dashboardHomeBtn.addEventListener('click', () => {
      const current = Storage.get(Keys.distSource, 'gps');
      const homeBase = Storage.get(Keys.homeBase);
      
      if (current === 'home') {
        UI.els.dashboardHomeSearchWrap.classList.toggle('hidden');
        if (!UI.els.dashboardHomeSearchWrap.classList.contains('hidden')) {
          UI.els.dashboardHomeSearchInput.focus();
        }
      } else {
        Storage.set(Keys.distSource, 'home');
        if (!homeBase) {
          UI.els.dashboardHomeSearchWrap.classList.remove('hidden');
          UI.els.dashboardHomeSearchInput.focus();
        }
        this.renderDashboard();
      }
    });

    document.getElementById('dashboardUseGpsBtn').addEventListener('click', () => {
      Storage.set(Keys.distSource, 'gps');
      this.setDashboardGps();
    });

    document.getElementById('detailBackBtn').addEventListener('click', async () => {
      document.getElementById('locationsDetailView').classList.add('hidden');
      document.getElementById('locationsListView').classList.remove('hidden');
      await this.renderLocationsList();
    });

    document.getElementById('checklistToggleAddBtn').addEventListener('click', () => {
      this.editingChecklistId = null;
      document.getElementById('checklistForm').classList.remove('hidden');
      document.getElementById('checklistName').value = '';
      document.getElementById('checklistCount').value = 1;
      document.getElementById('checklistCategory').value = 'akkus';
    });

    document.getElementById('checklistCancelBtn').addEventListener('click', () => {
      document.getElementById('checklistForm').classList.add('hidden');
      this.editingChecklistId = null;
    });

    document.getElementById('checklistForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const item = {
        name: document.getElementById('checklistName').value.trim(),
        count: Number(document.getElementById('checklistCount').value),
        category: document.getElementById('checklistCategory').value,
      };
      if (!item.name) return;
      if (this.editingChecklistId) ChecklistManager.update(this.editingChecklistId, item);
      else ChecklistManager.add(item);
      document.getElementById('checklistForm').classList.add('hidden');
      this.editingChecklistId = null;
      UI.toast(I18n.t('toast.checkSaved'));
      await this.renderChecklist();
    });

    document.getElementById('checklistResetBtn').addEventListener('click', async () => {
      if (confirm(I18n.t('confirm.resetChecklist'))) {
        ChecklistManager.resetAll();
        await this.renderChecklist();
      }
    });

    document.addEventListener('click', async (e) => {
      const detailBtn = e.target.closest('[data-action="detail"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');
      const miniCard = e.target.closest('[data-dashboard-location]');
      const checkDelete = e.target.closest('[data-check-delete]');
      const checkEdit = e.target.closest('[data-check-edit]');
      const logDelete = e.target.closest('[data-log-delete]');
      const mapsPin = e.target.closest('[data-open-pin]');
      const mapsRoute = e.target.closest('[data-open-route]');

      if (detailBtn) await this.openLocationDetail(detailBtn.dataset.id);
      if (deleteBtn) {
        if (confirm(I18n.t('confirm.deleteLocation'))) {
          LocationManager.remove(deleteBtn.dataset.id);
          UI.renderDashboardLocationSelect();
          await this.renderLocationsList();
          await this.renderDashboard();
        }
      }
      if (miniCard) {
        Router.showPage('locations');
        await this.openLocationDetail(miniCard.dataset.dashboardLocation);
      }
      if (checkDelete) {
        ChecklistManager.remove(checkDelete.dataset.checkDelete);
        await this.renderChecklist();
      }
      if (checkEdit) {
        const item = ChecklistManager.getAll().find(x => x.id === checkEdit.dataset.checkEdit);
        if (item) {
          this.editingChecklistId = item.id;
          document.getElementById('checklistForm').classList.remove('hidden');
          document.getElementById('checklistName').value = item.name;
          document.getElementById('checklistCount').value = item.count;
          document.getElementById('checklistCategory').value = item.category;
        }
      }
      if (logDelete) {
        const locationId = Storage.get(Keys.activeLocation);
        LocationManager.removeLog(locationId, logDelete.dataset.logDelete);
        await this.renderLocationDetail(locationId);
        await this.renderLocationsList();
      }
      if (mapsPin) window.open(mapsPin.dataset.openPin, '_blank');
      if (mapsRoute) window.open(mapsRoute.dataset.openRoute, '_blank');
    });

    document.addEventListener('change', async (e) => {
      const checkToggle = e.target.closest('[data-check-toggle]');
      if (checkToggle) {
        ChecklistManager.update(checkToggle.dataset.checkToggle, { checked: checkToggle.checked });
        await this.renderChecklist();
      }
    });

    // Account UI Events
    document.getElementById('accountBtn').addEventListener('click', () => {
      document.getElementById('accountPanel').classList.toggle('hidden');
    });

    document.getElementById('accountCloseBtn').addEventListener('click', () => {
      document.getElementById('accountPanel').classList.add('hidden');
    });

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const email = document.getElementById('authEmail').value;
      const pass = document.getElementById('authPassword').value;
      try { await CloudManager.login(email, pass); } catch (e) { alert(e.message); }
    });

    document.getElementById('signupBtn').addEventListener('click', async () => {
      const email = document.getElementById('authEmail').value;
      const pass = document.getElementById('authPassword').value;
      try { await CloudManager.signup(email, pass); } catch (e) { alert(e.message); }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await CloudManager.logout();
    });
  },

  async setDashboardGps() {
    if (!('geolocation' in navigator)) {
      UI.toast(I18n.t('error.gpsUnavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const gpsLocation = {
        id: 'gps',
        name: 'GPS',
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };
      Storage.set(Keys.dashboardSource, 'gps');
      Storage.set('drone_dashboard_gps_cache', gpsLocation);
      await this.renderDashboard();
    }, () => UI.toast(I18n.t('error.gpsDenied')));
  },

  async addLocationFromGps() {
    if (!('geolocation' in navigator)) {
      UI.toast(I18n.t('error.gpsUnavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const reverse = await Nominatim.reverse(latitude, longitude);
        const name = reverse.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        const location = LocationManager.add({ name, lat: latitude, lon: longitude });
        if (location) {
          UI.renderDashboardLocationSelect();
          await this.renderLocationsList();
          await this.renderDashboard();
        }
      } catch (error) {
        console.error(error);
        UI.toast(I18n.t('error.searchFailed'));
      }
    }, () => UI.toast(I18n.t('error.gpsDenied')));
  },

  async resolveDashboardLocation() {
    const source = Storage.get(Keys.dashboardSource, '');
    if (source === 'gps') {
      const gps = Storage.get('drone_dashboard_gps_cache', null);
      return gps;
    }
    if (source) return LocationManager.getById(source);
    const locations = LocationManager.getAll();
    return locations[0] || null;
  },

  currentIndex(weatherData) {
    const currentTime = weatherData.current_weather.time;
    const idx = weatherData.hourly.time.indexOf(currentTime);
    return idx >= 0 ? idx : 0;
  },

  scoreForCurrent(weatherData) {
    const idx = this.currentIndex(weatherData);
    const profile = ProfileManager.getActive();
    return ScoreEngine.calculate({
      wind: weatherData.current_weather.windspeed,
      gusts: weatherData.hourly.windgusts_10m[idx],
      rain: weatherData.hourly.precipitation[idx],
      clouds: weatherData.hourly.cloudcover[idx],
      visibility: weatherData.hourly.visibility[idx],
      temp: weatherData.current_weather.temperature,
      profile
    });
  },

  async renderDashboard() {
    UI.renderDashboardLocationSelect();
    const location = await this.resolveDashboardLocation();
    if (!location) {
      UI.renderDashboardNone();
      await this.renderDashboardLocationCards();
      return;
    }

    try {
      const drone = ProfileManager.getActive();
      const [weather, sun] = await Promise.all([WeatherService.get(location), SunService.get(location)]);
      
      const idx = this.currentIndex(weather.data);
      const score = this.scoreForCurrent(weather.data);
      const meta = UI.weatherMeta(weather.data.current_weather.weathercode);
      const gh = GoldenHour.calculate({
        sunrise: sun.data.results.sunrise,
        sunset: sun.data.results.sunset,
        civilDawn: sun.data.results.civil_twilight_begin,
        civilDusk: sun.data.results.civil_twilight_end
      });

      const dashWindMs = Util.kmhToMs(weather.data.current_weather.windspeed);
      const dashGustsMs = Util.kmhToMs(weather.data.hourly.windgusts_10m[idx]);
      const dashWindDir = Util.windArrow(weather.data.current_weather.winddirection);
      const posNow = this.getSolarPosition(new Date(), location.lat, location.lon);
      UI.els.dashboardCurrentPanel.innerHTML = `
        <div class="score-hero">
          <div>
            <h3>${I18n.t('dashboard.current')}</h3>
            <p><strong>${Util.escapeHtml(location.name)}</strong> <span class="muted">mit</span> <strong>${Util.escapeHtml(drone.label)}</strong></p>
            <p class="muted">📍 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}<span id="dashboardTravelTime"></span></p>
          </div>
          <button id="dashboardRefreshBtn" class="btn btn-secondary">${I18n.t('dashboard.refresh')}</button>
        </div>
        
        <div id="dashboardMap" class="dashboard-map"></div>

        <div class="weather-row" style="margin-top: 20px;">
          <span style="font-size:2rem">${meta.icon}</span>
          <div>
            <strong style="font-size:1.5rem">${weather.data.current_weather.temperature} °C</strong>
            <span class="muted" style="margin-left:8px">${meta[I18n.lang]}</span>
          </div>
          <div class="badge ${score.status}" style="margin-left:auto">${I18n.t(`status.${score.status}`)} · ${score.score}</div>
        </div>
        <div class="metric-grid">
          <div class="kpi"><span>${I18n.t('weather.wind')} 10m</span><strong>${dashWindMs} <small>m/s</small> ${dashWindDir}</strong></div>
          <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${dashGustsMs} <small>m/s</small></strong></div>
          <div class="kpi"><span>ND Filter</span><strong>${Util.recommendND(weather.data.current_weather.weathercode, posNow.elevation)}</strong></div>
        </div>
        <div class="wind-alt-bar">
          <span class="muted">Wind 80m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_80m[idx])} m/s</strong>
          <span class="muted">120m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_120m[idx])} m/s</strong>
        </div>
        <div class="tag-list" class="mt-12">
          ${score.factors.map(f => `<span class="tag ${f.severity}">${Util.escapeHtml(f.label)}</span>`).join('')}
        </div>
        <p class="muted" class="mt-12 muted">${I18n.t('detail.updated')}: ${Util.formatTime(new Date(), I18n.locale)}</p>
      `;

      if (this.dashboardMap) { this.dashboardMap.remove(); }
      this.dashboardMap = L.map('dashboardMap', { zoomControl: false, attributionControl: false }).setView([location.lat, location.lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.dashboardMap);
      
      const dashIcon = L.divIcon({
        html: `<div style="background:var(--blue);width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px var(--blue)"></div>`,
        className: '',
        iconSize: [12, 12]
      });
      L.marker([location.lat, location.lon], { icon: dashIcon }).addTo(this.dashboardMap);

      // Sun lines on dashboard map
      const posSR  = this.getSolarPosition(new Date(sun.data.results.sunrise), location.lat, location.lon);
      const posSS  = this.getSolarPosition(new Date(sun.data.results.sunset), location.lat, location.lon);
      
      UI.drawSunLine(this.dashboardMap, [location.lat, location.lon], posSR.azimuth, 'var(--yellow)', I18n.t('sun.sunrise'));
      UI.drawSunLine(this.dashboardMap, [location.lat, location.lon], posSS.azimuth, '#ff7a3d', I18n.t('sun.sunset'));
      if (posNow.elevation > 0) {
        UI.drawSunLine(this.dashboardMap, [location.lat, location.lon], posNow.azimuth, 'white', I18n.t('dashboard.current'), '2, 5');
      }

      // Async travel time
      if (location.id !== 'gps') {
        const homeBase = Storage.get(Keys.homeBase);
        const distSource = Storage.get(Keys.distSource, homeBase ? 'home' : 'gps');
        
        let getStart;
        if (distSource === 'home') {
          UI.els.dashboardHomeBtn.classList.add('btn-active');
          getStart = homeBase ? Promise.resolve({ ...homeBase, suffix: ' (Home)' }) : Promise.resolve(null);
        } else {
          UI.els.dashboardHomeBtn.classList.remove('btn-active');
          getStart = Util.getCurrentPosition()
            .then(pos => ({ lat: pos.coords.latitude, lon: pos.coords.longitude, suffix: '' }))
            .catch(() => homeBase ? { ...homeBase, suffix: ' (Home)' } : null);
        }

        getStart.then(async start => {
          if (!start) return;
          const time = await Util.getTravelTime(start.lat, start.lon, location.lat, location.lon);
          if (time) {
            const el = document.getElementById('dashboardTravelTime');
            if (el) {
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lon}&destination=${location.lat},${location.lon}&travelmode=driving`;
              el.innerHTML = ` · 🚗 ${time} Min.${start.suffix} <a href="${mapsUrl}" target="_blank" class="nav-link-small" title="Route in Google Maps öffnen">🗺️</a>`;
            }
          }
        }).catch(() => {});
      } else {
        UI.els.dashboardHomeBtn.classList.remove('btn-active');
      }

      document.getElementById('dashboardRefreshBtn').addEventListener('click', async () => {
        const cache = Storage.get(Keys.weatherCache, {});
        delete cache[location.id];
        Storage.set(Keys.weatherCache, cache);
        await this.renderDashboard();
      });

      const morning = UI.avgWindowScore(weather.data, gh, 'morning');
      const evening = UI.avgWindowScore(weather.data, gh, 'evening');
      const countdown = gh.isActiveNow
        ? Util.countdown(new Date(), gh.whichPhase === 'morning' ? gh.morningEnd : gh.eveningEnd)
        : (gh.nextGolden ? Util.countdown(new Date(), gh.nextGolden) : '—');

      const morningCountdown = gh.whichPhase === 'morning'
        ? Util.countdown(new Date(), gh.morningEnd)
        : (new Date() < gh.morningStart ? Util.countdown(new Date(), gh.morningStart) : '—');
      const eveningCountdown = gh.whichPhase === 'evening'
        ? Util.countdown(new Date(), gh.eveningEnd)
        : (new Date() < gh.eveningStart ? Util.countdown(new Date(), gh.eveningStart) : '—');

      UI.els.dashboardGoldenPanel.innerHTML = `
        <h3>${I18n.t('dashboard.golden')}</h3>
        ${gh.isActiveNow ? `<div class="golden-active-badge">${I18n.t('sun.active')}</div>` : ''}
        <div class="golden-window">
          <div class="golden-row">
            <div>
              <div class="golden-label">🌅 ${I18n.t('sun.morning')}</div>
              <div class="golden-time">${Util.formatTime(gh.morningStart, I18n.locale)} – ${Util.formatTime(gh.morningEnd, I18n.locale)}</div>
              <div class="muted" style="font-size:.82rem">${morningCountdown !== '—' ? '⏱ ' + morningCountdown : ''}</div>
            </div>
            <span class="badge ${morning.status}">${I18n.t(`status.${morning.status}`)} · ${morning.score}</span>
          </div>
          <div class="golden-row">
            <div>
              <div class="golden-label">🌇 ${I18n.t('sun.evening')}</div>
              <div class="golden-time">${Util.formatTime(gh.eveningStart, I18n.locale)} – ${Util.formatTime(gh.eveningEnd, I18n.locale)}</div>
              <div class="muted" style="font-size:.82rem">${eveningCountdown !== '—' ? '⏱ ' + eveningCountdown : ''}</div>
            </div>
            <span class="badge ${evening.status}">${I18n.t(`status.${evening.status}`)} · ${evening.score}</span>
          </div>
        </div>
        <div class="sun-arc-wrap">${UI.renderSunArc(sun.data, gh)}</div>
      `;

      UI.els.dashboardHourlyPanel.innerHTML = `<h3>${I18n.t('dashboard.hourly')}</h3><div id="dashboardHourlyInner" class=\"hourly-inner\"></div>`;
      UI.renderHourly(document.getElementById('dashboardHourlyInner'), weather.data, gh, location);
      
      this.renderDashboardDrone();
      this.renderDashboardChecklist();
      await this.renderDashboardLocationCards();
    } catch (error) {
      console.error('Dashboard Render Error:', error);
      UI.els.dashboardCurrentPanel.innerHTML = `<h3>${I18n.t('dashboard.current')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.dashboardGoldenPanel.innerHTML = `<h3>${I18n.t('dashboard.golden')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.dashboardHourlyPanel.innerHTML = `<h3>${I18n.t('dashboard.hourly')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      this.renderDashboardDrone();
      this.renderDashboardChecklist();
      await this.renderDashboardLocationCards();
    }
  },

  renderDashboardDrone() {
    const drone = ProfileManager.getActive();
    if (!drone) return;
    const allProfiles = ProfileManager.getAll();
    
    UI.els.dashboardDronePanel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0">Aktive Drohne</h3>
        <button class="btn btn-secondary btn-small" onclick="Router.showPage('drones')">✎</button>
      </div>
      <div class="drone-card active" style="--drone-accent: ${drone.color || 'var(--blue)'}; padding:16px; border-radius:16px; background:rgba(255,255,255,0.02)">
        <div class="drone-header-main">
          <span style="font-size:1.8rem">🚁</span>
          <div style="display:flex; flex-direction:column">
            <strong style="font-size:1.25rem; line-height:1.2">${Util.escapeHtml(drone.label)}</strong>
            <span class="muted" style="font-size:0.75rem">${I18n.t('drones.style.' + (drone.style || 'freestyle'))}</span>
          </div>
        </div>
        <div class="drone-stats" style="margin-top:12px; font-size:0.85rem">
          <div><span class="muted">${I18n.t('drones.maxWind')}</span><br><strong>${drone.maxWind} m/s</strong></div>
          <div><span class="muted">${I18n.t('drones.rain')}</span><br><strong>${I18n.t('rain.' + (drone.rainTolerance || 'none'))}</strong></div>
        </div>
        
        <div class="field mt-12">
          <select id="dashboardDroneSelect" style="width:100%">
            ${allProfiles.map(p => `<option value="${p.id}" ${p.id === drone.id ? 'selected' : ''}>${Util.escapeHtml(p.label)}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    document.getElementById('dashboardDroneSelect').addEventListener('change', async (e) => {
      ProfileManager.setActive(e.target.value);
      UI.renderProfileSelect(); // Global select sync
      await this.renderDashboard();
      UI.toast(I18n.t('toast.profileChanged'));
    });
  },

  renderDashboardChecklist() {
    const items = ChecklistManager.getAll();
    const checked = items.filter(x => x.checked).length;
    const total = items.length;
    const prog = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    UI.els.dashboardChecklistPanel.innerHTML = `
      <h3>${I18n.t('checklist.title')}</h3>
      <div style="margin-top:16px">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px">
          <span class="muted">${checked} / ${total}</span>
          <span style="font-weight:700">${prog}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${prog}%"></div>
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-top:16px;width:100%" onclick="Router.showPage('checklist')">${I18n.t('checklist.title')} 🎒</button>
      </div>
    `;
  },

  async renderDashboardLocationCards() {
    const locations = LocationManager.getAll();
    UI.els.dashboardLocationCardsPanel.innerHTML = `<h3>${I18n.t('dashboard.locationsOverview')}</h3>`;
    if (!locations.length) {
      UI.els.dashboardLocationCardsPanel.innerHTML += `<p>${I18n.t('empty.text')}</p>`;
      return;
    }

    const cards = await Promise.all(locations.map(async location => {
      try {
        const [weather, sun] = await Promise.all([WeatherService.get(location), SunService.get(location)]);
        const score = this.scoreForCurrent(weather.data);
        const meta = UI.weatherMeta(weather.data.current_weather.weathercode);
        const gh = GoldenHour.calculate({
          sunrise: sun.data.results.sunrise,
          sunset: sun.data.results.sunset,
          civilDawn: sun.data.results.civil_twilight_begin,
          civilDusk: sun.data.results.civil_twilight_end
        });

        return `
          <article class="dashboard-mini-card" data-dashboard-location="${location.id}">
            <strong>📍 ${Util.escapeHtml(location.name)}</strong>
            <div>${meta.icon} ${weather.data.current_weather.temperature}°C</div>
            <div>Score: ${score.score}</div>
            <div class="badge ${score.status}">${I18n.t(`status.${score.status}`)}</div>
            <div style="margin-top:8px">🌅 ${Util.formatTime(gh.morningStart, I18n.locale)}–${Util.formatTime(gh.morningEnd, I18n.locale)}</div>
            <div>🌇 ${Util.formatTime(gh.eveningStart, I18n.locale)}–${Util.formatTime(gh.eveningEnd, I18n.locale)}</div>
            <div class="mt-8 travel-time-mini" data-location-id="${location.id}"></div>
          </article>
        `;
      } catch (err) {
        console.error(`Dashboard Card Error for ${location.name}:`, err);
        return `
          <article class="dashboard-mini-card" data-dashboard-location="${location.id}">
            <strong>📍 ${Util.escapeHtml(location.name)}</strong>
            <p>${I18n.t('error.dataUnavailable')}</p>
          </article>
        `;
      }
    }));

    UI.els.dashboardLocationCardsPanel.innerHTML += `<div class="dashboard-mini-scroll">${cards.join('')}</div>`;

    // Populate travel times from home base
    const homeBase = Storage.get(Keys.homeBase);
    if (homeBase) {
      locations.forEach(async loc => {
        try {
          const time = await Util.getTravelTime(homeBase.lat, homeBase.lon, loc.lat, loc.lon);
          const el = UI.els.dashboardLocationCardsPanel.querySelector(`[data-location-id="${loc.id}"]`);
          if (el && time) {
            el.textContent = `🚗 ${time} Min.`;
          }
        } catch (e) {}
      });
    }
  },


  async renderLocationsList() {
    const locations = LocationManager.getAll();
    if (!locations.length) {
      UI.els.locationList.innerHTML = document.getElementById('emptyStateTemplate').innerHTML;
      UI.applyI18n();
      return;
    }

    UI.els.locationList.innerHTML = locations.map(location => `
      <article class="location-card">
        <div>
          <h3>${Util.escapeHtml(location.name)}</h3>
          <div class="location-meta">
            <span class="inline-pill">📍 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}</span>
            <span class="inline-pill">🗓️ ${Util.formatDate(location.createdAt, I18n.locale)}</span>
          </div>
          <p class="muted">${I18n.t('list.lastVisit')}: ${UI.lastVisit(location)}</p>
        </div>
        <div id="location-weather-${location.id}">
          <span class="metric-chip">…</span>
        </div>
        <div id="location-golden-${location.id}">
          <span class="metric-chip">…</span>
        </div>
        <div class="inline-actions">
          <button class="btn" data-action="detail" data-id="${location.id}">${I18n.t('list.details')}</button>
          <button class="btn btn-secondary" data-action="delete" data-id="${location.id}">✕</button>
        </div>
      </article>
    `).join('');

    await Promise.all(locations.map(async (location) => {
      try {
        const [weather, sun] = await Promise.all([WeatherService.get(location), SunService.get(location)]);
        const score = this.scoreForCurrent(weather.data);
        const meta = UI.weatherMeta(weather.data.current_weather.weathercode);
        const gh = GoldenHour.calculate({
          sunrise: sun.data.results.sunrise,
          sunset: sun.data.results.sunset,
          civilDawn: sun.data.results.civil_twilight_begin,
          civilDusk: sun.data.results.civil_twilight_end
        });

        document.getElementById(`location-weather-${location.id}`).innerHTML = `
          <strong>${I18n.t('list.liveWeather')}</strong>
          <div class="metric-grid">
            <span class="metric-chip">${meta.icon} ${weather.data.current_weather.temperature}°C</span>
            <span class="metric-chip">💨 ${weather.data.current_weather.windspeed} m/s</span>
            <span class="badge ${score.status}">${I18n.t(`status.${score.status}`)} · ${score.score}</span>
          </div>
        `;
        document.getElementById(`location-golden-${location.id}`).innerHTML = `
          <strong>${I18n.t('list.goldenHour')}</strong>
          <div class="metric-grid">
            <span class="metric-chip">🌅 ${Util.formatTime(gh.morningStart, I18n.locale)}–${Util.formatTime(gh.morningEnd, I18n.locale)}</span>
            <span class="metric-chip">🌇 ${Util.formatTime(gh.eveningStart, I18n.locale)}–${Util.formatTime(gh.eveningEnd, I18n.locale)}</span>
          </div>
        `;
      } catch (err) {
        console.error(`List Card Error for ${location.name}:`, err);
        document.getElementById(`location-weather-${location.id}`).innerHTML = `<p>${I18n.t('error.dataUnavailable')}</p>`;
        document.getElementById(`location-golden-${location.id}`).innerHTML = `<p>${I18n.t('error.dataUnavailable')}</p>`;
      }
    }));
  },

  async openLocationDetail(locationId) {
    LocationManager.setActive(locationId);
    document.getElementById('locationsListView').classList.add('hidden');
    document.getElementById('locationsDetailView').classList.remove('hidden');
    await this.renderLocationDetail(locationId);
  },

  async renderLocationDetail(locationId) {
    const location = LocationManager.getById(locationId);
    if (!location) return;
    UI.els.detailTitle.innerHTML = `
      <input type="text" id="locationNameInput" class="inline-edit-input" value="${Util.escapeHtml(location.name)}" placeholder="${I18n.t('locations.namePlaceholder')}" />
      <span id="locationNameSavedHint" class="saved-hint"></span>
    `;

    try {
      const [weather, sun] = await Promise.all([WeatherService.get(location), SunService.get(location)]);
      const idx = this.currentIndex(weather.data);
      const score = this.scoreForCurrent(weather.data);
      const meta = UI.weatherMeta(weather.data.current_weather.weathercode);
      const gh = GoldenHour.calculate({
        sunrise: sun.data.results.sunrise,
        sunset: sun.data.results.sunset,
        civilDawn: sun.data.results.civil_twilight_begin,
        civilDusk: sun.data.results.civil_twilight_end
      });

      document.getElementById('detailRouteBtnTop').onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`, '_blank');

      const windMs = Util.kmhToMs(weather.data.current_weather.windspeed);
      const gustsMs = Util.kmhToMs(weather.data.hourly.windgusts_10m[idx]);
      const windDir = Util.windArrow(weather.data.current_weather.winddirection);
      UI.els.detailFlightPanel.innerHTML = `
        <h3>${I18n.t('detail.flightStatus')}</h3>
        <div class="score-hero">
          <div>
            <div class="score-value">${score.score}</div>
            <p class="muted" style="margin-top:4px">${I18n.t(`statusText.${score.status}`)}</p>
          </div>
          <div class="badge ${score.status} badge-lg">${I18n.t(`status.${score.status}`)}</div>
        </div>
        <div class="quick-stats">
          <div class="kpi"><span>${I18n.t('weather.wind')}</span><strong>${windMs} <small>m/s</small> ${windDir}</strong></div>
          <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${gustsMs} <small>m/s</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.rain')}</span><strong>${weather.data.hourly.precipitation[idx]} <small>mm</small></strong></div>
        </div>
        <div class="tag-list" class="mt-14">
          ${score.factors.map(f => `<span class="tag ${f.severity}">${Util.escapeHtml(f.label)}</span>`).join('')}
        </div>
        <p class="muted" class="mt-12 muted">${I18n.t('detail.updated')}: ${Util.formatTime(new Date(), I18n.locale)}</p>
      `;

      const posNow = this.getSolarPosition(new Date(), location.lat, location.lon);
      const posSR  = this.getSolarPosition(new Date(sun.data.results.sunrise), location.lat, location.lon);
      const posSS  = this.getSolarPosition(new Date(sun.data.results.sunset), location.lat, location.lon);
      const posGHS = this.getSolarPosition(gh.morningStart, location.lat, location.lon);
      const posGHE = this.getSolarPosition(gh.eveningEnd, location.lat, location.lon);

      UI.els.detailMapPanel.innerHTML = `
        <h3>${I18n.t('detail.map')}</h3>
        <div id="detailMap" style="height: 300px; border-radius: 14px; margin-top: 12px; z-index: 1;"></div>
        <div class="info-list" class="mt-12">
          <span class="inline-pill">📍 ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}</span>
          <button class="btn btn-secondary" data-open-pin="https://www.google.com/maps?q=${location.lat},${location.lon}">${I18n.t('nav.openMaps')}</button>
          <button class="btn" data-open-route="https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}">${I18n.t('nav.route')}</button>
        </div>
      `;

      if (this.detailMap) { this.detailMap.remove(); }
      this.detailMap = L.map('detailMap', { zoomControl: false }).setView([location.lat, location.lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(this.detailMap);
      
      const icon = L.divIcon({
        html: '<div style="background:var(--blue);width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px var(--blue)"></div>',
        className: '',
        iconSize: [12, 12]
      });
      L.marker([location.lat, location.lon], { icon }).addTo(this.detailMap);

      const drawLine = (az, color, label, dash = null) => {
        const rad = (az - 90) * (Math.PI / 180);
        const dist = 0.015; // ca 1.5km
        const lat2 = location.lat - dist * Math.sin(rad); 
        const lon2 = location.lon + dist * Math.cos(rad);
        L.polyline([[location.lat, location.lon], [lat2, lon2]], {
          color,
          weight: 4,
          dashArray: dash,
          opacity: 0.8
        }).addTo(this.detailMap).bindTooltip(label);
      };

      drawLine(posSR.azimuth, '#f5bc2b', I18n.t('sun.sunrise'));
      drawLine(posSS.azimuth, '#ff7a3d', I18n.t('sun.sunset'));
      drawLine(posGHS.azimuth, '#ffcc33', I18n.t('sun.morning'), '5, 10');
      drawLine(posGHE.azimuth, '#ffcc33', I18n.t('sun.evening'), '5, 10');
      if (posNow.elevation > 0) drawLine(posNow.azimuth, 'white', I18n.t('dashboard.current'), '2, 5');

      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
          <div class="legend-item"><span class="legend-line" style="background:#f5bc2b"></span> ${I18n.t('sun.sunrise')}</div>
          <div class="legend-item"><span class="legend-line" style="background:#ff7a3d"></span> ${I18n.t('sun.sunset')}</div>
          <div class="legend-item"><span class="legend-line" style="background:#ffcc33;border-top:1px dashed #fff"></span> ${I18n.t('drones.golden')}</div>
          <div class="legend-item"><span class="legend-line" style="background:#fff;border-top:1px dashed #000"></span> ${I18n.t('dashboard.current')}</div>
        `;
        return div;
      };
      legend.addTo(this.detailMap);

      const detailWindMs = Util.kmhToMs(weather.data.current_weather.windspeed);
      const detailGustsMs = Util.kmhToMs(weather.data.hourly.windgusts_10m[idx]);
      const detailWindDir = Util.windArrow(weather.data.current_weather.winddirection);
      const visKm = (weather.data.hourly.visibility[idx] / 1000).toFixed(1);
      UI.els.detailWeatherPanel.innerHTML = `
        <h3>${I18n.t('detail.weather')}</h3>
        <div class="metric-grid">
          <div class="kpi"><span>${I18n.t('weather.temp')}</span><strong>${weather.data.current_weather.temperature} °C</strong></div>
          <div class="kpi"><span>${I18n.t('weather.feels')}</span><strong>${weather.data.hourly.apparent_temperature[idx]} °C</strong></div>
          <div class="kpi"><span>${I18n.t('weather.wind')} ${detailWindDir}</span><strong>${detailWindMs} <small>m/s</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${detailGustsMs} <small>m/s</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.humidity')}</span><strong>${weather.data.hourly.relativehumidity_2m[idx]}%</strong></div>
          <div class="kpi"><span>${I18n.t('weather.rain')}</span><strong>${weather.data.hourly.precipitation[idx]} <small>mm</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.clouds')}</span><strong>${weather.data.hourly.cloudcover[idx]}%</strong></div>
          <div class="kpi"><span>${I18n.t('weather.visibility')}</span><strong>${visKm} <small>km</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.pressure')}</span><strong>${weather.data.hourly.surface_pressure[idx]} <small>hPa</small></strong></div>
        </div>
        <div class="wind-alt-bar">
          <span class="muted">Wind 80m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_80m[idx])} m/s</strong>
          <span class="muted">120m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_120m[idx])} m/s</strong>
        </div>
        <p class="mt-12">${meta.icon} ${meta[I18n.lang]}</p>
      `;

      const nextCountdown = gh.isActiveNow
        ? Util.countdown(new Date(), gh.whichPhase === 'morning' ? gh.morningEnd : gh.eveningEnd)
        : (gh.nextGolden ? Util.countdown(new Date(), gh.nextGolden) : '—');

      const sunrise = new Date(sun.data.results.sunrise);
      const sunset = new Date(sun.data.results.sunset);
      const dayMinutes = Math.round((sunset - sunrise) / 60000);
      UI.els.detailSunPanel.innerHTML = `
        <h3>${I18n.t('detail.sun')}</h3>
        <div class="sun-times">
          <span class="inline-pill">🌄 ${I18n.t('sun.dawn')}: ${Util.formatTime(sun.data.results.civil_twilight_begin, I18n.locale)}</span>
          <span class="inline-pill">🌅 ${I18n.t('sun.sunrise')}: ${Util.formatTime(sun.data.results.sunrise, I18n.locale)}</span>
          <span class="inline-pill">🌇 ${I18n.t('sun.sunset')}: ${Util.formatTime(sun.data.results.sunset, I18n.locale)}</span>
          <span class="inline-pill">🌆 ${I18n.t('sun.dusk')}: ${Util.formatTime(sun.data.results.civil_twilight_end, I18n.locale)}</span>
        </div>
        <div class="sun-arc-wrap">${UI.renderSunArc(sun.data, gh)}</div>
        <div class="metric-grid">
          <span class="metric-chip">🌅 ${Util.formatTime(gh.morningStart, I18n.locale)} – ${Util.formatTime(gh.morningEnd, I18n.locale)}</span>
          <span class="metric-chip">🌇 ${Util.formatTime(gh.eveningStart, I18n.locale)} – ${Util.formatTime(gh.eveningEnd, I18n.locale)}</span>
          <span class="metric-chip">⏱️ ${I18n.t('sun.dayLength')}: ${Math.floor(dayMinutes / 60)}h ${dayMinutes % 60}min</span>
          <span class="metric-chip">${I18n.t('sun.next')}: ${nextCountdown}</span>
        </div>
        ${gh.isActiveNow ? `<p class="mt-12"><strong>${I18n.t('sun.active')}</strong></p>` : ''}
      `;

      UI.els.detailHourlyPanel.innerHTML = `<h3>${I18n.t('detail.hourly')}</h3><div id="detailHourlyInner" class=\"hourly-inner\"></div>`;
      UI.renderHourly(document.getElementById('detailHourlyInner'), weather.data, gh, location);

      this.renderNotesPanel(location);
    } catch (error) {
      console.error(error);
      UI.els.detailFlightPanel.innerHTML = `<h3>${I18n.t('detail.flightStatus')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailMapPanel.innerHTML = `<h3>${I18n.t('detail.map')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailWeatherPanel.innerHTML = `<h3>${I18n.t('detail.weather')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailSunPanel.innerHTML = `<h3>${I18n.t('detail.sun')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailHourlyPanel.innerHTML = `<h3>${I18n.t('detail.hourly')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      this.renderNotesPanel(location);
    }
  },

  renderNotesPanel(location) {
    UI.els.detailNotesPanel.innerHTML = `
      <h3>${I18n.t('detail.notesLogbook')}</h3>
      <div class="notes-grid">
        <div>
          <label class="field">
            <span>${I18n.t('detail.notes')}</span>
            <textarea id="notesArea" placeholder="${I18n.t('detail.notesPlaceholder')}">${Util.escapeHtml(location.notes || '')}</textarea>
          </label>
          <div id="notesSavedHint" class="muted"></div>
        </div>
        <div>
          <form id="logbookForm" class="field">
            <span>${I18n.t('detail.addLog')}</span>
            <div class="form-row">
              <input type="date" id="logDate" required value="${new Date().toISOString().slice(0, 10)}" />
              <select id="logDrone">
                ${ProfileManager.getAll().map(p => `<option value="${p.id}">${Util.escapeHtml(p.label)}</option>`).join('')}
              </select>
            </div>
            <input type="text" id="logNote" maxlength="200" placeholder="${I18n.t('detail.logPlaceholder')}" />
            <button class="btn" type="submit">${I18n.t('detail.saveEntry')}</button>
          </form>
          <div class="logbook-list" class="mt-14">
            ${(location.logbook || []).length
              ? location.logbook.map(entry => `
                <article class="log-entry">
                  <div>
                    <strong>${Util.formatDate(entry.date, I18n.locale)}</strong>
                    <div>${Util.escapeHtml(ProfileManager.label(entry.drone))}</div>
                    <small>${Util.escapeHtml(entry.note || '')}</small>
                  </div>
                  <button class="btn btn-secondary" data-log-delete="${entry.id}">🗑️</button>
                </article>
              `).join('')
              : `<p class="muted">${I18n.t('detail.noLogs')}</p>`
            }
          </div>
        </div>
      </div>
    `;

    const saveNotes = Util.debounce((e) => {
      LocationManager.update(location.id, { notes: e.target.value });
      const hint = document.getElementById('notesSavedHint');
      hint.textContent = I18n.t('detail.saved');
      setTimeout(() => { if (hint) hint.textContent = ''; }, 1500);
    }, 1000);

    document.getElementById('notesArea').addEventListener('input', saveNotes);
    
    const nameInput = document.getElementById('locationNameInput');
    const nameSavedHint = document.getElementById('locationNameSavedHint');
    const saveName = Util.debounce((e) => {
      const newName = e.target.value.trim() || 'Unbenannter Ort';
      LocationManager.update(location.id, { name: newName });
      nameSavedHint.textContent = I18n.t('detail.saved');
      setTimeout(() => { if (nameSavedHint) nameSavedHint.textContent = ''; }, 1500);
      UI.renderDashboardLocationSelect();
    }, 1000);
    nameInput.addEventListener('input', saveName);

    document.getElementById('logbookForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      LocationManager.addLog(location.id, {
        date: document.getElementById('logDate').value,
        drone: document.getElementById('logDrone').value,
        note: document.getElementById('logNote').value.trim()
      });
      UI.toast(I18n.t('toast.logSaved'));
      await this.renderLocationDetail(location.id);
      await this.renderLocationsList();
    });
  },

  async renderDrones() {
    const active = ProfileManager.getActive();
    UI.els.dronesList.innerHTML = ProfileManager.getAll().map(profile => {
      const droneColor = profile.color || '#f5bc2b';
      return `
        <article class="drone-card ${profile.id === active.id ? 'active' : ''}" style="--drone-accent: ${droneColor}">
          <div class="score-hero">
            <div class="drone-header-main">
              <h3>🚁 ${Util.escapeHtml(profile.label)}</h3>
              ${profile.id === active.id ? `<div class="badge fly">${I18n.t('drones.active')}</div>` : ''}
            </div>
            <div class="inline-actions">
              ${profile.id !== active.id ? `<button class="btn" data-set-profile="${profile.id}">${I18n.t('drones.activate')}</button>` : ''}
              <button class="btn btn-secondary" data-edit-drone="${profile.id}">${I18n.t('drones.edit')}</button>
              <button class="btn btn-secondary" data-delete-drone="${profile.id}">✕</button>
            </div>
          </div>
          <div class="drone-stats">
            <div class="kpi"><span>${I18n.t('drones.style')}</span><strong>${I18n.t(`drones.style.${profile.style}`)}</strong></div>
            <div class="kpi"><span>${I18n.t('drones.weight')}</span><strong>${profile.weight} <small>g</small></strong></div>
            <div class="kpi"><span>${I18n.t('drones.size')}</span><strong>${profile.size} <small>Zoll</small></strong></div>
            <div class="kpi"><span>${I18n.t('drones.maxWind')}</span><strong>${profile.maxWind} <small>km/h</small></strong></div>
            <div class="kpi"><span>${I18n.t('drones.maxGusts')}</span><strong>${profile.maxGusts} <small>km/h</small></strong></div>
            <div class="kpi"><span>${I18n.t('drones.rain')}</span><strong>${I18n.t(`rain.${profile.rainTolerance}`)}</strong></div>
          </div>
        </article>
      `;
    }).join('');

    UI.els.dronesList.querySelectorAll('[data-set-profile]').forEach(btn => {
      btn.addEventListener('click', async () => {
        ProfileManager.setActive(btn.dataset.setProfile);
        UI.renderProfileSelect();
        UI.toast(I18n.t('toast.profileChanged'));
        await this.renderAll();
      });
    });

    UI.els.dronesList.querySelectorAll('[data-edit-drone]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = ProfileManager.getById(btn.dataset.editDrone);
        if (!p) return;
        this.editingDroneId = p.id;
        UI.els.droneName.value = p.label;
        UI.els.droneStyle.value = p.style || 'freestyle';
        UI.els.droneWeight.value = p.weight || 249;
        UI.els.droneSize.value = p.size || 5;
        UI.els.droneMaxWind.value = p.maxWind;
        UI.els.droneMaxGusts.value = p.maxGusts;
        UI.els.droneColor.value = p.color || '#f5bc2b';
        UI.els.droneRain.value = p.rainTolerance || 'none';
        UI.els.droneForm.classList.remove('hidden');
        UI.els.droneForm.scrollIntoView({ behavior: 'smooth' });
      });
    });

    UI.els.dronesList.querySelectorAll('[data-delete-drone]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (ProfileManager.getAll().length <= 1) return;
        ProfileManager.remove(btn.dataset.deleteDrone);
        await this.renderAll();
      });
    });
  },

  async renderChecklist() {
    const items = ChecklistManager.getAll();
    const done = items.filter(i => i.checked).length;
    UI.els.checklistProgressText.textContent = `${done} / ${items.length}`;
    UI.els.checklistProgressBar.style.width = `${items.length ? Math.round((done / items.length) * 100) : 0}%`;

    UI.els.checklistGroups.innerHTML = ChecklistManager.categories().map(cat => {
      const groupItems = items.filter(i => i.category === cat);
      const finished = groupItems.filter(i => i.checked).length;
      return `
        <details class="checklist-group" open>
          <summary>${I18n.t(`check.${cat}`)} (${finished}/${groupItems.length})</summary>
          <div class="check-items">
            ${groupItems.map(item => `
              <label class="check-item">
                <input type="checkbox" data-check-toggle="${item.id}" ${item.checked ? 'checked' : ''} />
                <div class="check-item-main">
                  <strong>${Util.escapeHtml(item.name)}</strong>
                  <span class="muted">×${item.count}</span>
                </div>
                <div class="inline-actions">
                  <button class="btn btn-secondary btn-small" type="button" data-check-edit="${item.id}">✎</button>
                  <button class="btn btn-secondary btn-small" type="button" data-check-delete="${item.id}">🗑️</button>
                </div>
              </label>
            `).join('') || `<p class="muted">—</p>`}
          </div>
        </details>
      `;
    }).join('');
  },

  async renderActivePage() {
    const page = Storage.get(Keys.activeTab, 'dashboard');
    if (page === 'dashboard') await this.renderDashboard();
    if (page === 'locations') {
      await this.renderLocationsList();
      document.getElementById('locationsDetailView').classList.add('hidden');
      document.getElementById('locationsListView').classList.remove('hidden');
    }
    if (page === 'drones') await this.renderDrones();
    if (page === 'checklist') await this.renderChecklist();
  },

  async renderAll() {
    UI.applyI18n();
    UI.renderProfileSelect();
    UI.renderDashboardLocationSelect();
    UI.renderChecklistFormOptions();
    await this.renderDashboard();
    await this.renderLocationsList();
    await this.renderDrones();
    await this.renderChecklist();
    Router.showPage(Storage.get(Keys.activeTab, 'dashboard'));
  },

  async refreshVisibleData() {
    await this.renderActivePage();
  }
};

window.addEventListener('error', (e) => {
  if (typeof UI !== 'undefined' && UI.toast) {
    UI.toast(`Error: ${e.message}`);
  }
});
window.addEventListener('unhandledrejection', (e) => {
  if (typeof UI !== 'undefined' && UI.toast) {
    UI.toast(`Error: ${e.reason?.message || e.reason}`);
  }
});

document.addEventListener('DOMContentLoaded', () => App.init());
