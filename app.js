const DATA_FILES = {
  profiles: './data/profiles.json',
  translations: './data/translations.json',
  weathercodes: './data/weathercodes.json',
};

const FALLBACK_PROFILES = [
  { id: 'djimini', label: { de: 'DJI Mini (< 250g)', en: 'DJI Mini (< 250g)' }, maxWind: 8, critWind: 12, maxGusts: 10, critGusts: 14, rainTolerance: 'none', goldenHour: true },
  { id: 'djimavic', label: { de: 'DJI Mavic / Air', en: 'DJI Mavic / Air' }, maxWind: 10, critWind: 14, maxGusts: 13, critGusts: 17, rainTolerance: 'none', goldenHour: true },
  { id: 'tinywhoop', label: { de: 'Tinywhoop', en: 'Tinywhoop' }, maxWind: 5, critWind: 8, maxGusts: 7, critGusts: 10, rainTolerance: 'none', goldenHour: true },
  { id: 'fpv25', label: { de: 'FPV 2.5"', en: 'FPV 2.5"' }, maxWind: 8, critWind: 12, maxGusts: 11, critGusts: 15, rainTolerance: 'low', goldenHour: true },
  { id: 'fpv5', label: { de: 'FPV 5"', en: 'FPV 5"' }, maxWind: 14, critWind: 18, maxGusts: 18, critGusts: 22, rainTolerance: 'medium', goldenHour: true },
  { id: 'fpv7', label: { de: 'FPV 7"', en: 'FPV 7"' }, maxWind: 16, critWind: 20, maxGusts: 20, critGusts: 24, rainTolerance: 'medium', goldenHour: true },
  { id: 'fpv8', label: { de: 'FPV 8"', en: 'FPV 8"' }, maxWind: 18, critWind: 22, maxGusts: 22, critGusts: 26, rainTolerance: 'medium', goldenHour: true },
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
    'drones.title': 'Drohnen',
    'drones.subtitle': 'Das aktive Profil beeinflusst alle Flugbewertungen in der gesamten App',
    'drones.active': 'AKTIV ✓',
    'drones.activate': 'Als aktives Profil wählen',
    'drones.maxWind': 'Max Wind',
    'drones.critWind': 'Kritisch',
    'drones.maxGusts': 'Max Böen',
    'drones.critGusts': 'Kritisch',
    'drones.rain': 'Regen',
    'drones.golden': 'Golden Hour',
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
    'rain.medium': 'Mittel'
  },
  en: {
    'header.profile': 'Profile',
    'header.localTime': 'Local time',
    'tab.dashboard': 'Dashboard',
    'tab.locations': 'Locations',
    'tab.drones': 'Drones',
    'tab.checklist': 'Checklist',
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Golden hour and flight conditions at a glance',
    'dashboard.useGps': 'GPS position',
    'dashboard.selectLocation': 'Choose location',
    'dashboard.current': 'Current location & weather',
    'dashboard.golden': 'Golden hour today',
    'dashboard.locationsOverview': 'All locations overview',
    'dashboard.hourly': 'Hourly forecast (48h)',
    'dashboard.none': 'Please use GPS or choose a saved location.',
    'dashboard.refresh': 'Refresh',
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
    'rain.medium': 'Medium'
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
};

