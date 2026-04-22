$file = "i:\Dokumente\GitHub\DroneOps\app.js"
$lines = (Get-Content $file -Encoding UTF8)

$newFunc = @'
  renderSunArc(sunData, gh) {
    const sunrise = new Date(sunData.results.sunrise);
    const sunset  = new Date(sunData.results.sunset);
    const dawn    = new Date(sunData.results.civil_twilight_begin);
    const dusk    = new Date(sunData.results.civil_twilight_end);
    const now     = new Date();

    // Canvas: H=220 gives enough room for labels below arcBaseY=162
    const W = 420, H = 220;
    const padX = 28;
    const arcBaseY = 162;
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

    const LY = arcBaseY + 16; // label Y always inside H=220
    const labels = [
      { x: ptDawn.x, text: fmt(dawn),    fill: 'rgba(150,170,255,0.8)',  dot: 'rgba(130,160,255,0.9)', anchor: 'start'  },
      { x: ptSR.x,   text: fmt(sunrise), fill: 'rgba(100,230,180,0.9)',  dot: 'rgba(80,220,160,1)',    anchor: 'middle' },
      { x: ptSS.x,   text: fmt(sunset),  fill: 'rgba(255,145,80,0.9)',   dot: 'rgba(255,120,60,1)',    anchor: 'middle' },
      { x: ptDusk.x, text: fmt(dusk),    fill: 'rgba(150,170,255,0.8)',  dot: 'rgba(130,160,255,0.9)', anchor: 'end'    },
    ];

    const ghMidX = ((ptDawn.x + ptMEnd.x) / 2).toFixed(1);
    const ghEMidX = ((ptEStart.x + ptDusk.x) / 2).toFixed(1);
    const ghY = (arcBaseY - 16).toFixed(1);

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
      <stop offset="0%"   stop-color="rgba(245,188,43,0.08)"/>
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
      svg += `\n  <rect x="${ptDawn.x.toFixed(1)}" y="10" width="${mghW}" height="${arcH}" fill="rgba(245,188,43,0.045)" rx="6"/>`;
    if (progEStart < 0.99)
      svg += `\n  <rect x="${ptEStart.x.toFixed(1)}" y="10" width="${eghW}" height="${arcH}" fill="rgba(255,100,40,0.045)" rx="6"/>`;

    svg += `
  <line x1="${(padX - 6)}" y1="${arcBaseY}" x2="${(W - padX + 6)}" y2="${arcBaseY}" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
  <path d="M ${padX} ${arcBaseY} A ${arcRadius} ${arcRadius} 0 0 1 ${W - padX} ${arcBaseY}" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3" stroke-linecap="round"/>`;

    if (dayLitSeg)
      svg += `\n  <path d="${dayLitSeg}" fill="none" stroke="rgba(255,230,140,0.16)" stroke-width="3" stroke-linecap="round"/>`;
    if (morningSeg)
      svg += `\n  <path d="${morningSeg}" fill="none" stroke="rgba(255,190,50,0.82)" stroke-width="6" stroke-linecap="round" filter="url(#${uid}gh)"/>`;
    if (eveningSeg)
      svg += `\n  <path d="${eveningSeg}" fill="none" stroke="rgba(255,110,40,0.82)" stroke-width="6" stroke-linecap="round" filter="url(#${uid}gh)"/>`;
    if (travelSeg && progNow > 0.01)
      svg += `\n  <path d="${travelSeg}" fill="none" stroke="rgba(255,220,100,0.38)" stroke-width="2.5" stroke-linecap="round"/>`;

    if (sunVisible)
      svg += `\n  <line x1="${sunX}" y1="${sunY}" x2="${sunX}" y2="${arcBaseY}" stroke="rgba(255,214,80,0.22)" stroke-width="1.5" stroke-dasharray="3 3"/>`;

    svg += '\n  ' + labels.map(l => `<circle cx="${l.x.toFixed(1)}" cy="${arcBaseY}" r="4.5" fill="${l.dot}"/>`).join('\n  ');

    if (sunVisible)
      svg += `\n  <circle cx="${sunX}" cy="${sunY}" r="20" fill="rgba(255,200,50,0.1)" filter="url(#${uid}sun)"/>
  <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="${sunFill}" filter="url(#${uid}sun)"/>
  <circle cx="${sunX}" cy="${sunY}" r="5" fill="white" opacity="${sunOp}"/>`;
    else
      svg += `\n  <circle cx="${nightX}" cy="${arcBaseY}" r="9" fill="rgba(80,100,160,0.55)"/>
  <text x="${(W / 2).toFixed(1)}" y="${(arcBaseY - 16).toFixed(1)}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.32)" font-family="inherit">Sonne unter dem Horizont</text>`;

    svg += '\n  ' + labels.map(l =>
      `<text x="${l.x.toFixed(1)}" y="${LY}" text-anchor="${l.anchor}" font-size="9.5" fill="${l.fill}" font-family="inherit" font-weight="600">${l.text}</text>`
    ).join('\n  ');

    if (progMEnd > 0.02 && progMEnd < 0.98)
      svg += `\n  <text x="${ghMidX}" y="${ghY}" text-anchor="middle" font-size="9" fill="rgba(255,190,50,0.85)" font-family="inherit" font-weight="700">\uD83C\uDF05 GH</text>`;
    if (progEStart > 0.02 && progEStart < 0.98)
      svg += `\n  <text x="${ghEMidX}" y="${ghY}" text-anchor="middle" font-size="9" fill="rgba(255,110,40,0.85)" font-family="inherit" font-weight="700">\uD83C\uDF07 GH</text>`;

    svg += '\n</svg>';
    return svg;
  },
'@

# Find the line range to replace (821 to 940, 0-indexed: 820 to 939)
$startLine = 820  # 0-indexed
$endLine   = 939  # 0-indexed inclusive

$before = $lines[0..($startLine - 1)]
$after  = $lines[($endLine + 1)..($lines.Count - 1)]

$newLines = $before + ($newFunc -split "`n") + $after

[System.IO.File]::WriteAllLines($file, $newLines, [System.Text.Encoding]::UTF8)
Write-Host "Done. New line count: $($newLines.Count)"
