/* == Orezco - CRM ===============================================
   Aplicacion de una sola pagina, sin dependencias ni compilacion.
   Los datos viven en localStorage, en este navegador y solo aqui:
   por eso Ajustes insiste en la copia de seguridad.
   =============================================================== */
(function () {
'use strict';

/* -- Constantes ------------------------------------------------ */

var LLAVE = 'orezco.crm.v1';

var ETAPAS = [
  { id: 'contacto',    n: 'Contacto inicial', c: '#93b799' },
  { id: 'cualificada', n: 'Cualificada',      c: '#7aa8c9' },
  { id: 'propuesta',   n: 'Propuesta',        c: '#c9a86a' },
  { id: 'negociacion', n: 'Negociación',      c: '#c98b6a' },
  { id: 'ganada',      n: 'Ganada',           c: '#2bee4b' },
  { id: 'perdida',     n: 'Perdida',          c: '#9c2c2c' }
];
var ABIERTAS = ['contacto', 'cualificada', 'propuesta', 'negociacion'];

var ESTADOS = [
  { id: 'lead',     n: 'Posible cliente' },
  { id: 'cliente',  n: 'Cliente' },
  { id: 'inactivo', n: 'Inactivo' }
];

var TIPOS_TAREA = [
  { id: 'llamada', n: 'Llamada' },
  { id: 'email',   n: 'Email' },
  { id: 'reunion', n: 'Reunión' },
  { id: 'tarea',   n: 'Tarea' }
];

/* -- Utilidades ------------------------------------------------ */

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

/* Todo lo que escribe el usuario pasa por aqui antes de llegar al
   HTML. Sin esto, un nombre de empresa con etiquetas seria XSS. */
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function id() {
  return 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

var fmtEuro = new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0
});
function euros(n) { return fmtEuro.format(Number(n) || 0); }

function hoy() {
  var d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
function pad(n) { return n < 10 ? '0' + n : String(n); }

function fechaCorta(iso) {
  if (!iso) return '';
  var p = String(iso).slice(0, 10).split('-');
  if (p.length !== 3) return '';
  var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return Number(p[2]) + ' ' + meses[Number(p[1]) - 1] + ' ' + p[0];
}

/* Dias que faltan (negativo = vencido). Se compara en texto ISO
   para no arrastrar la hora ni la zona horaria. */
function diasHasta(iso) {
  if (!iso) return null;
  var a = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  var b = new Date(hoy() + 'T00:00:00');
  if (isNaN(a)) return null;
  return Math.round((a - b) / 86400000);
}

function venceTexto(iso) {
  var d = diasHasta(iso);
  if (d === null) return '';
  if (d < -1) return 'Vencida hace ' + Math.abs(d) + ' días';
  if (d === -1) return 'Venció ayer';
  if (d === 0) return 'Vence hoy';
  if (d === 1) return 'Vence mañana';
  if (d <= 7) return 'En ' + d + ' días';
  return fechaCorta(iso);
}

function iniciales(nombre) {
  var p = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '??';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

function etapa(eid) {
  for (var i = 0; i < ETAPAS.length; i++) if (ETAPAS[i].id === eid) return ETAPAS[i];
  return ETAPAS[0];
}
function nombreEstado(e) {
  for (var i = 0; i < ESTADOS.length; i++) if (ESTADOS[i].id === e) return ESTADOS[i].n;
  return 'Posible cliente';
}
function nombreTipo(t) {
  for (var i = 0; i < TIPOS_TAREA.length; i++) if (TIPOS_TAREA[i].id === t) return TIPOS_TAREA[i].n;
  return 'Tarea';
}

/* -- Almacen --------------------------------------------------- */

var VACIO = { v: 1, empresas: [], contactos: [], oportunidades: [], tareas: [], actividad: [] };
var datos = cargar();

function cargar() {
  try {
    var txt = localStorage.getItem(LLAVE);
    if (!txt) return JSON.parse(JSON.stringify(VACIO));
    var d = JSON.parse(txt);
    return normaliza(d);
  } catch (e) {
    console.warn('No se pudieron leer los datos guardados:', e);
    return JSON.parse(JSON.stringify(VACIO));
  }
}

/* Un fichero importado a mano puede venir incompleto. Antes de
   usarlo se rellenan los huecos, para que ninguna vista reviente
   por un array que no existe. */
function normaliza(d) {
  var base = JSON.parse(JSON.stringify(VACIO));
  if (!d || typeof d !== 'object') return base;
  ['empresas', 'contactos', 'oportunidades', 'tareas', 'actividad'].forEach(function (k) {
    if (Array.isArray(d[k])) base[k] = d[k].filter(function (x) { return x && typeof x === 'object'; });
  });
  base.empresas.forEach(function (e) { if (!e.id) e.id = id(); });
  base.contactos.forEach(function (c) { if (!c.id) c.id = id(); });
  base.tareas.forEach(function (t) { if (!t.id) t.id = id(); });
  base.oportunidades.forEach(function (o) {
    if (!o.id) o.id = id();
    if (!etapaValida(o.etapa)) o.etapa = 'contacto';
    o.valor = Number(o.valor) || 0;
  });
  return base;
}
function etapaValida(e) {
  for (var i = 0; i < ETAPAS.length; i++) if (ETAPAS[i].id === e) return true;
  return false;
}

var avisoLleno = false;
function guardar() {
  try {
    localStorage.setItem(LLAVE, JSON.stringify(datos));
  } catch (e) {
    if (!avisoLleno) {
      avisoLleno = true;
      aviso('No se ha podido guardar: el almacen del navegador esta lleno. Exporta una copia desde Ajustes.');
    }
  }
}

function registra(texto, ref) {
  datos.actividad.unshift({ id: id(), fecha: new Date().toISOString(), texto: texto, ref: ref || null });
  if (datos.actividad.length > 200) datos.actividad.length = 200;
}

/* -- Consultas ------------------------------------------------- */

function empresa(eid) {
  for (var i = 0; i < datos.empresas.length; i++) if (datos.empresas[i].id === eid) return datos.empresas[i];
  return null;
}
function nombreEmpresa(eid) {
  var e = empresa(eid);
  return e ? e.nombre : '';
}
function oportunidad(oid) {
  for (var i = 0; i < datos.oportunidades.length; i++) if (datos.oportunidades[i].id === oid) return datos.oportunidades[i];
  return null;
}
function contacto(cid) {
  for (var i = 0; i < datos.contactos.length; i++) if (datos.contactos[i].id === cid) return datos.contactos[i];
  return null;
}
function tarea(tid) {
  for (var i = 0; i < datos.tareas.length; i++) if (datos.tareas[i].id === tid) return datos.tareas[i];
  return null;
}
function abiertas() {
  return datos.oportunidades.filter(function (o) { return ABIERTAS.indexOf(o.etapa) >= 0; });
}
function pendientes() {
  return datos.tareas.filter(function (t) { return !t.hecha; });
}
function vencidas() {
  return pendientes().filter(function (t) {
    var d = diasHasta(t.vence);
    return d !== null && d < 0;
  });
}

/* -- Aviso ----------------------------------------------------- */

var avisoTmr = null;
function aviso(texto, accion, alPulsar) {
  var caja = $('#aviso');
  caja.innerHTML = '<span>' + esc(texto) + '</span>' +
    (accion ? '<button type="button" id="avisoAcc">' + esc(accion) + '</button>' : '');
  caja.hidden = false;
  if (accion) {
    $('#avisoAcc').onclick = function () { caja.hidden = true; if (alPulsar) alPulsar(); };
  }
  clearTimeout(avisoTmr);
  avisoTmr = setTimeout(function () { caja.hidden = true; }, accion ? 8000 : 3600);
}

/* -- Vistas ---------------------------------------------------- */

var vistaActual = 'panel';
var filtroEmpresas = 'todas';
var filtroTareas = 'pendientes';

var VISTAS = ['panel', 'embudo', 'empresas', 'contactos', 'tareas', 'ajustes'];

function ir(v, sinHistoria) {
  if (VISTAS.indexOf(v) < 0) v = 'panel';
  vistaActual = v;
  $$('.nav-i').forEach(function (b) {
    if (b.dataset.vista === v) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  /* La vista va en el ancla: asi el boton atras del navegador
     funciona y se puede enlazar directamente a una pantalla. */
  if (!sinHistoria && location.hash.slice(1) !== v) location.hash = v;
  cerrarMenuMovil();
  cierraFicha(); /* si no, la ficha se queda abierta con un registro de la vista anterior */
  pinta();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', function () {
  var v = location.hash.slice(1);
  if (v && v !== vistaActual) ir(v, true);
});

function pinta() {
  var c = $('#vistas');
  if (vistaActual === 'panel') c.innerHTML = vistaPanel();
  else if (vistaActual === 'embudo') c.innerHTML = vistaEmbudo();
  else if (vistaActual === 'empresas') c.innerHTML = vistaEmpresas();
  else if (vistaActual === 'contactos') c.innerHTML = vistaContactos();
  else if (vistaActual === 'tareas') c.innerHTML = vistaTareas();
  else if (vistaActual === 'ajustes') c.innerHTML = vistaAjustes();
  contadores();
  if (vistaActual === 'embudo') enganchaArrastre();
}

function contadores() {
  function pon(k, n, urgente) {
    var e = $('.nav-n[data-cuenta="' + k + '"]');
    if (!e) return;
    e.textContent = n > 0 ? String(n) : '';
    if (urgente) e.dataset.urgente = 'si'; else e.removeAttribute('data-urgente');
  }
  pon('empresas', datos.empresas.length);
  pon('contactos', datos.contactos.length);
  pon('oportunidades', abiertas().length);
  var v = vencidas().length;
  pon('tareas', pendientes().length, v > 0);
}

/* -- Panel ----------------------------------------------------- */

function vistaPanel() {
  var ab = abiertas();
  var pipeline = ab.reduce(function (s, o) { return s + (Number(o.valor) || 0); }, 0);
  var venc = vencidas().length;
  var mes = hoy().slice(0, 7);
  var ganadasMes = datos.oportunidades.filter(function (o) {
    return o.etapa === 'ganada' && String(o.cerrado || '').slice(0, 7) === mes;
  });
  var ganadoMes = ganadasMes.reduce(function (s, o) { return s + (Number(o.valor) || 0); }, 0);

  var todoVacio = !datos.empresas.length && !datos.oportunidades.length && !datos.tareas.length;
  if (todoVacio) return panelVacio();

  var h = '<div class="vista">' +
    '<div class="vista-cab"><div>' +
      '<h1 class="vista-t">Panel</h1>' +
      '<p class="vista-sub">' + esc(fechaCorta(hoy())) + '</p>' +
    '</div></div>' +
    '<div class="kpis">' +
      kpi('En el embudo', euros(pipeline), ab.length + (ab.length === 1 ? ' oportunidad abierta' : ' oportunidades abiertas')) +
      kpi('Ganado este mes', euros(ganadoMes), ganadasMes.length + (ganadasMes.length === 1 ? ' operacion cerrada' : ' operaciones cerradas')) +
      kpi('Tareas pendientes', String(pendientes().length), venc > 0 ? venc + (venc === 1 ? ' vencida' : ' vencidas') : 'ninguna vencida', venc > 0) +
      kpi('Empresas', String(datos.empresas.length), datos.contactos.length + (datos.contactos.length === 1 ? ' contacto' : ' contactos')) +
    '</div>' +
    '<div class="rejilla">' +
      cajaTareas() +
      cajaActividad() +
    '</div>' +
  '</div>';
  return h;
}

function kpi(etiqueta, num, pie, alerta) {
  return '<div class="kpi">' +
    '<span class="etiq">' + esc(etiqueta) + '</span>' +
    '<p class="kpi-n' + (alerta ? ' es-alerta' : '') + '">' + esc(num) + '</p>' +
    '<p class="kpi-pie">' + esc(pie) + '</p>' +
  '</div>';
}

function panelVacio() {
  return '<div class="vista"><div class="caja"><div class="vacio">' +
    '<svg viewBox="0 0 24 24"><path d="M3 20V9.5a1.5 1.5 0 0 1 .7-1.3l7.5-4.6a1.5 1.5 0 0 1 1.6 0l7.5 4.6a1.5 1.5 0 0 1 .7 1.3V20"/><path d="M2 20h20"/><path d="M9 20v-5h6v5"/></svg>' +
    '<p class="vacio-t">Aún no hay nada dentro</p>' +
    '<p class="vacio-p">Orezco empieza vacío a propósito: no trae clientes de ejemplo que luego haya que ir borrando. Crea la primera empresa y el resto cuelga de ahí.</p>' +
    '<div class="vacio-acc">' +
      '<button class="btn btn-verde" data-nuevo="empresa"><svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg><span>Nueva empresa</span></button>' +
      '<button class="btn btn-linea" data-ir="ajustes">Importar datos</button>' +
    '</div>' +
  '</div></div></div>';
}

function cajaTareas() {
  var lista = pendientes().slice().sort(function (a, b) {
    return String(a.vence || '9999').localeCompare(String(b.vence || '9999'));
  }).slice(0, 8);

  var cuerpo;
  if (!lista.length) {
    cuerpo = '<div class="vacio vacio-sm">' +
      '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>' +
      '<p class="vacio-t">Nada pendiente</p>' +
      '<p class="vacio-p">Cuando anotes una llamada o un seguimiento, aparecerá aquí ordenado por fecha.</p>' +
    '</div>';
  } else {
    cuerpo = lista.map(filaTarea).join('');
  }

  return '<div class="caja"><div class="caja-cab">' +
      '<h2 class="caja-t">Lo siguiente</h2>' +
      '<button class="btn btn-plano btn-sm" data-nuevo="tarea">Añadir</button>' +
    '</div><div class="caja-cuerpo">' + cuerpo + '</div></div>';
}

function filaTarea(t) {
  var d = diasHasta(t.vence);
  var urge = d !== null && d <= 0 && !t.hecha;
  var ctx = t.empresaId ? nombreEmpresa(t.empresaId) : '';
  return '<div class="fila' + (t.hecha ? ' hecha' : '') + '">' +
    '<button class="marcar" data-hecha="' + esc(t.id) + '" aria-pressed="' + (t.hecha ? 'true' : 'false') +
      '" aria-label="Marcar como hecha"><svg viewBox="0 0 16 16"><path d="m3 8.5 3.2 3.2L13 5"/></svg></button>' +
    '<button class="fila-cuerpo" data-ficha="tarea" data-id="' + esc(t.id) + '">' +
      '<p class="fila-t">' + esc(t.titulo) + '</p>' +
      '<p class="fila-s">' + esc(nombreTipo(t.tipo)) + (ctx ? ' &middot; ' + esc(ctx) : '') + '</p>' +
    '</button>' +
    (t.vence ? '<span class="pill' + (urge ? ' pill-vence' : '') + '">' + esc(venceTexto(t.vence)) + '</span>' : '') +
  '</div>';
}

function cajaActividad() {
  var cuerpo;
  if (!datos.actividad.length) {
    cuerpo = '<div class="vacio vacio-sm">' +
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' +
      '<p class="vacio-t">Sin movimiento</p>' +
      '<p class="vacio-p">Aquí se apunta solo lo que hagas tú: altas, cambios de etapa y cierres.</p>' +
    '</div>';
  } else {
    cuerpo = datos.actividad.slice(0, 9).map(function (a) {
      return '<div class="fila"><div class="fila-cuerpo">' +
        '<p class="fila-t">' + esc(a.texto) + '</p>' +
        '<p class="fila-s">' + esc(fechaCorta(a.fecha)) + '</p>' +
      '</div></div>';
    }).join('');
  }
  return '<div class="caja"><div class="caja-cab"><h2 class="caja-t">Actividad</h2></div>' +
    '<div class="caja-cuerpo">' + cuerpo + '</div></div>';
}

/* -- Embudo ---------------------------------------------------- */

function vistaEmbudo() {
  var h = '<div class="vista">' +
    '<div class="vista-cab"><div>' +
      '<h1 class="vista-t">Embudo</h1>' +
      '<p class="vista-sub">' + esc(euros(abiertas().reduce(function (s, o) { return s + (Number(o.valor) || 0); }, 0))) +
        ' repartidos en ' + abiertas().length + (abiertas().length === 1 ? ' oportunidad abierta' : ' oportunidades abiertas') + '</p>' +
    '</div><div class="vista-acc">' +
      '<button class="btn btn-linea btn-sm" data-nuevo="oportunidad">Nueva oportunidad</button>' +
    '</div></div>';

  if (!datos.oportunidades.length) {
    h += '<div class="caja"><div class="vacio">' +
      '<svg viewBox="0 0 24 24"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>' +
      '<p class="vacio-t">El embudo está vacío</p>' +
      '<p class="vacio-p">Una oportunidad es una venta concreta que persigues: a quién, por cuánto y en qué punto está. Arrastra la tarjeta entre columnas según avance.</p>' +
      '<div class="vacio-acc"><button class="btn btn-verde" data-nuevo="oportunidad">' +
        '<svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg><span>Nueva oportunidad</span></button></div>' +
    '</div></div></div>';
    return h;
  }

  h += '<div class="embudo">';
  ETAPAS.forEach(function (et) {
    var ops = datos.oportunidades.filter(function (o) { return o.etapa === et.id; });
    var total = ops.reduce(function (s, o) { return s + (Number(o.valor) || 0); }, 0);
    h += '<section class="col" data-etapa="' + esc(et.id) + '">' +
      '<div class="col-cab">' +
        '<span class="col-p" style="background:' + esc(et.c) + '"></span>' +
        '<h2 class="col-t">' + esc(et.n) + '</h2>' +
        '<span class="col-n">' + ops.length + '</span>' +
      '</div>' +
      '<p class="col-v">' + esc(euros(total)) + '</p>' +
      '<div class="col-lista" data-soltar="' + esc(et.id) + '">' +
        (ops.length ? ops.map(tarjeta).join('') : '<p class="col-vacia">Suelta aquí</p>') +
      '</div>' +
    '</section>';
  });
  h += '</div></div>';
  return h;
}

function tarjeta(o) {
  var emp = nombreEmpresa(o.empresaId);
  /* data-ficha ademas de data-op: arrastrar no puede ser la unica
     forma de abrir una tarjeta, lo primero que hace cualquiera es
     pulsarla. */
  return '<article class="tj" draggable="true" data-op="' + esc(o.id) + '"' +
    ' data-ficha="oportunidad" data-id="' + esc(o.id) + '" tabindex="0" role="button">' +
    '<p class="tj-t">' + esc(o.titulo) + '</p>' +
    (emp ? '<p class="tj-e"><span class="ini ini-sm">' + esc(iniciales(emp)) + '</span>' + esc(emp) + '</p>' : '') +
    '<div class="tj-pie">' +
      '<span class="tj-v">' + esc(euros(o.valor)) + '</span>' +
      (o.cierre ? '<span class="pill">' + esc(fechaCorta(o.cierre)) + '</span>' : '') +
    '</div>' +
  '</article>';
}

/* Arrastrar y soltar entre columnas. Se usa la API nativa: no hace
   falta libreria y funciona con raton y con lapiz. */
var arrastrando = null;
function enganchaArrastre() {
  $$('.tj').forEach(function (t) {
    t.addEventListener('dragstart', function (e) {
      arrastrando = t.dataset.op;
      t.classList.add('arrastrando');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', arrastrando); } catch (x) {}
    });
    t.addEventListener('dragend', function () {
      t.classList.remove('arrastrando');
      arrastrando = null;
      $$('.col').forEach(function (c) { c.classList.remove('sobre'); });
    });
  });

  $$('.col-lista').forEach(function (z) {
    z.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      z.closest('.col').classList.add('sobre');
    });
    z.addEventListener('dragleave', function () { z.closest('.col').classList.remove('sobre'); });
    z.addEventListener('drop', function (e) {
      e.preventDefault();
      z.closest('.col').classList.remove('sobre');
      var oid = arrastrando || e.dataTransfer.getData('text/plain');
      mueve(oid, z.dataset.soltar);
    });
  });
}

function mueve(oid, nuevaEtapa) {
  var o = oportunidad(oid);
  if (!o || !etapaValida(nuevaEtapa) || o.etapa === nuevaEtapa) return;
  var antes = o.etapa;
  o.etapa = nuevaEtapa;
  if (nuevaEtapa === 'ganada' || nuevaEtapa === 'perdida') o.cerrado = hoy();
  else delete o.cerrado;
  registra(o.titulo + ': ' + etapa(antes).n + ' -> ' + etapa(nuevaEtapa).n, oid);
  guardar();
  pinta();
  aviso(o.titulo + ' pasa a ' + etapa(nuevaEtapa).n, 'Deshacer', function () {
    o.etapa = antes;
    if (antes === 'ganada' || antes === 'perdida') o.cerrado = hoy(); else delete o.cerrado;
    guardar(); pinta();
  });
}

/* -- Empresas -------------------------------------------------- */

function vistaEmpresas() {
  var h = '<div class="vista">' +
    '<div class="vista-cab"><div>' +
      '<h1 class="vista-t">Empresas</h1>' +
      '<p class="vista-sub">' + datos.empresas.length + (datos.empresas.length === 1 ? ' ficha' : ' fichas') + '</p>' +
    '</div><div class="vista-acc">' +
      '<button class="btn btn-linea btn-sm" data-nuevo="empresa">Nueva empresa</button>' +
    '</div></div>';

  if (!datos.empresas.length) {
    h += '<div class="caja"><div class="vacio">' +
      '<svg viewBox="0 0 24 24"><path d="M4 20V6a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13 6v14"/><path d="M13 20v-9h5.5A1.5 1.5 0 0 1 20 12.5V20"/><path d="M2 20h20"/><path d="M7 8h3M7 11h3M7 14h3"/></svg>' +
      '<p class="vacio-t">Ninguna empresa todavía</p>' +
      '<p class="vacio-p">La ficha de empresa es el centro: de ella cuelgan los contactos, las oportunidades y las tareas.</p>' +
      '<div class="vacio-acc"><button class="btn btn-verde" data-nuevo="empresa">' +
        '<svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg><span>Nueva empresa</span></button></div>' +
    '</div></div></div>';
    return h;
  }

  var lista = datos.empresas.filter(function (e) {
    return filtroEmpresas === 'todas' || e.estado === filtroEmpresas;
  }).sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre), 'es'); });

  h += '<div class="tabla-env"><div class="tabla-fil">' +
    chip('todas', 'Todas', filtroEmpresas, datos.empresas.length);
  ESTADOS.forEach(function (s) {
    var n = datos.empresas.filter(function (e) { return e.estado === s.id; }).length;
    h += chip(s.id, s.n, filtroEmpresas, n);
  });
  h += '</div>';

  if (!lista.length) {
    h += '<div class="vacio vacio-sm"><p class="vacio-t">Ninguna en este filtro</p>' +
      '<p class="vacio-p">Cambia de pestaña para ver el resto.</p></div>';
  } else {
    h += '<div class="tabla-desb"><table><thead><tr>' +
      '<th>Empresa</th><th>Estado</th><th>Contactos</th><th>Abiertas</th>' +
      '<th class="td-num">En el embudo</th></tr></thead><tbody>';
    lista.forEach(function (e) {
      var cs = datos.contactos.filter(function (c) { return c.empresaId === e.id; }).length;
      var ops = abiertas().filter(function (o) { return o.empresaId === e.id; });
      var val = ops.reduce(function (s, o) { return s + (Number(o.valor) || 0); }, 0);
      h += '<tr data-ficha="empresa" data-id="' + esc(e.id) + '">' +
        '<td><div style="display:flex;align-items:center;gap:10px">' +
          '<span class="ini">' + esc(iniciales(e.nombre)) + '</span>' +
          '<div><div class="td-p">' + esc(e.nombre) + '</div>' +
          (e.sector ? '<div class="td-tenue">' + esc(e.sector) + '</div>' : '') +
        '</div></div></td>' +
        '<td><span class="pill pill-' + esc(e.estado || 'lead') + '">' + esc(nombreEstado(e.estado)) + '</span></td>' +
        '<td class="td-tenue">' + cs + '</td>' +
        '<td class="td-tenue">' + ops.length + '</td>' +
        '<td class="td-num">' + esc(val ? euros(val) : '—') + '</td>' +
      '</tr>';
    });
    h += '</tbody></table></div>';
  }
  h += '</div></div>';
  return h;
}

