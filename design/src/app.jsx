/* app.jsx — shell, routing, theme + direction, mount */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "aurora",
  "theme": "light",
  "font": "Plus Jakarta Sans",
  "density": "normal"
}/*EDITMODE-END*/;

const SCREENS = {
  home:     { eyebrow: "Buenas tardes", title: "Tu resumen" },
  tx:       { eyebrow: "Historial",     title: "Movimientos" },
  budgets:  { eyebrow: "Plan mensual",  title: "Presupuestos" },
  accounts: { eyebrow: "Tu dinero",     title: "Cuentas" },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState("home");
  const [add, setAdd] = useState({ open: false, mode: "expense" });
  const [newBudget, setNewBudget] = useState(false);
  const [newAccount, setNewAccount] = useState(false);
  const dark = t.theme === "dark";

  useEffect(() => {
    document.body.classList.toggle("is-dark", dark);
  }, [dark]);

  const meta = SCREENS[screen];
  const fontStack = `"${t.font}", ui-sans-serif, system-ui, sans-serif`;

  return (
    <div className="stage">

      {/* presentation chrome */}
      <div className="chrome">
        <div className="brandline">
          <span className="brandmark" style={{ width: 32, height: 32, borderRadius: 10 }}><OinkMark size={20} /></span>
          <b>OinkBudget</b>
        </div>
        <span className="hint">Rediseño · usa Tweaks para cambiar de dirección</span>
      </div>

      {/* phone */}
      <div className="app" data-theme={t.theme} data-dir={t.direction} data-density={t.density}
           style={{ "--font": fontStack }}>
        <div className="phone" style={{ fontFamily: fontStack }}>

          {/* status bar */}
          <div className="statusbar">
            <span>9:41</span>
            <div className="sig">
              <Icon name="trend" size={15} sw={2.4} />
              <span style={{ fontSize: 12, fontWeight: 800 }}>OinkBudget</span>
            </div>
            <div className="dots"><i /><i /><i style={{ width: 16, borderRadius: 3 }} /></div>
          </div>

          {/* appbar */}
          <div className="appbar">
            <div className="rowflex gap10">
              <span className="brandmark"><OinkMark size={22} /></span>
              <div className="ttl">
                <small>{meta.eyebrow}</small>
                <h1>{meta.title}</h1>
              </div>
            </div>
            <div className="tools">
              <button className="iconbtn" onClick={() => setTweak("theme", dark ? "light" : "dark")} aria-label="tema">
                <Icon name={dark ? "sun" : "moon"} size={20} />
              </button>
            </div>
          </div>

          {/* screen */}
          <div className="screen" key={screen}>
            {screen === "home" && <Dashboard dark={dark} onAdd={(m) => setAdd({ open: true, mode: m })} onNav={setScreen} />}
            {screen === "tx" && <Transactions dark={dark} />}
            {screen === "budgets" && <Budgets dark={dark} onAdd={() => setNewBudget(true)} />}
            {screen === "accounts" && <Accounts dark={dark} onAdd={() => setNewAccount(true)} />}
          </div>

          {/* bottom dock: contextual CTA + tab bar */}
          <div className="dock">
            {(screen === "budgets" || screen === "accounts") && (
              <div className="screen-cta">
                <button className="btn btn-primary btn-block btn-lg"
                  onClick={() => screen === "budgets" ? setNewBudget(true) : setNewAccount(true)}>
                  <Icon name="plus" size={20} sw={2.6} />
                  {screen === "budgets" ? "Agregar presupuesto" : "Crear cuenta"}
                </button>
              </div>
            )}
            <div className="tabbar">
              <Tab id="home" cur={screen} set={setScreen} icon="home" label="Inicio" />
              <Tab id="tx" cur={screen} set={setScreen} icon="swap" label="Movimientos" />
              <button className="fab" onClick={() => setAdd({ open: true, mode: "expense" })} aria-label="Agregar">
                <Icon name="plus" size={26} sw={2.6} />
              </button>
              <Tab id="accounts" cur={screen} set={setScreen} icon="bank" label="Cuentas" />
              <Tab id="budgets" cur={screen} set={setScreen} icon="chart" label="Presupuestos" />
            </div>
          </div>

          {/* quick add */}
          <QuickAdd open={add.open} mode={add.mode} dark={dark}
            onClose={() => setAdd(a => ({ ...a, open: false }))} onSave={() => {}} />

          {/* new budget */}
          <Sheet open={newBudget} onClose={() => setNewBudget(false)} title="Nuevo presupuesto">
            <NewBudgetForm onClose={() => setNewBudget(false)} />
          </Sheet>

          {/* new account */}
          <Sheet open={newAccount} onClose={() => setNewAccount(false)} title="Nueva cuenta">
            <NewAccountForm onClose={() => setNewAccount(false)} />
          </Sheet>

        </div>
      </div>

      {/* Tweaks */}
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

function Tab({ id, cur, set, icon, label }) {
  return (
    <button className={"tab" + (cur === id ? " on" : "")} onClick={() => set(id)}>
      <Icon name={icon} size={23} sw={cur === id ? 2.3 : 2} />
      <span>{label}</span>
    </button>
  );
}

/* --- minimal create forms --- */
function NewBudgetForm({ onClose }) {
  const [name, setName] = useState("");
  const [max, setMax] = useState("");
  const [cat, setCat] = useState("Mercado");
  const cats = ["Mercado","Restaurantes","Transporte","Ocio","Salud","Servicios","Ahorro","Otro"];
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="field"><label>Nombre</label>
        <input className="input" placeholder="Ej. Mercado" value={name} onChange={e=>setName(e.target.value)} /></div>
      <div className="field"><label>Monto máximo</label>
        <input className="input money" placeholder="$0.00" inputMode="decimal" value={max} onChange={e=>setMax(e.target.value)} /></div>
      <div className="field"><label>Categoría</label>
        <div className="chips" style={{ flexWrap: "wrap" }}>
          {cats.map(c => <button key={c} className={"chip"+(cat===c?" on":"")} onClick={()=>setCat(c)}>
            <Icon name={catIcon(c)} size={15} sw={2.2} /> {c}</button>)}
        </div></div>
      <div className="rowflex gap8 fs13 t-muted fw7"><Icon name="cal" size={16} sw={2}/> Periodo: <b style={{color:"var(--text)"}}>Mensual</b></div>
      <button className="btn btn-primary btn-block btn-lg" onClick={onClose}><Icon name="check" size={20} sw={2.4}/> Crear presupuesto</button>
    </div>
  );
}

function NewAccountForm({ onClose }) {
  const [name, setName] = useState("");
  const [bal, setBal] = useState("");
  const [type, setType] = useState("Banco");
  const types = [["Banco","building"],["Cartera","wallet"],["Tarjeta","card"],["Inversión","piggy"]];
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="field"><label>Nombre</label>
        <input className="input" placeholder="Ej. BBVA" value={name} onChange={e=>setName(e.target.value)} /></div>
      <div className="field"><label>Tipo</label>
        <div className="chips">
          {types.map(([tp,ic]) => <button key={tp} className={"chip"+(type===tp?" on":"")} onClick={()=>setType(tp)}>
            <Icon name={ic} size={15} sw={2.2} /> {tp}</button>)}
        </div></div>
      <div className="field"><label>Saldo inicial</label>
        <input className="input money" placeholder="$0.00" inputMode="decimal" value={bal} onChange={e=>setBal(e.target.value)} /></div>
      <button className="btn btn-primary btn-block btn-lg" onClick={onClose}><Icon name="check" size={20} sw={2.4}/> Crear cuenta</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
