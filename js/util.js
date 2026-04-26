export const Util = {
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  },
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject('No GPS');
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
  },
  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },
  base64ToBlob(base64, contentType = '') {
    const byteCharacters = atob(base64.split(',')[1] || base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const uInt8Array = new Uint8Array(byteNumbers);
      byteArrays.push(uInt8Array);
    }
    return new Blob(byteArrays, { type: contentType });
  }
};

export const Nominatim = {
  async reverse(lat, lon) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
      return await res.json();
    } catch { return null; }
  },
  async search(query) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      return await res.json();
    } catch { return []; }
  }
};
