/* icon-kit.jsx — OinkBudget app-icon primitives
   True iOS squircle (superellipse) + the pig-snout mark + system gradients.
   Exports to window: SQ, Snout, AppIcon, GradientDefs, and Icon* concepts. */

/* ---- superellipse (Apple squircle) path on a 0..100 box ---- */
function squirclePath(size, n) {
  const a = size / 2, steps = 120;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const ct = Math.cos(t), st = Math.sin(t);
    const x = a + a * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
    const y = a + a * Math.sign(st) * Math.pow(Math.abs(st), 2 / n);
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d + "Z";
}
const SQ = squirclePath(100, 5);

/* ---- the pig-snout mark (ellipses, on a 0..32 box) ---- */
function Snout({ fill = "#fff", plate = "rgba(0,0,0,.15)", nostril = "rgba(0,0,0,.32)", ears = true, sw = 0, stroke = "none" }) {
  return (
    <g>
      {ears && <ellipse cx="9.5"  cy="8.5" rx="3.2" ry="4" fill={fill} transform="rotate(-18 9.5 8.5)" />}
      {ears && <ellipse cx="22.5" cy="8.5" rx="3.2" ry="4" fill={fill} transform="rotate(18 22.5 8.5)" />}
      <ellipse cx="16" cy="17" rx="11" ry="9" fill={fill} stroke={stroke} strokeWidth={sw} />
      <ellipse cx="16" cy="18" rx="6.3" ry="5" fill={plate} />
      <ellipse cx="13" cy="18" rx="1.5" ry="2.1" fill={nostril} />
      <ellipse cx="19" cy="18" rx="1.5" ry="2.1" fill={nostril} />
    </g>
  );
}

/* ---- icon shell: squircle ground + decorations + glyph + keyline ---- */
function AppIcon({ size = 232, ground, deco, children, keyline, keylineW = 1, glyphW = 58, glyphY = 19, radiusShadow = true }) {
  const x = (100 - glyphW) / 2;
  return (
    <div style={{ width: size, height: size, position: "relative", filter: radiusShadow ? "drop-shadow(0 10px 22px rgba(40,16,70,.28))" : "none" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
        <path d={SQ} fill={ground} />
        {deco}
        <svg x={x} y={glyphY} width={glyphW} height={glyphW} viewBox="0 0 32 32">{children}</svg>
        {keyline && <path d={SQ} fill="none" stroke={keyline} strokeWidth={keylineW} />}
      </svg>
    </div>
  );
}

/* ---- shared gradient + filter defs (render once on the page) ---- */
function GradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="g-aurora" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="oklch(0.63 0.21 290)" />
          <stop offset="100%" stopColor="oklch(0.52 0.21 301)" />
        </linearGradient>
        <radialGradient id="g-glow" cx="0.76" cy="0.16" r="0.7">
          <stop offset="0%"  stopColor="rgba(255,255,255,.28)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id="g-confeti" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="oklch(0.67 0.22 322)" />
          <stop offset="52%" stopColor="oklch(0.57 0.22 298)" />
          <stop offset="100%" stopColor="oklch(0.71 0.16 35)" />
        </linearGradient>
        <linearGradient id="g-lingote" x1="0.12" y1="0" x2="0.72" y2="1">
          <stop offset="0%"  stopColor="oklch(0.35 0.14 291)" />
          <stop offset="100%" stopColor="oklch(0.17 0.055 291)" />
        </linearGradient>
        <linearGradient id="g-coin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="oklch(0.62 0.205 291)" />
          <stop offset="100%" stopColor="oklch(0.5 0.205 294)" />
        </linearGradient>
        <radialGradient id="g-coinface" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0%"   stopColor="oklch(0.7 0.165 292)" />
          <stop offset="100%" stopColor="oklch(0.57 0.2 293)" />
        </radialGradient>
        <linearGradient id="g-mesh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="oklch(0.66 0.21 296)" />
          <stop offset="100%" stopColor="oklch(0.5 0.21 292)" />
        </linearGradient>
        <radialGradient id="g-mesh-coral" cx="0.16" cy="0.86" r="0.7">
          <stop offset="0%"  stopColor="oklch(0.72 0.18 33 / .85)" />
          <stop offset="65%" stopColor="oklch(0.72 0.18 33 / 0)" />
        </radialGradient>
        <radialGradient id="g-mesh-pink" cx="0.85" cy="0.1" r="0.6">
          <stop offset="0%"  stopColor="oklch(0.72 0.18 330 / .8)" />
          <stop offset="70%" stopColor="oklch(0.72 0.18 330 / 0)" />
        </radialGradient>
        <linearGradient id="g-soft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="oklch(0.975 0.022 296)" />
          <stop offset="100%" stopColor="oklch(0.93 0.05 296)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* =========================================================
   CONCEPTS
   ========================================================= */

/* 1 · Aurora — the signature: violet gradient + white snout + corner glow */
function IconAurora({ size }) {
  return (
    <AppIcon size={size} ground="url(#g-aurora)" deco={<path d={SQ} fill="url(#g-glow)" />}>
      <Snout />
    </AppIcon>
  );
}

/* 2 · Confeti — playful pink→violet→coral, sparkle confetti */
function IconConfeti({ size }) {
  const dots = [
    [20, 24, 2.0, "rgba(255,255,255,.9)"],
    [80, 30, 1.6, "oklch(0.92 0.12 35)"],
    [76, 74, 2.3, "rgba(255,255,255,.8)"],
    [26, 78, 1.5, "oklch(0.92 0.1 330)"],
    [86, 52, 1.3, "rgba(255,255,255,.7)"],
  ];
  return (
    <AppIcon size={size} ground="url(#g-confeti)"
      deco={<g>{dots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r={d[2]} fill={d[3]} />)}</g>}>
      <Snout />
    </AppIcon>
  );
}

/* 3 · Lingote — premium dark bar of violet, soft-white snout + keyline */
function IconLingote({ size }) {
  return (
    <AppIcon size={size} ground="url(#g-lingote)"
      keyline="oklch(0.72 0.19 295 / .35)" keylineW={1}
      deco={<path d={SQ} fill="url(#g-glow)" opacity="0.5" />}>
      <Snout fill="oklch(0.95 0.02 294)" plate="rgba(0,0,0,.24)" nostril="rgba(0,0,0,.42)" />
    </AppIcon>
  );
}

/* 4 · Halo — the budget ring motif around a compact snout */
function IconRing({ size }) {
  return (
    <AppIcon size={size} ground="url(#g-aurora)" glyphW={34} glyphY={33}
      deco={
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r="27" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="7" />
          <circle cx="50" cy="50" r="27" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 27} strokeDashoffset={2 * Math.PI * 27 * 0.32} />
        </g>
      }>
      <Snout plate="rgba(0,0,0,.14)" />
    </AppIcon>
  );
}

