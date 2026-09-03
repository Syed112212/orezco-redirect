/* == Filnet - CRM ===============================================
   Aplicacion de una sola pagina, sin dependencias ni compilacion.
   Los datos viven en localStorage, en este navegador y solo aqui.
   =============================================================== */
(function () {
'use strict';

/* -- Catalogos ------------------------------------------------- */

var LLAVE = 'filnet.erp.v1';

/* Los ocho paises son los que Filnet anuncia en su web. Los precios
   NO se inventan: entran vacios y se rellenan desde Paises y precios. */
/* Codigo de dos letras, no emoji de bandera: Windows no dibuja las
   banderas y las deja como dos letras sueltas, descolocadas. */
var PAISES = [
  { id: 'uk', n: 'Reino Unido', b: 'GB' },
  { id: 'fr', n: 'Francia',     b: 'FR' },
  { id: 'de', n: 'Alemania',    b: 'DE' },
  { id: 'it', n: 'Italia',      b: 'IT' },
  { id: 'pt', n: 'Portugal',    b: 'PT' },
  { id: 'es', n: 'España',      b: 'ES' },
  { id: 'ad', n: 'Andorra',     b: 'AD' },
  { id: 'ae', n: 'Dubái',       b: 'AE' }
];

var ESTADOS = [
  { id: 'sin',    n: 'Sin contactar', c: '' },
  { id: 'cont',   n: 'Contactado',    c: 'p-az' },
  { id: 'reinc',  n: 'Reincidente',   c: 'p-vi' },
  { id: 'ganado', n: 'Ganado',        c: 'p-ve' },
  { id: 'perd',   n: 'Perdido',       c: 'p-ro' }
];

var PRIORIDADES = [
  { id: 'baja',    n: 'Baja',    c: '' },
  { id: 'media',   n: 'Media',   c: 'p-vi' },
  { id: 'alta',    n: 'Alta',    c: 'p-am' },
  { id: 'urgente', n: 'Urgente', c: 'p-ro' }
];

var ORIGENES = ['Web', 'Recomendación', 'Campaña', 'LinkedIn', 'Llamada entrante', 'Otro'];

var COBROS = [
  { id: 'emitida', n: 'Emitida',  c: 'p-am' },
  { id: 'cobrada', n: 'Cobrada',  c: 'p-ve' },
  { id: 'anulada', n: 'Anulada',  c: 'p-ro' }
];

/* Los papeles que pide una constitución. Son los mismos en los ocho
   países; lo que cambia es a quién se los pide el registro de destino. */
var DOCS = [
  { id: 'pasaporte',  n: 'Pasaporte o DNI' },
  { id: 'domicilio',  n: 'Justificante de domicilio' },
  { id: 'poder',      n: 'Poder notarial' },
  { id: 'estatutos',  n: 'Estatutos' },
  { id: 'titular',    n: 'Titularidad real' },
  { id: 'banco',      n: 'Apertura de cuenta' },
  { id: 'otro',       n: 'Otro' }
];
var EST_DOC = [
  { id: 'pedido',    n: 'Pedido',    c: 'p-am' },
  { id: 'recibido',  n: 'Recibido',  c: 'p-az' },
  { id: 'validado',  n: 'Validado',  c: 'p-ve' },
  { id: 'rechazado', n: 'Rechazado', c: 'p-ro' }
];

var FASES = [
  { id: 'doc',    n: 'Documentación', c: 'p-am' },
  { id: 'firma',  n: 'Firma',         c: 'p-az' },
  { id: 'reg',    n: 'Registro',      c: 'p-vi' },
  { id: 'const',  n: 'Constituida',   c: 'p-ve' },
  { id: 'cancel', n: 'Cancelada',     c: 'p-ro' }
];
var FASES_ABIERTAS = ['doc', 'firma', 'reg'];

/* El equipo. NO es un sistema de usuarios: aqui no hay login ni
   contrasenas, porque no hay servidor donde comprobarlas. Sirve para
   atribuir el trabajo (quien lleva cada cliente) y para que cada uno
   vea "lo mio". No protege nada y la aplicacion lo dice. */
var EQUIPO_INICIAL = [
  { id: 'carlos', n: 'Carlos' },
  { id: 'syed',   n: 'Syed' },
  { id: 'victor', n: 'Víctor' },
  { id: 'ramon',  n: 'Ramón' },
  { id: 'arnau',  n: 'Arnau' }
];

var TIPOS_TAREA = [
  { id: 'llamada', n: 'Llamada' },
  { id: 'email',   n: 'Email' },
  { id: 'reunion', n: 'Reunión' },
  { id: 'doc',     n: 'Documentación' },
  { id: 'tarea',   n: 'Tarea' }
];

/* -- Utilidades ------------------------------------------------ */

function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

/* Todo lo que escribe una persona pasa por aqui antes de llegar al
   HTML. Sin esto, un nombre con etiquetas seria XSS. */
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function id() { return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

var fmtEuro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
function euros(n) { return fmtEuro.format(Number(n) || 0); }

function pad(n) { return n < 10 ? '0' + n : String(n); }
function hoy() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
var MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fechaCorta(iso) {
  if (!iso) return '';
  var p = String(iso).slice(0, 10).split('-');
  if (p.length !== 3) return '';
  return Number(p[2]) + ' ' + MESES_C[Number(p[1]) - 1] + ' ' + p[0];
}

/* Se compara en texto ISO para no arrastrar hora ni zona horaria. */
function diasHasta(iso) {
  if (!iso) return null;
  var a = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  if (isNaN(a)) return null;
  return Math.round((a - new Date(hoy() + 'T00:00:00')) / 86400000);
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
  if (!p.length) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

function busca_en(lista, x) {
  for (var i = 0; i < lista.length; i++) if (lista[i].id === x) return lista[i];
  return null;
}
function pais(x) { return busca_en(PAISES, x); }
function estado(x) { return busca_en(ESTADOS, x) || ESTADOS[0]; }
function prioridad(x) { return busca_en(PRIORIDADES, x) || PRIORIDADES[0]; }
function fase(x) { return busca_en(FASES, x) || FASES[0]; }
function tipoTarea(x) { return busca_en(TIPOS_TAREA, x) || TIPOS_TAREA[4]; }

function pill(texto, clase) {
  return '<span class="pill ' + (clase || '') + '">' + esc(texto) + '</span>';
}

/* -- Almacén --------------------------------------------------- */

var VACIO = { v: 1, clientes: [], contactos: [], expedientes: [], tareas: [], llamadas: [],
              facturas: [], documentos: [], objetivos: [],
              precios: {}, actividad: [], equipo: EQUIPO_INICIAL.slice(), yo: 'carlos' };
var datos = cargar();

function cargar() {
  try {
    var txt = localStorage.getItem(LLAVE);
    return txt ? normaliza(JSON.parse(txt)) : JSON.parse(JSON.stringify(VACIO));
  } catch (e) {
    console.warn('No se pudieron leer los datos guardados:', e);
    return JSON.parse(JSON.stringify(VACIO));
  }
}

/* Un fichero importado a mano puede venir incompleto. Se rellenan los
   huecos para que ninguna vista reviente por un array que no existe. */
function normaliza(d) {
  var base = JSON.parse(JSON.stringify(VACIO));
  if (!d || typeof d !== 'object') return base;
  ['clientes', 'contactos', 'expedientes', 'tareas', 'llamadas', 'actividad',
   'facturas', 'documentos', 'objetivos'].forEach(function (k) {
    if (Array.isArray(d[k])) base[k] = d[k].filter(function (x) { return x && typeof x === 'object'; });
  });
  if (d.precios && typeof d.precios === 'object') base.precios = d.precios;
  if (Array.isArray(d.equipo) && d.equipo.length) {
    base.equipo = d.equipo.filter(function (x) { return x && x.id && x.n; });
  }
  if (!base.equipo.length) base.equipo = EQUIPO_INICIAL.slice();
  base.yo = busca_en(base.equipo, d.yo) ? d.yo : base.equipo[0].id;
  base.clientes.forEach(function (c) {
    if (!c.id) c.id = id();
    if (!busca_en(ESTADOS, c.estado)) c.estado = 'sin';
    if (!busca_en(PRIORIDADES, c.prioridad)) c.prioridad = 'media';
  });
  base.expedientes.forEach(function (e) {
    if (!e.id) e.id = id();
    if (!busca_en(FASES, e.fase)) e.fase = 'doc';
    e.importe = Number(e.importe) || 0;
  });
  base.contactos.forEach(function (c) { if (!c.id) c.id = id(); });
  base.tareas.forEach(function (t) { if (!t.id) t.id = id(); });
  base.llamadas.forEach(function (l) { if (!l.id) l.id = id(); });
  base.facturas.forEach(function (fa) {
    if (!fa.id) fa.id = id();
    if (!busca_en(COBROS, fa.estado)) fa.estado = 'emitida';
    fa.base = Number(fa.base) || 0;
    fa.iva = Number(fa.iva) || 0;
  });
  base.documentos.forEach(function (dc) {
    if (!dc.id) dc.id = id();
    if (!busca_en(EST_DOC, dc.estado)) dc.estado = 'pedido';
  });
  base.objetivos.forEach(function (o) { if (!o.id) o.id = id(); o.meta = Number(o.meta) || 0; });
  return base;
}

var avisoLleno = false;
function guardar() {
  try { localStorage.setItem(LLAVE, JSON.stringify(datos)); }
  catch (e) {
    if (!avisoLleno) { avisoLleno = true; aviso('No se ha podido guardar: el almacén del navegador está lleno. Exporta una copia desde Ajustes.'); }
  }
}

function registra(texto) {
  datos.actividad.unshift({ id: id(), fecha: new Date().toISOString(), texto: texto, quien: datos.yo });
  if (datos.actividad.length > 200) datos.actividad.length = 200;
}

/* -- Consultas ------------------------------------------------- */

function cliente(x) { return busca_en(datos.clientes, x); }
function contacto(x) { return busca_en(datos.contactos, x); }
function expediente(x) { return busca_en(datos.expedientes, x); }
function tarea(x) { return busca_en(datos.tareas, x); }
function llamada(x) { return busca_en(datos.llamadas, x); }
function factura(x) { return busca_en(datos.facturas, x); }
function documento(x) { return busca_en(datos.documentos, x); }
function cobro(x) { return busca_en(COBROS, x) || COBROS[0]; }
function estDoc(x) { return busca_en(EST_DOC, x) || EST_DOC[0]; }
function tipoDoc(x) { var d = busca_en(DOCS, x); return d ? d.n : (x || 'Documento'); }
function totalFactura(fa) { return (Number(fa.base) || 0) + (Number(fa.iva) || 0); }
function porCobrar() { return datos.facturas.filter(function (fa) { return fa.estado === 'emitida'; }); }
function docsPendientes() {
  return datos.documentos.filter(function (dc) { return dc.estado === 'pedido' || dc.estado === 'rechazado'; });
}
function mesActual() { return hoy().slice(0, 7); }

function nombreCliente(x) { var c = cliente(x); return c ? c.nombre : ''; }
function persona(x) { return busca_en(datos.equipo, x); }
function nombrePersona(x) { var p = persona(x); return p ? p.n : ''; }
function yo() { return persona(datos.yo) || datos.equipo[0]; }
function precio(paisId) { return Number(datos.precios[paisId]) || 0; }

function expAbiertos() {
  return datos.expedientes.filter(function (e) { return FASES_ABIERTAS.indexOf(e.fase) >= 0; });
}
function pendientes() { return datos.tareas.filter(function (t) { return !t.hecha; }); }
function vencidas() {
  return pendientes().filter(function (t) { var d = diasHasta(t.vence); return d !== null && d < 0; });
}

/* -- Aviso ----------------------------------------------------- */

var avisoTmr = null;
function aviso(texto, accion, alPulsar) {
  var caja = $('#aviso');
  caja.innerHTML = '<span>' + esc(texto) + '</span>' +
    (accion ? '<button type="button" id="avisoAcc">' + esc(accion) + '</button>' : '');
  caja.hidden = false;
  if (accion) $('#avisoAcc').onclick = function () { caja.hidden = true; if (alPulsar) alPulsar(); };
  clearTimeout(avisoTmr);
  avisoTmr = setTimeout(function () { caja.hidden = true; }, accion ? 8000 : 3600);
}

/* -- Enrutado -------------------------------------------------- */

var VISTAS = ['panel', 'clientes', 'contactos', 'expedientes', 'paises', 'calculadora',
              'facturacion', 'tareas', 'calendario', 'llamadas', 'objetivos',
              'documentos', 'canales', 'usuarios', 'ajustes'];
var vistaActual = 'panel';
var filtro = { clientes: 'todos', expedientes: 'todos', tareas: 'pendientes',
               facturacion: 'todas', documentos: 'pendientes' };
var texto = { clientes: '', contactos: '', expedientes: '' };
var calMes = null;

function ir(v, sinHistoria) {
  if (VISTAS.indexOf(v) < 0) v = 'panel';
  vistaActual = v;
  $$('.mi').forEach(function (b) {
    if (b.dataset.vista === v) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  /* La vista va en el ancla: el botón atrás funciona y se puede enlazar. */
  if (!sinHistoria && location.hash.slice(1) !== v) location.hash = v;
  cerrarMenuMovil();
  cierraFicha();
  pinta();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', function () {
  var v = location.hash.slice(1);
  if (v && v !== vistaActual) ir(v, true);
});

function pinta() {
  var mapa = {
    panel: vPanel, clientes: vClientes, contactos: vContactos, expedientes: vExpedientes,
    paises: vPaises, calculadora: vCalculadora, facturacion: vFacturacion, tareas: vTareas,
    calendario: vCalendario, llamadas: vLlamadas, objetivos: vObjetivos,
    documentos: vDocumentos, canales: vCanales, usuarios: vUsuarios, ajustes: vAjustes
  };
  $('#vistas').innerHTML = (mapa[vistaActual] || vPanel)();
  contadores();
}

function contadores() {
  function pon(k, n, urgente) {
    var e = $('.mi-n[data-cuenta="' + k + '"]');
    if (!e) return;
    e.textContent = n > 0 ? String(n) : '';
    if (urgente) e.dataset.urgente = 'si'; else e.removeAttribute('data-urgente');
  }
  pon('clientes', datos.clientes.length);
  pon('contactos', datos.contactos.length);
  pon('expedientes', expAbiertos().length);
  pon('tareas', pendientes().length, vencidas().length > 0);
  pon('facturacion', porCobrar().length, porCobrar().some(function (fa) {
    var d = diasHasta(fa.vence); return d !== null && d < 0;
  }));
  pon('documentos', docsPendientes().length, datos.documentos.some(function (dc) { return dc.estado === 'rechazado'; }));
  pon('usuarios', datos.equipo.length);
  var av = vencidas().length;
  $('#avisosN').textContent = av > 99 ? '99+' : String(av);
  var y = yo();
  $('#yoIni').textContent = iniciales(y.n);
  $('#yoNom').textContent = y.n;
}

/* -- Cabecera reutilizable ------------------------------------- */

function cab(titulo, sub, acciones) {
  return '<div class="vista-cab"><div>' +
    '<h1 class="vista-t">' + esc(titulo) + '</h1>' +
    '<p class="vista-sub">' + esc(sub) + '</p>' +
  '</div><div class="vista-acc">' + (acciones || '') + '</div></div>';
}

function segmentado(clave, opciones) {
  return '<div class="segm">' + opciones.map(function (o) {
    return '<button data-filtro="' + esc(clave) + '" data-valor="' + esc(o.id) + '"' +
      ' aria-pressed="' + (filtro[clave] === o.id) + '">' + esc(o.n) +
      (o.n_ ? '<em>' + o.n_ + '</em>' : '') + '</button>';
  }).join('') + '</div>';
}

function barraBusqueda(clave, marcador, extra) {
  return '<div class="filtros">' +
    '<div class="buscar"><svg viewBox="0 0 20 20"><circle cx="8.75" cy="8.75" r="5.25"/><path d="m12.6 12.6 4 4"/></svg>' +
    '<input type="search" data-texto="' + esc(clave) + '" value="' + esc(texto[clave] || '') +
    '" placeholder="' + esc(marcador) + '" aria-label="Buscar" autocomplete="off"></div>' +
    (extra || '') + '</div>';
}

function vacio(icono, titulo, parrafo, acciones) {
  return '<div class="vacio">' + icono +
    '<p class="vacio-t">' + esc(titulo) + '</p>' +
    '<p class="vacio-p">' + esc(parrafo) + '</p>' +
    (acciones ? '<div class="vacio-acc">' + acciones + '</div>' : '') + '</div>';
}

var I_CLIENTE = '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.4 19a5.6 5.6 0 0 1 11.2 0"/><path d="M16.2 6.2a2.9 2.9 0 0 1 0 5.6"/><path d="M17.6 19h3a4.7 4.7 0 0 0-3.1-4.4"/></svg>';
var I_EXP = '<svg viewBox="0 0 24 24"><path d="M5 3.5h8l6 5.5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/><path d="M13 3.5V9h6"/><path d="M8 14h8M8 17h5"/></svg>';
var I_TAREA = '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/><path d="m8.5 14.5 2.2 2.2 4.3-4.4"/></svg>';
var I_TEL = '<svg viewBox="0 0 24 24"><path d="M7.5 3.8 9.6 7.4 7.6 9.6a11.5 11.5 0 0 0 6.1 6.1l2.2-2 3.6 2.1-.5 2.9a1.7 1.7 0 0 1-2 1.4C10.2 18.9 5.1 13.8 3.6 6.3a1.7 1.7 0 0 1 1.4-2Z"/></svg>';
var I_MAS = '<svg viewBox="0 0 20 20"><path d="M10 4.5v11M4.5 10h11"/></svg>';

/* -- Panel ----------------------------------------------------- */

function vPanel() {
  var todoVacio = !datos.clientes.length && !datos.expedientes.length && !datos.tareas.length;

  var h = '<div class="vista">' + cab('Panel', 'Resumen general de la actividad',
    '<button class="btn btn-suave btn-sm" data-nuevo="cliente">' + I_MAS + '<span>Nuevo cliente</span></button>');

  if (todoVacio) {
    h += vacio(I_CLIENTE, 'Aún no hay nada dentro',
      'El CRM empieza vacío a propósito: no trae clientes de ejemplo que luego haya que ir borrando. Da de alta el primer cliente y el resto cuelga de ahí.',
      '<button class="btn btn-tinta" data-nuevo="cliente">' + I_MAS + '<span>Nuevo cliente</span></button>' +
      '<button class="btn btn-linea" data-ir="ajustes">Importar datos</button>');
    return h + '</div>';
  }

  var ab = expAbiertos();
  var cartera = ab.reduce(function (s, e) { return s + (Number(e.importe) || 0); }, 0);
  var mes = hoy().slice(0, 7);
  var cerradosMes = datos.expedientes.filter(function (e) {
    return e.fase === 'const' && String(e.cerrado || '').slice(0, 7) === mes;
  });
  var facturadoMes = cerradosMes.reduce(function (s, e) { return s + (Number(e.importe) || 0); }, 0);
  var venc = vencidas().length;
  var nuevosMes = datos.clientes.filter(function (c) { return String(c.creado || '').slice(0, 7) === mes; }).length;

  h += '<div class="kpis">' +
    kpi(I_CLIENTE, 'Clientes', String(datos.clientes.length), nuevosMes ? '<b>+' + nuevosMes + '</b> este mes' : 'ninguno nuevo este mes') +
    kpi(I_EXP, 'Expedientes abiertos', String(ab.length), esc(euros(cartera)) + ' en cartera') +
    kpi(I_EXP, 'Constituidas este mes', String(cerradosMes.length), esc(euros(facturadoMes)) + ' facturado') +
    kpi(I_TAREA, 'Tareas pendientes', String(pendientes().length),
        venc ? '<b class="baja">' + venc + '</b> ' + (venc === 1 ? 'vencida' : 'vencidas') : 'ninguna vencida') +
  '</div>';

  h += '<div class="rejilla">' + cajaExpedientesMes() + cajaPorPais() + '</div>';
  h += '<div class="rejilla" style="margin-top:14px">' + cajaTareas() + cajaActividad() + '</div>';
  return h + '</div>';
}

function kpi(icono, etiqueta, num, pie) {
  return '<div class="kpi"><p class="kpi-e">' + icono + esc(etiqueta) + '</p>' +
    '<p class="kpi-n">' + esc(num) + '</p><p class="kpi-d">' + pie + '</p></div>';
}

/* Seis meses de expedientes abiertos, dibujados con divs. Una libreria
   de graficos para seis barras seria mas peso que codigo. */
function cajaExpedientesMes() {
  var ahora = new Date(hoy() + 'T00:00:00');
  var meses = [];
  for (var i = 5; i >= 0; i--) {
    var d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    meses.push({ clave: d.getFullYear() + '-' + pad(d.getMonth() + 1), etq: MESES_C[d.getMonth()], n: 0 });
  }
  datos.expedientes.forEach(function (e) {
    var k = String(e.abierto || e.creado || '').slice(0, 7);
    for (var i = 0; i < meses.length; i++) if (meses[i].clave === k) meses[i].n++;
  });
  var max = Math.max.apply(null, meses.map(function (m) { return m.n; }).concat([1]));
  var total = meses.reduce(function (s, m) { return s + m.n; }, 0);

  return '<div class="caja"><div class="caja-cab">' +
      '<h2 class="caja-t">Expedientes abiertos <small>/ mes</small></h2>' +
      '<span class="pill">' + total + ' en 6 meses</span>' +
    '</div><div class="barras">' +
    meses.map(function (m) {
      var alto = m.n ? Math.max(8, Math.round(m.n / max * 128)) : 3;
      return '<div class="barra"><div class="barra-t' + (m.n ? ' lleno' : '') + '" style="height:' + alto + 'px">' +
        (m.n ? '<b>' + m.n + '</b>' : '') + '</div><span class="barra-l">' + esc(m.etq) + '</span></div>';
    }).join('') +
    '</div><p class="barras-pie">Se cuenta por la fecha de apertura del expediente.</p></div>';
}

function cajaPorPais() {
  var cuenta = {};
  datos.expedientes.forEach(function (e) { if (e.pais) cuenta[e.pais] = (cuenta[e.pais] || 0) + 1; });
  var filas = PAISES.map(function (p) { return { p: p, n: cuenta[p.id] || 0 }; })
    .filter(function (x) { return x.n > 0; })
    .sort(function (a, b) { return b.n - a.n; });
  var max = filas.length ? filas[0].n : 1;

  var cuerpo = filas.length
    ? '<div class="reparto">' + filas.map(function (x) {
        return '<div class="rep"><span class="cod">' + x.p.b + '</span>' +
          '<span class="rep-n">' + esc(x.p.n) + '</span>' +
          '<span class="rep-b"><i style="width:' + Math.round(x.n / max * 100) + '%"></i></span>' +
          '<span class="rep-v">' + x.n + '</span></div>';
      }).join('') + '</div>'
    : '<div class="vacio vacio-sm"><p class="vacio-t">Sin expedientes</p>' +
      '<p class="vacio-p">Cuando abras el primero verás aquí el reparto por país.</p></div>';

  return '<div class="caja"><div class="caja-cab"><h2 class="caja-t">Por país</h2>' +
    '<button class="btn btn-plano btn-sm" data-ir="paises">Ver precios</button></div>' + cuerpo + '</div>';
}

function cajaTareas() {
  var lista = pendientes().slice().sort(function (a, b) {
    return String(a.vence || '9999').localeCompare(String(b.vence || '9999'));
  }).slice(0, 6);
  var cuerpo = lista.length ? lista.map(filaTarea).join('')
    : '<div class="vacio vacio-sm"><svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>' +
      '<p class="vacio-t">Nada pendiente</p>' +
      '<p class="vacio-p">Cuando anotes una llamada o un seguimiento aparecerá aquí, ordenado por fecha.</p></div>';
  return '<div class="caja"><div class="caja-cab"><h2 class="caja-t">Lo siguiente</h2>' +
    '<button class="btn btn-plano btn-sm" data-nuevo="tarea">Añadir</button></div>' + cuerpo + '</div>';
}

function cajaActividad() {
  var cuerpo = datos.actividad.length
    ? datos.actividad.slice(0, 7).map(function (a) {
        var q = nombrePersona(a.quien);
        return '<div class="fila"><div class="fila-c"><p class="fila-t">' + esc(a.texto) + '</p>' +
          '<p class="fila-s">' + esc(fechaCorta(a.fecha)) + (q ? ' &middot; ' + esc(q) : '') + '</p></div></div>';
      }).join('')
    : '<div class="vacio vacio-sm"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' +
      '<p class="vacio-t">Sin movimiento</p>' +
      '<p class="vacio-p">Aquí se apunta solo lo que hagas tú: altas, cambios de fase y cierres.</p></div>';
  return '<div class="caja"><div class="caja-cab"><h2 class="caja-t">Actividad</h2></div>' + cuerpo + '</div>';
}

function filaTarea(t) {
  var d = diasHasta(t.vence);
  var urge = d !== null && d <= 0 && !t.hecha;
  var ctx = t.clienteId ? nombreCliente(t.clienteId) : '';
  return '<div class="fila' + (t.hecha ? ' hecha' : '') + '">' +
    '<button class="marcar" data-hecha="' + esc(t.id) + '" aria-pressed="' + (t.hecha ? 'true' : 'false') +
      '" aria-label="Marcar como hecha"><svg viewBox="0 0 16 16"><path d="m3 8.5 3.2 3.2L13 5"/></svg></button>' +
    '<button class="fila-c" data-ficha="tarea" data-id="' + esc(t.id) + '">' +
      '<p class="fila-t">' + esc(t.titulo) + '</p>' +
      '<p class="fila-s">' + esc(tipoTarea(t.tipo).n) + (ctx ? ' &middot; ' + esc(ctx) : '') + '</p></button>' +
    (t.vence ? pill(venceTexto(t.vence), urge ? 'p-ro' : '') : '') + '</div>';
}

/* -- Clientes -------------------------------------------------- */

function vClientes() {
  var h = '<div class="vista">' + cab('Clientes', 'Gestiona los clientes y sus interacciones',
    '<button class="btn btn-suave btn-sm" data-ir="tareas">Tareas</button>' +
    '<button class="btn btn-tinta btn-sm" data-nuevo="cliente">' + I_MAS + '<span>Añadir</span></button>');

  if (!datos.clientes.length) {
    return h + vacio(I_CLIENTE, 'Ningún cliente todavía',
      'La ficha del cliente es el centro: de ella cuelgan los contactos, los expedientes y las tareas.',
      '<button class="btn btn-tinta" data-nuevo="cliente">' + I_MAS + '<span>Nuevo cliente</span></button>') + '</div>';
  }

  var ops = [
    { id: 'todos', n: 'Todos', n_: datos.clientes.length },
    { id: 'mios', n: 'Míos', n_: datos.clientes.filter(function (c) { return c.asignado === datos.yo; }).length }
  ];
  ESTADOS.forEach(function (e) {
    var n = datos.clientes.filter(function (c) { return c.estado === e.id; }).length;
    ops.push({ id: e.id, n: e.n, n_: n });
  });
  h += segmentado('clientes', ops);
  h += barraBusqueda('clientes', 'Buscar por nombre, correo o teléfono');

  var q = (texto.clientes || '').toLowerCase();
  var lista = datos.clientes.filter(function (c) {
    if (filtro.clientes === 'mios') { if (c.asignado !== datos.yo) return false; }
    else if (filtro.clientes !== 'todos' && c.estado !== filtro.clientes) return false;
    if (!q) return true;
    return [c.nombre, c.email, c.tel, c.empresa].some(function (v) {
      return String(v || '').toLowerCase().indexOf(q) >= 0;
    });
  }).sort(function (a, b) { return String(b.creado || '').localeCompare(String(a.creado || '')); });

  if (!lista.length) {
    return h + '<div class="tabla"><div class="vacio vacio-sm"><p class="vacio-t">Nada coincide</p>' +
      '<p class="vacio-p">Prueba con otro filtro o borra la búsqueda.</p></div></div></div>';
  }

  h += '<div class="tabla"><div class="tabla-desb"><table><thead><tr>' +
    '<th>Cliente</th><th>Teléfono</th><th>País</th><th>Estado</th><th>Prioridad</th><th>Asignado</th><th>Creado</th>' +
    '</tr></thead><tbody>';
  lista.forEach(function (c) {
    var p = pais(c.pais);
    h += '<tr data-ficha="cliente" data-id="' + esc(c.id) + '">' +
      '<td><div class="cel"><span class="ini">' + esc(iniciales(c.nombre)) + '</span><div class="cel-txt">' +
        '<div class="td-p">' + esc(c.nombre) + '</div>' +
        (c.empresa || c.email ? '<div class="td-s">' + esc(c.empresa || c.email) + '</div>' : '') +
      '</div></div></td>' +
      '<td class="td-t">' + esc(c.tel || '—') + '</td>' +
      '<td class="td-t">' + (p ? '<span class="cod">' + p.b + '</span> ' + esc(p.n) : '—') + '</td>' +
      '<td>' + pill(estado(c.estado).n, estado(c.estado).c) + '</td>' +
      '<td>' + pill(prioridad(c.prioridad).n, prioridad(c.prioridad).c) + '</td>' +
      '<td>' + (c.asignado && persona(c.asignado)
        ? '<span class="cel"><span class="ini ini-sm">' + esc(iniciales(nombrePersona(c.asignado))) + '</span>' +
          '<span class="td-t">' + esc(nombrePersona(c.asignado)) + '</span></span>'
        : '<span class="td-t">—</span>') + '</td>' +
      '<td class="td-t">' + esc(fechaCorta(c.creado)) + '</td></tr>';
  });
  return h + '</tbody></table></div></div></div>';
}

/* -- Contactos ------------------------------------------------- */

function vContactos() {
  var h = '<div class="vista">' + cab('Contactos', 'Las personas con las que hablas en cada cliente',
    '<button class="btn btn-tinta btn-sm" data-nuevo="contacto">' + I_MAS + '<span>Añadir</span></button>');

  if (!datos.contactos.length) {
    return h + vacio(I_CLIENTE, 'Ningún contacto',
      datos.clientes.length ? 'Añade las personas con las que hablas de verdad en cada cliente.'
        : 'Conviene crear antes el cliente: así el contacto queda colgado de su ficha.',
      '<button class="btn btn-tinta" data-nuevo="' + (datos.clientes.length ? 'contacto' : 'cliente') + '">' + I_MAS +
      '<span>' + (datos.clientes.length ? 'Nuevo contacto' : 'Nuevo cliente') + '</span></button>') + '</div>';
  }

  h += barraBusqueda('contactos', 'Buscar por nombre, cargo o correo');
  var q = (texto.contactos || '').toLowerCase();
  var lista = datos.contactos.filter(function (c) {
    if (!q) return true;
    return [c.nombre, c.cargo, c.email, nombreCliente(c.clienteId)].some(function (v) {
      return String(v || '').toLowerCase().indexOf(q) >= 0;
    });
  }).sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre), 'es'); });

  if (!lista.length) {
    return h + '<div class="tabla"><div class="vacio vacio-sm"><p class="vacio-t">Nada coincide</p></div></div></div>';
  }

  h += '<div class="tabla"><div class="tabla-desb"><table><thead><tr>' +
    '<th>Nombre</th><th>Cliente</th><th>Correo</th><th>Teléfono</th></tr></thead><tbody>';
  lista.forEach(function (c) {
    h += '<tr data-ficha="contacto" data-id="' + esc(c.id) + '">' +
      '<td><div class="cel"><span class="ini">' + esc(iniciales(c.nombre)) + '</span><div class="cel-txt">' +
        '<div class="td-p">' + esc(c.nombre) + '</div>' +
        (c.cargo ? '<div class="td-s">' + esc(c.cargo) + '</div>' : '') + '</div></div></td>' +
      '<td class="td-t">' + esc(nombreCliente(c.clienteId) || '—') + '</td>' +
      '<td class="td-t">' + esc(c.email || '—') + '</td>' +
      '<td class="td-t">' + esc(c.tel || '—') + '</td></tr>';
  });
  return h + '</tbody></table></div></div></div>';
}

/* -- Expedientes ----------------------------------------------- */

function vExpedientes() {
  var h = '<div class="vista">' + cab('Expedientes', 'Cada constitución, desde la documentación hasta el registro',
    '<button class="btn btn-tinta btn-sm" data-nuevo="expediente">' + I_MAS + '<span>Nuevo expediente</span></button>');

  if (!datos.expedientes.length) {
    return h + vacio(I_EXP, 'Ningún expediente',
      'Un expediente es una constitución concreta: qué cliente, en qué país, por cuánto y en qué fase está.',
      '<button class="btn btn-tinta" data-nuevo="expediente">' + I_MAS + '<span>Nuevo expediente</span></button>') + '</div>';
  }

  var ops = [{ id: 'todos', n: 'Todos', n_: datos.expedientes.length }];
  FASES.forEach(function (f) {
    ops.push({ id: f.id, n: f.n, n_: datos.expedientes.filter(function (e) { return e.fase === f.id; }).length });
  });
  h += segmentado('expedientes', ops);
  h += barraBusqueda('expedientes', 'Buscar por cliente o referencia');

  var q = (texto.expedientes || '').toLowerCase();
  var lista = datos.expedientes.filter(function (e) {
    if (filtro.expedientes !== 'todos' && e.fase !== filtro.expedientes) return false;
    if (!q) return true;
    return [nombreCliente(e.clienteId), e.ref, (pais(e.pais) || {}).n].some(function (v) {
      return String(v || '').toLowerCase().indexOf(q) >= 0;
    });
  }).sort(function (a, b) { return String(b.abierto || '').localeCompare(String(a.abierto || '')); });

  if (!lista.length) {
    return h + '<div class="tabla"><div class="vacio vacio-sm"><p class="vacio-t">Nada coincide</p></div></div></div>';
  }

  var suma = lista.reduce(function (s, e) { return s + (Number(e.importe) || 0); }, 0);
  h += '<div class="tabla"><div class="tabla-desb"><table><thead><tr>' +
    '<th>Cliente</th><th>País</th><th>Referencia</th><th>Fase</th><th>Abierto</th><th class="td-num">Importe</th>' +
    '</tr></thead><tbody>';
  lista.forEach(function (e) {
    var p = pais(e.pais);
    h += '<tr data-ficha="expediente" data-id="' + esc(e.id) + '">' +
      '<td><div class="cel"><span class="ini">' + esc(iniciales(nombreCliente(e.clienteId) || '?')) + '</span>' +
        '<div class="cel-txt"><div class="td-p">' + esc(nombreCliente(e.clienteId) || 'Sin cliente') + '</div></div></div></td>' +
      '<td class="td-t">' + (p ? '<span class="cod">' + p.b + '</span> ' + esc(p.n) : '—') + '</td>' +
      '<td class="td-t">' + esc(e.ref || '—') + '</td>' +
      '<td>' + pill(fase(e.fase).n, fase(e.fase).c) + '</td>' +
      '<td class="td-t">' + esc(fechaCorta(e.abierto)) + '</td>' +
      '<td class="td-num">' + esc(e.importe ? euros(e.importe) : '—') + '</td></tr>';
  });
  h += '</tbody></table></div></div>';
  h += '<p class="pista" style="margin-top:10px">' + lista.length + ' expedientes en la vista, ' + esc(euros(suma)) + ' en total.</p>';
  return h + '</div>';
}

/* -- Países y precios ------------------------------------------ */

function vPaises() {
  var h = '<div class="vista">' + cab('Países y precios', 'Los ocho destinos que ofrece Filnet',
    '<button class="btn btn-suave btn-sm" data-ir="calculadora">Calculadora</button>');

  var sinPrecio = PAISES.filter(function (p) { return !precio(p.id); }).length;
  if (sinPrecio) {
    h += '<p class="pista" style="margin-bottom:14px">' +
      (sinPrecio === PAISES.length ? 'Todavía no hay ningún precio puesto.' : 'Faltan ' + sinPrecio + ' precios por poner.') +
      ' Los precios no se inventan: pulsa un país y escribe el tuyo.</p>';
  }

  h += '<div class="paises">' + PAISES.map(function (p) {
    var pr = precio(p.id);
    var abiertos = datos.expedientes.filter(function (e) { return e.pais === p.id && FASES_ABIERTAS.indexOf(e.fase) >= 0; }).length;
    var hechos = datos.expedientes.filter(function (e) { return e.pais === p.id && e.fase === 'const'; }).length;
    return '<button class="pais" data-precio="' + esc(p.id) + '">' +
      '<div class="pais-cab"><span class="cod">' + p.b + '</span><span class="pais-n">' + esc(p.n) + '</span></div>' +
      '<p class="pais-p">' + (pr ? esc(euros(pr)) : '<span style="color:var(--tenue);font-size:15px;font-weight:500">Sin precio</span>') + '</p>' +
      '<p class="pais-d">' + (pr ? 'desde, por constitución' : 'pulsa para ponerlo') + '</p>' +
      '<div class="pais-m">' + (abiertos ? pill(abiertos + ' abiertos', 'p-am') : '') +
        (hechos ? pill(hechos + ' constituidas', 'p-ve') : '') + '</div>' +
    '</button>';
  }).join('') + '</div>';
  return h + '</div>';
}

/* -- Calculadora ----------------------------------------------- */

var calc = { pais: 'es', gestoria: 0, extras: 0 };

function vCalculadora() {
  var pr = precio(calc.pais);
  var total = pr + (Number(calc.gestoria) || 0) * 12 + (Number(calc.extras) || 0);

  var h = '<div class="vista">' + cab('Calculadora', 'Presupuesto rápido para un cliente', '');
  h += '<div class="calc"><div>' +
    '<div class="campo"><label for="c_pais">País</label><select id="c_pais" data-calc="pais">' +
      PAISES.map(function (p) {
        return '<option value="' + p.id + '"' + (calc.pais === p.id ? ' selected' : '') + '>' +
          esc(p.n) + (precio(p.id) ? ' — ' + euros(precio(p.id)) : ' — sin precio') + '</option>';
      }).join('') +
    '</select></div>' +
    '<div class="campo" style="margin-top:13px"><label for="c_gest">Gestoría mensual (€)</label>' +
      '<input id="c_gest" type="number" min="0" step="any" inputmode="decimal" data-calc="gestoria" value="' + esc(calc.gestoria || '') + '"></div>' +
    '<div class="campo" style="margin-top:13px"><label for="c_extra">Extras de una vez (€)</label>' +
      '<input id="c_extra" type="number" min="0" step="any" inputmode="decimal" data-calc="extras" value="' + esc(calc.extras || '') + '"></div>' +
    '<p class="pista" style="margin-top:13px">La gestoría se calcula a doce meses. Si el país no tiene precio, ponlo primero en ' +
    '<button class="btn btn-plano btn-sm" data-ir="paises" style="padding:0 2px">Países y precios</button>.</p>' +
  '</div>' +
  '<div class="calc-r"><p class="kpi-e">Primer año</p>' +
    '<p class="calc-tot">' + esc(euros(total)) + '</p>' +
    '<p class="calc-l" style="border:0;padding-top:0"><span>' + esc((pais(calc.pais) || {}).n || '') + '</span></p>' +
    '<div style="margin-top:12px">' +
      '<p class="calc-l"><span>Constitución</span><b>' + esc(pr ? euros(pr) : 'sin precio') + '</b></p>' +
      '<p class="calc-l"><span>Gestoría (12 meses)</span><b>' + esc(euros((Number(calc.gestoria) || 0) * 12)) + '</b></p>' +
      '<p class="calc-l"><span>Extras</span><b>' + esc(euros(Number(calc.extras) || 0)) + '</b></p>' +
    '</div></div></div>';
  return h + '</div>';
}

/* -- Tareas ---------------------------------------------------- */

function vTareas() {
  var v = vencidas().length;
  var h = '<div class="vista">' + cab('Tareas',
    pendientes().length + ' pendientes' + (v ? ', ' + v + (v === 1 ? ' vencida' : ' vencidas') : ''),
    '<button class="btn btn-tinta btn-sm" data-nuevo="tarea">' + I_MAS + '<span>Nueva tarea</span></button>');

  if (!datos.tareas.length) {
    return h + vacio(I_TAREA, 'Sin tareas',
      'Una tarea es un compromiso con fecha: llamar el martes, pedir el pasaporte antes del viernes. Lo que no tiene fecha se olvida.',
      '<button class="btn btn-tinta" data-nuevo="tarea">' + I_MAS + '<span>Nueva tarea</span></button>') + '</div>';
  }

  h += segmentado('tareas', [
    { id: 'pendientes', n: 'Pendientes', n_: pendientes().length },
    { id: 'hechas', n: 'Hechas', n_: datos.tareas.length - pendientes().length },
    { id: 'todas', n: 'Todas', n_: datos.tareas.length }
  ]);

  var lista = datos.tareas.filter(function (t) {
    if (filtro.tareas === 'pendientes') return !t.hecha;
    if (filtro.tareas === 'hechas') return t.hecha;
    return true;
  }).sort(function (a, b) {
    if (!!a.hecha !== !!b.hecha) return a.hecha ? 1 : -1;
    return String(a.vence || '9999').localeCompare(String(b.vence || '9999'));
  });

  h += '<div class="tabla" style="margin-top:16px">' +
    (lista.length ? lista.map(filaTarea).join('')
      : '<div class="vacio vacio-sm"><p class="vacio-t">Nada en este filtro</p></div>') + '</div>';
  return h + '</div>';
}

/* -- Calendario ------------------------------------------------ */

function vCalendario() {
  var base = calMes ? new Date(calMes + '-01T00:00:00') : new Date(hoy() + 'T00:00:00');
  var anyo = base.getFullYear(), mes = base.getMonth();
  var primero = new Date(anyo, mes, 1);
  var arranque = (primero.getDay() + 6) % 7;            /* la semana empieza en lunes */
  var dias = new Date(anyo, mes + 1, 0).getDate();
  var previos = new Date(anyo, mes, 0).getDate();

  var porDia = {};
  datos.tareas.forEach(function (t) {
    if (!t.vence) return;
    var k = String(t.vence).slice(0, 10);
    (porDia[k] = porDia[k] || []).push(t);
  });

  var h = '<div class="vista">' + cab('Calendario', 'Las tareas con fecha, mes a mes',
    '<button class="btn btn-tinta btn-sm" data-nuevo="tarea">' + I_MAS + '<span>Nueva tarea</span></button>');

  h += '<div class="cal"><div class="cal-cab">' +
    '<span class="cal-mes">' + esc(MESES[mes] + ' ' + anyo) + '</span>' +
    '<span style="display:flex;gap:6px">' +
      '<button class="btn btn-suave btn-sm" data-mes="-1" aria-label="Mes anterior">&larr;</button>' +
      '<button class="btn btn-suave btn-sm" data-mes="0">Hoy</button>' +
      '<button class="btn btn-suave btn-sm" data-mes="1" aria-label="Mes siguiente">&rarr;</button>' +
    '</span></div>' +
    '<div class="cal-dias">' + ['lun','mar','mié','jue','vie','sáb','dom'].map(function (d) {
      return '<span>' + d + '</span>';
    }).join('') + '</div><div class="cal-rej">';

  var hoyISO = hoy();
  for (var i = 0; i < 42; i++) {
    var num, clase = 'cal-c', iso = null;
    if (i < arranque) { num = previos - arranque + i + 1; clase += ' fuera'; }
    else if (i - arranque < dias) {
      num = i - arranque + 1;
      iso = anyo + '-' + pad(mes + 1) + '-' + pad(num);
      if (iso === hoyISO) clase += ' hoy';
    } else { num = i - arranque - dias + 1; clase += ' fuera'; }

    h += '<div class="' + clase + '"><span class="cal-n">' + num + '</span>';
    if (iso && porDia[iso]) {
      porDia[iso].slice(0, 3).forEach(function (t) {
        var vence = !t.hecha && diasHasta(t.vence) <= 0;
        h += '<button class="cal-e' + (vence ? ' vence' : '') + '" data-ficha="tarea" data-id="' + esc(t.id) + '">' +
          esc(t.titulo) + '</button>';
      });
      if (porDia[iso].length > 3) h += '<span class="fila-s">+' + (porDia[iso].length - 3) + ' más</span>';
    }
    h += '</div>';
    if (i >= arranque + dias && (i + 1) % 7 === 0) break;
  }
  return h + '</div></div></div>';
}

/* -- Llamadas -------------------------------------------------- */

function vLlamadas() {
  var h = '<div class="vista">' + cab('Llamadas', 'El registro de lo que se ha hablado',
    '<button class="btn btn-tinta btn-sm" data-nuevo="llamada">' + I_MAS + '<span>Anotar llamada</span></button>');

  if (!datos.llamadas.length) {
    return h + vacio(I_TEL, 'Ninguna llamada anotada',
      'Anotar de qué se habló y en qué quedasteis es lo que hace que la siguiente llamada empiece donde acabó la anterior.',
      '<button class="btn btn-tinta" data-nuevo="llamada">' + I_MAS + '<span>Anotar llamada</span></button>') + '</div>';
  }

  var lista = datos.llamadas.slice().sort(function (a, b) {
    return String(b.fecha || '').localeCompare(String(a.fecha || ''));
  });
  h += '<div class="tabla">' + lista.map(function (l) {
    return '<button class="fila" data-ficha="llamada" data-id="' + esc(l.id) + '">' +
      '<span class="ini ini-sm">' + esc(iniciales(nombreCliente(l.clienteId) || '?')) + '</span>' +
      '<span class="fila-c"><span class="fila-t">' + esc(nombreCliente(l.clienteId) || 'Sin cliente') + '</span>' +
      '<span class="fila-s">' + esc(l.resumen || 'sin resumen') + '</span></span>' +
      (l.minutos ? pill(l.minutos + ' min') : '') +
      '<span class="td-t">' + esc(fechaCorta(l.fecha)) + '</span></button>';
  }).join('') + '</div>';
  return h + '</div>';
}

/* -- Ajustes --------------------------------------------------- */

function vAjustes() {
  var total = datos.clientes.length + datos.contactos.length + datos.expedientes.length +
              datos.tareas.length + datos.llamadas.length;
  var bytes = 0;
  try { bytes = new Blob([JSON.stringify(datos)]).size; } catch (e) {}

  return '<div class="vista">' + cab('Ajustes', total + ' registros, ' + Math.max(1, Math.round(bytes / 1024)) + ' KB', '') +
  '<div class="ajustes">' +

  '<div class="aj"><h2 class="aj-t">Dónde están tus datos</h2>' +
    '<p class="aj-p">En el almacén de este navegador, en este equipo. No se envían a ningún servidor: no hay servidor. ' +
    'Eso significa que <strong>no los verás en otro dispositivo</strong>, y que si borras los datos de navegación se van con ellos. ' +
    'La copia de seguridad no es opcional.</p>' +
    '<div class="aj-acc">' +
      '<button class="btn btn-tinta btn-sm" id="expJson"><svg viewBox="0 0 20 20"><path d="M10 3v10M6 9.5l4 4 4-4M4 17h12"/></svg><span>Descargar copia</span></button>' +
      '<button class="btn btn-linea btn-sm" id="impJson">Restaurar copia</button>' +
      '<input type="file" id="ficheroJson" accept="application/json,.json" hidden></div></div>' +

  '<div class="aj"><h2 class="aj-t">Exportar a hoja de cálculo</h2>' +
    '<p class="aj-p">Un CSV por tabla, con separador de coma y codificación UTF-8. Se abren en Excel, Numbers y Google Sheets.</p>' +
    '<div class="aj-acc">' +
      '<button class="btn btn-linea btn-sm" data-csv="clientes">Clientes</button>' +
      '<button class="btn btn-linea btn-sm" data-csv="contactos">Contactos</button>' +
      '<button class="btn btn-linea btn-sm" data-csv="expedientes">Expedientes</button>' +
      '<button class="btn btn-linea btn-sm" data-csv="tareas">Tareas</button>' +
      '<button class="btn btn-linea btn-sm" data-csv="llamadas">Llamadas</button></div></div>' +

  '<div class="aj"><h2 class="aj-t">Quién puede entrar</h2>' +
    '<p class="aj-p">' + window.Acceso.cuantos() + ' de ' + datos.equipo.length + ' personas tienen acceso. ' +
    'Cada una entra con su usuario y su contrase\u00f1a, y el trabajo queda a su nombre. ' +
    'La contrase\u00f1a no se guarda en ning\u00fan sitio: lo que viaja es PBKDF2-SHA256 con 250.000 vueltas ' +
    'y sal propia.</p>' +
    '<p class="aj-p"><strong>El registro est\u00e1 cerrado.</strong> No hay ninguna pantalla para darse de alta: ' +
    'la lista vive en <code>assets/equipo.js</code> y se publica con la aplicaci\u00f3n. ' +
    'A\u00f1adir a alguien, quitarlo o cambiarle la contrase\u00f1a exige regenerar ese fichero y volver a publicar.</p>' +
    '<p class="aj-p"><strong>Dicho claro: esto es una puerta, no una caja fuerte.</strong> La contrase\u00f1a ' +
    'se comprueba en el navegador, no en un servidor, as\u00ed que alguien t\u00e9cnico puede salt\u00e1rsela con las ' +
    'herramientas de desarrollo, y quien descargue la p\u00e1gina puede intentar adivinarlas sin l\u00edmite. ' +
    'Frena a quien pase por delante de un ordenador abierto. Para seguridad de verdad hace falta un ' +
    'servidor con autenticaci\u00f3n.</p>' +
    '<div class="tabla" style="margin-bottom:13px">' + datos.equipo.map(function (p) {
      return '<div class="fila"><span class="ini ini-sm">' + esc(iniciales(p.n)) + '</span>' +
        '<span class="fila-c"><span class="fila-t">' + esc(p.n) +
        (p.id === datos.yo ? ' ' + pill('t\u00fa', 'p-tinta') : '') + '</span></span>' +
        (window.Acceso.tieneClave(p.id) ? pill('con acceso', 'p-ve') : pill('sin acceso')) +
      '</div>';
    }).join('') + '</div>' +
    '<div class="aj-acc"><button class="btn btn-suave btn-sm" id="salirSesion">Cerrar sesi\u00f3n</button></div></div>' +

  '<div class="aj aj-peligro"><h2 class="aj-t">Vaciar</h2>' +
    '<p class="aj-p">Borra los ' + total + ' registros de este navegador. No hay papelera y no se puede deshacer: descarga la copia antes.</p>' +
    '<div class="aj-acc"><button class="btn btn-peligro btn-sm" id="vaciar">Borrarlo todo</button></div></div>' +

  '</div></div>';
}

/* -- Facturación ----------------------------------------------- */

var I_FACT = '<svg viewBox="0 0 24 24"><path d="M5.5 3h13v18l-2.6-1.7-2.6 1.7-2.6-1.7L8.1 21l-2.6-1.7Z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/></svg>';

function vFacturacion() {
  var h = '<div class="vista">' + cab('Facturación', 'Lo emitido, lo cobrado y lo que falta por cobrar',
    '<button class="btn btn-tinta btn-sm" data-nuevo="factura">' + I_MAS + '<span>Nueva factura</span></button>');

  if (!datos.facturas.length) {
    return h + vacio(I_FACT, 'Ninguna factura',
      'Cada expediente se factura aquí. Lo emitido y lo cobrado salen solos, sin llevar la cuenta aparte.',
      '<button class="btn btn-tinta" data-nuevo="factura">' + I_MAS + '<span>Nueva factura</span></button>') + '</div>';
  }

  var emitido = datos.facturas.filter(function (f) { return f.estado !== 'anulada'; })
    .reduce(function (s, f) { return s + totalFactura(f); }, 0);
  var cobrado = datos.facturas.filter(function (f) { return f.estado === 'cobrada'; })
    .reduce(function (s, f) { return s + totalFactura(f); }, 0);
  var pend = porCobrar();
  var pendiente = pend.reduce(function (s, f) { return s + totalFactura(f); }, 0);
  var venc = pend.filter(function (f) { var d = diasHasta(f.vence); return d !== null && d < 0; });

  h += '<div class="kpis">' +
    kpi(I_FACT, 'Emitido', euros(emitido), datos.facturas.length + ' facturas') +
    kpi(I_FACT, 'Cobrado', euros(cobrado), emitido ? Math.round(cobrado / emitido * 100) + '% del total' : '—') +
    kpi(I_FACT, 'Por cobrar', euros(pendiente), pend.length + (pend.length === 1 ? ' factura' : ' facturas')) +
    kpi(I_FACT, 'Vencido', euros(venc.reduce(function (s, f) { return s + totalFactura(f); }, 0)),
        venc.length ? '<b class="baja">' + venc.length + '</b> fuera de plazo' : 'ninguna fuera de plazo') +
  '</div>';

  var ops = [{ id: 'todas', n: 'Todas', n_: datos.facturas.length }];
  COBROS.forEach(function (c) {
    ops.push({ id: c.id, n: c.n, n_: datos.facturas.filter(function (f) { return f.estado === c.id; }).length });
  });
  h += segmentado('facturacion', ops);

  var lista = datos.facturas.filter(function (f) {
    return filtro.facturacion === 'todas' || f.estado === filtro.facturacion;
  }).sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); });

  h += '<div class="tabla" style="margin-top:16px"><div class="tabla-desb"><table><thead><tr>' +
    '<th>Número</th><th>Cliente</th><th>Fecha</th><th>Vence</th><th>Estado</th>' +
    '<th class="td-num">Base</th><th class="td-num">Total</th>' +
    '</tr></thead><tbody>';
  lista.forEach(function (f) {
    var d = diasHasta(f.vence);
    var fuera = f.estado === 'emitida' && d !== null && d < 0;
    h += '<tr data-ficha="factura" data-id="' + esc(f.id) + '">' +
      '<td class="td-p">' + esc(f.numero || '—') + '</td>' +
      '<td><div class="cel"><span class="ini ini-sm">' + esc(iniciales(nombreCliente(f.clienteId) || '?')) + '</span>' +
        '<span class="td-t">' + esc(nombreCliente(f.clienteId) || 'Sin cliente') + '</span></div></td>' +
      '<td class="td-t">' + esc(fechaCorta(f.fecha)) + '</td>' +
      '<td class="td-t">' + (f.vence ? (fuera ? pill(venceTexto(f.vence), 'p-ro') : esc(fechaCorta(f.vence))) : '—') + '</td>' +
      '<td>' + pill(cobro(f.estado).n, cobro(f.estado).c) + '</td>' +
      '<td class="td-num">' + esc(euros(f.base)) + '</td>' +
      '<td class="td-num">' + esc(euros(totalFactura(f))) + '</td></tr>';
  });
  return h + '</tbody></table></div></div></div>';
}

