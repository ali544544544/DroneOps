import { CloudManager } from './cloud.js';

const DB_NAME = 'DroneOpsDB';
const STORE_NAME = 'attachments';

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
    const fileId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Save to local IndexedDB for fast offline access
    await this.saveLocal(fileId, file);
    
    let cloudPath = null;
    let url = null;

    // Upload to Supabase if logged in
    if (CloudManager.user && CloudManager.client) {
      const ext = file.name.split('.').pop() || '';
      const path = `${CloudManager.user.id}/${fileId}.${ext}`;
      
      try {
        const { error } = await CloudManager.client.storage
          .from('attachments')
          .upload(path, file);
          
        if (!error) {
          cloudPath = path;
          const { data: urlData } = CloudManager.client.storage
            .from('attachments')
            .getPublicUrl(path);
          url = urlData.publicUrl;
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
    
    // Fallback to cloud URL
    if (attachment.url) {
      return attachment.url;
    }
    
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
    if (attachment.cloudPath && CloudManager.user && CloudManager.client) {
      try {
        await CloudManager.client.storage
          .from('attachments')
          .remove([attachment.cloudPath]);
      } catch (e) {
        console.warn('Failed to delete from cloud', e);
      }
    }
  }
};
