/* wizard.jsx — "Crear plan" shell: state, navigation, congrats, mount */
const { useState: useStateWz, useEffect: useEffectWz } = React;

const WZ_TWEAKS = /*EDITMODE-BEGIN*/{
  "direction": "aurora",
  "theme": "light",
  "font": "Plus Jakarta Sans",
  "density": "normal"
}/*EDITMODE-END*/;

const WZ_STEPS = [
  { key: "periodo",  title: "¿Cada cuánto planeas?", sub: "Elige el periodo de tu plan de presupuesto." },
  { key: "cuentas",  title: "¿Qué cuentas incluyes?", sub: "Selecciona el dinero que entra en este plan." },
  { key: "ingreso",  title: "¿Cuánto ingresa?",       sub: "Captura el ingreso que vas a repartir." },
  { key: "reparto",  title: "Reparte tu ingreso",     sub: "Asigna un monto o porcentaje a cada categoría." },
];
const LS_KEY = "oink_wizard_v1";

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY));
    if (s && typeof s === "object") return s;
  } catch (e) {}
  return null;
}

function Wizard({ dark }) {
  const saved = loadState();
  const [step, setStep]     = useStateWz(saved?.step ?? 0);
  const [period, setPeriod] = useStateWz(saved?.period ?? "mensual");
  const [accSel, setAccSel] = useStateWz(saved?.accSel ?? { a1: true, a2: true, a3: false, a4: true });
  const [income, setIncome] = useStateWz(saved?.income ?? 0);
  const [mode, setMode]     = useStateWz(saved?.mode ?? "amt");
  const [rows, setRows]     = useStateWz(saved?.rows ?? []);

  /* persist */
  useEffectWz(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ step, period, accSel, income, mode, rows })); } catch (e) {}
  }, [step, period, accSel, income, mode, rows]);

  const accTotal = ACCOUNTS.reduce((s, a) => s + (accSel[a.id] ? a.balance : 0), 0);
  const accCount = ACCOUNTS.filter(a => accSel[a.id]).length;
  const allocated = rows.reduce((s, r) => s + r.amt, 0);
  const remaining = Math.max(0, income - allocated);

  const toggleAcc = (id) => setAccSel(s => ({ ...s, [id]: !s[id] }));

  /* reparto ops */
  const setRowAmt = (id, val) => setRows(rs => {
    const others = rs.filter(r => r.id !== id).reduce((s, r) => s + r.amt, 0);
    const maxForRow = Math.max(0, income - others);
    const clamped = Math.max(0, Math.min(val, maxForRow));
    return rs.map(r => r.id === id ? { ...r, amt: clamped } : r);
  });
  const removeRow = (id) => setRows(rs => rs.filter(r => r.id !== id));
  const addRow = (cat) => setRows(rs => [...rs, { id: "pb" + Date.now(), cat, amt: 0 }]);
  const applyTemplate = (kind) => {
    if (kind === "clear") { setRows(rs => rs.map(r => ({ ...r, amt: 0 }))); return; }
    setRows(PLAN_TEMPLATE.map((p, i) => ({ id: "pb" + i, cat: p.cat, amt: Math.round(p.w / 100 * income) })));
  };

  /* seed reparto with the suggested split the first time we arrive */
  useEffectWz(() => {
    if (step === 3 && rows.length === 0 && income > 0) {
      setRows(PLAN_TEMPLATE.map((p, i) => ({ id: "pb" + i, cat: p.cat, amt: Math.round(p.w / 100 * income) })));
    }
  }, [step]);

  const restart = () => {
    setStep(0); setPeriod("mensual"); setAccSel({ a1: true, a2: true, a3: false, a4: true });
    setIncome(0); setMode("amt"); setRows([]);
  };

  /* gating */
  const canNext = step === 0 ? true
    : step === 1 ? accCount > 0
    : step === 2 ? income > 0
    : true;

  const meta = WZ_STEPS[step];
  const isDone = step === 4;

  /* ---------- congrats ---------- */
  if (isDone) {
    const pctSave = income > 0 ? Math.round((rows.find(r => r.cat === "Ahorro")?.amt || 0) / income * 100) : 0;
    const confettiCols = ["oklch(0.62 0.21 293)", "oklch(0.72 0.18 330)", "oklch(0.72 0.17 32)", "oklch(0.62 0.14 158)", "oklch(0.78 0.14 90)"];
    return (
      <React.Fragment>
        <div className="congrats">
          <div className="confetti">
            {Array.from({ length: 16 }).map((_, i) => {
              const left = (i * 6.4 + (i % 3) * 5) % 100;
              return <i key={i} style={{
                left: left + "%",
                background: confettiCols[i % confettiCols.length],
                animationDuration: (1.6 + (i % 4) * 0.35) + "s",
                animationDelay: ((i % 6) * 0.18) + "s",
                borderRadius: i % 2 ? "2px" : "50%",
              }} />;
            })}
          </div>
          <div className="badge">
            <div className="ring" />
            <div style={{ position: "relative", zIndex: 1 }}><HappyOink size={104} /></div>
            <div className="check"><Icon name="check" size={22} sw={3} /></div>
          </div>
          <h1>¡Tu plan está listo! 🎉</h1>
          <p className="sub">Repartiste <b className="money" style={{ color: "var(--text)" }}>{fmt0(allocated)}</b> en {rows.filter(r => r.amt > 0).length} categorías. Empecemos a cuidar tu dinero.</p>

          <div className="plan-recap">
            <div className="recap-cell"><div className="k">Periodo</div><div className="v"><Icon name={PERIODS[period].icon} size={17} sw={2.2} style={{ color: "var(--primary)" }} /> {PERIODS[period].label}</div></div>
            <div className="recap-cell"><div className="k">Ingreso</div><div className="v money">{fmt0(income)}</div></div>
            <div className="recap-cell"><div className="k">Presupuestos</div><div className="v">{rows.filter(r => r.amt > 0).length}</div></div>
            <div className="recap-cell"><div className="k">Ahorro</div><div className="v money" style={{ color: "var(--income)" }}>{pctSave + "%"}</div></div>
          </div>
        </div>
        <div className="wiz-dock">
          <div className="wiz-cta">
            <button className="btn btn-primary btn-block btn-lg" onClick={restart}>
              <Icon name="home" size={20} sw={2.3} /> Ver mi resumen
            </button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  /* ---------- working steps ---------- */
  const ctaLabel = step === 3
    ? (remaining > 0 ? `Crear plan · queda ${fmt0(remaining)}` : "Crear mi plan")
    : "Continuar";

  return (
    <React.Fragment>
      <div className="wiz-head">
        <div className="wiz-top">
          <button className="iconbtn" style={{ visibility: step > 0 ? "visible" : "hidden" }}
            onClick={() => setStep(s => Math.max(0, s - 1))} aria-label="atrás">
            <Icon name="chev" size={20} style={{ transform: "rotate(180deg)" }} />
          </button>
          <span className="step-of">Paso {step + 1} de {WZ_STEPS.length}</span>
          <button className="iconbtn" onClick={restart} aria-label="cerrar"><Icon name="close" size={19} /></button>
        </div>
        <div className="wiz-steps">
          {WZ_STEPS.map((_, i) => <i key={i} className={i < step ? "done" : i === step ? "cur" : ""} />)}
        </div>
        <div className="wiz-title">
          <h2>{meta.title}</h2>
          <p>{meta.sub}</p>
        </div>
      </div>

      <div className="wiz-body" key={step}>
        <div className="screen-anim">
          {step === 0 && <StepPeriodo period={period} setPeriod={setPeriod} />}
          {step === 1 && <StepCuentas accSel={accSel} toggleAcc={toggleAcc} dark={dark} />}
          {step === 2 && <StepIngreso income={income} setIncome={setIncome} period={period} accTotal={accTotal} />}
          {step === 3 && <StepReparto income={income} rows={rows} setRowAmt={setRowAmt} removeRow={removeRow}
            addRow={addRow} mode={mode} setMode={setMode} allocated={allocated} remaining={remaining}
            applyTemplate={applyTemplate} dark={dark} />}
        </div>
      </div>

      <div className="wiz-dock">
        <div className="wiz-cta">
          <button className="btn btn-primary btn-block btn-lg" disabled={!canNext}
            style={{ opacity: canNext ? 1 : .5 }}
            onClick={() => setStep(s => Math.min(4, s + 1))}>
            {ctaLabel}
            {step < 3 && <Icon name="arrowright" size={20} sw={2.4} />}
            {step === 3 && <Icon name="check" size={20} sw={2.6} />}
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---------- host: phone shell + presentation chrome + tweaks ---------- */
function WizardApp() {
  const [t, setTweak] = useTweaks(WZ_TWEAKS);
  const dark = t.theme === "dark";
  useEffectWz(() => { document.body.classList.toggle("is-dark", dark); }, [dark]);
  const fontStack = `"${t.font}", ui-sans-serif, system-ui, sans-serif`;

  return (
    <div className="stage">
      <div className="chrome">
        <div className="brandline">
          <span className="brandmark" style={{ width: 32, height: 32, borderRadius: 10 }}><OinkMark size={20} /></span>
          <b>OinkBudget</b>
        </div>
        <span className="hint">Flujo · Crear un plan de presupuesto</span>
      </div>

      <div className="app" data-theme={t.theme} data-dir={t.direction} data-density={t.density} style={{ "--font": fontStack }}>
        <div className="phone" style={{ fontFamily: fontStack }}>
          <div className="statusbar">
            <span>9:41</span>
            <div className="sig">
              <Icon name="trend" size={15} sw={2.4} />
              <span style={{ fontSize: 12, fontWeight: 800 }}>OinkBudget</span>
            </div>
            <div className="dots"><i /><i /><i style={{ width: 16, borderRadius: 3 }} /></div>
          </div>
          <Wizard dark={dark} />
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Dirección de marca" />
        <TweakRadio label="Estilo" value={t.direction}
          options={[{label:"Aurora",value:"aurora"},{label:"Confeti",value:"confeti"},{label:"Lingote",value:"lingote"}]}
          onChange={(v) => setTweak("direction", v)} />
        <TweakSection label="Apariencia" />
        <TweakRadio label="Tema" value={t.theme}
          options={[{label:"Claro",value:"light"},{label:"Oscuro",value:"dark"}]}
          onChange={(v) => setTweak("theme", v)} />
        <TweakRadio label="Densidad" value={t.density}
          options={[{label:"Cómoda",value:"comfy"},{label:"Normal",value:"normal"},{label:"Compacta",value:"compact"}]}
          onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Tipografía" />
        <TweakSelect label="Fuente" value={t.font}
          options={["Plus Jakarta Sans","Sora","Nunito"]}
          onChange={(v) => setTweak("font", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<WizardApp />);
