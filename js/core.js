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
