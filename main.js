import { Keys, Storage, FALLBACK_PROFILES, FALLBACK_TRANSLATIONS, DRONE_WEATHER_CODES_FALLBACK, I18n, CloudManager, ProfileManager, ChecklistManager, LocationManager, MapManager, Util, Nominatim, WeatherService, BrightSkyService, SunService, ScoreEngine, GoldenHour, Toast, Skeleton, Router, AttachmentManager } from './js/index.js';
import { NDRecommendationService } from './weather/nd/ndRecommendationService.js';

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
  dronespaceUrl: 'https://utm.dronespace.at/avm/',
  dronespaceUasUrl: 'https://utm.dronespace.at/avm/utm/uas.geojson',
  droneSafetyMapUrl: 'https://dronesafetymap.com/',
  officialDataCache: new Map(),
  officialLayerSources: {
    fr: {
      type: 'wms',
      label: 'Geoportail',
      source: 'Geoportail / DGAC',
      url: 'https://data.geopf.fr/wms-r',
      layers: 'TRANSPORTS.DRONES.RESTRICTIONS'
    },
    ie: {
      type: 'geojson',
      label: 'IAA',
      source: 'Irish Aviation Authority',
      url: 'https://www.iaa.ie/docs/default-source/default-document-library/uas/20260422_uas_zones_ireland_v2.geojson?download=true&sfvrsn=f9d5eff3_90',
      color: '#f05f4f'
    },
    nl: {
      type: 'ogc',
      label: 'GoDrone / PDOK',
      source: 'LVNL / PDOK',
      color: '#f05f4f',
      collections: [
        'luchtvaartgebieden',
        'landingsite'
      ],
      url: 'https://api.pdok.nl/lvnl/drone-no-flyzones/ogc/v1'
    },
    pt: {
      type: 'ed269',
      label: 'ANAC',
      source: 'ANAC Portugal',
      url: 'https://dnt.anac.pt/json/UASZoneVersion%2022042026083205.json',
      color: '#f05f4f'
    }
  },
  officialWebOverlays: {
    be: { label: 'Droneguide', source: 'skeyes / Droneguide', url: 'https://map.droneguide.be/' },
    gb: { label: 'UK UAS Map', source: 'Google My Maps', url: 'https://www.google.com/maps/d/embed?mid=1BktWMPYNuh6N5_IPngyq8jW80nAWXI8d' },
    is: { label: 'Dronar', source: 'Kortasja / Iceland', url: 'https://kort.gis.is/mapview/?app=dronar' },
    se: { label: 'Dronechart', source: 'LFV Dronechart', url: 'https://daim.lfv.se/echarts/dronechart/?x=1837369.50551&y=8503631.90948&z=6&r=0&l=100011111111#' }
  },
  officialMapLinks: {
    be: 'https://map.droneguide.be/',
    bg: 'https://www.caa.bg/bg/category/633/7062',
    hr: 'https://amc.crocontrol.hr/Current-situation-anonymous-users',
    cy: 'https://drones.gov.cy/geo-zones-map/',
    cz: 'https://dronemap.gov.cz/',
    ee: 'https://utm.eans.ee/',
    fi: 'https://www.droneinfo.fi/en/where-to-fly',
    fr: 'https://www.geoportail.gouv.fr/donnees/restrictions-uas-categorie-ouverte-et-aeromodelisme',
    gr: 'https://dagr.hasp.gov.gr/',
    hu: 'https://mydronespace.hu/',
    is: 'https://kort.gis.is/mapview/?app=dronar',
    ie: 'https://www.iaa.ie/general-aviation/drones/uas-geographic-zones',
    it: 'https://www.d-flight.it/new_portal/services/mappe/',
    lv: 'https://www.airspace.lv/drones',
    li: 'https://map.geo.admin.ch/#/map?topic=aviation&layers=ch.bazl.einschraenkungen-drohnen',
    lt: 'https://utm.ans.lt/',
    lu: 'https://map.geoportail.lu/',
    mt: 'https://www.transport.gov.mt/aviation/drones',
    nl: 'https://map.godrone.nl/',
    no: 'https://www.luftfartstilsynet.no/en/drones/',
    pl: 'https://dronemap.pansa.pl/',
    pt: 'https://dnt.anac.pt/mapa.html',
    ro: 'https://flightplan.romatsa.ro/init/drones',
    sk: 'https://gis.lps.sk/',
    si: 'https://caa-slovenia.maps.arcgis.com/',
    es: 'https://drones.enaire.es/',
    se: 'https://daim.lfv.se/echarts/dronechart/?x=1837369.50551&y=8503631.90948&z=6&r=0&l=100011111111#',
    gb: 'https://www.google.com/maps/d/u/0/viewer?mid=1BktWMPYNuh6N5_IPngyq8jW80nAWXI8d&femb=1&ll=55.10020820377963%2C-3.3907421047665043&z=6'
  },
  dronespaceCache: new Map(),
  swissMapUrl: 'https://map.geo.admin.ch/#/map',
  swissWmsUrl: 'https://wms.geo.admin.ch/',
  swissLayer: 'ch.bazl.einschraenkungen-drohnen',
  switzerlandPolygon: [
    [5.96, 46.13], [6.15, 46.45], [6.06, 46.86], [6.43, 47.15],
    [7.0, 47.5], [7.58, 47.6], [8.45, 47.8], [9.55, 47.54],
    [10.49, 47.0], [10.13, 46.54], [9.75, 46.31], [9.3, 46.2],
    [9.05, 45.83], [8.4, 46.0], [7.55, 45.85], [6.75, 46.0],
    [6.16, 46.1], [5.96, 46.13]
  ],
  austriaPolygon: [
    [9.53, 47.27], [10.2, 47.27], [10.45, 47.55], [11.0, 47.4],
    [11.75, 47.58], [12.75, 48.1], [13.4, 48.55], [14.75, 48.75],
    [15.0, 49.02], [16.95, 48.75], [17.16, 48.0], [16.55, 47.35],
    [15.95, 46.75], [14.75, 46.43], [13.4, 46.5], [12.1, 46.65],
    [10.6, 46.85], [9.53, 47.27]
  ],
  italyPolygon: [
    [6.6, 45.1], [7.0, 45.9], [8.6, 46.5], [10.4, 46.9],
    [12.4, 46.7], [13.7, 46.5], [13.9, 45.8], [13.6, 45.2],
    [14.6, 44.2], [15.8, 41.9], [18.4, 40.1], [18.6, 39.0],
    [17.2, 38.4], [16.0, 37.9], [15.6, 38.4], [15.1, 38.2],
    [13.2, 37.5], [12.4, 38.0], [12.9, 38.7], [12.1, 39.4],
    [10.9, 41.1], [10.3, 43.0], [9.4, 44.1], [8.4, 44.3],
    [7.5, 44.0], [6.8, 44.3], [6.6, 45.1]
  ],
  isInGermany(location) {
    const countryMatch = this.countryMatches(location, ['de'], ['deutschland', 'germany']);
    if (countryMatch !== null) return countryMatch;
    return location.lat >= 47.1 && location.lat <= 55.2 && location.lon >= 5.5 && location.lon <= 15.6;
  },
  isInDenmark(location) {
    const countryMatch = this.countryMatches(location, ['dk'], ['danmark', 'denmark', 'daenemark']);
    if (countryMatch !== null) return countryMatch;
    return location.lat >= 52.7 && location.lat <= 59.7 && location.lon >= 3.0 && location.lon <= 17.9;
  },
  isInSwitzerland(location) {
    const countryMatch = this.countryMatches(location, ['ch'], ['schweiz', 'switzerland', 'suisse', 'svizzera']);
    if (countryMatch !== null) return countryMatch;
    return location.lat >= 45.75 && location.lat <= 47.85 && location.lon >= 5.75 && location.lon <= 10.7
      && this.isPointInPolygon(location, this.switzerlandPolygon);
  },
  isInAustria(location) {
    const countryMatch = this.countryMatches(location, ['at'], ['austria', 'oesterreich', 'osterreich']);
    if (countryMatch !== null) return countryMatch;
    return location.lat >= 46.2 && location.lat <= 49.1 && location.lon >= 9.3 && location.lon <= 17.3
      && this.isPointInPolygon(location, this.austriaPolygon);
  },
  countryCode(location) {
    const countryCode = String(location.countryCode || location.address?.country_code || '').toLowerCase();
    return countryCode;
  },
  countryName(location) {
    const country = String(location.country || location.address?.country || '').toLowerCase();
    return country;
  },
  countryMatches(location, codes, names = []) {
    const countryCode = this.countryCode(location);
    if (countryCode) return codes.includes(countryCode);
    const country = this.countryName(location);
    if (country) return names.includes(country);
    return null;
  },
  overlayCountryCode(location) {
    const countryCode = this.countryCode(location);
    if (countryCode === 'uk') return 'gb';
    if (countryCode) return countryCode;
    if (this.isInFrance(location)) return 'fr';
    if (this.isInUnitedKingdom(location)) return 'gb';
    const boxes = [
      { code: 'is', minLat: 63.1, maxLat: 66.8, minLon: -25.0, maxLon: -13.0 },
      { code: 'ie', minLat: 51.2, maxLat: 55.6, minLon: -10.9, maxLon: -5.2 },
      { code: 'pt', minLat: 36.7, maxLat: 42.4, minLon: -9.7, maxLon: -6.0 },
      { code: 'nl', minLat: 50.7, maxLat: 53.8, minLon: 3.1, maxLon: 7.4 },
      { code: 'be', minLat: 49.4, maxLat: 51.6, minLon: 2.4, maxLon: 6.5 },
      { code: 'se', minLat: 55.0, maxLat: 69.3, minLon: 10.5, maxLon: 24.5 }
    ];
    const match = boxes.find(box => location.lat >= box.minLat && location.lat <= box.maxLat && location.lon >= box.minLon && location.lon <= box.maxLon);
    return match?.code || '';
  },
  isInItaly(location) {
    const countryMatch = this.countryMatches(location, ['it'], ['italia', 'italy', 'italien']);
    if (countryMatch !== null) return countryMatch;
    return location.lat >= 35.4 && location.lat <= 47.2 && location.lon >= 6.3 && location.lon <= 18.9
      && this.isPointInPolygon(location, this.italyPolygon);
  },
  isInFrance(location) {
    const countryMatch = this.countryMatches(location, ['fr'], ['frankreich', 'france']);
    if (countryMatch !== null) return countryMatch;
    return location.lat >= 41.0 && location.lat <= 51.3 && location.lon >= -5.4 && location.lon <= 9.7;
  },
  isInSpain(location) {
    const countryMatch = this.countryMatches(location, ['es'], ['spanien', 'spain', 'espana', 'españa']);
    if (countryMatch !== null) return countryMatch;
    return location.lat >= 35.8 && location.lat <= 43.9 && location.lon >= -9.5 && location.lon <= 4.4;
  },
  isInUnitedKingdom(location) {
    const countryMatch = this.countryMatches(location, ['gb', 'uk'], ['vereinigtes königreich', 'united kingdom', 'great britain']);
    if (countryMatch !== null) return countryMatch;
    return location.lat >= 49.8 && location.lat <= 60.9 && location.lon >= -8.7 && location.lon <= 2.1;
  },
  isInDroneSafetyMapCountry(location) {
    return this.isInItaly(location) || this.isInFrance(location) || this.isInSpain(location) || this.isInUnitedKingdom(location);
  },
  officialMapUrl(location) {
    return this.officialMapLinks[this.overlayCountryCode(location)] || '';
  },
  officialLayerSource(location) {
    return this.officialLayerSources[this.overlayCountryCode(location)] || null;
  },
  officialWebOverlay(location) {
    return this.officialWebOverlays[this.overlayCountryCode(location)] || null;
  },
  isPointInPolygon(location, polygon) {
    const x = location.lon;
    const y = location.lat;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      const intersects = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  },
  provider(location) {
    if (this.isInSwitzerland(location)) return 'swissgeo';
    if (this.isInAustria(location)) return 'dronespace';
    if (this.isInGermany(location)) return 'dipul';
    if (this.isInDenmark(location)) return 'dronezoner';
    if (this.officialLayerSource(location)) return 'officialdata';
    if (this.officialWebOverlay(location)) return 'officialweb';
    if (this.officialMapUrl(location)) return 'officialmap';
    return 'dronesafetymap';
  },
  isOverlayAvailable(location) {
    return !!this.provider(location);
  },
  hasInteractiveOverlay(location) {
    return ['dipul', 'dronespace', 'dronezoner', 'swissgeo', 'officialdata'].includes(this.provider(location));
  },
  mapUrl(location, radius = 1000) {
    const provider = this.provider(location);
    if (provider === 'dronezoner') return this.dronezonerUrl;
    if (provider === 'swissgeo') {
      const center = this.wgs84ToLv95(location);
      const params = new URLSearchParams({
        lang: I18n.lang === 'en' ? 'en' : 'de',
        center: `${center.easting.toFixed(2)},${center.northing.toFixed(2)}`,
        z: '7',
        topic: 'aviation',
        layers: this.swissLayer,
        bgLayer: 'ch.swisstopo.pixelkarte-grau'
      });
      return `${this.swissMapUrl}?${params.toString()}`;
    }
    if (provider === 'dronespace') return `${this.dronespaceUrl}#p=13.00/${location.lat.toFixed(6)}/${location.lon.toFixed(6)}`;
    if (provider === 'officialdata' || provider === 'officialweb') return this.officialMapUrl(location);
    if (provider === 'officialmap') return this.officialMapUrl(location);
    if (provider === 'dronesafetymap') return this.droneSafetyMapUrl;
    const zoom = radius > 1500 ? '11.0' : '13.0';
    return `https://maptool-dipul.dfs.de/geozones/@${location.lon.toFixed(7)},${location.lat.toFixed(7)},${radius}r?language=${I18n.lang === 'en' ? 'en' : 'de'}&zoom=${zoom}`;
  },
  openMapLabel(location) {
    const provider = this.provider(location);
    if (provider === 'dronezoner') return I18n.t('airspace.openDronezoner');
    if (provider === 'swissgeo') return I18n.t('airspace.openSwissGeoAdmin');
    if (provider === 'dronespace') return I18n.t('airspace.openDronespace');
    if (provider === 'officialdata' || provider === 'officialweb') return I18n.t('airspace.openOfficialMap');
    if (provider === 'officialmap') return I18n.t('airspace.openOfficialMap');
    if (provider === 'dronesafetymap') return I18n.t('airspace.openDroneSafetyMap');
    return I18n.t('airspace.openDipul');
  },
  sourceLabel(location) {
    const provider = this.provider(location);
    if (provider === 'dronezoner') return I18n.t('airspace.sourceDronezoner');
    if (provider === 'swissgeo') return I18n.t('airspace.sourceSwissGeoAdmin');
    if (provider === 'dronespace') return I18n.t('airspace.sourceDronespace');
    if (provider === 'officialdata') return `Source geodata: ${this.officialLayerSource(location)?.source || 'national UAS map'}`;
    if (provider === 'officialweb') return `Source geodata: ${this.officialWebOverlay(location)?.source || 'national UAS map'}`;
    if (provider === 'officialmap') return I18n.t('airspace.sourceOfficialMap');
    if (provider === 'dronesafetymap') return I18n.t('airspace.sourceDroneSafetyMap');
    return I18n.t('airspace.source');
  },
  wgs84ToLv95(location) {
    const latSeconds = location.lat * 3600;
    const lonSeconds = location.lon * 3600;
    const latAux = (latSeconds - 169028.66) / 10000;
    const lonAux = (lonSeconds - 26782.5) / 10000;
    const easting = 2600072.37
      + (211455.93 * lonAux)
      - (10938.51 * lonAux * latAux)
      - (0.36 * lonAux * latAux * latAux)
      - (44.54 * lonAux * lonAux * lonAux);
    const northing = 1200147.07
      + (308807.95 * latAux)
      + (3745.25 * lonAux * lonAux)
      + (76.63 * latAux * latAux)
      - (194.56 * lonAux * lonAux * latAux)
      + (119.79 * latAux * latAux * latAux);
    return { easting, northing };
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
    const provider = this.provider(location);

    if (provider === 'dronezoner') {
      const dronezoner = { status: 'overlay', severity: 'caution', features: [], source: 'Dronezoner' };
      this.cache.set(key, dronezoner);
      return dronezoner;
    }

    if (provider === 'swissgeo') {
      const swissgeo = { status: 'overlay', severity: 'caution', features: [], source: 'Swiss GeoAdmin' };
      this.cache.set(key, swissgeo);
      return swissgeo;
    }

    if (provider === 'dronespace') {
      const dronespace = { status: 'overlay', severity: 'caution', features: [], source: 'Dronespace' };
      this.cache.set(key, dronespace);
      return dronespace;
    }

    if (provider === 'dronesafetymap') {
      const droneSafetyMap = { status: 'overlay', severity: 'caution', features: [], source: 'Drone Safety Map' };
      this.cache.set(key, droneSafetyMap);
      return droneSafetyMap;
    }

    if (provider === 'officialdata') {
      const source = this.officialLayerSource(location);
      const officialData = { status: 'overlay', severity: 'caution', features: [], source: source?.source || 'Official national UAS map' };
      this.cache.set(key, officialData);
      return officialData;
    }

    if (provider === 'officialweb') {
      const source = this.officialWebOverlay(location);
      const officialWeb = { status: 'overlay', severity: 'caution', features: [], source: source?.source || 'Official national UAS map' };
      this.cache.set(key, officialWeb);
      return officialWeb;
    }

    if (provider === 'officialmap') {
      const officialMap = { status: 'overlay', severity: 'caution', features: [], source: 'Official national UAS map' };
      this.cache.set(key, officialMap);
      return officialMap;
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
  },
  dronespaceStyle(feature) {
    const restriction = String(feature?.properties?.restriction || '').toUpperCase();
    const styles = {
      PROHIBITED: { color: '#ff4d4d', fillOpacity: 0.26 },
      REQ_AUTHORISATION: { color: '#ff8a3d', fillOpacity: 0.24 },
      CONDITIONAL: { color: '#f5bc2b', fillOpacity: 0.22 },
      NO_RESTRICTION: { color: '#37b779', fillOpacity: 0.12 }
    };
    const style = styles[restriction] || { color: '#4d94ff', fillOpacity: 0.18 };
    return {
      color: style.color,
      weight: 2,
      opacity: 0.9,
      fillColor: style.color,
      fillOpacity: style.fillOpacity
    };
  },
  dronespaceTooltip(feature) {
    const props = feature?.properties || {};
    const messages = Array.isArray(props.extendedProperties?.localizedMessages) ? props.extendedProperties.localizedMessages : [];
    const localized = messages.find(item => item.language === (I18n.lang === 'en' ? 'en' : 'de-AT'))?.message;
    const message = localized || props.message || props.reason || '';
    const cleanMessage = String(message).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const vertical = [props.lower, props.upper].filter(Boolean).join(' - ');
    return [props.name, props.restriction, vertical, cleanMessage].filter(Boolean).join(' | ');
  }
};
window.AirspaceService = AirspaceService;

