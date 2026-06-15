/* quickadd.jsx — fast expense/income capture sheet */
const { useState: useStateQA, useEffect: useEffectQA } = React;

function QuickAdd({ open, mode: initMode, onClose, onSave, dark }) {
  const [mode, setMode] = useStateQA(initMode || "expense");
  const [amount, setAmount] = useStateQA("0");
  const [cat, setCat] = useStateQA("Mercado");
  const [acct, setAcct] = useStateQA("BBVA");
  const [desc, setDesc] = useStateQA("");
  const [saved, setSaved] = useStateQA(false);

  useEffectQA(() => {
    if (open) { setMode(initMode || "expense"); setAmount("0"); setDesc(""); setSaved(false);
      setCat(initMode === "income" ? "Ingreso" : "Mercado"); }
  }, [open, initMode]);

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
  const cats = isInc ? ["Ingreso", "Otro"] : ["Mercado", "Restaurantes", "Transporte", "Ocio", "Salud", "Servicios", "Otro"];

  const doSave = () => {
    setSaved(true);
    onSave && onSave({ mode, amount: parseFloat(amount) || 0, cat, acct, desc });
    setTimeout(onClose, 850);
  };

  if (saved) {
    return (
      <Sheet open={open} onClose={onClose}>
        <div style={{ textAlign: "center", padding: "26px 10px 14px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 26, margin: "0 auto 16px",
            background: isInc ? "var(--income-soft)" : "var(--primary-soft)",
            color: isInc ? "var(--income)" : "var(--primary)", display: "grid", placeItems: "center",
            animation: "rise .4s cubic-bezier(.2,.8,.2,1)" }}>
            <Icon name="check" size={38} sw={2.6} />
          </div>
          <div className="fw8" style={{ fontSize: 19, color: "var(--text)" }}>
            {isInc ? "Ingreso registrado" : "Gasto registrado"}
          </div>
          <div className="t-muted fw7 mt4 money">{fmt(parseFloat(amount) || 0)} · {cat}</div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={onClose}>
      {/* mode toggle */}
      <div className="rowflex between" style={{ marginBottom: 6 }}>
        <div className="seg">
          <button className={!isInc ? "on" : ""} onClick={() => { setMode("expense"); setCat("Mercado"); }}>Gasto</button>
          <button className={isInc ? "on" : ""} onClick={() => { setMode("income"); setCat("Ingreso"); }}>Ingreso</button>
        </div>
        <button className="iconbtn" onClick={onClose}><Icon name="close" size={20} /></button>
      </div>

      {/* amount */}
      <div className={"amount-display " + (isInc ? "inc" : "exp")}>
        <div className="v"><span className="cur">$</span>{amount}</div>
      </div>

      {/* category chips */}
      <div className="field" style={{ marginBottom: 14 }}>
        <label>{isInc ? "Fuente" : "Categoría"}</label>
        <div className="chips" style={{ flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} className={"chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>
              <Icon name={catIcon(c)} size={15} sw={2.2} /> {c}
            </button>
          ))}
        </div>
      </div>

      {/* account chips */}
      <div className="field" style={{ marginBottom: 14 }}>
        <label>Cuenta</label>
        <div className="chips">
          {ACCOUNTS.map(a => (
            <button key={a.id} className={"chip" + (acct === a.name ? " on" : "")} onClick={() => setAcct(a.name)}>
              <Icon name={a.icon} size={15} sw={2.2} /> {a.name}
            </button>
          ))}
        </div>
      </div>

      {/* description */}
      <div className="field" style={{ marginBottom: 16 }}>
        <label>Descripción</label>
        <input className="input" placeholder={isInc ? "Ej. Nómina, freelance…" : "Ej. Café, súper…"}
          value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>

      {/* keypad */}
      <div className="keypad" style={{ marginBottom: 14 }}>
        {["1","2","3","4","5","6","7","8","9",".","0","del"].map(k => (
          <button key={k} className="key" onClick={() => press(k)}>
            {k === "del" ? <Icon name="close" size={20} sw={2.4} /> : k}
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-block btn-lg"
        style={{ background: isInc ? "var(--income)" : "var(--primary)" }}
        disabled={!(parseFloat(amount) > 0)}
        onClick={doSave}>
        <Icon name="check" size={20} sw={2.4} /> Guardar {isInc ? "ingreso" : "gasto"}
      </button>
    </Sheet>
  );
}
Object.assign(window, { QuickAdd });
