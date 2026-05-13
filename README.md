# DroneOps

DroneOps ist ein leichtgewichtiges, browserbasiertes Dashboard fuer Drohnenpiloten. Die App kombiniert Wetter, Golden Hour, Flugscore, gespeicherte Spots, Drohnenprofile, Checklisten und UAS-Geozonen in einer GitHub-Pages-faehigen PWA.

Stand dieser README: 13. Mai 2026.

## Kurzueberblick

- Dashboard fuer GPS-Position oder gespeicherten Spot
- Wetter- und Windbewertung mit aktivem Drohnenprofil
- Golden-Hour-Auswertung mit Sonnenstand
- Spotverwaltung mit Name, Land, Koordinaten, Karte, Route, Notizen und Logbuch
- Spot-Eignung pro Spot mit Mehrfachauswahl
- Filter fuer Spots nach Name, Land und Flugstil
- Kartenansicht fuer Such- und Filterergebnisse
- UAS-Geozonen als echte Kartenoverlays, wo stabile Datenquellen verfuegbar sind
- Offizielle Kartenlinks als Fallback fuer Laender ohne direkt nutzbare Overlay-Schnittstelle
- Dashboard- und Detailkarten mit Overlay-Schalter und Link zur offiziellen Drohnenkarte
- DE/EN-Umschaltung
- Speicherung lokal im Browser ueber `localStorage`
- PWA-Dateien: `manifest.json` und `sw.js`

## Aktueller Funktionsstand

### Dashboard

Das Dashboard kann entweder mit der aktuellen GPS-Position oder mit einem gespeicherten Spot arbeiten. Es zeigt:

- aktiven Spot und aktives Drohnenprofil
- aktuelle Wetterlage
- Flugscore
- Wind, Boeen, ND-Filter-Empfehlung
- Wind in 80 m und 120 m
- Golden Hour
- Karte mit Marker
- UAS-Zonen-Overlay, falls fuer das Land ein echtes Overlay vorhanden ist
- Link zur passenden offiziellen Drohnenkarte, falls eine Quelle hinterlegt ist
- Uebersichtskarten der gespeicherten Locations

### Spots und Locations

Spots koennen per Suche, GPS oder Kartenauswahl angelegt werden. Fuer jeden Spot werden gespeichert:

- Name
- Koordinaten
- Land und Laendercode, soweit durch Reverse Geocoding verfuegbar
- Notizen
- Logbuch-Eintraege
- Spot-Eignungen

Die Spot-Eignungen koennen mehrfach ausgewaehlt werden:

- Freestyle
- Cinematic
- Long Range
- Tiny Whoop
- Racing
- Cruising
- Proximity
- Training
- Chase
- Indoor

Die Such- und Filteroberflaeche erlaubt aktuell bewusst nur diese Flugstil-Suchen:

- Freestyle
- Cinematic
- Long Range
- Racing

Zusaetzlich kann nach Spotname und Land gefiltert werden. Die Landerkennung basiert auf den Koordinaten der Karte bzw. auf Reverse-Geocoding-Daten.

### Flugstatus

Die Spot-Eignungen sind Teil des Flugstatus beziehungsweise der Spotinformationen, nicht Teil des Logbuchs. Das Logbuch bleibt fuer konkrete Flugnotizen und Flugereignisse.

## UAS-Geozonen und Kartenintegration

DroneOps unterscheidet zwischen zwei Arten von Kartenanbindungen:

1. **Direktes Overlay in der eigenen Karte**
   Die UAS-Zonen werden direkt in der Leaflet-Karte von DroneOps angezeigt. Diese Variante wird genutzt, wenn ein stabiler WMS-, GeoJSON-, OGC-API- oder ArcGIS-Endpunkt verfuegbar ist.

2. **Offizielle Kartenverlinkung**
   Die App zeigt einen Button zur jeweiligen offiziellen nationalen Drohnenkarte. Diese Variante wird genutzt, wenn die angegebene Karte keine stabile, oeffentliche und direkt verwendbare Overlay-Schnittstelle fuer die eigene Leaflet-Karte bereitstellt oder wenn Einbettung/CORS unzuverlaessig ist.

