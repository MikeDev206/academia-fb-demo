/* =========================================================
   Academia FC — Demo estática (sin servidor)
   Datos de ejemplo en memoria. Boceto funcional de propuesta.
   ========================================================= */

// ---------- DATOS DE EJEMPLO ----------
const DB = {
  students: [
    { id: 1, name: "Diego García",   cat: "2016", tutor: "Laura G." },
    { id: 2, name: "Valentina Ruiz", cat: "2014", tutor: "Marco R." },
    { id: 3, name: "Santiago Mora",  cat: "2016", tutor: "Alma M." },
    { id: 4, name: "Regina López",   cat: "2018", tutor: "Iván L." },
    { id: 5, name: "Emiliano Ávila", cat: "2014", tutor: "Paola A." },
    { id: 6, name: "Camila Torres",  cat: "2018", tutor: "Rosa T." },
    { id: 7, name: "Mateo Salinas",  cat: "2016", tutor: "Hugo S." },
    { id: 8, name: "Sofía Beltrán",  cat: "2014", tutor: "Nadia B." }
  ],
  payments: [
    { id: 1, sid: 1, concept: "Mensualidad septiembre", amount: 650,  status: "ok" },
    { id: 2, sid: 2, concept: "Mensualidad septiembre", amount: 650,  status: "pend" },
    { id: 3, sid: 3, concept: "Arbitraje jornada 3",    amount: 120,  status: "venc" },
    { id: 4, sid: 4, concept: "Inscripción 2026",       amount: 1200, status: "ok" },
    { id: 5, sid: 5, concept: "Uniforme de juego",      amount: 850,  status: "pend" },
    { id: 6, sid: 6, concept: "Mensualidad septiembre", amount: 650,  status: "pend" },
    { id: 7, sid: 7, concept: "Mensualidad septiembre", amount: 650,  status: "ok" },
    { id: 8, sid: 8, concept: "Arbitraje jornada 3",    amount: 120,  status: "venc" },
    { id: 9, sid: 1, concept: "Arbitraje jornada 3",    amount: 120,  status: "ok" }
  ],
  matches: [
    { d: "SÁB", n: 5,  rival: "Tigres Ecatepec", time: "9:00 AM",  place: "Cancha La Presa",        cat: "2016" },
    { d: "DOM", n: 13, rival: "Halcones Neza",   time: "10:30 AM", place: "Deportivo Bicentenario", cat: "2014" },
    { d: "SÁB", n: 19, rival: "Real Aragón",     time: "9:00 AM",  place: "Cancha La Presa",        cat: "2018" },
    { d: "DOM", n: 27, rival: "Águilas del Valle", time: "11:00 AM", place: "Cancha La Presa",      cat: "2016" }
  ],
  trainings: [
    { cats: "Cat. 2016 y 2018", sched: "Martes y jueves · 5:00 – 6:30 PM" },
    { cats: "Cat. 2014",        sched: "Lunes y miércoles · 6:30 – 8:00 PM" }
  ],
  attendance: {}, // sid -> true/false
  uniform: { size: "10", requested: false }
};

// asistencia inicial: casi todos presentes
DB.students.forEach(function (s) { DB.attendance[s.id] = s.id !== 2; });

const MONTH_GOAL = 6500; // meta demo para los 8 alumnos visibles

// ---------- ESTADO DE UI ----------
let role = null;          // 'parent' | 'admin'
let tab = "home";

const NAVS = {
  parent: [
    { id: "home",     ic: "🏠", label: "Inicio" },
    { id: "pagos",    ic: "💳", label: "Pagos" },
    { id: "cal",      ic: "📅", label: "Calendario" },
    { id: "unif",     ic: "👕", label: "Uniformes" }
  ],
  admin: [
    { id: "home",     ic: "📊", label: "Tablero" },
    { id: "cobranza", ic: "💳", label: "Cobranza" },
    { id: "asist",    ic: "✅", label: "Asistencia" },
    { id: "cal",      ic: "📅", label: "Calendario" }
  ]
};

// ---------- HELPERS ----------
const $ = function (sel) { return document.querySelector(sel); };
const money = function (n) { return "$" + n.toLocaleString("es-MX"); };
const student = function (sid) { return DB.students.find(function (s) { return s.id === sid; }); };
const chip = function (st) {
  const map = { ok: ["ok", "Pagado"], pend: ["pend", "Pendiente"], venc: ["venc", "Vencido"] };
  return '<span class="chip ' + map[st][0] + '">' + map[st][1] + "</span>";
};

let toastTimer = null;
function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
}

