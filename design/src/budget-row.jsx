/* budget-row.jsx — shared budget allocation row
   Used by Plan Wizard (step Reparto) and the "Nuevo presupuesto" form. */
function BudgetRow({ cat, label, amt, base, mode = "amt", onChange, onRemove, dark, solo = false, editable = false }) {
  const pct = base > 0 ? Math.round(amt / base * 100) : 0;
  const fill = base > 0 ? Math.min(100, amt / base * 100) : 0;
  const col = catColor(cat, 0.62, 0.17);
  const hue = (CATS[cat] || CATS.Otro).hue;
  return (
    <div className={"brow" + (solo ? " solo" : "")}>
      <div className="brow-top">
        <IconTile icon={catIcon(cat)} hue={hue} size={36} dark={dark} />
        <span className="nm">{label || cat}</span>
        <span className="brow-val">
          <span className="big money">{mode === "pct" ? pct + "%" : fmt0(amt)}</span>
          <span className="sub money"> · {mode === "pct" ? fmt0(amt) : pct + "%"}</span>
        </span>
        {onRemove && <button className="brow-x" onClick={onRemove} aria-label="quitar"><Icon name="close" size={15} sw={2.4} /></button>}
      </div>
      <input type="range" className="wslider"
        min={0} max={base} step={mode === "pct" ? Math.max(1, Math.round(base / 100)) : 50}
        value={Math.min(amt, base)}
        style={{ "--slider-fill": col, background: `linear-gradient(90deg, ${col} ${fill}%, var(--ring-track) ${fill}%)` }}
        onChange={(e) => onChange(Number(e.target.value))} />
      {editable && (
        <div className="brow-input">
          <input className="input money" inputMode="decimal" value={amt ? String(amt) : ""} placeholder="$0"
            onChange={(e) => onChange(Math.min(base, parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0))} />
          <span className="hint money">de {fmt0(base)}</span>
        </div>
      )}
    </div>
  );
}
Object.assign(window, { BudgetRow });
