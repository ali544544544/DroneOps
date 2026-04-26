import { Keys, Storage, FALLBACK_PROFILES } from './core.js';

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
  getById(id) { return this.getAll().find(p => p.id === id); },
  getActive() {
    const id = Storage.get(Keys.activeProfile);
    return this.getById(id) || this.getAll()[0];
  },
  setActive(id) { Storage.set(Keys.activeProfile, id); },
  add(data) {
    const profiles = this.getAll();
    const newProfile = { ...data, id: 'p_' + Date.now() };
    profiles.push(newProfile);
    Storage.set(Keys.profiles, profiles);
    return newProfile;
  },
  update(id, data) {
    const profiles = this.getAll();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...data };
      Storage.set(Keys.profiles, profiles);
    }
  },
  delete(id) {
    const profiles = this.getAll().filter(p => p.id !== id);
    Storage.set(Keys.profiles, profiles);
    if (Storage.get(Keys.activeProfile) === id) {
      Storage.set(Keys.activeProfile, profiles[0]?.id);
    }
  }
};

export const ChecklistManager = {
  init() {
    const existing = Storage.get(Keys.checklist, null);
    if (existing === null) {
      Storage.set(Keys.checklist, this.defaults());
    }
  },
  getAll() { return Storage.get(Keys.checklist, []); },
  defaults() {
    return [
      { id: 'c1', name: 'Akkus geladen', count: 4, category: 'power' },
      { id: 'c2', name: 'Propeller fest & heil', count: 1, category: 'hardware' },
      { id: 'c3', name: 'SD Karte leer', count: 1, category: 'media' },
      { id: 'c4', name: 'Fernsteuerung geladen', count: 1, category: 'power' },
      { id: 'c5', name: 'FPV Brille geladen', count: 1, category: 'power' }
    ];
  },
  categories() {
    return [...new Set(this.getAll().map(i => i.category))].filter(Boolean);
  },
  add(item) {
    const list = this.getAll();
    list.push({ ...item, id: 'c_' + Date.now() });
    Storage.set(Keys.checklist, list);
  },
  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      Storage.set(Keys.checklist, list);
    }
  },
  delete(id) {
    const list = this.getAll().filter(i => i.id !== id);
    Storage.set(Keys.checklist, list);
  }
};

export const LocationManager = {
  getAll() { return Storage.get(Keys.locations, []); },
  getById(id) { return this.getAll().find(l => l.id === id); },
  add(loc) {
    const list = this.getAll();
    const newLoc = { 
      ...loc, 
      id: loc.id || 'l_' + Date.now(),
      created: loc.created || new Date().toISOString()
    };
    list.push(newLoc);
    Storage.set(Keys.locations, list);
    return newLoc;
  },
  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(l => l.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      Storage.set(Keys.locations, list);
    }
  },
  delete(id) {
    const list = this.getAll().filter(l => l.id !== id);
    Storage.set(Keys.locations, list);
  }
};
