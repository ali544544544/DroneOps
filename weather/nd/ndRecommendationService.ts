import { estimateNDFromWeather } from "./ndWeatherEstimate.ts";
import type { NDRecommendation, NDWeatherEstimateInput } from "./ndTypes.ts";

export const ND_FILTER_HINT = "ND-Filter-Schätzung basiert auf Wetter und Tageszeit. Für exakte Belichtung Kameraanzeige prüfen.";

type OpenMeteoWeatherBundle = {
  data?: {
    current_weather?: {
      time?: string;
      weathercode?: number;
    };
    hourly?: {
      time?: string[];
      cloudcover?: number[];
      weathercode?: number[];
      precipitation?: number[];
      visibility?: number[];
    };
  };
};

type OpenMeteoOptions = {
  time?: Date | string | number | null;
  sunElevation?: number | null;
  rainSecondary?: number | null;
  surface?: string | null;
};

function hourInput(
  weather: OpenMeteoWeatherBundle,
  sunResults: { sunrise?: string; sunset?: string } | null | undefined,
  index: number,
  options: OpenMeteoOptions = {}
): NDWeatherEstimateInput {
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
  fromWeather(input: NDWeatherEstimateInput): NDRecommendation {
    return estimateNDFromWeather(input);
  },
  fromOpenMeteoHour(
    weather: OpenMeteoWeatherBundle,
    sunResults: { sunrise?: string; sunset?: string } | null | undefined,
    index: number,
    options: OpenMeteoOptions = {}
  ): NDRecommendation {
    return estimateNDFromWeather(hourInput(weather, sunResults, index, options));
  }
};
