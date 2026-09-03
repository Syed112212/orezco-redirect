/* == Filnet CRM - la puerta =====================================
   Acceso con usuario y contrasena. EL REGISTRO ESTA CERRADO: solo
   entran las personas cuyas credenciales vienen en assets/equipo.js.
   Aqui no hay ninguna pantalla para darse de alta, ni en el primer
   arranque ni nunca. Un navegador nuevo pide contrasena; no ofrece
   crearla.

   Para cambiar quien entra hay que regenerar assets/equipo.js con
   pruebas/credenciales.html (solo funciona en local) y publicarlo. Es
   un paso deliberado: que dar acceso a alguien exija tocar el
   repositorio es justo lo que hace que no pueda registrarse solo.

   AVISO, y va en serio: la comprobacion ocurre en el navegador, no en
   un servidor. Esto es una PUERTA, no una caja fuerte. Frena a quien
   pase por delante de un ordenador abierto; no frena a alguien tecnico,
   que puede saltarsela con las herramientas de desarrollo. Y como los
   hashes viajan con la pagina, quien la descargue puede intentar
   adivinar las contrasenas sin limite y sin que nadie lo vea: por eso
   tienen que ser largas. Si hace falta seguridad de verdad, la
   respuesta es un servidor con autenticacion, no endurecer esto.

   Lo que si se hace bien: la contrasena nunca se guarda ni viaja. Lo
   que viaja es PBKDF2-SHA256 con 250.000 vueltas y una sal distinta por
   persona.
   =============================================================== */