function chip(v, texto, activo, n) {
  return '<button class="chip" data-filtro-emp="' + esc(v) + '" aria-pressed="' + (activo === v ? 'true' : 'false') + '">' +
    esc(texto) + (typeof n === 'number' ? ' &middot; ' + n : '') + '</button>';
}

/* -- Contactos ------------------------------------------------- */

function vistaContactos() {
  var h = '<div class="vista">' +
    '<div class="vista-cab"><div>' +
      '<h1 class="vista-t">Contactos</h1>' +
      '<p class="vista-sub">' + datos.contactos.length + (datos.contactos.length === 1 ? ' persona' : ' personas') + '</p>' +
    '</div><div class="vista-acc">' +
      '<button class="btn btn-linea btn-sm" data-nuevo="contacto">Nuevo contacto</button>' +
    '</div></div>';

  if (!datos.contactos.length) {
    h += '<div class="caja"><div class="vacio">' +
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>' +
      '<p class="vacio-t">Ningún contacto</p>' +
      '<p class="vacio-p">' + (datos.empresas.length
        ? 'Añade las personas con las que hablas de verdad en cada empresa.'
        : 'Conviene crear antes la empresa: así el contacto queda colgado de su ficha.') + '</p>' +
      '<div class="vacio-acc"><button class="btn btn-verde" data-nuevo="' + (datos.empresas.length ? 'contacto' : 'empresa') + '">' +
        '<svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg><span>' +
        (datos.empresas.length ? 'Nuevo contacto' : 'Nueva empresa') + '</span></button></div>' +
    '</div></div></div>';
    return h;
  }

  var lista = datos.contactos.slice().sort(function (a, b) {
    return String(a.nombre).localeCompare(String(b.nombre), 'es');
  });
  h += '<div class="tabla-env"><div class="tabla-desb"><table><thead><tr>' +
    '<th>Nombre</th><th>Empresa</th><th>Email</th><th>Teléfono</th></tr></thead><tbody>';
  lista.forEach(function (c) {
    h += '<tr data-ficha="contacto" data-id="' + esc(c.id) + '">' +
      '<td><div style="display:flex;align-items:center;gap:10px">' +
        '<span class="ini">' + esc(iniciales(c.nombre)) + '</span>' +
        '<div><div class="td-p">' + esc(c.nombre) + '</div>' +
        (c.cargo ? '<div class="td-tenue">' + esc(c.cargo) + '</div>' : '') +
      '</div></div></td>' +
      '<td class="td-tenue">' + esc(nombreEmpresa(c.empresaId) || '—') + '</td>' +
      '<td class="td-tenue">' + esc(c.email || '—') + '</td>' +
      '<td class="td-tenue">' + esc(c.tel || '—') + '</td>' +
    '</tr>';
  });
  h += '</tbody></table></div></div></div>';
  return h;
}