/* -- Objetivos ------------------------------------------------- */

var I_OBJ = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.7"/><circle cx="12" cy="12" r="1.2"/></svg>';

function vObjetivos() {
  var mes = mesActual();
  var h = '<div class="vista">' + cab('Objetivos', 'Lo que toca este mes, y por dónde va',
    '<button class="btn btn-tinta btn-sm" data-nuevo="objetivo">' + I_MAS + '<span>Poner objetivo</span></button>');

  var delMes = datos.objetivos.filter(function (o) { return o.mes === mes; });
  if (!delMes.length) {
    return h + vacio(I_OBJ, 'Sin objetivos este mes',
      'Un objetivo es una cifra con nombre y mes: cuántas constituciones o cuánto facturado. Sin eso, "vamos bien" no significa nada.',
      '<button class="btn btn-tinta" data-nuevo="objetivo">' + I_MAS + '<span>Poner objetivo</span></button>') + '</div>';
  }

  h += '<p class="pista" style="margin-bottom:16px">' + esc(MESES[Number(mes.slice(5, 7)) - 1] + ' de ' + mes.slice(0, 4)) + '</p>';
  h += '<div class="tabla"><div class="caja-cuerpo">';
  delMes.forEach(function (o) {
    var real = logrado(o);
    var pct = o.meta > 0 ? Math.min(100, Math.round(real / o.meta * 100)) : 0;
    var cifra = o.tipo === 'importe' ? euros(real) + ' de ' + euros(o.meta) : real + ' de ' + o.meta;
    h += '<button class="fila" data-ficha="objetivo" data-id="' + esc(o.id) + '">' +
      '<span class="ini ini-sm">' + esc(iniciales(nombrePersona(o.personaId) || '?')) + '</span>' +
      '<span class="fila-c"><span class="fila-t">' + esc(nombrePersona(o.personaId) || 'Todo el equipo') + '</span>' +
      '<span class="fila-s">' + esc(o.tipo === 'importe' ? 'Facturado' : 'Constituciones') + ' &middot; ' + esc(cifra) + '</span></span>' +
      '<span class="rep-b" style="width:150px"><i style="width:' + pct + '%"></i></span>' +
      '<span class="rep-v">' + pct + '%</span></button>';
  });
  return h + '</div></div></div>';
}

