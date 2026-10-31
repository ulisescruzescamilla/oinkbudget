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
  add:      { eyebrow: "Registrar",     title: "Nuevo movimiento" },
  categories: { eyebrow: "Organiza",    title: "Presupuestos recurrentes" },
  txcats:   { eyebrow: "Organiza",      title: "Categorías" },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState("home");
  const [addMode, setAddMode] = useState("expense");
  const [prevScreen, setPrevScreen] = useState("home");
  const isSub = screen === "add" || screen === "categories" || screen === "txcats";
  const openSub = (s) => { if (!isSub) setPrevScreen(screen); setScreen(s); };
  const openAdd = (m) => { setAddMode(m || "expense"); openSub("add"); };
  const closeAdd = () => setScreen(prevScreen);
  const [catForm, setCatForm] = useState(null);
  const openCatForm = (opts) => setCatForm({ id: Date.now(), ...opts });
  const onNewCat = (kind, onSaved) => openCatForm({ kind, onSaved });
  useCatsVersion();
  useTxCatsVersion();
  const [txCatForm, setTxCatForm] = useState(null);
  const [txCatKind, setTxCatKind] = useState("expense");
  const openTxCatForm = (opts) => setTxCatForm({ id: Date.now(), ...opts });
  const onNewTxCat = (kind, onSaved) => openTxCatForm({ kind, onSaved });
  const [menu, setMenu] = useState(false);
  const isDark = t.theme === "dark";
  const MENU_ITEMS = [
    { id: "categories", icon: "tag", label: "Presupuestos recurrentes", sub: "Crea, edita y elimina tus presupuestos recurrentes", onClick: () => { setMenu(false); openSub("categories"); } },
    { id: "txcats", icon: "filter", label: "Categorías", sub: "Clasifica tus ingresos y gastos", onClick: () => { setMenu(false); openSub("txcats"); } },
    { id: "theme", icon: isDark ? "sun" : "moon", label: "Modo oscuro", toggle: isDark, onClick: () => setTweak("theme", isDark ? "light" : "dark") },
  ];
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
              {isSub
                ? <button className="iconbtn" onClick={closeAdd} aria-label="volver"><Icon name="back" size={20} sw={2.4} /></button>
                : <span className="brandmark"><OinkMark size={22} /></span>}
              <div className="ttl">
                <small>{meta.eyebrow}</small>
                <h1>{meta.title}</h1>
              </div>
            </div>
            <div className="tools">
              {!isSub && (
                <button className="iconbtn" onClick={() => setMenu(true)} aria-label="ajustes">
                  <Icon name="settings" size={20} />
                </button>
              )}
            </div>
          </div>

          {/* screen */}
          <div className="screen" key={screen}>
            {screen === "home" && <Dashboard dark={dark} onAdd={openAdd} onNav={setScreen} />}
            {screen === "add" && <QuickAdd mode={addMode} dark={dark} onClose={closeAdd} onSave={() => {}} onNewTxCat={onNewTxCat} />}
            {screen === "txcats" && <TxCategories dark={dark} kind={txCatKind} setKind={setTxCatKind} onEdit={(id) => openTxCatForm({ editId: id })} />}
            {screen === "categories" && <Categories dark={dark} onEdit={(c) => openCatForm({ editName: c })} />}
            {screen === "tx" && <Transactions dark={dark} />}
            {screen === "budgets" && <Budgets dark={dark} onAdd={() => setNewBudget(true)} />}
            {screen === "accounts" && <Accounts dark={dark} onAdd={() => setNewAccount(true)} />}
          </div>

          {/* bottom dock: contextual CTA + tab bar */}
          <div className="dock">
            {(screen === "budgets" || screen === "accounts" || screen === "categories" || screen === "txcats") && (
              <div className="screen-cta">
                <button className="btn btn-primary btn-block btn-lg"
                  onClick={() => screen === "budgets" ? setNewBudget(true) : screen === "accounts" ? setNewAccount(true) : screen === "txcats" ? openTxCatForm({ kind: txCatKind, onSaved: () => {} }) : openCatForm({ kind: "expense" })}>
                  <Icon name="plus" size={20} sw={2.6} />
                  {screen === "budgets" ? "Agregar presupuesto" : screen === "accounts" ? "Crear cuenta" : screen === "txcats" ? "Nueva categoría" : "Nuevo presupuesto recurrente"}
                </button>
              </div>
            )}
            <div className="tabbar">
              <Tab id="home" cur={screen} set={setScreen} icon="home" label="Inicio" />
              <Tab id="tx" cur={screen} set={setScreen} icon="swap" label="Movimientos" />
              <button className={"fab" + (screen === "add" ? " on" : "")} onClick={() => screen === "add" ? closeAdd() : openAdd("expense")} aria-label={screen === "add" ? "Cerrar" : "Agregar"}>
                <Icon name="plus" size={26} sw={2.6} />
              </button>
              <Tab id="accounts" cur={screen} set={setScreen} icon="bank" label="Cuentas" />
              <Tab id="budgets" cur={screen} set={setScreen} icon="chart" label="Presupuestos" />
            </div>
          </div>

          {/* new budget */}
          <Sheet open={newBudget} onClose={() => setNewBudget(false)} title="Nuevo presupuesto">
            <NewBudgetForm dark={dark} onClose={() => setNewBudget(false)} onNewCat={onNewCat} />
          </Sheet>

          {/* new account */}
          <Sheet open={newAccount} onClose={() => setNewAccount(false)} title="Nueva cuenta">
            <NewAccountForm onClose={() => setNewAccount(false)} />
          </Sheet>

          <SideMenu open={menu} onClose={() => setMenu(false)} items={MENU_ITEMS} />
          <ConfirmHost />
          <SuccessHost />

          <Sheet open={!!txCatForm} onClose={() => setTxCatForm(null)} title={txCatForm && txCatForm.editId ? "Editar categoría" : "Nueva categoría"}>
            {txCatForm && <TxCategoryForm key={txCatForm.id} editId={txCatForm.editId} kind={txCatForm.kind} dark={dark}
              onSaved={txCatForm.onSaved} onClose={() => setTxCatForm(null)} />}
          </Sheet>

          {/* category create / edit */}
          <Sheet open={!!catForm} onClose={() => setCatForm(null)} title={catForm && catForm.editName ? "Editar presupuesto recurrente" : "Nuevo presupuesto recurrente"}>
            {catForm && <CategoryForm key={catForm.id} editName={catForm.editName} kind={catForm.kind} dark={dark}
              onSaved={catForm.onSaved} onClose={() => setCatForm(null)} />}
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

