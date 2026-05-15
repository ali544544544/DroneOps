// ScoreEngine and GoldenHour calculations
// I18n is referenced globally during the transition phase

export const ScoreEngine = {
  calculate({ wind = 0, gusts = 0, rain = 0, rainSecondary = null, clouds = 0, visibility = 10000, temp = 20, profile }, i18n) {
    // i18n is injected for module compatibility, falls back to global I18n
    const t = (key) => (i18n || window.I18n)?.t(key) || key;
    let score = 100;
    const factors = [];

    const effectiveRain = rainSecondary !== null ? Math.max(rain, rainSecondary) : rain;

    // === WIND ===
    const windRatio = wind / profile.maxWind;
    if (windRatio <= 0.5) {
      factors.push({ key: 'wind', label: t('factor.windOk'), severity: 'ok' });
    } else if (windRatio <= 0.85) {
      score -= Math.round(15 * (windRatio - 0.5) / 0.35);
      factors.push({ key: 'wind', label: t('factor.windWarn'), severity: 'warn' });
    } else if (windRatio <= 1.1) {
      score -= 15 + Math.round(25 * (windRatio - 0.85) / 0.25);
      factors.push({ key: 'wind', label: t('factor.windCritical'), severity: 'critical' });
    } else {
      score -= 50;
      factors.push({ key: 'wind', label: t('factor.windCritical'), severity: 'critical' });
    }

    // === GUSTS ===
    const gustRatio = gusts / profile.maxGusts;
    if (gustRatio <= 0.6) {
      factors.push({ key: 'gusts', label: t('factor.gustsOk'), severity: 'ok' });
    } else if (gustRatio <= 0.9) {
      score -= Math.round(12 * (gustRatio - 0.6) / 0.3);
      factors.push({ key: 'gusts', label: t('factor.gustsWarn'), severity: 'warn' });
    } else if (gustRatio <= 1.2) {
      score -= 12 + Math.round(28 * (gustRatio - 0.9) / 0.3);
      factors.push({ key: 'gusts', label: t('factor.gustsCritical'), severity: 'critical' });
    } else {
      score -= 45;
      factors.push({ key: 'gusts', label: t('factor.gustsCritical'), severity: 'critical' });
    }

    // === RAIN ===
    if (profile.rainTolerance === 'none') {
      if (effectiveRain > 0.1) { score -= 40; factors.push({ key: 'rain', label: t('factor.rainCritical'), severity: 'critical' }); }
      else if (effectiveRain > 0) { score -= 20; factors.push({ key: 'rain', label: t('factor.rainWarn'), severity: 'warn' }); }
    } else if (profile.rainTolerance === 'low') {
      if (effectiveRain > 1.5) { score -= 35; factors.push({ key: 'rain', label: t('factor.rainCritical'), severity: 'critical' }); }
      else if (effectiveRain > 0.5) { score -= 15; factors.push({ key: 'rain', label: t('factor.rainWarn'), severity: 'warn' }); }
    } else if (profile.rainTolerance === 'medium') {
      if (effectiveRain > 4) { score -= 25; factors.push({ key: 'rain', label: t('factor.rainCritical'), severity: 'critical' }); }
      else if (effectiveRain > 2) { score -= 12; factors.push({ key: 'rain', label: t('factor.rainWarn'), severity: 'warn' }); }
    } else if (profile.rainTolerance === 'waterproof') {
      if (effectiveRain > 8) { score -= 15; factors.push({ key: 'rain', label: t('factor.rainWarn'), severity: 'warn' }); }
      else { factors.push({ key: 'rain', label: t('factor.rainOk'), severity: 'ok' }); }
    }

    if (rainSecondary !== null && Math.abs(rain - rainSecondary) > 0.3) {
      const lowerRain = Math.min(rain, rainSecondary).toFixed(1);
      const higherRain = Math.max(rain, rainSecondary).toFixed(1);
      factors.push({
        key: 'rainSource',
        label: `Regen unsicher: Wetterdienste melden ${lowerRain}-${higherRain} mm. Bewertung nutzt vorsichtig den höheren Wert.`,
        severity: 'warn'
      });
    }

    // === VISIBILITY ===
    if (visibility >= 10000) {
      factors.push({ key: 'visibility', label: t('factor.visibilityOk'), severity: 'ok' });
    } else if (visibility >= 5000) {
      score -= Math.round(10 * (10000 - visibility) / 5000);
      factors.push({ key: 'visibility', label: t('factor.visibilityWarn'), severity: 'warn' });
    } else if (visibility >= 2000) {
      score -= 10 + Math.round(20 * (5000 - visibility) / 3000);
      factors.push({ key: 'visibility', label: t('factor.visibilityCritical'), severity: 'critical' });
    } else {
      score -= 40;
      factors.push({ key: 'visibility', label: t('factor.visibilityCritical'), severity: 'critical' });
    }

    // === TEMPERATURE ===
    if (temp < -10 || temp > 42) {
      score -= 20;
      factors.push({ key: 'temp', label: t('factor.tempCritical'), severity: 'critical' });
    } else if (temp < 0 || temp > 35) {
      score -= 10;
      factors.push({ key: 'temp', label: t('factor.tempWarn'), severity: 'warn' });
    } else if (temp < 10 || temp > 30) {
      score -= 5;
      factors.push({ key: 'temp', label: t('factor.tempWarn'), severity: 'warn' });
    }

    // === CLOUDS ===
    if (clouds < 15) {
      factors.push({ key: 'clouds', label: t('factor.cloudsClear'), severity: 'ok' });
    } else if (clouds < 50) {
      score -= 5;
      factors.push({ key: 'clouds', label: t('factor.cloudsPartly'), severity: 'ok' });
    } else if (clouds < 80) {
      score -= 12;
      factors.push({ key: 'clouds', label: t('factor.cloudsHeavy'), severity: 'warn' });
    } else {
      score -= 20;
      factors.push({ key: 'clouds', label: t('factor.cloudsOvercast'), severity: 'warn' });
    }

    score = Math.max(0, Math.min(100, score));
    const status = score >= 80 ? 'fly' : score >= 50 ? 'caution' : 'nogo';
    return { score, status, factors };
  }
};

