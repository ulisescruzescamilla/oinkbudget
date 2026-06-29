/* transactions.jsx — Movimientos */
const { useState: useStateTX } = React;

function Transactions({ dark }) {
  const [range, setRange] = useStateTX("week");
  const [type, setType] = useStateTX("all");      // all | in | out
  const [acct, setAcct] = useStateTX("all");
  const [q, setQ] = useStateTX("");
  const [filterOpen, setFilterOpen] = useStateTX(false);
  const [sel, setSel] = useStateTX(null);

  const inRange = (d) => {
    if (range === "today") return d === "2026-06-04";
    if (range === "week") return d >= "2026-05-29";
    if (range === "month") return d >= "2026-06-01";
    return true;
  };
  const filtered = TX.filter(t =>
    inRange(t.date) &&
    (type === "all" || (type === "in" ? t.amt > 0 : t.amt < 0)) &&
    (acct === "all" || t.acct === acct) &&
    (q === "" || t.desc.toLowerCase().includes(q.toLowerCase()) || t.cat.toLowerCase().includes(q.toLowerCase()))
  );

  const income = filtered.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const expense = filtered.filter(t => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0);

  // group by date
  const groups = {};
  filtered.forEach(t => { (groups[t.date] = groups[t.date] || []).push(t); });
  const dates = Object.keys(groups).sort().reverse();

  const activeFilters = (type !== "all" ? 1 : 0) + (acct !== "all" ? 1 : 0);

  return (
    <div className="screen-pad screen-anim">

      {/* summary */}
      <div className="card hero">
        <div className="rowflex between" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="muted fs13 fw7">Balance del periodo</div>
            <div className="money" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.03em", marginTop: 2 }}>
              {fmt(income - expense, true)}
            </div>
          </div>
          <Pill tone="muted">{filtered.length} mov.</Pill>
        </div>
        <div className="rowflex gap12" style={{ marginTop: 16 }}>
          <div className="grow" style={{ background: "rgba(255,255,255,.16)", borderRadius: 14, padding: "10px 12px" }}>
            <div className="rowflex gap6" style={{ color: "#fff", opacity: .85, fontSize: 12, fontWeight: 700 }}>
              <Icon name="up" size={14} sw={2.6} /> Ingresos
            </div>
            <div className="money fw8" style={{ fontSize: 17, marginTop: 2 }}>{fmt(income)}</div>
          </div>
          <div className="grow" style={{ background: "rgba(0,0,0,.16)", borderRadius: 14, padding: "10px 12px" }}>
            <div className="rowflex gap6" style={{ color: "#fff", opacity: .85, fontSize: 12, fontWeight: 700 }}>
              <Icon name="down" size={14} sw={2.6} /> Gastos
            </div>
            <div className="money fw8" style={{ fontSize: 17, marginTop: 2 }}>{fmt(expense)}</div>
          </div>
        </div>
      </div>

      {/* search + filter */}
      <div className="rowflex gap10">
        <div className="grow" style={{ position: "relative" }}>
          <Icon name="search" size={18} style={{ position: "absolute", left: 13, top: 13, color: "var(--faint)" }} />
          <input className="input" style={{ paddingLeft: 40 }} placeholder="Buscar movimiento…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className={"iconbtn" + (activeFilters ? " solid" : "")} onClick={() => setFilterOpen(true)} style={{ position: "relative" }}>
          <Icon name="filter" size={20} />
          {activeFilters > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--primary)",
            color: "var(--on-primary)", fontSize: 10, fontWeight: 800, width: 17, height: 17, borderRadius: 999,
            display: "grid", placeItems: "center" }}>{activeFilters}</span>}
        </button>
      </div>

      {/* range chips */}
      <div className="chips">
        {[["today","Hoy"],["week","Semana"],["month","Mes"],["all","Todo"]].map(([k, l]) => (
          <button key={k} className={"chip" + (range === k ? " on" : "")} onClick={() => setRange(k)}>{l}</button>
        ))}
      </div>

      {/* list */}
      {dates.length === 0 ? (
        <div className="card"><div className="empty">
          <div className="em-ic"><Icon name="search" size={28} /></div>
          <p>Sin movimientos para estos filtros. Prueba con otro periodo.</p>
        </div></div>
      ) : dates.map(d => {
        const items = groups[d];
        const net = items.reduce((s, t) => s + t.amt, 0);
        return (
          <div key={d}>
            <div className="daygroup-h">
              <span className="d">{DAY_LABELS[d] || d}</span>
              <span className="s money" style={{ color: net >= 0 ? "var(--income)" : "var(--muted)" }}>{fmt(net, true)}</span>
            </div>
            <div className="card flush">
              {items.map(t => (
                <div className="row" key={t.id} onClick={() => setSel(t)}>
                  <IconTile icon={catIcon(t.cat)} hue={CATS[t.cat].hue} dark={dark} />
                  <div className="mid">
                    <div className="t1">{t.desc}</div>
                    <div className="t2">{t.acct} <span className="dot" /> {t.time}</div>
                  </div>
                  <div className="stack" style={{ alignItems: "flex-end", gap: 3 }}>
                    <div className={"amt money"} style={{ color: t.amt > 0 ? "var(--income)" : "var(--text)" }}>{fmt(t.amt, true)}</div>
                    <span className="fs12 t-faint fw7">{t.cat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* filter sheet */}
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtros">
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Tipo</label>
          <div className="chips">
            {[["all","Todos"],["in","Ingresos"],["out","Gastos"]].map(([k, l]) => (
              <button key={k} className={"chip" + (type === k ? " on" : "")} onClick={() => setType(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="field" style={{ marginBottom: 20 }}>
          <label>Cuenta</label>
          <div className="chips">
            <button className={"chip" + (acct === "all" ? " on" : "")} onClick={() => setAcct("all")}>Todas</button>
            {ACCOUNTS.map(a => (
              <button key={a.id} className={"chip" + (acct === a.name ? " on" : "")} onClick={() => setAcct(a.name)}>
                <Icon name={a.icon} size={15} sw={2.2} /> {a.name}
              </button>
            ))}
          </div>
        </div>
        <div className="rowflex gap10">
          <button className="btn btn-ghost btn-block" onClick={() => { setType("all"); setAcct("all"); }}>Limpiar</button>
          <button className="btn btn-primary btn-block" onClick={() => setFilterOpen(false)}>Aplicar</button>
        </div>
      </Sheet>

      {/* manage sheet */}
      <Sheet open={!!sel} onClose={() => setSel(null)} title="Detalle">
        {sel && <ManageTx t={sel} dark={dark} onClose={() => setSel(null)} />}
      </Sheet>
    </div>
  );
}

function ManageTx({ t, dark, onClose }) {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "4px 0 18px" }}>
        <div style={{ margin: "0 auto 12px", width: 60, height: 60 }}>
          <IconTile icon={catIcon(t.cat)} hue={CATS[t.cat].hue} size={60} dark={dark} />
        </div>
        <div className="money" style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.03em",
          color: t.amt > 0 ? "var(--income)" : "var(--text)" }}>{fmt(t.amt, true)}</div>
        <div className="fw8 mt4" style={{ fontSize: 16, color: "var(--text)" }}>{t.desc}</div>
      </div>
      <div className="card-2" style={{ background: "var(--card-2)", borderRadius: "var(--r-inner)", padding: "4px 14px", marginBottom: 16 }}>
        {[["Categoría", t.cat], ["Cuenta", t.acct], ["Fecha", (DAY_LABELS[t.date] || t.date)], ["Hora", t.time],
          ["Tipo", t.amt > 0 ? "Ingreso" : "Gasto"]].map(([k, v], i, arr) => (
          <div key={k} className="rowflex between" style={{ padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
            <span className="fs13 t-muted fw7">{k}</span>
            <span className="fs14 fw8" style={{ color: "var(--text)" }}>{v}</span>
          </div>
        ))}
      </div>
      <div className="rowflex gap10">
        <button className="btn btn-soft btn-block" onClick={onClose}><Icon name="edit" size={18} sw={2.2} /> Editar</button>
        <button className="btn btn-danger-soft btn-block" onClick={onClose}><Icon name="trash" size={18} sw={2.2} /> Eliminar</button>
      </div>
    </div>
  );
}
Object.assign(window, { Transactions });
