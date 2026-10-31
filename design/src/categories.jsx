/* categories.jsx — "Presupuestos recurrentes" list screen + create/edit/delete form (data model: CATS) */
const { useState: useStateCt } = React;

const CAT_HUES = [293, 250, 210, 180, 158, 120, 70, 30, 12, 330];
const CAT_ICONS = ["cart","fork","car","house","bolt","health","film","piggy","gift","coins","target","star",
  "wallet","card","building","plane","book","shirt","paw","briefcase","phone","dumbbell","tag","up"];

const usageText = (u) => {
  const p = [];
  if (u.tx) p.push(u.tx + (u.tx === 1 ? " movimiento" : " movimientos"));
  if (u.budgets) p.push(u.budgets + (u.budgets === 1 ? " presupuesto" : " presupuestos"));
  return p.length ? p.join(" · ") : "Sin uso";
};

function Categories({ dark, onEdit }) {
  const groups = [["expense", "Registrados"]];
  const confirmDel = (c) => {
    const u = catUsage(c);
    askConfirm({
      title: `¿Eliminar el presupuesto recurrente ${c}?`,
      message: u.tx || u.budgets ? `${usageText(u)} pasarán a Otro.` : "No está en uso por ningún movimiento ni presupuesto.",
      confirmLabel: "Eliminar presupuesto recurrente",
      onConfirm: () => { deleteCat(c); notifySuccess({ title: "Presupuesto recurrente eliminado", sub: c, tone: "expense" }); },
    });
  };
  return (
    <div className="screen-pad screen-anim has-cta">
      {groups.map(([k, l]) => {
        const list = Object.keys(CATS).filter(c => CATS[c].kind === k || (k === "expense" && CATS[c].kind === "both"));
        return (
          <React.Fragment key={k}>
            <div className="card-h" style={{ padding: "4px 4px 0", marginBottom: 0 }}>
              <h3>{l}</h3><span className="fs12 t-faint fw7">{list.length}</span>
            </div>
            <div className="card cat-list">
              {list.map(c => {
                const u = catUsage(c);
                return (
                  <div className="cat-item" key={c}>
                    <div className="row" onClick={() => onEdit(c)}>
                      <IconTile icon={CATS[c].icon} hue={CATS[c].hue} dark={dark} />
                      <div className="mid">
                        <div className="t1">{c}</div>
                        <div className="t2">{usageText(u)}{c === "Otro" ? " · Predeterminada" : ""}</div>
                      </div>
                      {c !== "Otro" && (
                        <button className="cat-del" aria-label={"eliminar " + c}
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
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CategoryForm({ editName, kind, onClose, onSaved, dark }) {
  const base = editName ? CATS[editName] : null;
  const locked = editName === "Otro";
  const [name, setName] = useStateCt(editName || "");
  const k = base ? (base.kind === "both" ? "expense" : base.kind) : (kind || "expense");
  const [hue, setHue] = useStateCt(base ? base.hue : CAT_HUES[0]);
  const [icon, setIcon] = useStateCt(base ? base.icon : "tag");
  const trimmed = name.trim();
  const dup = Object.keys(CATS).some(c => c.toLowerCase() === trimmed.toLowerCase() && c !== editName);
  const valid = trimmed.length > 0 && !dup;

  const save = () => {
    if (!valid) return;
    upsertCat(editName, { name: trimmed, icon, hue, kind: locked ? "both" : k });
    onSaved && onSaved(trimmed);
    onClose();
    notifySuccess({ title: editName ? "Cambios guardados" : "Presupuesto recurrente creado", sub: trimmed });
  };

  const icBg = dark ? `oklch(0.32 0.06 ${hue})` : `oklch(0.95 0.045 ${hue})`;
  const icFg = `oklch(${dark ? 0.8 : 0.5} 0.16 ${hue})`;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="cat-preview">
        <IconTile icon={icon} hue={hue} size={52} dark={dark} />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="t1">{trimmed || "Nuevo presupuesto recurrente"}</div>
        </div>
      </div>

      <div className="field"><label>Nombre</label>
        <input className="input" placeholder="Ej. Mascotas" value={name} disabled={locked} autoFocus={!editName}
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && save()} />
        {dup && <span className="fs12 fw7" style={{ color: "var(--expense)" }}>Ya existe un presupuesto recurrente con ese nombre</span>}
      </div>

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
        <Icon name="check" size={20} sw={2.4} /> {editName ? "Guardar cambios" : "Crear presupuesto recurrente"}
      </button>
    </div>
  );
}

Object.assign(window, { Categories, CategoryForm, CAT_HUES, CAT_ICONS });
