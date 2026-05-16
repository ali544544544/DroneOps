import { Keys, Storage } from './core.js';
import { I18n } from './i18n.js';

/* global supabase */

const LOCAL_OWNER_KEY = 'droneops_cloud_user_id';
const SYNC_META_KEY = 'droneops_cloud_sync_meta';
const USER_DATA_PREFIX = 'drone_';

export const CloudManager = {
  user: null,
  client: null,
  pending: new Map(),
  flushTimer: null,
  flushPromise: null,
  flushDelay: 250,

  async init() {
    if (typeof supabase === 'undefined') {
      console.warn('Supabase library not loaded.');
      return;
    }
    
    // Initialize client if missing but CONFIG exists
    if (!window.supabaseClient && typeof CONFIG !== 'undefined') {
      window.supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }

    this.client = window.supabaseClient;
    
    if (this.client) {
      const { data: { session } } = await this.client.auth.getSession();
      this.user = session?.user ?? null;
      if (this.user) {
        const previousOwner = this.getLocalOwner();
        const hasLocalUserData = this.hasLocalUserData();
        const remoteRows = await this.fetchUserRows();
        if (previousOwner && previousOwner !== this.user.id) {
          this.clearLocalUserData();
        }
        const mergedLocalData = this.applyRows(remoteRows);
        if ((!remoteRows.length && hasLocalUserData && !previousOwner) || mergedLocalData) {
          await this.pushAll();
        }
        this.markLocalOwner(this.user.id);
      }
    }
    this.updateUI();
  },

  async login(email, password) {
    if (!this.client) throw new Error('Cloud client not ready');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;

    const previousOwner = this.getLocalOwner();
    const hasLocalUserData = this.hasLocalUserData();

    if (previousOwner === this.user.id && hasLocalUserData) {
      await this.pushAll();
      await this.pullAll();
    } else {
      const remoteRows = await this.fetchUserRows();
      if (previousOwner && previousOwner !== this.user.id) {
        this.clearLocalUserData();
      }
      const mergedLocalData = this.applyRows(remoteRows);
      if ((!remoteRows.length && hasLocalUserData && !previousOwner) || mergedLocalData) {
        await this.pushAll();
      }
    }

    this.markLocalOwner(this.user.id);
    this.updateUI();
  },

  async signup(email, password) {
    if (!this.client) throw new Error('Cloud client not ready');
    const emailRedirectTo = ['http:', 'https:'].includes(window.location.protocol)
      ? window.location.href
      : undefined;
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined
    });
    if (error) throw error;
    if (data?.session?.user) {
      this.user = data.session.user;
      this.markLocalOwner(this.user.id);
      this.updateUI();
    }
    return data;
  },

  async logout() {
    if (!this.client) return;
    await this.flushNow();
    await this.client.auth.signOut();
    this.user = null;
    this.pending.clear();
    this.clearLocalUserData();
    this.clearLocalOwner();
    this.clearSyncMeta();
    this.updateUI();
    window.dispatchEvent(new CustomEvent('droneops:account-data-cleared'));
  },

  async push(key, value) {
    if (!this.user || !this.client) return;
    if (!this.isUserDataKey(key)) return;
    this.queue(key, value);
  },

  queue(key, value) {
    this.pending.set(key, value);
    this.scheduleFlush();
  },

  scheduleFlush(delay = this.flushDelay) {
    if (!this.user || !this.client) return;
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushPending();
    }, delay);
  },

  flushSoon() {
    if (!this.pending.size) return Promise.resolve();
    this.scheduleFlush(25);
    return Promise.resolve();
  },

  async flushNow() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.flushPromise) await this.flushPromise;
    if (!this.pending.size) return;
    await this.flushPending();
  },

  async flushPending() {
    if (!this.user || !this.client || !this.pending.size) return;
    if (this.flushPromise) {
      await this.flushPromise;
      if (this.pending.size) return this.flushPending();
      return;
    }

    const entries = Array.from(this.pending.entries());
    this.pending.clear();
    this.flushPromise = this.pushBatch(entries);
    try {
      await this.flushPromise;
    } catch (e) {
      entries.forEach(([key, value]) => {
        if (!this.pending.has(key)) this.pending.set(key, value);
      });
      console.error('Cloud Push Error:', e);
      this.scheduleFlush(3000);
    } finally {
      this.flushPromise = null;
    }
  },

  async pushBatch(entries) {
    if (!entries.length) return;
    const localEntries = entries.filter(([key]) => this.isUserDataKey(key));
    if (!localEntries.length) return;
    const remoteRows = await this.fetchUserRows([...localEntries.map(([key]) => key), Keys.syncTombstones]);
    const remoteByKey = new Map(remoteRows.map(row => [row.key, this.normaliseSyncValue(row.value)]));
    const remoteUpdatedByKey = new Map(remoteRows.map(row => [row.key, row.updated_at]));
    const tombstones = this.mergeTombstones(
      Storage.get(Keys.syncTombstones, {}),
      remoteByKey.get(Keys.syncTombstones) || {}
    );
    if (Object.keys(tombstones).length) {
      this.writeLocalValue(Keys.syncTombstones, tombstones);
    }

    const rows = localEntries
      .filter(([key]) => this.isUserDataKey(key))
      .map(([key, value]) => {
        const mergedValue = this.mergeValue(key, value, remoteByKey.get(key), tombstones, {
          remoteUpdatedAt: remoteUpdatedByKey.get(key)
        });
        this.writeLocalValue(key, mergedValue);
        return {
          user_id: this.user.id,
          key,
          value: mergedValue,
          updated_at: new Date().toISOString()
        };
      });
    if (!rows.length) return;
    const { error } = await this.client
      .from('user_data')
      .upsert(rows, { onConflict: 'user_id, key' });
    if (error) throw error;
    this.recordSyncSnapshot();
  },

  async pullAll() {
    if (!this.user || !this.client) return;
    try {
      const data = await this.fetchUserRows();
      const mergedLocalData = this.applyRows(data);
      if (mergedLocalData) await this.pushAll();
      return data.length;
    } catch (e) { console.error('Cloud Pull Error:', e); }
    return 0;
  },

  async fetchUserRows(keys = null) {
    if (!this.user || !this.client) return [];
    let query = this.client
      .from('user_data')
      .select('key, value, updated_at')
      .eq('user_id', this.user.id);
    if (Array.isArray(keys) && keys.length) query = query.in('key', Array.from(new Set(keys)));
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  applyRows(rows = []) {
    let mergedLocalData = false;
    const remoteByKey = new Map(rows
      .filter(item => this.isUserDataKey(item.key))
      .map(item => [item.key, this.normaliseSyncValue(item.value)]));
    const tombstones = this.mergeTombstones(
      Storage.get(Keys.syncTombstones, {}),
      remoteByKey.get(Keys.syncTombstones) || {}
    );

    if (Object.keys(tombstones).length) {
      const previous = localStorage.getItem(Keys.syncTombstones);
      this.writeLocalValue(Keys.syncTombstones, tombstones);
      if (previous !== localStorage.getItem(Keys.syncTombstones)) mergedLocalData = true;
    }

    rows.forEach(item => {
      if (!this.isUserDataKey(item.key)) return;
      const localValue = Storage.get(item.key);
      const remoteValue = this.normaliseSyncValue(item.value);
      const mergedValue = this.mergeValue(item.key, localValue, remoteValue, tombstones, {
        remoteUpdatedAt: item.updated_at
      });
      const remoteRaw = JSON.stringify(remoteValue);
      const mergedRaw = JSON.stringify(mergedValue);
      this.writeLocalValue(item.key, mergedValue);
      if (mergedRaw !== remoteRaw) mergedLocalData = true;
    });
    this.recordSyncRows(rows);
    return mergedLocalData;
  },

  async pushAll() {
    if (!this.user || !this.client) return 0;
    await this.flushNow();
    const keysToSync = this.getSyncKeys();
    const entries = [];
    for (const key of keysToSync) {
      const val = Storage.get(key);
      if (val !== null) {
        entries.push([key, val]);
      }
    }
    await this.pushBatch(entries);
    return entries.length;
  },

  mergeValue(key, localValue, remoteValue, tombstones = {}, options = {}) {
    if (key === Keys.syncTombstones) {
      return this.mergeTombstones(localValue || {}, remoteValue || {});
    }
    if (key === Keys.locations) {
      return this.mergeLocations(localValue, remoteValue, tombstones);
    }
    if (key === Keys.profiles || key === Keys.checklist) {
      return this.mergeArrayById(localValue, remoteValue, tombstones[key] || {});
    }
    if (this.isPlainObject(localValue) && this.isPlainObject(remoteValue)) {
      return this.mergePlainObject(localValue, remoteValue);
    }
    if (localValue === null || localValue === undefined) return remoteValue;
    if (remoteValue === null || remoteValue === undefined) return localValue;
    return this.chooseNewerScalar(key, localValue, remoteValue, options.remoteUpdatedAt);
  },

  chooseNewerScalar(key, localValue, remoteValue, remoteUpdatedAt) {
    const localTime = this.timestampMs(Storage.modifiedAt?.(key));
    const remoteTime = this.timestampMs(remoteUpdatedAt);
    if (remoteTime > localTime) return remoteValue;
    return localValue;
  },

  mergeLocations(localValue, remoteValue, tombstones = {}) {
    const localItems = Array.isArray(localValue) ? localValue : [];
    const remoteItems = Array.isArray(remoteValue) ? remoteValue : [];
    const locationTombstones = tombstones[Keys.locations] || {};
    const logTombstones = tombstones[`${Keys.locations}:logbook`] || {};
    const byId = new Map();
    const order = [];

    const visit = (item, source) => {
      if (!item || typeof item !== 'object' || !item.id) return;
      if (!byId.has(item.id)) order.push(item.id);
      const entry = byId.get(item.id) || {};
      entry[source] = item;
      byId.set(item.id, entry);
    };
    localItems.forEach(item => visit(item, 'local'));
    remoteItems.forEach(item => visit(item, 'remote'));

    return order
      .map(id => {
        const entry = byId.get(id);
        const chosen = this.chooseNewerItem(entry.local, entry.remote);
        if (!chosen) return null;
        const deletedAt = this.timestampMs(locationTombstones[id]);
        const itemTime = this.timestampMs(chosen.updatedAt || chosen.createdAt);
        if (deletedAt && deletedAt >= itemTime) return null;

        const localLog = entry.local?.logbook || [];
        const remoteLog = entry.remote?.logbook || [];
        const scopedLogTombstones = {};
        Object.entries(logTombstones).forEach(([compoundId, deletedAtValue]) => {
          const prefix = `${id}:`;
          if (compoundId.startsWith(prefix)) {
            scopedLogTombstones[compoundId.slice(prefix.length)] = deletedAtValue;
          }
        });
        return {
          ...chosen,
          logbook: this.mergeArrayById(localLog, remoteLog, scopedLogTombstones)
        };
      })
      .filter(Boolean);
  },

  mergeArrayById(localValue, remoteValue, tombstones = {}) {
    const localItems = Array.isArray(localValue) ? localValue : [];
    const remoteItems = Array.isArray(remoteValue) ? remoteValue : [];
    if (!localItems.length && !remoteItems.length) return Array.isArray(localValue) ? localItems : remoteItems;

    const byId = new Map();
    const noId = [];
    const order = [];
    const visit = (item, source) => {
      if (!item || typeof item !== 'object' || !item.id) {
        if (item !== undefined && !noId.some(existing => JSON.stringify(existing) === JSON.stringify(item))) {
          noId.push(item);
        }
        return;
      }
      if (!byId.has(item.id)) order.push(item.id);
      const entry = byId.get(item.id) || {};
      entry[source] = item;
      byId.set(item.id, entry);
    };

    localItems.forEach(item => visit(item, 'local'));
    remoteItems.forEach(item => visit(item, 'remote'));

    const merged = order
      .map(id => {
        const entry = byId.get(id);
        const chosen = this.chooseNewerItem(entry.local, entry.remote);
        const deletedAt = this.timestampMs(tombstones[id]);
        const itemTime = this.timestampMs(chosen?.updatedAt || chosen?.createdAt);
        return deletedAt && deletedAt >= itemTime ? null : chosen;
      })
      .filter(Boolean);
    return [...merged, ...noId];
  },

  chooseNewerItem(localItem, remoteItem) {
    if (!localItem) return remoteItem || null;
    if (!remoteItem) return localItem;
    const localTime = this.timestampMs(localItem.updatedAt || localItem.createdAt);
    const remoteTime = this.timestampMs(remoteItem.updatedAt || remoteItem.createdAt);
    if (remoteTime > localTime) return { ...localItem, ...remoteItem };
    return { ...remoteItem, ...localItem };
  },

  mergeTombstones(localValue = {}, remoteValue = {}) {
    const merged = {};
    [remoteValue, localValue].forEach(source => {
      if (!this.isPlainObject(source)) return;
      Object.entries(source).forEach(([collectionKey, entries]) => {
        if (!this.isPlainObject(entries)) return;
        merged[collectionKey] = merged[collectionKey] || {};
        Object.entries(entries).forEach(([id, deletedAt]) => {
          const current = merged[collectionKey][id];
          if (!current || this.timestampMs(deletedAt) > this.timestampMs(current)) {
            merged[collectionKey][id] = deletedAt;
          }
        });
      });
    });
    return merged;
  },

  mergePlainObject(localValue = {}, remoteValue = {}) {
    return { ...remoteValue, ...localValue };
  },

  isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  },

  timestampMs(value) {
    const time = value ? new Date(value).getTime() : 0;
    return Number.isFinite(time) ? time : 0;
  },

  writeLocalValue(key, value) {
    if (value === undefined || value === null) return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  getSyncKeys() {
    const known = Object.values(Keys);
    const local = Object.keys(localStorage).filter(key => this.isUserDataKey(key));
    return Array.from(new Set([...known, ...local]));
  },

  getStoredSyncEntries() {
    return this.getSyncKeys()
      .map(key => [key, Storage.get(key)])
      .filter(([, value]) => value !== null);
  },

  recordSyncSnapshot(savedAt = new Date().toISOString()) {
    const entries = this.getStoredSyncEntries();
    this.saveSyncMeta({
      savedAt,
      items: this.buildSyncItems(entries)
    });
  },

  recordSyncRows(rows = []) {
    const syncRows = rows.filter(row => this.isUserDataKey(row.key));
    if (!syncRows.length) return;
    const savedAt = syncRows
      .map(row => row.updated_at)
      .filter(Boolean)
      .sort()
      .pop() || new Date().toISOString();
    this.saveSyncMeta({
      savedAt,
      items: this.buildSyncItems(syncRows.map(row => [row.key, row.value]))
    });
  },

  saveSyncMeta(meta) {
    const items = meta.items || [];
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);
    try {
      localStorage.setItem(SYNC_META_KEY, JSON.stringify({ ...meta, totalCount }));
    } catch (e) {
      console.warn('Could not save sync metadata', e);
    }
    this.updateUI();
  },

  getSyncMeta() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_META_KEY)) || null;
    } catch (e) {
      return null;
    }
  },

  clearSyncMeta() {
    localStorage.removeItem(SYNC_META_KEY);
  },

  buildSyncItems(entries = []) {
    const byKey = new Map(entries.map(([key, value]) => [key, this.normaliseSyncValue(value)]));
    const items = [];
    const add = (labelKey, count) => {
      if (!count) return;
      items.push({ labelKey, count });
    };
    const objectSize = (value) => value && typeof value === 'object' && !Array.isArray(value)
      ? Object.keys(value).length
      : 0;

    const locations = byKey.get(Keys.locations);
    if (Array.isArray(locations)) {
      add('auth.syncItemLocations', locations.length);
      add('auth.syncItemLogbook', locations.reduce((sum, location) => sum + ((location.logbook || []).length), 0));
    }

    const profiles = byKey.get(Keys.profiles);
    if (Array.isArray(profiles)) add('auth.syncItemProfiles', profiles.length);

    const checklist = byKey.get(Keys.checklist);
    if (Array.isArray(checklist)) {
      add('auth.syncItemChecklist', checklist.length);
      add('auth.syncItemDocuments', checklist.reduce((sum, item) => {
        const attachments = item.attachments || (item.attachment ? [item.attachment] : []);
        return sum + attachments.length;
      }, 0));
    }

    add('auth.syncItemDroneChecklist', objectSize(byKey.get(Keys.droneChecklist)));
    add('auth.syncItemHomeBase', byKey.has(Keys.homeBase) ? 1 : 0);

    const settingKeys = [
      Keys.language,
      Keys.activeProfile,
      Keys.activeTab,
      Keys.activeLocation,
      Keys.dashboardSource,
      Keys.distSource,
      Keys.dipulOverlay
    ];
    add('auth.syncItemSettings', settingKeys.filter(key => byKey.has(key)).length);

    return items;
  },

  normaliseSyncValue(value) {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  },

  isUserDataKey(key) {
    return Object.values(Keys).includes(key) || String(key).startsWith(USER_DATA_PREFIX);
  },

  hasLocalUserData() {
    return Object.keys(localStorage).some(key => this.isUserDataKey(key));
  },

  clearLocalUserData() {
    Object.keys(localStorage)
      .filter(key => this.isUserDataKey(key))
      .forEach(key => localStorage.removeItem(key));
  },

  getLocalOwner() {
    return localStorage.getItem(LOCAL_OWNER_KEY);
  },

  markLocalOwner(userId) {
    localStorage.setItem(LOCAL_OWNER_KEY, userId);
  },

  clearLocalOwner() {
    localStorage.removeItem(LOCAL_OWNER_KEY);
  },

  async resetPassword(email) {
    if (!this.client) throw new Error('Cloud client not ready');
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async updatePassword(newPassword) {
    if (!this.client) throw new Error('Cloud client not ready');
    const { data, error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw error;
    if (data?.user) this.user = data.user;
    this.updateUI();
  },

  async requestAccountDeletion() {
    if (!this.client || !this.user) throw new Error('Cloud client not ready');
    const requestedAt = new Date().toISOString();
    const { data, error } = await this.client.auth.updateUser({
      data: {
        account_deletion_requested_at: requestedAt,
        account_deletion_requested_email: this.user.email
      }
    });
    if (error) throw error;
    if (data?.user) this.user = data.user;
    this.updateUI();
    return requestedAt;
  },

  formatAccountDate(value) {
    if (!value) return I18n.t('auth.notAvailable');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return I18n.t('auth.notAvailable');
    try {
      return new Intl.DateTimeFormat(I18n.locale, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (e) {
      return date.toLocaleString();
    }
  },

  formatRelativeSave(value) {
    if (!value) return I18n.t('auth.syncNotSaved');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return I18n.t('auth.syncNotSaved');
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absSeconds = Math.abs(diffSeconds);
    if (absSeconds < 60) return I18n.t('auth.justNow');
    const units = [
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60]
    ];
    const [unit, seconds] = units.find(([, size]) => absSeconds >= size) || ['minute', 60];
    try {
      return new Intl.RelativeTimeFormat(I18n.locale, { numeric: 'auto' }).format(Math.round(diffSeconds / seconds), unit);
    } catch (e) {
      const minutes = Math.max(1, Math.round(absSeconds / 60));
      return I18n.t('auth.minutesAgo').replace('{count}', minutes);
    }
  },

  updateUI() {
    const statusEl = document.getElementById('dataStatusIndicator');
    const authView = document.getElementById('authView');
    const userView = document.getElementById('userView');
    const userEmail = document.getElementById('userEmail');
    const accountEmailValue = document.getElementById('accountEmailValue');
    const accountMemberSince = document.getElementById('accountMemberSince');
    const accountLastLogin = document.getElementById('accountLastLogin');
    const accountLastCloudSave = document.getElementById('accountLastCloudSave');
    const accountSavedElementsCount = document.getElementById('accountSavedElementsCount');
    const accountSavedElementsList = document.getElementById('accountSavedElementsList');
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    const changePasswordInput = document.getElementById('changePasswordInput');
    const changePasswordConfirmInput = document.getElementById('changePasswordConfirmInput');
    const modePill = document.querySelector('.account-mode-pill');

    const accountBtn = document.getElementById('accountBtn');
    if (this.user) {
      const syncMeta = this.getSyncMeta();
      const savedItems = syncMeta?.items || [];
      if (statusEl) statusEl.classList.add('live');
      if (accountBtn) {
        accountBtn.classList.add('btn-active');
        accountBtn.classList.remove('account-attention');
        accountBtn.textContent = '👤';
        accountBtn.title = I18n.t('common.account');
      }
      if (authView) authView.classList.add('hidden');
      if (userView) userView.classList.remove('hidden');
      if (userEmail) userEmail.textContent = this.user.email;
      if (accountEmailValue) accountEmailValue.textContent = this.user.email || I18n.t('auth.notAvailable');
      if (accountMemberSince) accountMemberSince.textContent = this.formatAccountDate(this.user.created_at);
      if (accountLastLogin) accountLastLogin.textContent = this.formatAccountDate(this.user.last_sign_in_at);
      if (accountLastCloudSave) accountLastCloudSave.textContent = this.formatRelativeSave(syncMeta?.savedAt);
      if (accountSavedElementsCount) accountSavedElementsCount.textContent = syncMeta ? I18n.t('auth.savedElementsCount').replace('{count}', syncMeta.totalCount ?? 0) : I18n.t('auth.notAvailable');
      if (accountSavedElementsList) accountSavedElementsList.textContent = savedItems.length
        ? savedItems.map(item => I18n.t('auth.syncItemLine').replace('{label}', I18n.t(item.labelKey)).replace('{count}', item.count)).join(', ')
        : I18n.t('auth.noSavedElements');
      if (modePill) {
        modePill.textContent = I18n.t('auth.syncModePill');
        modePill.classList.add('synced');
      }
    } else {
      if (statusEl) statusEl.classList.remove('live');
      if (accountBtn) {
        accountBtn.classList.remove('btn-active');
        accountBtn.classList.add('account-attention');
        accountBtn.textContent = '👤';
        accountBtn.title = I18n.t('common.account');
      }
      if (authView) authView.classList.remove('hidden');
      if (userView) userView.classList.add('hidden');
      if (userEmail) userEmail.textContent = '';
      if (accountEmailValue) accountEmailValue.textContent = '-';
      if (accountMemberSince) accountMemberSince.textContent = '-';
      if (accountLastLogin) accountLastLogin.textContent = '-';
      if (accountLastCloudSave) accountLastCloudSave.textContent = '-';
      if (accountSavedElementsCount) accountSavedElementsCount.textContent = '-';
      if (accountSavedElementsList) accountSavedElementsList.textContent = '-';
      if (passwordChangeForm) passwordChangeForm.classList.add('hidden');
      if (changePasswordInput) changePasswordInput.value = '';
      if (changePasswordConfirmInput) changePasswordConfirmInput.value = '';
      if (modePill) {
        modePill.textContent = I18n.t('auth.localModePill');
        modePill.classList.remove('synced');
      }
    }
  }
};