Wichtig: Die Karten- und Overlay-Anbindung ist eine Planungshilfe. Sie ist keine verbindliche Flugfreigabe. Vor jedem Flug muessen Kategorie, Auflagen, lokale Regeln, NOTAMs, Grundstuecke, Menschenansammlungen und temporaere Beschraenkungen separat geprueft werden.

## Laender mit direktem Overlay

| Land | Provider in DroneOps | Quelle / Dienst | Technische Anbindung | Verwendung |
| --- | --- | --- | --- | --- |
| Deutschland | `dipul` | DIPUL / DFS / BKG | WMS `https://uas-betrieb.de/geoservices/dipul/wms` | Detailkarte und Dashboard |
| Oesterreich | `dronespace` | Austro Control / Dronespace | GeoJSON `https://utm.dronespace.at/avm/utm/uas.geojson` | Detailkarte und Dashboard |
| Schweiz | `swissgeo` | BAZL / swisstopo GeoAdmin | WMS `https://wms.geo.admin.ch/`, Layer `ch.bazl.einschraenkungen-drohnen` | Detailkarte und Dashboard |
| Daenemark | `dronezoner` | Dronezoner / Trafikstyrelsen | ArcGIS FeatureServer Layer | Detailkarte und Dashboard |
| Frankreich | `officialdata` | Geoportail / DGAC | WMS `https://data.geopf.fr/wms-r`, Layer `TRANSPORTS.DRONES.RESTRICTIONS` | Detailkarte und Dashboard |
| Irland | `officialdata` | Irish Aviation Authority | GeoJSON-Datei der IAA | Detailkarte und Dashboard |
| Niederlande | `officialdata` | LVNL / PDOK / GoDrone | OGC API Features `https://api.pdok.nl/lvnl/drone-no-flyzones/ogc/v1` | Detailkarte und Dashboard |
| Portugal | `officialdata` | ANAC Portugal | ED-269 JSON `https://dnt.anac.pt/json/UASZoneVersion%2022042026083205.json` | Detailkarte und Dashboard |

### Direkt genutzte Layer und Collections

Deutschland nutzt eine Sammlung von DIPUL-WMS-Layern, unter anderem:

- Flugplaetze und Flughaefen
- Kontrollzonen
- Flugbeschraenkungsgebiete
- Bundesautobahnen, Bundesstrassen, Bahnanlagen und Wasserstrassen
- Wohn-, Industrie-, Energie- und Sicherheitsbereiche
- Krankenhaeuser
- Nationalparks, Naturschutzgebiete, FFH- und Vogelschutzgebiete
- temporaere Betriebseinschraenkungen
- Modellflugplaetze

Daenemark nutzt mehrere ArcGIS-FeatureServer-Layer fuer Dronezoner-Kategorien:

- gruen: Naturbereiche
- blau: sicherheitskritische Bereiche
- gelb/orange: Hinweis- und Restriktionsbereiche
- rot: flugsicherheitskritische Bereiche
- aktive, inaktive und Hinweis-NOTAMs

Niederlande nutzt aktuell diese PDOK-Collections:

- `luchtvaartgebieden`
- `landingsite`

Portugal verarbeitet ED-269-Geometrien, unter anderem Kreise und, soweit vorhanden, Polygon-Definitionen.

## Laender mit offizieller Kartenverlinkung

Diese Laender haben aktuell keinen echten In-App-Layer in DroneOps, sondern einen Button zur jeweiligen offiziellen oder verwendeten Webkarte:

