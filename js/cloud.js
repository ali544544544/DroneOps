import { Keys, Storage } from './core.js';
import { I18n } from './i18n.js';

/* global supabase */

export const CloudManager = {
  user: null,
  client: null,

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
        await this.pullAll();
      }
    }
    this.updateUI();
  },

  async login(email, password) {
    if (!this.client) throw new Error('Cloud client not ready');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.user = data.user;
    
    await this.pullAll();
    await this.pushAll(); 
    
    this.updateUI();
  },

  async signup(email, password) {
    if (!this.client) throw new Error('Cloud client not ready');
    const { error } = await this.client.auth.signUp({ email, password });
    if (error) throw error;
  },

  async logout() {
    if (!this.client) return;
    await this.client.auth.signOut();
    this.user = null;
    this.updateUI();
  },

  async push(key, value) {
    if (!this.user || !this.client) return;
    try {
      await this.client.from('user_data').upsert({
        user_id: this.user.id,
        key: key,
        value: value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, key' });
    } catch (e) { console.error('Cloud Push Error:', e); }
  },

  async pullAll() {
    if (!this.user || !this.client) return;
    try {
      const { data, error } = await this.client.from('user_data').select('key, value');
      if (!error && data) {
        data.forEach(item => {
          const val = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
          localStorage.setItem(item.key, val);
        });
      }
    } catch (e) { console.error('Cloud Pull Error:', e); }
  },

  async pushAll() {
    if (!this.user || !this.client) return 0;
    const keysToSync = [
      Keys.locations, Keys.profiles, Keys.checklist, 
      Keys.droneChecklist, Keys.homeBase, Keys.language, 
      Keys.activeProfile
    ];
    let count = 0;
    for (const key of keysToSync) {
      const val = Storage.get(key);
      if (val !== null) {
        await this.push(key, val);
        count++;
      }
    }
    return count;
  },

  async resetPassword(email) {
    if (!this.client) throw new Error('Cloud client not ready');
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async updatePassword(newPassword) {
    if (!this.client) throw new Error('Cloud client not ready');
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  updateUI() {
    const statusEl = document.getElementById('dataStatusIndicator');
    const authView = document.getElementById('authView');
    const userView = document.getElementById('userView');
    const userEmail = document.getElementById('userEmail');

    const accountBtn = document.getElementById('accountBtn');
    if (this.user) {
      if (statusEl) statusEl.classList.add('live');
      if (accountBtn) accountBtn.classList.add('btn-active');
      if (authView) authView.classList.add('hidden');
      if (userView) userView.classList.remove('hidden');
      if (userEmail) userEmail.textContent = this.user.email;
    } else {
      if (statusEl) statusEl.classList.remove('live');
      if (accountBtn) accountBtn.classList.remove('btn-active');
      if (authView) authView.classList.remove('hidden');
      if (userView) userView.classList.add('hidden');
    }
  }
};
