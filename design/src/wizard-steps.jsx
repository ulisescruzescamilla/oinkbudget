/* wizard-steps.jsx — step views for the "Crear plan" flow
   Pure presentational; all state lives in Wizard (wizard.jsx). */
const { useMemo: useMemoW } = React;

/* ---- period catalogue ---- */
const PERIODS = {
  mensual:   { label: "Mensual",   sub: "Un plan cada mes",          range: "1 – 30 jun 2026",  icon: "cal",  incLabel: "Ingreso mensual" },
  quincenal: { label: "Quincenal", sub: "Cada dos semanas",          range: "16 – 30 jun 2026", icon: "swap", incLabel: "Ingreso quincenal" },
  semanal:   { label: "Semanal",   sub: "Un plan cada semana",       range: "23 – 29 jun 2026", icon: "bolt", incLabel: "Ingreso semanal" },
};

/* suggested split (sums to 100) */
const PLAN_TEMPLATE = [
  { cat: "Renta",        w: 30 },
  { cat: "Mercado",      w: 18 },
  { cat: "Servicios",    w: 8  },
  { cat: "Transporte",   w: 9  },
  { cat: "Restaurantes", w: 10 },
  { cat: "Ocio",         w: 8  },
  { cat: "Ahorro",       w: 17 },
];

/* =================== STEP 1 · PERIODO =================== */
function StepPeriodo({ period, setPeriod }) {
  return (
    <div className="wiz-pad">
      {Object.entries(PERIODS).map(([key, p]) => (
        <button key={key} className={"opt" + (period === key ? " on" : "")} onClick={() => setPeriod(key)}>
          <span className="opt-ic"><Icon name={p.icon} size={23} sw={2.1} /></span>
          <span className="opt-mid">
            <span className="t1">{p.label}</span>
            <span className="t2">{p.sub} · {p.range}</span>
          </span>
          <span className="opt-check"><Icon name="check" size={14} sw={3} /></span>
        </button>
      ))}
      <div className="rowflex gap8 fs13 t-muted fw7" style={{ padding: "8px 6px 0" }}>
        <Icon name="bolt" size={16} sw={2.2} />
        <span>Podrás cambiar el periodo más adelante sin perder tus presupuestos.</span>
      </div>
    </div>
  );
}

/* =================== STEP 2 · CUENTAS =================== */
function StepCuentas({ accSel, toggleAcc, dark }) {
  const total = ACCOUNTS.reduce((s, a) => s + (accSel[a.id] ? a.balance : 0), 0);
  const count = ACCOUNTS.filter(a => accSel[a.id]).length;
  return (
    <div className="wiz-pad">
      <div className="acc-total">
        <span className="lab">{count} {count === 1 ? "cuenta" : "cuentas"} en este plan</span>
        <span className="val money">{fmt(total)}</span>
      </div>
      {ACCOUNTS.map(a => (
        <button key={a.id} className={"opt compact" + (accSel[a.id] ? " on" : "")} onClick={() => toggleAcc(a.id)}>
          <IconTile icon={a.icon} hue={a.hue} size={42} soft={!accSel[a.id]} dark={dark} />
          <span className="opt-mid">
            <span className="t1">{a.name}</span>
            <span className="t2 money">{a.type} · {fmt(a.balance)}</span>
          </span>
          <span className="opt-check"><Icon name="check" size={14} sw={3} /></span>
        </button>
      ))}
    </div>
  );
}

/* =================== STEP 3 · INGRESO =================== */
function StepIngreso({ income, setIncome, period, accTotal }) {
  const meta = PERIODS[period];
  const press = (k) => {
    setIncome(prev => {
      if (k === "del") return Math.floor(prev / 10);
      if (k === "000") return Math.min(99999999, prev * 1000);
      return Math.min(99999999, prev * 10 + k);
    });
  };
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, "000", 0, "del"];
  return (
    <div className="wiz-pad" style={{ paddingTop: 8 }}>
      <div className="amount-display inc" style={{ paddingBottom: 8 }}>
        <div className="v money"><span className="cur">$</span>{income.toLocaleString("es-MX")}</div>
      </div>
      <div className="income-hint">
        <Icon name="bank" size={15} sw={2.1} />
        <span>Disponible en tus cuentas: <b className="money" style={{ color: "var(--text)" }}>{fmt0(accTotal)}</b></span>
      </div>
      <div className="quick-row">
        {[1000, 5000, 10000].map(q => (
          <button key={q} className="quick money" onClick={() => setIncome(v => Math.min(99999999, v + q))}>+{fmt0(q)}</button>
        ))}
        <button className="quick" onClick={() => setIncome(0)}>Limpiar</button>
      </div>
      <div className="keypad">
        {keys.map(k => (
          <button key={k} className="key" onClick={() => press(k)}>
            {k === "del" ? <Icon name="chev" size={22} sw={2.4} style={{ transform: "rotate(180deg)" }} /> : k}
          </button>
        ))}
      </div>
      <div className="rowflex gap8 fs13 t-muted fw7 center" style={{ justifyContent: "center", marginTop: 12 }}>
        <Icon name={meta.icon} size={15} sw={2.1} />
        <span>{meta.incLabel} · {meta.range}</span>
      </div>
    </div>
  );
}