| Land | Quelle / Karte | Link |
| --- | --- | --- |
| Belgien | Droneguide / skeyes | `https://map.droneguide.be/` |
| Island | Kortasja / Dronar | `https://kort.gis.is/mapview/?app=dronar` |
| Schweden | LFV Dronechart | `https://daim.lfv.se/echarts/dronechart/` |
| UK / Grossbritannien | Google My Maps UAS Map | `https://www.google.com/maps/d/u/0/viewer?mid=1BktWMPYNuh6N5_IPngyq8jW80nAWXI8d` |
| Italien | d-flight / ENAC | `https://www.d-flight.it/new_portal/services/mappe/` |
| Spanien | ENAIRE Drones | `https://drones.enaire.es/` |
| Bulgarien | Civil Aviation Administration Bulgaria | `https://www.caa.bg/bg/category/633/7062` |
| Kroatien | Croatia Control AMC | `https://amc.crocontrol.hr/Current-situation-anonymous-users` |
| Zypern | Cyprus drone map | `https://drones.gov.cy/geo-zones-map/` |
| Tschechien | Dronemap | `https://dronemap.gov.cz/` |
| Estland | EANS UTM | `https://utm.eans.ee/` |
| Finnland | Droneinfo | `https://www.droneinfo.fi/en/where-to-fly` |
| Griechenland | HCAA / DAGR | `https://dagr.hasp.gov.gr/` |
| Ungarn | MyDroneSpace | `https://mydronespace.hu/` |
| Lettland | Airspace.lv | `https://www.airspace.lv/drones` |
| Liechtenstein | GeoAdmin UAS Layer | `https://map.geo.admin.ch/#/map?topic=aviation&layers=ch.bazl.einschraenkungen-drohnen` |
| Litauen | UTM ANS Lithuania | `https://utm.ans.lt/` |
| Luxemburg | Geoportail Luxembourg | `https://map.geoportail.lu/` |
| Malta | Transport Malta | `https://www.transport.gov.mt/aviation/drones` |
| Norwegen | Luftfartstilsynet | `https://www.luftfartstilsynet.no/en/drones/` |
| Polen | PANSA DroneMap | `https://dronemap.pansa.pl/` |
| Rumaenien | ROMATSA Flightplan | `https://flightplan.romatsa.ro/init/drones` |
| Slowakei | LPS GIS | `https://gis.lps.sk/` |
| Slowenien | CAA Slovenia ArcGIS | `https://caa-slovenia.maps.arcgis.com/` |

Wenn fuer ein Land keine spezifische Quelle erkannt wird, faellt DroneOps auf DroneSafetyMap als generischen Link zurueck.

## Kartenlogik im Code

Die zentrale Logik liegt in `main.js` im Objekt `AirspaceService`.

Wichtige Konzepte:

- `provider(location)` entscheidet anhand von Koordinaten, Land und Laendercode, welche Quelle verwendet wird.
- `hasInteractiveOverlay(location)` entscheidet, ob ein echtes In-App-Overlay verfuegbar ist.
- `mapUrl(location)` liefert den passenden Link zur externen Karte.
- `officialLayerSources` enthaelt Laender mit echten Datenlayern.
- `officialMapLinks` enthaelt externe Kartenlinks.
- `officialWebOverlays` enthaelt Karten, die nicht als stabile echte Leaflet-Layer behandelt werden.
- `syncAirspaceOverlay(...)` schaltet Overlays auf Dashboard- und Detailkarte.
- `populateOfficialDataOverlay(...)` laedt und rendert GeoJSON, ED-269 und OGC-API-Daten.

Provider-Reihenfolge:

1. Schweiz
2. Oesterreich
3. Deutschland
4. Daenemark
5. Laender mit offiziellen Datenlayern
6. Laender mit offiziellen Webkarten
7. Laender mit offiziellen Kartenlinks
8. DroneSafetyMap-Fallback

## Automatische Regelpruefung

Die App kann fuer Deutschland ueber DIPUL per `GetFeatureInfo` konkrete Zonen am Punkt abfragen und daraus Hinweise ableiten.

Fuer andere Laender werden Overlays und Quellen angezeigt, aber keine verbindliche automatische Rechtspruefung durchgefuehrt. Diese Laender erhalten den Status `overlay`, damit klar ist: Die Karte ist eingebunden, aber die Entscheidung muss anhand der offiziellen Karte und Regeln erfolgen.

## Technische Architektur

Das Projekt ist als statische Web-App aufgebaut.

```text
DroneOps/
├─ index.html
├─ styles.css
├─ main.js
├─ config.js
├─ manifest.json
├─ sw.js
├─ data/
│  ├─ profiles.json
│  ├─ translations.json
│  └─ weathercodes.json
└─ js/
   ├─ attachments.js
   ├─ cloud.js
   ├─ core.js
   ├─ i18n.js
   ├─ index.js
   ├─ managers.js
   ├─ map.js
   ├─ score.js
   ├─ ui.js
   ├─ util.js
   └─ weather.js
```