/* -- Tareas ---------------------------------------------------- */

function vistaTareas() {
  var v = vencidas().length;
  var h = '<div class="vista">' +
    '<div class="vista-cab"><div>' +
      '<h1 class="vista-t">Tareas</h1>' +
      '<p class="vista-sub">' + pendientes().length + ' pendientes' + (v ? ', ' + v + (v === 1 ? ' vencida' : ' vencidas') : '') + '</p>' +
    '</div><div class="vista-acc">' +
      '<button class="btn btn-linea btn-sm" data-nuevo="tarea">Nueva tarea</button>' +
    '</div></div>';

  if (!datos.tareas.length) {
    h += '<div class="caja"><div class="vacio">' +
      '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/><path d="m8.5 14.5 2.2 2.2 4.3-4.4"/></svg>' +
      '<p class="vacio-t">Sin tareas</p>' +
      '<p class="vacio-p">Una tarea es un compromiso con fecha: llamar el martes, mandar la propuesta antes del viernes. Lo que no tiene fecha se olvida.</p>' +
      '<div class="vacio-acc"><button class="btn btn-verde" data-nuevo="tarea">' +
        '<svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg><span>Nueva tarea</span></button></div>' +
    '</div></div></div>';
    return h;
  }

  var lista = datos.tareas.filter(function (t) {
    if (filtroTareas === 'pendientes') return !t.hecha;
    if (filtroTareas === 'hechas') return t.hecha;
    return true;
  }).sort(function (a, b) {
    if (!!a.hecha !== !!b.hecha) return a.hecha ? 1 : -1;
    return String(a.vence || '9999').localeCompare(String(b.vence || '9999'));
  });

  h += '<div class="tabla-env"><div class="tabla-fil">' +
    '<button class="chip" data-filtro-tar="pendientes" aria-pressed="' + (filtroTareas === 'pendientes') + '">Pendientes &middot; ' + pendientes().length + '</button>' +
    '<button class="chip" data-filtro-tar="hechas" aria-pressed="' + (filtroTareas === 'hechas') + '">Hechas &middot; ' + (datos.tareas.length - pendientes().length) + '</button>' +
    '<button class="chip" data-filtro-tar="todas" aria-pressed="' + (filtroTareas === 'todas') + '">Todas &middot; ' + datos.tareas.length + '</button>' +
  '</div><div class="caja-cuerpo">' +
    (lista.length ? lista.map(filaTarea).join('')
      : '<div class="vacio vacio-sm"><p class="vacio-t">Nada en este filtro</p></div>') +
  '</div></div></div>';
  return h;
}

