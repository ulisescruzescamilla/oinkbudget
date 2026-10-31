/* quickadd.jsx — expense/income capture screen */
const { useState: useStateQA, useEffect: useEffectQA } = React;

const isoDay = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const dayLabel = (iso) => {
  if (iso === isoDay(0)) return "Hoy";
  if (iso === isoDay(-1)) return "Ayer";
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${months[m - 1]}${y !== new Date().getFullYear() ? " " + y : ""}`;
};

function QuickAdd({ mode: initMode, onClose, onSave, onNewTxCat, dark }) {
  const [mode, setMode] = useStateQA(initMode || "expense");
  const [amount, setAmount] = useStateQA("0");
  const [tcat, setTcat] = useStateQA(txCatsByKind(initMode === "income" ? "income" : "expense")[0].id);
  useTxCatsVersion();
  const [acct, setAcct] = useStateQA("BBVA");
  const [desc, setDesc] = useStateQA("");
  const [date, setDate] = useStateQA(isoDay(0));

  useEffectQA(() => { switchMode(initMode || "expense"); }, [initMode]);

  const press = (k) => {
    setAmount(prev => {
      if (k === "del") return prev.length <= 1 ? "0" : prev.slice(0, -1);
      if (k === ".") return prev.includes(".") ? prev : prev + ".";
      if (prev === "0") return k;
      const dec = prev.split(".")[1];
      if (dec && dec.length >= 2) return prev;
      return prev + k;
    });
  };

  const isInc = mode === "income";
  const tcats = txCatsByKind(isInc ? "income" : "expense");
  function switchMode(m) { setMode(m); setTcat(txCatsByKind(m)[0].id); }

  const doSave = () => {
    const n = parseFloat(amount) || 0;
    onSave && onSave({ mode, amount: n, tcat, acct, desc, date });
    onClose();
    notifySuccess({ title: isInc ? "Ingreso registrado" : "Gasto registrado", sub: `${fmt(n)} · ${txCat(tcat).name}`, tone: isInc ? "income" : "primary" });
  };

  return (
    <div className={"qa-page " + (isInc ? "inc" : "exp")}>
      <div className="qa-tabs" role="tablist">
        <button role="tab" aria-selected={!isInc} className={!isInc ? "on" : ""} onClick={() => switchMode("expense")}>
          <Icon name="down" size={17} sw={2.4} /> Gasto
        </button>
        <button role="tab" aria-selected={isInc} className={isInc ? "on" : ""} onClick={() => switchMode("income")}>
          <Icon name="up" size={17} sw={2.4} /> Ingreso
        </button>
      </div>

      <div className={"amount-display " + (isInc ? "inc" : "exp")}>
        <div className="v"><span className="cur">$</span>{amount}</div>
      </div>

      <div className="keypad">
        {["1","2","3","4","5","6","7","8","9",".","0","del"].map(k => (
          <button key={k} className="key" onClick={() => press(k)}>
            {k === "del" ? <Icon name="close" size={20} sw={2.4} /> : k}
          </button>
        ))}
      </div>

      <div className="qa-fields">
        <div className="field">
          <label>Categoría</label>
          <div className="chips" style={{ flexWrap: "wrap" }}>
            {tcats.map(c => (
              <button key={c.id} className={"chip" + (tcat === c.id ? " on" : "")} onClick={() => setTcat(c.id)}>
                <Icon name={c.icon} size={15} sw={2.2} /> {c.name}
              </button>
            ))}
            {onNewTxCat && <button className="chip chip-new" onClick={() => onNewTxCat(isInc ? "income" : "expense", setTcat)}><Icon name="plus" size={15} sw={2.4} /> Nueva</button>}
          </div>
        </div>
        <div className="field">
          <label>Cuenta</label>
          <div className="chips" style={{ flexWrap: "wrap" }}>
            {ACCOUNTS.map(a => (
              <button key={a.id} className={"chip" + (acct === a.name ? " on" : "")} onClick={() => setAcct(a.name)}>
                <Icon name={a.icon} size={15} sw={2.2} /> {a.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Fecha</label>
          <div className="daterow">
            <button className={"chip" + (date === isoDay(0) ? " on" : "")} onClick={() => setDate(isoDay(0))}>Hoy</button>
            <button className={"chip" + (date === isoDay(-1) ? " on" : "")} onClick={() => setDate(isoDay(-1))}>Ayer</button>
            <label className={"datepick" + (date !== isoDay(0) && date !== isoDay(-1) ? " on" : "")}>
              <Icon name="cal" size={15} sw={2.2} />
              <span>{date === isoDay(0) || date === isoDay(-1) ? "Otra fecha" : dayLabel(date)}</span>
              <input type="date" value={date} max={isoDay(0)} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </label>
          </div>
        </div>
        <div className="field">
          <label>Descripción</label>
          <input className="input" placeholder={isInc ? "Ej. Nómina, freelance…" : "Ej. Café, súper…"}
            value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
      </div>

      <div className="qa-save">
        <button className="btn btn-primary btn-block btn-lg"
          style={{ background: isInc ? "var(--income)" : "var(--primary)" }}
          disabled={!(parseFloat(amount) > 0)} onClick={doSave}>
          <Icon name="check" size={20} sw={2.4} /> Guardar {isInc ? "ingreso" : "gasto"}
        </button>
      </div>
    </div>
  );
}
Object.assign(window, { QuickAdd });