/* =================== STEP 4 · REPARTO =================== */
function StepReparto({ income, rows, setRowAmt, removeRow, addRow, mode, setMode, allocated, remaining, applyTemplate, dark }) {
  const pctOf = (a) => income > 0 ? Math.round(a / income * 100) : 0;
  const segs = rows.filter(r => r.amt > 0);
  const usedCats = rows.map(r => r.cat);
  const available = Object.keys(CATS).filter(c => c !== "Ingreso" && !usedCats.includes(c));

  return (
    <div className="wiz-pad">
      {/* summary */}
      <div className="card reparto-sum">
        <div className="card-h" style={{ marginBottom: 8 }}>
          <h3>Repartes tu ingreso</h3>
          <div className="seg" style={{ padding: 3 }}>
            <button className={mode === "amt" ? "on" : ""} onClick={() => setMode("amt")} style={{ padding: "6px 12px" }}>$</button>
            <button className={mode === "pct" ? "on" : ""} onClick={() => setMode("pct")} style={{ padding: "6px 12px" }}>%</button>
          </div>
        </div>
        <div className="big money">{fmt0(income)}</div>
        <div className="alloc-bar" style={{ margin: "13px 0 0" }}>
          {segs.map((r, i) => (
            <i key={i} title={r.cat} style={{ width: (r.amt / income * 100) + "%", background: catColor(r.cat, 0.62, 0.17) }} />
          ))}
        </div>
        <div className="reparto-meta">
          <div className="m"><div className="k">Asignado</div><div className="v money" style={{ color: "var(--primary)" }}>{fmt0(allocated)} · {pctOf(allocated)}%</div></div>
          <div className="m"><div className="k">Sin asignar</div><div className="v money" style={{ color: remaining > 0 ? "var(--text)" : "var(--income)" }}>{fmt0(remaining)}</div></div>
        </div>
      </div>

      {/* template / reset */}
      <div className="rowflex gap8" style={{ padding: "0 2px" }}>
        <button className="btn btn-soft btn-block" style={{ padding: "11px 14px", fontSize: 13.5 }} onClick={() => applyTemplate("suggest")}>
          <Icon name="bolt" size={16} sw={2.3} /> Sugerir reparto
        </button>
        <button className="btn btn-ghost" style={{ padding: "11px 14px", fontSize: 13.5, flex: "none" }} onClick={() => applyTemplate("clear")}>
          Vaciar
        </button>
      </div>

      {/* budget rows */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {rows.map(r => {
          const fill = income > 0 ? r.amt / income * 100 : 0;
          const col = catColor(r.cat, 0.62, 0.17);
          return (
            <div key={r.id} className="brow">
              <div className="brow-top">
                <IconTile icon={catIcon(r.cat)} hue={CATS[r.cat].hue} size={36} dark={dark} />
                <span className="nm">{r.cat}</span>
                <span className="brow-val">
                  <span className="big money">{mode === "pct" ? pctOf(r.amt) + "%" : fmt0(r.amt)}</span>
                  <span className="sub money"> · {mode === "pct" ? fmt0(r.amt) : pctOf(r.amt) + "%"}</span>
                </span>
                <button className="brow-x" onClick={() => removeRow(r.id)} aria-label="quitar"><Icon name="close" size={15} sw={2.4} /></button>
              </div>
              <input type="range" className="wslider"
                min={0} max={income} step={mode === "pct" ? Math.max(1, Math.round(income / 100)) : 50}
                value={r.amt}
                style={{
                  "--slider-fill": col,
                  background: `linear-gradient(90deg, ${col} ${fill}%, var(--ring-track) ${fill}%)`
                }}
                onChange={(e) => setRowAmt(r.id, Number(e.target.value))} />
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="empty" style={{ padding: "30px 20px" }}>
            <div className="em-ic"><Icon name="chart" size={26} sw={2} /></div>
            <p>Agrega categorías para repartir tu ingreso.</p>
          </div>
        )}
      </div>

      {/* add category */}
      {available.length > 0 && (
        <div className="stack" style={{ gap: 9 }}>
          <span className="eyebrow" style={{ padding: "4px 4px 0" }}>Agregar categoría</span>
          <div className="addcat">
            {available.map(c => (
              <button key={c} className="chip" onClick={() => addRow(c)}>
                <Icon name={catIcon(c)} size={15} sw={2.2} /> {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =================== HAPPY PIG (congrats) =================== */
function HappyOink({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {/* ears */}
      <path d="M30 30c-6-7-13-7-13-1 0 7 8 12 14 12z" fill="#fff" />
      <path d="M70 30c6-7 13-7 13-1 0 7-8 12-14 12z" fill="#fff" />
      {/* head */}
      <ellipse cx="50" cy="55" rx="32" ry="28" fill="#fff" />
      {/* cheeks */}
      <ellipse cx="31" cy="60" rx="6" ry="4.5" fill="oklch(0.82 0.1 12 / .7)" />
      <ellipse cx="69" cy="60" rx="6" ry="4.5" fill="oklch(0.82 0.1 12 / .7)" />
      {/* eyes (happy curves) */}
      <path d="M37 48c2-3 6-3 8 0" fill="none" stroke="oklch(0.32 0.04 295)" strokeWidth="3" strokeLinecap="round" />
      <path d="M55 48c2-3 6-3 8 0" fill="none" stroke="oklch(0.32 0.04 295)" strokeWidth="3" strokeLinecap="round" />
      {/* snout */}
      <ellipse cx="50" cy="63" rx="13" ry="9.5" fill="oklch(0.9 0.06 350)" />
      <ellipse cx="45.5" cy="63" rx="2.1" ry="3" fill="oklch(0.45 0.08 350)" />
      <ellipse cx="54.5" cy="63" rx="2.1" ry="3" fill="oklch(0.45 0.08 350)" />
    </svg>
  );
}

Object.assign(window, { PERIODS, PLAN_TEMPLATE, StepPeriodo, StepCuentas, StepIngreso, StepReparto, HappyOink });