/* Lo logrado sale de los datos, no se teclea: si se teclea, miente. */
function logrado(o) {
  var mes = o.mes;
  if (o.tipo === 'importe') {
    return datos.facturas.filter(function (f) {
      return f.estado === 'cobrada' && String(f.fecha || '').slice(0, 7) === mes &&
             (!o.personaId || asignadoDe(f) === o.personaId);
    }).reduce(function (s, f) { return s + totalFactura(f); }, 0);
  }
  return datos.expedientes.filter(function (e) {
    return e.fase === 'const' && String(e.cerrado || '').slice(0, 7) === mes &&
           (!o.personaId || e.asignado === o.personaId);
  }).length;
}
function asignadoDe(fa) {
  var e = expediente(fa.expedienteId);
  if (e && e.asignado) return e.asignado;
  var c = cliente(fa.clienteId);
  return c ? c.asignado : '';
}

/* -- Documentos ------------------------------------------------ */

var I_DOC = '<svg viewBox="0 0 24 24"><path d="M5 3.5h8l5.5 5.5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/><path d="M13 3.5V9h5.5"/><path d="m8 14.5 2.2 2.2 4.3-4.4"/></svg>';

function vDocumentos() {
  var h = '<div class="vista">' + cab('Documentos', 'Los papeles de cada expediente, y a quién falta pedirle qué',
    '<button class="btn btn-tinta btn-sm" data-nuevo="documento">' + I_MAS + '<span>Pedir documento</span></button>');

  if (!datos.documentos.length) {
    return h + vacio(I_DOC, 'Ningún documento',
      'Una constitución se atasca casi siempre por un papel que nadie reclamó. Anota cuál pediste, a quién y en qué estado va.',
      '<button class="btn btn-tinta" data-nuevo="documento">' + I_MAS + '<span>Pedir documento</span></button>') + '</div>';
  }

  var ops = [{ id: 'pendientes', n: 'Pendientes', n_: docsPendientes().length },
             { id: 'todos', n: 'Todos', n_: datos.documentos.length }];
  EST_DOC.forEach(function (e) {
    ops.push({ id: e.id, n: e.n, n_: datos.documentos.filter(function (d) { return d.estado === e.id; }).length });
  });
  h += segmentado('documentos', ops);

  var lista = datos.documentos.filter(function (d) {
    if (filtro.documentos === 'todos') return true;
    if (filtro.documentos === 'pendientes') return d.estado === 'pedido' || d.estado === 'rechazado';
    return d.estado === filtro.documentos;
  }).sort(function (a, b) { return String(a.pedido || '').localeCompare(String(b.pedido || '')); });

  h += '<div class="tabla" style="margin-top:16px"><div class="tabla-desb"><table><thead><tr>' +
    '<th>Documento</th><th>Expediente</th><th>Pedido</th><th>Estado</th><th></th>' +
    '</tr></thead><tbody>';
  lista.forEach(function (d) {
    var e = expediente(d.expedienteId);
    var p = e ? pais(e.pais) : null;
    h += '<tr data-ficha="documento" data-id="' + esc(d.id) + '">' +
      '<td class="td-p">' + esc(tipoDoc(d.tipo)) + (d.nota ? '<div class="td-s">' + esc(d.nota) + '</div>' : '') + '</td>' +
      '<td><div class="cel">' + (p ? '<span class="cod">' + esc(p.b) + '</span>' : '') +
        '<span class="td-t">' + esc(e ? nombreCliente(e.clienteId) : 'Sin expediente') + '</span></div></td>' +
      '<td class="td-t">' + esc(fechaCorta(d.pedido)) + '</td>' +
      '<td>' + pill(estDoc(d.estado).n, estDoc(d.estado).c) + '</td>' +
      '<td style="text-align:right">' + (d.estado !== 'validado'
        ? '<button class="btn btn-suave btn-sm" data-valida="' + esc(d.id) + '">Validar</button>' : '') + '</td></tr>';
  });
  return h + '</tbody></table></div></div></div>';
}

