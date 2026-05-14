import { CloudManager } from './cloud.js';

const DB_NAME = 'DroneOpsDB';
const STORE_NAME = 'attachments';
const BUCKET_NAME = 'attachments';

export const AttachmentManager = {
  db: null,
  
  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  },

  async saveLocal(id, blob) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, id);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  },

  async getLocal(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteLocal(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async upload(file) {
    const fileId = `att_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`}`;
    
    // Save to local IndexedDB for fast offline access
    await this.saveLocal(fileId, file);
    
    let cloudPath = null;
    let url = null;

    // Upload to Supabase if logged in
    if (CloudManager.user && CloudManager.client) {
      const ext = this.safeExtension(file.name);
      const path = `${CloudManager.user.id}/${fileId}.${ext}`;
      
      try {
        const { error } = await CloudManager.client.storage
          .from(BUCKET_NAME)
          .upload(path, file);
          
        if (!error) {
          cloudPath = path;
        } else {
          console.warn("Supabase upload error", error);
        }
      } catch (e) {
        console.warn("Cloud upload failed", e);
      }
    }

    return {
      id: fileId,
      name: file.name,
      type: file.type,
      cloudPath: cloudPath,
      url: url,
      size: file.size
    };
  },

  safeExtension(name = '') {
    const raw = String(name).split('.').pop() || 'bin';
    return raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'bin';
  },

  isOwnCloudPath(path) {
    return !!(CloudManager.user?.id && path && String(path).startsWith(`${CloudManager.user.id}/`));
  },
  
  async getFileUrl(attachment) {
    // If it has a public cloud URL and we are online, we could use it.
    // But it's usually faster to check local first.
    try {
      const localBlob = await this.getLocal(attachment.id);
      if (localBlob) {
        return URL.createObjectURL(localBlob);
      }
    } catch (e) {
      console.warn('Failed to get local file', e);
    }
    
    if (attachment.cloudPath && CloudManager.user && CloudManager.client && this.isOwnCloudPath(attachment.cloudPath)) {
      try {
        const { data, error } = await CloudManager.client.storage
          .from(BUCKET_NAME)
          .createSignedUrl(attachment.cloudPath, 60 * 60);
        if (!error && data?.signedUrl) return data.signedUrl;
      } catch (e) {
        console.warn('Failed to create signed URL', e);
      }
    }

    // Fallback for older public attachment records.
    if (attachment.url && (!attachment.cloudPath || this.isOwnCloudPath(attachment.cloudPath))) return attachment.url;

    // Fallback for old base64 attachments
    if (attachment.data) {
      // If it's already a data URL
      if (attachment.data.startsWith('data:')) {
        return attachment.data;
      }
    }
    return null;
  },

  async delete(attachment) {
    if (attachment.id) {
      await this.deleteLocal(attachment.id);
    }
    if (attachment.cloudPath && CloudManager.user && CloudManager.client && this.isOwnCloudPath(attachment.cloudPath)) {
      try {
        await CloudManager.client.storage
          .from(BUCKET_NAME)
          .remove([attachment.cloudPath]);
      } catch (e) {
        console.warn('Failed to delete from cloud', e);
      }
    }
  }
};
