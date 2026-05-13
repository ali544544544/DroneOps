import { Keys, Storage, FALLBACK_PROFILES } from './core.js';
import { Util } from './util.js';
import { I18n } from './i18n.js';
import { Toast } from './ui.js'; // Might need UI or Toast for duplicate location warning

export const ProfileManager = {
  init(loadedProfiles = []) {
    const existing = Storage.get(Keys.profiles, null);
    if (!existing || !existing.length) {
      const initial = (loadedProfiles && loadedProfiles.length) ? loadedProfiles : FALLBACK_PROFILES;
      Storage.set(Keys.profiles, initial);
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
  getLabel(p) {
    if (!p) return '—';
    if (typeof p.label === 'object') {
      return p.label[I18n.lang] || p.label['de'] || p.id;
    }
    return p.label || p.id;
  },
  label(id) {
    return this.getLabel(this.getById(id));
  }
};

export const ChecklistManager = {
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
    if (existing === null) {
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

export const LocationManager = {
  init(loadedLocations = []) {
    const existing = Storage.get(Keys.locations, null);
    if (!existing || !existing.length) {
      if (loadedLocations && loadedLocations.length) {
        Storage.set(Keys.locations, loadedLocations);
      }
    }
  },
  getAll() { return Storage.get(Keys.locations, []); },
  saveAll(locations) { Storage.set(Keys.locations, locations); },
  getById(id) { return this.getAll().find(l => l.id === id); },
  setActive(id) { Storage.set(Keys.activeLocation, id); },
  getActive() { return this.getById(Storage.get(Keys.activeLocation)); },
  add(location) {
    const items = this.getAll();
    const duplicate = items.some(item => Math.abs(item.lat - location.lat) < 0.0005 && Math.abs(item.lon - location.lon) < 0.0005);
    if (duplicate) {
      Toast.show(I18n.t('toast.locationExists'));
      return null;
    }
    const next = [{
      id: Util.uuid(),
      notes: '',
      suitability: [],
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
  },
  updateLog(locationId, entryId, patch) {
    const location = this.getById(locationId);
    if (!location) return;
    const logbook = (location.logbook || []).map(item => item.id === entryId ? { ...item, ...patch } : item);
    this.update(locationId, { logbook });
  }
};