/* -- Ajustes --------------------------------------------------- */

function vistaAjustes() {
  var total = datos.empresas.length + datos.contactos.length + datos.oportunidades.length + datos.tareas.length;
  var bytes = 0;
  try { bytes = new Blob([JSON.stringify(datos)]).size; } catch (e) {}

  return '<div class="vista">' +
    '<div class="vista-cab"><div><h1 class="vista-t">Ajustes</h1>' +
    '<p class="vista-sub">' + total + ' registros, ' + Math.max(1, Math.round(bytes / 1024)) + ' KB</p></div></div>' +
    '<div class="ajustes">' +

    '<div class="aj-caja">' +
      '<h2 class="aj-t">Dónde están tus datos</h2>' +
      '<p class="aj-p">En el almacén de este navegador, en este equipo. No se envían a ningún servidor: no hay servidor. ' +
      'Eso significa que <strong>no los verás en otro dispositivo</strong>, y que si borras los datos de navegación se van con ellos. ' +
      'La copia de seguridad no es opcional.</p>' +
      '<div class="aj-acc">' +
        '<button class="btn btn-verde btn-sm" id="expJson"><svg viewBox="0 0 20 20"><path d="M10 3v10M6 9.5l4 4 4-4M4 17h12"/></svg><span>Descargar copia</span></button>' +
        '<button class="btn btn-linea btn-sm" id="impJson">Restaurar copia</button>' +
        '<input type="file" id="ficheroJson" accept="application/json,.json" hidden>' +
      '</div>' +
    '</div>' +

    '<div class="aj-caja">' +
      '<h2 class="aj-t">Exportar a hoja de cálculo</h2>' +
      '<p class="aj-p">Un CSV por tabla, con separador de coma y codificación UTF-8. Se abren en Excel, Numbers y Google Sheets.</p>' +
      '<div class="aj-acc">' +
        '<button class="btn btn-linea btn-sm" data-csv="empresas">Empresas</button>' +
        '<button class="btn btn-linea btn-sm" data-csv="contactos">Contactos</button>' +
        '<button class="btn btn-linea btn-sm" data-csv="oportunidades">Oportunidades</button>' +
        '<button class="btn btn-linea btn-sm" data-csv="tareas">Tareas</button>' +
      '</div>' +
    '</div>' +

    '<div class="aj-caja aj-peligro">' +
      '<h2 class="aj-t">Vaciar</h2>' +
      '<p class="aj-p">Borra las ' + total + ' fichas de este navegador. No hay papelera y no se puede deshacer: descarga la copia antes.</p>' +
      '<div class="aj-acc"><button class="btn btn-peligro btn-sm" id="vaciar">Borrarlo todo</button></div>' +
    '</div>' +

  '</div></div>';
}

