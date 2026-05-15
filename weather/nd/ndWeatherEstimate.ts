import type { NDFilter, NDRecommendation, NDStrength, NDWeatherEstimateInput } from "./ndTypes.ts";

const ND_VALUE: Record<NDFilter, number> = {
  ND0: 0,
  ND4: 4,
  ND8: 8,
  ND16: 16,
  ND32: 32,
  ND64: 64,
  ND128: 128
};

const ND_STRENGTH: Record<NDFilter, NDStrength> = {
  ND0: "none",
  ND4: "low",
  ND8: "low",
  ND16: "medium",
  ND32: "high",
  ND64: "very_high",
  ND128: "very_high"
};

const FOG_CODES = new Set([45, 48]);
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const REFLECTIVE_SURFACES = new Set(["water", "wasser", "snow", "schnee", "beach", "strand", "sand", "concrete", "beton"]);

function toDate(value: NDWeatherEstimateInput["time"]): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function toNumber(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function isBetween(value: Date, start: Date, end: Date): boolean {
  return value >= start && value <= end;
}

function buildRecommendation(
  filter: NDFilter,
  reason: string,
  confidence: NDRecommendation["confidence"],
  warnings: string[]
): NDRecommendation {
  return {
    recommendedFilter: filter,
    ndValue: ND_VALUE[filter],
    strength: ND_STRENGTH[filter],
    confidence,
    method: "weather_estimate",
    reason,
    warnings
  };
}

export function estimateNDFromWeather(input: NDWeatherEstimateInput = {}): NDRecommendation {
  const time = toDate(input.time) || new Date();
  const sunrise = toDate(input.sunrise);
  const sunset = toDate(input.sunset);
  const cloudCover = toNumber(input.cloudCover ?? input.cloud_cover);
  const weatherCode = toNumber(input.weatherCode ?? input.weather_code);
  const precipitation = Math.max(0, toNumber(input.precipitation) ?? 0, toNumber(input.rain) ?? 0);
  const visibility = toNumber(input.visibility);
  const sunElevation = toNumber(input.sunElevation);
  const hasSunTimes = !!sunrise && !!sunset;
  const confidence = hasSunTimes && cloudCover !== null ? "medium" : "low";
  const warnings = ["Nur Kamera-/Bildempfehlung, keine Flugfreigabe. Flugsicherheit bleibt beim Drone Weather Risk Score."];

  if (!hasSunTimes) warnings.push("Sonnenaufgang/Sonnenuntergang fehlen, Tageslichtphase nur grob geschätzt.");
  if (cloudCover === null) warnings.push("Cloud Cover fehlt, Bewölkung kann nicht sicher bewertet werden.");
  if (weatherCode === null) warnings.push("Weather Code fehlt, Regen/Schnee/Nebel werden nur über Messwerte erkannt.");
  if (visibility === null) warnings.push("Sichtweite fehlt, Nebel/Dunst kann nicht sicher bewertet werden.");

  const isFog = weatherCode !== null && FOG_CODES.has(weatherCode);
  const isRain = weatherCode !== null && RAIN_CODES.has(weatherCode);
  const isSnow = weatherCode !== null && SNOW_CODES.has(weatherCode);
  const isLowVisibility = visibility !== null && visibility < 3000;
  const hasPrecipitation = precipitation > 0;

  if (hasSunTimes) {
    const morningBlueStart = addMinutes(sunrise, -45);
    const eveningBlueEnd = addMinutes(sunset, 45);
    if (isBetween(time, morningBlueStart, sunrise) || isBetween(time, sunset, eveningBlueEnd)) {
      return buildRecommendation("ND0", "Blue Hour/Dämmerung: sehr wenig Licht, kein ND-Filter empfohlen.", confidence, warnings);
    }
    if (time < sunrise || time > sunset) {
      return buildRecommendation("ND0", "Nacht: Sonne unter dem Horizont, kein ND-Filter empfohlen.", confidence, warnings);
    }
  } else if (sunElevation !== null && sunElevation < 0) {
    return buildRecommendation("ND0", "Sonnenhöhe unter dem Horizont, kein ND-Filter empfohlen.", confidence, warnings);
  }

  if (isFog || isSnow || isLowVisibility) {
    return buildRecommendation("ND0", "Nebel, Schnee oder geringe Sicht: möglichst viel Licht auf den Sensor lassen.", confidence, warnings);
  }

  if (hasPrecipitation || isRain) {
    const filter: NDFilter = cloudCover !== null && cloudCover < 60 && visibility !== null && visibility >= 5000 ? "ND4" : "ND0";
    return buildRecommendation(filter, "Regen/Schauer: ND-Schätzung stark reduziert, weil Licht und Kontrast meist schwächer sind.", confidence, warnings);
  }

  if (hasSunTimes) {
    const morningGoldenEnd = addMinutes(sunrise, 60);
    const eveningGoldenStart = addMinutes(sunset, -60);
    if (isBetween(time, sunrise, morningGoldenEnd) || isBetween(time, eveningGoldenStart, sunset)) {
      const filter: NDFilter = cloudCover !== null && cloudCover >= 60 ? "ND4" : "ND8";
      return buildRecommendation(filter, "Golden Hour: warmes, flacheres Licht, daher nur leichter ND-Filter.", confidence, warnings);
    }
  } else if (sunElevation !== null && sunElevation > 0 && sunElevation < 10) {
    return buildRecommendation("ND4", "Niedrige Sonnenhöhe: Licht wirkt eher wie Golden Hour, daher nur leichter ND-Filter.", confidence, warnings);
  }

  if (cloudCover !== null) {
    if (cloudCover >= 85) return buildRecommendation("ND4", "Stark bewölkt: wenig direktes Sonnenlicht.", confidence, warnings);
    if (cloudCover >= 60) return buildRecommendation("ND8", "Bewölkt: gedämpftes Tageslicht.", confidence, warnings);
    if (cloudCover >= 30) return buildRecommendation("ND16", "Leicht bewölkt: mittlere ND-Stärke für typische Videoaufnahmen.", confidence, warnings);
    if (cloudCover >= 10) return buildRecommendation("ND32", "Sonnig mit wenigen Wolken: starker ND-Filter für helle Szenen.", confidence, warnings);

    const hasReflectiveSurface = input.surface ? REFLECTIVE_SURFACES.has(String(input.surface).trim().toLowerCase()) : false;
    return buildRecommendation(
      hasReflectiveSurface ? "ND128" : "ND64",
      hasReflectiveSurface
        ? "Sehr heller Himmel plus reflektierende Oberfläche: sehr hoher ND-Filter möglich."
        : "Sehr sonnig/klar außerhalb der Golden Hour: hoher ND-Filter für typische Videoaufnahmen.",
      confidence,
      warnings
    );
  }

  if (weatherCode === 3) return buildRecommendation("ND4", "Bedeckt laut Weather Code: niedrige ND-Stärke.", confidence, warnings);
  if (weatherCode === 2) return buildRecommendation("ND16", "Teilweise bewölkt laut Weather Code: mittlere ND-Stärke.", confidence, warnings);
  if (weatherCode === 0 || weatherCode === 1) return buildRecommendation("ND64", "Klarer Himmel laut Weather Code: hoher ND-Filter.", confidence, warnings);

  if (sunElevation !== null) {
    if (sunElevation >= 35) return buildRecommendation("ND64", "Hohe Sonnenhöhe: helle Mittagssituation geschätzt.", confidence, warnings);
    if (sunElevation >= 15) return buildRecommendation("ND32", "Mittlere Sonnenhöhe: helle Tageslichtsituation geschätzt.", confidence, warnings);
    if (sunElevation >= 5) return buildRecommendation("ND16", "Niedrige Sonnenhöhe: moderate ND-Stärke geschätzt.", confidence, warnings);
  }

  return buildRecommendation("ND8", "Unvollständige Lichtdaten: konservative Wetter-Schätzung.", confidence, warnings);
}
