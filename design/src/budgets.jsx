/* budgets.jsx — Presupuestos */
const { useState: useStateB } = React;

const MONTHLY_INCOME = 20000;

function Budgets({ dark, onAdd }) {
  const [open, setOpen] = useStateB("b1");
  const allocated = BUDGETS.reduce((s, b) => s + b.max, 0);
  const unalloc = Math.max(0, MONTHLY_INCOME - allocated);
  const segs = [...BUDGETS.map(b => ({ name: b.name, cat: b.cat, v: b.max })),
    ...(unalloc > 0 ? [{ name: "Sin asignar", cat: null, v: unalloc }] : [])];

  return (
    <div className="screen-pad screen-anim has-cta">
      <div className="card">
        <div className="card-h">
          <h3>Cómo divides tu ingreso</h3>
          <Pill tone="primary">Junio</Pill>
        </div>
        <div className="statline" style={{ marginBottom: 4 }}>
          <span className="money" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.03em", color: "var(--text)" }}>{fmt0(allocated)}</span>
          <span className="t-faint fw7 fs13 money">de {fmt0(MONTHLY_INCOME)} asignados</span>
        </div>

        <div className="alloc-bar" style={{ margin: "14px 0 16px" }}>
          {segs.map((s, i) => (
            <i key={i} title={s.name} style={{
              width: (s.v / MONTHLY_INCOME * 100) + "%",
              background: s.cat ? catColor(s.cat, 0.62, 0.17) : "var(--ring-track)"
            }} />
          ))}
        </div>

        <div className="legend">
          {segs.map((s, i) => (
            <div className="li" key={i}>
              <span className="sw" style={{ background: s.cat ? catColor(s.cat, 0.62, 0.17) : "var(--ring-track)" }} />
              <span className="nm">{s.name}</span>
              <span className="vl money">{fmt0(s.v)}</span>
              <span className="t-faint fw7 fs12" style={{ width: 38, textAlign: "right" }}>{Math.round(s.v / MONTHLY_INCOME * 100)}%</span>
            </div>
          ))}
        </div>
        {unalloc > 0 && (
          <div className="rowflex gap8" style={{ marginTop: 14, padding: "11px 13px", background: "var(--primary-soft)",
            borderRadius: "var(--r-inner)", color: "var(--primary)" }}>
            <Icon name="bolt" size={18} sw={2.2} />
            <span className="fw7 fs13">Tienes <b className="money">{fmt0(unalloc)}</b> sin asignar este mes.</span>
          </div>
        )}
      </div>

      {/* budget cards */}
      <div className="card-h" style={{ padding: "4px 4px 0", marginBottom: 0 }}>
        <h3>Tus presupuestos</h3>
        <span className="fs12 t-faint fw7">{BUDGETS.length} activos</span>
      </div>

      {BUDGETS.map(b => {
        const avail = b.max - b.spent;
        const pct = Math.round(b.spent / b.max * 100);
        const isOpen = open === b.id;
        const over = avail <= 0;
        return (
          <div key={b.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="row" style={{ padding: "15px 16px" }} onClick={() => setOpen(isOpen ? null : b.id)}>
              <IconTile icon={catIcon(b.cat)} hue={CATS[b.cat].hue} dark={dark} />
              <div className="mid">
                <div className="t1">{b.name}</div>
                <div className="t2 money">{fmt(b.spent)} de {fmt(b.max)}</div>
              </div>
              <div className="stack" style={{ alignItems: "flex-end", gap: 4 }}>
                <span className="money fw8" style={{ fontSize: 15, color: over ? "var(--expense)" : "var(--text)" }}>{pct}%</span>
                <Icon name="chevd" size={18} style={{ color: "var(--faint)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .25s" }} />
              </div>
            </div>
            <div style={{ padding: "0 16px 14px" }}>
              <Progress value={b.spent} max={b.max} />
            </div>

            {isOpen && (
              <div style={{ padding: "2px 16px 16px", animation: "screenin .25s ease" }}>
                <div className="rowflex" style={{ gap: 0, background: "var(--card-2)", borderRadius: "var(--r-inner)", padding: "12px 4px", marginBottom: 14 }}>
                  {[["Gastado", fmt(b.spent), "var(--text)"], ["Máximo", fmt(b.max), "var(--text)"],
                    ["Restante", over ? fmt(0) : fmt(avail), over ? "var(--expense)" : "var(--income)"]].map(([k, v, col]) => (
                    <div key={k} className="grow" style={{ textAlign: "center", borderRight: k !== "Restante" ? "1px solid var(--border)" : "none" }}>
                      <div className="fs12 t-muted fw7">{k}</div>
                      <div className="money fw8" style={{ fontSize: 15, color: col, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="rowflex gap8 fs13 t-muted fw7" style={{ marginBottom: 14 }}>
                  <Icon name="cal" size={16} sw={2} /> Periodo: <span className="fw8" style={{ color: "var(--text)" }}>4 – 30 jun 2026</span>
                </div>
                <div className="rowflex gap10">
                  <button className="btn btn-soft btn-block"><Icon name="edit" size={17} sw={2.2} /> Editar</button>
                  <button className="btn btn-danger-soft" style={{ flex: "none", width: 52, padding: 0 }}><Icon name="trash" size={18} sw={2.2} /></button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
Object.assign(window, { Budgets });