/* -- Ficha lateral --------------------------------------------- */

function abreFicha(tipo, oid) {
  var h = '';
  if (tipo === 'empresa') h = fichaEmpresa(oid);
  else if (tipo === 'contacto') h = fichaContacto(oid);
  else if (tipo === 'oportunidad') h = fichaOportunidad(oid);
  else if (tipo === 'tarea') h = fichaTarea(oid);
  if (!h) return;
  var c = $('#cajon');
  c.innerHTML = h;
  c.hidden = false;
  $('#cajonFondo').hidden = false;
  var x = $('.cajon-x', c);
  if (x) x.focus();
}

function cierraFicha() {
  $('#cajon').hidden = true;
  $('#cajonFondo').hidden = true;
}

function cabezaFicha(titulo, sub) {
  return '<div class="cajon-cab"><div>' +
    '<h2 class="cajon-t">' + esc(titulo) + '</h2>' +
    (sub ? '<p class="cajon-s">' + esc(sub) + '</p>' : '') +
  '</div><button class="cajon-x" data-cerrar aria-label="Cerrar">' +
    '<svg viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8"/></svg></button></div>';
}

function dato(k, v) {
  if (!v) return '';
  return '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>';
}

function fichaEmpresa(eid) {
  var e = empresa(eid);
  if (!e) return '';
  var cs = datos.contactos.filter(function (c) { return c.empresaId === eid; });
  var ops = datos.oportunidades.filter(function (o) { return o.empresaId === eid; });
  var ts = datos.tareas.filter(function (t) { return t.empresaId === eid && !t.hecha; });

  var h = cabezaFicha(e.nombre, nombreEstado(e.estado) + (e.sector ? ' &middot; ' + e.sector : ''));
  h += '<div class="cajon-cuerpo">';

  var d = dato('NIF', e.nif) + dato('Ciudad', e.ciudad) + dato('Teléfono', e.tel) +
          dato('Email', e.email) + dato('Web', e.web);
  if (d) h += '<div class="bloque"><span class="etiq">Datos</span><dl class="datos">' + d + '</dl></div>';

  h += '<div class="bloque"><span class="etiq">Oportunidades &middot; ' + ops.length + '</span>';
  h += ops.length ? ops.map(function (o) {
    return '<button class="fila" data-ficha="oportunidad" data-id="' + esc(o.id) + '">' +
      '<div class="fila-cuerpo"><p class="fila-t">' + esc(o.titulo) + '</p>' +
      '<p class="fila-s">' + esc(etapa(o.etapa).n) + '</p></div>' +
      '<span class="fila-d"><strong>' + esc(euros(o.valor)) + '</strong></span></button>';
  }).join('') : '<p class="pista">Ninguna abierta con esta empresa.</p>';
  h += '</div>';

  h += '<div class="bloque"><span class="etiq">Contactos &middot; ' + cs.length + '</span>';
  h += cs.length ? cs.map(function (c) {
    return '<button class="fila" data-ficha="contacto" data-id="' + esc(c.id) + '">' +
      '<span class="ini ini-sm">' + esc(iniciales(c.nombre)) + '</span>' +
      '<div class="fila-cuerpo"><p class="fila-t">' + esc(c.nombre) + '</p>' +
      '<p class="fila-s">' + esc(c.cargo || c.email || '') + '</p></div></button>';
  }).join('') : '<p class="pista">Sin personas anotadas.</p>';
  h += '</div>';

  if (ts.length) {
    h += '<div class="bloque"><span class="etiq">Tareas pendientes</span>' + ts.map(filaTarea).join('') + '</div>';
  }
  if (e.notas) {
    h += '<div class="bloque"><span class="etiq">Notas</span><p class="nota-txt">' + esc(e.notas) + '</p></div>';
  }
  h += '</div><div class="cajon-pie">' +
    '<button class="btn btn-linea btn-sm" data-editar="empresa" data-id="' + esc(e.id) + '">Editar</button>' +
    '<button class="btn btn-linea btn-sm" data-nuevo="oportunidad" data-empresa="' + esc(e.id) + '">Nueva oportunidad</button>' +
    '<button class="btn btn-peligro btn-sm" data-borrar="empresa" data-id="' + esc(e.id) + '">Eliminar</button>' +
  '</div>';
  return h;
}

function fichaContacto(cid) {
  var c = contacto(cid);
  if (!c) return '';
  var h = cabezaFicha(c.nombre, [c.cargo, nombreEmpresa(c.empresaId)].filter(Boolean).join(' &middot; '));
  h += '<div class="cajon-cuerpo">';
  var d = dato('Email', c.email) + dato('Teléfono', c.tel) + dato('Empresa', nombreEmpresa(c.empresaId));
  if (d) h += '<div class="bloque"><span class="etiq">Datos</span><dl class="datos">' + d + '</dl></div>';
  if (c.notas) h += '<div class="bloque"><span class="etiq">Notas</span><p class="nota-txt">' + esc(c.notas) + '</p></div>';
  h += '</div><div class="cajon-pie">' +
    '<button class="btn btn-linea btn-sm" data-editar="contacto" data-id="' + esc(c.id) + '">Editar</button>' +
    (c.empresaId ? '<button class="btn btn-linea btn-sm" data-ficha="empresa" data-id="' + esc(c.empresaId) + '">Ver empresa</button>' : '') +
    '<button class="btn btn-peligro btn-sm" data-borrar="contacto" data-id="' + esc(c.id) + '">Eliminar</button>' +
  '</div>';
  return h;
}

function fichaOportunidad(oid) {
  var o = oportunidad(oid);
  if (!o) return '';
  var h = cabezaFicha(o.titulo, nombreEmpresa(o.empresaId));
  h += '<div class="cajon-cuerpo">';
  h += '<div class="bloque"><span class="etiq">Estado</span><dl class="datos">' +
    '<dt>Valor</dt><dd>' + esc(euros(o.valor)) + '</dd>' +
    '<dt>Etapa</dt><dd>' + esc(etapa(o.etapa).n) + '</dd>' +
    dato('Cierre previsto', fechaCorta(o.cierre)) +
    dato('Cerrada el', fechaCorta(o.cerrado)) +
  '</dl></div>';

  h += '<div class="bloque"><span class="etiq">Mover a</span><div class="vacio-acc" style="justify-content:flex-start">';
  ETAPAS.forEach(function (et) {
    if (et.id === o.etapa) return;
    h += '<button class="chip" data-mover="' + esc(o.id) + '" data-etapa="' + esc(et.id) + '">' + esc(et.n) + '</button>';
  });
  h += '</div></div>';

  if (o.notas) h += '<div class="bloque"><span class="etiq">Notas</span><p class="nota-txt">' + esc(o.notas) + '</p></div>';
  h += '</div><div class="cajon-pie">' +
    '<button class="btn btn-linea btn-sm" data-editar="oportunidad" data-id="' + esc(o.id) + '">Editar</button>' +
    (o.empresaId ? '<button class="btn btn-linea btn-sm" data-ficha="empresa" data-id="' + esc(o.empresaId) + '">Ver empresa</button>' : '') +
    '<button class="btn btn-peligro btn-sm" data-borrar="oportunidad" data-id="' + esc(o.id) + '">Eliminar</button>' +
  '</div>';
  return h;
}