// ---------- SESIÓN ----------
function login(r) {
  role = r; tab = "home";
  $("#view-login").classList.add("hidden");
  $("#view-app").classList.remove("hidden");
  render();
  toast(r === "parent" ? "Sesión demo: Laura (mamá de Diego)" : "Sesión demo: Administrador");
}
function logout() {
  role = null;
  $("#view-app").classList.add("hidden");
  $("#view-login").classList.remove("hidden");
  window.scrollTo(0, 0);
}
function switchRole() {
  login(role === "parent" ? "admin" : "parent");
}

// ---------- RENDER GENERAL ----------
function render() {
  $("#topbar-sub").textContent = role === "parent" ? "Laura · Mamá de Diego (2016)" : "Panel de administración";
  $("#btn-switch").textContent = role === "parent" ? "Cambiar a admin" : "Cambiar a papás";

  const items = NAVS[role];
  if (!items.some(function (i) { return i.id === tab; })) tab = "home";

  $("#nav").innerHTML = items.map(function (i) {
    return '<button class="' + (tab === i.id ? "on" : "") + '" onclick="go(\'' + i.id + '\')">' + i.label + "</button>";
  }).join("");

  $("#tabbar").innerHTML = items.map(function (i) {
    return '<button class="' + (tab === i.id ? "on" : "") + '" onclick="go(\'' + i.id + '\')"><span class="ic">' + i.ic + "</span>" + i.label + "</button>";
  }).join("");

  const views = {
    parent: { home: vParentHome, pagos: vParentPagos, cal: vCalendario, unif: vUniformes },
    admin:  { home: vAdminHome,  cobranza: vCobranza, asist: vAsistencia, cal: vCalendario }
  };
  $("#main").innerHTML = views[role][tab]();
}
function go(t) { tab = t; render(); window.scrollTo(0, 0); }

// ---------- VISTAS: PAPÁS ----------
function nextMatchCard() {
  const m = DB.matches[0];
  return '<div class="match"><div class="lbl">PRÓXIMO PARTIDO</div>' +
    '<div class="vs"><span>Academia FC</span><span class="at">vs</span><span>' + m.rival + "</span></div>" +
    '<div class="meta">' + m.d + " " + m.n + " sep · " + m.time + " · " + m.place + " · Cat. " + m.cat + "</div></div>";
}

function vParentHome() {
  const pago = DB.payments.find(function (p) { return p.sid === 1 && p.concept.indexOf("Mensualidad") === 0; });
  return '<div class="page-head"><h2>Hola, Laura 👋</h2><div class="sub">Todo lo de Diego en un solo lugar</div></div>' +
    '<div class="two-col"><div>' +
    nextMatchCard() +
    '<div class="card"><h3>Mensualidad de septiembre</h3>' +
    '<div class="row"><span class="big">' + money(pago.amount) + "</span>" +
    (pago.status === "ok" ? '<span class="chip ok">Al corriente</span>' : chip(pago.status)) +
    "</div></div>" +
    "</div><div>" +
    '<div class="card"><h3>Entrenamientos de la semana</h3>' +
    '<div class="row"><div class="who"><div class="day">MAR<b>1</b></div><div><div class="nm">Categoría 2016</div><div class="dt">5:00 – 6:30 PM</div></div></div></div>' +
    '<div class="row"><div class="who"><div class="day">JUE<b>3</b></div><div><div class="nm">Categoría 2016</div><div class="dt">5:00 – 6:30 PM</div></div></div></div>' +
    "</div>" +
    '<div class="card"><h3>Avisos</h3>' +
    '<div class="row"><div><div class="nm">Cambio de cancha jornada 4</div><div class="dt">El partido del 27 sep se juega en Cancha La Presa</div></div></div>' +
    '<div class="row"><div><div class="nm">Uniformes 2026</div><div class="dt">Ya puedes solicitar talla desde la sección Uniformes</div></div></div>' +
    "</div></div></div>";
}

function vParentPagos() {
  const mios = DB.payments.filter(function (p) { return p.sid === 1; });
  const rows = mios.map(function (p) {
    return '<div class="row"><div><div class="nm">' + p.concept + '</div><div class="dt">Diego García · Cat. 2016</div></div>' +
      '<div style="text-align:right"><div class="nm">' + money(p.amount) + "</div>" + chip(p.status) + "</div></div>";
  }).join("");
  return '<div class="page-head"><h2>Pagos</h2><div class="sub">Historial y estatus de Diego</div></div>' +
    '<div class="card"><h3>Movimientos</h3>' + rows + "</div>" +
    '<div class="card"><h3>¿Cómo pagar?</h3><div class="dt" style="line-height:1.6">Pagos en efectivo con el coordinador o por transferencia. Una vez registrado por la administración, tu estatus se actualiza aquí automáticamente.</div></div>';
}

