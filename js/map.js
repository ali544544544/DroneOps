/* global L */

export const MapManager = {
  instances: {},
  get(id, options = {}) {
    const container = typeof id === 'string' ? document.getElementById(id) : id;
    if (!container) return null;
    
    const containerId = typeof id === 'string' ? id : (container.id || 'anonymous_map');

    if (this.instances[containerId]) {
      return this.instances[containerId];
    }
    
    const map = L.map(container, options);
    this.instances[containerId] = map;
    return map;
  },
  destroy(id) {
    const containerId = typeof id === 'string' ? id : (id.id || 'anonymous_map');
    const container = typeof id === 'string' ? document.getElementById(id) : id;

    if (this.instances[containerId]) {
      try {
        this.instances[containerId].remove();
      } catch (e) {
        console.warn('MapManager: Leaflet remove() failed:', e);
      }
      delete this.instances[containerId];
    }

    // Deep clean the container if it exists
    if (container) {
      if (container._leaflet_id) delete container._leaflet_id;
      container.classList.remove('leaflet-container');
      // container.innerHTML = ''; // Optional: decide if we want to clear the content
    }
  },
  invalidate(id) {
    const containerId = typeof id === 'string' ? id : id.id;
    if (this.instances[containerId]) {
      setTimeout(() => this.instances[containerId].invalidateSize(), 100);
    }
  }
};