function fichaTarea(tid) {
  var t = tarea(tid);
  if (!t) return '';
  var h = cabezaFicha(t.titulo, nombreTipo(t.tipo) + (t.hecha ? ' &middot; hecha' : ''));
  h += '<div class="cajon-cuerpo"><div class="bloque"><span class="etiq">Datos</span><dl class="datos">' +
    dato('Vence', fechaCorta(t.vence)) +
    dato('Empresa', nombreEmpresa(t.empresaId)) +
    dato('Oportunidad', t.oportunidadId && oportunidad(t.oportunidadId) ? oportunidad(t.oportunidadId).titulo : '') +
  '</dl></div>';
  if (t.notas) h += '<div class="bloque"><span class="etiq">Notas</span><p class="nota-txt">' + esc(t.notas) + '</p></div>';
  h += '</div><div class="cajon-pie">' +
    '<button class="btn btn-verde btn-sm" data-hecha="' + esc(t.id) + '">' + (t.hecha ? 'Reabrir' : 'Marcar hecha') + '</button>' +
    '<button class="btn btn-linea btn-sm" data-editar="tarea" data-id="' + esc(t.id) + '">Editar</button>' +
    '<button class="btn btn-peligro btn-sm" data-borrar="tarea" data-id="' + esc(t.id) + '">Eliminar</button>' +
  '</div>';
  return h;
}

/* -- Formularios ----------------------------------------------- */

function opcionesEmpresa(sel) {
  var h = '<option value="">— sin empresa —</option>';
  datos.empresas.slice().sort(function (a, b) {
    return String(a.nombre).localeCompare(String(b.nombre), 'es');
  }).forEach(function (e) {
    h += '<option value="' + esc(e.id) + '"' + (e.id === sel ? ' selected' : '') + '>' + esc(e.nombre) + '</option>';
  });
  return h;
}

function campo(nombre, etiqueta, valor, tipo, extra) {
  return '<div class="campo"><label for="f_' + nombre + '">' + esc(etiqueta) + '</label>' +
    '<input id="f_' + nombre + '" name="' + nombre + '" type="' + (tipo || 'text') + '" value="' + esc(valor || '') + '"' +
    (extra || '') + '></div>';
}
function area(nombre, etiqueta, valor) {
  return '<div class="campo"><label for="f_' + nombre + '">' + esc(etiqueta) + '</label>' +
    '<textarea id="f_' + nombre + '" name="' + nombre + '">' + esc(valor || '') + '</textarea></div>';
}
function selector(nombre, etiqueta, opciones) {
  return '<div class="campo"><label for="f_' + nombre + '">' + esc(etiqueta) + '</label>' +
    '<select id="f_' + nombre + '" name="' + nombre + '">' + opciones + '</select></div>';
}

function abreForm(tipo, oid, pre) {
  var dlg = $('#dlg');
  var reg = null;
  if (oid) {
    if (tipo === 'empresa') reg = empresa(oid);
    else if (tipo === 'contacto') reg = contacto(oid);
    else if (tipo === 'oportunidad') reg = oportunidad(oid);
    else if (tipo === 'tarea') reg = tarea(oid);
    if (!reg) return;
  }
  var r = reg || {};
  var cuerpo = '', titulo = '';

  if (tipo === 'empresa') {
    titulo = reg ? 'Editar empresa' : 'Nueva empresa';
    cuerpo =
      campo('nombre', 'Nombre *', r.nombre, 'text', ' required autocomplete="off"') +
      '<div class="campo-2">' + campo('nif', 'NIF', r.nif) + campo('sector', 'Sector', r.sector) + '</div>' +
      selector('estado', 'Estado', ESTADOS.map(function (s) {
        return '<option value="' + s.id + '"' + ((r.estado || 'lead') === s.id ? ' selected' : '') + '>' + esc(s.n) + '</option>';
      }).join('')) +
      '<div class="campo-2">' + campo('tel', 'Teléfono', r.tel, 'tel') + campo('ciudad', 'Ciudad', r.ciudad) + '</div>' +
      campo('email', 'Email', r.email, 'email') +
      campo('web', 'Web', r.web, 'url', ' placeholder="https://"') +
      area('notas', 'Notas', r.notas);

  } else if (tipo === 'contacto') {
    titulo = reg ? 'Editar contacto' : 'Nuevo contacto';
    cuerpo =
      campo('nombre', 'Nombre *', r.nombre, 'text', ' required autocomplete="off"') +
      campo('cargo', 'Cargo', r.cargo) +
      selector('empresaId', 'Empresa', opcionesEmpresa(r.empresaId || (pre && pre.empresaId))) +
      '<div class="campo-2">' + campo('email', 'Email', r.email, 'email') + campo('tel', 'Teléfono', r.tel, 'tel') + '</div>' +
      area('notas', 'Notas', r.notas);

  } else if (tipo === 'oportunidad') {
    titulo = reg ? 'Editar oportunidad' : 'Nueva oportunidad';
    cuerpo =
      campo('titulo', 'Título *', r.titulo, 'text', ' required autocomplete="off" placeholder="¿Qué vendes exactamente?"') +
      selector('empresaId', 'Empresa', opcionesEmpresa(r.empresaId || (pre && pre.empresaId))) +
      '<div class="campo-2">' +
        campo('valor', 'Valor (EUR)', r.valor, 'number', ' min="0" step="any" inputmode="decimal"') +
        campo('cierre', 'Cierre previsto', r.cierre, 'date') +
      '</div>' +
      selector('etapa', 'Etapa', ETAPAS.map(function (e) {
        return '<option value="' + e.id + '"' + ((r.etapa || (pre && pre.etapa) || 'contacto') === e.id ? ' selected' : '') + '>' + esc(e.n) + '</option>';
      }).join('')) +
      area('notas', 'Notas', r.notas);

  } else if (tipo === 'tarea') {
    titulo = reg ? 'Editar tarea' : 'Nueva tarea';
    cuerpo =
      campo('titulo', '¿Qué hay que hacer? *', r.titulo, 'text', ' required autocomplete="off"') +
      '<div class="campo-2">' +
        selector('tipo', 'Tipo', TIPOS_TAREA.map(function (t) {
          return '<option value="' + t.id + '"' + ((r.tipo || 'tarea') === t.id ? ' selected' : '') + '>' + esc(t.n) + '</option>';
        }).join('')) +
        campo('vence', 'Vence', r.vence || (reg ? '' : hoy()), 'date') +
      '</div>' +
      selector('empresaId', 'Empresa', opcionesEmpresa(r.empresaId || (pre && pre.empresaId))) +
      area('notas', 'Notas', r.notas);
  }

  dlg.innerHTML = '<form method="dialog" id="form">' +
    '<div class="dlg-cab"><h2 class="dlg-t">' + esc(titulo) + '</h2></div>' +
    '<div class="dlg-cuerpo">' + cuerpo + '<p class="msg-error" id="formError" hidden></p></div>' +
    '<div class="dlg-pie">' +
      '<button type="button" class="btn btn-linea" id="cancelar">Cancelar</button>' +
      '<button type="submit" class="btn btn-verde"><span>' + (reg ? 'Guardar' : 'Crear') + '</span></button>' +
    '</div></form>';

  dlg.showModal();
  var primero = $('#form input, #form select', dlg);
  if (primero) primero.focus();

  $('#cancelar').onclick = function () { dlg.close(); };
  $('#form').onsubmit = function (ev) {
    ev.preventDefault();
    if (envia(tipo, reg, new FormData(ev.target))) dlg.close();
  };
}

