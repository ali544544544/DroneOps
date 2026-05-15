import assert from "node:assert/strict";
import { estimateNDFromWeather } from "./ndWeatherEstimate.ts";

const sun = {
  sunrise: "2026-05-15T06:00:00+02:00",
  sunset: "2026-05-15T20:00:00+02:00"
};

function nd(overrides = {}) {
  return estimateNDFromWeather({
    time: "2026-05-15T12:00:00+02:00",
    weatherCode: 0,
    precipitation: 0,
    visibility: 10000,
    ...sun,
    ...overrides
  }).recommendedFilter;
}

assert.equal(nd({ cloudCover: 0 }), "ND64", "clear noon should recommend ND64");
assert.equal(nd({ cloudCover: 20 }), "ND32", "sunny with a few clouds should recommend ND32");
assert.equal(nd({ cloudCover: 45 }), "ND16", "light cloud cover should recommend ND16");
assert.equal(nd({ cloudCover: 70 }), "ND8", "cloudy should recommend ND8");
assert.equal(nd({ cloudCover: 90 }), "ND4", "overcast should recommend ND4");
assert.equal(nd({ time: "2026-05-15T06:30:00+02:00", cloudCover: 5 }), "ND8", "clear golden hour should recommend ND8");
assert.equal(nd({ time: "2026-05-15T19:30:00+02:00", cloudCover: 80 }), "ND4", "cloudy golden hour should recommend ND4");
assert.equal(nd({ time: "2026-05-15T05:30:00+02:00", cloudCover: 0 }), "ND0", "blue hour should recommend ND0");
assert.equal(nd({ time: "2026-05-15T22:00:00+02:00", cloudCover: 0 }), "ND0", "night should recommend ND0");
assert.equal(nd({ cloudCover: 30, weatherCode: 45, visibility: 2000 }), "ND0", "fog or poor visibility should recommend ND0");
assert.equal(nd({ cloudCover: 20, weatherCode: 61, precipitation: 0.2, visibility: 10000 }), "ND4", "light rain in bright daylight should recommend ND4");
assert.equal(nd({ cloudCover: undefined }), "ND64", "missing cloud cover falls back to clear weather code");
assert.equal(estimateNDFromWeather({ cloudCover: 0, ...sun }).confidence, "medium");
assert.equal(estimateNDFromWeather({ weatherCode: 0 }).confidence, "low");

console.log("ndWeatherEstimate tests passed");