/* settings drawer — items: { id, icon, label, sub?, toggle?, onClick } */
function SideMenu({ open, onClose, items }) {
  return (
    <div className={"drawer-scrim" + (open ? " open" : "")} onClick={onClose} aria-hidden={!open}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ajustes">
        <div className="drawer-h">
          <span className="brandmark"><OinkMark size={22} /></span>
          <h2>Ajustes</h2>
          <button className="iconbtn" onClick={onClose} aria-label="cerrar"><Icon name="close" size={20} /></button>
        </div>
        <nav className="drawer-list">
          {items.map(it => (
            <button key={it.id} className="drawer-item" onClick={it.onClick}>
              <span className="ic"><Icon name={it.icon} size={19} sw={2.1} /></span>
              <span className="mid">
                <span className="t1">{it.label}</span>
                {it.sub && <span className="t2">{it.sub}</span>}
              </span>
              {it.toggle !== undefined
                ? <span className="switch" data-on={it.toggle ? "1" : "0"} role="switch" aria-checked={it.toggle}><i /></span>
                : <Icon name="chev" size={18} style={{ color: "var(--faint)" }} />}
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
}

/* --- minimal create forms --- */
function NewBudgetForm({ onClose, dark, onNewCat }) {
  const INCOME = 20000;
  const allocated = BUDGETS.reduce((s, b) => s + b.max, 0);
  const available = Math.max(0, INCOME - allocated);
  const [name, setName] = useState("");
  const [amt, setAmt] = useState(0);
  const [mode, setMode] = useState("amt");
  const [cat, setCat] = useState("Mercado");
  const [recurrent, setRecurrent] = useState(false);
  const [period, setPeriod] = useState("monthly");
  const cats = catsByKind("expense");
  const periods = [["weekly","Semanal"],["biweekly","Quincenal"],["monthly","Mensual"],["yearly","Anual"]];
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="field"><label>Nombre</label>
        <input className="input" placeholder={cat} value={name} onChange={e=>setName(e.target.value)} /></div>
      <div className="field"><label>Presupuesto recurrente</label>
        <div className="chips" style={{ flexWrap: "wrap" }}>
          {cats.map(c => <button key={c} className={"chip"+(cat===c?" on":"")} onClick={()=>setCat(c)}>
            <Icon name={catIcon(c)} size={15} sw={2.2} /> {c}</button>)}
          {onNewCat && <button className="chip chip-new" onClick={() => onNewCat("expense", setCat)}><Icon name="plus" size={15} sw={2.4} /> Nueva</button>}
        </div></div>
      <div className="field">
        <div className="rowflex between" style={{ alignItems: "center" }}>
          <label className="field-label">Monto máximo</label>
          <div className="seg" style={{ padding: 3 }}>
            <button className={mode === "amt" ? "on" : ""} onClick={() => setMode("amt")} style={{ padding: "5px 11px" }}>$</button>
            <button className={mode === "pct" ? "on" : ""} onClick={() => setMode("pct")} style={{ padding: "5px 11px" }}>%</button>
          </div>
        </div>
        <BudgetRow solo editable cat={cat} label={name.trim() || cat} amt={amt} base={available} mode={mode} dark={dark} onChange={setAmt} />
        <span className="fs12 t-muted fw7" style={{ padding: "0 2px" }}>Disponible sin asignar: <b className="money" style={{ color: "var(--text)" }}>{fmt0(available - amt)}</b> de tu ingreso de {fmt0(INCOME)}</span>
      </div>
      <div className="switch-row">
        <div className="sw-ic"><Icon name="repeat" size={19} sw={2.2} /></div>
        <div className="sw-txt">
          <div className="l1">Presupuesto recurrente</div>
          <div className="l2">Se vuelve a crear automáticamente cada periodo</div>
        </div>
        <button type="button" className="switch" role="switch" aria-checked={recurrent}
          data-on={recurrent ? "1" : "0"} onClick={()=>setRecurrent(v=>!v)}><i /></button>
      </div>
      {recurrent ? (
        <div className="field"><label>Periodo</label>
          <div className="chips" style={{ flexWrap: "wrap" }}>
            {periods.map(([v,l]) => <button key={v} className={"chip"+(period===v?" on":"")} onClick={()=>setPeriod(v)}>{l}</button>)}
          </div></div>
      ) : (
        <div className="rowflex gap8 fs13 t-muted fw7"><Icon name="cal" size={16} sw={2}/> Periodo: <b style={{color:"var(--text)"}}>Mensual</b></div>
      )}
      <button className="btn btn-primary btn-block btn-lg" disabled={!(amt > 0)} style={{ opacity: amt > 0 ? 1 : .5 }} onClick={() => { onClose(); notifySuccess({ title: "Presupuesto creado", sub: `${name.trim() || cat} · ${fmt0(amt)}` }); }}><Icon name="check" size={20} sw={2.4}/> Crear presupuesto</button>
    </div>
  );
}

function NewAccountForm({ onClose }) {
  const [name, setName] = useState("");
  const [bal, setBal] = useState("");
  const [type, setType] = useState("Banco");
  const [excludeTotal, setExcludeTotal] = useState(false);
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
      <div className="switch-row">
        <div className="sw-ic"><Icon name="eyeoff" size={19} sw={2.2} /></div>
        <div className="sw-txt">
          <div className="l1">Excluir del total</div>
          <div className="l2">El saldo no se sumará al total de tus cuentas</div>
        </div>
        <button type="button" className="switch" role="switch" aria-checked={excludeTotal}
          data-on={excludeTotal ? "1" : "0"} onClick={()=>setExcludeTotal(v=>!v)}><i /></button>
      </div>
      <button className="btn btn-primary btn-block btn-lg" onClick={() => { onClose(); notifySuccess({ title: "Cuenta creada", sub: `${name.trim() || type} · ${fmt(parseFloat(bal) || 0)}` }); }}><Icon name="check" size={20} sw={2.4}/> Crear cuenta</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