function vUniformes() {
  const u = DB.uniform;
  const sizes = ["6", "8", "10", "12", "14"].map(function (s) {
    return '<button class="' + (u.size === s ? "on" : "") + '" onclick="setSize(\'' + s + '\')">' + s + "</button>";
  }).join("");
  return '<div class="page-head"><h2>Uniformes</h2><div class="sub">Solicitud para Diego García</div></div>' +
    '<div class="card"><h3>Uniforme de juego 2026</h3>' +
    '<div class="dt">Jersey + short + calcetas</div>' +
    '<div class="row" style="border:none;padding-top:8px;"><span class="big">$850</span>' +
    (u.requested ? '<span class="chip pend">Por encargar</span>' : '<span class="chip" style="background:#EEF1EC;color:var(--gris)">Sin solicitar</span>') +
    "</div>" +
    "<h3>Talla</h3>" +
    '<div class="size-grid">' + sizes + "</div>" +
    '<button class="btn btn-sm btn-block" style="margin-top:14px;" onclick="requestUniform()">' +
    (u.requested ? "Actualizar solicitud" : "Solicitar uniforme") + "</button></div>" +
    '<div class="card"><h3>Pedidos anteriores</h3>' +
    '<div class="row"><div><div class="nm">Uniforme entrenamiento</div><div class="dt">Talla 10 · Mayo 2026</div></div><span class="chip ok">Entregado</span></div></div>';
}
function setSize(s) { DB.uniform.size = s; render(); }
function requestUniform() {
  DB.uniform.requested = true;
  render();
  toast("Solicitud enviada: talla " + DB.uniform.size + ". La administración la verá al instante.");
}

// ---------- VISTAS: CALENDARIO (ambos roles) ----------
function vCalendario() {
  const rows = DB.matches.map(function (m) {
    return '<div class="row"><div class="who"><div class="day">' + m.d + "<b>" + m.n + "</b></div>" +
      '<div><div class="nm">vs ' + m.rival + '</div><div class="dt">' + m.time + " · " + m.place + " · Cat. " + m.cat + "</div></div></div></div>";
  }).join("");
  const tr = DB.trainings.map(function (t) {
    return '<div class="row"><div><div class="nm">' + t.cats + '</div><div class="dt">' + t.sched + "</div></div></div>";
  }).join("");
  return '<div class="page-head"><h2>Calendario</h2><div class="sub">Partidos de septiembre y entrenamientos fijos</div></div>' +
    '<div class="two-col">' +
    '<div class="card"><h3>Partidos</h3>' + rows + "</div>" +
    '<div class="card"><h3>Entrenamientos fijos</h3>' + tr + "</div>" +
    "</div>";
}

// ---------- VISTAS: ADMIN ----------
function cobranzaTotals() {
  let cobrado = 0, pend = 0, venc = 0, nPend = 0, nVenc = 0;
  DB.payments.forEach(function (p) {
    if (p.status === "ok") cobrado += p.amount;
    else if (p.status === "pend") { pend += p.amount; nPend++; }
    else { venc += p.amount; nVenc++; }
  });
  return { cobrado: cobrado, pend: pend, venc: venc, nPend: nPend, nVenc: nVenc };
}

function vAdminHome() {
  const t = cobrado_pct(cobranzaTotals());
  const presentes = DB.students.filter(function (s) { return DB.attendance[s.id]; }).length;
  const pct = Math.round((presentes / DB.students.length) * 100);
  return '<div class="page-head"><h2>Tablero general</h2><div class="sub">Septiembre 2026 · ' + DB.students.length + " alumnos (demo) · 3 categorías</div></div>" +
    '<div class="stats">' +
    '<div class="stat"><div class="l">Cobrado este mes</div><div class="v">' + money(t.cobrado) + '</div><div class="d up">' + t.pct + "% de " + money(MONTH_GOAL) + "</div></div>" +
    '<div class="stat"><div class="l">Pagos pendientes</div><div class="v">' + t.nPend + '</div><div class="d warn">' + money(t.pend) + " por cobrar</div></div>" +
    '<div class="stat"><div class="l">Pagos vencidos</div><div class="v">' + t.nVenc + '</div><div class="d bad">' + money(t.venc) + " vencidos</div></div>" +
    '<div class="stat"><div class="l">Asistencia de hoy</div><div class="v">' + pct + '%</div><div class="d up">' + presentes + " de " + DB.students.length + " presentes</div></div>" +
    "</div>" +
    '<div class="card"><h3>Avance de cobranza</h3><div class="row" style="border:none;padding:0 0 2px;"><span class="big">' + money(t.cobrado) + '</span><span class="dt">meta ' + money(MONTH_GOAL) + '</span></div><div class="prog"><i style="width:' + t.pct + '%"></i></div></div>' +
    nextMatchCard();
}
function cobrado_pct(t) {
  t.pct = Math.min(100, Math.round((t.cobrado / MONTH_GOAL) * 100));
  return t;
}

