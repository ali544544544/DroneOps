import { Keys, Storage, FALLBACK_PROFILES, FALLBACK_TRANSLATIONS, DRONE_WEATHER_CODES_FALLBACK, I18n, CloudManager, ProfileManager, ChecklistManager, LocationManager, MapManager, Util, Nominatim, WeatherService, BrightSkyService, SunService, ScoreEngine, GoldenHour, Toast, Skeleton, Router, AttachmentManager } from './js/index.js';

// Expose modules to global window for legacy event handlers and debugging
window.Keys = Keys;
window.Storage = Storage;
window.I18n = I18n;
window.CloudManager = CloudManager;
window.ProfileManager = ProfileManager;
window.ChecklistManager = ChecklistManager;
window.LocationManager = LocationManager;
window.MapManager = MapManager;
window.Util = Util;
window.WeatherService = WeatherService;
window.Toast = Toast;
window.Router = Router;
window.AttachmentManager = AttachmentManager;

const DATA_FILES = {
  profiles: './data/profiles.json',
  translations: './data/translations.json',
  weathercodes: './data/weathercodes.json'
};
const StatusTracker = {
  services: {
    weather: { label: 'Wetter', source: 'unknown', timestamp: null },
    sun: { label: 'Sonne', source: 'unknown', timestamp: null },
    routing: { label: 'Anreise', source: 'unknown', timestamp: null }
  },
  update(service, source, timestamp) {
    if (this.services[service]) {
      this.services[service].source = source;
      this.services[service].timestamp = timestamp || Date.now();
      if (typeof UI !== 'undefined' && UI.updateStatusIndicator) {
        UI.updateStatusIndicator();
      }
    }
  }
};
window.StatusTracker = StatusTracker;
window.CloudManager = CloudManager;