class Storage {
  static get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
  static remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

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
    return new Date(dateStr).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
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
  profiles: [],
  init(profiles) {
    this.profiles = profiles?.length ? profiles : FALLBACK_PROFILES;
    const current = Storage.get(Keys.activeProfile, this.profiles[0].id);
    if (!this.getById(current)) Storage.set(Keys.activeProfile, this.profiles[0].id);
  },
  getAll() { return this.profiles; },
  getById(id) { return this.profiles.find(p => p.id === id); },
  getActive() { return this.getById(Storage.get(Keys.activeProfile, this.profiles[0]?.id)) || this.profiles[0]; },
  setActive(id) { Storage.set(Keys.activeProfile, id); },
  label(id) {
    const p = this.getById(id);
    return p?.label?.[I18n.lang] || p?.label?.de || id;
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
      'windgusts_10m',
      'surface_pressure',
      'winddirection_10m'
    ].join(','));
    url.searchParams.set('current_weather', 'true');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '2');

    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
      const data = await res.json();
      cache[location.id] = { data, timestamp: Date.now() };
      this.setCache(cache);
      return { data, timestamp: cache[location.id].timestamp, source: 'network' };
    } catch (error) {
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
      if (!res.ok) throw new Error(`Sun API ${res.status}`);
      const data = await res.json();
      cache[cacheKey] = { data, timestamp: Date.now() };
      this.setCache(cache);
      return { data, timestamp: cache[cacheKey].timestamp, source: 'network' };
    } catch (error) {
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
      dashboardLocationSelect: document.getElementById('dashboardLocationSelect'),
      dronesList: document.getElementById('dronesList'),
      checklistGroups: document.getElementById('checklistGroups'),
      checklistCategory: document.getElementById('checklistCategory'),
      checklistProgressText: document.getElementById('checklistProgressText'),
      checklistProgressBar: document.getElementById('checklistProgressBar')
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
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    this.els.toastContainer.appendChild(node);
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
      <option value="${p.id}" ${p.id === active.id ? 'selected' : ''}>${p.label[I18n.lang] || p.label.de}</option>
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
    const sunset = new Date(sunData.results.sunset);
    const dawn = new Date(sunData.results.civil_twilight_begin);
    const dusk = new Date(sunData.results.civil_twilight_end);
    const now = new Date();
    const width = 340;
    const height = 160;
    const cx = width / 2;
    const cy = height - 20;
    const radius = (width - 40) / 2;

    const total = dusk - dawn;
    const progress = Util.clamp((now - dawn) / total, 0, 1);
    const x = 20 + (width - 40) * progress;
    const dx = x - cx;
    const y = cy - Math.sqrt(Math.max(radius * radius - dx * dx, 0));

    const dawnX = 20;
    const sunriseProgress = Util.clamp((sunrise - dawn) / total, 0, 1);
    const sunriseX = 20 + (width - 40) * sunriseProgress;
    const sunsetProgress = Util.clamp((sunset - dawn) / total, 0, 1);
    const sunsetX = 20 + (width - 40) * sunsetProgress;
    const duskX = width - 20;

    const morningStartX = dawnX;
    const morningEndProgress = Util.clamp((gh.morningEnd - dawn) / total, 0, 1);
    const morningEndX = 20 + (width - 40) * morningEndProgress;
    const eveningStartProgress = Util.clamp((gh.eveningStart - dawn) / total, 0, 1);
    const eveningStartX = 20 + (width - 40) * eveningStartProgress;
    const eveningEndX = duskX;

    return `
      <svg class="sun-arc" viewBox="0 0 ${width} ${height}" aria-label="Sun path">
        <path d="M 20 ${cy} A ${radius} ${radius} 0 0 1 ${width - 20} ${cy}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" />
        <rect x="${morningStartX}" y="${cy - 14}" width="${Math.max(0, morningEndX - morningStartX)}" height="14" rx="7" fill="rgba(255,214,125,0.35)"></rect>
        <rect x="${eveningStartX}" y="${cy - 14}" width="${Math.max(0, eveningEndX - eveningStartX)}" height="14" rx="7" fill="rgba(255,214,125,0.35)"></rect>
        <circle cx="${x}" cy="${y}" r="8" fill="rgba(255,214,125,0.98)"></circle>
        <circle cx="${dawnX}" cy="${cy}" r="4" fill="rgba(89,168,255,0.95)"></circle>
        <circle cx="${sunriseX}" cy="${cy}" r="4" fill="rgba(120,220,180,0.95)"></circle>
        <circle cx="${sunsetX}" cy="${cy}" r="4" fill="rgba(255,140,100,0.95)"></circle>
        <circle cx="${duskX}" cy="${cy}" r="4" fill="rgba(180,120,255,0.95)"></circle>
      </svg>
    `;
  },
  renderHourly(target, weatherData, gh) {
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
      return {
        time,
        score,
        meta: this.weatherMeta(weatherData.hourly.weathercode[i]),
        wind: weatherData.hourly.windspeed_10m[i],
        rain: weatherData.hourly.precipitation[i],
        isGolden: GoldenHour.isWithin(time, gh),
        isNow: new Date(time).getHours() === nowHour && Util.dayKey(time) === todayKey
      };
    });
    const best = Math.max(...items.map(x => x.score.score));

    target.innerHTML = `
      <div class="hourly-scroll">
        ${items.map(item => `
          <article class="hour-card ${item.score.score === best ? 'best' : ''} ${item.isGolden ? 'gh' : ''} ${item.isNow ? 'now' : ''}">
            <span>${new Date(item.time).toLocaleDateString(I18n.locale, { weekday: 'short' })}</span>
            <strong>${Util.formatTime(item.time, I18n.locale)}</strong>
            <div>${item.meta.icon} ${item.score.score}</div>
            <span>${I18n.t('weather.wind')}: ${item.wind} m/s</span>
            <span>${I18n.t('weather.rain')}: ${item.rain} mm</span>
            ${item.isGolden ? '<div>🌅 Golden Hour</div>' : ''}
          </article>
        `).join('')}
      </div>
    `;
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

  async init() {
    try {
      const [profiles, translations, weathercodes] = await Promise.all([
        this.loadJson(DATA_FILES.profiles, FALLBACK_PROFILES),
        this.loadJson(DATA_FILES.translations, FALLBACK_TRANSLATIONS),
        this.loadJson(DATA_FILES.weathercodes, FALLBACK_WEATHERCODES),
      ]);

      I18n.init(translations);
      ProfileManager.init(profiles);
      ChecklistManager.init();
      UI.init(weathercodes);
      UI.applyI18n();
      UI.renderProfileSelect();
      UI.renderDashboardLocationSelect();
      UI.renderChecklistFormOptions();
      UI.setClock();
      setInterval(() => UI.setClock(), 1000);
      setInterval(() => this.refreshVisibleData(), 10 * 60 * 1000);

      this.bindEvents();
      Router.showPage(Storage.get(Keys.activeTab, 'dashboard'));
      await this.renderAll();
    } catch (error) {
      console.error(error);
      document.body.innerHTML = `<main style="padding:24px;color:white;font-family:sans-serif"><h2>App konnte nicht initialisiert werden.</h2><pre>${String(error.message || error)}</pre></main>`;
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

    document.getElementById('dashboardUseGpsBtn').addEventListener('click', () => this.setDashboardGps());
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
    document.getElementById('gpsAddBtn').addEventListener('click', () => this.addLocationFromGps());

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

      UI.els.dashboardCurrentPanel.innerHTML = `
        <div class="score-hero">
          <div>
            <h3>${I18n.t('dashboard.current')}</h3>
            <p><strong>${Util.escapeHtml(location.name)}</strong></p>
            <p class="muted">📍 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}</p>
          </div>
          <button id="dashboardRefreshBtn" class="btn btn-secondary">${I18n.t('dashboard.refresh')}</button>
        </div>

        <div class="quick-stats">
          <div class="kpi"><span>${I18n.t('weather.temp')}</span><strong>${weather.data.current_weather.temperature} °C</strong></div>
          <div class="kpi"><span>${I18n.t('weather.feels')}</span><strong>${weather.data.hourly.apparent_temperature[idx]} °C</strong></div>
          <div class="kpi"><span>${I18n.t('weather.wind')}</span><strong>${weather.data.current_weather.windspeed} m/s</strong></div>
          <div class="kpi"><span>${I18n.t('weather.direction')}</span><strong>${Util.windArrow(weather.data.hourly.winddirection_10m[idx])} ${weather.data.hourly.winddirection_10m[idx]}°</strong></div>
          <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${weather.data.hourly.windgusts_10m[idx]} m/s</strong></div>
        </div>

        <p style="margin-top:12px">${meta.icon} ${meta[I18n.lang]}</p>
        <div class="badge ${score.status}">${I18n.t(`status.${score.status}`)} · ${score.score}</div>
        <div class="tag-list" style="margin-top:12px">
          ${score.factors.map(f => `<span class="tag ${f.severity}">${Util.escapeHtml(f.label)}</span>`).join('')}
        </div>
        <p class="muted" style="margin-top:12px">Stand: ${Util.formatTime(new Date(), I18n.locale)} Uhr</p>
      `;

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

      UI.els.dashboardGoldenPanel.innerHTML = `
        <h3>${I18n.t('dashboard.golden')}</h3>
        ${gh.isActiveNow ? `<p><strong>${I18n.t('sun.active')}</strong></p>` : ''}
        <div class="metric-grid">
          <span class="metric-chip">🌄 ${I18n.t('sun.morning')}: ${Util.formatTime(gh.morningStart, I18n.locale)} – ${Util.formatTime(gh.morningEnd, I18n.locale)}</span>
          <span class="badge ${morning.status}">${I18n.t(`status.${morning.status}`)} · ${morning.score}</span>
        </div>
        <div class="metric-grid" style="margin-top:10px">
          <span class="metric-chip">🌇 ${I18n.t('sun.evening')}: ${Util.formatTime(gh.eveningStart, I18n.locale)} – ${Util.formatTime(gh.eveningEnd, I18n.locale)}</span>
          <span class="badge ${evening.status}">${I18n.t(`status.${evening.status}`)} · ${evening.score}</span>
        </div>
        <p style="margin-top:12px">${I18n.t('sun.countdown')}: ${countdown}</p>
        <div class="sun-arc-wrap">${UI.renderSunArc(sun.data, gh)}</div>
      `;

      UI.els.dashboardHourlyPanel.innerHTML = `<h3>${I18n.t('dashboard.hourly')}</h3><div id="dashboardHourlyInner"></div>`;
      UI.renderHourly(document.getElementById('dashboardHourlyInner'), weather.data, gh);
    } catch (error) {
      console.error(error);
      UI.els.dashboardCurrentPanel.innerHTML = `<h3>${I18n.t('dashboard.current')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.dashboardGoldenPanel.innerHTML = `<h3>${I18n.t('dashboard.golden')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.dashboardHourlyPanel.innerHTML = `<h3>${I18n.t('dashboard.hourly')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
    }

    await this.renderDashboardLocationCards();
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
          </article>
        `;
      } catch {
        return `
          <article class="dashboard-mini-card" data-dashboard-location="${location.id}">
            <strong>📍 ${Util.escapeHtml(location.name)}</strong>
            <p>${I18n.t('error.dataUnavailable')}</p>
          </article>
        `;
      }
    }));

    UI.els.dashboardLocationCardsPanel.innerHTML += `<div class="dashboard-mini-scroll">${cards.join('')}</div>`;
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
          <p class="muted">${I18n.t('list.lastVisit')}: ${this.lastVisit(location)}</p>
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
      } catch {
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
    UI.els.detailTitle.textContent = location.name;

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

      UI.els.detailFlightPanel.innerHTML = `
        <h3>${I18n.t('detail.flightStatus')}</h3>
        <div class="score-hero">
          <div>
            <div class="score-value">${score.score}</div>
            <div class="badge ${score.status}">${I18n.t(`status.${score.status}`)}</div>
            <p class="muted" style="margin-top:10px">${I18n.t(`statusText.${score.status}`)}</p>
          </div>
          <div>
            <div class="inline-pill">🚁 ${ProfileManager.label(ProfileManager.getActive().id)}</div>
            <div class="inline-pill">${meta.icon} ${meta[I18n.lang]}</div>
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
      `;

      const bbox = `${location.lon - 0.05},${location.lat - 0.04},${location.lon + 0.05},${location.lat + 0.04}`;
      UI.els.detailMapPanel.innerHTML = `
        <h3>${I18n.t('detail.map')}</h3>
        <iframe class="map-embed" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat},${location.lon}" loading="lazy"></iframe>
        <div class="info-list" style="margin-top:12px">
          <span class="inline-pill">📍 ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}</span>
          <button class="btn btn-secondary" data-open-pin="https://www.google.com/maps?q=${location.lat},${location.lon}">${I18n.t('nav.openMaps')}</button>
          <button class="btn" data-open-route="https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}">${I18n.t('nav.route')}</button>
        </div>
      `;

      UI.els.detailWeatherPanel.innerHTML = `
        <h3>${I18n.t('detail.weather')}</h3>
        <div class="quick-stats">
          <div class="kpi"><span>${I18n.t('weather.temp')}</span><strong>${weather.data.current_weather.temperature} °C</strong></div>
          <div class="kpi"><span>${I18n.t('weather.feels')}</span><strong>${weather.data.hourly.apparent_temperature[idx]} °C</strong></div>
          <div class="kpi"><span>${I18n.t('weather.wind')}</span><strong>${weather.data.current_weather.windspeed} m/s</strong></div>
          <div class="kpi"><span>${I18n.t('weather.direction')}</span><strong>${Util.windArrow(weather.data.hourly.winddirection_10m[idx])} ${weather.data.hourly.winddirection_10m[idx]}°</strong></div>
          <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${weather.data.hourly.windgusts_10m[idx]} m/s</strong></div>
          <div class="kpi"><span>${I18n.t('weather.humidity')}</span><strong>${weather.data.hourly.relativehumidity_2m[idx]}%</strong></div>
          <div class="kpi"><span>${I18n.t('weather.rain')}</span><strong>${weather.data.hourly.precipitation[idx]} mm/h</strong></div>
          <div class="kpi"><span>${I18n.t('weather.clouds')}</span><strong>${weather.data.hourly.cloudcover[idx]}%</strong></div>
          <div class="kpi"><span>${I18n.t('weather.visibility')}</span><strong>${(weather.data.hourly.visibility[idx] / 1000).toFixed(1)} km</strong></div>
          <div class="kpi"><span>${I18n.t('weather.pressure')}</span><strong>${Math.round(weather.data.hourly.surface_pressure[idx])} hPa</strong></div>
        </div>
        <p style="margin-top:12px">${meta.icon} ${meta[I18n.lang]}</p>
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
        ${gh.isActiveNow ? `<p style="margin-top:12px"><strong>${I18n.t('sun.active')}</strong></p>` : ''}
      `;

      UI.els.detailHourlyPanel.innerHTML = `<h3>${I18n.t('detail.hourly')}</h3><div id="detailHourlyInner"></div>`;
      UI.renderHourly(document.getElementById('detailHourlyInner'), weather.data, gh);

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
                ${ProfileManager.getAll().map(p => `<option value="${p.id}">${p.label[I18n.lang] || p.label.de}</option>`).join('')}
              </select>
            </div>
            <input type="text" id="logNote" maxlength="200" placeholder="${I18n.t('detail.logPlaceholder')}" />
            <button class="btn" type="submit">${I18n.t('detail.saveEntry')}</button>
          </form>
          <div class="logbook-list" style="margin-top:14px">
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
    UI.els.dronesList.innerHTML = ProfileManager.getAll().map(profile => `
      <article class="drone-card ${profile.id === active.id ? 'active' : ''}">
        <div class="score-hero">
          <div>
            <h3>🚁 ${profile.label[I18n.lang] || profile.label.de}</h3>
            ${profile.id === active.id ? `<div class="badge fly">${I18n.t('drones.active')}</div>` : ''}
          </div>
          ${profile.id !== active.id ? `<button class="btn" data-set-profile="${profile.id}">${I18n.t('drones.activate')}</button>` : ''}
        </div>
        <div class="drone-stats">
          <div class="kpi"><span>${I18n.t('drones.maxWind')}</span><strong>${profile.maxWind} m/s</strong></div>
          <div class="kpi"><span>${I18n.t('drones.critWind')}</span><strong>${profile.critWind} m/s</strong></div>
          <div class="kpi"><span>${I18n.t('drones.maxGusts')}</span><strong>${profile.maxGusts} m/s</strong></div>
          <div class="kpi"><span>${I18n.t('drones.critGusts')}</span><strong>${profile.critGusts} m/s</strong></div>
          <div class="kpi"><span>${I18n.t('drones.rain')}</span><strong>${I18n.t(`rain.${profile.rainTolerance}`)}</strong></div>
          <div class="kpi"><span>${I18n.t('drones.golden')}</span><strong>✅ ${I18n.t('drones.always')}</strong></div>
        </div>
      </article>
    `).join('');

    UI.els.dronesList.querySelectorAll('[data-set-profile]').forEach(btn => {
      btn.addEventListener('click', async () => {
        ProfileManager.setActive(btn.dataset.setProfile);
        UI.renderProfileSelect();
        UI.toast(I18n.t('toast.profileChanged'));
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
              <article class="check-item">
                <input type="checkbox" data-check-toggle="${item.id}" ${item.checked ? 'checked' : ''} />
                <div class="check-item-main">
                  <strong>${Util.escapeHtml(item.name)}</strong>
                  <span class="muted">×${item.count}</span>
                </div>
                <div class="inline-actions">
                  <button class="btn btn-secondary" data-check-edit="${item.id}">✎</button>
                  <button class="btn btn-secondary" data-check-delete="${item.id}">🗑️</button>
                </div>
              </article>
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
  },

  async lastVisit(location) {
    return UI.lastVisit(location);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