const HelpTooltip = {
  el: null,
  active: null,
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.el = document.createElement('div');
    this.el.id = 'helpTooltip';
    this.el.className = 'help-tooltip hidden';
    this.el.setAttribute('role', 'tooltip');
    document.body.appendChild(this.el);

    document.addEventListener('pointerover', (event) => {
      const trigger = event.target.closest('.info-dot');
      if (trigger) this.show(trigger);
    });
    document.addEventListener('pointerout', (event) => {
      if (event.target.closest('.info-dot')) this.hide();
    });
    document.addEventListener('focusin', (event) => {
      const trigger = event.target.closest('.info-dot');
      if (trigger) this.show(trigger);
    });
    document.addEventListener('focusout', (event) => {
      if (event.target.closest('.info-dot')) this.hide();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.hide();
    });
    window.addEventListener('resize', () => this.position(), { passive: true });
    window.addEventListener('scroll', () => this.position(), { passive: true });
  },

  show(trigger) {
    const text = trigger.dataset.tooltip || trigger.getAttribute('aria-label');
    const titleKey = trigger.dataset.helpTitleKey;
    if (!text && !titleKey) return;
    this.active = trigger;
    if (titleKey) {
      this.el.innerHTML = this.renderRich(trigger);
      this.el.classList.add('rich');
    } else {
      this.el.textContent = text;
      this.el.classList.remove('rich');
    }
    this.el.style.visibility = 'hidden';
    this.el.style.left = '0px';
    this.el.style.top = '0px';
    this.el.classList.remove('hidden');
    requestAnimationFrame(() => {
      this.position();
      this.el.style.visibility = 'visible';
    });
  },

  renderRich(trigger) {
    const kicker = I18n.t(trigger.dataset.helpKickerKey, '');
    const title = I18n.t(trigger.dataset.helpTitleKey, '');
    const text = I18n.t(trigger.dataset.helpTextKey, trigger.dataset.tooltip || '');
    const stepKeys = (trigger.dataset.helpStepKeys || '')
      .split(',')
      .map(key => key.trim())
      .filter(Boolean);
    const steps = stepKeys.map((key, index) => `
      <div class="tooltip-step">
        <strong>${index + 1}</strong>
        <span>${Util.escapeHtml(I18n.t(key))}</span>
      </div>
    `).join('');
    return `
      ${kicker ? `<span class="tooltip-eyebrow">${Util.escapeHtml(kicker)}</span>` : ''}
      ${title ? `<h3>${Util.escapeHtml(title)}</h3>` : ''}
      ${text ? `<p>${Util.escapeHtml(text)}</p>` : ''}
      ${steps ? `<div class="tooltip-steps">${steps}</div>` : ''}
    `;
  },

  hide() {
    this.active = null;
    if (this.el) this.el.classList.add('hidden');
  },

  position() {
    if (!this.active || !this.el || this.el.classList.contains('hidden')) return;
    const rect = this.active.getBoundingClientRect();
    const tip = this.el.getBoundingClientRect();
    const pad = 12;
    let left = rect.left + rect.width / 2 - tip.width / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - tip.width - pad));
    let top = rect.bottom + 10;
    if (top + tip.height > window.innerHeight - pad) {
      top = rect.top - tip.height - 10;
    }
    top = Math.max(pad, Math.min(top, window.innerHeight - tip.height - pad));
    this.el.style.left = `${Math.round(left)}px`;
    this.el.style.top = `${Math.round(top)}px`;
  }
};

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
      locationNameFilterInput: document.getElementById('locationNameFilterInput'),
      locationCountryFilterInput: document.getElementById('locationCountryFilterInput'),
      locationCountrySuggestions: document.getElementById('locationCountrySuggestions'),
      locationSuitabilityFilters: document.getElementById('locationSuitabilityFilters'),
      locationFilterSummary: document.getElementById('locationFilterSummary'),
      locationFilterResetBtn: document.getElementById('locationFilterResetBtn'),
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
    if (typeof CloudManager !== 'undefined' && CloudManager.updateUI) CloudManager.updateUI();
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
      <div id="detailAirspacePanel" class="airspace-card airspace-${severity}">
        <div class="airspace-head">
          <div>
            <div class="airspace-title-row">
              <h4>${I18n.t('airspace.title')}</h4>
              ${this.infoIcon('help.airspace')}
              <span class="badge ${severity} airspace-status-badge">${this.airspaceLabel(result)}${count ? ` &middot; ${count}` : ''}</span>
              ${AirspaceService.isOverlayAvailable(location) ? `<button class="btn btn-small airspace-title-action" data-open-pin="${AirspaceService.mapUrl(location)}">${AirspaceService.openMapLabel(location)}</button>` : ''}
            </div>
            <p>${this.airspaceText(result)}</p>
          </div>
        </div>
        ${featureList ? `<ul class="airspace-zones">${featureList}</ul>` : ''}
        <div class="airspace-actions">
          <span class="muted">${AirspaceService.sourceLabel(location)}</span>
        </div>
        <p class="muted airspace-disclaimer">${I18n.t('airspace.disclaimer')}</p>
      </div>
    `;
  },
  spotSuitabilityOptions() {
    return [
      { id: 'freestyle', label: I18n.t('spotStyle.freestyle') },
      { id: 'cinematic', label: I18n.t('spotStyle.cinematic') },
      { id: 'longrange', label: I18n.t('spotStyle.longrange') },
      { id: 'whoop', label: I18n.t('spotStyle.tinywhoop') },
      { id: 'racing', label: I18n.t('spotStyle.racing') },
      { id: 'cruising', label: I18n.t('spotStyle.cruising') },
      { id: 'proximity', label: I18n.t('spotStyle.proximity') },
      { id: 'training', label: I18n.t('spotStyle.training') },
      { id: 'chase', label: I18n.t('spotStyle.chase') },
      { id: 'indoor', label: I18n.t('spotStyle.indoor') }
    ];
  },
  spotSearchOptions() {
    const searchable = new Set(['freestyle', 'cinematic', 'longrange', 'racing']);
    return this.spotSuitabilityOptions().filter(option => searchable.has(option.id));
  },
  normaliseSpotSuitability(location) {
    const allowed = new Set(this.spotSuitabilityOptions().map(option => option.id));
    return Array.isArray(location?.suitability)
      ? location.suitability.filter(id => allowed.has(id))
      : [];
  },
  renderSpotSuitabilityTags(location, emptyText = '') {
    const selected = this.normaliseSpotSuitability(location);
    if (!selected.length) return emptyText ? `<span class="muted">${emptyText}</span>` : '';
    const labels = new Map(this.spotSuitabilityOptions().map(option => [option.id, option.label]));
    return `
      <div class="spot-suitability-tags">
        ${selected.map(id => `<span class="inline-pill">${Util.escapeHtml(labels.get(id) || id)}</span>`).join('')}
      </div>
    `;
  },
  renderSpotSuitabilityPicker(location) {
    const selected = new Set(this.normaliseSpotSuitability(location));
    return `
      <div class="suitability-picker">
        ${this.spotSuitabilityOptions().map(option => `
          <label class="suitability-option">
            <input type="checkbox" value="${option.id}" data-spot-suitability ${selected.has(option.id) ? 'checked' : ''} />
            <span>${Util.escapeHtml(option.label)}</span>
          </label>
        `).join('')}
      </div>
    `;
  },
  renderLocationFilterOptions(active = []) {
    if (!this.els.locationSuitabilityFilters) return;
    const selected = new Set(active);
    this.els.locationSuitabilityFilters.innerHTML = this.spotSearchOptions().map(option => `
      <label class="suitability-option">
        <input type="checkbox" value="${option.id}" data-location-filter-suitability ${selected.has(option.id) ? 'checked' : ''} />
        <span>${Util.escapeHtml(option.label)}</span>
      </label>
    `).join('');
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
    const placeholder = this.els.dashboardLocationSelect.querySelector('option[value=""]');
    if (placeholder) placeholder.textContent = I18n.t('dashboard.selectPlaceholder');
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
  renderHourly(target, weather, gh, location, sunResults = null) {
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
      const nd = NDRecommendationService.fromOpenMeteoHour(weather, sunResults, i, {
        sunElevation: pos.elevation,
        rainSecondary
      });

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
            <div class="hour-nd" title="${Util.escapeHtml(item.nd.reason)}" style="font-size:0.7rem;margin-top:4px;font-weight:800;color:var(--blue)">📷 ${item.nd.recommendedFilter}</div>
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
    this.els.dashboardCurrentPanel.innerHTML = `
      <div class="empty-panel">
        <h3>${I18n.t('dashboard.emptyTitle')}</h3>
        <p class="muted">${I18n.t('dashboard.none')}</p>
        <div class="inline-actions mt-16">
          <button class="btn" data-empty-gps>${I18n.t('dashboard.useGps')}</button>
          <button class="btn btn-secondary" data-empty-locations>${I18n.t('locations.addLocation')}</button>
        </div>
      </div>
    `;
    this.els.dashboardCurrentPanel.querySelector('[data-empty-gps]').textContent = I18n.t('dashboard.useGps');
    this.els.dashboardCurrentPanel.querySelector('[data-empty-locations]').textContent = I18n.t('locations.addLocation');
    this.els.dashboardGoldenPanel.innerHTML = `${this.titleWithInfo(I18n.t('dashboard.golden'), 'help.goldenHour')}<p class="muted">${I18n.t('dashboard.emptyGoldenHint')}</p>`;
    this.els.dashboardHourlyPanel.innerHTML = `${this.titleWithInfo(I18n.t('dashboard.hourly'), 'help.hourlyForecast')}<p class="muted">${I18n.t('dashboard.emptyHourlyHint')}</p>`;
  },
  renderChecklistFormOptions() {
    this.els.checklistCategory.innerHTML = ChecklistManager.categories()
      .map(c => `<option value="${c}">${I18n.t(`check.${c}`)}</option>`)
      .join('');
  },
  infoIcon(helpKey) {
    const text = Util.escapeHtml(I18n.t(helpKey));
    return `<button class="info-dot" type="button" data-tooltip="${text}" aria-label="${text}">i</button>`;
  },
  titleWithInfo(title, helpKey, tag = 'h3') {
    return `
      <div class="panel-title-line">
        <${tag}>${title}</${tag}>
        ${this.infoIcon(helpKey)}
      </div>
    `;
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
  countryBackfillRunning: false,
  locationFilters: { name: '', country: '', suitability: [] },
  dashboardMap: null,
  dashboardMarker: null,
  dashboardDipulLayer: null,
  detailMap: null,
  detailMarker: null,
  detailDipulLayer: null,
  pickerMap: null,
  pickerMarker: null,
  dashboardPickerMap: null,
  germanyBounds: [[47.2, 5.6], [55.1, 15.4]],

  toggleDashboardMapPicker() {
    const section = document.getElementById('dashboardMapSection');
    const isHidden = section.classList.toggle('hidden');
    document.getElementById('dashboardMapSelectBtn')?.classList.toggle('btn-active', !isHidden);
    if (isHidden) return;
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
        document.getElementById('dashboardMapSelectBtn')?.classList.remove('btn-active');
        await this.renderDashboard(true);
        UI.toast(I18n.t('dashboard.locationSelected'));
      });
      bounds.extend([loc.lat, loc.lon]);
    });

    if (locations.length > 0) {
      this.dashboardPickerMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }

  },

  renderOverviewMap(locations = LocationManager.getAll()) {
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
        if (LocationManager.getAll().length === 0) {
          container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.2)">Keine Spots zum Anzeigen</div>';
          return;
        }

    if (LocationManager.getAll().length) {
      this.overviewMap = MapManager.get('locationsOverviewMap', { preferCanvas: true });
      if (this.overviewMap && !this.overviewMap._hasTileLayer) {
        this.overviewMap.setView([51.1657, 10.4515], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.overviewMap);
        this.overviewMarkers = L.layerGroup().addTo(this.overviewMap);
        this.overviewMap._hasTileLayer = true;
      }
      MapManager.invalidate('locationsOverviewMap');
    }
    }
      // Only clear and redraw markers
      if (!this.overviewMarkers) return;
      this.overviewMarkers.clearLayers();
      if (!locations.length) {
        this.overviewMap.setView([51.1657, 10.4515], 5);
        if (this.overviewMap) setTimeout(() => this.overviewMap.invalidateSize(), 200);
        return;
      }

      locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lon], { icon: premiumIcon }).addTo(this.overviewMarkers);
        marker.bindTooltip(Util.escapeHtml(loc.name), { 
          direction: 'top', 
          offset: [0, -25]
        });
        marker.on('click', () => this.openLocationDetail(loc.id, true));
      });

      this.overviewMap.setView([51.1657, 10.4515], 5);

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
        this.pickerMap.fitBounds(this.germanyBounds, { padding: [24, 24] });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.pickerMap);
        this.pickerMap._hasTileLayer = true;
      }
      MapManager.invalidate('locationsPickerMap');
      this.initMapPicker();
      setTimeout(() => this.pickerMap?.fitBounds(this.germanyBounds, { padding: [24, 24] }), 180);
    }
  },

  initMapPicker() {
    if (!this.pickerMap) {
      this.pickerMap = MapManager.get('locationsPickerMap');
      if (this.pickerMap && !this.pickerMap._hasTileLayer) {
        this.pickerMap.fitBounds(this.germanyBounds, { padding: [24, 24] });
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

        let reverse = null;
        let country = '';
        let countryCode = '';
        let suggestedName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const result = await this.countryForCoordinates(lat, lng);
          reverse = result.reverse;
          country = result.country;
          countryCode = result.countryCode;
          if (reverse && reverse.display_name) {
            suggestedName = reverse.display_name.split(',')[0] || suggestedName;
          }
        } catch (err) { console.warn('Reverse geocode failed', err); }

        const name = prompt(I18n.t('locations.addLocation'), suggestedName);
        if (name) {
          LocationManager.add({ name, lat, lon: lng, country, countryCode });
          UI.toast(I18n.t('detail.saved'));
          this.toggleMapPicker();
          await this.renderLocationsList();
          UI.renderDashboardLocationSelect();
        }
      });

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

  countryFromReverse(reverse) {
    const address = reverse?.address || {};
    return {
      country: address.country || '',
      countryCode: address.country_code || ''
    };
  },

  async countryForCoordinates(lat, lon) {
    const reverse = await Nominatim.reverse(lat, lon, I18n.lang);
    return {
      reverse,
      ...this.countryFromReverse(reverse)
    };
  },

  async ensureLocationCountries() {
    if (this.countryBackfillRunning) return;
    const missing = LocationManager.getAll().filter(location => !location.country && !location.countryCode);
    if (!missing.length) return;
    this.countryBackfillRunning = true;
    let changed = false;
    try {
      for (const location of missing) {
        const { country, countryCode } = await this.countryForCoordinates(location.lat, location.lon);
        if (country || countryCode) {
          LocationManager.update(location.id, { country, countryCode });
          changed = true;
        }
      }
    } catch (err) {
      console.warn('Country backfill failed:', err);
    } finally {
      this.countryBackfillRunning = false;
    }
    if (changed) {
      UI.renderDashboardLocationSelect();
      if (Storage.get(Keys.activeTab, 'dashboard') === 'locations') await this.renderLocationsList();
    }
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
      HelpTooltip.init();
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
      this.ensureLocationCountries();
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

  flushAutosaveSoon() {
    if (typeof CloudManager !== 'undefined' && CloudManager.flushSoon) {
      CloudManager.flushSoon();
    }
  },

  flushAutosaveNow() {
    if (typeof CloudManager !== 'undefined' && CloudManager.flushNow) {
      return CloudManager.flushNow();
    }
    return Promise.resolve();
  },

  saveOpenLocationDetailNow() {
    const detailView = document.getElementById('locationsDetailView');
    if (!detailView || detailView.classList.contains('hidden')) return false;

    const locationId = Storage.get(Keys.activeLocation);
    const location = LocationManager.getById(locationId);
    if (!location) return false;

    const patch = {};
    const nameInput = document.getElementById('locationNameInput');
    const notesArea = document.getElementById('notesArea');

    if (nameInput) {
      const name = nameInput.value.trim() || 'Unbenannter Ort';
      if (name !== location.name) patch.name = name;
    }
    if (notesArea && notesArea.value !== (location.notes || '')) {
      patch.notes = notesArea.value;
    }

    if (!Object.keys(patch).length) return false;
    LocationManager.update(locationId, patch);
    UI.renderDashboardLocationSelect();
    this.flushAutosaveSoon();
    return true;
  },

  saveOpenDroneEditorNow() {
    const id = this.editingDroneId;
    if (!id) return false;
    const name = document.getElementById(`inline-drone-name-${id}`);
    const style = document.getElementById(`inline-drone-style-${id}`);
    const weight = document.getElementById(`inline-drone-weight-${id}`);
    const size = document.getElementById(`inline-drone-size-${id}`);
    const maxWind = document.getElementById(`inline-drone-maxwind-${id}`);
    const maxGusts = document.getElementById(`inline-drone-maxgusts-${id}`);
    const color = document.getElementById(`inline-drone-${id}-color`);
    const rain = document.getElementById(`inline-drone-rain-${id}`);
    if (!name || !name.value.trim()) return false;
    ProfileManager.update(id, {
      label: name.value.trim(),
      style: style.value,
      weight: Number(weight.value),
      size: Number(size.value),
      maxWind: Number(maxWind.value),
      maxGusts: Number(maxGusts.value),
      color: color.value,
      rainTolerance: rain.value
    });
    return true;
  },

  saveOpenChecklistEditorNow() {
    const id = this.editingChecklistId;
    if (!id) return false;
    const name = document.getElementById(`inline-name-${id}`);
    const count = document.getElementById(`inline-count-${id}`);
    const category = document.getElementById(`inline-cat-${id}`);
    const notes = document.getElementById(`inline-notes-${id}`);
    if (!name || !name.value.trim()) return false;
    const old = ChecklistManager.getAll().find(x => x.id === id);
    ChecklistManager.update(id, {
      name: name.value.trim(),
      count: Number(count.value),
      category: category.value,
      notes: notes.value.trim(),
      attachments: old ? (old.attachments || (old.attachment ? [{ data: old.attachment, type: old.attachmentType, name: 'Datei' }] : [])) : []
    });
    return true;
  },

  saveOpenLogEditorNow() {
    const id = this.editingLogId;
    const locationId = Storage.get(Keys.activeLocation);
    if (!id || !locationId) return false;
    const dateInput = document.getElementById(`inline-log-date-${id}`);
    const droneInput = document.getElementById(`inline-log-drone-${id}`);
    const noteInput = document.getElementById(`inline-log-note-${id}`);
    if (!dateInput || !droneInput || !noteInput) return false;
    LocationManager.updateLog(locationId, id, {
      date: dateInput.value,
      drone: droneInput.value,
      note: noteInput.value.trim()
    });
    return true;
  },

  saveOpenEditorsNow() {
    const changed = [
      this.saveOpenLocationDetailNow(),
      this.saveOpenDroneEditorNow(),
      this.saveOpenChecklistEditorNow(),
      this.saveOpenLogEditorNow()
    ].some(Boolean);
    if (changed) {
      UI.renderProfileSelect();
      UI.renderDashboardLocationSelect();
      this.flushAutosaveSoon();
    }
    return changed;
  },

  async renderAfterAccountChange({ resetTab = false, forceRefresh = true } = {}) {
    this.editingDroneId = null;
    this.editingChecklistId = null;
    this.editingLogId = null;
    ProfileManager.init();
    LocationManager.init();
    ChecklistManager.init();
    if (resetTab) Storage.set(Keys.activeTab, 'dashboard');
    Router.showPage(Storage.get(Keys.activeTab, 'dashboard'));
    await this.renderAll(forceRefresh);
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
    const saveAndFlushOpenData = () => {
      this.saveOpenEditorsNow();
      this.flushAutosaveNow();
    };
    window.addEventListener('pagehide', saveAndFlushOpenData);
    window.addEventListener('beforeunload', saveAndFlushOpenData);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveAndFlushOpenData();
    });
    window.addEventListener('droneops:account-data-cleared', () => {
      this.renderAfterAccountChange({ resetTab: true, forceRefresh: true });
    });

    document.getElementById('langDe').addEventListener('click', async () => {
      I18n.setLanguage('de');
      this.flushAutosaveSoon();
      await this.renderAll();
    });
    document.getElementById('langEn').addEventListener('click', async () => {
      I18n.setLanguage('en');
      this.flushAutosaveSoon();
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
      this.flushAutosaveSoon();
      await this.renderActivePage();
      UI.renderProfileSelect();
      UI.renderDashboardLocationSelect();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tab = btn.dataset.tab;
        this.saveOpenEditorsNow();
        Router.showPage(tab);
        Storage.set(Keys.activeTab, tab);
        this.flushAutosaveSoon();
        await this.renderActivePage();
      });
    });

    UI.els.dashboardHomeSearchInput.addEventListener('input', (e) => doHomeBaseSearch(e.target.value));
    document.getElementById('gpsAddBtn').addEventListener('click', () => this.addLocationFromGps());
    document.getElementById('pickerBackBtn').addEventListener('click', () => this.toggleMapPicker());
    UI.els.dashboardLocationSelect.addEventListener('change', async (e) => {
      Storage.set(Keys.dashboardSource, e.target.value || 'gps');
      await this.renderDashboard(true);
    });

    const doSearch = Util.debounce(async (value) => {
      if (!value || value.trim().length < 2) {
        UI.els.searchSuggestions.classList.add('hidden');
        UI.els.searchSuggestions.innerHTML = '';
        return;
      }
      try {
        const results = await Nominatim.search(value.trim(), I18n.lang);
        if (!results.length) {
          UI.toast(I18n.t('toast.notFound'));
          return;
        }
        UI.els.searchSuggestions.innerHTML = results.map(item => `
          <button class="suggestion-item" data-lat="${item.lat}" data-lon="${item.lon}" data-name="${Util.escapeHtml(item.display_name)}" data-country="${Util.escapeHtml(item.address?.country || '')}">
            ${Util.escapeHtml(item.display_name)}
          </button>
        `).join('');
        UI.els.searchSuggestions.classList.remove('hidden');

        UI.els.searchSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
          btn.addEventListener('click', async () => {
            const lat = Number(btn.dataset.lat);
            const lon = Number(btn.dataset.lon);
            const { country, countryCode } = await this.countryForCoordinates(lat, lon);
            const location = LocationManager.add({
              name: btn.dataset.name,
              lat,
              lon,
              country,
              countryCode,
            });
            UI.els.searchInput.value = '';
            UI.els.searchSuggestions.innerHTML = '';
            UI.els.searchSuggestions.classList.add('hidden');
            if (location) {
              this.flushAutosaveSoon();
              UI.renderDashboardLocationSelect();
              await this.renderLocationsList();
              await this.renderDashboard(true);
            }
          });
        });
      } catch (error) {
        console.error(error);
        UI.toast(I18n.t('error.searchFailed'));
      }
    }, 500);

    UI.els.searchInput.addEventListener('input', (e) => doSearch(e.target.value));

    UI.renderLocationFilterOptions(this.locationFilters.suitability);
    const hideCountrySuggestions = () => {
      if (!UI.els.locationCountrySuggestions) return;
      UI.els.locationCountrySuggestions.innerHTML = '';
      UI.els.locationCountrySuggestions.classList.add('hidden');
    };
    const applyLocationFilters = Util.debounce(async () => {
      this.locationFilters.name = UI.els.locationNameFilterInput?.value || '';
      this.locationFilters.country = UI.els.locationCountryFilterInput?.value || '';
      this.locationFilters.suitability = Array.from(document.querySelectorAll('[data-location-filter-suitability]:checked')).map(input => input.value);
      await this.renderLocationsList();
    }, 150);
    const doCountryFilterSearch = Util.debounce(async (value) => {
      this.locationFilters.country = value || '';
      await this.renderLocationsList();
      const query = value.trim();
      if (query.length < 2 || !UI.els.locationCountrySuggestions) {
        hideCountrySuggestions();
        return;
      }
      const countries = await Nominatim.searchCountries(query, I18n.lang);
      if (!countries.length) {
        hideCountrySuggestions();
        return;
      }
      UI.els.locationCountrySuggestions.innerHTML = countries.map(country => `
        <button class="suggestion-item" type="button" data-country-filter="${Util.escapeHtml(country.name)}" title="${Util.escapeHtml(country.displayName)}">
          ${Util.escapeHtml(country.name)}
        </button>
      `).join('');
      UI.els.locationCountrySuggestions.classList.remove('hidden');
      UI.els.locationCountrySuggestions.querySelectorAll('[data-country-filter]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const country = btn.dataset.countryFilter || '';
          if (UI.els.locationCountryFilterInput) UI.els.locationCountryFilterInput.value = country;
          this.locationFilters.country = country;
          hideCountrySuggestions();
          await this.renderLocationsList();
        });
      });
    }, 250);
    UI.els.locationNameFilterInput?.addEventListener('input', applyLocationFilters);
    UI.els.locationCountryFilterInput?.addEventListener('input', (e) => doCountryFilterSearch(e.target.value));
    document.querySelectorAll('[data-location-filter-suitability]').forEach(input => {
      input.addEventListener('change', applyLocationFilters);
    });
    UI.els.locationFilterResetBtn?.addEventListener('click', async () => {
      this.locationFilters = { name: '', country: '', suitability: [] };
      if (UI.els.locationNameFilterInput) UI.els.locationNameFilterInput.value = '';
      if (UI.els.locationCountryFilterInput) UI.els.locationCountryFilterInput.value = '';
      hideCountrySuggestions();
      UI.renderLocationFilterOptions([]);
      document.querySelectorAll('[data-location-filter-suitability]').forEach(input => {
        input.addEventListener('change', applyLocationFilters);
      });
      await this.renderLocationsList();
    });

    const doHomeBaseSearch = Util.debounce(async (value) => {
      if (!value || value.trim().length < 2) {
        UI.els.dashboardHomeSuggestions.classList.add('hidden');
        UI.els.dashboardHomeSuggestions.innerHTML = '';
        return;
      }
      try {
        const results = await Nominatim.search(value.trim(), I18n.lang);
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
            await this.renderDashboard(true);
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
        this.renderDashboard(true);
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
      this.toggleDashboardMapPicker();
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
        const results = await Nominatim.search(q, I18n.lang);
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
        const results = await Nominatim.search(q, I18n.lang);
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
      this.saveOpenEditorsNow();
      this.flushAutosaveSoon();
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
      const emptyGps = e.target.closest('[data-empty-gps]');
      const emptyLocations = e.target.closest('[data-empty-locations]');

      if (emptyGps) {
        await this.setDashboardGps();
      }

      if (emptyLocations) {
        Router.showPage('locations');
        document.getElementById('locationSearchInput')?.focus();
      }

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

      if (detailBtn) await this.openLocationDetail(detailBtn.dataset.id, true);
      if (deleteBtn) {
        if (confirm(I18n.t('confirm.deleteLocation'))) {
          LocationManager.remove(deleteBtn.dataset.id);
          UI.renderDashboardLocationSelect();
          await this.renderLocationsList();
          await this.renderDashboard(true);
        }
      }
      if (miniCard) {
        Router.showPage('locations');
        await this.openLocationDetail(miniCard.dataset.dashboardLocation, true);
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
          ChecklistManager.saveAll(all);
          this.flushAutosaveSoon();

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
    const toggleAccountPanel = () => {
      document.getElementById('accountPanel').classList.toggle('hidden');
    };

    document.getElementById('accountBtn').addEventListener('click', toggleAccountPanel);
    document.getElementById('accountNudge')?.addEventListener('click', toggleAccountPanel);

    document.getElementById('accountCloseBtn').addEventListener('click', () => {
      document.getElementById('accountPanel').classList.add('hidden');
    });

    const authEmailInput = document.getElementById('authEmail');
    const authPasswordField = document.getElementById('authPasswordField');
    const authPasswordInput = document.getElementById('authPassword');
    const authPasswordConfirmInput = document.getElementById('authPasswordConfirm');
    const signupFields = document.getElementById('signupFields');
    const authModeTitle = document.getElementById('authModeTitle');
    const authModeText = document.getElementById('authModeText');
    const authValidationMessage = document.getElementById('authValidationMessage');
    const authModeSwitchWrap = document.getElementById('authModeSwitchWrap');
    const authModeSwitchBtn = document.getElementById('authModeSwitchBtn');
    const authSwitchText = document.getElementById('authSwitchText');
    const forgotPasswordWrap = document.getElementById('forgotPasswordWrap');
    const resetPasswordActions = document.getElementById('resetPasswordActions');
    const resetPasswordSubmitBtn = document.getElementById('resetPasswordSubmitBtn');
    const resetBackBtn = document.getElementById('resetBackBtn');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const privacyAccepted = document.getElementById('privacyAccepted');
    let authMode = 'login';
    let authSubmitted = false;

    const emailLooksValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const setAuthMessage = (message = '') => {
      if (authValidationMessage) authValidationMessage.textContent = message;
    };
    const getSignupRules = () => {
      const pass = authPasswordInput?.value || '';
      const confirmPass = authPasswordConfirmInput?.value || '';
      return {
        signupReqLength: pass.length >= 8,
        signupReqLetter: /[a-z]/.test(pass) && /[A-Z]/.test(pass),
        signupReqNumber: /\d/.test(pass),
        signupReqMatch: !!pass && pass === confirmPass
      };
    };
    const validateSignupForm = ({ showMessage = false } = {}) => {
      const email = authEmailInput?.value.trim() || '';
      const pass = authPasswordInput?.value || '';
      const rules = getSignupRules();
      Object.entries(rules).forEach(([id, valid]) => {
        document.getElementById(id)?.classList.toggle('valid', valid);
      });
      let message = '';
      if (!email) message = I18n.t('auth.validationEmailRequired');
      else if (!emailLooksValid(email)) message = I18n.t('auth.validationEmailInvalid');
      else if (!pass) message = I18n.t('auth.validationPasswordRequired');
      else if (!Object.values(rules).every(Boolean)) message = I18n.t('auth.passwordRequirementsAlert');
      else if (!privacyAccepted?.checked) message = I18n.t('auth.validationPrivacyRequired');
      if (showMessage) setAuthMessage(message);
      if (signupBtn) signupBtn.disabled = !!message;
      return !message;
    };
    const validateLoginForm = ({ showMessage = false } = {}) => {
      const email = authEmailInput?.value.trim() || '';
      const pass = authPasswordInput?.value || '';
      let message = '';
      if (!email) message = I18n.t('auth.validationEmailRequired');
      else if (!emailLooksValid(email)) message = I18n.t('auth.validationEmailInvalid');
      else if (!pass) message = I18n.t('auth.validationPasswordRequired');
      if (showMessage) setAuthMessage(message);
      return !message;
    };
    const validateResetForm = ({ showMessage = false } = {}) => {
      const email = authEmailInput?.value.trim() || '';
      let message = '';
      if (!email) message = I18n.t('auth.validationEmailRequired');
      else if (!emailLooksValid(email)) message = I18n.t('auth.validationEmailInvalid');
      if (showMessage) setAuthMessage(message);
      return !message;
    };
    const updateAuthMode = (mode) => {
      authMode = mode;
      authSubmitted = false;
      setAuthMessage('');
      const isSignup = mode === 'signup';
      const isReset = mode === 'reset';
      signupFields?.classList.toggle('hidden', !isSignup);
      authPasswordField?.classList.toggle('hidden', isReset);
      loginBtn?.classList.toggle('hidden', isSignup || isReset);
      signupBtn?.classList.toggle('hidden', !isSignup);
      resetPasswordActions?.classList.toggle('hidden', !isReset);
      forgotPasswordWrap?.classList.toggle('hidden', isSignup || isReset);
      authModeSwitchWrap?.classList.toggle('hidden', isReset);
      if (authModeTitle) {
        authModeTitle.dataset.i18n = isReset ? 'auth.resetPasswordTitle' : (isSignup ? 'auth.signupTitle' : 'auth.loginTitle');
        authModeTitle.textContent = I18n.t(authModeTitle.dataset.i18n);
      }
      if (authModeText) {
        authModeText.dataset.i18n = isReset ? 'auth.resetPasswordText' : (isSignup ? 'auth.signupText' : 'auth.loginText');
        authModeText.textContent = I18n.t(authModeText.dataset.i18n);
      }
      if (authSwitchText) {
        authSwitchText.dataset.i18n = isSignup ? 'auth.hasAccount' : 'auth.noAccount';
        authSwitchText.textContent = I18n.t(authSwitchText.dataset.i18n);
      }
      if (authModeSwitchBtn) {
        authModeSwitchBtn.dataset.i18n = isSignup ? 'auth.goLogin' : 'auth.goSignup';
        authModeSwitchBtn.textContent = I18n.t(authModeSwitchBtn.dataset.i18n);
      }
      if (authPasswordInput) authPasswordInput.autocomplete = isSignup ? 'new-password' : 'current-password';
      if (authPasswordConfirmInput) authPasswordConfirmInput.value = '';
      if (privacyAccepted) privacyAccepted.checked = false;
      if (signupBtn) signupBtn.disabled = true;
      validateSignupForm();
    };
    [authEmailInput, authPasswordInput, authPasswordConfirmInput, privacyAccepted].forEach(input => {
      input?.addEventListener('input', () => {
        if (authMode === 'signup') validateSignupForm({ showMessage: authSubmitted });
        else if (authMode === 'reset') validateResetForm({ showMessage: authSubmitted });
        else validateLoginForm({ showMessage: authSubmitted });
      });
      input?.addEventListener('change', () => {
        if (authMode === 'signup') validateSignupForm({ showMessage: authSubmitted });
        else if (authMode === 'reset') validateResetForm({ showMessage: authSubmitted });
      });
    });
    authModeSwitchBtn?.addEventListener('click', () => {
      updateAuthMode(authMode === 'signup' ? 'login' : 'signup');
    });
    updateAuthMode('login');

    loginBtn.addEventListener('click', async () => {
      authSubmitted = true;
      if (!validateLoginForm({ showMessage: true })) return;
      const email = authEmailInput.value.trim();
      const pass = authPasswordInput.value;
      const original = loginBtn.textContent;
      loginBtn.disabled = true;
      loginBtn.textContent = '...';
      try {
        await CloudManager.login(email, pass);
        setAuthMessage('');
        await this.renderAfterAccountChange({ resetTab: false, forceRefresh: true });
      } catch (e) {
        setAuthMessage(e.message);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = original;
      }
    });

    const togglePasswordChangeBtn = document.getElementById('togglePasswordChangeBtn');
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    const changePasswordInput = document.getElementById('changePasswordInput');
    const changePasswordConfirmInput = document.getElementById('changePasswordConfirmInput');
    const changePassBtn = document.getElementById('changePasswordBtn');
    const passwordRequirementIds = ['passwordReqLength', 'passwordReqLetter', 'passwordReqNumber', 'passwordReqMatch'];
    const validatePasswordChange = () => {
      const newPass = changePasswordInput?.value || '';
      const confirmPass = changePasswordConfirmInput?.value || '';
      const rules = {
        passwordReqLength: newPass.length >= 8,
        passwordReqLetter: /[a-z]/.test(newPass) && /[A-Z]/.test(newPass),
        passwordReqNumber: /\d/.test(newPass),
        passwordReqMatch: !!newPass && newPass === confirmPass
      };
      passwordRequirementIds.forEach(id => document.getElementById(id)?.classList.toggle('valid', !!rules[id]));
      const valid = Object.values(rules).every(Boolean);
      if (changePassBtn) changePassBtn.disabled = !valid;
      return valid;
    };
    const closePasswordForm = () => {
      passwordChangeForm?.classList.add('hidden');
      if (changePasswordInput) changePasswordInput.value = '';
      if (changePasswordConfirmInput) changePasswordConfirmInput.value = '';
      validatePasswordChange();
    };
    if (togglePasswordChangeBtn && passwordChangeForm) {
      togglePasswordChangeBtn.addEventListener('click', () => {
        passwordChangeForm.classList.toggle('hidden');
        validatePasswordChange();
        if (!passwordChangeForm.classList.contains('hidden')) changePasswordInput?.focus();
      });
    }
    [changePasswordInput, changePasswordConfirmInput].forEach(input => {
      input?.addEventListener('input', validatePasswordChange);
    });
    if (changePassBtn) {
      changePassBtn.addEventListener('click', async () => {
        if (!validatePasswordChange()) {
          alert(I18n.t('auth.passwordRequirementsAlert'));
          return;
        }
        const newPass = changePasswordInput.value;
        const original = changePassBtn.textContent;
        changePassBtn.textContent = '...';
        changePassBtn.disabled = true;
        try {
          await CloudManager.updatePassword(newPass);
          closePasswordForm();
          UI.toast(I18n.t('toast.passwordChanged'));
        } catch (e) {
          alert('Fehler: ' + e.message);
        } finally {
          changePassBtn.textContent = original;
          validatePasswordChange();
        }
      });
    }

    signupBtn.addEventListener('click', async () => {
      authSubmitted = true;
      if (!validateSignupForm({ showMessage: true })) return;
      const email = authEmailInput.value.trim();
      const pass = authPasswordInput.value;
      const original = signupBtn.textContent;
      signupBtn.disabled = true;
      signupBtn.textContent = '...';
      try {
        const data = await CloudManager.signup(email, pass);
        if (data?.session) {
          setAuthMessage('');
          await this.renderAfterAccountChange({ resetTab: false, forceRefresh: true });
          UI.toast(I18n.t('toast.loggedIn'));
        } else {
          UI.toast(I18n.t('toast.verifyEmail'));
          updateAuthMode('login');
        }
      } catch (e) {
        setAuthMessage(e.message);
      } finally {
        signupBtn.textContent = original;
        validateSignupForm();
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await CloudManager.logout();
    });

    const requestDeletionBtn = document.getElementById('requestDeletionBtn');
    if (requestDeletionBtn) {
      requestDeletionBtn.addEventListener('click', async () => {
        if (!confirm(I18n.t('auth.requestDeletionConfirm'))) return;
        const original = requestDeletionBtn.textContent;
        requestDeletionBtn.textContent = '...';
        requestDeletionBtn.disabled = true;
        try {
          await CloudManager.requestAccountDeletion();
          UI.toast(I18n.t('toast.accountDeletionRequested'));
        } catch (e) {
          alert('Fehler: ' + e.message);
        } finally {
          requestDeletionBtn.textContent = original;
          requestDeletionBtn.disabled = false;
        }
      });
    }

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

    document.getElementById('resetPassBtn').addEventListener('click', () => {
      updateAuthMode('reset');
      authEmailInput?.focus();
    });

    resetBackBtn?.addEventListener('click', () => {
      updateAuthMode('login');
      authPasswordInput?.focus();
    });

    resetPasswordSubmitBtn?.addEventListener('click', async () => {
      authSubmitted = true;
      if (!validateResetForm({ showMessage: true })) return;
      const email = authEmailInput.value.trim();
      const original = resetPasswordSubmitBtn.textContent;
      resetPasswordSubmitBtn.disabled = true;
      resetPasswordSubmitBtn.textContent = '...';
      try {
        await CloudManager.resetPassword(email);
        setAuthMessage(I18n.t('auth.resetPasswordSent'));
      } catch (e) {
        setAuthMessage(e.message);
      } finally {
        resetPasswordSubmitBtn.disabled = false;
        resetPasswordSubmitBtn.textContent = original;
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
      await this.renderDashboard(true);
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
        const reverse = await Nominatim.reverse(latitude, longitude, I18n.lang);
        const name = reverse.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        const { country, countryCode } = this.countryFromReverse(reverse);
        const location = LocationManager.add({ name, lat: latitude, lon: longitude, country, countryCode });
        if (location) {
          UI.renderDashboardLocationSelect();
          await this.renderLocationsList();
          await this.renderDashboard(true);
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

  currentIndex(weatherData, targetTime = null) {
    const times = weatherData?.hourly?.time || [];
    if (!times.length) return 0;

    const currentTime = targetTime || weatherData?.current_weather?.time || new Date();
    const exactIdx = times.indexOf(currentTime);
    if (exactIdx >= 0) return exactIdx;

    const targetMs = this.parseWeatherDate(currentTime).getTime();
    if (!Number.isFinite(targetMs)) return 0;

    let nearestIdx = 0;
    let nearestDiff = Infinity;
    times.forEach((time, index) => {
      const timeMs = this.parseWeatherDate(time).getTime();
      const diff = Math.abs(timeMs - targetMs);
      if (Number.isFinite(diff) && diff < nearestDiff) {
        nearestDiff = diff;
        nearestIdx = index;
      }
    });
    return nearestIdx;
  },

  parseWeatherDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (!value) return new Date();
    const str = String(value);
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(str);
    return new Date(hasTimezone ? str : str.replace('T', ' '));
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
      this.renderDashboardDrone();
      this.renderDashboardChecklist();
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
      const currentNDTime = new Date();
      const posNow = this.getSolarPosition(currentNDTime, location.lat, location.lon);
      const dashRainBS = Util.getBrightSkyRain(weather.bsData, weather.data.current_weather.time);
      const dashND = NDRecommendationService.fromOpenMeteoHour(weather, sunToday.data.results, idx, {
        time: currentNDTime,
        sunElevation: posNow.elevation,
        rainSecondary: dashRainBS
      });
      
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

        const dashboardOverlayToggle = AirspaceService.hasInteractiveOverlay(location)
          ? `<button class="btn btn-secondary btn-small" data-toggle-dipul>${this.isDipulOverlayEnabled() ? I18n.t('airspace.overlayOn') : I18n.t('airspace.overlayOff')}</button>`
          : '';
        const dashboardAirspaceLink = AirspaceService.isOverlayAvailable(location)
          ? `<button class="btn btn-secondary btn-small" data-open-pin="${Util.escapeHtml(AirspaceService.mapUrl(location))}">${AirspaceService.openMapLabel(location)}</button>`
          : '';
        const dashboardAirspaceActions = dashboardOverlayToggle || dashboardAirspaceLink
          ? `<div class="info-list mt-8">${dashboardOverlayToggle}${dashboardAirspaceLink}</div>`
          : '';

        currentInfo.innerHTML = `
          <div class="score-hero">
            <div>
              ${UI.titleWithInfo(I18n.t('dashboard.current'), 'help.currentConditions')}
              <p><strong>${Util.escapeHtml(location.name)}</strong> <span class="muted">mit</span> <strong>${Util.escapeHtml(ProfileManager.getLabel(drone))}</strong></p>
              ${UI.renderSpotSuitabilityTags(location)}
              <p class="muted">📍 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}<span id="dashboardTravelTime"></span></p>
              ${dashboardAirspaceActions}
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
            <div class="kpi" title="${Util.escapeHtml(dashND.reason)}"><span>ND Filter</span><strong>${dashND.recommendedFilter}</strong></div>
          </div>
          <p class="mt-12 muted nd-hint">${NDRecommendationService.hint}</p>
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
        ${UI.titleWithInfo(I18n.t('dashboard.golden'), 'help.goldenHour')}
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

      UI.els.dashboardHourlyPanel.innerHTML = `${UI.titleWithInfo(I18n.t('dashboard.hourly'), 'help.hourlyForecast')}<div id="dashboardHourlyInner" class=\"hourly-inner\"></div>`;
      UI.renderHourly(document.getElementById('dashboardHourlyInner'), weather, gh, location, sun.data.results);
      
      this.renderDashboardDrone();
      this.renderDashboardChecklist();
      await this.renderDashboardLocationCards(forceRefresh);
    } catch (error) {
      console.error('Dashboard Render Error:', error);
      StatusTracker.update('weather', 'error');
      StatusTracker.update('sun', 'error');
      UI.updateStatusIndicator();
      UI.els.dashboardCurrentPanel.innerHTML = `${UI.titleWithInfo(I18n.t('dashboard.current'), 'help.currentConditions')}<p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.dashboardGoldenPanel.innerHTML = `${UI.titleWithInfo(I18n.t('dashboard.golden'), 'help.goldenHour')}<p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.dashboardHourlyPanel.innerHTML = `${UI.titleWithInfo(I18n.t('dashboard.hourly'), 'help.hourlyForecast')}<p>${I18n.t('error.dataUnavailable')}</p>`;
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
        ${UI.titleWithInfo(I18n.t('drones.activeDroneTitle'), 'help.activeDrone')}
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
      ${UI.titleWithInfo(I18n.t('checklist.title'), 'help.dashboardChecklist')}
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
    UI.els.dashboardLocationCardsPanel.innerHTML = UI.titleWithInfo(I18n.t('dashboard.locationsOverview'), 'help.locationsOverview');
    if (!locations.length) {
      UI.els.dashboardLocationCardsPanel.innerHTML += `
        <div class="empty-panel">
          <p class="muted">${I18n.t('empty.text')}</p>
          <button class="btn btn-secondary" data-empty-locations>${I18n.t('locations.addLocation')}</button>
        </div>
      `;
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
            ${UI.renderSpotSuitabilityTags(location)}
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
    const allLocations = LocationManager.getAll();
    const locations = this.filteredLocations(allLocations);
    this.updateLocationFilterSummary(allLocations.length, locations.length);

    UI.els.locationList.innerHTML = `
      <h2>${I18n.t('list.title')}</h2>
      <p class="muted">${I18n.t('list.subtitle')}</p>
      <div id="locationListContent">
        ${locations.length ? '' : `
          <article class="empty-state">
            <h3>${allLocations.length ? I18n.t('locations.filterNoResults') : I18n.t('empty.title')}</h3>
            <p class="muted">${allLocations.length ? I18n.t('locations.filterHint') : I18n.t('empty.text')}</p>
          </article>
        `}
      </div>
    `;

    this.renderOverviewMap(locations);
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
          ${UI.renderSpotSuitabilityTags(location)}
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
        this.openLocationDetail(btn.dataset.id, true);
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
        this.openLocationDetail(card.dataset.id, true);
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

  locationCountryText(location) {
    const parts = [
      location.country,
      location.countryCode,
      location.address?.country,
      location.address?.country_code,
    ];
    return parts.filter(Boolean).join(' ').toLowerCase();
  },

  filteredLocations(locations = LocationManager.getAll()) {
    const nameQuery = this.locationFilters.name.trim().toLowerCase();
    const countryQuery = this.locationFilters.country.trim().toLowerCase();
    const styles = this.locationFilters.suitability;

    return locations.filter(location => {
      const selectedStyles = UI.normaliseSpotSuitability(location);
      const matchesName = !nameQuery || String(location.name || '').toLowerCase().includes(nameQuery);
      const matchesCountry = !countryQuery || this.locationCountryText(location).includes(countryQuery);
      const matchesStyle = !styles.length || styles.some(style => selectedStyles.includes(style));
      return matchesName && matchesCountry && matchesStyle;
    });
  },

  updateLocationFilterSummary(total, shown) {
    if (!UI.els.locationFilterSummary) return;
    UI.els.locationFilterSummary.textContent = I18n.t('locations.filterSummary')
      .replace('{shown}', shown)
      .replace('{total}', total);
  },

  async renderDetailAirspace(location) {
    const panel = UI.els.detailMapPanel?.querySelector('#detailAirspacePanel');
    if (!panel) return;
    const result = await AirspaceService.check(location);
    if (Storage.get(Keys.activeLocation) !== location.id) return;
    const currentPanel = UI.els.detailMapPanel?.querySelector('#detailAirspacePanel');
    if (currentPanel) currentPanel.outerHTML = UI.renderAirspacePanel(location, result);
  },

  async updateDetailTravelInfo(location) {
    const el = document.getElementById('detailTravelInfo');
    if (!el || !location) return;

    const homeBase = Storage.get(Keys.homeBase);
    const distSource = Storage.get(Keys.distSource, homeBase ? 'home' : 'gps');
    const sourceLabel = distSource === 'home' && homeBase ? I18n.t('detail.distanceHome') : I18n.t('detail.distanceGps');

    let start = null;
    try {
      if (distSource === 'home' && homeBase) {
        start = homeBase;
      } else {
        const pos = await Util.getCurrentPosition();
        start = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      }
    } catch (error) {
      if (homeBase) {
        start = homeBase;
      }
    }

    if (!start) {
      el.textContent = I18n.t('detail.distanceUnavailable');
      return;
    }

    const route = await Util.getRouteInfo(start.lat, start.lon, location.lat, location.lon);
    if (!route) {
      el.textContent = I18n.t('detail.distanceUnavailable');
      return;
    }

    const distance = Util.formatDistance(route.distance, I18n.locale);
    el.textContent = `${I18n.t('detail.distanceLabel')}: ${distance} · ${route.duration} Min. (${sourceLabel})`;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lon}&destination=${location.lat},${location.lon}&travelmode=driving`;
    const routeBtn = UI.els.detailMapPanel?.querySelector('[data-open-route]');
    if (routeBtn) routeBtn.dataset.openRoute = mapsUrl;
    const topRouteBtn = document.getElementById('detailRouteBtnTop');
    if (topRouteBtn) topRouteBtn.onclick = () => window.open(mapsUrl, '_blank');
  },

  removeDuplicateDetailAirspacePanels() {
    const mapPanel = UI.els.detailMapPanel;
    if (!mapPanel) return;
    const panels = Array.from(mapPanel.querySelectorAll('.airspace-card'));
    const primary = mapPanel.querySelector('#detailAirspacePanel');
    panels.forEach(panel => {
      if (panel !== primary) panel.remove();
    });
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
    if (!['dipul', 'dronespace', 'dronezoner', 'swissgeo', 'officialdata'].includes(provider)) return;

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

    if (provider === 'swissgeo') {
      this[layerProp] = L.tileLayer.wms(AirspaceService.swissWmsUrl, {
        layers: AirspaceService.swissLayer,
        styles: 'default',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        attribution: I18n.t('airspace.sourceSwissGeoAdmin')
      }).addTo(map);
      return;
    }

    if (provider === 'officialdata') {
      const source = AirspaceService.officialLayerSource(location);
      if (!source) return;
      if (source.type === 'wms') {
        this[layerProp] = L.tileLayer.wms(source.url, {
          layers: source.layers,
          styles: '',
          format: 'image/png',
          transparent: true,
          version: '1.3.0',
          attribution: `Source geodata: ${source.source}`
        }).addTo(map);
        return;
      }
    }

    if (!map.getPane('airspaceGeojsonPane')) {
      map.createPane('airspaceGeojsonPane');
      map.getPane('airspaceGeojsonPane').style.zIndex = 430;
    }

    const group = L.layerGroup().addTo(map);
    this[layerProp] = group;
    const refresh = Util.debounce(() => {
      if (provider === 'dronespace') {
        this.populateDronespaceOverlay(map, group, layerProp);
        return;
      }
      if (provider === 'dronezoner') this.populateDronezonerOverlay(map, group, layerProp);
      if (provider === 'officialdata') this.populateOfficialDataOverlay(map, group, layerProp, AirspaceService.officialLayerSource(location));
    }, 350);
    this[handlerProp] = refresh;
    this[mapProp] = map;
    map.on('moveend zoomend', refresh);
    setTimeout(refresh, 150);
  },

  async populateOfficialDataOverlay(map, group, layerProp, source) {
    if (this[layerProp] !== group || !source) return;
    group.clearLayers();
    if (source.type === 'ogc') {
      await this.populateOgcOverlay(map, group, layerProp, source);
      return;
    }

    try {
      let data = AirspaceService.officialDataCache.get(source.url);
      if (!data) {
        const res = await fetch(AirspaceService.requestUrl(source.url), { headers: { Accept: 'application/json,application/geo+json,*/*' } });
        if (!res.ok) throw new Error(`${source.label} ${res.status}`);
        data = await res.json();
        AirspaceService.officialDataCache.set(source.url, data);
      }
      if (this[layerProp] !== group) return;
      if (source.type === 'ed269') {
        this.addEd269Overlay(map, group, data, source);
        return;
      }
      this.addGeoJsonOverlay(group, data, source);
    } catch (error) {
      console.warn('Official UAS overlay failed:', source.label, error);
    }
  },

  async populateOgcOverlay(map, group, layerProp, source) {
    const bounds = this.paddedAirspaceBounds(map);
    const bbox = [
      bounds.getWest().toFixed(6),
      bounds.getSouth().toFixed(6),
      bounds.getEast().toFixed(6),
      bounds.getNorth().toFixed(6)
    ].join(',');

    await Promise.all((source.collections || []).map(async collection => {
      const url = `${source.url}/collections/${collection}/items?bbox=${bbox}&limit=500&f=json`;
      try {
        const res = await fetch(AirspaceService.requestUrl(url), { headers: { Accept: 'application/geo+json,application/json,*/*' } });
        if (!res.ok) throw new Error(`${source.label} ${collection} ${res.status}`);
        const data = await res.json();
        if (this[layerProp] !== group || !data.features?.length) return;
        this.addGeoJsonOverlay(group, data, source);
      } catch (error) {
        console.warn('Official OGC overlay failed:', source.label, collection, error);
      }
    }));
  },

  addGeoJsonOverlay(group, data, source) {
    if (!data?.features?.length) return;
    L.geoJSON(data, {
      pane: 'airspaceGeojsonPane',
      style: feature => this.officialOverlayStyle(feature, source),
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
        pane: 'airspaceGeojsonPane',
        radius: 6,
        ...this.officialOverlayStyle(feature, source),
        fillOpacity: 0.85
      }),
      onEachFeature: (feature, leafletLayer) => {
        const props = feature.properties || {};
        const name = props.name || props.Naam || props.naam || props.title || props.identifier || props.id || source.label;
        leafletLayer.bindTooltip(Util.escapeHtml(String(name)));
      }
    }).addTo(group);
  },

  addEd269Overlay(map, group, data, source) {
    const bounds = map.getBounds().pad(0.4);
    (data?.features || []).forEach(feature => {
      (feature.geometry || []).forEach(geometry => {
        const projection = geometry.horizontalProjection || {};
        const color = this.ed269Color(feature, source);
        const name = feature.name || feature.identifier || source.label;
        if (projection.type === 'Circle' && Array.isArray(projection.center)) {
          const latlng = [projection.center[1], projection.center[0]];
          if (!bounds.contains(latlng)) return;
          L.circle(latlng, {
            pane: 'airspaceGeojsonPane',
            radius: Number(projection.radius) || 0,
            color,
            weight: 2,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: 0.18
          }).bindTooltip(Util.escapeHtml(String(name))).addTo(group);
          return;
        }
        const coordinates = projection.coordinates || projection.outerBoundary || projection.points || [];
        if (Array.isArray(coordinates) && coordinates.length) {
          const latlngs = coordinates.map(point => Array.isArray(point) ? [point[1], point[0]] : null).filter(Boolean);
          if (latlngs.length < 3) return;
          L.polygon(latlngs, {
            pane: 'airspaceGeojsonPane',
            color,
            weight: 2,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: 0.18
          }).bindTooltip(Util.escapeHtml(String(name))).addTo(group);
        }
      });
    });
  },

  officialOverlayStyle(feature, source) {
    const props = feature?.properties || {};
    const raw = String(props.restriction || props.Restriction || props.zone_type || props.type || props.Type || '').toLowerCase();
    const isRestricted = raw.includes('prohibit') || raw.includes('restricted') || raw.includes('verbod') || raw.includes('ctr');
    const color = isRestricted ? '#ef4444' : (source.color || '#f59e0b');
    return {
      color,
      weight: 2,
      opacity: 0.9,
      fillColor: color,
      fillOpacity: isRestricted ? 0.22 : 0.16
    };
  },

  ed269Color(feature, source) {
    const rawColor = feature?.extendedProperties?.color;
    if (/^[0-9a-f]{6}$/i.test(rawColor || '')) return `#${rawColor}`;
    const restriction = String(feature?.restriction || '').toLowerCase();
    if (restriction.includes('prohibit')) return '#ef4444';
    if (restriction.includes('author')) return '#f59e0b';
    return source.color || '#f59e0b';
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
        outFields: '*',
        returnGeometry: 'true',
        outSR: '4326',
        resultRecordCount: '500'
      });

      try {
        const res = await fetch(`${layer.url}/query?${params.toString()}`);
        if (!res.ok) throw new Error(`Dronezoner ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || 'Dronezoner query failed');
        if (this[layerProp] !== group || !data.features?.length) return;
        L.geoJSON(data, {
          pane: 'airspaceGeojsonPane',
          style: () => ({
            color: layer.color,
            weight: 2,
            opacity: 0.9,
            fillColor: layer.color,
            fillOpacity: layer.fillOpacity
          }),
          pointToLayer: (_feature, latlng) => L.circleMarker(latlng, {
            pane: 'airspaceGeojsonPane',
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

  async populateDronespaceOverlay(map, group, layerProp) {
    if (this[layerProp] !== group) return;
    group.clearLayers();
    const bounds = this.paddedAirspaceBounds(map);
    const boundsKey = [
      Math.floor(bounds.getWest()),
      Math.floor(bounds.getSouth()),
      Math.ceil(bounds.getEast()),
      Math.ceil(bounds.getNorth())
    ].join(',');

    try {
      let data = AirspaceService.dronespaceCache.get(boundsKey);
      if (!data) {
        const params = new URLSearchParams({ bounds: boundsKey });
        const res = await fetch(AirspaceService.requestUrl(`${AirspaceService.dronespaceUasUrl}?${params.toString()}`));
        if (!res.ok) throw new Error(`Dronespace ${res.status}`);
        data = await res.json();
        AirspaceService.dronespaceCache.set(boundsKey, data);
      }
      if (this[layerProp] !== group || !data.features?.length) return;
      L.geoJSON(data, {
        pane: 'airspaceGeojsonPane',
        style: feature => AirspaceService.dronespaceStyle(feature),
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
          pane: 'airspaceGeojsonPane',
          radius: 6,
          ...AirspaceService.dronespaceStyle(feature),
          fillOpacity: 0.85
        }),
        onEachFeature: (feature, leafletLayer) => {
          leafletLayer.bindTooltip(Util.escapeHtml(AirspaceService.dronespaceTooltip(feature) || I18n.t('airspace.zone')));
        }
      }).addTo(group);
    } catch (error) {
      console.warn('Dronespace overlay failed:', error);
    }
  },

  paddedDronezonerBounds(map) {
    return this.paddedAirspaceBounds(map);
  },

  paddedAirspaceBounds(map) {
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

  async openLocationDetail(locationId, forceRefresh = false) {
    this.saveOpenEditorsNow();
    LocationManager.setActive(locationId);
    document.getElementById('locationsDetailView').classList.remove('hidden');
    document.getElementById('locationsListView').classList.add('hidden');
    await this.renderLocationDetail(locationId, forceRefresh);
  },

  bindSpotSuitabilityEditor(location) {
    const saveSuitability = async () => {
      const suitability = Array.from(document.querySelectorAll('[data-spot-suitability]:checked')).map(input => input.value);
      LocationManager.update(location.id, { suitability });
      location.suitability = suitability;
      const hint = document.getElementById('suitabilitySavedHint');
      if (hint) {
        hint.textContent = I18n.t('detail.saved');
        setTimeout(() => { if (hint) hint.textContent = ''; }, 1500);
      }
      await this.renderLocationsList();
      await this.renderDashboardLocationCards();
    };
    document.querySelectorAll('[data-spot-suitability]').forEach(input => {
      input.addEventListener('change', saveSuitability);
    });
  },

  async renderLocationDetail(locationId, forceRefresh = false) {
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
      const [weather, sun] = await Promise.all([
        WeatherService.get(location, forceRefresh),
        SunService.get(location, new Date(), forceRefresh)
      ]);
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
        ${UI.titleWithInfo(I18n.t('detail.flightStatus'), 'help.flightStatus')}
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
        <div class="flight-suitability mt-14">
          <label class="field">
            <span>${I18n.t('detail.suitability')}</span>
            ${UI.renderSpotSuitabilityPicker(location)}
          </label>
          <div id="suitabilitySavedHint" class="muted"></div>
        </div>
        <div class="tag-list mt-14">
          ${score.factors.map(f => `<span class="tag ${f.severity}">${Util.escapeHtml(f.label)}</span>`).join('')}
        </div>
        <p class="mt-12 muted">${I18n.t('detail.updated')}: ${Util.formatTime(new Date(), I18n.locale)}</p>
      `;
      this.bindSpotSuitabilityEditor(location);

      const posNow = this.getSolarPosition(new Date(), location.lat, location.lon);
      const posSR  = this.getSolarPosition(new Date(sun.data.results.sunrise), location.lat, location.lon);
      const posSS  = this.getSolarPosition(new Date(sun.data.results.sunset), location.lat, location.lon);
      const posGHS = this.getSolarPosition(gh.morningStart, location.lat, location.lon);
      const posGHE = this.getSolarPosition(gh.eveningEnd, location.lat, location.lon);

      let detailMapContainer = document.getElementById('detailMap');
      let detailMapInfo = document.getElementById('detailMapInfo');
      
      if (!detailMapContainer || !detailMapInfo) {
        UI.els.detailMapPanel.innerHTML = `
          ${UI.titleWithInfo(I18n.t('detail.map'), 'help.detailMap')}
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
      this.removeDuplicateDetailAirspacePanels();
      if (!UI.els.detailMapPanel.querySelector('#detailAirspacePanel')) {
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
      this.removeDuplicateDetailAirspacePanels();
      const airspacePanel = UI.els.detailMapPanel.querySelector('#detailAirspacePanel');
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
        <div class="route-action-group">
          <span id="detailTravelInfo" class="inline-pill">${I18n.t('detail.distanceLoading')}</span>
          <button class="btn" data-open-route="https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}">🧭 ${I18n.t('nav.route')}</button>
        </div>
        <button class="btn btn-secondary" data-open-pin="https://www.google.com/maps?q=${location.lat},${location.lon}">📍 ${I18n.t('nav.openMaps')}</button>
        ${AirspaceService.isOverlayAvailable(location) ? `<button class="btn btn-secondary" data-open-pin="${AirspaceService.mapUrl(location)}">🛡️ ${AirspaceService.openMapLabel(location)}</button>` : ''}
        ${AirspaceService.hasInteractiveOverlay(location) ? `<button class="btn btn-secondary" data-toggle-dipul>🗺️ ${this.isDipulOverlayEnabled() ? I18n.t('airspace.overlayOn') : I18n.t('airspace.overlayOff')}</button>` : ''}
      `;
      this.updateDetailTravelInfo(location);
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
      const detailNDTime = new Date();
      const detailND = NDRecommendationService.fromOpenMeteoHour(weather, sun.data.results, idx, {
        time: detailNDTime,
        sunElevation: posNow.elevation,
        rainSecondary: detailRainBS
      });
      UI.els.detailWeatherPanel.innerHTML = `
        ${UI.titleWithInfo(I18n.t('detail.weather'), 'help.weatherData')}
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
          <div class="kpi" title="${Util.escapeHtml(detailND.reason)}"><span>ND Filter</span><strong>${detailND.recommendedFilter}</strong></div>
        </div>
        <div class="wind-alt-bar">
          <span class="muted">Wind 80m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_80m[idx])} m/s</strong>
          <span class="muted">120m</span><strong>${Util.kmhToMs(weather.data.hourly.windspeed_120m[idx])} m/s</strong>
        </div>
        <p class="mt-12 muted nd-hint">${NDRecommendationService.hint}</p>
        <p class="mt-12">${meta.icon} ${meta[I18n.lang]}</p>
      `;

      const nextCountdown = gh.isActiveNow
        ? Util.countdown(new Date(), gh.whichPhase === 'morning' ? gh.morningEnd : gh.eveningEnd)
        : (gh.nextGolden ? Util.countdown(new Date(), gh.nextGolden) : '—');

      const sunrise = new Date(sun.data.results.sunrise);
      const sunset = new Date(sun.data.results.sunset);
      const dayMinutes = Math.round((sunset - sunrise) / 60000);
      UI.els.detailSunPanel.innerHTML = `
        ${UI.titleWithInfo(I18n.t('detail.sun'), 'help.sunData')}
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

      UI.els.detailHourlyPanel.innerHTML = `${UI.titleWithInfo(I18n.t('detail.hourly'), 'help.hourlyForecast')}<div id="detailHourlyInner" class=\"hourly-inner\"></div>`;
      UI.renderHourly(document.getElementById('detailHourlyInner'), weather, gh, location, sun.data.results);

      this.renderNotesPanel(location);
    } catch (error) {
      console.error(error);
      StatusTracker.update('weather', 'error');
      StatusTracker.update('sun', 'error');
      UI.updateStatusIndicator();
      UI.els.detailFlightPanel.innerHTML = `
        ${UI.titleWithInfo(I18n.t('detail.flightStatus'), 'help.flightStatus')}
        <p>${I18n.t('error.dataUnavailable')}</p>
        <div class="flight-suitability mt-14">
          <label class="field">
            <span>${I18n.t('detail.suitability')}</span>
            ${UI.renderSpotSuitabilityPicker(location)}
          </label>
          <div id="suitabilitySavedHint" class="muted"></div>
        </div>
      `;
      this.bindSpotSuitabilityEditor(location);
      UI.els.detailMapPanel.innerHTML = `${UI.titleWithInfo(I18n.t('detail.map'), 'help.detailMap')}<p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailWeatherPanel.innerHTML = `${UI.titleWithInfo(I18n.t('detail.weather'), 'help.weatherData')}<p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailSunPanel.innerHTML = `${UI.titleWithInfo(I18n.t('detail.sun'), 'help.sunData')}<p>${I18n.t('error.dataUnavailable')}</p>`;
      UI.els.detailHourlyPanel.innerHTML = `${UI.titleWithInfo(I18n.t('detail.hourly'), 'help.hourlyForecast')}<p>${I18n.t('error.dataUnavailable')}</p>`;
      this.renderNotesPanel(location);
    }
  },

  renderNotesPanel(location) {
    UI.els.detailNotesPanel.innerHTML = `
      ${UI.titleWithInfo(I18n.t('detail.notesLogbook'), 'help.notesLogbook')}
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
      this.renderLocationsList();
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

    if (this.editingLogId) {
      const id = this.editingLogId;
      const autosaveLog = Util.debounce(() => {
        const dateInput = document.getElementById(`inline-log-date-${id}`);
        const droneInput = document.getElementById(`inline-log-drone-${id}`);
        const noteInput = document.getElementById(`inline-log-note-${id}`);
        if (!dateInput || !droneInput || !noteInput) return;
        LocationManager.updateLog(location.id, id, {
          date: dateInput.value,
          drone: droneInput.value,
          note: noteInput.value.trim()
        });
        this.flushAutosaveSoon();
      }, 400);
      [`inline-log-date-${id}`, `inline-log-drone-${id}`, `inline-log-note-${id}`].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.addEventListener('input', autosaveLog);
        field.addEventListener('change', autosaveLog);
      });
    }
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

    if (this.editingDroneId) {
      const id = this.editingDroneId;
      const autosaveDrone = Util.debounce(() => {
        const name = document.getElementById(`inline-drone-name-${id}`);
        const style = document.getElementById(`inline-drone-style-${id}`);
        const weight = document.getElementById(`inline-drone-weight-${id}`);
        const size = document.getElementById(`inline-drone-size-${id}`);
        const maxWind = document.getElementById(`inline-drone-maxwind-${id}`);
        const maxGusts = document.getElementById(`inline-drone-maxgusts-${id}`);
        const color = document.getElementById(`inline-drone-${id}-color`);
        const rain = document.getElementById(`inline-drone-rain-${id}`);
        if (!name || !name.value.trim()) return;
        ProfileManager.update(id, {
          label: name.value.trim(),
          style: style.value,
          weight: Number(weight.value),
          size: Number(size.value),
          maxWind: Number(maxWind.value),
          maxGusts: Number(maxGusts.value),
          color: color.value,
          rainTolerance: rain.value
        });
        UI.renderProfileSelect();
        UI.renderDashboardLocationSelect();
        this.flushAutosaveSoon();
      }, 400);

      [
        `inline-drone-name-${id}`,
        `inline-drone-style-${id}`,
        `inline-drone-weight-${id}`,
        `inline-drone-size-${id}`,
        `inline-drone-maxwind-${id}`,
        `inline-drone-maxgusts-${id}`,
        `inline-drone-${id}-color`,
        `inline-drone-rain-${id}`
      ].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.addEventListener('input', autosaveDrone);
        field.addEventListener('change', autosaveDrone);
      });
    }

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

    if (this.editingChecklistId) {
      const id = this.editingChecklistId;
      const autosaveChecklist = Util.debounce(() => {
        const name = document.getElementById(`inline-name-${id}`);
        const count = document.getElementById(`inline-count-${id}`);
        const category = document.getElementById(`inline-cat-${id}`);
        const notes = document.getElementById(`inline-notes-${id}`);
        if (!name || !name.value.trim()) return;
        const old = ChecklistManager.getAll().find(x => x.id === id);
        ChecklistManager.update(id, {
          name: name.value.trim(),
          count: Number(count.value),
          category: category.value,
          notes: notes.value.trim(),
          attachments: old ? (old.attachments || (old.attachment ? [{ data: old.attachment, type: old.attachmentType, name: 'Datei' }] : [])) : []
        });
        this.flushAutosaveSoon();
      }, 400);

      [`inline-name-${id}`, `inline-count-${id}`, `inline-cat-${id}`, `inline-notes-${id}`].forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.addEventListener('input', autosaveChecklist);
        field.addEventListener('change', autosaveChecklist);
      });

      const fileInput = document.getElementById(`inline-file-${id}`);
      fileInput?.addEventListener('change', async () => {
        const old = ChecklistManager.getAll().find(x => x.id === id);
        if (!old) return;
        const attachments = old.attachments || (old.attachment ? [{ data: old.attachment, type: old.attachmentType, name: 'Datei' }] : []);
        const files = Array.from(fileInput.files);
        for (const file of files) {
          if (file.size > 2 * 1024 * 1024) {
            alert(`Datei "${file.name}" zu groÃŸ (Max 2MB)`);
            continue;
          }
          const attachment = await AttachmentManager.upload(file);
          attachments.push(attachment);
        }
        ChecklistManager.update(id, { attachments });
        this.flushAutosaveSoon();
      });
    }
  },

  async renderActivePage() {
    this.saveOpenEditorsNow();
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