### Wichtige Module

| Datei | Aufgabe |
| --- | --- |
| `index.html` | App-Shell und UI-Struktur |
| `styles.css` | Layout, Karten, Panels, Buttons und responsive Darstellung |
| `main.js` | Hauptlogik, Dashboard, Locations, Kartenoverlays, Events |
| `config.js` | optionale Konfiguration, z.B. Proxy fuer Airspace-Abfragen |
| `js/i18n.js` | Uebersetzung und Sprachumschaltung |
| `js/managers.js` | Storage-Manager fuer Profile, Checklisten, Locations |
| `js/map.js` | Leaflet-Map-Handling |
| `js/weather.js` | Wetter-, BrightSky- und Sonnen-Dienste |
| `js/score.js` | Flugscore und Golden-Hour-Logik |
| `data/translations.json` | DE/EN-Texte |
| `data/profiles.json` | Drohnenprofile |
| `data/weathercodes.json` | Wettercode-Metadaten |

## Datenhaltung

DroneOps speichert Nutzerdaten im Browser:

- Spots
- Notizen
- Logbuch
- Drohnenprofile
- Checklistenstatus
- Dashboard-Auswahl
- UI-Einstellungen
- Cache-Daten

Es gibt aktuell kein Backend und keine Datenbank. Dadurch laeuft die App einfach auf GitHub Pages, aber Daten sind browser- und geraetegebunden, sofern keine Cloud-Funktion aktiv eingebunden wird.

## Entwicklung und lokale Ausfuehrung

Das Projekt benoetigt aktuell keinen Build-Schritt. Es gibt kein `package.json`.

Zum lokalen Testen reicht ein statischer HTTP-Server, z.B.:

```powershell
python -m http.server 8080
```

Danach:

```text
http://localhost:8080
```

Ein direktes Oeffnen der `index.html` kann je nach Browser bei Modulen, Fetch-Aufrufen oder Service Worker eingeschraenkt sein. Ein lokaler HTTP-Server ist deshalb die robustere Variante.

## Validierung

Aktuell genutzte schnelle Checks:

```powershell
node --check main.js
git diff --check
```

Ein Build-Test ist derzeit nicht vorhanden, weil das Projekt ohne Node-Buildsystem arbeitet.

## Bekannte Grenzen

- Externe Karten- und Geodienste koennen CORS, Rate Limits, Login, Token oder Einbettungsschutz verwenden.
- Webkarten wie Droneguide, Dronechart oder Google My Maps werden deshalb als Links behandelt, nicht als verlaessliche echte Overlays.
- UAS-Regeln koennen sich kurzfristig aendern. Die App ersetzt keine Pruefung der offiziellen Quellen vor Ort.
- Temporaere Beschraenkungen, NOTAMs und lokale Sonderregeln sind nicht in jedem Land vollstaendig automatisch abgedeckt.
- Einige Laender werden anhand von Bounding-Boxes erkannt, wenn kein sauberer Laendercode gespeichert wurde.
- Reverse Geocoding kann je nach Anbieter deutsche oder englische Laendernamen liefern.

## Roadmap-Ideen

- Mehr Laender von Link auf echte Overlay-Datenquellen umstellen
- Layer-Legenden pro Land anzeigen
- Quellenstatus in der UI sichtbar machen
- Manuelle Aktualisierung der UAS-Layer erzwingen
- Bessere ED-269-Unterstuetzung fuer komplexe Geometrien
- Import/Export der Spots und Einstellungen
- Optionales Cloud-Sync fuer Spots, Checklisten und Profile
- Testabdeckung fuer `AirspaceService.provider`, Land-Erkennung und Overlay-Parser

## Rechtlicher Hinweis

DroneOps ist ein Planungstool fuer Drohnenfluege. Die App stellt keine Flugfreigabe dar und ersetzt keine verbindliche Pruefung der geltenden Vorschriften. Verantwortlich fuer einen legalen und sicheren Flug bleibt immer der Pilot beziehungsweise Betreiber.
