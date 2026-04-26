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
    if (windRatio <= 0.7) {
      factors.push({ key: 'wind', label: t('factor.windOk'), severity: 'ok' });
    } else if (windRatio <= 1.0) {
      score -= Math.round(15 * (windRatio - 0.7) / 0.3);
      factors.push({ key: 'wind', label: t('factor.windWarn'), severity: 'warn' });
    } else if (windRatio <= 1.4) {
      score -= 15 + Math.round(30 * (windRatio - 1.0) / 0.4);
      factors.push({ key: 'wind', label: t('factor.windCritical'), severity: 'critical' });
    } else {
      score -= 50;
      factors.push({ key: 'wind', label: t('factor.windCritical'), severity: 'critical' });
    }

    // === GUSTS ===
    const gustRatio = gusts / profile.maxGusts;
    if (gustRatio <= 0.8) {
      factors.push({ key: 'gusts', label: t('factor.gustsOk'), severity: 'ok' });
    } else if (gustRatio <= 1.0) {
      score -= Math.round(10 * (gustRatio - 0.8) / 0.2);
      factors.push({ key: 'gusts', label: t('factor.gustsWarn'), severity: 'warn' });
    } else if (gustRatio <= 1.3) {
      score -= 10 + Math.round(25 * (gustRatio - 1.0) / 0.3);
      factors.push({ key: 'gusts', label: t('factor.gustsCritical'), severity: 'critical' });
    } else {
      score -= 40;
      factors.push({ key: 'gusts', label: t('factor.gustsCritical'), severity: 'critical' });
    }

    // === RAIN ===
    if (profile.rainTolerance === 'none') {
      if (effectiveRain > 0.2) { score -= 35; factors.push({ key: 'rain', label: t('factor.rainCritical'), severity: 'critical' }); }
      else if (effectiveRain > 0) { score -= 15; factors.push({ key: 'rain', label: t('factor.rainWarn'), severity: 'warn' }); }
    } else if (profile.rainTolerance === 'low') {
      if (effectiveRain > 2.5) { score -= 30; factors.push({ key: 'rain', label: t('factor.rainCritical'), severity: 'critical' }); }
      else if (effectiveRain > 1) { score -= 15; factors.push({ key: 'rain', label: t('factor.rainWarn'), severity: 'warn' }); }
    } else if (profile.rainTolerance === 'medium') {
      if (effectiveRain > 5) { score -= 20; factors.push({ key: 'rain', label: t('factor.rainCritical'), severity: 'critical' }); }
      else if (effectiveRain > 2.5) { score -= 10; factors.push({ key: 'rain', label: t('factor.rainWarn'), severity: 'warn' }); }
    } else if (profile.rainTolerance === 'waterproof') {
      if (effectiveRain > 10) { score -= 10; factors.push({ key: 'rain', label: t('factor.rainWarn'), severity: 'warn' }); }
      else { factors.push({ key: 'rain', label: t('factor.rainOk'), severity: 'ok' }); }
    }

    if (rainSecondary !== null && Math.abs(rain - rainSecondary) > 0.5) {
      factors.push({ key: 'rainSource', label: `Regen-Abweichung: OM ${rain.toFixed(1)} / BS ${rainSecondary.toFixed(1)}`, severity: 'warn' });
    }

    // === VISIBILITY ===
    if (visibility >= 8000) {
      factors.push({ key: 'visibility', label: t('factor.visibilityOk'), severity: 'ok' });
    } else if (visibility >= 3000) {
      score -= Math.round(8 * (8000 - visibility) / 5000);
      factors.push({ key: 'visibility', label: t('factor.visibilityWarn'), severity: 'warn' });
    } else if (visibility >= 1000) {
      score -= 8 + Math.round(12 * (3000 - visibility) / 2000);
      factors.push({ key: 'visibility', label: t('factor.visibilityCritical'), severity: 'critical' });
    } else {
      score -= 25;
      factors.push({ key: 'visibility', label: t('factor.visibilityCritical'), severity: 'critical' });
    }

    // === TEMPERATURE ===
    if (temp < -10) {
      score -= 15;
      factors.push({ key: 'temp', label: t('factor.tempCritical'), severity: 'critical' });
    } else if (temp < -5 || temp > 40) {
      score -= 10;
      factors.push({ key: 'temp', label: t('factor.tempWarn'), severity: 'warn' });
    } else if (temp > 35) {
      score -= 5;
      factors.push({ key: 'temp', label: t('factor.tempWarn'), severity: 'warn' });
    }

    // === CLOUDS (info only) ===
    if (clouds < 20) factors.push({ key: 'clouds', label: t('factor.cloudsClear'), severity: 'ok' });
    else if (clouds < 60) factors.push({ key: 'clouds', label: t('factor.cloudsPartly'), severity: 'ok' });
    else if (clouds < 85) factors.push({ key: 'clouds', label: t('factor.cloudsHeavy'), severity: 'warn' });
    else factors.push({ key: 'clouds', label: t('factor.cloudsOvercast'), severity: 'warn' });

    score = Math.max(0, Math.min(100, score));
    const status = score >= 70 ? 'fly' : score >= 40 ? 'caution' : 'nogo';
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
