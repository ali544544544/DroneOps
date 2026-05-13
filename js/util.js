export const Util = {
  uuid() {
    return globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  },
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },
  wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); },
  clamp(n, min, max) { return Math.max(min, Math.min(max, n)); },
  escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  },
  formatDate(dateStr, locale = 'de-DE') {
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  },
  formatTime(dateStr, locale = 'de-DE') {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  },
  formatDateTime(dateStr, locale = 'de-DE') {
    return new Date(dateStr).toLocaleString(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  windArrow(deg = 0) {
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
    return arrows[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
  },
  countdown(from, to) {
    const diff = Math.max(0, new Date(to) - new Date(from));
    const min = Math.floor(diff / 60000);
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  },
  dayKey(date = new Date()) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
  kmhToMs(kmh = 0) {
    return Math.round((kmh / 3.6) * 10) / 10;
  },
  recommendND(weatherCode, elevation) {
    if (elevation < 0) return 'None';
    if (elevation < 10) return 'ND4';
    
    const isBright = [0, 1].includes(Number(weatherCode));
    const isCloudy = [2, 3, 45, 48].includes(Number(weatherCode));
    
    if (elevation > 30) {
      if (isBright) return 'ND32';
      if (isCloudy) return 'ND16';
      return 'ND8';
    } else {
      if (isBright) return 'ND16';
      if (isCloudy) return 'ND8';
      return 'ND4';
    }
  },
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject('GPS unavailable');
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
  },
  async getTravelTime(lat1, lon1, lat2, lon2) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) {
        window.StatusTracker?.update('routing', 'error');
        return null;
      }
      window.StatusTracker?.update('routing', 'network');
      const duration = Math.round(data.routes[0].duration / 60);
      return duration;
    } catch (e) {
      console.error('OSRM Error:', e);
      window.StatusTracker?.update('routing', 'error');
      return null;
    }
  },
  getBrightSkyRain(bsData, targetTime) {
    if (!bsData || !bsData.weather || !bsData.weather.length) return null;
    const target = new Date(targetTime).getTime();
    const closest = bsData.weather.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.timestamp).getTime() - target);
      const currDiff = Math.abs(new Date(curr.timestamp).getTime() - target);
      return currDiff < prevDiff ? curr : prev;
    });
    if (Math.abs(new Date(closest.timestamp).getTime() - target) > 3600000) return null;
    return closest.precipitation;
  },
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },
  base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    if (parts.length < 2) return null;
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) uInt8Array[i] = raw.charCodeAt(i);
    return new Blob([uInt8Array], { type: contentType });
  }
};

export const Nominatim = {
  async reverse(lat, lon) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
      return await res.json();
    } catch (e) { return null; }
  },
  async search(query) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5`);
      return await res.json();
    } catch (e) { return []; }
  }
};
