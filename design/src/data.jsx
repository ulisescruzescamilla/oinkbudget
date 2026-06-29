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
  Mercado:      { icon: "cart",   hue: 293 },
  Renta:        { icon: "house",  hue: 250 },
  Transporte:   { icon: "car",    hue: 210 },
  Restaurantes: { icon: "fork",   hue: 30  },
  Ocio:         { icon: "film",   hue: 330 },
  Ahorro:       { icon: "piggy",  hue: 158 },
  Salud:        { icon: "health", hue: 12  },
  Servicios:    { icon: "bolt",   hue: 70  },
  Ingreso:      { icon: "up",     hue: 158 },
  Otro:         { icon: "star",   hue: 280 },
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
  fmt, fmt0, CATS, catColor, catSoft, catSoftDk, catIcon,
  ACCOUNTS, BUDGETS, TX, DAY_LABELS, TREND, todaySpent, dailyLimit
});