/* -- Canales --------------------------------------------------- */

var I_CAN = '<svg viewBox="0 0 24 24"><path d="M4 19.5V11M9.3 19.5V5M14.7 19.5v-9M20 19.5V13"/></svg>';

function vCanales() {
  var h = '<div class="vista">' + cab('Canales', 'De dónde vienen los clientes y cuáles acaban en constitución', '');

  if (!datos.clientes.length) {
    return h + vacio(I_CAN, 'Todavía no hay de dónde medir',
      'Cuando haya clientes con su origen anotado, aquí sale cuál trae más y cuál convierte mejor. No hay nada que estimar: sale de las fichas.') + '</div>';
  }

  var filas = ORIGENES.map(function (o) {
    var cs = datos.clientes.filter(function (c) { return (c.origen || 'Otro') === o; });
    var ganados = cs.filter(function (c) { return c.estado === 'ganado'; }).length;
    var imp = datos.expedientes.filter(function (e) {
      var c = cliente(e.clienteId);
      return c && (c.origen || 'Otro') === o && e.fase === 'const';
    }).reduce(function (s, e) { return s + (Number(e.importe) || 0); }, 0);
    return { n: o, total: cs.length, ganados: ganados, imp: imp };
  }).filter(function (f) { return f.total > 0; }).sort(function (a, b) { return b.total - a.total; });

  var max = filas.length ? filas[0].total : 1;
  h += '<div class="tabla"><div class="tabla-desb"><table><thead><tr>' +
    '<th>Canal</th><th>Clientes</th><th>Ganados</th><th>Conversión</th><th class="td-num">Constituido</th>' +
    '</tr></thead><tbody>';
  filas.forEach(function (f) {
    var pct = f.total ? Math.round(f.ganados / f.total * 100) : 0;
    h += '<tr>' +
      '<td class="td-p">' + esc(f.n) + '</td>' +
      '<td><div class="cel"><span class="rep-b" style="width:110px"><i style="width:' +
        Math.round(f.total / max * 100) + '%"></i></span><span class="td-t">' + f.total + '</span></div></td>' +
      '<td class="td-t">' + f.ganados + '</td>' +
      '<td>' + (f.ganados ? pill(pct + '%', pct >= 30 ? 'p-ve' : '') : '<span class="td-t">—</span>') + '</td>' +
      '<td class="td-num">' + esc(f.imp ? euros(f.imp) : '—') + '</td></tr>';
  });
  h += '</tbody></table></div></div>';
  h += '<p class="pista" style="margin-top:10px">Sale del campo Origen de cada cliente. Los que no lo tengan cuentan como «Otro».</p>';
  return h + '</div>';
}