/* 5 · Lingote de Ahorro — tonal violet coin, engraved snout */
function IconCoin({ size }) {
  return (
    <AppIcon size={size} ground="url(#g-coin)" glyphW={48} glyphY={26}
      deco={
        <g>
          <circle cx="50" cy="50" r="32" fill="url(#g-coinface)" />
          <circle cx="50" cy="50" r="32" fill="none" stroke="oklch(0.78 0.13 293 / .55)" strokeWidth="1.4" />
          <circle cx="50" cy="50" r="27" fill="none" stroke="oklch(0.45 0.18 293 / .35)" strokeWidth="1.2" />
        </g>
      }>
      <Snout fill="oklch(0.5 0.205 293)" plate="oklch(0.44 0.2 293 / .55)" nostril="oklch(0.4 0.2 293 / .8)" ears={true} />
    </AppIcon>
  );
}

/* 6 · Suave — light/inverse, violet snout on soft lilac */
function IconSoft({ size }) {
  return (
    <AppIcon size={size} ground="url(#g-soft)" keyline="oklch(0.82 0.06 296)" keylineW={1}>
      <Snout fill="oklch(0.55 0.214 293)" plate="oklch(0.5 0.2 293 / .28)" nostril="oklch(0.42 0.2 293 / .65)" />
    </AppIcon>
  );
}

/* 7 · Glifo — flat single-color violet ground, white snout from Mesh */
function IconFlat({ size }) {
  return (
    <AppIcon size={size} ground="oklch(0.55 0.214 293)" glyphW={58} glyphY={19} radiusShadow={true}>
      <Snout />
    </AppIcon>
  );
}

/* 8 · Aurora Mesh — vivid mesh, coral + pink glows */
function IconMesh({ size }) {
  return (
    <AppIcon size={size} ground="url(#g-mesh)"
      deco={<g><path d={SQ} fill="url(#g-mesh-coral)" /><path d={SQ} fill="url(#g-mesh-pink)" /></g>}>
      <Snout />
    </AppIcon>
  );
}

Object.assign(window, {
  SQ, Snout, AppIcon, GradientDefs,
  IconAurora, IconConfeti, IconLingote, IconRing, IconCoin, IconSoft, IconFlat, IconMesh,
});