function envia(tipo, reg, fd) {
  function v(k) { return String(fd.get(k) || '').trim(); }
  function error(msg) {
    var e = $('#formError');
    e.textContent = msg; e.hidden = false;
    return false;
  }

  var email = v('email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return error('Ese correo no tiene forma de correo.');

  var nuevo = !reg;
  var r = reg || { id: id(), creado: new Date().toISOString() };

  if (tipo === 'empresa') {
    if (!v('nombre')) return error('El nombre de la empresa es obligatorio.');
    r.nombre = v('nombre'); r.nif = v('nif'); r.sector = v('sector');
    r.estado = v('estado') || 'lead'; r.tel = v('tel'); r.ciudad = v('ciudad');
    r.email = email; r.web = v('web'); r.notas = v('notas');
    if (nuevo) { datos.empresas.push(r); registra('Alta de ' + r.nombre, r.id); }

  } else if (tipo === 'contacto') {
    if (!v('nombre')) return error('El nombre del contacto es obligatorio.');
    r.nombre = v('nombre'); r.cargo = v('cargo'); r.empresaId = v('empresaId');
    r.email = email; r.tel = v('tel'); r.notas = v('notas');
    if (nuevo) { datos.contactos.push(r); registra('Nuevo contacto: ' + r.nombre, r.id); }

  } else if (tipo === 'oportunidad') {
    if (!v('titulo')) return error('La oportunidad necesita un título.');
    var val = Number(v('valor'));
    if (v('valor') && (isNaN(val) || val < 0)) return error('El valor tiene que ser un número positivo.');
    var etAntes = r.etapa;
    r.titulo = v('titulo'); r.empresaId = v('empresaId'); r.valor = isNaN(val) ? 0 : val;
    r.cierre = v('cierre'); r.etapa = etapaValida(v('etapa')) ? v('etapa') : 'contacto'; r.notas = v('notas');
    if (r.etapa === 'ganada' || r.etapa === 'perdida') { if (!r.cerrado) r.cerrado = hoy(); }
    else delete r.cerrado;
    if (nuevo) { datos.oportunidades.push(r); registra('Nueva oportunidad: ' + r.titulo, r.id); }
    else if (etAntes !== r.etapa) registra(r.titulo + ': ' + etapa(etAntes).n + ' -> ' + etapa(r.etapa).n, r.id);

  } else if (tipo === 'tarea') {
    if (!v('titulo')) return error('La tarea necesita un título.');
    r.titulo = v('titulo'); r.tipo = v('tipo') || 'tarea'; r.vence = v('vence');
    r.empresaId = v('empresaId'); r.notas = v('notas');
    if (nuevo) { r.hecha = false; datos.tareas.push(r); }
  }

  guardar();
  pinta();
  if (!$('#cajon').hidden) {
    var t = $('#cajon').dataset.tipo, i = $('#cajon').dataset.id;
    if (t && i) abreFicha(t, i);
  }
  aviso(nuevo ? 'Creado' : 'Guardado');
  return true;
}

/* -- Borrado --------------------------------------------------- */

function borra(tipo, oid) {
  var lista = tipo === 'empresa' ? datos.empresas
            : tipo === 'contacto' ? datos.contactos
            : tipo === 'oportunidad' ? datos.oportunidades
            : datos.tareas;
  var i = -1;
  for (var k = 0; k < lista.length; k++) if (lista[k].id === oid) { i = k; break; }
  if (i < 0) return;
  var reg = lista[i];
  var nombre = reg.nombre || reg.titulo || 'el registro';

  /* Borrar una empresa dejaria contactos y oportunidades colgando
     de un id que ya no existe. Se avisa con el recuento exacto. */
  if (tipo === 'empresa') {
    var cs = datos.contactos.filter(function (c) { return c.empresaId === oid; }).length;
    var ops = datos.oportunidades.filter(function (o) { return o.empresaId === oid; }).length;
    var extra = [];
    if (cs) extra.push(cs + (cs === 1 ? ' contacto' : ' contactos'));
    if (ops) extra.push(ops + (ops === 1 ? ' oportunidad' : ' oportunidades'));
    var msg = 'Vas a eliminar ' + nombre + '.' +
      (extra.length ? ' Se quedan sin empresa ' + extra.join(' y ') + '.' : '') + ' No se puede deshacer.';
    if (!window.confirm(msg)) return;
    datos.contactos.forEach(function (c) { if (c.empresaId === oid) c.empresaId = ''; });
    datos.oportunidades.forEach(function (o) { if (o.empresaId === oid) o.empresaId = ''; });
    datos.tareas.forEach(function (t) { if (t.empresaId === oid) t.empresaId = ''; });
  } else if (!window.confirm('Vas a eliminar ' + nombre + '. No se puede deshacer.')) {
    return;
  }

  lista.splice(i, 1);
  registra('Eliminado: ' + nombre, null);
  guardar();
  cierraFicha();
  pinta();
  aviso(nombre + ' eliminado');
}

/* -- Buscador -------------------------------------------------- */

function busca(q) {
  var caja = $('#resultados');
  q = String(q || '').trim().toLowerCase();
  if (q.length < 2) { caja.hidden = true; caja.innerHTML = ''; return; }

  function coincide(txt) { return String(txt || '').toLowerCase().indexOf(q) >= 0; }
  var res = [];

  datos.empresas.forEach(function (e) {
    if (coincide(e.nombre) || coincide(e.nif) || coincide(e.sector) || coincide(e.ciudad))
      res.push({ t: 'empresa', id: e.id, n: e.nombre, s: nombreEstado(e.estado) });
  });
  datos.contactos.forEach(function (c) {
    if (coincide(c.nombre) || coincide(c.email) || coincide(c.cargo) || coincide(c.tel))
      res.push({ t: 'contacto', id: c.id, n: c.nombre, s: [c.cargo, nombreEmpresa(c.empresaId)].filter(Boolean).join(' · ') });
  });
  datos.oportunidades.forEach(function (o) {
    if (coincide(o.titulo) || coincide(nombreEmpresa(o.empresaId)))
      res.push({ t: 'oportunidad', id: o.id, n: o.titulo, s: etapa(o.etapa).n + ' · ' + euros(o.valor) });
  });
  datos.tareas.forEach(function (t) {
    if (coincide(t.titulo)) res.push({ t: 'tarea', id: t.id, n: t.titulo, s: venceTexto(t.vence) || nombreTipo(t.tipo) });
  });

  if (!res.length) {
    caja.innerHTML = '<p class="res-nada">Nada coincide con “' + esc(q) + '”.</p>';
  } else {
    caja.innerHTML = res.slice(0, 12).map(function (r, i) {
      return '<button class="res-i' + (i === 0 ? ' sel' : '') + '" data-ficha="' + r.t + '" data-id="' + esc(r.id) + '">' +
        '<span class="ini ini-sm">' + esc(iniciales(r.n)) + '</span>' +
        '<span><span class="res-t">' + esc(r.n) + '</span><br><span class="res-s">' + esc(r.s) + '</span></span>' +
      '</button>';
    }).join('');
  }
  caja.hidden = false;
}

function cierraBusqueda() {
  $('#resultados').hidden = true;
  $('#buscar').value = '';
}

/* -- Copia de seguridad y CSV ---------------------------------- */

function descarga(nombre, texto, mime) {
  var b = new Blob([texto], { type: mime + ';charset=utf-8' });
  var u = URL.createObjectURL(b);
  var a = document.createElement('a');
  a.href = u; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(u); }, 1500);
}

function exportaJson() {
  descarga('orezco-' + hoy() + '.json', JSON.stringify(datos, null, 2), 'application/json');
  aviso('Copia descargada');
}

/* Comillas dobles duplicadas y BOM al principio: sin las dos cosas
   Excel en Windows abre el fichero con los acentos rotos. */
