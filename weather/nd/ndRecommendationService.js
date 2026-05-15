import { estimateNDFromWeather } from "./ndWeatherEstimate.js";

export const ND_FILTER_HINT = "ND-Filter-Schätzung basiert auf Wetter und Tageszeit. Für exakte Belichtung Kameraanzeige prüfen.";

function hourInput(weather, sunResults, index, options = {}) {
  const hourly = weather?.data?.hourly || {};
  const precipitation = hourly.precipitation?.[index];
  const rainSecondary = options.rainSecondary;

  return {
    time: options.time ?? hourly.time?.[index] ?? weather?.data?.current_weather?.time,
    sunrise: sunResults?.sunrise,
    sunset: sunResults?.sunset,
    cloudCover: hourly.cloudcover?.[index],
    weatherCode: hourly.weathercode?.[index] ?? weather?.data?.current_weather?.weathercode,
    precipitation: rainSecondary !== null && rainSecondary !== undefined
      ? Math.max(Number(precipitation || 0), Number(rainSecondary || 0))
      : precipitation,
    visibility: hourly.visibility?.[index],
    sunElevation: options.sunElevation,
    surface: options.surface
  };
}

export const NDRecommendationService = {
  hint: ND_FILTER_HINT,
  fromWeather(input) {
    return estimateNDFromWeather(input);
  },
  fromOpenMeteoHour(weather, sunResults, index, options = {}) {
    return estimateNDFromWeather(hourInput(weather, sunResults, index, options));
  }
};