let cobFilter = "todos";
function vCobranza() {
  const filters = [["todos", "Todos"], ["pend", "Pendientes"], ["venc", "Vencidos"], ["ok", "Pagados"]];
  const fbtns = filters.map(function (f) {
    return '<button class="' + (cobFilter === f[0] ? "on" : "") + '" onclick="setCobFilter(\'' + f[0] + '\')">' + f[1] + "</button>";
  }).join("");
  const list = DB.payments.filter(function (p) { return cobFilter === "todos" || p.status === cobFilter; });
  const rows = list.map(function (p) {
    const s = student(p.sid);
    const action = p.status === "ok"
      ? '<button class="btn-ghost-dark" onclick="toast(\'Detalle del pago (demo)\')">Ver</button>'
      : '<button class="btn-sm" onclick="registerPay(' + p.id + ')">Registrar pago</button>';
    return "<tr><td>" + s.name + '<span class="sub2">Tutor: ' + s.tutor + "</span></td><td>" + s.cat + "</td><td>" + p.concept + "</td><td>" + money(p.amount) + "</td><td>" + chip(p.status) + "</td><td>" + action + "</td></tr>";
  }).join("");
  const t = cobrado_pct(cobranzaTotals());
  return '<div class="page-head"><h2>Cobranza</h2><div class="sub">Septiembre 2026 · Mensualidades, inscripciones, arbitrajes y uniformes</div></div>' +
    '<div class="card"><h3>Avance del mes</h3><div class="row" style="border:none;padding:0 0 2px;"><span class="big">' + money(t.cobrado) + '</span><span class="dt">de ' + money(MONTH_GOAL) + '</span></div><div class="prog"><i style="width:' + t.pct + '%"></i></div></div>' +
    '<div class="filter-row">' + fbtns + "</div>" +
    '<div class="card table-wrap"><table><tr><th>Alumno</th><th>Cat.</th><th>Concepto</th><th>Monto</th><th>Estatus</th><th></th></tr>' +
    (rows || '<tr><td colspan="6"><div class="empty">Sin movimientos en este filtro</div></td></tr>') +
    "</table></div>";
}
function setCobFilter(f) { cobFilter = f; render(); }
function registerPay(id) {
  const p = DB.payments.find(function (x) { return x.id === id; });
  p.status = "ok";
  render();
  toast("Pago registrado: " + student(p.sid).name + " · " + money(p.amount));
}

function vAsistencia() {
  const presentes = DB.students.filter(function (s) { return DB.attendance[s.id]; }).length;
  const pct = Math.round((presentes / DB.students.length) * 100);
  const rows = DB.students.map(function (s) {
    const ini = s.name.split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2);
    const here = DB.attendance[s.id];
    return '<div class="row"><div class="who"><div class="mini">' + ini + '</div><div><div class="nm">' + s.name + '</div><div class="dt">Cat. ' + s.cat + "</div></div></div>" +
      '<div class="tog">' +
      '<button class="' + (here ? "si" : "") + '" onclick="mark(' + s.id + ',true)">✓</button>' +
      '<button class="' + (!here ? "no" : "") + '" onclick="mark(' + s.id + ',false)">✗</button>' +
      "</div></div>";
  }).join("");
  return '<div class="page-head"><h2>Pase de lista</h2><div class="sub">Mar 1 sep · Entrenamiento · 5:00 PM</div></div>' +
    '<div class="card"><h3>' + presentes + " de " + DB.students.length + ' presentes</h3><div class="prog"><i style="width:' + pct + '%"></i></div></div>' +
    '<div class="card">' + rows + "</div>" +
    '<button class="btn btn-sm btn-block" onclick="toast(\'Asistencia guardada (demo). Queda en el historial del alumno.\')">Guardar asistencia</button>';
}
function mark(sid, val) { DB.attendance[sid] = val; render(); }
