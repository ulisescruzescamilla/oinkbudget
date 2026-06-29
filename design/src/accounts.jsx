/* accounts.jsx — Cuentas */
const { useState: useStateA } = React;

function Accounts({ dark, onAdd }) {
  const [hidden, setHidden] = useStateA({});         // per-account masking
  const [hideAll, setHideAll] = useStateA(false);
  const [sel, setSel] = useStateA(null);
  const total = ACCOUNTS.reduce((s, a) => s + a.balance, 0);
  const mask = (id) => hideAll || hidden[id];

  return (
    <div className="screen-pad screen-anim has-cta">

      {/* total */}
      <div className="card hero">
        <div className="rowflex between">
          <span className="muted fs13 fw7">Total de tus cuentas</span>
          <button className="iconbtn" style={{ background: "rgba(255,255,255,.18)", border: "none", color: "#fff", boxShadow: "none", width: 34, height: 34 }}
            onClick={() => setHideAll(v => !v)}>
            <Icon name={hideAll ? "eyeoff" : "eye"} size={18} />
          </button>
        </div>
        <div className="money" style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-.035em", marginTop: 4 }}>
          {hideAll ? "••••••" : fmt(total)}
        </div>
        <div className="rowflex gap8" style={{ marginTop: 12 }}>
          <Pill tone="muted">{ACCOUNTS.length} cuentas</Pill>
          <span className="muted fs12 fw7 rowflex gap6"><Icon name="trend" size={14} sw={2.4} /> +3.2% este mes</span>
        </div>
      </div>

      {/* account list */}
      <div className="card-h" style={{ padding: "4px 4px 0", marginBottom: 0 }}>
        <h3>Cuentas</h3>
        <span className="lnk" onClick={onAdd}><Icon name="plus" size={15} sw={2.6} /> Nueva</span>
      </div>

      <div className="stack" style={{ gap: 12 }}>
        {ACCOUNTS.map(a => (
          <div key={a.id} className="card" style={{ padding: "14px 15px" }}>
            <div className="rowflex gap12">
              <IconTile icon={a.icon} hue={a.hue} size={46} soft={false} />
              <div className="mid">
                <div className="t1">{a.name}</div>
                <div className="t2">{a.type}</div>
              </div>
              <div className="rowflex gap6">
                <div className="money fw8" style={{ fontSize: 16, color: "var(--text)" }}>
                  {mask(a.id) ? "••••" : fmt(a.balance)}
                </div>
                <button className="iconbtn" style={{ width: 34, height: 34, boxShadow: "none", background: "var(--card-2)" }}
                  onClick={() => setHidden(h => ({ ...h, [a.id]: !h[a.id] }))}>
                  <Icon name={mask(a.id) ? "eyeoff" : "eye"} size={17} />
                </button>
                <button className="iconbtn" style={{ width: 34, height: 34, boxShadow: "none", background: "var(--card-2)" }}
                  onClick={() => setSel(a)}>
                  <Icon name="dots" size={18} />
                </button>
              </div>
            </div>
            {/* share-of-total bar */}
            <div className="bar" style={{ marginTop: 12, height: 6 }}>
              <i style={{ width: (a.balance / total * 100) + "%", background: `oklch(0.62 0.17 ${a.hue})` }} />
            </div>
          </div>
        ))}
      </div>

      {/* manage sheet */}
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? sel.name : ""}>
        {sel && (
          <div>
            <div className="rowflex gap12" style={{ padding: "2px 0 18px" }}>
              <IconTile icon={sel.icon} hue={sel.hue} size={52} soft={false} />
              <div>
                <div className="fw8" style={{ fontSize: 16, color: "var(--text)" }}>{sel.name}</div>
                <div className="t-muted fw7 fs13">{sel.type} · {fmt(sel.balance)}</div>
              </div>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <button className="btn btn-ghost btn-block" style={{ justifyContent: "flex-start" }} onClick={() => setSel(null)}>
                <Icon name="edit" size={19} sw={2.2} /> Editar cuenta</button>
              <button className="btn btn-ghost btn-block" style={{ justifyContent: "flex-start" }} onClick={() => setSel(null)}>
                <Icon name="swap" size={19} sw={2.2} /> Transferir saldo</button>
              <button className="btn btn-ghost btn-block" style={{ justifyContent: "flex-start" }} onClick={() => setSel(null)}>
                <Icon name="grip" size={19} sw={2.2} /> Reordenar</button>
              <button className="btn btn-danger-soft btn-block" style={{ justifyContent: "flex-start" }} onClick={() => setSel(null)}>
                <Icon name="trash" size={19} sw={2.2} /> Eliminar cuenta</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
Object.assign(window, { Accounts });