const AirspaceService = {
  wmsUrl: 'https://uas-betrieb.de/geoservices/dipul/wms',
  cache: new Map(),
  layers: [
    { id: 'dipul:flugplaetze', label: 'Flugplatz', severity: 'nogo' },
    { id: 'dipul:flughaefen', label: 'Flughafen', severity: 'nogo' },
    { id: 'dipul:kontrollzonen', label: 'Kontrollzone', severity: 'nogo' },
    { id: 'dipul:flugbeschraenkungsgebiete', label: 'Flugbeschraenkungsgebiet', severity: 'nogo' },
    { id: 'dipul:bundesautobahnen', label: 'Bundesautobahn', severity: 'nogo' },
    { id: 'dipul:bundesstrassen', label: 'Bundesstrasse', severity: 'nogo' },
    { id: 'dipul:bahnanlagen', label: 'Bahnanlage', severity: 'nogo' },
    { id: 'dipul:binnenwasserstrassen', label: 'Binnenwasserstrasse', severity: 'nogo' },
    { id: 'dipul:seewasserstrassen', label: 'Seewasserstrasse', severity: 'nogo' },
    { id: 'dipul:schifffahrtsanlagen', label: 'Schifffahrtsanlage', severity: 'nogo' },
    { id: 'dipul:wohngrundstuecke', label: 'Wohngrundstueck', severity: 'nogo' },
    { id: 'dipul:freibaeder', label: 'Freibad/Badestelle', severity: 'nogo' },
    { id: 'dipul:industrieanlagen', label: 'Industrieanlage', severity: 'nogo' },
    { id: 'dipul:kraftwerke', label: 'Kraftwerk', severity: 'nogo' },
    { id: 'dipul:umspannwerke', label: 'Umspannwerk', severity: 'nogo' },
    { id: 'dipul:stromleitungen', label: 'Stromleitung', severity: 'nogo' },
    { id: 'dipul:windkraftanlagen', label: 'Windkraftanlage', severity: 'nogo' },
    { id: 'dipul:justizvollzugsanstalten', label: 'Justizvollzugsanstalt', severity: 'nogo' },
    { id: 'dipul:militaerische_anlagen', label: 'Militaerische Anlage', severity: 'nogo' },
    { id: 'dipul:labore', label: 'BSL-4 Labor', severity: 'nogo' },
    { id: 'dipul:behoerden', label: 'Behoerde', severity: 'nogo' },
    { id: 'dipul:diplomatische_vertretungen', label: 'Diplomatische Vertretung', severity: 'nogo' },
    { id: 'dipul:internationale_organisationen', label: 'Internationale Organisation', severity: 'nogo' },
    { id: 'dipul:polizei', label: 'Polizei', severity: 'nogo' },
    { id: 'dipul:sicherheitsbehoerden', label: 'Sicherheitsbehoerde', severity: 'nogo' },
    { id: 'dipul:krankenhaeuser', label: 'Krankenhaus', severity: 'nogo' },
    { id: 'dipul:nationalparks', label: 'Nationalpark', severity: 'nogo' },
    { id: 'dipul:naturschutzgebiete', label: 'Naturschutzgebiet', severity: 'nogo' },
    { id: 'dipul:ffh-gebiete', label: 'FFH-Gebiet', severity: 'nogo' },
    { id: 'dipul:vogelschutzgebiete', label: 'Vogelschutzgebiet', severity: 'nogo' },
    { id: 'dipul:temporaere_betriebseinschraenkungen', label: 'Temporaere Betriebseinschraenkung', severity: 'nogo' },
    { id: 'dipul:inaktive_temporaere_betriebseinschraenkungen', label: 'Inaktive temporaere Betriebseinschraenkung', severity: 'caution' },
    { id: 'dipul:modellflugplaetze', label: 'Modellflugplatz', severity: 'caution' }
  ],
  dronezonerUrl: 'https://dronezoner.eu/Dronezoner2026.html',
  dronezonerLayers: [
    { key: 'dk-green', label: 'GRON - Naturomrader', severity: 'caution', color: '#37e781', fillOpacity: 0.18, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/NaturOmraader2024v2/FeatureServer/0' },
    { key: 'dk-blue-area', label: 'BLA - Sikringskritisk omrade', severity: 'nogo', color: '#4d94ff', fillOpacity: 0.2, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/DroneZoner_2025_ny_bekndg/FeatureServer/4' },
    { key: 'dk-blue-point', label: 'BLA - Sikringskritisk signatur', severity: 'nogo', color: '#4d94ff', fillOpacity: 0.3, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/DroneZoner_2025_ny_bekndg/FeatureServer/5' },
    { key: 'dk-yellow-notam', label: 'GUL - Restriktionsomrade', severity: 'caution', color: '#f5bc2b', fillOpacity: 0.24, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/disabled_notams/FeatureServer/0' },
    { key: 'dk-orange-area', label: 'ORANGE - Opmearksomhedsomrade', severity: 'caution', color: '#ff7a3d', fillOpacity: 0.24, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/DroneZoner_2025_ny_bekndg/FeatureServer/2' },
    { key: 'dk-orange-point', label: 'ORANGE - Opmearksomheds signatur', severity: 'caution', color: '#ff7a3d', fillOpacity: 0.3, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/DroneZoner_2025_ny_bekndg/FeatureServer/3' },
    { key: 'dk-red-area', label: 'ROD - Flyvesikringskritisk omrade', severity: 'nogo', color: '#ff5c5c', fillOpacity: 0.24, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/DroneZoner_2025_ny_bekndg/FeatureServer/1' },
    { key: 'dk-red-point', label: 'ROD - Flyvesikringskritisk signatur', severity: 'nogo', color: '#ff5c5c', fillOpacity: 0.3, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/DroneZoner_2025_ny_bekndg/FeatureServer/0' },
    { key: 'dk-notam-inactive', label: 'NOTAMS - Inaktiv', severity: 'caution', color: '#f5bc2b', fillOpacity: 0.18, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/inactive_notams/FeatureServer/0' },
    { key: 'dk-notam-awareness', label: 'NOTAMS - Opmearksomhed', severity: 'caution', color: '#ff7a3d', fillOpacity: 0.24, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/awareness_notams/FeatureServer/0' },
    { key: 'dk-notam-active', label: 'NOTAMS - Aktiv', severity: 'nogo', color: '#ff5c5c', fillOpacity: 0.24, url: 'https://services-eu1.arcgis.com/Zvx25KS6sGRl9LIx/arcgis/rest/services/active_notams/FeatureServer/0' }
  ],
  isInGermany(location) {
    return location.lat >= 47.1 && location.lat <= 55.2 && location.lon >= 5.5 && location.lon <= 15.6;
  },
  isInDenmark(location) {
    return location.lat >= 52.7 && location.lat <= 59.7 && location.lon >= 3.0 && location.lon <= 17.9;
  },
  provider(location) {
    if (this.isInGermany(location)) return 'dipul';
    if (this.isInDenmark(location)) return 'dronezoner';
    return null;
  },
  isOverlayAvailable(location) {
    return !!this.provider(location);
  },
  mapUrl(location, radius = 1000) {
    if (this.isInDenmark(location)) return this.dronezonerUrl;
    const zoom = radius > 1500 ? '11.0' : '13.0';
    return `https://maptool-dipul.dfs.de/geozones/@${location.lon.toFixed(7)},${location.lat.toFixed(7)},${radius}r?language=${I18n.lang === 'en' ? 'en' : 'de'}&zoom=${zoom}`;
  },
  openMapLabel(location) {
    return this.isInDenmark(location) ? I18n.t('airspace.openDronezoner') : I18n.t('airspace.openDipul');
  },
  sourceLabel(location) {
    return this.isInDenmark(location) ? I18n.t('airspace.sourceDronezoner') : I18n.t('airspace.source');
  },
  requestUrl(url) {
    const proxy = (typeof CONFIG !== 'undefined' && CONFIG.AIRSPACE_PROXY_URL) ? CONFIG.AIRSPACE_PROXY_URL : '';
    if (!proxy) return url;
    return proxy.includes('{url}') ? proxy.replace('{url}', encodeURIComponent(url)) : `${proxy}${encodeURIComponent(url)}`;
  },
  cacheKey(location) {
    return `${location.lat.toFixed(5)},${location.lon.toFixed(5)},${I18n.lang}`;
  },
  async check(location) {
    const key = this.cacheKey(location);
    if (this.cache.has(key)) return this.cache.get(key);

    if (this.isInDenmark(location)) {
      const dronezoner = { status: 'overlay', severity: 'caution', features: [], source: 'Dronezoner' };
      this.cache.set(key, dronezoner);
      return dronezoner;
    }

    if (!this.isInGermany(location)) {
      const outside = { status: 'outside', severity: 'caution', features: [], source: 'DIPUL' };
      this.cache.set(key, outside);
      return outside;
    }

    const layerIds = this.layers.map(layer => layer.id).join(',');
    const delta = 0.0025;
    const params = new URLSearchParams({
      service: 'WMS',
      version: '1.1.1',
      request: 'GetFeatureInfo',
      layers: layerIds,
      styles: '',
      srs: 'EPSG:4326',
      bbox: [
        (location.lon - delta).toFixed(7),
        (location.lat - delta).toFixed(7),
        (location.lon + delta).toFixed(7),
        (location.lat + delta).toFixed(7)
      ].join(','),
      width: '101',
      height: '101',
      x: '50',
      y: '50',
      query_layers: layerIds,
      info_format: 'text/plain',
      feature_count: '25'
    });

    try {
      const res = await fetch(this.requestUrl(`${this.wmsUrl}?${params.toString()}`), { headers: { Accept: 'text/plain,*/*' } });
      if (!res.ok) throw new Error(`DIPUL WMS ${res.status}`);

      const text = await res.text();
      const features = this.parseFeatures(text);
      const hasBlocking = features.some(feature => feature.severity === 'nogo');
      const result = {
        status: hasBlocking ? 'restricted' : (features.length ? 'advisory' : 'clear'),
        severity: hasBlocking ? 'nogo' : (features.length ? 'caution' : 'fly'),
        features,
        source: 'DIPUL'
      };
      this.cache.set(key, result);
      return result;
    } catch (error) {
      console.warn('DIPUL airspace check failed:', error);
      const failed = { status: 'error', severity: 'caution', features: [], source: 'DIPUL' };
      this.cache.set(key, failed);
      return failed;
    }
  },
  parseFeatures(text) {
    if (!text) return [];
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data.features)) return [];
      return data.features.map(feature => this.normaliseFeature(feature)).filter(Boolean);
    } catch (error) {
      return this.parseTextFeatures(text);
    }
  },
  parseTextFeatures(text) {
    if (!text.includes('FeatureType') && !text.includes('name =')) return [];
    return text.split(/Results for FeatureType/i).slice(1).map(block => {
      const idMatch = block.match(/'([^']+)'/);
      const nameMatch = block.match(/\bname\s*=\s*([^\n\r]+)/i);
      const typeMatch = block.match(/\btype(?:_code)?\s*=\s*([^\n\r]+)/i);
      const legalMatch = block.match(/\blegal_ref\s*=\s*([^\n\r]+)/i);
      return this.normaliseFeature({
        id: idMatch?.[1] || '',
        properties: {
          name: nameMatch?.[1],
          type: typeMatch?.[1],
          legal_ref: legalMatch?.[1],
          lower_limit_altitude: block.match(/\blower_limit_altitude\s*=\s*([^\n\r]+)/i)?.[1],
          lower_limit_unit: block.match(/\blower_limit_unit\s*=\s*([^\n\r]+)/i)?.[1],
          lower_limit_alt_ref: block.match(/\blower_limit_alt_ref\s*=\s*([^\n\r]+)/i)?.[1],
          upper_limit_altitude: block.match(/\bupper_limit_altitude\s*=\s*([^\n\r]+)/i)?.[1],
          upper_limit_unit: block.match(/\bupper_limit_unit\s*=\s*([^\n\r]+)/i)?.[1],
          upper_limit_alt_ref: block.match(/\bupper_limit_alt_ref\s*=\s*([^\n\r]+)/i)?.[1]
        }
      });
    }).filter(Boolean);
  },
  normaliseFeature(feature) {
    const props = feature.properties || {};
    const rawName = Array.isArray(props.name) ? props.name.join(', ') : (props.name || props.NAME || props.bezeichnung || props.type || '');
    const layer = this.layerForFeature(feature, props);
    if (!rawName && !layer) return null;
    return {
      name: String(rawName || layer?.label || I18n.t('airspace.zone')).trim(),
      layer: layer?.id || '',
      layerLabel: layer?.label || props.type || I18n.t('airspace.zone'),
      severity: layer?.severity || 'nogo',
      legal: props.legal_ref || props.legalRef || props.rechtsgrundlage || '',
      lower: this.formatLimit(props, 'lower'),
      upper: this.formatLimit(props, 'upper')
    };
  },
  layerForFeature(feature, props) {
    const haystack = `${feature.id || ''} ${feature.type || ''} ${feature.typeName || ''} ${props.type || ''}`.toLowerCase();
    return this.layers.find(layer => {
      const key = layer.id.split(':')[1].toLowerCase();
      return haystack.includes(key) || haystack.includes(key.replace(/e$/, ''));
    });
  },
  formatLimit(props, prefix) {
    const value = props[`${prefix}_limit_altitude`];
    const unit = props[`${prefix}_limit_unit`];
    const ref = props[`${prefix}_limit_reference`] || props[`${prefix}_limit_alt_ref`];
    if (value === undefined || value === null || value === '') return '';
    return `${value}${unit ? ` ${unit}` : ''}${ref ? ` ${ref}` : ''}`;
  }
};
window.AirspaceService = AirspaceService;

const UI = {
  els: {},
  weathercodes: DRONE_WEATHER_CODES_FALLBACK,
  init(weathercodes) {
    this.weathercodes = weathercodes || DRONE_WEATHER_CODES_FALLBACK;
    this.els = {
      profileSelect: document.getElementById('profileSelect'),
      liveClock: document.getElementById('liveClock'),
      toastContainer: document.getElementById('toastContainer'),
      locationList: document.getElementById('locationList'),
      searchInput: document.getElementById('locationSearchInput'),
      searchSuggestions: document.getElementById('searchSuggestions'),
      detailTitle: document.getElementById('detailTitle'),
      detailFlightPanel: document.getElementById('detailFlightPanel'),
      detailMapPanel: document.getElementById('detailMapPanel'),
      detailWeatherPanel: document.getElementById('detailWeatherPanel'),
      detailSunPanel: document.getElementById('detailSunPanel'),
      detailHourlyPanel: document.getElementById('detailHourlyPanel'),
      detailNotesPanel: document.getElementById('detailNotesPanel'),
      dashboardCurrentPanel: document.getElementById('dashboardCurrentPanel'),
      dashboardGoldenPanel: document.getElementById('dashboardGoldenPanel'),
      dashboardLocationCardsPanel: document.getElementById('dashboardLocationCardsPanel'),
      dashboardHourlyPanel: document.getElementById('dashboardHourlyPanel'),
      dashboardDronePanel: document.getElementById('dashboardDronePanel'),
      dashboardChecklistPanel: document.getElementById('dashboardChecklistPanel'),
      dashboardLocationSelect: document.getElementById('dashboardLocationSelect'),
      dronesList: document.getElementById('dronesList'),
      droneForm: document.getElementById('droneForm'),
      droneName: document.getElementById('droneName'),
      droneStyle: document.getElementById('droneStyle'),
      droneWeight: document.getElementById('droneWeight'),
      droneSize: document.getElementById('droneSize'),
      droneMaxWind: document.getElementById('droneMaxWind'),
      droneMaxGusts: document.getElementById('droneMaxGusts'),
      droneColorContainer: document.getElementById('droneColorContainer'),
      droneRain: document.getElementById('droneRain'),
      droneCancelBtn: document.getElementById('droneCancelBtn'),
      droneAddBtn: document.getElementById('droneAddBtn'),
      checklistGroups: document.getElementById('checklistGroups'),
      checklistCategory: document.getElementById('checklistCategory'),
      checklistProgressText: document.getElementById('checklistProgressText'),
      checklistProgressBar: document.getElementById('checklistProgressBar'),
      dashboardHomeBtn: document.getElementById('dashboardHomeBtn'),
      dashboardHomeSearchWrap: document.getElementById('dashboardHomeSearchWrap'),
      dashboardHomeSearchInput: document.getElementById('dashboardHomeSearchInput'),
      dashboardHomeSuggestions: document.getElementById('dashboardHomeSuggestions'),
      checklistNotes: document.getElementById('checklistNotes'),
      checklistFile: document.getElementById('checklistFile'),
      dataStatusIndicator: document.getElementById('dataStatusIndicator'),
    };
  },
  renderColorPicker(current, idPrefix) {
    const palette = ['#f5bc2b', '#ff7a3d', '#ff4d4d', '#a24dff', '#4d94ff', '#4dffc9', '#b3ff4d', '#111111', '#ffffff'];
    const isCustom = !palette.includes(current);
    
    return `
      <div class="color-selection" id="${idPrefix}-color-wrap">
        <input type="hidden" id="${idPrefix}-color" value="${current}" />
        ${palette.map(c => `
          <div class="color-swatch ${c === current ? 'active' : ''}" 
               style="background-color: ${c}" 
               data-color="${c}"
               onclick="this.parentElement.querySelector('input').value='${c}'; 
                        this.parentElement.querySelectorAll('.color-swatch, .color-custom-wrap').forEach(s=>s.classList.remove('active'));
                        this.classList.add('active');"></div>
        `).join('')}
        <div class="color-custom-wrap ${isCustom ? 'active' : ''}">
          <input type="color" value="${isCustom ? current : '#ffffff'}" 
                 onchange="this.parentElement.parentElement.querySelector('input').value=this.value;
                           this.parentElement.parentElement.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('active'));
                           this.parentElement.classList.add('active');" />
          <i>🎨</i>
        </div>
      </div>
    `;
  },
  addSunToMap(map, location, sunResults, gh, posNow) {
    if (map.sunLayer) {
      map.sunLayer.clearLayers();
    } else {
      map.sunLayer = L.layerGroup().addTo(map);
    }

    if (map.sunLegend) {
      map.removeControl(map.sunLegend);
    }

    const posSR  = window.App.getSolarPosition(new Date(sunResults.sunrise), location.lat, location.lon);
    const posSS  = window.App.getSolarPosition(new Date(sunResults.sunset), location.lat, location.lon);
    const posGHS = window.App.getSolarPosition(gh.morningStart, location.lat, location.lon);
    const posGHE = window.App.getSolarPosition(gh.eveningEnd, location.lat, location.lon);

    const drawLine = (az, color, label, dash = null) => {
      const rad = (az - 90) * (Math.PI / 180);
      const dist = 0.015;
      const lat2 = location.lat - dist * Math.sin(rad); 
      const lon2 = location.lon + dist * Math.cos(rad);
      L.polyline([[location.lat, location.lon], [lat2, lon2]], {
        color, weight: 4, dashArray: dash, opacity: 0.8
      }).addTo(map.sunLayer).bindTooltip(label);
    };

    drawLine(posSR.azimuth, '#f5bc2b', I18n.t('sun.sunrise'));
    drawLine(posSS.azimuth, '#ff7a3d', I18n.t('sun.sunset'));
    drawLine(posGHS.azimuth, '#ffcc33', I18n.t('sun.morning'), '5, 10');
    drawLine(posGHE.azimuth, '#ffcc33', I18n.t('sun.evening'), '5, 10');
    if (posNow.elevation > 0) drawLine(posNow.azimuth, 'white', I18n.t('dashboard.current'), '2, 5');

    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div class="legend-item"><span class="legend-line" style="background:#f5bc2b"></span> ${I18n.t('sun.sunrise')}</div>
        <div class="legend-item"><span class="legend-line" style="background:#ff7a3d"></span> ${I18n.t('sun.sunset')}</div>
        <div class="legend-item"><span class="legend-line" style="background:#ffcc33;border-top:1px dashed #fff"></span> ${I18n.t('sun.morning')}</div>
        <div class="legend-item"><span class="legend-line" style="background:#fff;border-top:1px dashed #000"></span> ${I18n.t('dashboard.current')}</div>
      `;
      return div;
    };
    legend.addTo(map);
    map.sunLegend = legend;
  },
  applyI18n() {
    document.documentElement.lang = I18n.lang;
    document.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = I18n.t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
      node.placeholder = I18n.t(node.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(node => {
      node.setAttribute('aria-label', I18n.t(node.dataset.i18nAriaLabel));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(node => {
      node.setAttribute('title', I18n.t(node.dataset.i18nTitle));
    });
    if (this.els.searchInput) this.els.searchInput.placeholder = I18n.lang === 'de' ? 'Hamburg, DE' : 'Hamburg, DE';
  },
  updateStatusIndicator() {
    const el = this.els.dataStatusIndicator;
    if (!el) return;
    
    const services = StatusTracker.services;
    const statuses = Object.values(services);
    
    const isError = statuses.some(s => s.source === 'error');
    const isCached = statuses.some(s => s.source === 'cache' || s.source === 'stale-cache' || s.source === 'unknown');
    const isAllLive = statuses.every(s => s.source === 'network');

    el.classList.remove('live', 'cached', 'error');

    if (isError) {
      el.classList.add('error');
    } else if (isCached) {
      el.classList.add('cached');
    } else if (isAllLive) {
      el.classList.add('live');
    }

    const tooltip = statuses.map(s => {
      let statusText = '—';
      if (s.source === 'network') statusText = '✅ Live';
      else if (s.source === 'cache' || s.source === 'stale-cache') {
        const time = s.timestamp ? Util.formatTime(s.timestamp, I18n.locale) : 'unbekannt';
        statusText = `🟠 Cache (${time})`;
      } else if (s.source === 'error') statusText = '❌ Fehler';
      else if (s.source === 'unknown') statusText = '⏳ Warte...';
      
      return `${s.label}: ${statusText}`;
    }).join('\n');

    el.title = tooltip;
  },
  toast(message, type = 'info') {
    console.log('Toast:', message);
    const container = document.getElementById('toastContainer') || this.els.toastContainer;
    if (!container) {
      console.warn('Toast failed: no container');
      return;
    }
    const node = document.createElement('div');
    node.className = `toast toast-${type}`;
    node.textContent = message;
    container.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  },
  setClock() {
    if (this.els.liveClock) this.els.liveClock.textContent = new Date().toLocaleTimeString(I18n.locale);
  },
  weatherMeta(code) {
    return this.weathercodes[String(code)] || this.weathercodes.default;
  },
  airspaceLabel(result) {
    if (!result) return I18n.t('airspace.checking');
    if (result.status === 'clear') return I18n.t('airspace.clear');
    if (result.status === 'advisory') return I18n.t('airspace.advisory');
    if (result.status === 'restricted') return I18n.t('airspace.restricted');
    if (result.status === 'overlay') return I18n.t('airspace.overlayOnly');
    if (result.status === 'outside') return I18n.t('airspace.outside');
    return I18n.t('airspace.error');
  },
  airspaceText(result) {
    if (!result) return I18n.t('airspace.checkingText');
    if (result.status === 'clear') return I18n.t('airspace.clearText');
    if (result.status === 'advisory') return I18n.t('airspace.advisoryText');
    if (result.status === 'restricted') return I18n.t('airspace.restrictedText');
    if (result.status === 'overlay') return I18n.t('airspace.overlayOnlyText');
    if (result.status === 'outside') return I18n.t('airspace.outsideText');
    return I18n.t('airspace.errorText');
  },
  renderAirspaceBadge(result, location) {
    const severity = result?.severity || 'caution';
    const count = result?.features?.length || 0;
    const mapUrl = AirspaceService.mapUrl(location);
    return `
      <strong>${I18n.t('airspace.title')}</strong>
      <div class="metric-grid">
        <span class="badge ${severity}">${this.airspaceLabel(result)}${count ? ` · ${count}` : ''}</span>
        ${AirspaceService.isOverlayAvailable(location) ? `<button class="btn btn-secondary btn-small" data-open-pin="${mapUrl}">${AirspaceService.openMapLabel(location)}</button>` : ''}
      </div>
    `;
  },
  renderAirspacePanel(location, result) {
    const severity = result?.severity || 'caution';
    const count = result?.features?.length || 0;
    const featureList = (result?.features || []).slice(0, 8).map(feature => `
      <li>
        <strong>${Util.escapeHtml(feature.name)}</strong>
        <span>${Util.escapeHtml(feature.layerLabel)}</span>
        ${feature.lower || feature.upper ? `<small>${Util.escapeHtml([feature.lower, feature.upper].filter(Boolean).join(' - '))}</small>` : ''}
        ${feature.legal ? `<small>${Util.escapeHtml(feature.legal)}</small>` : ''}
      </li>
    `).join('');

    return `
      <div class="airspace-card airspace-${severity}">
        <div class="airspace-head">
          <div>
            <h4>${I18n.t('airspace.title')}</h4>
            <p>${this.airspaceText(result)}</p>
          </div>
          <span class="badge ${severity}">${this.airspaceLabel(result)}${count ? ` · ${count}` : ''}</span>
        </div>
        ${featureList ? `<ul class="airspace-zones">${featureList}</ul>` : ''}
        <div class="airspace-actions">
          ${AirspaceService.isOverlayAvailable(location) ? `<button class="btn" data-open-pin="${AirspaceService.mapUrl(location)}">${AirspaceService.openMapLabel(location)}</button>` : ''}
          <span class="muted">${AirspaceService.sourceLabel(location)}</span>
        </div>
        <p class="muted airspace-disclaimer">${I18n.t('airspace.disclaimer')}</p>
      </div>
    `;
  },
  renderProfileSelect() {
    const active = ProfileManager.getActive();
    this.els.profileSelect.innerHTML = ProfileManager.getAll().map(p => `
      <option value="${p.id}" ${p.id === active.id ? 'selected' : ''}>${Util.escapeHtml(ProfileManager.getLabel(p))}</option>
    `).join('');
  },
  showSkeleton(container, type = 'dashboard') {
    if (!container) return;
    if (type === 'dashboard') {
      container.innerHTML = `
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-card"></div>
      `;
    } else if (type === 'hourly') {
      container.innerHTML = `
        <div class="hourly-scroll">
          ${Array(6).fill('<div class="skeleton" style="min-width:120px; height:150px"></div>').join('')}
        </div>
      `;
    }
  },
  renderDashboardLocationSelect() {
    const locations = LocationManager.getAll();
    const source = Storage.get(Keys.dashboardSource, '');
    this.els.dashboardLocationSelect.innerHTML = `
      <option value="">—</option>
      <option value="gps" ${source === 'gps' ? 'selected' : ''}>📡 GPS</option>
      ${locations.map(l => `<option value="${l.id}" ${source === l.id ? 'selected' : ''}>${Util.escapeHtml(l.name)}</option>`).join('')}
    `;
  },
  lastVisit(location) {
    const entry = (location.logbook || [])[0];
    if (!entry) return '—';
    return `${Util.formatDate(entry.date, I18n.locale)} · ${ProfileManager.label(entry.drone)}`;
  },
  avgWindowScore(weather, gh, which = 'morning') {
    const profile = ProfileManager.getActive();
    const start = which === 'morning' ? gh.morningStart : gh.eveningStart;
    const end = which === 'morning' ? gh.morningEnd : gh.eveningEnd;
    let scores = [];
    weather.data.hourly.time.forEach((time, i) => {
      const d = new Date(time.replace('T', ' '));
      if (d >= start && d <= end) {
        const rainSecondary = Util.getBrightSkyRain(weather.bsData, time);
        scores.push(ScoreEngine.calculate({
          wind: weather.data.hourly.windspeed_10m[i],
          gusts: weather.data.hourly.windgusts_10m[i],
          rain: weather.data.hourly.precipitation[i],
          rainSecondary,
          clouds: weather.data.hourly.cloudcover[i],
          visibility: weather.data.hourly.visibility[i],
          temp: weather.data.hourly.temperature_2m[i],
          profile
        }).score);
      }
    });
    if (!scores.length) return { score: 0, status: 'nogo' };
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const status = score >= 70 ? 'fly' : score >= 40 ? 'caution' : 'nogo';
    return { score, status };
  },
  renderSunArc(sunData, gh) {
    const sunrise = new Date(sunData.results.sunrise);
    const sunset  = new Date(sunData.results.sunset);
    const dawn    = new Date(sunData.results.civil_twilight_begin);
    const dusk    = new Date(sunData.results.civil_twilight_end);
    const now     = new Date();

    const W = 460, H = 265; // Aggressively reduced height
    const padX = 45;
    const arcBaseY = 200; // Slightly raised horizon to save space below
    const arcRadius = (W - padX * 2) / 2;
    const arcCx     = W / 2;
    const total     = dusk - dawn;

    const arcPoint = (prog) => {
      const p  = Util.clamp(prog, 0, 1);
      const ax = padX + (W - padX * 2) * p;
      const dx = ax - arcCx;
      const ry = Math.sqrt(Math.max(arcRadius * arcRadius - dx * dx, 0));
      return { x: ax, y: arcBaseY - ry };
    };

    const prg = (d) => (new Date(d) - dawn) / total;
    const progNow    = prg(now);
    const progSR     = prg(sunrise);
    const progSS     = prg(sunset);
    const progMEnd   = prg(gh.morningEnd);
    const progEStart = prg(gh.eveningStart);

    const ptDawn   = arcPoint(0);
    const ptSR     = arcPoint(progSR);
    const ptSS     = arcPoint(progSS);
    const ptDusk   = arcPoint(1);
    const ptNow    = arcPoint(Util.clamp(progNow, 0, 1));
    const ptMEnd   = arcPoint(Util.clamp(progMEnd, 0, 1));
    const ptEStart = arcPoint(Util.clamp(progEStart, 0, 1));

    const sunVisible = progNow > 0 && progNow < 1;
    const sunRisen   = progNow >= progSR && progNow <= progSS;

    const arcSeg = (p1, p2) => {
      const cp1 = Math.max(0, Math.min(1, p1));
      const cp2 = Math.max(0, Math.min(1, p2));
      if (cp1 >= cp2) return '';
      const a = arcPoint(cp1);
      const b = arcPoint(cp2);
      return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${arcRadius} ${arcRadius} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    };

    const fmt = (d) => new Date(d).toLocaleTimeString(I18n.locale, { hour: '2-digit', minute: '2-digit' });
    const uid = `sa${Math.random().toString(36).slice(2, 7)}`;

    // Robust collision detection and staggering for labels
    const rawLabels = [
      { text: fmt(dawn),    x: ptDawn.x, fill: 'rgba(150,170,255,0.9)', dot: 'rgba(130,160,255,1)' },
      { text: fmt(sunrise), x: ptSR.x,   fill: 'rgba(100,230,180,1)',    dot: 'rgba(80,220,160,1)'  },
      { text: fmt(sunset),  x: ptSS.x,   fill: 'rgba(255,145,80,1)',     dot: 'rgba(255,120,60,1)'  },
      { text: fmt(dusk),    x: ptDusk.x, fill: 'rgba(150,170,255,0.9)', dot: 'rgba(130,160,255,1)' },
    ];

    const processedLabels = [];
    const minXDist = 52; // Minimum horizontal distance between labels
    const ySteps = [18, 36, 54]; // Possible Y offsets

    rawLabels.forEach((l, i) => {
      let level = 0;
      let collision = true;
      
      while (collision && level < ySteps.length) {
        collision = processedLabels.some(prev => 
          prev.level === level && Math.abs(prev.x - l.x) < minXDist
        );
        if (collision) level++;
      }

      // Edge anchoring logic
      let anchor = 'middle';
      if (i === 0) anchor = 'start';
      if (i === rawLabels.length - 1) anchor = 'end';

      processedLabels.push({ 
        ...l, 
        y: arcBaseY + ySteps[level], 
        level, 
        anchor 
      });
    });

    const ghMidX = ((ptDawn.x + ptMEnd.x) / 2).toFixed(1);
    const ghEMidX = ((ptEStart.x + ptDusk.x) / 2).toFixed(1);
    const ghY = (arcBaseY - 18).toFixed(1);

    const sunX = ptNow.x.toFixed(1), sunY = ptNow.y.toFixed(1);
    const sunR = sunRisen ? 10 : 7;
    const sunFill = sunRisen ? 'rgba(255,214,80,1)' : 'rgba(180,190,230,0.7)';
    const sunOp   = sunRisen ? '1' : '0.5';
    const nightX  = (progNow < 0 ? ptDawn.x : ptDusk.x).toFixed(1);

    const travelSeg  = arcSeg(0, Math.min(progNow, 1));
    const morningSeg = arcSeg(0, progMEnd);
    const eveningSeg = arcSeg(progEStart, 1);
    const dayLitSeg  = arcSeg(progSR, progSS);
    const mghW = Math.max(0, ptMEnd.x - ptDawn.x).toFixed(1);
    const eghW = Math.max(0, ptDusk.x - ptEStart.x).toFixed(1);
    const arcH = (arcBaseY - 10).toFixed(1);

    let svg = `<svg class="sun-arc" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-label="Sonnenstandskurve">
  <defs>
    <radialGradient id="${uid}sky" cx="50%" cy="100%" r="75%">
      <stop offset="0%"   stop-color="rgba(245,188,43,0.1)"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <filter id="${uid}gh" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="3.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="${uid}sun" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="7" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#${uid}sky)"/>`;

    if (progMEnd > 0.01)
      svg += `\n  <rect x="${ptDawn.x.toFixed(1)}" y="10" width="${mghW}" height="${arcH}" fill="rgba(245,188,43,0.05)" rx="6"/>`;
    if (progEStart < 0.99)
      svg += `\n  <rect x="${ptEStart.x.toFixed(1)}" y="10" width="${eghW}" height="${arcH}" fill="rgba(255,100,40,0.05)" rx="6"/>`;

    svg += `
  <line x1="${(padX - 10)}" y1="${arcBaseY}" x2="${(W - padX + 10)}" y2="${arcBaseY}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
  <path d="M ${padX} ${arcBaseY} A ${arcRadius} ${arcRadius} 0 0 1 ${W - padX} ${arcBaseY}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round"/>`;

    if (dayLitSeg)
      svg += `\n  <path d="${dayLitSeg}" fill="none" stroke="rgba(255,230,140,0.18)" stroke-width="3" stroke-linecap="round"/>`;
    if (morningSeg)
      svg += `\n  <path d="${morningSeg}" fill="none" stroke="rgba(255,190,50,0.85)" stroke-width="6" stroke-linecap="round" filter="url(#${uid}gh)"/>`;
    if (eveningSeg)
      svg += `\n  <path d="${eveningSeg}" fill="none" stroke="rgba(255,110,40,0.85)" stroke-width="6" stroke-linecap="round" filter="url(#${uid}gh)"/>`;
    if (travelSeg && progNow > 0.01)
      svg += `\n  <path d="${travelSeg}" fill="none" stroke="rgba(255,220,100,0.4)" stroke-width="2.5" stroke-linecap="round"/>`;

    if (sunVisible)
      svg += `\n  <line x1="${sunX}" y1="${sunY}" x2="${sunX}" y2="${arcBaseY}" stroke="rgba(255,214,80,0.25)" stroke-width="1.5" stroke-dasharray="3 3"/>`;

    svg += '\n  ' + processedLabels.map(l => `<circle cx="${l.x.toFixed(1)}" cy="${arcBaseY}" r="4.5" fill="${l.dot}"/>`).join('\n  ');

    if (sunVisible)
      svg += `\n  <circle cx="${sunX}" cy="${sunY}" r="22" fill="rgba(255,200,50,0.1)" filter="url(#${uid}sun)"/>
  <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="${sunFill}" filter="url(#${uid}sun)"/>
  <circle cx="${sunX}" cy="${sunY}" r="5" fill="white" opacity="${sunOp}"/>`;
    else
      svg += `\n  <circle cx="${nightX}" cy="${arcBaseY}" r="10" fill="rgba(80,100,160,0.6)"/>
  <text x="${(W / 2).toFixed(1)}" y="${(arcBaseY - 20).toFixed(1)}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.35)" font-family="inherit">Sonne unter dem Horizont</text>`;

    svg += '\n  ' + processedLabels.map(l =>
      `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="${l.anchor}" font-size="9.5" fill="${l.fill}" font-family="inherit" font-weight="700">${l.text}</text>`
    ).join('\n  ');

    if (progMEnd > 0.02 && progMEnd < 0.98)
      svg += `\n  <text x="${ghMidX}" y="${ghY}" text-anchor="middle" font-size="9" fill="rgba(255,190,50,0.9)" font-family="inherit" font-weight="800">\uD83C\uDF05 GH</text>`;
    if (progEStart > 0.02 && progEStart < 0.98)
      svg += `\n  <text x="${ghEMidX}" y="${ghY}" text-anchor="middle" font-size="9" fill="rgba(255,110,40,0.9)" font-family="inherit" font-weight="800">\uD83C\uDF07 GH</text>`;

    svg += '\n</svg>';
    return svg;
  },
  renderHourly(target, weather, gh, location) {
    const profile = ProfileManager.getActive();
    const nowHour = new Date().getHours();
    const todayKey = Util.dayKey();
    const items = weather.data.hourly.time.slice(0, 48).map((time, i) => {
      const rainSecondary = Util.getBrightSkyRain(weather.bsData, time);
      const score = ScoreEngine.calculate({
        wind: weather.data.hourly.windspeed_10m[i],
        gusts: weather.data.hourly.windgusts_10m[i],
        rain: weather.data.hourly.precipitation[i],
        rainSecondary,
        clouds: weather.data.hourly.cloudcover[i],
        visibility: weather.data.hourly.visibility[i],
        temp: weather.data.hourly.temperature_2m[i],
        profile
      });
      const hDate = new Date(time.replace('T', ' '));
      const pos = App.getSolarPosition(hDate, location.lat, location.lon);
      const nd = Util.recommendND(weather.data.hourly.weathercode[i], pos.elevation);

      return {
        time,
        score,
        nd,
        meta: this.weatherMeta(weather.data.hourly.weathercode[i]),
        wind: Util.kmhToMs(weather.data.hourly.windspeed_10m[i]),
        rain: weather.data.hourly.precipitation[i],
        rainSecondary,
        temp: weather.data.hourly.temperature_2m[i],
        isGolden: GoldenHour.isWithin(time, gh),
        isNow: new Date(time.replace('T', ' ')).getHours() === nowHour && Util.dayKey(time) === todayKey
      };
    });
    const best = Math.max(...items.map(x => x.score.score));

    target.innerHTML = `
      <div class="hourly-scroll">
        ${items.map(item => `
          <article class="hour-card ${item.score.score === best ? 'best' : ''} ${item.isGolden ? 'gh' : ''} ${item.isNow ? 'now' : ''} status-${item.score.status}">
            <span class="hour-day">${new Date(item.time).toLocaleDateString(I18n.locale, { weekday: 'short' })}</span>
            <strong class="hour-time">${Util.formatTime(item.time, I18n.locale)}</strong>
            <div class="hour-icon">${item.meta.icon}</div>
            <div class="hour-temp">${item.temp}°</div>
            <div class="badge ${item.score.status} badge-sm">${item.score.score}</div>
            <div class="hour-stats">
              <span>💨 ${item.wind} m/s</span>
              <span>🌧 ${Math.max(item.rain, item.rainSecondary || 0)} mm${item.rainSecondary !== null && Math.abs(item.rain - item.rainSecondary) > 0.1 ? ` <span title="OM: ${item.rain} / BS: ${item.rainSecondary}" style="cursor:help; opacity:0.6">ⓘ</span>` : ''}</span>
            </div>
            <div class="hour-nd" style="font-size:0.7rem;margin-top:4px;font-weight:800;color:var(--blue)">📷 ${item.nd}</div>
            ${item.isGolden ? '<div class="hour-golden">🌅</div>' : ''}
            ${item.isNow ? '<div class="hour-now-dot"></div>' : ''}
          </article>
        `).join('')}
      </div>
    `;
    
    // Center current hour safely without vertical page jump
    setTimeout(() => {
      const scrollContainer = target.querySelector('.hourly-scroll');
      const nowCard = target.querySelector('.hour-card.now');
      if (scrollContainer && nowCard) {
        scrollContainer.scrollLeft = nowCard.offsetLeft - (scrollContainer.clientWidth / 2) + (nowCard.clientWidth / 2);
      }
    }, 100);
  },
  renderDashboardNone() {
    this.els.dashboardCurrentPanel.innerHTML = `<h3>${I18n.t('dashboard.current')}</h3><p>${I18n.t('dashboard.none')}</p>`;
    this.els.dashboardGoldenPanel.innerHTML = `<h3>${I18n.t('dashboard.golden')}</h3><p>${I18n.t('dashboard.none')}</p>`;
    this.els.dashboardHourlyPanel.innerHTML = `<h3>${I18n.t('dashboard.hourly')}</h3><p>${I18n.t('dashboard.none')}</p>`;
  },
  renderChecklistFormOptions() {
    this.els.checklistCategory.innerHTML = ChecklistManager.categories()
      .map(c => `<option value="${c}">${I18n.t(`check.${c}`)}</option>`)
      .join('');
  },
  drawSunLine(map, center, azimuth, color, label, dash = null) {
    if (!map || !azimuth) return;
    const rad = (azimuth - 90) * (Math.PI / 180);
    const dist = 0.015; // ca 1.5km
    const lat2 = center[0] - dist * Math.sin(rad); 
    const lon2 = center[1] + dist * Math.cos(rad);
    L.polyline([[center[0], center[1]], [lat2, lon2]], {
      color,
      weight: 4,
      dashArray: dash,
      opacity: 0.8
    }).addTo(map).bindTooltip(label);
  }
};

const App = {
  editingChecklistId: null,
  overviewMap: null,
  overviewMarkers: null,
  lastLocCount: 0,
  dashboardMap: null,
  dashboardMarker: null,
  dashboardDipulLayer: null,
  detailMap: null,
  detailMarker: null,
  detailDipulLayer: null,
  pickerMap: null,
  pickerMarker: null,
  dashboardPickerMap: null,

  openDashboardMapPicker() {
    document.getElementById('dashboardMapSection').classList.remove('hidden');
    this.initDashboardMapPicker();
    if (this.dashboardPickerMap) {
      setTimeout(() => this.dashboardPickerMap.invalidateSize(), 200);
    }
  },

  initDashboardMapPicker() {
    const locations = LocationManager.getAll();
    const container = document.getElementById('dashboardMapPicker');
    if (!container) return;

    if (this.dashboardPickerMap) {
      return;
    }

    this.dashboardPickerMap = MapManager.get('dashboardMapPicker', { preferCanvas: true });
    if (this.dashboardPickerMap && !this.dashboardPickerMap._hasTileLayer) {
      this.dashboardPickerMap.setView([51.1657, 10.4515], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.dashboardPickerMap);
      this.dashboardPickerMap._hasTileLayer = true;
    }
    MapManager.invalidate('dashboardMapPicker');

    const bounds = L.latLngBounds();
    const premiumIcon = L.divIcon({
      html: `
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ff4444"/>
          <circle cx="12" cy="9" r="3" fill="white"/>
        </svg>
      `,
      className: '', iconSize: [30, 30], iconAnchor: [15, 30]
    });

    locations.forEach(loc => {
      const marker = L.marker([loc.lat, loc.lon], { icon: premiumIcon }).addTo(this.dashboardPickerMap);
      marker.bindTooltip(Util.escapeHtml(loc.name), { 
        direction: 'top', 
        offset: [0, -25]
      });
      marker.on('click', async () => {
        Storage.set(Keys.dashboardSource, loc.id);
        Storage.set(Keys.distSource, 'home'); // Default to home distance if applicable
        document.getElementById('dashboardMapSection').classList.add('hidden');
        await this.renderDashboard();
        UI.toast(I18n.t('dashboard.locationSelected'));
      });
      bounds.extend([loc.lat, loc.lon]);
    });

    if (locations.length > 0) {
      this.dashboardPickerMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

    document.getElementById('dashboardMapClose').onclick = () => {
      document.getElementById('dashboardMapSection').classList.add('hidden');
    };
  },

  renderOverviewMap() {
    const locations = LocationManager.getAll();
    const container = document.getElementById('locationsOverviewMap');
    if (!container) return;

    // Premium Pin Icon
    const premiumIcon = L.divIcon({
      html: `
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ff4444"/>
          <circle cx="12" cy="9" r="3" fill="white"/>
        </svg>
      `,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    try {
      if (!this.overviewMap) {
        if (locations.length === 0) {
          container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.2)">Keine Spots zum Anzeigen</div>';
          return;
        }

    if (locations.length) {
      this.overviewMap = MapManager.get('locationsOverviewMap', { preferCanvas: true });
      if (this.overviewMap && !this.overviewMap._hasTileLayer) {
        this.overviewMap.setView([50.7333, 7.1], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.overviewMap);
        this.overviewMarkers = L.layerGroup().addTo(this.overviewMap);
        this.overviewMap._hasTileLayer = true;
      }
      MapManager.invalidate('locationsOverviewMap');
    }
    }
      // Only clear and redraw markers
      this.overviewMarkers.clearLayers();
      const bounds = L.latLngBounds();

      locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lon], { icon: premiumIcon }).addTo(this.overviewMarkers);
        marker.bindTooltip(Util.escapeHtml(loc.name), { 
          direction: 'top', 
          offset: [0, -25]
        });
        marker.on('click', () => this.openLocationDetail(loc.id));
        bounds.extend([loc.lat, loc.lon]);
      });

      // Fit bounds only if it's the first time or location count changed significantly
      if (locations.length > 0 && (!this.lastLocCount || this.lastLocCount !== locations.length)) {
        this.overviewMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
      
      // Always invalidate size to handle visibility changes
      if (this.overviewMap) {
        setTimeout(() => this.overviewMap.invalidateSize(), 200);
      }
    } catch (err) {
      console.error('Overview Map Error:', err);
    }
  },

  async toggleMapPicker() {
    const listView = document.getElementById('locationsListView');
    const pickerView = document.getElementById('locationsMapPickerView');
    const detailView = document.getElementById('locationsDetailView');
    const isVisible = !pickerView.classList.contains('hidden');

    if (isVisible) {
      pickerView.classList.add('hidden');
      listView.classList.remove('hidden');
    } else {
      pickerView.classList.remove('hidden');
      listView.classList.add('hidden');
      detailView.classList.add('hidden');
      this.pickerMap = MapManager.get('locationsPickerMap');
      if (this.pickerMap && !this.pickerMap._hasTileLayer) {
        this.pickerMap.setView([51.1657, 10.4515], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.pickerMap);
        this.pickerMap._hasTileLayer = true;
      }
      MapManager.invalidate('locationsPickerMap');
      this.initMapPicker();
    }
  },

  initMapPicker() {
    if (!this.pickerMap) {
      this.pickerMap = MapManager.get('locationsPickerMap');
      if (this.pickerMap && !this.pickerMap._hasTileLayer) {
        this.pickerMap.setView([51.1657, 10.4515], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.pickerMap);
        this.pickerMap._hasTileLayer = true;
      }
    }

    if (this.pickerMap) {
      setTimeout(() => this.pickerMap.invalidateSize(), 100);
      
      // Remove old click listener if any (prevent duplicates)
      this.pickerMap.off('click');
      
      this.pickerMap.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        if (this.pickerMarker) this.pickerMap.removeLayer(this.pickerMarker);
        this.pickerMarker = L.marker([lat, lng]).addTo(this.pickerMap);

        let suggestedName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const reverse = await Nominatim.reverse(lat, lng);
          if (reverse && reverse.display_name) {
            suggestedName = reverse.display_name.split(',')[0] || suggestedName;
          }
        } catch (err) { console.warn('Reverse geocode failed', err); }

        const name = prompt(I18n.t('locations.addLocation'), suggestedName);
        if (name) {
          LocationManager.add({ name, lat, lon: lng });
          UI.toast(I18n.t('detail.saved'));
          this.toggleMapPicker();
          await this.renderLocationsList();
          UI.renderDashboardLocationSelect();
        }
      });

      Util.getCurrentPosition().then(pos => {
        this.pickerMap.setView([pos.coords.latitude, pos.coords.longitude], 12);
      }).catch(() => {});
    }
  },

  async loadJson(path, fallback) {
    try {
      const res = await fetch(path);
      if (!res.ok) return fallback;
      return res.json();
    } catch (e) {
      return fallback;
    }
  },

  getSolarPosition(date, lat, lon) {
    const deg2rad = Math.PI / 180;
    const rad2deg = 180 / Math.PI;
    
    // Julian Day
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const n = jd - 2451545.0;
    
    // Sun position
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    const lambda = (L + 1.915 * Math.sin(g * deg2rad) + 0.020 * Math.sin(2 * g * deg2rad)) * deg2rad;
    const epsilon = (23.439 - 0.0000004 * n) * deg2rad;
    
    const declination = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
    const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) * rad2deg;
    
    // Sidereal Time
    const ut = (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600);
    const gmst = (6.697374558 + 0.06570982441908 * n + ut) * 15;
    const lst = gmst + lon;
    
    // Hour Angle
    let ha = (lst - ra) % 360;
    if (ha < 0) ha += 360;
    const h = ha * deg2rad;
    
    // Altitude
    const phi = lat * deg2rad;
    const sinAlt = Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(h);
    const altitude = Math.asin(sinAlt);
    
    // Azimuth (from North clockwise)
    const azimuth = Math.atan2(Math.sin(h), Math.cos(h) * Math.sin(phi) - Math.tan(declination) * Math.cos(phi)) * rad2deg + 180;
    
    return { 
      azimuth: azimuth % 360, 
      elevation: altitude * rad2deg 
    };
  },

  async init() {
    console.log('App: Starting initialization...');
    try {
      const [profiles, translations, weathercodes] = await Promise.all([
        this.loadJson(DATA_FILES.profiles, FALLBACK_PROFILES),
        this.loadJson(DATA_FILES.translations, FALLBACK_TRANSLATIONS),
        this.loadJson(DATA_FILES.weathercodes, DRONE_WEATHER_CODES_FALLBACK),
      ]);
      console.log('App: Data files loaded.', { 
        profiles: !!profiles, 
        translations: !!translations, 
        weathercodes: !!weathercodes 
      });

      I18n.init(translations);
      ProfileManager.init(profiles);
      LocationManager.init();
      ChecklistManager.init();
      UI.init(weathercodes);
      UI.applyI18n();
      UI.renderProfileSelect();
      UI.renderDashboardLocationSelect();
      UI.setClock();
      console.log('App: Core managers initialized.');

      try {
        if (typeof CloudManager !== 'undefined' && CloudManager.init) {
          await CloudManager.init();
          console.log('App: CloudManager initialized.');
        }
      } catch (e) {
        console.error('App: CloudManager init failed:', e);
      }
      
      setInterval(() => UI.setClock(), 1000);
      setInterval(() => this.refreshVisibleData(), 10 * 60 * 1000);

      this.bindEvents();
      console.log('App: Events bound.');

      const activeTab = Storage.get(Keys.activeTab, 'dashboard');
      console.log('App: Showing page:', activeTab);
      Router.showPage(activeTab);
      await this.renderAll(true);
      console.log('App: Initial render complete.');
    } catch (error) {
      console.error('App: Critical initialization error:', error);
      document.body.innerHTML = `<main style="padding:24px;color:white;font-family:sans-serif;background:#111;height:100vh">
        <h2>App konnte nicht initialisiert werden.</h2>
        <p>${error.message || error}</p>
        <pre style="font-size:12px;opacity:0.7">${error.stack || ''}</pre>
        <button onclick="location.reload()">Neu laden</button>
      </main>`;
    }
  },

  bindEvents() {
    window.onerror = (msg, url, line, col, error) => {
      console.error('Global Error:', msg, url, line, col, error);
      UI.toast(I18n.t('error.generic') || 'Ein Fehler ist aufgetreten', 'error');
      return false;
    };
    window.onunhandledrejection = (event) => {
      console.error('Unhandled Rejection:', event.reason);
      UI.toast(I18n.t('error.generic') || 'Ein Fehler ist aufgetreten', 'error');
    };

    document.getElementById('langDe').addEventListener('click', async () => {
      I18n.setLanguage('de');
      await this.renderAll();
    });
    document.getElementById('langEn').addEventListener('click', async () => {
      I18n.setLanguage('en');
      await this.renderAll();
    });

    UI.els.droneAddBtn.addEventListener('click', () => {
      this.editingDroneId = null;
      UI.els.droneForm.reset();
      UI.els.droneForm.classList.remove('hidden');
    });

    UI.els.droneCancelBtn.addEventListener('click', () => {
      UI.els.droneForm.classList.add('hidden');
    });

    UI.els.droneForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        label: UI.els.droneName.value.trim(),
        style: UI.els.droneStyle.value,
        weight: parseInt(UI.els.droneWeight.value),
        size: parseFloat(UI.els.droneSize.value),
        maxWind: parseInt(UI.els.droneMaxWind.value),
        critWind: Math.round(parseInt(UI.els.droneMaxWind.value) * 1.4),
        maxGusts: parseInt(UI.els.droneMaxGusts.value),
        critGusts: Math.round(parseInt(UI.els.droneMaxGusts.value) * 1.3),
        color: document.getElementById('global-drone-color').value,
        rainTolerance: UI.els.droneRain.value
      };

      if (this.editingDroneId) {
        ProfileManager.update(this.editingDroneId, data);
      } else {
        ProfileManager.add(data);
      }

      UI.els.droneForm.classList.add('hidden');
      await this.renderDrones();
      UI.renderProfileSelect();
      UI.renderDashboardLocationSelect();
    });

    UI.els.droneSize.addEventListener('change', (e) => {
      const size = parseFloat(e.target.value);
      const presets = {
        1.6: { wind: 12, gusts: 16 },
        2: { wind: 15, gusts: 20 },
        2.5: { wind: 18, gusts: 24 },
        3: { wind: 22, gusts: 30 },
        3.5: { wind: 28, gusts: 36 },
        5: { wind: 35, gusts: 48 },
        7: { wind: 45, gusts: 60 },
        8: { wind: 50, gusts: 68 },
        10: { wind: 55, gusts: 75 }
      };
      if (presets[size]) {
        UI.els.droneMaxWind.value = presets[size].wind;
        UI.els.droneMaxGusts.value = presets[size].gusts;
      }
    });

    UI.els.profileSelect.addEventListener('change', async (e) => {
      ProfileManager.setActive(e.target.value);
      UI.toast(I18n.t('toast.profileChanged'));
      await this.renderActivePage();
      UI.renderProfileSelect();
      UI.renderDashboardLocationSelect();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tab = btn.dataset.tab;
        Router.showPage(tab);
        Storage.set(Keys.activeTab, tab);
        await this.renderActivePage();
      });
    });

    UI.els.dashboardHomeSearchInput.addEventListener('input', (e) => doHomeBaseSearch(e.target.value));
    document.getElementById('gpsAddBtn').addEventListener('click', () => this.addLocationFromGps());
    document.getElementById('pickerBackBtn').addEventListener('click', () => this.toggleMapPicker());
    UI.els.dashboardLocationSelect.addEventListener('change', async (e) => {
      Storage.set(Keys.dashboardSource, e.target.value || 'gps');
      await this.renderDashboard();
    });

    const doSearch = Util.debounce(async (value) => {
      if (!value || value.trim().length < 2) {
        UI.els.searchSuggestions.classList.add('hidden');
        UI.els.searchSuggestions.innerHTML = '';
        return;
      }
      try {
        const results = await Nominatim.search(value.trim());
        if (!results.length) {
          UI.toast(I18n.t('toast.notFound'));
          return;
        }
        UI.els.searchSuggestions.innerHTML = results.map(item => `
          <button class="suggestion-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${Util.escapeHtml(item.display_name)}">
            ${Util.escapeHtml(item.display_name)}
          </button>
        `).join('');
        UI.els.searchSuggestions.classList.remove('hidden');

        UI.els.searchSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
          btn.addEventListener('click', async () => {
            const location = LocationManager.add({
              name: btn.dataset.name,
              lat: Number(btn.dataset.lat),
              lon: Number(btn.dataset.lon),
            });
            UI.els.searchInput.value = '';
            UI.els.searchSuggestions.innerHTML = '';
            UI.els.searchSuggestions.classList.add('hidden');
            if (location) {
              UI.renderDashboardLocationSelect();
              await this.renderLocationsList();
              await this.renderDashboard();
            }
          });
        });
      } catch (error) {
        console.error(error);
        UI.toast(I18n.t('error.searchFailed'));
      }
    }, 500);

    UI.els.searchInput.addEventListener('input', (e) => doSearch(e.target.value));

    const doHomeBaseSearch = Util.debounce(async (value) => {
      if (!value || value.trim().length < 2) {
        UI.els.dashboardHomeSuggestions.classList.add('hidden');
        UI.els.dashboardHomeSuggestions.innerHTML = '';
        return;
      }
      try {
        const results = await Nominatim.search(value.trim());
        if (!results.length) return;
        
        UI.els.dashboardHomeSuggestions.innerHTML = results.map(item => `
          <button class="suggestion-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${Util.escapeHtml(item.display_name)}">
            ${Util.escapeHtml(item.display_name)}
          </button>
        `).join('');
        UI.els.dashboardHomeSuggestions.classList.remove('hidden');

        UI.els.dashboardHomeSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
          btn.addEventListener('click', async () => {
            const base = {
              name: btn.dataset.name,
              lat: Number(btn.dataset.lat),
              lon: Number(btn.dataset.lon),
            };
            Storage.set(Keys.homeBase, base);
            UI.els.dashboardHomeSearchInput.value = '';
            UI.els.dashboardHomeSearchWrap.classList.add('hidden');
            UI.toast(I18n.t('toast.startPointSaved'));
            await this.renderDashboard();
          });
        });
      } catch (error) {
        console.error(error);
      }
    }, 500);

    UI.els.dashboardHomeBtn.addEventListener('click', () => {
      const current = Storage.get(Keys.distSource, 'gps');
      const homeBase = Storage.get(Keys.homeBase);
      
      if (current === 'home') {
        UI.els.dashboardHomeSearchWrap.classList.toggle('hidden');
        if (!UI.els.dashboardHomeSearchWrap.classList.contains('hidden')) {
          UI.els.dashboardHomeSearchInput.focus();
        }
      } else {
        Storage.set(Keys.distSource, 'home');
        if (!homeBase) {
          UI.els.dashboardHomeSearchWrap.classList.remove('hidden');
          UI.els.dashboardHomeSearchInput.focus();
        }
        this.renderDashboard();
      }
    });

    document.getElementById('dashboardUseGpsBtn').addEventListener('click', () => {
      Storage.set(Keys.distSource, 'gps');
      this.setDashboardGps();
    });

    document.getElementById('toggleLocationPickerBtn').addEventListener('click', () => {
      this.toggleMapPicker();
    });

    document.getElementById('dashboardRefreshBtn').addEventListener('click', async () => {
      UI.toast(I18n.t('dashboard.refresh'));
      
      const source = Storage.get(Keys.dashboardSource, '');
      if (source === 'gps') {
        Storage.set('drone_dashboard_gps_cache', null);
      }
      
      await this.renderDashboard(true);
    });

    document.getElementById('dashboardMapSelectBtn').addEventListener('click', () => {
      this.openDashboardMapPicker();
    });

    const pickerSearchInput = document.getElementById('pickerSearchInput');
    const pickerSuggestions = document.getElementById('pickerSearchSuggestions');

    pickerSearchInput.addEventListener('input', Util.debounce(async (e) => {
      const q = e.target.value.trim();
      if (q.length < 3) {
        pickerSuggestions.classList.add('hidden');
        return;
      }
      try {
        const results = await Nominatim.search(q);
        if (results.length > 0) {
          pickerSuggestions.innerHTML = results.map(r => `
            <div class="suggestion-item" data-lat="${r.lat}" data-lon="${r.lon}">${Util.escapeHtml(r.display_name)}</div>
          `).join('');
          pickerSuggestions.classList.remove('hidden');
        } else {
          pickerSuggestions.classList.add('hidden');
        }
      } catch (err) { console.error('Picker search error', err); }
    }, 400));

    pickerSuggestions.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (item && this.pickerMap) {
        const lat = parseFloat(item.dataset.lat);
        const lon = parseFloat(item.dataset.lon);
        this.pickerMap.setView([lat, lon], 14);
        if (this.pickerMarker) this.pickerMap.removeLayer(this.pickerMarker);
        this.pickerMarker = L.marker([lat, lon]).addTo(this.pickerMap);
        pickerSuggestions.classList.add('hidden');
        pickerSearchInput.value = item.textContent;
      }
    });

    document.getElementById('pickerSearchBtn').addEventListener('click', async () => {
      const q = pickerSearchInput.value.trim();
      if (!q) return;
      try {
        const results = await Nominatim.search(q);
        if (results.length > 0) {
          const { lat, lon } = results[0];
          this.pickerMap.setView([lat, lon], 14);
          if (this.pickerMarker) this.pickerMap.removeLayer(this.pickerMarker);
          this.pickerMarker = L.marker([lat, lon]).addTo(this.pickerMap);
          pickerSuggestions.classList.add('hidden');
        }
      } catch (err) { console.error('Picker search error', err); }
    });

    pickerSearchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') document.getElementById('pickerSearchBtn').click();
    });

    document.getElementById('detailBackBtn').addEventListener('click', async () => {
      document.getElementById('locationsDetailView').classList.add('hidden');
      document.getElementById('locationsListView').classList.remove('hidden');
      await this.renderLocationsList();
    });

    document.getElementById('checklistToggleAddBtn').addEventListener('click', () => {
      this.editingChecklistId = null;
      document.getElementById('checklistForm').classList.toggle('hidden');
      document.getElementById('checklistName').value = '';
      document.getElementById('checklistCount').value = 1;
      document.getElementById('checklistCategory').value = 'akkus';
      UI.els.checklistNotes.value = '';
      UI.els.checklistFile.value = '';
    });

    document.getElementById('checklistCancelBtn').addEventListener('click', () => {
      document.getElementById('checklistForm').classList.add('hidden');
      this.editingChecklistId = null;
    });

    document.getElementById('checklistForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const item = {
        name: document.getElementById('checklistName').value.trim(),
        count: Number(document.getElementById('checklistCount').value),
        category: document.getElementById('checklistCategory').value,
        notes: UI.els.checklistNotes.value.trim()
      };
      
      const files = Array.from(UI.els.checklistFile.files);
      if (files.length > 0) {
        item.attachments = [];
        for (const file of files) {
          if (file.size > 2 * 1024 * 1024) {
            alert(`Datei "${file.name}" zu groß (Max 2MB).`);
            continue;
          }
          const attachment = await AttachmentManager.upload(file);
          item.attachments.push(attachment);
        }
      } else if (this.editingChecklistId) {
        // Keep existing attachments if editing
        const old = ChecklistManager.getAll().find(x => x.id === this.editingChecklistId);
        if (old) {
          item.attachments = old.attachments || (old.attachment ? [{ data: old.attachment, type: old.attachmentType }] : []);
        }
      }

      if (!item.name) return;
      if (this.editingChecklistId) ChecklistManager.update(this.editingChecklistId, item);
      else ChecklistManager.add(item);
      document.getElementById('checklistForm').classList.add('hidden');
      this.editingChecklistId = null;
      UI.toast(I18n.t('toast.checkSaved'));
      await this.renderChecklist();
    });

    document.getElementById('checklistResetBtn').addEventListener('click', async () => {
      if (confirm(I18n.t('confirm.resetChecklist'))) {
        ChecklistManager.resetAll();
        await this.renderChecklist();
      }
    });

    document.addEventListener('click', async (e) => {
      const detailBtn = e.target.closest('[data-action="detail"]');
      const deleteBtn = e.target.closest('[data-action="delete"]');
      const miniCard = e.target.closest('[data-dashboard-location]');
      const checkDelete = e.target.closest('[data-check-delete]');
      const checkEdit = e.target.closest('[data-check-edit]');
      const logDelete = e.target.closest('[data-log-delete]');
      const mapsPin = e.target.closest('[data-open-pin]');
      const mapsRoute = e.target.closest('[data-open-route]');
      const dipulToggle = e.target.closest('[data-toggle-dipul]');
      const viewDoc = e.target.closest('[data-check-view]');

      if (viewDoc) {
        const id = viewDoc.dataset.checkId;
        const idx = parseInt(viewDoc.dataset.checkView);
        const item = ChecklistManager.getAll().find(x => x.id === id);
        const docs = item.attachments || (item.attachment ? [{ data: item.attachment, type: item.attachmentType }] : []);
        const doc = docs[idx];
        if (doc) {
          try {
            const url = await AttachmentManager.getFileUrl(doc);
            if (!url) return;
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              if (url.startsWith('blob:')) URL.revokeObjectURL(url);
            }, 100);
          } catch (err) {
            console.error('Mobile view error', err);
            const win = window.open();
            win.document.write(`<iframe src="${doc.url || doc.data || ''}" frameborder="0" style="width:100%; height:100%;"></iframe>`);
          }
        }
      }

      if (detailBtn) await this.openLocationDetail(detailBtn.dataset.id);
      if (deleteBtn) {
        if (confirm(I18n.t('confirm.deleteLocation'))) {
          LocationManager.remove(deleteBtn.dataset.id);
          UI.renderDashboardLocationSelect();
          await this.renderLocationsList();
          await this.renderDashboard();
        }
      }
      if (miniCard) {
        Router.showPage('locations');
        await this.openLocationDetail(miniCard.dataset.dashboardLocation);
      }
      if (checkDelete) {
        ChecklistManager.remove(checkDelete.dataset.checkDelete);
        await this.renderChecklist();
      }
      if (checkEdit) {
        this.editingChecklistId = checkEdit.dataset.checkEdit;
        await this.renderChecklist();
      }

      const checkSave = e.target.closest('[data-check-save]');
      if (checkSave) {
        const id = checkSave.dataset.checkSave;
        const name = document.getElementById(`inline-name-${id}`).value.trim();
        const count = Number(document.getElementById(`inline-count-${id}`).value);
        const category = document.getElementById(`inline-cat-${id}`).value;
        const notes = document.getElementById(`inline-notes-${id}`).value.trim();
        const fileInput = document.getElementById(`inline-file-${id}`);
        
        const item = { name, count, category, notes };
        const old = ChecklistManager.getAll().find(x => x.id === id);
        item.attachments = old ? (old.attachments || (old.attachment ? [{ data: old.attachment, type: old.attachmentType, name: 'Datei' }] : [])) : [];

        const files = Array.from(fileInput.files);
        if (files.length > 0) {
          for (const file of files) {
            if (file.size > 2 * 1024 * 1024) {
              alert(`Datei "${file.name}" zu groß (Max 2MB)`);
              continue;
            }
            const attachment = await AttachmentManager.upload(file);
            item.attachments.push(attachment);
          }
        }

        ChecklistManager.update(id, item);
        this.editingChecklistId = null;
        await this.renderChecklist();
      }

      const checkCancel = e.target.closest('[data-check-cancel]');
      if (checkCancel) {
        this.editingChecklistId = null;
        await this.renderChecklist();
      }

      const checkDelDoc = e.target.closest('[data-check-del-doc]');
      if (checkDelDoc) {
        e.stopPropagation();
        const id = checkDelDoc.dataset.checkId;
        const idx = parseInt(checkDelDoc.dataset.checkDelDoc);
        const all = ChecklistManager.getAll();
        const item = all.find(x => x.id === id);
        if (item) {
          const docs = item.attachments || (item.attachment ? [{ data: item.attachment, type: item.attachmentType, name: 'Datei' }] : []);
          item.attachments = docs;
          delete item.attachment;
          const removed = docs.splice(idx, 1)[0];
          if (removed) AttachmentManager.delete(removed);

        }
      }
      if (logDelete) {
        const locationId = Storage.get(Keys.activeLocation);
        LocationManager.removeLog(locationId, logDelete.dataset.logDelete);
        await this.renderLocationDetail(locationId);
      }

      const logEdit = e.target.closest('[data-log-edit]');
      if (logEdit) {
        this.editingLogId = logEdit.dataset.logEdit;
        const locationId = Storage.get(Keys.activeLocation);
        const loc = LocationManager.getById(locationId);
        this.renderNotesPanel(loc);
      }

      const logSave = e.target.closest('[data-log-save]');
      if (logSave) {
        const id = logSave.dataset.logSave;
        const locationId = Storage.get(Keys.activeLocation);
        const date = document.getElementById(`inline-log-date-${id}`).value;
        const drone = document.getElementById(`inline-log-drone-${id}`).value;
        const note = document.getElementById(`inline-log-note-${id}`).value.trim();
        
        LocationManager.updateLog(locationId, id, { date, drone, note });
        this.editingLogId = null;
        const loc = LocationManager.getById(locationId);
        this.renderNotesPanel(loc);
      }

      const logCancel = e.target.closest('[data-log-cancel]');
      if (logCancel) {
        this.editingLogId = null;
        const locationId = Storage.get(Keys.activeLocation);
        const loc = LocationManager.getById(locationId);
        this.renderNotesPanel(loc);
      }
      
      if (mapsPin) window.open(mapsPin.dataset.openPin, '_blank');
      if (mapsRoute) window.open(mapsRoute.dataset.openRoute, '_blank');
      if (dipulToggle) {
        const location = LocationManager.getActive();
        this.setDipulOverlayEnabled(!this.isDipulOverlayEnabled(), location);
      }
    });

    document.addEventListener('change', async (e) => {
      const checkToggle = e.target.closest('[data-check-toggle]');
      if (checkToggle) {
        const id = checkToggle.dataset.checkToggle;
        if (id.startsWith('drone_')) {
          const droneId = id.replace('drone_', '');
          const state = Storage.get(Keys.droneChecklist, {});
          state[droneId] = checkToggle.checked;
          Storage.set(Keys.droneChecklist, state);
        } else {
          ChecklistManager.update(id, { checked: checkToggle.checked });
        }
        await this.renderChecklist();
      }
    });

    // Account UI Events
    document.getElementById('accountBtn').addEventListener('click', () => {
      document.getElementById('accountPanel').classList.toggle('hidden');
    });

    document.getElementById('accountCloseBtn').addEventListener('click', () => {
      document.getElementById('accountPanel').classList.add('hidden');
    });

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const email = document.getElementById('authEmail').value;
      const pass = document.getElementById('authPassword').value;
      try { await CloudManager.login(email, pass); } catch (e) { alert(e.message); }
    });

    const changePassBtn = document.getElementById('changePasswordBtn');
    if (changePassBtn) {
      changePassBtn.addEventListener('click', async () => {
        const newPass = document.getElementById('changePasswordInput').value;
        if (!newPass || newPass.length < 6) return alert('Das Passwort muss mindestens 6 Zeichen lang sein.');
        const original = changePassBtn.textContent;
        changePassBtn.textContent = '...';
        try {
          await CloudManager.updatePassword(newPass);
          document.getElementById('changePasswordInput').value = '';
        } catch (e) {
          alert('Fehler: ' + e.message);
        } finally {
          changePassBtn.textContent = original;
        }
      });
    }

    document.getElementById('signupBtn').addEventListener('click', async () => {
      const email = document.getElementById('authEmail').value;
      const pass = document.getElementById('authPassword').value;
      try { await CloudManager.signup(email, pass); } catch (e) { alert(e.message); }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await CloudManager.logout();
    });

    document.getElementById('syncNowBtn').addEventListener('click', async () => {
      const btn = document.getElementById('syncNowBtn');
      const original = btn.textContent;
      btn.textContent = '⌛ Syncing...';
      btn.disabled = true;
      try {
        const count = await CloudManager.pushAll();
        UI.toast(`Cloud-Backup fertig (${count} Elemente)`);
      } catch (e) {
        alert('Sync Fehler: ' + e.message);
      } finally {
        btn.textContent = original;
        btn.disabled = false;
      }
    });

    document.getElementById('resetPassBtn').addEventListener('click', async () => {
      const email = document.getElementById('authEmail').value;
      if (!email) {
        alert('Bitte E-Mail Adresse eingeben.');
        return;
      }
      try {
        await CloudManager.resetPassword(email);
      } catch (e) {
        alert(e.message);
      }
    });
  },

  async setDashboardGps() {
    if (!('geolocation' in navigator)) {
      UI.toast(I18n.t('error.gpsUnavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const gpsLocation = {
        id: 'gps',
        name: 'GPS',
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };
      Storage.set(Keys.dashboardSource, 'gps');
      Storage.set('drone_dashboard_gps_cache', gpsLocation);
      await this.renderDashboard();
    }, () => UI.toast(I18n.t('error.gpsDenied')));
  },

  async addLocationFromGps() {
    if (!('geolocation' in navigator)) {
      UI.toast(I18n.t('error.gpsUnavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const reverse = await Nominatim.reverse(latitude, longitude);
        const name = reverse.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        const location = LocationManager.add({ name, lat: latitude, lon: longitude });
        if (location) {
          UI.renderDashboardLocationSelect();
          await this.renderLocationsList();
          await this.renderDashboard();
        }
      } catch (error) {
        console.error(error);
        UI.toast(I18n.t('error.searchFailed'));
      }
    }, () => UI.toast(I18n.t('error.gpsDenied')));
  },

  async resolveDashboardLocation() {
    const source = Storage.get(Keys.dashboardSource, '');
    if (source === 'gps') {
      let gps = Storage.get('drone_dashboard_gps_cache', null);
      if (!gps) {
        try {
          const pos = await Util.getCurrentPosition();
          gps = {
            id: 'gps',
            name: 'GPS Position',
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          };
          Storage.set('drone_dashboard_gps_cache', gps);
        } catch (e) {
          console.warn('GPS fetch failed in resolver', e);
          return null;
        }
      }
      return gps;
    }
    if (source) return LocationManager.getById(source);
    const locations = LocationManager.getAll();
    return locations[0] || null;
  },

  currentIndex(weatherData) {
    const currentTime = weatherData.current_weather.time;
    const idx = weatherData.hourly.time.indexOf(currentTime);
    return idx >= 0 ? idx : 0;
  },

  scoreForCurrent(weather) {
    const idx = this.currentIndex(weather.data);
    const profile = ProfileManager.getActive();
    const rainSecondary = Util.getBrightSkyRain(weather.bsData, weather.data.current_weather.time);
    return ScoreEngine.calculate({
      wind: weather.data.current_weather.windspeed,
      gusts: weather.data.hourly.windgusts_10m[idx],
      rain: weather.data.hourly.precipitation[idx],
      rainSecondary,
      clouds: weather.data.hourly.cloudcover[idx],
      visibility: weather.data.hourly.visibility[idx],
      temp: weather.data.current_weather.temperature,
      profile
    });
  },

  async renderDashboard(forceRefresh = false) {
    const location = await this.resolveDashboardLocation();
    
    // Sync the dropdown UI with the resolved location
    const currentSource = Storage.get(Keys.dashboardSource, '');
    if (!currentSource && location) {
      Storage.set(Keys.dashboardSource, location.id);
    }
    UI.renderDashboardLocationSelect();

    if (!location) {
      UI.renderDashboardNone();
      await this.renderDashboardLocationCards(forceRefresh);
      return;
    }

    // Show skeletons
    UI.showSkeleton(UI.els.dashboardCurrentPanel, 'dashboard');
    UI.showSkeleton(UI.els.dashboardGoldenPanel, 'dashboard');
    UI.showSkeleton(UI.els.dashboardHourlyPanel, 'hourly');

    try {
      const drone = ProfileManager.getActive();
      const now = new Date();
      const [weather, sunToday, sunTomorrow] = await Promise.all([
        WeatherService.get(location, forceRefresh),
        SunService.get(location, now, forceRefresh),
        SunService.get(location, new Date(now.getTime() + 86400000), forceRefresh)
      ]);
      
      StatusTracker.update('weather', weather.source, weather.timestamp);
      StatusTracker.update('sun', sunToday.source, sunToday.timestamp);

      const ghToday = GoldenHour.calculate(sunToday.data.results);
      const ghTomorrow = GoldenHour.calculate(sunTomorrow.data.results);

      const upcoming = [];
      // Today
      if (ghToday.morningEnd > now) upcoming.push({ type: 'morning', start: ghToday.morningStart, end: ghToday.morningEnd, dateLabel: 'Heute' });
      if (ghToday.eveningEnd > now) upcoming.push({ type: 'evening', start: ghToday.eveningStart, end: ghToday.eveningEnd, dateLabel: 'Heute' });
      // Tomorrow
      if (ghTomorrow.morningEnd > now) upcoming.push({ type: 'morning', start: ghTomorrow.morningStart, end: ghTomorrow.morningEnd, dateLabel: 'Morgen' });
      if (ghTomorrow.eveningEnd > now) upcoming.push({ type: 'evening', start: ghTomorrow.eveningStart, end: ghTomorrow.eveningEnd, dateLabel: 'Morgen' });

      const nextTwo = upcoming.sort((a, b) => a.start - b.start).slice(0, 2);
      
      console.log('GoldenHour Debug:', { now: now.toISOString(), upcomingCount: upcoming.length, nextTwo });

      const useTomorrow = now > ghToday.eveningEnd;
      const gh = useTomorrow ? ghTomorrow : ghToday;
      const sun = useTomorrow ? sunTomorrow : sunToday;

      const idx = this.currentIndex(weather.data);
      const score = this.scoreForCurrent(weather);
      const meta = UI.weatherMeta(weather.data.current_weather.weathercode);
      const dashWindMs = Util.kmhToMs(weather.data.current_weather.windspeed);
      const dashGustsMs = Util.kmhToMs(weather.data.hourly.windgusts_10m[idx]);
      const dashWindDir = Util.windArrow(weather.data.current_weather.winddirection);
      const posNow = this.getSolarPosition(new Date(), location.lat, location.lon);
      
      // Isolated Map Rendering
      try {
        let currentInfo = document.getElementById('dash-current-info');
        let mapContainer = document.getElementById('dashboardMap');
        let currentStats = document.getElementById('dash-current-stats');
        
        if (!currentInfo || !mapContainer || !currentStats) {
          UI.els.dashboardCurrentPanel.innerHTML = `
            <div id="dash-current-info"></div>
            <div id="dashboardMap" class="dashboard-map"></div>
            <div id="dash-current-stats"></div>
          `;
          currentInfo = document.getElementById('dash-current-info');
          mapContainer = document.getElementById('dashboardMap');
          currentStats = document.getElementById('dash-current-stats');
        }

        currentInfo.innerHTML = `
          <div class="score-hero">
            <div>
              <h3>${I18n.t('dashboard.current')}</h3>
              <p><strong>${Util.escapeHtml(location.name)}</strong> <span class="muted">mit</span> <strong>${Util.escapeHtml(ProfileManager.getLabel(drone))}</strong></p>
              <p class="muted">📍 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}<span id="dashboardTravelTime"></span></p>
              ${AirspaceService.isOverlayAvailable(location) ? `<div class="info-list mt-8"><button class="btn btn-secondary btn-small" data-toggle-dipul>${this.isDipulOverlayEnabled() ? I18n.t('airspace.overlayOn') : I18n.t('airspace.overlayOff')}</button></div>` : ''}
            </div>
          </div>
        `;
        this.updateDipulToggle();

        currentStats.innerHTML = `
          <div class="weather-row" style="margin-top: 20px;">
            <span style="font-size:2rem">${meta.icon}</span>
            <div>
              <strong style="font-size:1.5rem">${weather.data.current_weather.temperature} °C</strong>
              <span class="muted" style="margin-left:8px">${meta[I18n.lang]}</span>
            </div>
            <div class="badge ${score.status}" style="margin-left:auto">${I18n.t(`status.${score.status}`)} · ${score.score}</div>
          </div>
          <div class="metric-grid">
            <div class="kpi"><span>${I18n.t('weather.wind')} 10m</span><strong>${dashWindMs} <small>m/s</small> ${dashWindDir}</strong></div>
            <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${dashGustsMs} <small>m/s</small></strong></div>
            <div class="kpi"><span>ND Filter</span><strong>${Util.recommendND(weather.data.current_weather.weathercode, posNow.elevation)}</strong></div>
          </div>
          <div class="wind-alt-bar">
            <span class="muted">Wind 80m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_80m[idx])} m/s</strong>
            <span class="muted">120m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_120m[idx])} m/s</strong>
          </div>
          <div class="tag-list mt-12">
            ${score.factors.map(f => `<span class="tag ${f.severity}">${Util.escapeHtml(f.label)}</span>`).join('')}
          </div>
          <p class="mt-12 muted">${I18n.t('detail.updated')}: ${Util.formatTime(new Date(), I18n.locale)}</p>
        `;

        // Optimized Map Handling: Reuse instance if possible
        if (mapContainer) {
          if (this.dashboardMap && this.dashboardMap.getContainer() === mapContainer) {
            // Map already initialized on this specific div
            this.dashboardMap.setView([location.lat, location.lon], 13);
            this.dashboardMarker.setLatLng([location.lat, location.lon]);
            setTimeout(() => this.dashboardMap.invalidateSize(), 200);
          } else {
            // Robust map initialization
            if (this.dashboardMap) {
              try { this.dashboardMap.remove(); } catch (e) {}
              MapManager.destroy('dashboardMap');
              this.dashboardMap = null;
            }
            
            this.dashboardMap = MapManager.get(mapContainer, { 
              zoomControl: false, 
              attributionControl: false, 
              preferCanvas: true 
            });
            if (this.dashboardMap && !this.dashboardMap._hasTileLayer) {
              this.dashboardMap.setView([location.lat, location.lon], 13);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.dashboardMap);
              this.dashboardMap._hasTileLayer = true;
            }
          }
          
          if (this.dashboardMap) {
            if (this.dashboardMarker) this.dashboardMap.removeLayer(this.dashboardMarker);
            this.dashboardMarker = L.marker([location.lat, location.lon], { 
              icon: L.divIcon({
                html: `<div style="background:var(--blue);width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px var(--blue)"></div>`,
                className: '', iconSize: [12, 12]
              })
            }).addTo(this.dashboardMap);
            this.dashboardMap.setView([location.lat, location.lon]);
            MapManager.invalidate(mapContainer);
          }
          this.syncDashboardDipulOverlay(location);
          UI.addSunToMap(this.dashboardMap, location, sunToday.data.results, ghToday, posNow);
        }
      } catch (mapError) {
        console.error('Isolated Map Error:', mapError);
        // Map failure shouldn't block weather data
      }

      // Async travel time
      if (location.id !== 'gps') {
        const homeBase = Storage.get(Keys.homeBase);
        const distSource = Storage.get(Keys.distSource, homeBase ? 'home' : 'gps');
        
        let getStart;
        if (distSource === 'home') {
          UI.els.dashboardHomeBtn.classList.add('btn-active');
          getStart = homeBase ? Promise.resolve({ ...homeBase, suffix: ' (Home)' }) : Promise.resolve(null);
        } else {
          UI.els.dashboardHomeBtn.classList.remove('btn-active');
          getStart = Util.getCurrentPosition()
            .then(pos => ({ lat: pos.coords.latitude, lon: pos.coords.longitude, suffix: '' }))
            .catch(() => homeBase ? { ...homeBase, suffix: ' (Home)' } : null);
        }

        getStart.then(async start => {
          if (!start) return;
          const time = await Util.getTravelTime(start.lat, start.lon, location.lat, location.lon);
          if (time) {
            const el = document.getElementById('dashboardTravelTime');
            if (el) {
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lon}&destination=${location.lat},${location.lon}&travelmode=driving`;
              el.innerHTML = ` · 🚗 ${time} Min.${start.suffix} <a href="${mapsUrl}" target="_blank" class="nav-link-small" title="Route in Google Maps öffnen">🗺️</a>`;
            }
          }
        }).catch(() => {});
      } else {
        UI.els.dashboardHomeBtn.classList.remove('btn-active');
      }

      UI.els.dashboardGoldenPanel.innerHTML = `
        <h3>${I18n.t('dashboard.golden')}</h3>
        ${nextTwo.map(w => {
           const tempGH = {
             morningStart: w.start, morningEnd: w.end,
             eveningStart: w.start, eveningEnd: w.end
           };
           const winScore = UI.avgWindowScore(weather, tempGH, 'morning');
           const countdown = now >= w.start && now <= w.end ? '—' : Util.countdown(now, w.start);
           const isActive = now >= w.start && now <= w.end;
           
           return `
            <div class="golden-window" style="margin-bottom:12px; position:relative">
              ${isActive ? `<div class="golden-active-badge" style="top:-8px; right:0">${I18n.t('sun.active')}</div>` : ''}
              <div class="golden-row">
                <div>
                  <div class="golden-label">${w.type === 'morning' ? '🌅' : '🌇'} ${I18n.t('sun.' + w.type)} <small class="muted" style="font-size:0.8rem">(${w.dateLabel})</small></div>
                  <div class="golden-time">${Util.formatTime(w.start, I18n.locale)} – ${Util.formatTime(w.end, I18n.locale)}</div>
                  <div class="muted" style="font-size:.82rem">${countdown !== '—' ? '⏱ ' + countdown : ''}</div>
                </div>
                <span class="badge ${winScore.status}">${I18n.t(`status.${winScore.status}`)} · ${winScore.score}</span>
              </div>
            </div>
           `;
        }).join('')}
        <div class="sun-arc-wrap">${UI.renderSunArc(sunToday.data, ghToday)}</div>
      `;

      UI.els.dashboardHourlyPanel.innerHTML = `<h3>${I18n.t('dashboard.hourly')}</h3><div id="dashboardHourlyInner" class=\"hourly-inner\"></div>`;
      UI.renderHourly(document.getElementById('dashboardHourlyInner'), weather, gh, location);
      
      this.renderDashboardDrone();
      this.renderDashboardChecklist();
      await this.renderDashboardLocationCards(forceRefresh);
    } catch (error) {
      console.error('Dashboard Render Error:', error);
      StatusTracker.update('weather', 'error');
      StatusTracker.update('sun', 'error');
      UI.updateStatusIndicator();
      UI.els.dashboardCurrentPanel.innerHTML = `<h3>${I18n.t('dashboard.current')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.dashboardGoldenPanel.innerHTML = `<h3>${I18n.t('dashboard.golden')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.dashboardHourlyPanel.innerHTML = `<h3>${I18n.t('dashboard.hourly')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      this.renderDashboardDrone();
      this.renderDashboardChecklist();
      await this.renderDashboardLocationCards(forceRefresh);
    }
  },

  renderDashboardDrone() {
    const drone = ProfileManager.getActive();
    if (!drone) return;
    const allProfiles = ProfileManager.getAll();
    
    UI.els.dashboardDronePanel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0">Aktive Drohne</h3>
        <button class="btn btn-secondary btn-small" onclick="Router.showPage('drones')">✎</button>
      </div>
      <div class="drone-card active" style="--drone-accent: ${drone.color || 'var(--blue)'}; padding:16px; border-radius:16px; background:rgba(255,255,255,0.02)">
        <div class="drone-header-main">
          <span style="font-size:1.8rem">🚁</span>
          <div style="display:flex; flex-direction:column">
            <strong style="font-size:1.25rem; line-height:1.2">${Util.escapeHtml(ProfileManager.getLabel(drone))}</strong>
            <span class="muted" style="font-size:0.75rem">${I18n.t('drones.style.' + (drone.style || 'freestyle'))}</span>
          </div>
        </div>
        <div class="drone-stats" style="margin-top:12px; font-size:0.85rem">
          <div><span class="muted">${I18n.t('drones.maxWind')}</span><br><strong>${drone.maxWind} m/s</strong></div>
          <div><span class="muted">${I18n.t('drones.rain')}</span><br><strong>${I18n.t('rain.' + (drone.rainTolerance || 'none'))}</strong></div>
        </div>
        
        <div class="field mt-12">
          <select id="dashboardDroneSelect" style="width:100%">
            ${allProfiles.map(p => `<option value="${p.id}" ${p.id === drone.id ? 'selected' : ''}>${Util.escapeHtml(ProfileManager.getLabel(p))}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    document.getElementById('dashboardDroneSelect').addEventListener('change', async (e) => {
      ProfileManager.setActive(e.target.value);
      UI.renderProfileSelect(); // Global select sync
      await this.renderDashboard();
      UI.toast(I18n.t('toast.profileChanged'));
    });
  },

  renderDashboardChecklist() {
    const items = ChecklistManager.getAll();
    const checked = items.filter(x => x.checked).length;
    const total = items.length;
    const prog = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    UI.els.dashboardChecklistPanel.innerHTML = `
      <h3>${I18n.t('checklist.title')}</h3>
      <div style="margin-top:16px">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px">
          <span class="muted">${checked} / ${total}</span>
          <span style="font-weight:700">${prog}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${prog}%"></div>
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-top:16px;width:100%" onclick="Router.showPage('checklist')">${I18n.t('checklist.title')} 🎒</button>
      </div>
    `;
  },

  async renderDashboardLocationCards(forceRefresh = false) {
    const locations = LocationManager.getAll();
    UI.els.dashboardLocationCardsPanel.innerHTML = `<h3>${I18n.t('dashboard.locationsOverview')}</h3>`;
    if (!locations.length) {
      UI.els.dashboardLocationCardsPanel.innerHTML += `<p>${I18n.t('empty.text')}</p>`;
      return;
    }

    const now = new Date();
    const cards = await Promise.all(locations.map(async location => {
      try {
        const [weather, sun] = await Promise.all([
          WeatherService.get(location, forceRefresh),
          SunService.get(location, now, forceRefresh)
        ]);
        const score = this.scoreForCurrent(weather);
        const meta = UI.weatherMeta(weather.data.current_weather.weathercode);
        const gh = GoldenHour.calculate({
          sunrise: sun.data.results.sunrise,
          sunset: sun.data.results.sunset,
          civilDawn: sun.data.results.civil_twilight_begin,
          civilDusk: sun.data.results.civil_twilight_end
        });

        return `
          <article class="dashboard-mini-card" data-dashboard-location="${location.id}">
            <strong>📍 ${Util.escapeHtml(location.name)}</strong>
            <div>${meta.icon} ${weather.data.current_weather.temperature}°C</div>
            <div>Score: ${score.score}</div>
            <div class="badge ${score.status}">${I18n.t(`status.${score.status}`)}</div>
            <div style="margin-top:8px">🌅 ${Util.formatTime(gh.morningStart, I18n.locale)}–${Util.formatTime(gh.morningEnd, I18n.locale)}</div>
            <div>🌇 ${Util.formatTime(gh.eveningStart, I18n.locale)}–${Util.formatTime(gh.eveningEnd, I18n.locale)}</div>
            <div class="mt-8 travel-time-mini" data-location-id="${location.id}"></div>
          </article>
        `;
      } catch (err) {
        console.error(`Dashboard Card Error for ${location.name}:`, err);
        return `
          <article class="dashboard-mini-card" data-dashboard-location="${location.id}">
            <strong>📍 ${Util.escapeHtml(location.name)}</strong>
            <p>${I18n.t('error.dataUnavailable')}</p>
          </article>
        `;
      }
    }));

    UI.els.dashboardLocationCardsPanel.innerHTML += `<div class="dashboard-mini-scroll">${cards.join('')}</div>`;

    // Populate travel times from home base
    const homeBase = Storage.get(Keys.homeBase);
    if (homeBase) {
      locations.forEach(async loc => {
        try {
          const time = await Util.getTravelTime(homeBase.lat, homeBase.lon, loc.lat, loc.lon);
          const el = UI.els.dashboardLocationCardsPanel.querySelector(`[data-location-id="${loc.id}"]`);
          if (el && time) {
            el.textContent = `🚗 ${time} Min.`;
          }
        } catch (e) {}
      });
    }
  },


  async renderLocationsList() {
    const locations = LocationManager.getAll();
    
    UI.els.locationList.innerHTML = `
      <h2>${I18n.t('list.title')}</h2>
      <p class="muted">${I18n.t('list.subtitle')}</p>
      <div id="locationListContent">
        ${locations.length ? '' : `<p class="muted">${I18n.t('empty.text')}</p>`}
      </div>
    `;

    this.renderOverviewMap();
    if (!locations.length) return;

    const listContent = document.getElementById('locationListContent');
    listContent.innerHTML = locations.map(location => `
      <article class="location-card" data-id="${location.id}">
        <div>
          <h3>${Util.escapeHtml(location.name)}</h3>
          <div class="location-meta">
            <span class="inline-pill">📍 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}</span>
            <span class="inline-pill">🗓️ ${Util.formatDate(location.createdAt, I18n.locale)}</span>
          </div>
          <p class="muted">${I18n.t('list.lastVisit')}: ${UI.lastVisit(location)}</p>
        </div>
        <div id="location-weather-${location.id}">
          <span class="metric-chip">…</span>
        </div>
        <div id="location-golden-${location.id}">
          <span class="metric-chip">…</span>
        </div>
        <div id="location-airspace-${location.id}">
          <strong>${I18n.t('airspace.title')}</strong>
          <div class="metric-grid"><span class="metric-chip">${I18n.t('airspace.checking')}</span></div>
        </div>
        <div class="inline-actions">
          <button class="btn" data-action="detail" data-id="${location.id}">${I18n.t('list.details')}</button>
          <button class="btn btn-secondary" data-action="delete" data-id="${location.id}">✕</button>
        </div>
      </article>
    `).join('');

    // Event Listeners for actions
    listContent.querySelectorAll('[data-action="detail"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openLocationDetail(btn.dataset.id);
      });
    });
    listContent.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(I18n.t('confirm.deleteLocation'))) {
          LocationManager.remove(btn.dataset.id);
          this.renderLocationsList();
        }
      });
    });
    listContent.querySelectorAll('.location-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, a, input, select, textarea')) return;
        this.openLocationDetail(card.dataset.id);
      });
    });

    this.renderLocationAirspaceBadges(locations);

    await Promise.all(locations.map(async (location) => {
      try {
        const [weather, sun] = await Promise.all([WeatherService.get(location), SunService.get(location)]);
        const score = this.scoreForCurrent(weather);
        const meta = UI.weatherMeta(weather.data.current_weather.weathercode);
        const gh = GoldenHour.calculate({
          sunrise: sun.data.results.sunrise,
          sunset: sun.data.results.sunset,
          civilDawn: sun.data.results.civil_twilight_begin,
          civilDusk: sun.data.results.civil_twilight_end
        });

        const weatherEl = document.getElementById(`location-weather-${location.id}`);
        const goldenEl = document.getElementById(`location-golden-${location.id}`);
        if (weatherEl) weatherEl.innerHTML = `
          <strong>${I18n.t('list.liveWeather')}</strong>
          <div class="metric-grid">
            <span class="metric-chip">${meta.icon} ${weather.data.current_weather.temperature}°C</span>
            <span class="metric-chip">💨 ${weather.data.current_weather.windspeed} m/s</span>
            <span class="badge ${score.status}">${I18n.t(`status.${score.status}`)} · ${score.score}</span>
          </div>
        `;
        if (goldenEl) goldenEl.innerHTML = `
          <strong>${I18n.t('list.goldenHour')}</strong>
          <div class="metric-grid">
            <span class="metric-chip">🌅 ${Util.formatTime(gh.morningStart, I18n.locale)}–${Util.formatTime(gh.morningEnd, I18n.locale)}</span>
            <span class="metric-chip">🌇 ${Util.formatTime(gh.eveningStart, I18n.locale)}–${Util.formatTime(gh.eveningEnd, I18n.locale)}</span>
          </div>
        `;
      } catch (err) {
        console.error(`List Card Error for ${location.name}:`, err);
        const w = document.getElementById(`location-weather-${location.id}`);
        const g = document.getElementById(`location-golden-${location.id}`);
        if (w) w.innerHTML = `<p>${I18n.t('error.dataUnavailable')}</p>`;
        if (g) g.innerHTML = `<p>${I18n.t('error.dataUnavailable')}</p>`;
      }
    }));
  },

  async renderLocationAirspaceBadges(locations) {
    await Promise.all(locations.map(async (location) => {
      const el = document.getElementById(`location-airspace-${location.id}`);
      if (!el) return;
      const result = await AirspaceService.check(location);
      const currentEl = document.getElementById(`location-airspace-${location.id}`);
      if (currentEl) currentEl.innerHTML = UI.renderAirspaceBadge(result, location);
    }));
  },

  async renderDetailAirspace(location) {
    const panel = document.getElementById('detailAirspacePanel');
    if (!panel) return;
    const result = await AirspaceService.check(location);
    if (Storage.get(Keys.activeLocation) !== location.id) return;
    const currentPanel = document.getElementById('detailAirspacePanel');
    if (currentPanel) currentPanel.outerHTML = UI.renderAirspacePanel(location, result);
  },

  isDipulOverlayEnabled() {
    return Storage.get(Keys.dipulOverlay, true) !== false;
  },

  setDipulOverlayEnabled(enabled, location = null) {
    Storage.set(Keys.dipulOverlay, enabled);
    this.syncDipulOverlay(location || LocationManager.getActive());
    this.syncDashboardDipulOverlay();
    this.updateDipulToggle();
  },

  updateDipulToggle() {
    const enabled = this.isDipulOverlayEnabled();
    document.querySelectorAll('[data-toggle-dipul]').forEach(btn => {
      btn.classList.toggle('btn-active', enabled);
      btn.textContent = enabled ? I18n.t('airspace.overlayOn') : I18n.t('airspace.overlayOff');
    });
  },

  syncDipulOverlay(location) {
    this.syncAirspaceOverlay(this.detailMap, 'detailDipulLayer', location);
  },

  async syncDashboardDipulOverlay(location = null) {
    const activeLocation = location || await this.resolveDashboardLocation();
    this.syncAirspaceOverlay(this.dashboardMap, 'dashboardDipulLayer', activeLocation);
  },

  syncAirspaceOverlay(map, layerProp, location) {
    if (!map || typeof L === 'undefined') return;
    const handlerProp = `${layerProp}Handler`;
    const mapProp = `${layerProp}Map`;
    if (this[handlerProp] && this[mapProp]) {
      this[mapProp].off('moveend zoomend', this[handlerProp]);
      this[handlerProp] = null;
      this[mapProp] = null;
    }
    if (this[layerProp]) {
      map.removeLayer(this[layerProp]);
      this[layerProp] = null;
    }
    const provider = location ? AirspaceService.provider(location) : null;
    if (!provider || !this.isDipulOverlayEnabled()) return;

    if (provider === 'dipul') {
      this[layerProp] = L.tileLayer.wms(AirspaceService.wmsUrl, {
        layers: AirspaceService.layers.map(layer => layer.id).join(','),
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        attribution: I18n.t('airspace.source')
      }).addTo(map);
      return;
    }

    if (!map.getPane('dronezonerPane')) {
      map.createPane('dronezonerPane');
      map.getPane('dronezonerPane').style.zIndex = 430;
    }

    const group = L.layerGroup().addTo(map);
    this[layerProp] = group;
    const refresh = Util.debounce(() => this.populateDronezonerOverlay(map, group, layerProp), 350);
    this[handlerProp] = refresh;
    this[mapProp] = map;
    map.on('moveend zoomend', refresh);
    setTimeout(refresh, 150);
  },

  async populateDronezonerOverlay(map, group, layerProp) {
    if (this[layerProp] !== group) return;
    group.clearLayers();
    const bounds = this.paddedDronezonerBounds(map);
    const geometry = [
      bounds.getWest().toFixed(6),
      bounds.getSouth().toFixed(6),
      bounds.getEast().toFixed(6),
      bounds.getNorth().toFixed(6)
    ].join(',');

    await Promise.all(AirspaceService.dronezonerLayers.map(async layer => {
      const params = new URLSearchParams({
        f: 'geojson',
        where: '1=1',
        geometry,
        geometryType: 'esriGeometryEnvelope',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'typeId,title,name,Type,Paragraf,Buffer_Zone,NOTAMtxt,LimitFod,LimitMeter',
        returnGeometry: 'true',
        outSR: '4326',
        resultRecordCount: '500'
      });

      try {
        const res = await fetch(`${layer.url}/query?${params.toString()}`);
        if (!res.ok) throw new Error(`Dronezoner ${res.status}`);
        const data = await res.json();
        if (this[layerProp] !== group || !data.features?.length) return;
        L.geoJSON(data, {
          pane: 'dronezonerPane',
          style: () => ({
            color: layer.color,
            weight: 2,
            opacity: 0.9,
            fillColor: layer.color,
            fillOpacity: layer.fillOpacity
          }),
          pointToLayer: (_feature, latlng) => L.circleMarker(latlng, {
            pane: 'dronezonerPane',
            radius: 6,
            color: layer.color,
            weight: 2,
            fillColor: layer.color,
            fillOpacity: 0.85
          }),
          onEachFeature: (feature, leafletLayer) => {
            const props = feature.properties || {};
            const name = props.title || props.typeId || props.name || layer.label;
            leafletLayer.bindTooltip(Util.escapeHtml(`${layer.label}: ${name}`));
          }
        }).addTo(group);
      } catch (error) {
        console.warn('Dronezoner overlay failed:', layer.label, error);
      }
    }));
  },

  paddedDronezonerBounds(map) {
    const bounds = map.getBounds().pad(0.7);
    const center = map.getCenter();
    const minSpan = 0.08;
    const latSpan = Math.max(bounds.getNorth() - bounds.getSouth(), minSpan);
    const lonSpan = Math.max(bounds.getEast() - bounds.getWest(), minSpan);

    return L.latLngBounds(
      [center.lat - latSpan / 2, center.lng - lonSpan / 2],
      [center.lat + latSpan / 2, center.lng + lonSpan / 2]
    );
  },

  async openLocationDetail(locationId) {
    LocationManager.setActive(locationId);
    document.getElementById('locationsDetailView').classList.remove('hidden');
    document.getElementById('locationsListView').classList.add('hidden');
    await this.renderLocationDetail(locationId);
  },

  async renderLocationDetail(locationId) {
    const location = LocationManager.getById(locationId);
    if (!location) return;
    UI.els.detailTitle.innerHTML = `
      <input type="text" id="locationNameInput" class="inline-edit-input" value="${Util.escapeHtml(location.name)}" placeholder="${I18n.t('locations.namePlaceholder')}" />
      <span id="locationNameSavedHint" class="saved-hint"></span>
    `;

    // Show skeletons
    UI.showSkeleton(UI.els.detailWeatherPanel, 'dashboard');
    UI.showSkeleton(UI.els.detailSunPanel, 'dashboard');
    UI.showSkeleton(UI.els.detailHourlyPanel, 'hourly');

    try {
      const [weather, sun] = await Promise.all([WeatherService.get(location), SunService.get(location)]);
      StatusTracker.update('weather', weather.source, weather.timestamp);
      StatusTracker.update('sun', sun.source, sun.timestamp);
      const idx = this.currentIndex(weather.data);
      const score = this.scoreForCurrent(weather);
      const meta = UI.weatherMeta(weather.data.current_weather.weathercode);
      const gh = GoldenHour.calculate({
        sunrise: sun.data.results.sunrise,
        sunset: sun.data.results.sunset,
        civilDawn: sun.data.results.civil_twilight_begin,
        civilDusk: sun.data.results.civil_twilight_end
      });

      document.getElementById('detailRouteBtnTop').onclick = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`, '_blank');

      const windMs = Util.kmhToMs(weather.data.current_weather.windspeed);
      const gustsMs = Util.kmhToMs(weather.data.hourly.windgusts_10m[idx]);
      const windDir = Util.windArrow(weather.data.current_weather.winddirection);
      UI.els.detailFlightPanel.innerHTML = `
        <h3>${I18n.t('detail.flightStatus')}</h3>
        <div class="score-hero">
          <div>
            <div class="score-value">${score.score}</div>
            <p class="muted" style="margin-top:4px">${I18n.t(`statusText.${score.status}`)}</p>
          </div>
          <div class="badge ${score.status} badge-lg">${I18n.t(`status.${score.status}`)}</div>
        </div>
        <div class="quick-stats">
          <div class="kpi"><span>${I18n.t('weather.wind')}</span><strong>${windMs} <small>m/s</small> ${windDir}</strong></div>
          <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${gustsMs} <small>m/s</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.rain')}</span><strong>${weather.data.hourly.precipitation[idx]} <small>mm</small></strong></div>
        </div>
        <div class="tag-list mt-14">
          ${score.factors.map(f => `<span class="tag ${f.severity}">${Util.escapeHtml(f.label)}</span>`).join('')}
        </div>
        <p class="mt-12 muted">${I18n.t('detail.updated')}: ${Util.formatTime(new Date(), I18n.locale)}</p>
      `;

      const posNow = this.getSolarPosition(new Date(), location.lat, location.lon);
      const posSR  = this.getSolarPosition(new Date(sun.data.results.sunrise), location.lat, location.lon);
      const posSS  = this.getSolarPosition(new Date(sun.data.results.sunset), location.lat, location.lon);
      const posGHS = this.getSolarPosition(gh.morningStart, location.lat, location.lon);
      const posGHE = this.getSolarPosition(gh.eveningEnd, location.lat, location.lon);

      let detailMapContainer = document.getElementById('detailMap');
      let detailMapInfo = document.getElementById('detailMapInfo');
      
      if (!detailMapContainer || !detailMapInfo) {
        UI.els.detailMapPanel.innerHTML = `
          <h3>${I18n.t('detail.map')}</h3>
          <div id="detailMap" style="height: 300px; margin-top: 12px; z-index: 1;"></div>
          <div id="detailMapInfo" class="info-list mt-12"></div>
          <div id="detailAirspacePanel" class="airspace-card airspace-loading mt-14">
            <div class="airspace-head">
              <div>
                <h4>${I18n.t('airspace.title')}</h4>
                <p>${I18n.t('airspace.checkingText')}</p>
              </div>
              <span class="metric-chip">${I18n.t('airspace.checking')}</span>
            </div>
          </div>
        `;
        detailMapContainer = document.getElementById('detailMap');
        detailMapInfo = document.getElementById('detailMapInfo');
      }
      if (!document.getElementById('detailAirspacePanel')) {
        detailMapInfo.insertAdjacentHTML('afterend', `
          <div id="detailAirspacePanel" class="airspace-card airspace-loading mt-14">
            <div class="airspace-head">
              <div>
                <h4>${I18n.t('airspace.title')}</h4>
                <p>${I18n.t('airspace.checkingText')}</p>
              </div>
              <span class="metric-chip">${I18n.t('airspace.checking')}</span>
            </div>
          </div>
        `);
      }
      const airspacePanel = document.getElementById('detailAirspacePanel');
      if (airspacePanel) {
        airspacePanel.className = 'airspace-card airspace-loading mt-14';
        airspacePanel.innerHTML = `
          <div class="airspace-head">
            <div>
              <h4>${I18n.t('airspace.title')}</h4>
              <p>${I18n.t('airspace.checkingText')}</p>
            </div>
            <span class="metric-chip">${I18n.t('airspace.checking')}</span>
          </div>
        `;
      }
      this.renderDetailAirspace(location);

      detailMapInfo.innerHTML = `
        <span class="inline-pill">📍 ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}</span>
        <button class="btn btn-secondary" data-open-pin="https://www.google.com/maps?q=${location.lat},${location.lon}">${I18n.t('nav.openMaps')}</button>
        <button class="btn" data-open-route="https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}">${I18n.t('nav.route')}</button>
        ${AirspaceService.isOverlayAvailable(location) ? `<button class="btn btn-secondary" data-open-pin="${AirspaceService.mapUrl(location)}">${AirspaceService.openMapLabel(location)}</button>` : ''}
        ${AirspaceService.isOverlayAvailable(location) ? `<button class="btn btn-secondary" data-toggle-dipul>${this.isDipulOverlayEnabled() ? I18n.t('airspace.overlayOn') : I18n.t('airspace.overlayOff')}</button>` : ''}
      `;
      this.updateDipulToggle();

      if (detailMapContainer) {
        if (this.detailMap && this.detailMap.getContainer() === detailMapContainer) {
          this.detailMap.setView([location.lat, location.lon], 14);
          this.detailMarker.setLatLng([location.lat, location.lon]);
        } else {
          if (this.detailMap) { this.detailMap.remove(); }
        this.detailMap = MapManager.get(detailMapContainer, { 
          zoomControl: false, 
          attributionControl: false, 
          preferCanvas: true 
        });
        if (this.detailMap && !this.detailMap._hasTileLayer) {
          this.detailMap.setView([location.lat, location.lon], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.detailMap);
          this.detailMap._hasTileLayer = true;
        }
        
        if (this.detailMap) {
          if (this.detailMarker) this.detailMap.removeLayer(this.detailMarker);
          this.detailMarker = L.marker([location.lat, location.lon], { 
            icon: L.divIcon({
              html: `<div style="background:var(--accent);width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px var(--accent)"></div>`,
              className: '', iconSize: [14, 14]
            })
          }).addTo(this.detailMap);
          this.detailMap.setView([location.lat, location.lon]);
          MapManager.invalidate(detailMapContainer);
        }
        }
        this.syncDipulOverlay(location);
        UI.addSunToMap(this.detailMap, location, sun.data.results, gh, posNow);
        setTimeout(() => this.detailMap.invalidateSize(), 200);
      }

      const detailWindMs = Util.kmhToMs(weather.data.current_weather.windspeed);
      const detailGustsMs = Util.kmhToMs(weather.data.hourly.windgusts_10m[idx]);
      const detailWindDir = Util.windArrow(weather.data.current_weather.winddirection);
      const visKm = (weather.data.hourly.visibility[idx] / 1000).toFixed(1);
      const detailRainBS = Util.getBrightSkyRain(weather.bsData, weather.data.current_weather.time);
      UI.els.detailWeatherPanel.innerHTML = `
        <h3>${I18n.t('detail.weather')}</h3>
        <div class="metric-grid">
          <div class="kpi"><span>${I18n.t('weather.temp')}</span><strong>${weather.data.current_weather.temperature} °C</strong></div>
          <div class="kpi"><span>${I18n.t('weather.feels')}</span><strong>${weather.data.hourly.apparent_temperature[idx]} °C</strong></div>
          <div class="kpi"><span>${I18n.t('weather.wind')} ${detailWindDir}</span><strong>${detailWindMs} <small>m/s</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.gusts')}</span><strong>${detailGustsMs} <small>m/s</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.humidity')}</span><strong>${weather.data.hourly.relativehumidity_2m[idx]}%</strong></div>
          <div class="kpi"><span>${I18n.t('weather.rain')}</span><strong>${Math.max(weather.data.hourly.precipitation[idx], detailRainBS || 0)} <small>mm</small>${detailRainBS !== null && Math.abs(weather.data.hourly.precipitation[idx] - detailRainBS) > 0.1 ? ` <span title="Open-Meteo: ${weather.data.hourly.precipitation[idx]} / BrightSky: ${detailRainBS}" style="cursor:help; opacity:0.6; font-size: 0.8rem">ⓘ</span>` : ''}</strong></div>
          <div class="kpi"><span>${I18n.t('weather.clouds')}</span><strong>${weather.data.hourly.cloudcover[idx]}%</strong></div>
          <div class="kpi"><span>${I18n.t('weather.visibility')}</span><strong>${visKm} <small>km</small></strong></div>
          <div class="kpi"><span>${I18n.t('weather.pressure')}</span><strong>${weather.data.hourly.surface_pressure[idx]} <small>hPa</small></strong></div>
        </div>
        <div class="wind-alt-bar">
          <span class="muted">Wind 80m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_80m[idx])} m/s</strong>
          <span class="muted">120m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_120m[idx])} m/s</strong>
        </div>
        <p class="mt-12">${meta.icon} ${meta[I18n.lang]}</p>
      `;

      const nextCountdown = gh.isActiveNow
        ? Util.countdown(new Date(), gh.whichPhase === 'morning' ? gh.morningEnd : gh.eveningEnd)
        : (gh.nextGolden ? Util.countdown(new Date(), gh.nextGolden) : '—');

      const sunrise = new Date(sun.data.results.sunrise);
      const sunset = new Date(sun.data.results.sunset);
      const dayMinutes = Math.round((sunset - sunrise) / 60000);
      UI.els.detailSunPanel.innerHTML = `
        <h3>${I18n.t('detail.sun')}</h3>
        <div class="sun-times">
          <span class="inline-pill">🌄 ${I18n.t('sun.dawn')}: ${Util.formatTime(sun.data.results.civil_twilight_begin, I18n.locale)}</span>
          <span class="inline-pill">🌅 ${I18n.t('sun.sunrise')}: ${Util.formatTime(sun.data.results.sunrise, I18n.locale)}</span>
          <span class="inline-pill">🌇 ${I18n.t('sun.sunset')}: ${Util.formatTime(sun.data.results.sunset, I18n.locale)}</span>
          <span class="inline-pill">🌆 ${I18n.t('sun.dusk')}: ${Util.formatTime(sun.data.results.civil_twilight_end, I18n.locale)}</span>
        </div>
        <div class="sun-arc-wrap">${UI.renderSunArc(sun.data, gh)}</div>
        <div class="metric-grid">
          <span class="metric-chip">🌅 ${Util.formatTime(gh.morningStart, I18n.locale)} – ${Util.formatTime(gh.morningEnd, I18n.locale)}</span>
          <span class="metric-chip">🌇 ${Util.formatTime(gh.eveningStart, I18n.locale)} – ${Util.formatTime(gh.eveningEnd, I18n.locale)}</span>
          <span class="metric-chip">⏱️ ${I18n.t('sun.dayLength')}: ${Math.floor(dayMinutes / 60)}h ${dayMinutes % 60}min</span>
          <span class="metric-chip">${I18n.t('sun.next')}: ${nextCountdown}</span>
        </div>
        ${gh.isActiveNow ? `<p class="mt-12"><strong>${I18n.t('sun.active')}</strong></p>` : ''}
      `;

      UI.els.detailHourlyPanel.innerHTML = `<h3>${I18n.t('detail.hourly')}</h3><div id="detailHourlyInner" class=\"hourly-inner\"></div>`;
      UI.renderHourly(document.getElementById('detailHourlyInner'), weather, gh, location);

      this.renderNotesPanel(location);
    } catch (error) {
      console.error(error);
      StatusTracker.update('weather', 'error');
      StatusTracker.update('sun', 'error');
      UI.updateStatusIndicator();
      UI.els.detailFlightPanel.innerHTML = `<h3>${I18n.t('detail.flightStatus')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailMapPanel.innerHTML = `<h3>${I18n.t('detail.map')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailWeatherPanel.innerHTML = `<h3>${I18n.t('detail.weather')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailSunPanel.innerHTML = `<h3>${I18n.t('detail.sun')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailHourlyPanel.innerHTML = `<h3>${I18n.t('detail.hourly')}</h3><p>${I18n.t('error.dataUnavailable')}</p>`;
      this.renderNotesPanel(location);
    }
  },

  renderNotesPanel(location) {
    UI.els.detailNotesPanel.innerHTML = `
      <h3>${I18n.t('detail.notesLogbook')}</h3>
      <div class="notes-grid">
        <div>
          <label class="field">
            <span>${I18n.t('detail.notes')}</span>
            <textarea id="notesArea" placeholder="${I18n.t('detail.notesPlaceholder')}">${Util.escapeHtml(location.notes || '')}</textarea>
          </label>
          <div id="notesSavedHint" class="muted"></div>
        </div>
        <div>
          <form id="logbookForm" class="field">
            <span>${I18n.t('detail.addLog')}</span>
            <div class="form-row">
              <input type="date" id="logDate" required value="${new Date().toISOString().slice(0, 10)}" />
              <select id="logDrone">
                ${ProfileManager.getAll().map(p => `<option value="${p.id}">${Util.escapeHtml(ProfileManager.getLabel(p))}</option>`).join('')}
              </select>
            </div>
            <input type="text" id="logNote" maxlength="200" placeholder="${I18n.t('detail.logPlaceholder')}" />
            <button class="btn" type="submit">${I18n.t('detail.saveEntry')}</button>
          </form>
          <div class="logbook-list mt-14">
            ${(location.logbook || []).length
              ? location.logbook.map(entry => {
                if (entry.id === this.editingLogId) {
                  return `
                    <div class="inline-edit-card panel glass" style="margin: 12px 0; padding: 16px; border: 1px solid var(--accent); animation: slideIn 0.3s ease;">
                      <h4 style="margin-bottom:12px; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--accent)">${I18n.t('common.change')}</h4>
                      <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label class="field">
                          <span>Datum</span>
                          <input type="date" id="inline-log-date-${entry.id}" value="${entry.date}" />
                        </label>
                        <label class="field">
                          <span>Drohne</span>
                          <select id="inline-log-drone-${entry.id}">
                            ${ProfileManager.getAll().map(p => `<option value="${p.id}" ${p.id === entry.drone ? 'selected' : ''}>${Util.escapeHtml(ProfileManager.getLabel(p))}</option>`).join('')}
                          </select>
                        </label>
                      </div>
                      <label class="field mt-8">
                        <span>${I18n.t('detail.notes')}</span>
                        <input type="text" id="inline-log-note-${entry.id}" value="${Util.escapeHtml(entry.note || '')}" style="width:100%" />
                      </label>
                      <div class="inline-actions mt-12" style="justify-content: flex-end; gap:10px;">
                        <button class="btn btn-secondary btn-small" data-log-cancel="${entry.id}">${I18n.t('common.cancel')}</button>
                        <button class="btn btn-small" data-log-save="${entry.id}" style="min-width:80px">💾 ${I18n.t('common.save')}</button>
                      </div>
                    </div>
                  `;
                }
                return `
                  <article class="log-entry">
                    <div>
                      <strong>${Util.formatDate(entry.date, I18n.locale)}</strong>
                      <div>${Util.escapeHtml(ProfileManager.label(entry.drone))}</div>
                      <small style="display:block; margin-top:4px; color:var(--text); opacity:0.8;">${Util.escapeHtml(entry.note || '')}</small>
                    </div>
                    <div class="inline-actions">
                      <button class="btn btn-secondary btn-small" data-log-edit="${entry.id}">✎</button>
                      <button class="btn btn-secondary btn-small" data-log-delete="${entry.id}">🗑️</button>
                    </div>
                  </article>
                `;
              }).join('')
              : `<p class="muted">${I18n.t('detail.noLogs')}</p>`
            }
          </div>
        </div>
      </div>
    `;

    const saveNotes = Util.debounce((e) => {
      LocationManager.update(location.id, { notes: e.target.value });
      const hint = document.getElementById('notesSavedHint');
      hint.textContent = I18n.t('detail.saved');
      setTimeout(() => { if (hint) hint.textContent = ''; }, 1500);
    }, 1000);

    document.getElementById('notesArea').addEventListener('input', saveNotes);
    
    const nameInput = document.getElementById('locationNameInput');
    const nameSavedHint = document.getElementById('locationNameSavedHint');
    const saveName = Util.debounce((e) => {
      const newName = e.target.value.trim() || 'Unbenannter Ort';
      LocationManager.update(location.id, { name: newName });
      nameSavedHint.textContent = I18n.t('detail.saved');
      setTimeout(() => { if (nameSavedHint) nameSavedHint.textContent = ''; }, 1500);
      UI.renderDashboardLocationSelect();
    }, 1000);
    nameInput.addEventListener('input', saveName);

    document.getElementById('logbookForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      LocationManager.addLog(location.id, {
        date: document.getElementById('logDate').value,
        drone: document.getElementById('logDrone').value,
        note: document.getElementById('logNote').value.trim()
      });
      UI.toast(I18n.t('toast.logSaved'));
      await this.renderLocationDetail(location.id);
      await this.renderLocationsList();
    });
  },

  async renderDrones() {
    const active = ProfileManager.getActive();
    UI.els.dronesList.innerHTML = ProfileManager.getAll().map(profile => {
      if (profile.id === this.editingDroneId) {
        return `
          <div class="drone-card panel glass" style="margin: 12px 0; padding: 16px; border: 1px solid var(--accent); animation: slideIn 0.3s ease;">
            <h4 style="margin-bottom:12px; font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; color:var(--accent)">${I18n.t('common.change')}</h4>
            <div class="form-grid">
              <label class="field">
                <span data-i18n="drones.name">Name</span>
                <input id="inline-drone-name-${profile.id}" type="text" value="${Util.escapeHtml(ProfileManager.getLabel(profile))}" required />
              </label>
              <label class="field">
                <span data-i18n="drones.style">Stil</span>
                <select id="inline-drone-style-${profile.id}">
                  <option value="freestyle" ${profile.style === 'freestyle' ? 'selected' : ''}>Freestyle</option>
                  <option value="cinematic" ${profile.style === 'cinematic' ? 'selected' : ''}>Cinematic</option>
                  <option value="race" ${profile.style === 'race' ? 'selected' : ''}>Race</option>
                  <option value="longrange" ${profile.style === 'longrange' ? 'selected' : ''}>Longrange</option>
                </select>
              </label>
              <label class="field">
                <span data-i18n="drones.weight">Gewicht (g)</span>
                <input id="inline-drone-weight-${profile.id}" type="number" value="${profile.weight}" required />
              </label>
              <label class="field">
                <span data-i18n="drones.size">Größe (Zoll)</span>
                <select id="inline-drone-size-${profile.id}">
                  <option value="1.6" ${profile.size == 1.6 ? 'selected' : ''}>1.6" (Whoop)</option>
                  <option value="2" ${profile.size == 2 ? 'selected' : ''}>2"</option>
                  <option value="2.5" ${profile.size == 2.5 ? 'selected' : ''}>2.5"</option>
                  <option value="3" ${profile.size == 3 ? 'selected' : ''}>3"</option>
                  <option value="3.5" ${profile.size == 3.5 ? 'selected' : ''}>3.5"</option>
                  <option value="5" ${profile.size == 5 ? 'selected' : ''}>5" (Standard)</option>
                  <option value="7" ${profile.size == 7 ? 'selected' : ''}>7" (Longrange)</option>
                  <option value="8" ${profile.size == 8 ? 'selected' : ''}>8"</option>
                  <option value="10" ${profile.size == 10 ? 'selected' : ''}>10" (Cinelifter)</option>
                </select>
              </label>
              <label class="field">
                <span data-i18n="drones.maxWind">Max Wind</span>
                <input id="inline-drone-maxwind-${profile.id}" type="number" value="${profile.maxWind}" required />
              </label>
              <label class="field">
                <span data-i18n="drones.maxGusts">Max Böen</span>
                <input id="inline-drone-maxgusts-${profile.id}" type="number" value="${profile.maxGusts}" required />
              </label>
              <div class="field">
                <span>Farbe</span>
                ${UI.renderColorPicker(profile.color || '#f5bc2b', 'inline-drone-' + profile.id)}
              </div>
              <label class="field">
                <span>Regen</span>
                <select id="inline-drone-rain-${profile.id}">
                  <option value="none" ${profile.rainTolerance === 'none' ? 'selected' : ''}>Keine</option>
                  <option value="low" ${profile.rainTolerance === 'low' ? 'selected' : ''}>Gering</option>
                  <option value="medium" ${profile.rainTolerance === 'medium' ? 'selected' : ''}>Mittel</option>
                  <option value="waterproof" ${profile.rainTolerance === 'waterproof' ? 'selected' : ''}>Wasserfest</option>
                </select>
              </label>
            </div>
            <div class="inline-actions mt-16" style="justify-content: flex-end; gap:12px;">
              <button class="btn btn-secondary" data-drone-cancel="${profile.id}">${I18n.t('common.cancel')}</button>
              <button class="btn" data-drone-save="${profile.id}" style="min-width:100px">💾 ${I18n.t('common.save')}</button>
            </div>
          </div>
        `;
      }
      const droneColor = profile.color || '#f5bc2b';
      return `
        <article class="drone-card ${profile.id === active.id ? 'active' : ''}" style="--drone-accent: ${droneColor}">
          <div class="score-hero">
            <div class="drone-header-main">
              <h3>🚀 ${Util.escapeHtml(ProfileManager.getLabel(profile))}</h3>
              ${profile.id === active.id ? `<div class="badge fly">${I18n.t('drones.active')}</div>` : ''}
            </div>
            <div class="inline-actions">
              ${profile.id !== active.id ? `<button class="btn" data-set-profile="${profile.id}">${I18n.t('drones.activate')}</button>` : ''}
              <button class="btn btn-secondary" data-edit-drone="${profile.id}">${I18n.t('drones.edit')}</button>
              <button class="btn btn-secondary" data-delete-drone="${profile.id}">✕</button>
            </div>
          </div>
          <div class="drone-stats">
            <div class="kpi"><span>${I18n.t('drones.style')}</span><strong>${I18n.t(`drones.style.${profile.style}`)}</strong></div>
            <div class="kpi"><span>${I18n.t('drones.weight')}</span><strong>${profile.weight} <small>g</small></strong></div>
            <div class="kpi"><span>${I18n.t('drones.size')}</span><strong>${profile.size} <small>Zoll</small></strong></div>
            <div class="kpi"><span>${I18n.t('drones.maxWind')}</span><strong>${profile.maxWind} <small>km/h</small></strong></div>
            <div class="kpi"><span>${I18n.t('drones.maxGusts')}</span><strong>${profile.maxGusts} <small>km/h</small></strong></div>
            <div class="kpi"><span>${I18n.t('drones.rain')}</span><strong>${I18n.t(`rain.${profile.rainTolerance}`)}</strong></div>
          </div>
        </article>
      `;
    }).join('');

    UI.els.dronesList.querySelectorAll('[data-set-profile]').forEach(btn => {
      btn.addEventListener('click', async () => {
        ProfileManager.setActive(btn.dataset.setProfile);
        UI.renderProfileSelect();
        UI.toast(I18n.t('toast.profileChanged'));
        await this.renderActivePage();
        UI.renderDashboardLocationSelect();
      });
    });

    UI.els.dronesList.querySelectorAll('[data-edit-drone]').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.editingDroneId = btn.dataset.editDrone;
        await this.renderDrones();
      });
    });

    UI.els.dronesList.querySelectorAll('[data-drone-cancel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.editingDroneId = null;
        await this.renderDrones();
      });
    });

    UI.els.dronesList.querySelectorAll('[data-drone-save]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.droneSave;
        const profile = {
          label: document.getElementById(`inline-drone-name-${id}`).value.trim(),
          style: document.getElementById(`inline-drone-style-${id}`).value,
          weight: Number(document.getElementById(`inline-drone-weight-${id}`).value),
          size: Number(document.getElementById(`inline-drone-size-${id}`).value),
          maxWind: Number(document.getElementById(`inline-drone-maxwind-${id}`).value),
          maxGusts: Number(document.getElementById(`inline-drone-maxgusts-${id}`).value),
          color: document.getElementById(`inline-drone-${id}-color`).value,
          rainTolerance: document.getElementById(`inline-drone-rain-${id}`).value
        };
        if (!profile.label) return;
        ProfileManager.update(id, profile);
        this.editingDroneId = null;
        await this.renderDrones();
        UI.renderProfileSelect();
        UI.renderDashboardLocationSelect();
      });
    });

    UI.els.dronesList.querySelectorAll('[data-delete-drone]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (ProfileManager.getAll().length <= 1) return;
        ProfileManager.remove(btn.dataset.deleteDrone);
        await this.renderDrones();
        UI.renderProfileSelect();
        UI.renderDashboardLocationSelect();
      });
    });
  },

  async renderChecklist() {
    const checkItems = ChecklistManager.getAll();
    const drones = ProfileManager.getAll();
    const droneState = Storage.get(Keys.droneChecklist, {});
    
    const virtualDrones = drones.map(d => ({
      id: 'drone_' + d.id,
      name: ProfileManager.getLabel(d),
      count: 1,
      category: 'drohnen',
      checked: !!droneState[d.id],
      isVirtual: true
    }));
    
    const items = [...virtualDrones, ...checkItems];
    const done = items.filter(i => i.checked).length;
    
    UI.els.checklistProgressText.textContent = `${done} / ${items.length}`;
    UI.els.checklistProgressBar.style.width = `${items.length ? Math.round((done / items.length) * 100) : 0}%`;

    const allCategories = ['drohnen', ...ChecklistManager.categories()];

    UI.els.checklistGroups.innerHTML = allCategories.map(cat => {
      const groupItems = items.filter(i => i.category === cat);
      if (groupItems.length === 0) return '';
      
      const finished = groupItems.filter(i => i.checked).length;
      return `
        <details class="checklist-group" open>
          <summary>${cat === 'drohnen' ? 'Drohnen' : I18n.t(`check.${cat}`)} (${finished}/${groupItems.length})</summary>
          <div class="check-items">
            ${groupItems.map(item => {
              if (item.id === this.editingChecklistId) {
                const docs = item.attachments || (item.attachment ? [{ data: item.attachment, type: item.attachmentType, name: 'Datei' }] : []);
                return `
                  <div class="inline-edit-card panel glass" style="margin: 12px 0; padding: 16px; border: 1px solid var(--accent); animation: slideIn 0.3s ease;">
                    <h4 style="margin-bottom:12px; font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; color:var(--accent)">${I18n.t('common.change')}</h4>
                    
                    <div class="notes-grid" style="display: flex; flex-direction: column; gap: 16px;">
                      <label class="field">
                        <span>${I18n.t('checklist.itemName')}</span>
                        <input id="inline-name-${item.id}" type="text" value="${Util.escapeHtml(item.name)}" />
                      </label>
                      <label class="field">
                        <span>Anz.</span>
                        <input id="inline-count-${item.id}" type="number" value="${item.count}" />
                      </label>
                    </div>

                    <label class="field mt-8">
                      <span>${I18n.t('checklist.category')}</span>
                      <select id="inline-cat-${item.id}">
                        ${ChecklistManager.categories().map(c => `<option value="${c}" ${c === item.category ? 'selected' : ''}>${I18n.t('check.' + c)}</option>`).join('')}
                      </select>
                    </label>

                    <label class="field mt-8">
                      <span>${I18n.t('checklist.notes')}</span>
                      <textarea id="inline-notes-${item.id}" style="min-height:80px">${Util.escapeHtml(item.notes || '')}</textarea>
                    </label>

                    <div class="mt-12">
                      <span class="muted" style="font-size:0.8rem; display:block; margin-bottom:4px">${I18n.t('checklist.document')}</span>
                      <div class="inline-docs-list" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                        ${docs.map((d, idx) => `
                          <div class="pill-doc" style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; display:flex; align-items:center; gap:8px; font-size:0.8rem;">
                            <span>📄 ${Util.escapeHtml(d.name || 'Dokument')}</span>
                            <button class="btn-icon" data-check-id="${item.id}" data-check-del-doc="${idx}" title="Löschen">✕</button>
                          </div>
                        `).join('')}
                      </div>
                      <input id="inline-file-${item.id}" type="file" multiple style="font-size:0.8rem" />
                    </div>

                    <div class="inline-actions mt-16" style="justify-content: flex-end; gap:12px;">
                      <button class="btn btn-secondary" data-check-cancel="${item.id}">${I18n.t('common.cancel')}</button>
                      <button class="btn" data-check-save="${item.id}" style="min-width:100px">💾 ${I18n.t('common.save')}</button>
                    </div>
                  </div>
                `;
              }
              return `
                <label class="check-item">
                  <input type="checkbox" data-check-toggle="${item.id}" ${item.checked ? 'checked' : ''} />
                  <div class="check-item-main">
                    <strong>${Util.escapeHtml(item.name)}</strong>
                    <span class="muted">×${item.count}</span>
                    ${item.notes ? `<div class="check-item-notes">${Util.escapeHtml(item.notes)}</div>` : ''}
                  </div>
                  <div class="inline-actions">
                    ${(() => {
                      const docs = item.attachments || (item.attachment ? [{ data: item.attachment, type: item.attachmentType }] : []);
                      return docs.map((d, idx) => `
                        <button class="btn btn-secondary btn-small" type="button" data-check-id="${item.id}" data-check-view="${idx}" title="${Util.escapeHtml(d.name || 'Dokument')}">👁️${docs.length > 1 ? idx + 1 : ''}</button>
                      `).join('');
                    })()}
                    ${!item.isVirtual ? `
                    <button class="btn btn-secondary btn-small" type="button" data-check-edit="${item.id}">✎</button>
                    <button class="btn btn-secondary btn-small" type="button" data-check-delete="${item.id}">🗑️</button>
                    ` : ''}
                  </div>
                </label>
              `;
            }).join('') || `<p class="muted">—</p>`}
          </div>
        </details>
      `;
    }).join('');
  },

  async renderActivePage() {
    const page = Storage.get(Keys.activeTab, 'dashboard');
    if (page === 'dashboard') await this.renderDashboard();
    if (page === 'locations') {
      await this.renderLocationsList();
      document.getElementById('locationsDetailView').classList.add('hidden');
      document.getElementById('locationsListView').classList.remove('hidden');
    }
    if (page === 'drones') await this.renderDrones();
    if (page === 'checklist') await this.renderChecklist();
  },

  async renderAll(forceRefresh = false) {
    WeatherService.cleanup();
    SunService.cleanup();
    UI.applyI18n();
    UI.renderProfileSelect();
    UI.renderDashboardLocationSelect();
    UI.renderChecklistFormOptions();
    UI.els.droneColorContainer.innerHTML = UI.renderColorPicker('#f5bc2b', 'global-drone');
    await this.renderDashboard(forceRefresh);
    await this.renderLocationsList();
    await this.renderDrones();
    await this.renderChecklist();
    // Router.showPage removed from here to avoid overwriting user navigation during async load
  },

  async refreshVisibleData() {
    await this.renderActivePage();
  }
};

window.addEventListener('error', (e) => {
  if (typeof UI !== 'undefined' && UI.toast) {
    UI.toast(`Error: ${e.message}`);
  }
});
window.addEventListener('unhandledrejection', (e) => {
  if (typeof UI !== 'undefined' && UI.toast) {
    UI.toast(`Error: ${e.reason?.message || e.reason}`);
  }
});

window.App = App;
window.UI = UI;
window.Router = Router;
window.Toast = Toast;
window.I18n = I18n;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}