(function () {
'use strict';

var LLAVE = 'filnet.erp.acceso.v1';   /* solo la sesion; las credenciales vienen en equipo.js */
var VUELTAS = 250000;
var HORAS_SESION = 12;

function $(s, r) { return (r || document).querySelector(s); }
function esc(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function hex(buf) {
  return Array.prototype.map.call(new Uint8Array(buf), function (b) {
    return ('0' + b.toString(16)).slice(-2);
  }).join('');
}

/* -- Credenciales publicadas ----------------------------------- */

function accesos() {
  var a = window.FILNET_ACCESOS;
  return (a && typeof a === 'object') ? a : {};
}
function credencial(pid) {
  var c = accesos()[pid];
  return (c && c.sal && c.hash) ? c : null;
}
function hayAlguien() {
  var a = accesos();
  for (var k in a) if (Object.prototype.hasOwnProperty.call(a, k) && credencial(k)) return true;
  return false;
}

/* -- Sesión (lo único que se guarda en el navegador) ----------- */

function lee() {
  try { return JSON.parse(localStorage.getItem(LLAVE)) || {}; }
  catch (e) { return {}; }
}
function guarda(d) {
  try { localStorage.setItem(LLAVE, JSON.stringify(d)); return true; }
  catch (e) { return false; }
}
function sesionViva() {
  var d = lee();
  if (!d.sesion || !d.sesion.id || !d.sesion.hasta) return null;
  if (Date.now() > d.sesion.hasta) return null;
  /* Si a alguien se le retira el acceso en equipo.js, su sesión abierta
     deja de valer en cuanto recargue. */
  return credencial(d.sesion.id) ? d.sesion.id : null;
}
function abreSesion(pid) { guarda({ sesion: { id: pid, hasta: Date.now() + HORAS_SESION * 3600000 } }); }
function cierraSesion() { guarda({}); }

/* -- Derivación ------------------------------------------------ */

/* crypto.subtle solo existe en contexto seguro (https o localhost). Sin
   el, no se entra: antes eso que una puerta pintada. */
function haySubtle() {
  return !!(window.crypto && window.crypto.subtle && window.crypto.subtle.importKey);
}

function deriva(clave, salHex) {
  var sal = new Uint8Array(salHex.match(/.{2}/g).map(function (h) { return parseInt(h, 16); }));
  return crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits'])
    .then(function (k) {
      return crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: sal, iterations: VUELTAS, hash: 'SHA-256' }, k, 256);
    })
    .then(hex);
}

/* Comparación en tiempo constante. */
function iguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* -- Pantalla -------------------------------------------------- */

var LEMA = [
  'Cada constitución, de punta a punta.',
  'Clientes, expedientes, países y tareas en un solo panel.'
];
var VENTAJAS = [
  'El expediente, del papeleo al registro',
  'Los ocho destinos y sus precios',
  'Todo el equipo, al día'
];

function marco(titulo, sub, cuerpo, pie) {
  return '<div class="acc-izq">' +
      '<div class="acc-marca">' +
        '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#fff"/>' +
        '<path d="M23 45V19h19v6.4H30.2v4.6h10.2v6.3H30.2V45Z" fill="#1f1f1f"/></svg>' +
      '</div>' +
      '<h1 class="acc-lema">' + esc(LEMA[0]) + '<br><span>' + esc(LEMA[1]) + '</span></h1>' +
      '<ul class="acc-lista">' + VENTAJAS.map(function (v) {
        return '<li><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7"/>' +
          '<path d="m5 8.2 2 2 4-4.2"/></svg>' + esc(v) + '</li>';
      }).join('') + '</ul>' +
      '<p class="acc-pie">Filnet · CRM interno</p>' +
    '</div>' +
    '<div class="acc-der"><div class="acc-caja">' +
      '<h2 class="acc-t">' + esc(titulo) + '</h2>' +
      '<p class="acc-s">' + sub + '</p>' +
      cuerpo +
      '<p class="acc-nota">' + pie + '</p>' +
    '</div></div>';
}

var equipoRef = [], alEntrar = null;

/* Solo se listan las personas que tienen credencial publicada. Quien no
   esté en equipo.js no aparece, así que no hay nada que elegir ni que
   crear. */
function conAcceso() {
  return equipoRef.filter(function (p) { return !!credencial(p.id); });
}

function pintaLogin(msg) {
  var gente = conAcceso();

  var cuerpo = '<form id="accForm" novalidate>' +
    '<label class="acc-e" for="usuario">Usuario</label>' +
    '<div class="acc-campo">' +
      '<svg class="acc-i" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="7" r="3"/>' +
      '<path d="M4 16.5a6 6 0 0 1 12 0"/></svg>' +
      '<select id="usuario" name="usuario">' + gente.map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(p.n) + '</option>';
      }).join('') + '</select>' +
    '</div>' +
    '<label class="acc-e" for="clave">Contraseña</label>' +
    '<div class="acc-campo">' +
      '<svg class="acc-i" viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="8.6" width="12" height="8" rx="2"/>' +
      '<path d="M7 8.6V6.4a3 3 0 0 1 6 0v2.2"/></svg>' +
      '<input id="clave" name="clave" type="password" autocomplete="current-password" placeholder="••••••••" required>' +
      '<button type="button" class="acc-ojo" data-ojo="clave" aria-label="Ver la contraseña">' +
        '<svg viewBox="0 0 20 20"><path d="M1.8 10S4.6 4.8 10 4.8 18.2 10 18.2 10 15.4 15.2 10 15.2 1.8 10 1.8 10Z"/>' +
        '<circle cx="10" cy="10" r="2.4"/></svg></button>' +
    '</div>' +
    (msg ? '<p class="acc-err">' + esc(msg) + '</p>' : '') +
    '<button type="submit" class="acc-btn">Iniciar sesión ' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"/></svg></button>' +
  '</form>';

  var pie = 'La sesión dura ' + HORAS_SESION + ' horas en este navegador. ' +
    '<strong>No hay registro:</strong> solo entran las ' + gente.length +
    ' personas dadas de alta. Para añadir o quitar a alguien hay que publicar el cambio.';

  $('#acceso').innerHTML = marco('Iniciar sesión', 'Entra con tu cuenta.', cuerpo, pie);
  var c = $('#clave'); if (c) c.focus();

  $('#accForm').onsubmit = function (ev) {
    ev.preventDefault();
    entra($('#usuario').value, $('#clave').value);
  };
}

