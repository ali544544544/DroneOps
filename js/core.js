export const Keys = {
  locations: 'drone_locations',
  profiles: 'drone_profiles',
  checklist: 'drone_checklist',
  droneChecklist: 'drone_checklist_state',
  weatherCache: 'drone_weather_cache',
  sunCache: 'drone_sun_cache',
  brightSkyCache: 'drone_brightsky_cache',
  homeBase: 'drone_home_base',
  language: 'drone_language',
  activeProfile: 'drone_active_profile',
  activeTab: 'drone_active_tab',
  dashboardSource: 'drone_dashboard_source'
};

export const FALLBACK_PROFILES = [
  { id: 'p1', label: 'Nazgul5 (5")', style: 'freestyle', weight: 650, size: 5, maxWind: 45, critWind: 60, maxGusts: 55, critGusts: 70, color: '#40a0ff', rainTolerance: 'low' },
  { id: 'p2', label: 'Mini 3 Pro', style: 'sub250', weight: 249, size: 3, maxWind: 30, critWind: 45, maxGusts: 40, critGusts: 55, color: '#37e781', rainTolerance: 'none' }
];

export const FALLBACK_WEATHERCODES = {
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
  "80": { icon: "🌦️", de: "Regenschauer", en: "Rain showers" },
  "81": { icon: "🌦️", de: "Regenschauer", en: "Rain showers" },
  "82": { icon: "🌦️", de: "Regenschauer", en: "Rain showers" },
  "85": { icon: "🌨️", de: "Schneeschauer", en: "Snow showers" },
  "86": { icon: "🌨️", de: "Schneeschauer", en: "Snow showers" },
  "95": { icon: "⛈️", de: "Gewitter", en: "Thunderstorm" },
  "96": { icon: "⛈️", de: "Gewitter", en: "Thunderstorm" },
  "99": { icon: "⛈️", de: "Gewitter", en: "Thunderstorm" },
  "default": { icon: "❓", de: "Unbekannt", en: "Unknown" }
};

export const FALLBACK_TRANSLATIONS = {
  de: {
    'tab.dashboard': 'Dashboard',
    'tab.locations': 'Locations',
    'tab.drones': 'Drohnen',
    'tab.checklist': 'Checkliste',
    // ... many more
  },
  en: {
    'tab.dashboard': 'Dashboard',
    'tab.locations': 'Locations',
    'tab.drones': 'Drones',
    'tab.checklist': 'Checklist',
    // ... many more
  }
};

export const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      let parsed = JSON.parse(raw);
      if (fallback !== null && typeof fallback === 'object' && typeof parsed === 'string') {
        try {
          const secondParse = JSON.parse(parsed);
          if (typeof secondParse === 'object') parsed = secondParse;
        } catch (e) {}
      }
      return parsed;
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (typeof CloudManager !== 'undefined' && CloudManager.push) {
        CloudManager.push(key, value);
      }
    } catch (e) { console.error('Storage Set Error:', e); }
  }
};
