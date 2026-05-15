export type NDFilter = "ND0" | "ND4" | "ND8" | "ND16" | "ND32" | "ND64" | "ND128";

export type NDStrength = "none" | "low" | "medium" | "high" | "very_high";

export type NDConfidence = "medium" | "low";

export type NDRecommendation = {
  recommendedFilter: NDFilter;
  ndValue: number;
  strength: NDStrength;
  confidence: NDConfidence;
  method: "weather_estimate";
  reason: string;
  warnings: string[];
};

export type NDWeatherEstimateInput = {
  time?: Date | string | number | null;
  sunrise?: Date | string | number | null;
  sunset?: Date | string | number | null;
  cloudCover?: number | null;
  cloud_cover?: number | null;
  weatherCode?: number | string | null;
  weather_code?: number | string | null;
  precipitation?: number | null;
  rain?: number | null;
  visibility?: number | null;
  sunElevation?: number | null;
  surface?: string | null;
};