function pintaAviso(titulo, sub, parrafo, pie) {
  $('#acceso').innerHTML = marco(titulo, sub, '<p class="acc-p">' + parrafo + '</p>', pie);
}

function entra(pid, clave) {
  var reg = credencial(pid);
  if (!reg) { pintaLogin('Esa persona no tiene acceso.'); return; }
  var b = $('.acc-btn');
  if (b) { b.disabled = true; b.textContent = 'Un momento…'; }
  deriva(clave, reg.sal).then(function (h) {
    if (!iguales(h, reg.hash)) { pintaLogin('Usuario o contraseña incorrectos.'); return; }
    abreSesion(pid);
    dentro(pid);
  }).catch(function (e) {
    pintaLogin('No se ha podido comprobar: ' + e.message);
  });
}

function dentro(pid) {
  var a = $('#acceso');
  a.hidden = true;
  a.innerHTML = '';
  document.body.classList.remove('cerrado');
  if (alEntrar) alEntrar(pid);
}

/* -- API ------------------------------------------------------- */

window.Acceso = {
  exige: function (equipo, cb) {
    equipoRef = equipo || [];
    alEntrar = cb;
    var a = $('#acceso');
    var cierra = function () { a.hidden = false; document.body.classList.add('cerrado'); };

    if (!haySubtle()) {
      cierra();
      pintaAviso('No se puede comprobar la contraseña',
        'El navegador solo deja cifrar en páginas seguras.',
        'Esta página se está sirviendo por <code>http://</code> a secas. Ábrela por ' +
        '<code>https://</code> o en <code>localhost</code> y el acceso funcionará.',
        'No se entra sin comprobar la contraseña: sería una puerta pintada.');
      return;
    }

    if (!hayAlguien()) {
      /* Sin credenciales publicadas no entra nadie. Y NO se ofrece
         crearlas desde aquí: eso volvería a abrir el registro. */
      cierra();
      var enLocal = ['localhost', '127.0.0.1', ''].indexOf(location.hostname) >= 0;
      pintaAviso('El acceso no está configurado',
        'Todavía no hay ninguna persona dada de alta.',
        'Las credenciales viven en <code>assets/equipo.js</code> y se publican con la aplicación. ' +
        (enLocal
          ? 'Genéralas en <a href="pruebas/credenciales.html">pruebas/credenciales.html</a> y publica el fichero.'
          : 'Quien administre el CRM tiene que generarlas en local y publicarlas.'),
        'Nadie puede darse de alta desde esta pantalla, y es a propósito.');
      return;
    }

    var viva = sesionViva();
    if (viva) { dentro(viva); return; }

    cierra();
    pintaLogin();
  },

  salir: function () {
    cierraSesion();
    location.reload();
  },

  tieneClave: function (pid) { return !!credencial(pid); },

  /* Cuántas personas pueden entrar. Lo usa Ajustes para no mentir. */
  cuantos: function () { return conAcceso().length; }
};

/* El ojo de "ver la contraseña". Delegado, porque la pantalla se
   repinta entera en cada paso. */
document.addEventListener('click', function (ev) {
  var b = ev.target.closest && ev.target.closest('[data-ojo]');
  if (!b) return;
  var i = document.getElementById(b.dataset.ojo);
  if (!i) return;
  var ver = i.type === 'password';
  i.type = ver ? 'text' : 'password';
  b.setAttribute('aria-label', ver ? 'Ocultar la contraseña' : 'Ver la contraseña');
  i.focus();
});

document.addEventListener('DOMContentLoaded', function () {
  if (!$('#acceso').hidden) document.body.classList.add('cerrado');
});

})();