function csv(filas) {
  return '﻿' + filas.map(function (f) {
    return f.map(function (c) {
      var s = c === null || c === undefined ? '' : String(c);
      return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',');
  }).join('\r\n');
}

function exportaCsv(cual) {
  var filas = [];
  if (cual === 'empresas') {
    filas.push(['Nombre', 'NIF', 'Sector', 'Estado', 'Teléfono', 'Email', 'Ciudad', 'Web', 'Notas']);
    datos.empresas.forEach(function (e) {
      filas.push([e.nombre, e.nif, e.sector, nombreEstado(e.estado), e.tel, e.email, e.ciudad, e.web, e.notas]);
    });
  } else if (cual === 'contactos') {
    filas.push(['Nombre', 'Cargo', 'Empresa', 'Email', 'Teléfono', 'Notas']);
    datos.contactos.forEach(function (c) {
      filas.push([c.nombre, c.cargo, nombreEmpresa(c.empresaId), c.email, c.tel, c.notas]);
    });
  } else if (cual === 'oportunidades') {
    filas.push(['Título', 'Empresa', 'Valor', 'Etapa', 'Cierre previsto', 'Cerrada', 'Notas']);
    datos.oportunidades.forEach(function (o) {
      filas.push([o.titulo, nombreEmpresa(o.empresaId), o.valor, etapa(o.etapa).n, o.cierre, o.cerrado, o.notas]);
    });
  } else {
    filas.push(['Tarea', 'Tipo', 'Vence', 'Hecha', 'Empresa', 'Notas']);
    datos.tareas.forEach(function (t) {
      filas.push([t.titulo, nombreTipo(t.tipo), t.vence, t.hecha ? 'si' : 'no', nombreEmpresa(t.empresaId), t.notas]);
    });
  }
  if (filas.length === 1) { aviso('No hay nada que exportar en ' + cual); return; }
  descarga('orezco-' + cual + '-' + hoy() + '.csv', csv(filas), 'text/csv');
  aviso((filas.length - 1) + ' filas exportadas');
}

function importaJson(fichero) {
  var lector = new FileReader();
  lector.onload = function () {
    var d;
    try { d = JSON.parse(String(lector.result)); }
    catch (e) { aviso('Ese fichero no es un JSON válido.'); return; }
    var n = normaliza(d);
    var total = n.empresas.length + n.contactos.length + n.oportunidades.length + n.tareas.length;
    if (!total) { aviso('El fichero no trae ninguna ficha.'); return; }
    var actual = datos.empresas.length + datos.contactos.length + datos.oportunidades.length + datos.tareas.length;
    var msg = 'La copia trae ' + total + ' fichas.' +
      (actual ? ' Sustituirá las ' + actual + ' que hay ahora en este navegador.' : '') + ' ¿Continuar?';
    if (!window.confirm(msg)) return;
    datos = n;
    guardar();
    ir('panel');
    aviso(total + ' fichas restauradas');
  };
  lector.onerror = function () { aviso('No se ha podido leer el fichero.'); };
  lector.readAsText(fichero);
}

function vaciaTodo() {
  var total = datos.empresas.length + datos.contactos.length + datos.oportunidades.length + datos.tareas.length;
  if (!total) { aviso('Ya está vacío'); return; }
  if (!window.confirm('Se borran ' + total + ' fichas de este navegador y no hay vuelta atrás. ¿Continuar?')) return;
  if (!window.confirm('Confírmalo una vez más: se borra todo.')) return;
  datos = JSON.parse(JSON.stringify(VACIO));
  guardar();
  ir('panel');
  aviso('Todo borrado');
}

/* -- Menu movil ------------------------------------------------ */

function abreMenuMovil() {
  $('#lateral').classList.add('abierta');
  $('#velo').hidden = false;
  $('#menuMovil').setAttribute('aria-expanded', 'true');
}
function cerrarMenuMovil() {
  $('#lateral').classList.remove('abierta');
  $('#velo').hidden = true;
  $('#menuMovil').setAttribute('aria-expanded', 'false');
}

/* -- Eventos --------------------------------------------------- */

/* Un solo escuchador para toda la pagina: las vistas se repintan
   enteras, asi que enganchar por elemento se perderia en cada
   repintado. */
document.addEventListener('click', function (ev) {
  var t = ev.target;
  if (!(t instanceof Element)) return;

  var nav = t.closest('.nav-i');
  if (nav) { ir(nav.dataset.vista); return; }

  var irA = t.closest('[data-ir]');
  if (irA) { ev.preventDefault(); ir(irA.dataset.ir); return; }

  var nuevo = t.closest('[data-nuevo]');
  if (nuevo) {
    var pre = nuevo.dataset.empresa ? { empresaId: nuevo.dataset.empresa } : null;
    abreForm(nuevo.dataset.nuevo, null, pre);
    return;
  }

  var editar = t.closest('[data-editar]');
  if (editar) { abreForm(editar.dataset.editar, editar.dataset.id); return; }

  var borrar = t.closest('[data-borrar]');
  if (borrar) { borra(borrar.dataset.borrar, borrar.dataset.id); return; }

  var hecha = t.closest('[data-hecha]');
  if (hecha) {
    var tr = tarea(hecha.dataset.hecha);
    if (tr) {
      tr.hecha = !tr.hecha;
      guardar(); pinta();
      if (!$('#cajon').hidden) abreFicha('tarea', tr.id);
    }
    return;
  }

  var mover = t.closest('[data-mover]');
  if (mover) {
    mueve(mover.dataset.mover, mover.dataset.etapa);
    abreFicha('oportunidad', mover.dataset.mover);
    return;
  }

  var ficha = t.closest('[data-ficha]');
  if (ficha) {
    cierraBusqueda();
    var c = $('#cajon');
    c.dataset.tipo = ficha.dataset.ficha;
    c.dataset.id = ficha.dataset.id;
    abreFicha(ficha.dataset.ficha, ficha.dataset.id);
    return;
  }

  var fe = t.closest('[data-filtro-emp]');
  if (fe) { filtroEmpresas = fe.dataset.filtroEmp; pinta(); return; }

  var ft = t.closest('[data-filtro-tar]');
  if (ft) { filtroTareas = ft.dataset.filtroTar; pinta(); return; }

  var csvBtn = t.closest('[data-csv]');
  if (csvBtn) { exportaCsv(csvBtn.dataset.csv); return; }

  if (t.closest('[data-cerrar]') || t.id === 'cajonFondo') { cierraFicha(); return; }
  if (t.id === 'velo') { cerrarMenuMovil(); return; }
  if (t.closest('#menuMovil')) { abreMenuMovil(); return; }
  if (t.id === 'btnNuevo') { abreForm(porDefecto()); return; }
  if (t.id === 'expJson') { exportaJson(); return; }
  if (t.id === 'impJson') { $('#ficheroJson').click(); return; }
  if (t.id === 'vaciar') { vaciaTodo(); return; }

  if (!t.closest('.buscador') && !t.closest('#resultados')) cierraBusqueda();
});

/* El boton Nuevo crea lo de la vista en la que estas. */
function porDefecto() {
  if (vistaActual === 'embudo') return 'oportunidad';
  if (vistaActual === 'contactos') return 'contacto';
  if (vistaActual === 'tareas') return 'tarea';
  return 'empresa';
}

document.addEventListener('change', function (ev) {
  if (ev.target.id === 'ficheroJson' && ev.target.files && ev.target.files[0]) {
    importaJson(ev.target.files[0]);
    ev.target.value = '';
  }
});

document.addEventListener('input', function (ev) {
  if (ev.target.id === 'buscar') busca(ev.target.value);
});

document.addEventListener('keydown', function (ev) {
  var enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);

  if (ev.key === '/' && !enCampo) { ev.preventDefault(); $('#buscar').focus(); return; }

  if (ev.key === 'Escape') {
    if (!$('#resultados').hidden) { cierraBusqueda(); $('#buscar').blur(); return; }
    if (!$('#cajon').hidden) { cierraFicha(); return; }
    cerrarMenuMovil();
    return;
  }

  if (ev.key === 'Enter' && ev.target.id === 'buscar') {
    var p = $('#resultados .res-i');
    if (p) p.click();
    return;
  }

  /* Enter o barra espaciadora sobre una tarjeta del embudo la abre:
     arrastrar no puede ser la unica forma de trabajar. */
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('tj')) {
    ev.preventDefault();
    var c = $('#cajon');
    c.dataset.tipo = 'oportunidad';
    c.dataset.id = ev.target.dataset.op;
    abreFicha('oportunidad', ev.target.dataset.op);
  }
});

/* -- Arranque -------------------------------------------------- */

ir(location.hash.slice(1) || 'panel', true);

})();
