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
    if (this.instances[id]) {
      this.instances[id].remove();
      delete this.instances[id];
    }
  },
  invalidate(id) {
    const containerId = typeof id === 'string' ? id : id.id;
    if (this.instances[containerId]) {
      setTimeout(() => this.instances[containerId].invalidateSize(), 100);
    }
  }
};
