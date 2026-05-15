import { Keys, Storage } from './core.js';
import { I18n } from './i18n.js';

/* global supabase */

const LOCAL_OWNER_KEY = 'droneops_cloud_user_id';
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
        if ((previousOwner && previousOwner !== this.user.id) || (!previousOwner && remoteRows.length)) {
          this.clearLocalUserData();
        }
        this.applyRows(remoteRows);
        if (!remoteRows.length && hasLocalUserData && !previousOwner) {
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
      if ((previousOwner && previousOwner !== this.user.id) || (!previousOwner && remoteRows.length)) {
        this.clearLocalUserData();
      }
      this.applyRows(remoteRows);
      if (!remoteRows.length && hasLocalUserData && !previousOwner) {
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
    const rows = entries
      .filter(([key]) => this.isUserDataKey(key))
      .map(([key, value]) => ({
      user_id: this.user.id,
      key,
      value,
      updated_at: new Date().toISOString()
    }));
    if (!rows.length) return;
    const { error } = await this.client
      .from('user_data')
      .upsert(rows, { onConflict: 'user_id, key' });
    if (error) throw error;
  },

  async pullAll() {
    if (!this.user || !this.client) return;
    try {
      const data = await this.fetchUserRows();
      this.applyRows(data);
      return data.length;
    } catch (e) { console.error('Cloud Pull Error:', e); }
    return 0;
  },

  async fetchUserRows() {
    if (!this.user || !this.client) return [];
    const { data, error } = await this.client
      .from('user_data')
      .select('key, value')
      .eq('user_id', this.user.id);
    if (error) throw error;
    return data || [];
  },

  applyRows(rows = []) {
    rows.forEach(item => {
      if (!this.isUserDataKey(item.key)) return;
      const val = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
      localStorage.setItem(item.key, val);
    });
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

  getSyncKeys() {
    const known = Object.values(Keys);
    const local = Object.keys(localStorage).filter(key => this.isUserDataKey(key));
    return Array.from(new Set([...known, ...local]));
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

  updateUI() {
    const statusEl = document.getElementById('dataStatusIndicator');
    const authView = document.getElementById('authView');
    const userView = document.getElementById('userView');
    const userEmail = document.getElementById('userEmail');
    const accountEmailValue = document.getElementById('accountEmailValue');
    const accountMemberSince = document.getElementById('accountMemberSince');
    const accountLastLogin = document.getElementById('accountLastLogin');
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    const changePasswordInput = document.getElementById('changePasswordInput');
    const changePasswordConfirmInput = document.getElementById('changePasswordConfirmInput');
    const modePill = document.querySelector('.account-mode-pill');

    const accountBtn = document.getElementById('accountBtn');
    if (this.user) {
      if (statusEl) statusEl.classList.add('live');
      if (accountBtn) {
        accountBtn.classList.add('btn-active');
        accountBtn.textContent = this.user.email || I18n.t('common.account');
        accountBtn.title = this.user.email || I18n.t('common.account');
      }
      if (authView) authView.classList.add('hidden');
      if (userView) userView.classList.remove('hidden');
      if (userEmail) userEmail.textContent = this.user.email;
      if (accountEmailValue) accountEmailValue.textContent = this.user.email || I18n.t('auth.notAvailable');
      if (accountMemberSince) accountMemberSince.textContent = this.formatAccountDate(this.user.created_at);
      if (accountLastLogin) accountLastLogin.textContent = this.formatAccountDate(this.user.last_sign_in_at);
      if (modePill) {
        modePill.textContent = I18n.t('auth.syncModePill');
        modePill.classList.add('synced');
      }
    } else {
      if (statusEl) statusEl.classList.remove('live');
      if (accountBtn) {
        accountBtn.classList.remove('btn-active');
        accountBtn.textContent = I18n.t('common.account');
        accountBtn.title = I18n.t('common.account');
      }
      if (authView) authView.classList.remove('hidden');
      if (userView) userView.classList.add('hidden');
      if (userEmail) userEmail.textContent = '';
      if (accountEmailValue) accountEmailValue.textContent = '-';
      if (accountMemberSince) accountMemberSince.textContent = '-';
      if (accountLastLogin) accountLastLogin.textContent = '-';
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