/* -- Usuarios -------------------------------------------------- */

function vUsuarios() {
  var h = '<div class="vista">' + cab('Usuarios', 'Quién entra al CRM y qué lleva cada uno', '');

  h += '<div class="tabla"><div class="tabla-desb"><table><thead><tr>' +
    '<th>Persona</th><th>Acceso</th><th>Clientes</th><th>Expedientes</th><th>Tareas</th><th class="td-num">En curso</th>' +
    '</tr></thead><tbody>';
  datos.equipo.forEach(function (p) {
    var cs = datos.clientes.filter(function (c) { return c.asignado === p.id; }).length;
    var es = datos.expedientes.filter(function (e) { return e.asignado === p.id; });
    var ab = es.filter(function (e) { return FASES_ABIERTAS.indexOf(e.fase) >= 0; });
    var ts = datos.tareas.filter(function (t) { return !t.hecha && t.clienteId &&
      (cliente(t.clienteId) || {}).asignado === p.id; }).length;
    h += '<tr>' +
      '<td><div class="cel"><span class="ini">' + esc(iniciales(p.n)) + '</span><div class="cel-txt">' +
        '<div class="td-p">' + esc(p.n) + (p.id === datos.yo ? ' ' + pill('tú', 'p-tinta') : '') + '</div>' +
        '<div class="td-s">' + esc(p.id) + '</div></div></div></td>' +
      '<td>' + (window.Acceso.tieneClave(p.id) ? pill('con acceso', 'p-ve') : pill('sin acceso')) + '</td>' +
      '<td class="td-t">' + cs + '</td>' +
      '<td class="td-t">' + es.length + '</td>' +
      '<td class="td-t">' + ts + '</td>' +
      '<td class="td-num">' + esc(ab.reduce(function (s, e) { return s + (Number(e.importe) || 0); }, 0) ?
        euros(ab.reduce(function (s, e) { return s + (Number(e.importe) || 0); }, 0)) : '—') + '</td></tr>';
  });
  h += '</tbody></table></div></div>';
  h += '<p class="pista" style="margin-top:10px"><strong>El registro está cerrado.</strong> Dar acceso a alguien ' +
    'o quitárselo se hace regenerando <code>assets/equipo.js</code> y publicando: no hay forma de darse de alta ' +
    'desde aquí, y es a propósito.</p>';
  return h + '</div>';
}

/* -- Ficha lateral --------------------------------------------- */

