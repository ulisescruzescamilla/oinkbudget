/* dashboard.jsx — Inicio */
function Dashboard({ onAdd, onNav, dark }) {
  const pct = Math.round((todaySpent / dailyLimit) * 100);
  const budgetsAvail = BUDGETS.map(b => ({ ...b, avail: b.max - b.spent }));
  const totalAvail = budgetsAvail.reduce((s, b) => s + b.avail, 0);
  const totalMax = BUDGETS.reduce((s, b) => s + b.max, 0);
  const recent = TX.slice(0, 4);
  const top = [...budgetsAvail].sort((a, b) => (b.spent/b.max) - (a.spent/a.max)).slice(0, 3);

  return (
    <div className="screen-pad screen-anim">

      {/* Gastos de hoy */}
      <div className="card">
        <div className="card-h">
          <h3>Gastos de hoy</h3>
          <Pill tone="primary">Hoy</Pill>
        </div>
        <div className="rowflex gap14">
          <Ring pct={pct} size={128} stroke={13}>
            <div className="pct">{pct}%</div>
            <div className="lbl">del límite</div>
          </Ring>
          <div className="grow stack gap14">
            <div>
              <div className="fs13 t-muted fw7">Total gastado hoy</div>
              <div className="big-num money">{fmt(todaySpent)}</div>
            </div>
            <div>
              <div className="fs13 t-muted fw7">Límite diario</div>
              <div className="money fw8" style={{ fontSize: 19, color: "var(--text)" }}>{fmt(dailyLimit)}</div>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: "var(--border)", margin: "16px 0 14px" }} />
        <div className="card-h" style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: 13 }}>Últimos 7 días</h3>
          <span className="fs12 t-faint fw7">prom. {fmt0(923)}/día</span>
        </div>
        <TrendBars data={TREND} />
      </div>

      {/* Captura rápida */}
      <div className="rowflex gap12">
        <button className="btn btn-block" onClick={() => onAdd("expense")}
          style={{ background: "var(--expense-soft)", color: "var(--expense)", flexDirection: "column", gap: 6, padding: "15px" }}>
          <span className="rowflex gap8 fw8" style={{ fontSize: 15 }}><Icon name="down" size={19} sw={2.4} /> Gasto</span>
        </button>
        <button className="btn btn-block" onClick={() => onAdd("income")}
          style={{ background: "var(--income-soft)", color: "var(--income)", flexDirection: "column", gap: 6, padding: "15px" }}>
          <span className="rowflex gap8 fw8" style={{ fontSize: 15 }}><Icon name="up" size={19} sw={2.4} /> Ingreso</span>
        </button>
      </div>

      {/* Disponible por presupuesto */}
      <div className="card">
        <div className="card-h">
          <h3>Disponible por presupuesto</h3>
          <span className="lnk" onClick={() => onNav("budgets")}>Ver todos <Icon name="chev" size={15} sw={2.4} /></span>
        </div>
        <div className="stack" style={{ gap: 15 }}>
          {top.map(b => {
            const over = b.avail <= 0;
            return (
              <div key={b.id} className="stack" style={{ gap: 7 }}>
                <div className="rowflex between">
                  <div className="rowflex gap8">
                    <IconTile icon={catIcon(b.cat)} hue={CATS[b.cat].hue} size={26} dark={dark} />
                    <span className="fw8 fs14" style={{ color: "var(--text)" }}>{b.name}</span>
                  </div>
                  <span className="money fw8 fs14" style={{ color: over ? "var(--expense)" : "var(--income)" }}>
                    {over ? "Sin disponible" : fmt(b.avail) + " libre"}
                  </span>
                </div>
                <Progress value={b.spent} max={b.max} />
                <div className="fs12 t-faint fw7 money">{fmt(b.spent)} de {fmt(b.max)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 1, background: "var(--border)", margin: "16px 0 0" }} />
        <div className="rowflex between" style={{ marginTop: 14 }}>
          <span className="fw7 t-muted fs14">Total disponible</span>
          <span className="money fw8" style={{ fontSize: 19, color: "var(--income)" }}>{fmt(totalAvail)}</span>
        </div>
      </div>

      {/* Últimos movimientos */}
      <div className="card flush">
        <div className="card-h" style={{ padding: "var(--pad) var(--pad) 6px", marginBottom: 0 }}>
          <h3>Últimos movimientos</h3>
          <span className="lnk" onClick={() => onNav("tx")}>Ver todo <Icon name="chev" size={15} sw={2.4} /></span>
        </div>
        <div>
          {recent.map(t => (
            <div className="row" key={t.id} onClick={() => onNav("tx")}>
              <IconTile icon={catIcon(t.cat)} hue={CATS[t.cat].hue} dark={dark} />
              <div className="mid">
                <div className="t1">{t.desc}</div>
                <div className="t2">{t.cat} <span className="dot" /> {t.acct}</div>
              </div>
              <div className={"amt money " + (t.amt > 0 ? "pos" : "")} style={{ color: t.amt > 0 ? "var(--income)" : "var(--text)" }}>
                {fmt(t.amt, true)}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
Object.assign(window, { Dashboard });
