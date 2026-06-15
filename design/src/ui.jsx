/* ui.jsx — shared visual primitives */
const { useState: useStateUI } = React;

/* Donut ring with gradient stroke + animated sweep */
function Ring({ pct, size = 132, stroke = 13, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  const gid = "rg" + Math.round(size) + "_" + Math.round(p);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--ring-grad-a)" />
            <stop offset="100%" stopColor="var(--ring-grad-b)" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={c * (1 - p/100)}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

/* 7-day mini bar chart */
function TrendBars({ data, accent = "var(--primary)", height = 56 }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height }}>
      {data.map((d, i) => {
        const isToday = i === data.length - 1;
        const hpx = d.v === 0 ? 4 : Math.max(6, (d.v / max) * height);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: "100%", height: hpx, borderRadius: 6,
              background: d.v === 0 ? "var(--ring-track)"
                : isToday ? accent : "color-mix(in oklab, " + accent + " 38%, transparent)",
              transition: "height .6s cubic-bezier(.2,.8,.2,1)"
            }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: isToday ? "var(--primary)" : "var(--faint)" }}>{d.d}</span>
          </div>
        );
      })}
    </div>
  );
}

function Progress({ value, max, tone }) {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const cls = tone || (p >= 100 ? "danger" : p >= 85 ? "" : "");
  return (
    <div className={"bar " + (cls || "")}>
      <i style={{ width: p + "%", background: p >= 100 ? "var(--expense)" : undefined }} />
    </div>
  );
}

/* round category/account icon tile */
function IconTile({ icon, hue, size = 42, soft = true, dark }) {
  const bg = soft
    ? (dark ? `oklch(0.32 0.06 ${hue})` : `oklch(0.95 0.045 ${hue})`)
    : `oklch(0.62 0.17 ${hue})`;
  const fg = soft ? `oklch(${dark ? 0.8 : 0.5} 0.16 ${hue})` : "#fff";
  const radius = size >= 42 ? 13 : 10;
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: bg, color: fg,
      display: "grid", placeItems: "center", flex: "none" }}>
      <Icon name={icon} size={size * 0.5} sw={2} />
    </div>
  );
}

/* small pill badge */
function Pill({ children, tone = "muted" }) {
  const map = {
    income: { bg: "var(--income-soft)", fg: "var(--income)" },
    expense:{ bg: "var(--expense-soft)", fg: "var(--expense)" },
    primary:{ bg: "var(--primary-soft)", fg: "var(--primary)" },
    muted:  { bg: "var(--card-2)", fg: "var(--muted)" },
  }[tone];
  return <span style={{ background: map.bg, color: map.fg, fontSize: 11.5, fontWeight: 800,
    padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{children}</span>;
}

/* generic bottom sheet */
function Sheet({ open, onClose, children, title, right }) {
  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {(title || right) && (
          <div className="sheet-h">
            <h2>{title}</h2>
            {right || <button className="iconbtn" onClick={onClose}><Icon name="close" size={20} /></button>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { Ring, TrendBars, Progress, IconTile, Pill, Sheet });