function abreFicha(tipo, oid) {
  var mapa = { cliente: fCliente, contacto: fContacto, expediente: fExpediente,
               tarea: fTarea, llamada: fLlamada, factura: fFactura,
               documento: fDocumento, objetivo: fObjetivo };
  var h = mapa[tipo] ? mapa[tipo](oid) : '';
  if (!h) return;
  var c = $('#cajon');
  c.dataset.tipo = tipo; c.dataset.id = oid;
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

function cabFicha(titulo, sub) {
  return '<div class="cajon-cab"><div><h2 class="cajon-t">' + esc(titulo) + '</h2>' +
    (sub ? '<p class="cajon-s">' + sub + '</p>' : '') +
  '</div><button class="cajon-x" data-cerrar aria-label="Cerrar">' +
    '<svg viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8"/></svg></button></div>';
}

function dato(k, v) { return v ? '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>' : ''; }

function fCliente(x) {
  var c = cliente(x);
  if (!c) return '';
  var p = pais(c.pais);
  var cs = datos.contactos.filter(function (o) { return o.clienteId === x; });
  var es = datos.expedientes.filter(function (o) { return o.clienteId === x; });
  var ts = datos.tareas.filter(function (o) { return o.clienteId === x && !o.hecha; });

  var h = cabFicha(c.nombre, pill(estado(c.estado).n, estado(c.estado).c) + ' ' + pill(prioridad(c.prioridad).n, prioridad(c.prioridad).c));
  h += '<div class="cajon-cuerpo">';
  var d = dato('Empresa', c.empresa) + dato('Correo', c.email) + dato('Teléfono', c.tel) +
          dato('País', p ? p.n : '') + dato('Origen', c.origen) +
          dato('Asignado a', nombrePersona(c.asignado)) + dato('Alta', fechaCorta(c.creado));
  if (d) h += '<div class="bloque"><p class="bloque-t">Datos</p><dl class="datos">' + d + '</dl></div>';

  h += '<div class="bloque"><p class="bloque-t">Estado</p><div class="mini">' +
    ESTADOS.filter(function (e) { return e.id !== c.estado; }).map(function (e) {
      return '<button class="btn btn-suave btn-sm" data-estado="' + esc(c.id) + '" data-valor="' + e.id + '">' + esc(e.n) + '</button>';
    }).join('') + '</div></div>';

  h += '<div class="bloque"><p class="bloque-t">Expedientes &middot; ' + es.length + '</p>' +
    (es.length ? es.map(function (e) {
      var pp = pais(e.pais);
      return '<button class="fila" data-ficha="expediente" data-id="' + esc(e.id) + '">' +
        '<span class="cod">' + (pp ? pp.b : '') + '</span>' +
        '<span class="fila-c"><span class="fila-t">' + esc(pp ? pp.n : 'Sin país') + '</span>' +
        '<span class="fila-s">' + esc(fase(e.fase).n) + '</span></span>' +
        '<span class="td-num">' + esc(e.importe ? euros(e.importe) : '—') + '</span></button>';
    }).join('') : '<p class="pista">Ninguno abierto con este cliente.</p>') + '</div>';

  h += '<div class="bloque"><p class="bloque-t">Contactos &middot; ' + cs.length + '</p>' +
    (cs.length ? cs.map(function (o) {
      return '<button class="fila" data-ficha="contacto" data-id="' + esc(o.id) + '">' +
        '<span class="ini ini-sm">' + esc(iniciales(o.nombre)) + '</span>' +
        '<span class="fila-c"><span class="fila-t">' + esc(o.nombre) + '</span>' +
        '<span class="fila-s">' + esc(o.cargo || o.email || '') + '</span></span></button>';
    }).join('') : '<p class="pista">Sin personas anotadas.</p>') + '</div>';

  if (ts.length) h += '<div class="bloque"><p class="bloque-t">Tareas pendientes</p>' + ts.map(filaTarea).join('') + '</div>';
  if (c.notas) h += '<div class="bloque"><p class="bloque-t">Notas</p><p class="nota">' + esc(c.notas) + '</p></div>';

  return h + '</div><div class="cajon-pie">' +
    '<button class="btn btn-suave btn-sm" data-editar="cliente" data-id="' + esc(c.id) + '">Editar</button>' +
    '<button class="btn btn-suave btn-sm" data-nuevo="expediente" data-cliente="' + esc(c.id) + '">Nuevo expediente</button>' +
    '<button class="btn btn-suave btn-sm" data-nuevo="llamada" data-cliente="' + esc(c.id) + '">Anotar llamada</button>' +
    '<button class="btn btn-peligro btn-sm" data-borrar="cliente" data-id="' + esc(c.id) + '">Eliminar</button></div>';
}

function fContacto(x) {
  var c = contacto(x);
  if (!c) return '';
  var h = cabFicha(c.nombre, esc([c.cargo, nombreCliente(c.clienteId)].filter(Boolean).join(' · ')));
  h += '<div class="cajon-cuerpo">';
  var d = dato('Correo', c.email) + dato('Teléfono', c.tel) + dato('Cliente', nombreCliente(c.clienteId));
  if (d) h += '<div class="bloque"><p class="bloque-t">Datos</p><dl class="datos">' + d + '</dl></div>';
  if (c.notas) h += '<div class="bloque"><p class="bloque-t">Notas</p><p class="nota">' + esc(c.notas) + '</p></div>';
  return h + '</div><div class="cajon-pie">' +
    '<button class="btn btn-suave btn-sm" data-editar="contacto" data-id="' + esc(c.id) + '">Editar</button>' +
    (c.clienteId ? '<button class="btn btn-suave btn-sm" data-ficha="cliente" data-id="' + esc(c.clienteId) + '">Ver cliente</button>' : '') +
    '<button class="btn btn-peligro btn-sm" data-borrar="contacto" data-id="' + esc(c.id) + '">Eliminar</button></div>';
}

function fExpediente(x) {
  var e = expediente(x);
  if (!e) return '';
  var p = pais(e.pais);
  var h = cabFicha((p ? p.b + ' ' : '') + (p ? p.n : 'Sin país'),
    esc(nombreCliente(e.clienteId)) + ' &middot; ' + pill(fase(e.fase).n, fase(e.fase).c));
  h += '<div class="cajon-cuerpo"><div class="bloque"><p class="bloque-t">Datos</p><dl class="datos">' +
    dato('Referencia', e.ref) +
    '<dt>Importe</dt><dd>' + esc(e.importe ? euros(e.importe) : 'sin importe') + '</dd>' +
    dato('Abierto', fechaCorta(e.abierto)) + dato('Cerrado', fechaCorta(e.cerrado)) +
  '</dl></div>';

  h += '<div class="bloque"><p class="bloque-t">Mover a</p><div class="mini">' +
    FASES.filter(function (f) { return f.id !== e.fase; }).map(function (f) {
      return '<button class="btn btn-suave btn-sm" data-fase="' + esc(e.id) + '" data-valor="' + f.id + '">' + esc(f.n) + '</button>';
    }).join('') + '</div></div>';

  if (e.notas) h += '<div class="bloque"><p class="bloque-t">Notas</p><p class="nota">' + esc(e.notas) + '</p></div>';
  return h + '</div><div class="cajon-pie">' +
    '<button class="btn btn-suave btn-sm" data-editar="expediente" data-id="' + esc(e.id) + '">Editar</button>' +
    (e.clienteId ? '<button class="btn btn-suave btn-sm" data-ficha="cliente" data-id="' + esc(e.clienteId) + '">Ver cliente</button>' : '') +
    '<button class="btn btn-peligro btn-sm" data-borrar="expediente" data-id="' + esc(e.id) + '">Eliminar</button></div>';
}

function fTarea(x) {
  var t = tarea(x);
  if (!t) return '';
  var h = cabFicha(t.titulo, esc(tipoTarea(t.tipo).n + (t.hecha ? ' · hecha' : '')));
  h += '<div class="cajon-cuerpo"><div class="bloque"><p class="bloque-t">Datos</p><dl class="datos">' +
    dato('Vence', fechaCorta(t.vence)) + dato('Cliente', nombreCliente(t.clienteId)) + '</dl></div>';
  if (t.notas) h += '<div class="bloque"><p class="bloque-t">Notas</p><p class="nota">' + esc(t.notas) + '</p></div>';
  return h + '</div><div class="cajon-pie">' +
    '<button class="btn btn-tinta btn-sm" data-hecha="' + esc(t.id) + '">' + (t.hecha ? 'Reabrir' : 'Marcar hecha') + '</button>' +
    '<button class="btn btn-suave btn-sm" data-editar="tarea" data-id="' + esc(t.id) + '">Editar</button>' +
    '<button class="btn btn-peligro btn-sm" data-borrar="tarea" data-id="' + esc(t.id) + '">Eliminar</button></div>';
}

function fLlamada(x) {
  var l = llamada(x);
  if (!l) return '';
  var h = cabFicha(nombreCliente(l.clienteId) || 'Llamada', esc(fechaCorta(l.fecha)));
  h += '<div class="cajon-cuerpo"><div class="bloque"><p class="bloque-t">Datos</p><dl class="datos">' +
    dato('Duración', l.minutos ? l.minutos + ' min' : '') + dato('Resumen', l.resumen) + '</dl></div>';
  if (l.notas) h += '<div class="bloque"><p class="bloque-t">Notas</p><p class="nota">' + esc(l.notas) + '</p></div>';
  return h + '</div><div class="cajon-pie">' +
    '<button class="btn btn-suave btn-sm" data-editar="llamada" data-id="' + esc(l.id) + '">Editar</button>' +
    (l.clienteId ? '<button class="btn btn-suave btn-sm" data-ficha="cliente" data-id="' + esc(l.clienteId) + '">Ver cliente</button>' : '') +
    '<button class="btn btn-peligro btn-sm" data-borrar="llamada" data-id="' + esc(l.id) + '">Eliminar</button></div>';
}

function fFactura(x) {
  var fa = factura(x);
  if (!fa) return '';
  var h = cabFicha(fa.numero || 'Factura', esc(nombreCliente(fa.clienteId)) + ' &middot; ' + pill(cobro(fa.estado).n, cobro(fa.estado).c));
  h += '<div class="cajon-cuerpo"><div class="bloque"><p class="bloque-t">Importes</p><dl class="datos">' +
    '<dt>Base</dt><dd>' + esc(euros(fa.base)) + '</dd>' +
    '<dt>IVA</dt><dd>' + esc(euros(fa.iva)) + '</dd>' +
    '<dt>Total</dt><dd><strong>' + esc(euros(totalFactura(fa))) + '</strong></dd>' +
    dato('Fecha', fechaCorta(fa.fecha)) + dato('Vence', fechaCorta(fa.vence)) +
    dato('Cobrada el', fechaCorta(fa.cobrada)) +
  '</dl></div>';
  h += '<div class="bloque"><p class="bloque-t">Estado</p><div class="mini">' +
    COBROS.filter(function (c) { return c.id !== fa.estado; }).map(function (c) {
      return '<button class="btn btn-suave btn-sm" data-cobro="' + esc(fa.id) + '" data-valor="' + c.id + '">' + esc(c.n) + '</button>';
    }).join('') + '</div></div>';
  if (fa.notas) h += '<div class="bloque"><p class="bloque-t">Notas</p><p class="nota">' + esc(fa.notas) + '</p></div>';
  return h + '</div><div class="cajon-pie">' +
    '<button class="btn btn-suave btn-sm" data-editar="factura" data-id="' + esc(fa.id) + '">Editar</button>' +
    (fa.clienteId ? '<button class="btn btn-suave btn-sm" data-ficha="cliente" data-id="' + esc(fa.clienteId) + '">Ver cliente</button>' : '') +
    '<button class="btn btn-peligro btn-sm" data-borrar="factura" data-id="' + esc(fa.id) + '">Eliminar</button></div>';
}

function fDocumento(x) {
  var dc = documento(x);
  if (!dc) return '';
  var e = expediente(dc.expedienteId);
  var h = cabFicha(tipoDoc(dc.tipo), (e ? esc(nombreCliente(e.clienteId)) + ' &middot; ' : '') + pill(estDoc(dc.estado).n, estDoc(dc.estado).c));
  h += '<div class="cajon-cuerpo"><div class="bloque"><p class="bloque-t">Datos</p><dl class="datos">' +
    dato('Pedido el', fechaCorta(dc.pedido)) + dato('Recibido el', fechaCorta(dc.recibido)) +
    dato('Expediente', e ? (pais(e.pais) || {}).n : '') + dato('Nota', dc.nota) +
  '</dl></div>';
  h += '<div class="bloque"><p class="bloque-t">Estado</p><div class="mini">' +
    EST_DOC.filter(function (s) { return s.id !== dc.estado; }).map(function (s) {
      return '<button class="btn btn-suave btn-sm" data-estdoc="' + esc(dc.id) + '" data-valor="' + s.id + '">' + esc(s.n) + '</button>';
    }).join('') + '</div></div>';
  return h + '</div><div class="cajon-pie">' +
    '<button class="btn btn-suave btn-sm" data-editar="documento" data-id="' + esc(dc.id) + '">Editar</button>' +
    (e ? '<button class="btn btn-suave btn-sm" data-ficha="expediente" data-id="' + esc(e.id) + '">Ver expediente</button>' : '') +
    '<button class="btn btn-peligro btn-sm" data-borrar="documento" data-id="' + esc(dc.id) + '">Eliminar</button></div>';
}

function fObjetivo(x) {
  var o = busca_en(datos.objetivos, x);
  if (!o) return '';
  var real = logrado(o);
  var pct = o.meta > 0 ? Math.round(real / o.meta * 100) : 0;
  var h = cabFicha(nombrePersona(o.personaId) || 'Todo el equipo',
    esc(MESES[Number(o.mes.slice(5, 7)) - 1] + ' de ' + o.mes.slice(0, 4)));
  h += '<div class="cajon-cuerpo"><div class="bloque"><p class="bloque-t">Cómo va</p><dl class="datos">' +
    '<dt>Objetivo</dt><dd>' + esc(o.tipo === 'importe' ? euros(o.meta) : o.meta + ' constituciones') + '</dd>' +
    '<dt>Logrado</dt><dd>' + esc(o.tipo === 'importe' ? euros(real) : String(real)) + '</dd>' +
    '<dt>Va por</dt><dd><strong>' + pct + '%</strong></dd>' +
  '</dl></div><p class="pista">Lo logrado sale de los datos: constituciones cerradas o facturas cobradas ese mes. No se teclea.</p>';
  return h + '</div><div class="cajon-pie">' +
    '<button class="btn btn-suave btn-sm" data-editar="objetivo" data-id="' + esc(o.id) + '">Editar</button>' +
    '<button class="btn btn-peligro btn-sm" data-borrar="objetivo" data-id="' + esc(o.id) + '">Eliminar</button></div>';
}

/* -- Formularios ----------------------------------------------- */

function opcCliente(sel) {
  return '<option value="">— sin cliente —</option>' + datos.clientes.slice()
    .sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre), 'es'); })
    .map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(c.nombre) + '</option>';
    }).join('');
}
function opcExpediente(sel) {
  return '<option value="">— sin expediente —</option>' + datos.expedientes.slice()
    .sort(function (a, b) { return String(b.abierto || '').localeCompare(String(a.abierto || '')); })
    .map(function (e) {
      var p = pais(e.pais);
      return '<option value="' + esc(e.id) + '"' + (e.id === sel ? ' selected' : '') + '>' +
        esc((nombreCliente(e.clienteId) || 'Sin cliente') + ' · ' + (p ? p.n : '?') +
            (e.ref ? ' · ' + e.ref : '')) + '</option>';
    }).join('');
}

function opcLista(lista, sel, vacia) {
  return (vacia ? '<option value="">— ' + esc(vacia) + ' —</option>' : '') + lista.map(function (o) {
    var v = o.id !== undefined ? o.id : o, n = o.n !== undefined ? o.n : o;
    return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(n) + '</option>';
  }).join('');
}

function campo(n, etq, val, tipo, extra) {
  return '<div class="campo"><label for="f_' + n + '">' + esc(etq) + '</label>' +
    '<input id="f_' + n + '" name="' + n + '" type="' + (tipo || 'text') + '" value="' + esc(val || '') + '"' + (extra || '') + '></div>';
}
function area(n, etq, val) {
  return '<div class="campo"><label for="f_' + n + '">' + esc(etq) + '</label>' +
    '<textarea id="f_' + n + '" name="' + n + '">' + esc(val || '') + '</textarea></div>';
}
function sel(n, etq, opciones) {
  return '<div class="campo"><label for="f_' + n + '">' + esc(etq) + '</label>' +
    '<select id="f_' + n + '" name="' + n + '">' + opciones + '</select></div>';
}

