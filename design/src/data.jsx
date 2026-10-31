/* data.jsx — mock data, category map, format helpers */

const fmt = (n, withSign = false) => {
  const neg = n < 0;
  const s = Math.abs(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = withSign ? (neg ? "−" : "+") : (neg ? "−" : "");
  return sign + "$" + s;
};
const fmt0 = (n) => "$" + Math.round(n).toLocaleString("es-MX");

/* category -> icon + hue (oklch hue degrees) */
const CATS = {
  Mercado:      { icon: "cart",   hue: 293, kind: "expense" },
  Renta:        { icon: "house",  hue: 250, kind: "expense" },
  Transporte:   { icon: "car",    hue: 210, kind: "expense" },
  Restaurantes: { icon: "fork",   hue: 30,  kind: "expense" },
  Ocio:         { icon: "film",   hue: 330, kind: "expense" },
  Ahorro:       { icon: "piggy",  hue: 158, kind: "expense" },
  Salud:        { icon: "health", hue: 12,  kind: "expense" },
  Servicios:    { icon: "bolt",   hue: 70,  kind: "expense" },
  Ingreso:      { icon: "up",     hue: 158, kind: "income" },
  Otro:         { icon: "star",   hue: 280, kind: "both" },
};

/* category store — CRUD + persistence; CATS is mutated in place so every reader stays current */
const CAT_LS = "oink.cats.v1";
try { const s = JSON.parse(localStorage.getItem(CAT_LS)); if (s && s.Otro) { for (const k in CATS) delete CATS[k]; Object.assign(CATS, s); } } catch (e) {}
const catSubs = new Set();
const catHue = (c) => (CATS[c] || CATS.Otro).hue;
const catsByKind = (kind) => Object.keys(CATS).filter(c => CATS[c].kind === kind || CATS[c].kind === "both");
const catUsage = (name) => ({ tx: TX.filter(t => t.cat === name).length, budgets: BUDGETS.filter(b => b.cat === name).length });
const saveCats = () => {
  const otro = CATS.Otro; delete CATS.Otro; CATS.Otro = otro;
  try { localStorage.setItem(CAT_LS, JSON.stringify(CATS)); } catch (e) {}
  catSubs.forEach(f => f());
};
const remapCat = (from, to) => {
  TX.forEach(t => { if (t.cat === from) t.cat = to; });
  BUDGETS.forEach(b => { if (b.cat === from) { if (b.name === from) b.name = to; b.cat = to; } });
};
const upsertCat = (oldName, { name, icon, hue, kind }) => {
  if (oldName && oldName !== name) {
    const entries = Object.entries(CATS);
    for (const k in CATS) delete CATS[k];
    entries.forEach(([k, v]) => { CATS[k === oldName ? name : k] = k === oldName ? { icon, hue, kind } : v; });
    remapCat(oldName, name);
  } else CATS[name] = { icon, hue, kind };
  saveCats();
};
const deleteCat = (name) => { if (name === "Otro" || !CATS[name]) return; delete CATS[name]; remapCat(name, "Otro"); saveCats(); };
const useCatsVersion = () => {
  const [, set] = React.useState(0);
  React.useEffect(() => { const f = () => set(v => v + 1); catSubs.add(f); return () => catSubs.delete(f); }, []);
};
const catColor = (cat, l = 0.62, c = 0.16) => `oklch(${l} ${c} ${(CATS[cat] || CATS.Otro).hue})`;
const catSoft  = (cat) => `oklch(0.95 0.045 ${(CATS[cat] || CATS.Otro).hue})`;
const catSoftDk= (cat) => `oklch(0.32 0.06 ${(CATS[cat] || CATS.Otro).hue})`;
const catIcon  = (cat) => (CATS[cat] || CATS.Otro).icon;

const ACCOUNTS = [
  { id: "a1", name: "BBVA",     type: "Banco",   icon: "building", balance: 8560.00, hue: 210, hidden: false },
  { id: "a2", name: "Efectivo", type: "Cartera", icon: "wallet",   balance: 1240.00, hue: 30,  hidden: false },
  { id: "a3", name: "Nu",       type: "Tarjeta", icon: "card",     balance: 2310.00, hue: 293, hidden: false },
  { id: "a4", name: "Ahorros",  type: "Inversión", icon: "piggy",  balance: 4500.00, hue: 158, hidden: false },
];

const BUDGETS = [
  { id: "b1", name: "Mercado",      cat: "Mercado",      max: 5000, spent: 3240 },
  { id: "b2", name: "Renta",        cat: "Renta",        max: 6000, spent: 6000 },
  { id: "b3", name: "Restaurantes", cat: "Restaurantes", max: 1500, spent: 980  },
  { id: "b4", name: "Transporte",   cat: "Transporte",   max: 1200, spent: 640  },
  { id: "b5", name: "Ahorro",       cat: "Ahorro",       max: 3000, spent: 3000 },
  { id: "b6", name: "Ocio",         cat: "Ocio",         max: 800,  spent: 520  },
];

/* transactions — grouped chronologically (newest first) */
const TX = [
  { id: "t1", desc: "Chicles",        cat: "Mercado",      acct: "BBVA",     amt: -36,    date: "2026-06-04", time: "13:25", min: 805 },
  { id: "t2", desc: "Uber al centro", cat: "Transporte",   acct: "Efectivo", amt: -180,   date: "2026-06-04", time: "11:40", min: 700 },
  { id: "t3", desc: "Café",           cat: "Restaurantes", acct: "Nu",       amt: -68,    date: "2026-06-04", time: "09:15", min: 555 },
  { id: "t4", desc: "Nómina",         cat: "Ingreso",      acct: "BBVA",     amt: 5000,   date: "2026-06-04", time: "08:00", min: 480 },
  { id: "t5", desc: "Súper semanal",  cat: "Mercado",      acct: "BBVA",     amt: -842,   date: "2026-06-03", time: "19:30", min: 1170 },
  { id: "t6", desc: "Cena familiar",  cat: "Restaurantes", acct: "Nu",       amt: -540,   date: "2026-06-03", time: "21:10", min: 1270 },
  { id: "t7", desc: "Cine",           cat: "Ocio",         acct: "Efectivo", amt: -220,   date: "2026-06-03", time: "17:00", min: 1020 },
  { id: "t8", desc: "Gasolina",       cat: "Transporte",   acct: "BBVA",     amt: -680,   date: "2026-06-02", time: "08:45", min: 525 },
  { id: "t9", desc: "Farmacia",       cat: "Salud",        acct: "Nu",       amt: -315,   date: "2026-06-02", time: "12:20", min: 740 },
  { id: "t10",desc: "Venta de bici",  cat: "Otro",         acct: "Efectivo", amt: 1200,   date: "2026-06-01", time: "16:00", min: 960 },
  { id: "t11",desc: "Internet",       cat: "Servicios",    acct: "BBVA",     amt: -499,   date: "2026-06-01", time: "10:00", min: 600 },
  { id: "t12",desc: "Despensa",       cat: "Mercado",      acct: "BBVA",     amt: -1260,  date: "2026-05-31", time: "18:20", min: 1100 },
];

/* Categorías — income/expense classification for movimientos (independent from budgets / CATS) */
const TXCATS = [
  { id: "ce1", name: "Supermercado",    kind: "expense", icon: "cart",      hue: 293 },
  { id: "ce2", name: "Comida",          kind: "expense", icon: "fork",      hue: 30  },
  { id: "ce3", name: "Transporte",      kind: "expense", icon: "car",       hue: 210 },
  { id: "ce4", name: "Hogar",           kind: "expense", icon: "house",     hue: 250 },
  { id: "ce5", name: "Entretenimiento", kind: "expense", icon: "film",      hue: 330 },
  { id: "ce6", name: "Salud",           kind: "expense", icon: "health",    hue: 12  },
  { id: "ce7", name: "Servicios",       kind: "expense", icon: "bolt",      hue: 70  },
  { id: "ce0", name: "Otros gastos",    kind: "expense", icon: "star",      hue: 280, locked: true },
  { id: "ci1", name: "Salario",         kind: "income",  icon: "briefcase", hue: 158 },
  { id: "ci2", name: "Ventas",          kind: "income",  icon: "coins",     hue: 120 },
  { id: "ci0", name: "Otros ingresos",  kind: "income",  icon: "star",      hue: 180, locked: true },
];
const TXCAT_LS = "oink.txcats.v1";
try { const s = JSON.parse(localStorage.getItem(TXCAT_LS)); if (Array.isArray(s) && s.some(c => c.id === "ce0") && s.some(c => c.id === "ci0")) TXCATS.splice(0, TXCATS.length, ...s); } catch (e) {}
const TX_TCAT = { t1: "ce1", t2: "ce3", t3: "ce2", t4: "ci1", t5: "ce1", t6: "ce2", t7: "ce5", t8: "ce3", t9: "ce6", t10: "ci2", t11: "ce7", t12: "ce1" };
TX.forEach(t => { t.tcat = TX_TCAT[t.id] || (t.amt > 0 ? "ci0" : "ce0"); });
try { const w = JSON.parse(localStorage.getItem("oink.wizard.income-tx")); if (w && !TX.some(t => t.id === w.id)) TX.unshift(w); } catch (e) {}
const txCatSubs = new Set();
const txCatDefault = (kind) => kind === "income" ? "ci0" : "ce0";
const txCat = (id) => TXCATS.find(c => c.id === id) || TXCATS.find(c => c.id === "ce0");
const txCatsByKind = (kind) => {
  const l = TXCATS.filter(c => c.kind === kind);
  return [...l.filter(c => !c.locked), ...l.filter(c => c.locked)];
};
const txCatUsage = (id) => TX.filter(t => t.tcat === id).length;
const saveTxCats = () => { try { localStorage.setItem(TXCAT_LS, JSON.stringify(TXCATS)); } catch (e) {} txCatSubs.forEach(f => f()); };
const upsertTxCat = (id, data) => {
  const i = id ? TXCATS.findIndex(c => c.id === id) : -1;
  if (i > -1) { TXCATS[i] = { ...TXCATS[i], ...data, kind: TXCATS[i].kind }; saveTxCats(); return id; }
  const nid = "c" + Date.now().toString(36);
  TXCATS.push({ id: nid, ...data }); saveTxCats(); return nid;
};
const deleteTxCat = (id) => {
  const c = TXCATS.find(x => x.id === id); if (!c || c.locked) return;
  TXCATS.splice(TXCATS.indexOf(c), 1);
  TX.forEach(t => { if (t.tcat === id) t.tcat = txCatDefault(c.kind); });
  saveTxCats();
};
const useTxCatsVersion = () => {
  const [, set] = React.useState(0);
  React.useEffect(() => { const f = () => set(v => v + 1); txCatSubs.add(f); return () => txCatSubs.delete(f); }, []);
};

const DAY_LABELS = {
  "2026-06-04": "Hoy",
  "2026-06-03": "Ayer",
  "2026-06-02": "Mar 2 jun",
  "2026-06-01": "Lun 1 jun",
  "2026-05-31": "Dom 31 may",
};

/* last 7 days spend totals for trend chart */
const TREND = [
  { d: "J", v: 0 },     // upcoming/empty look handled in chart
  { d: "V", v: 0 },
  { d: "S", v: 1602 },
  { d: "D", v: 980 },
  { d: "L", v: 1758 },
  { d: "M", v: 995 },
  { d: "M", v: 284 },   // today so far
];

const todaySpent = 284;       // gastado hoy
const dailyLimit = 782.81;    // límite total de presupuestos (per day)

Object.assign(window, {
  fmt, fmt0, CATS, catColor, catSoft, catSoftDk, catIcon, catHue, catsByKind, catUsage, upsertCat, deleteCat, useCatsVersion,
  TXCATS, txCat, txCatsByKind, txCatUsage, txCatDefault, upsertTxCat, deleteTxCat, useTxCatsVersion,
  ACCOUNTS, BUDGETS, TX, DAY_LABELS, TREND, todaySpent, dailyLimit
});
