/* picker.jsx — compact selector: shows the 2 most recent options + a search-icon ("Ver todas") pill that opens a searchable sheet.
   <PillPicker label items=[{id,name,icon,sub?}] value onChange recentKey onNew? none?="Sin presupuesto" /> */
const { useState: useStatePP, useRef: useRefPP } = React;

const PP_LS = "oink.recent.v1";
const ppRead = (k) => { try { return (JSON.parse(localStorage.getItem(PP_LS)) || {})[k] || []; } catch (e) { return []; } };
const ppPush = (k, id) => {
  try {
    const all = JSON.parse(localStorage.getItem(PP_LS)) || {};
    all[k] = [id, ...(all[k] || []).filter(x => x !== id)].slice(0, 6);
    localStorage.setItem(PP_LS, JSON.stringify(all));
  } catch (e) {}
};

function PillPicker({ label, items, value, onChange, recentKey, onNew, newLabel = "Nueva", none }) {
  const [open, setOpen] = useStatePP(false);
  const [q, setQ] = useStatePP("");
  const [recent, setRecent] = useStatePP(() => ppRead(recentKey));
  const root = useRefPP(null);
  const searchRef = useRefPP(null);
  React.useEffect(() => { if (open && searchRef.current) searchRef.current.focus({ preventScroll: true }); }, [open]);
  const NONE = "__none";
  const all = none ? [{ id: NONE, name: none, icon: "close" }, ...items] : items;
  const val = value == null ? NONE : value;
  const byId = (id) => all.find(i => i.id === id);

  const order = [...recent, ...items.map(i => i.id)].filter((id, i, a) => a.indexOf(id) === i && byId(id));
  const visible = (val !== NONE && byId(val) ? [val, ...order.filter(id => id !== val)] : order).slice(0, none && val === NONE ? 1 : 2);
  const hidden = items.length - visible.length;

  const pick = (id, fromSheet) => {
    onChange(id === NONE ? null : id);
    if (id !== NONE) { ppPush(recentKey, id); if (fromSheet) setRecent(ppRead(recentKey)); }
    if (fromSheet) { setOpen(false); setQ(""); }
  };

  const list = all.filter(i => !q || i.name.toLowerCase().includes(q.toLowerCase()));
  const host = root.current && (root.current.closest(".phone") || document.body);

  return (
    <div className="field" ref={root}>
      <label>{label}</label>
      <div className="chips pp-row">
        {none && val === NONE && <button className="chip on" onClick={() => setOpen(true)}>{none}</button>}
        {visible.map(id => { const it = byId(id); return (
          <button key={id} className={"chip" + (val === id ? " on" : "")} onClick={() => pick(id)}>
            <Icon name={it.icon} size={15} sw={2.2} /> {it.name}
          </button>); })}
        <button className="chip chip-new pp-more" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Ver todas" title="Ver todas">
          <Icon name="search" size={15} sw={2.3} />{hidden > 0 && ` +${hidden}`}
        </button>
      </div>
      {open && host && ReactDOM.createPortal(
        <Sheet open onClose={() => { setOpen(false); setQ(""); }} title={label}>
          {all.length > 6 && <input className="input pp-search" placeholder="Buscar…" value={q} ref={searchRef} onChange={e => setQ(e.target.value)} />}
          <div className="pp-list">
            {list.map(it => (
              <button key={it.id} className={"pp-item" + (val === it.id ? " on" : "")} onClick={() => pick(it.id, true)}>
                <span className="pp-ic"><Icon name={it.icon} size={18} sw={2.1} /></span>
                <span className="pp-mid"><span className="pp-t">{it.name}</span>{it.sub && <span className="pp-s">{it.sub}</span>}</span>
                {val === it.id && <Icon name="check" size={18} sw={2.6} />}
              </button>
            ))}
            {!list.length && <div className="pp-empty">Sin resultados</div>}
          </div>
          {onNew && <button className="btn btn-text btn-block" onClick={() => { setOpen(false); setQ(""); onNew((id) => pick(id, false)); }}>
            <Icon name="plus" size={17} sw={2.4} /> {newLabel}</button>}
        </Sheet>, host)}
    </div>
  );
}
Object.assign(window, { PillPicker });