function abreForm(tipo, oid, pre) {
  var busq = { cliente: cliente, contacto: contacto, expediente: expediente, tarea: tarea, llamada: llamada };
  var reg = oid ? busq[tipo](oid) : null;
  if (oid && !reg) return;
  var r = reg || {}, p = pre || {}, cuerpo = '', titulo = '';

  if (tipo === 'cliente') {
    titulo = reg ? 'Editar cliente' : 'Nuevo cliente';
    cuerpo = campo('nombre', 'Nombre *', r.nombre, 'text', ' required autocomplete="off"') +
      campo('empresa', 'Empresa', r.empresa) +
      '<div class="campo-2">' + campo('email', 'Correo', r.email, 'email') + campo('tel', 'Teléfono', r.tel, 'tel') + '</div>' +
      '<div class="campo-2">' + sel('pais', 'País de destino', opcLista(PAISES, r.pais, 'sin decidir')) +
        sel('origen', 'Origen', opcLista(ORIGENES, r.origen, 'sin indicar')) + '</div>' +
      '<div class="campo-2">' + sel('estado', 'Estado', opcLista(ESTADOS, r.estado || 'sin')) +
        sel('prioridad', 'Prioridad', opcLista(PRIORIDADES, r.prioridad || 'media')) + '</div>' +
      sel('asignado', 'Asignado a', opcLista(datos.equipo, r.asignado || datos.yo, 'sin asignar')) +
      area('notas', 'Notas', r.notas);

  } else if (tipo === 'contacto') {
    titulo = reg ? 'Editar contacto' : 'Nuevo contacto';
    cuerpo = campo('nombre', 'Nombre *', r.nombre, 'text', ' required autocomplete="off"') +
      campo('cargo', 'Cargo', r.cargo) +
      sel('clienteId', 'Cliente', opcCliente(r.clienteId || p.clienteId)) +
      '<div class="campo-2">' + campo('email', 'Correo', r.email, 'email') + campo('tel', 'Teléfono', r.tel, 'tel') + '</div>' +
      area('notas', 'Notas', r.notas);

  } else if (tipo === 'expediente') {
    titulo = reg ? 'Editar expediente' : 'Nuevo expediente';
    cuerpo = sel('clienteId', 'Cliente *', opcCliente(r.clienteId || p.clienteId)) +
      '<div class="campo-2">' + sel('pais', 'País *', opcLista(PAISES, r.pais || 'es')) +
        campo('ref', 'Referencia', r.ref) + '</div>' +
      '<div class="campo-2">' + campo('importe', 'Importe (€)', r.importe, 'number', ' min="0" step="any" inputmode="decimal"') +
        campo('abierto', 'Abierto el', r.abierto || (reg ? '' : hoy()), 'date') + '</div>' +
      '<div class="campo-2">' + sel('fase', 'Fase', opcLista(FASES, r.fase || 'doc')) +
        sel('asignado', 'Asignado a', opcLista(datos.equipo, r.asignado || datos.yo, 'sin asignar')) + '</div>' +
      area('notas', 'Notas', r.notas);

  } else if (tipo === 'tarea') {
    titulo = reg ? 'Editar tarea' : 'Nueva tarea';
    cuerpo = campo('titulo', '¿Qué hay que hacer? *', r.titulo, 'text', ' required autocomplete="off"') +
      '<div class="campo-2">' + sel('tipo', 'Tipo', opcLista(TIPOS_TAREA, r.tipo || 'tarea')) +
        campo('vence', 'Vence', r.vence || (reg ? '' : hoy()), 'date') + '</div>' +
      sel('clienteId', 'Cliente', opcCliente(r.clienteId || p.clienteId)) +
      area('notas', 'Notas', r.notas);

  } else if (tipo === 'factura') {
    titulo = reg ? 'Editar factura' : 'Nueva factura';
    cuerpo = sel('clienteId', 'Cliente *', opcCliente(r.clienteId || p.clienteId)) +
      sel('expedienteId', 'Expediente', opcExpediente(r.expedienteId || p.expedienteId)) +
      '<div class="campo-2">' + campo('numero', 'Número', r.numero, 'text', ' autocomplete="off" placeholder="2026-001"') +
        sel('estado', 'Estado', opcLista(COBROS, r.estado || 'emitida')) + '</div>' +
      '<div class="campo-2">' + campo('base', 'Base (€) *', r.base, 'number', ' min="0" step="any" inputmode="decimal"') +
        campo('iva', 'IVA (€)', r.iva, 'number', ' min="0" step="any" inputmode="decimal"') + '</div>' +
      '<div class="campo-2">' + campo('fecha', 'Fecha', r.fecha || (reg ? '' : hoy()), 'date') +
        campo('vence', 'Vence', r.vence, 'date') + '</div>' +
      area('notas', 'Notas', r.notas);

  } else if (tipo === 'documento') {
    titulo = reg ? 'Editar documento' : 'Pedir documento';
    cuerpo = sel('expedienteId', 'Expediente *', opcExpediente(r.expedienteId || p.expedienteId)) +
      '<div class="campo-2">' + sel('tipo', 'Documento', opcLista(DOCS, r.tipo || 'pasaporte')) +
        sel('estado', 'Estado', opcLista(EST_DOC, r.estado || 'pedido')) + '</div>' +
      '<div class="campo-2">' + campo('pedido', 'Pedido el', r.pedido || (reg ? '' : hoy()), 'date') +
        campo('recibido', 'Recibido el', r.recibido, 'date') + '</div>' +
      campo('nota', 'Detalle', r.nota, 'text', ' placeholder="a quién se le pide, qué falta…"');

  } else if (tipo === 'objetivo') {
    titulo = reg ? 'Editar objetivo' : 'Poner objetivo';
    cuerpo = sel('personaId', 'De quién', opcLista(datos.equipo, r.personaId, 'todo el equipo')) +
      '<div class="campo-2">' +
        sel('tipo', 'Qué se mide', opcLista([{ id: 'expedientes', n: 'Constituciones' },
                                             { id: 'importe', n: 'Facturado (€)' }], r.tipo || 'expedientes')) +
        campo('meta', 'Objetivo *', r.meta, 'number', ' min="0" step="any" inputmode="decimal"') + '</div>' +
      campo('mes', 'Mes', (r.mes || mesActual()) + '-01', 'month') +
      '<p class="pista">Lo logrado no se teclea: sale de las constituciones cerradas o de las facturas ' +
      'cobradas ese mes.</p>';

  } else if (tipo === 'llamada') {
    titulo = reg ? 'Editar llamada' : 'Anotar llamada';
    cuerpo = sel('clienteId', 'Cliente *', opcCliente(r.clienteId || p.clienteId)) +
      campo('resumen', 'En qué quedasteis *', r.resumen, 'text', ' required autocomplete="off"') +
      '<div class="campo-2">' + campo('fecha', 'Fecha', r.fecha || (reg ? '' : hoy()), 'date') +
        campo('minutos', 'Duración (min)', r.minutos, 'number', ' min="0" step="1" inputmode="numeric"') + '</div>' +
      area('notas', 'Notas', r.notas);
  }

  var dlg = $('#dlg');
  dlg.innerHTML = '<form id="form">' +
    '<div class="dlg-cab"><h2 class="dlg-t">' + esc(titulo) + '</h2></div>' +
    '<div class="dlg-cuerpo">' + cuerpo + '<p class="msg-error" id="formError" hidden></p></div>' +
    '<div class="dlg-pie"><button type="button" class="btn btn-suave" id="cancelar">Cancelar</button>' +
    '<button type="submit" class="btn btn-tinta">' + (reg ? 'Guardar' : 'Crear') + '</button></div></form>';
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
  function error(m) { var e = $('#formError'); e.textContent = m; e.hidden = false; return false; }

  var email = v('email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return error('Ese correo no tiene forma de correo.');

  var nuevo = !reg;
  var r = reg || { id: id(), creado: hoy() };

  if (tipo === 'cliente') {
    if (!v('nombre')) return error('El nombre del cliente es obligatorio.');
    var eAntes = r.estado;
    r.nombre = v('nombre'); r.empresa = v('empresa'); r.email = email; r.tel = v('tel');
    r.pais = v('pais'); r.origen = v('origen'); r.estado = v('estado') || 'sin';
    r.prioridad = v('prioridad') || 'media'; r.asignado = v('asignado'); r.notas = v('notas');
    if (nuevo) { datos.clientes.push(r); registra('Alta de ' + r.nombre); }
    else if (eAntes !== r.estado) registra(r.nombre + ': ' + estado(eAntes).n + ' → ' + estado(r.estado).n);

  } else if (tipo === 'contacto') {
    if (!v('nombre')) return error('El nombre del contacto es obligatorio.');
    r.nombre = v('nombre'); r.cargo = v('cargo'); r.clienteId = v('clienteId');
    r.email = email; r.tel = v('tel'); r.notas = v('notas');
    if (nuevo) { datos.contactos.push(r); registra('Nuevo contacto: ' + r.nombre); }

  } else if (tipo === 'expediente') {
    if (!v('clienteId')) return error('El expediente necesita un cliente.');
    if (!v('pais')) return error('El expediente necesita un país.');
    var imp = Number(v('importe'));
    if (v('importe') && (isNaN(imp) || imp < 0)) return error('El importe tiene que ser un número positivo.');
    var fAntes = r.fase;
    r.clienteId = v('clienteId'); r.pais = v('pais'); r.ref = v('ref');
    r.importe = isNaN(imp) ? 0 : imp; r.abierto = v('abierto') || hoy();
    r.fase = busca_en(FASES, v('fase')) ? v('fase') : 'doc';
    r.asignado = v('asignado'); r.notas = v('notas');
    if (r.fase === 'const' || r.fase === 'cancel') { if (!r.cerrado) r.cerrado = hoy(); }
    else delete r.cerrado;
    if (nuevo) { datos.expedientes.push(r); registra('Nuevo expediente: ' + nombreCliente(r.clienteId) + ' → ' + (pais(r.pais) || {}).n); }
    else if (fAntes !== r.fase) registra(nombreCliente(r.clienteId) + ': ' + fase(fAntes).n + ' → ' + fase(r.fase).n);

  } else if (tipo === 'tarea') {
    if (!v('titulo')) return error('La tarea necesita un título.');
    r.titulo = v('titulo'); r.tipo = v('tipo') || 'tarea'; r.vence = v('vence');
    r.clienteId = v('clienteId'); r.notas = v('notas');
    if (nuevo) { r.hecha = false; datos.tareas.push(r); }

  } else if (tipo === 'factura') {
    if (!v('clienteId')) return error('La factura necesita un cliente.');
    var b = Number(v('base'));
    if (!v('base') || isNaN(b) || b < 0) return error('La base tiene que ser un número positivo.');
    var iv = Number(v('iva'));
    if (v('iva') && (isNaN(iv) || iv < 0)) return error('El IVA tiene que ser un número positivo.');
    var cAntes = r.estado;
    r.clienteId = v('clienteId'); r.expedienteId = v('expedienteId'); r.numero = v('numero');
    r.base = b; r.iva = isNaN(iv) ? 0 : iv;
    r.fecha = v('fecha') || hoy(); r.vence = v('vence');
    r.estado = busca_en(COBROS, v('estado')) ? v('estado') : 'emitida'; r.notas = v('notas');
    if (r.estado === 'cobrada') { if (!r.cobrada) r.cobrada = hoy(); } else delete r.cobrada;
    if (nuevo) { datos.facturas.push(r); registra('Factura ' + (r.numero || '') + ' a ' + nombreCliente(r.clienteId)); }
    else if (cAntes !== r.estado) registra('Factura ' + (r.numero || '') + ': ' + cobro(cAntes).n + ' → ' + cobro(r.estado).n);

  } else if (tipo === 'documento') {
    if (!v('expedienteId')) return error('El documento tiene que colgar de un expediente.');
    r.expedienteId = v('expedienteId');
    r.tipo = busca_en(DOCS, v('tipo')) ? v('tipo') : 'otro';
    r.estado = busca_en(EST_DOC, v('estado')) ? v('estado') : 'pedido';
    r.pedido = v('pedido') || hoy(); r.recibido = v('recibido'); r.nota = v('nota');
    if (nuevo) {
      datos.documentos.push(r);
      var ex = expediente(r.expedienteId);
      registra('Pedido ' + tipoDoc(r.tipo) + (ex ? ' a ' + nombreCliente(ex.clienteId) : ''));
    }

  } else if (tipo === 'objetivo') {
    var mt = Number(v('meta'));
    if (!v('meta') || isNaN(mt) || mt <= 0) return error('El objetivo tiene que ser un número mayor que cero.');
    r.personaId = v('personaId');
    r.tipo = v('tipo') === 'importe' ? 'importe' : 'expedientes';
    r.meta = mt;
    r.mes = String(v('mes') || mesActual()).slice(0, 7);
    if (nuevo) {
      /* Un objetivo por persona, mes y medida: si no, se duplican y no se
         sabe cuál manda. */
      var ya = datos.objetivos.filter(function (o) {
        return o.mes === r.mes && o.tipo === r.tipo && (o.personaId || '') === (r.personaId || '');
      });
      if (ya.length) return error('Ya hay un objetivo así para ese mes. Edítalo en vez de crear otro.');
      datos.objetivos.push(r);
      registra('Objetivo de ' + (nombrePersona(r.personaId) || 'el equipo') + ' para ' + r.mes);
    }

  } else if (tipo === 'llamada') {
    if (!v('clienteId')) return error('La llamada necesita un cliente.');
    if (!v('resumen')) return error('Apunta en qué quedasteis, aunque sea en cinco palabras.');
    r.clienteId = v('clienteId'); r.resumen = v('resumen'); r.fecha = v('fecha') || hoy();
    r.minutos = Number(v('minutos')) || 0; r.notas = v('notas');
    if (nuevo) { datos.llamadas.push(r); registra('Llamada con ' + nombreCliente(r.clienteId)); }
  }

  guardar();
  pinta();
  var c = $('#cajon');
  if (!c.hidden && c.dataset.tipo && c.dataset.id) abreFicha(c.dataset.tipo, c.dataset.id);
  aviso(nuevo ? 'Creado' : 'Guardado');
  return true;
}

/* -- Borrado --------------------------------------------------- */

function borra(tipo, oid) {
  var listas = { cliente: datos.clientes, contacto: datos.contactos, expediente: datos.expedientes,
                 tarea: datos.tareas, llamada: datos.llamadas, factura: datos.facturas,
                 documento: datos.documentos, objetivo: datos.objetivos };
  var lista = listas[tipo];
  if (!lista) return;
  var i = -1;
  for (var k = 0; k < lista.length; k++) if (lista[k].id === oid) { i = k; break; }
  if (i < 0) return;
  var reg = lista[i];
  var nombre = reg.nombre || reg.titulo || reg.resumen || reg.numero ||
               (reg.tipo && tipoDoc(reg.tipo)) || 'el registro';

  /* Borrar un cliente dejaria contactos, expedientes y tareas colgando de
     un id que ya no existe. Se avisa con el recuento exacto. */
  if (tipo === 'cliente') {
    var cs = datos.contactos.filter(function (o) { return o.clienteId === oid; }).length;
    var es = datos.expedientes.filter(function (o) { return o.clienteId === oid; }).length;
    var extra = [];
    if (cs) extra.push(cs + (cs === 1 ? ' contacto' : ' contactos'));
    if (es) extra.push(es + (es === 1 ? ' expediente' : ' expedientes'));
    if (!window.confirm('Vas a eliminar ' + nombre + '.' +
      (extra.length ? ' Se quedan sin cliente ' + extra.join(' y ') + '.' : '') + ' No se puede deshacer.')) return;
    [datos.contactos, datos.expedientes, datos.tareas, datos.llamadas].forEach(function (l) {
      l.forEach(function (o) { if (o.clienteId === oid) o.clienteId = ''; });
    });
  } else if (tipo === 'expediente') {
    var dcs = datos.documentos.filter(function (o) { return o.expedienteId === oid; }).length;
    if (!window.confirm('Vas a eliminar este expediente.' +
      (dcs ? ' ' + dcs + (dcs === 1 ? ' documento se queda' : ' documentos se quedan') + ' sin expediente.' : '') +
      ' No se puede deshacer.')) return;
    datos.documentos.forEach(function (o) { if (o.expedienteId === oid) o.expedienteId = ''; });
    datos.facturas.forEach(function (o) { if (o.expedienteId === oid) o.expedienteId = ''; });
  } else if (!window.confirm('Vas a eliminar ' + nombre + '. No se puede deshacer.')) return;

  lista.splice(i, 1);
  registra('Eliminado: ' + nombre);
  guardar();
  cierraFicha();
  pinta();
  aviso(nombre + ' eliminado');
}

/* -- Copia de seguridad y CSV ---------------------------------- */

function descarga(nombre, txt, mime) {
  var b = new Blob([txt], { type: mime + ';charset=utf-8' });
  var u = URL.createObjectURL(b);
  var a = document.createElement('a');
  a.href = u; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(u); }, 1500);
}

