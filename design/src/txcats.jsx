/* txcats.jsx — Categorías (income/expense classification for movimientos) list + form.
   Independent from budgets; reuses CAT_HUES / CAT_ICONS and the .cat-* styles from categories.jsx */
const { useState: useStateTc } = React;

function TxCategories({ dark, onEdit, kind, setKind }) {
  const list = txCatsByKind(kind);
  const confirmDel = (c) => {
    const n = txCatUsage(c.id);
    const fallback = txCat(txCatDefault(c.kind)).name;
    askConfirm({
      title: `¿Eliminar la categoría ${c.name}?`,
      message: n ? `${n} ${n === 1 ? "movimiento pasará" : "movimientos pasarán"} a ${fallback}.` : "No hay movimientos con esta categoría.",
      confirmLabel: "Eliminar categoría",
      onConfirm: () => { deleteTxCat(c.id); notifySuccess({ title: "Categoría eliminada", sub: c.name, tone: "expense" }); },
    });
  };
  return (
    <div className="screen-pad screen-anim has-cta">
      <div className="qa-tabs" role="tablist">
        <button role="tab" aria-selected={kind === "expense"} className={kind === "expense" ? "on" : ""} onClick={() => setKind("expense")}
          style={kind === "expense" ? { background: "var(--card)", color: "var(--expense)", boxShadow: "0 2px 8px rgba(20,10,40,.10)" } : null}>
          <Icon name="down" size={17} sw={2.4} /> Gastos
        </button>
        <button role="tab" aria-selected={kind === "income"} className={kind === "income" ? "on" : ""} onClick={() => setKind("income")}
          style={kind === "income" ? { background: "var(--card)", color: "var(--income)", boxShadow: "0 2px 8px rgba(20,10,40,.10)" } : null}>
          <Icon name="up" size={17} sw={2.4} /> Ingresos
        </button>
      </div>
      <div className="card cat-list">
        {list.map(c => {
          const n = txCatUsage(c.id);
          return (
            <div className="cat-item" key={c.id}>
              <div className="row" onClick={() => onEdit(c.id)}>
                <IconTile icon={c.icon} hue={c.hue} dark={dark} />
                <div className="mid">
                  <div className="t1">{c.name}</div>
                  <div className="t2">{n ? `${n} ${n === 1 ? "movimiento" : "movimientos"}` : "Sin movimientos"}{c.locked ? " · Predeterminada" : ""}</div>
                </div>
                {!c.locked && (
                  <button className="cat-del" aria-label={"eliminar " + c.name}
                    onClick={(e) => { e.stopPropagation(); confirmDel(c); }}>
                    <Icon name="trash" size={17} sw={2.2} />
                  </button>
                )}
                <Icon name="chev" size={18} style={{ color: "var(--faint)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TxCategoryForm({ editId, kind, onClose, onSaved, dark }) {
  const base = editId ? txCat(editId) : null;
  const locked = !!(base && base.locked);
  const [name, setName] = useStateTc(base ? base.name : "");
  const [k, setK] = useStateTc(base ? base.kind : (kind || "expense"));
  const [hue, setHue] = useStateTc(base ? base.hue : CAT_HUES[0]);
  const [icon, setIcon] = useStateTc(base ? base.icon : "tag");
  const trimmed = name.trim();
  const dup = TXCATS.some(c => c.kind === k && c.id !== editId && c.name.toLowerCase() === trimmed.toLowerCase());
  const valid = trimmed.length > 0 && !dup;

  const save = () => {
    if (!valid) return;
    const id = upsertTxCat(editId, { name: locked ? base.name : trimmed, icon, hue, kind: k });
    onSaved && onSaved(id);
    onClose();
    notifySuccess({ title: editId ? "Cambios guardados" : "Categoría creada", sub: locked ? base.name : trimmed, tone: k === "income" ? "income" : "primary" });
  };
  const icBg = dark ? `oklch(0.32 0.06 ${hue})` : `oklch(0.95 0.045 ${hue})`;
  const icFg = `oklch(${dark ? 0.8 : 0.5} 0.16 ${hue})`;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="cat-preview">
        <IconTile icon={icon} hue={hue} size={52} dark={dark} />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="t1">{trimmed || "Nueva categoría"}</div>
          <div className="t2">{k === "income" ? "Ingreso" : "Gasto"}</div>
        </div>
      </div>

      <div className="field"><label>Nombre</label>
        <input className="input" placeholder={k === "income" ? "Ej. Freelance" : "Ej. Mascotas"} value={name} disabled={locked} autoFocus={!editId}
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && save()} />
        {dup && <span className="fs12 fw7" style={{ color: "var(--expense)" }}>Ya existe una categoría con ese nombre</span>}
      </div>

      {!editId && (
        <div className="field"><label>Tipo</label>
          <div className="chips">
            <button className={"chip" + (k === "expense" ? " on" : "")} onClick={() => setK("expense")}><Icon name="down" size={15} sw={2.4} /> Gasto</button>
            <button className={"chip" + (k === "income" ? " on" : "")} onClick={() => setK("income")}><Icon name="up" size={15} sw={2.4} /> Ingreso</button>
          </div>
        </div>
      )}

      <div className="field"><label>Color</label>
        <div className="cat-swatches">
          {CAT_HUES.map(h => (
            <button key={h} className={"cat-sw" + (hue === h ? " on" : "")} aria-label={"color " + h}
              style={{ background: `oklch(0.62 0.17 ${h})`, "--sw": `oklch(0.62 0.17 ${h})` }} onClick={() => setHue(h)}>
              {hue === h && <Icon name="check" size={15} sw={3} />}
            </button>
          ))}
        </div>
      </div>

      <div className="field"><label>Ícono</label>
        <div className="cat-icons">
          {CAT_ICONS.map(ic => (
            <button key={ic} className={"cat-ic" + (icon === ic ? " on" : "")} aria-label={ic}
              style={{ "--ic-bg": icBg, "--ic-fg": icFg }} onClick={() => setIcon(ic)}>
              <Icon name={ic} size={20} sw={2} />
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-block btn-lg" disabled={!valid} style={{ opacity: valid ? 1 : .5 }} onClick={save}>
        <Icon name="check" size={20} sw={2.4} /> {editId ? "Guardar cambios" : "Crear categoría"}
      </button>
    </div>
  );
}

Object.assign(window, { TxCategories, TxCategoryForm });