export const GoldenHour = {
  calculate(res) {
    if (!res) return {};
    const sunriseDate = new Date(res.sunrise);
    const sunsetDate = new Date(res.sunset);
    const dawnDate = new Date(res.civil_twilight_begin || res.civilDawn);
    const duskDate = new Date(res.civil_twilight_end || res.civilDusk);
    const morningStart = dawnDate;
    const morningEnd = new Date(sunriseDate.getTime() + 60 * 60 * 1000);
    const eveningStart = new Date(sunsetDate.getTime() - 60 * 60 * 1000);
    const eveningEnd = duskDate;
    const now = new Date();

    let whichPhase = null;
    if (now >= morningStart && now <= morningEnd) whichPhase = 'morning';
    if (now >= eveningStart && now <= eveningEnd) whichPhase = 'evening';

    let nextGolden = null;
    if (!whichPhase) {
      if (now < morningStart) nextGolden = morningStart;
      else if (now < eveningStart) nextGolden = eveningStart;
      else nextGolden = new Date(morningStart.getTime() + 24 * 60 * 60 * 1000);
    }

    return { morningStart, morningEnd, eveningStart, eveningEnd, isActiveNow: !!whichPhase, whichPhase, nextGolden };
  },
  isWithin(time, gh) {
    const d = typeof time === 'string' ? new Date(time.replace('T', ' ')) : new Date(time);
    return (d >= gh.morningStart && d <= gh.morningEnd) || (d >= gh.eveningStart && d <= gh.eveningEnd);
  }
};