/* Comillas dobles duplicadas y BOM al principio: sin las dos cosas Excel
   en Windows abre el fichero con los acentos rotos. */
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
  if (cual === 'clientes') {
    filas.push(['Nombre', 'Empresa', 'Correo', 'Teléfono', 'País', 'Origen', 'Estado', 'Prioridad', 'Alta', 'Notas']);
    datos.clientes.forEach(function (c) {
      filas.push([c.nombre, c.empresa, c.email, c.tel, (pais(c.pais) || {}).n, c.origen,
                  estado(c.estado).n, prioridad(c.prioridad).n, c.creado, c.notas]);
    });
  } else if (cual === 'contactos') {
    filas.push(['Nombre', 'Cargo', 'Cliente', 'Correo', 'Teléfono', 'Notas']);
    datos.contactos.forEach(function (c) {
      filas.push([c.nombre, c.cargo, nombreCliente(c.clienteId), c.email, c.tel, c.notas]);
    });
  } else if (cual === 'expedientes') {
    filas.push(['Cliente', 'País', 'Referencia', 'Fase', 'Importe', 'Abierto', 'Cerrado', 'Notas']);
    datos.expedientes.forEach(function (e) {
      filas.push([nombreCliente(e.clienteId), (pais(e.pais) || {}).n, e.ref, fase(e.fase).n,
                  e.importe, e.abierto, e.cerrado, e.notas]);
    });
  } else if (cual === 'tareas') {
    filas.push(['Tarea', 'Tipo', 'Vence', 'Hecha', 'Cliente', 'Notas']);
    datos.tareas.forEach(function (t) {
      filas.push([t.titulo, tipoTarea(t.tipo).n, t.vence, t.hecha ? 'sí' : 'no', nombreCliente(t.clienteId), t.notas]);
    });
  } else {
    filas.push(['Cliente', 'Fecha', 'Minutos', 'Resumen', 'Notas']);
    datos.llamadas.forEach(function (l) {
      filas.push([nombreCliente(l.clienteId), l.fecha, l.minutos, l.resumen, l.notas]);
    });
  }
  if (filas.length === 1) { aviso('No hay nada que exportar en ' + cual); return; }
  descarga('filnet-' + cual + '-' + hoy() + '.csv', csv(filas), 'text/csv');
  aviso((filas.length - 1) + ' filas exportadas');
}

function importaJson(fichero) {
  var lector = new FileReader();
  lector.onload = function () {
    var d;
    try { d = JSON.parse(String(lector.result)); }
    catch (e) { aviso('Ese fichero no es un JSON válido.'); return; }
    var n = normaliza(d);
    var total = n.clientes.length + n.contactos.length + n.expedientes.length + n.tareas.length + n.llamadas.length;
    if (!total) { aviso('El fichero no trae ningún registro.'); return; }
    var actual = datos.clientes.length + datos.contactos.length + datos.expedientes.length +
                 datos.tareas.length + datos.llamadas.length;
    if (!window.confirm('La copia trae ' + total + ' registros.' +
      (actual ? ' Sustituirá los ' + actual + ' que hay ahora en este navegador.' : '') + ' ¿Continuar?')) return;
    datos = n;
    guardar();
    ir('panel');
    aviso(total + ' registros restaurados');
  };
  lector.onerror = function () { aviso('No se ha podido leer el fichero.'); };
  lector.readAsText(fichero);
}

function vaciaTodo() {
  var total = datos.clientes.length + datos.contactos.length + datos.expedientes.length +
              datos.tareas.length + datos.llamadas.length;
  if (!total) { aviso('Ya está vacío'); return; }
  if (!window.confirm('Se borran ' + total + ' registros de este navegador y no hay vuelta atrás. ¿Continuar?')) return;
  if (!window.confirm('Confírmalo una vez más: se borra todo.')) return;
  datos = JSON.parse(JSON.stringify(VACIO));
  guardar();
  ir('panel');
  aviso('Todo borrado');
}

/* -- Equipo ---------------------------------------------------- */




/* -- Menú móvil ------------------------------------------------ */

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

/* Un solo escuchador para toda la pagina: las vistas se repintan enteras,
   asi que enganchar por elemento se perderia en cada repintado. */
document.addEventListener('click', function (ev) {
  var t = ev.target;
  if (!(t instanceof Element)) return;
  var e;

  if ((e = t.closest('.mi'))) { ir(e.dataset.vista); return; }
  if ((e = t.closest('[data-ir]'))) { ev.preventDefault(); ir(e.dataset.ir); return; }

  if ((e = t.closest('[data-nuevo]'))) {
    abreForm(e.dataset.nuevo, null, e.dataset.cliente ? { clienteId: e.dataset.cliente } : null);
    return;
  }
  if ((e = t.closest('[data-editar]'))) { abreForm(e.dataset.editar, e.dataset.id); return; }
  if ((e = t.closest('[data-borrar]'))) { borra(e.dataset.borrar, e.dataset.id); return; }

  if ((e = t.closest('[data-hecha]'))) {
    var tr = tarea(e.dataset.hecha);
    if (tr) {
      tr.hecha = !tr.hecha;
      guardar(); pinta();
      var c = $('#cajon');
      if (!c.hidden && c.dataset.tipo === 'tarea') abreFicha('tarea', tr.id);
    }
    return;
  }

  if ((e = t.closest('[data-fase]'))) { mueveFase(e.dataset.fase, e.dataset.valor); return; }
  if ((e = t.closest('[data-cobro]'))) { mueveCobro(e.dataset.cobro, e.dataset.valor); return; }
  if ((e = t.closest('[data-estdoc]'))) { mueveDoc(e.dataset.estdoc, e.dataset.valor); return; }
  if ((e = t.closest('[data-valida]'))) { ev.stopPropagation(); mueveDoc(e.dataset.valida, 'validado'); return; }
  if ((e = t.closest('[data-estado]'))) { cambiaEstado(e.dataset.estado, e.dataset.valor); return; }
  if ((e = t.closest('[data-precio]'))) { ponPrecio(e.dataset.precio); return; }

  if ((e = t.closest('[data-ficha]'))) { abreFicha(e.dataset.ficha, e.dataset.id); return; }

  if ((e = t.closest('[data-filtro]'))) { filtro[e.dataset.filtro] = e.dataset.valor; pinta(); return; }
  if ((e = t.closest('[data-csv]'))) { exportaCsv(e.dataset.csv); return; }

  if ((e = t.closest('[data-mes]'))) {
    var d = e.dataset.mes === '0' ? new Date(hoy() + 'T00:00:00')
          : new Date((calMes || hoy().slice(0, 7)) + '-01T00:00:00');
    if (e.dataset.mes !== '0') d.setMonth(d.getMonth() + Number(e.dataset.mes));
    calMes = d.getFullYear() + '-' + pad(d.getMonth() + 1);
    pinta();
    return;
  }

  if (t.closest('[data-cerrar]') || t.id === 'cajonFondo') { cierraFicha(); return; }
  if (t.id === 'velo') { cerrarMenuMovil(); return; }
  if (t.closest('#menuMovil')) { abreMenuMovil(); return; }
  if (t.closest('#avisos')) { filtro.tareas = 'pendientes'; ir('tareas'); return; }
  if (t.id === 'expJson') { descarga('filnet-' + hoy() + '.json', JSON.stringify(datos, null, 2), 'application/json'); aviso('Copia descargada'); return; }
  if (t.id === 'impJson') { $('#ficheroJson').click(); return; }
  if (t.id === 'vaciar') { vaciaTodo(); return; }
  if (t.closest('#quienSoy') || t.id === 'salirSesion') {
    if (window.confirm('Cerrar la sesion de ' + yo().n + '?')) window.Acceso.salir();
    return;
  }
  /* No hay alta ni cambio de contrasena dentro de la aplicacion: el
     registro esta cerrado y las credenciales se publican. */
});

function mueveFase(oid, nueva) {
  var e = expediente(oid);
  if (!e || !busca_en(FASES, nueva) || e.fase === nueva) return;
  var antes = e.fase;
  e.fase = nueva;
  if (nueva === 'const' || nueva === 'cancel') e.cerrado = hoy(); else delete e.cerrado;
  registra(nombreCliente(e.clienteId) + ': ' + fase(antes).n + ' → ' + fase(nueva).n);
  guardar(); pinta(); abreFicha('expediente', oid);
  aviso('Pasa a ' + fase(nueva).n, 'Deshacer', function () {
    e.fase = antes;
    if (antes === 'const' || antes === 'cancel') e.cerrado = hoy(); else delete e.cerrado;
    guardar(); pinta(); abreFicha('expediente', oid);
  });
}

function mueveCobro(oid, nuevo) {
  var fa = factura(oid);
  if (!fa || !busca_en(COBROS, nuevo) || fa.estado === nuevo) return;
  var antes = fa.estado;
  fa.estado = nuevo;
  if (nuevo === 'cobrada') fa.cobrada = hoy(); else delete fa.cobrada;
  registra('Factura ' + (fa.numero || '') + ': ' + cobro(antes).n + ' → ' + cobro(nuevo).n);
  guardar(); pinta(); abreFicha('factura', oid);
  aviso('Pasa a ' + cobro(nuevo).n, 'Deshacer', function () {
    fa.estado = antes;
    if (antes === 'cobrada') fa.cobrada = hoy(); else delete fa.cobrada;
    guardar(); pinta(); abreFicha('factura', oid);
  });
}

function mueveDoc(oid, nuevo) {
  var dc = documento(oid);
  if (!dc || !busca_en(EST_DOC, nuevo) || dc.estado === nuevo) return;
  var antes = dc.estado;
  dc.estado = nuevo;
  if (nuevo === 'recibido' || nuevo === 'validado') { if (!dc.recibido) dc.recibido = hoy(); }
  registra(tipoDoc(dc.tipo) + ': ' + estDoc(antes).n + ' → ' + estDoc(nuevo).n);
  guardar(); pinta();
  if (!$('#cajon').hidden) abreFicha('documento', oid);
  aviso(tipoDoc(dc.tipo) + ': ' + estDoc(nuevo).n, 'Deshacer', function () {
    dc.estado = antes; guardar(); pinta();
  });
}

function cambiaEstado(oid, nuevo) {
  var c = cliente(oid);
  if (!c || !busca_en(ESTADOS, nuevo) || c.estado === nuevo) return;
  var antes = c.estado;
  c.estado = nuevo;
  registra(c.nombre + ': ' + estado(antes).n + ' → ' + estado(nuevo).n);
  guardar(); pinta(); abreFicha('cliente', oid);
  aviso('Pasa a ' + estado(nuevo).n, 'Deshacer', function () {
    c.estado = antes; guardar(); pinta(); abreFicha('cliente', oid);
  });
}

function ponPrecio(paisId) {
  var p = pais(paisId);
  if (!p) return;
  var actual = precio(paisId);
  var v = window.prompt('Precio de constitución en ' + p.n + ' (€). Deja vacío para quitarlo.', actual || '');
  if (v === null) return;
  v = String(v).trim().replace(',', '.');
  if (v === '') { delete datos.precios[paisId]; }
  else {
    var n = Number(v);
    if (isNaN(n) || n < 0) { aviso('Eso no es un precio válido.'); return; }
    datos.precios[paisId] = n;
  }
  guardar(); pinta();
  aviso(v === '' ? 'Precio quitado en ' + p.n : p.n + ': ' + euros(datos.precios[paisId]));
}

document.addEventListener('change', function (ev) {
  if (ev.target.id === 'ficheroJson' && ev.target.files && ev.target.files[0]) {
    importaJson(ev.target.files[0]);
    ev.target.value = '';
  }
  if (ev.target.dataset && ev.target.dataset.calc) {
    calc[ev.target.dataset.calc] = ev.target.value;
    pinta();
  }
});

document.addEventListener('input', function (ev) {
  var c = ev.target.dataset && ev.target.dataset.texto;
  if (!c) return;
  texto[c] = ev.target.value;
  var pos = ev.target.selectionStart;
  pinta();
  var nuevo = $('[data-texto="' + c + '"]');
  if (nuevo) { nuevo.focus(); try { nuevo.setSelectionRange(pos, pos); } catch (x) {} }
});

document.addEventListener('keydown', function (ev) {
  var enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName);
  if (ev.key === '/' && !enCampo) {
    var b = $('[data-texto]');
    if (b) { ev.preventDefault(); b.focus(); }
    return;
  }
  if (ev.key === 'Escape') {
    if (!$('#cajon').hidden) { cierraFicha(); return; }
    cerrarMenuMovil();
  }
});

/* -- Arranque -------------------------------------------------- */

/* Nada se pinta hasta que se entra. Quien entra decide quien eres: la
   identidad ya no se elige a mano, se demuestra con la contrasena. */
window.Acceso.exige(datos.equipo, function (pid) {
  /* Se guarda siempre, aunque no cambie nadie: en un navegador nuevo eso
     es lo que crea el fichero de datos. Si no, no existe hasta la primera
     edicion y cualquiera que mire el almacen no encuentra nada. */
  datos.yo = pid;
  guardar();
  ir(location.hash.slice(1) || 'panel', true);
});

})();
