/* Lanzador de las pruebas de humo, en tiempo real.
 *
 *   node pruebas/correr.mjs [puerto]
 *
 * OJO: no usar `chrome --virtual-time-budget` para esto. Esa opción
 * acelera los temporizadores, así que un bucle de espera agota su
 * presupuesto en milisegundos reales — antes de que PBKDF2, que es
 * trabajo real de CPU, haya terminado. Las pruebas fallaban por eso, no
 * por la aplicación. Aquí se conduce Chrome por CDP y se espera de
 * verdad.
 *
 * Requiere Chrome escuchando:
 *   chrome --headless --remote-debugging-port=9222 --user-data-dir=<tmp> about:blank
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PUERTO_WEB = process.argv[2] || '8795';
/* Puerto al azar: si se fija, el lanzador puede acabar conectándose a
   otra instancia de Chrome que alguien dejó abierta depurando, leer SU
   página y dar un resultado que no es el de estas pruebas. Pasó. */
const PUERTO_CDP = 9300 + Math.floor(Math.random() * 600);
const CHROME = process.env.CHROME ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'filnet-pruebas-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=' + PUERTO_CDP,
  '--user-data-dir=' + perfil,
  '--window-size=1400,1000', 'about:blank'
], { stdio: 'ignore', detached: false });

const duerme = ms => new Promise(r => setTimeout(r, ms));

async function pestana() {
  for (let i = 0; i < 40; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PUERTO_CDP}/json`)).json();
      const p = l.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch (e) { /* arrancando */ }
    await duerme(400);
  }
  throw new Error('Chrome no responde en el puerto ' + PUERTO_CDP);
}

let salida = 1;
try {
  const ws = new WebSocket(await pestana());
  await new Promise((ok, err) => { ws.onopen = ok; ws.onerror = err; });

  let n = 0;
  const pend = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const { ok, err } = pend.get(m.id);
      pend.delete(m.id);
      m.error ? err(new Error(m.error.message)) : ok(m.result);
    }
  };
  const manda = (method, params = {}) => new Promise((ok, err) => {
    const id = ++n;
    pend.set(id, { ok, err });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pend.has(id)) { pend.delete(id); err(new Error('sin respuesta: ' + method)); } }, 60000);
  });
  const evalua = async expr => {
    const r = await manda('Runtime.evaluate', {
      expression: `(function(){ ${expr} })()`, returnByValue: true, awaitPromise: true
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };

  await manda('Page.enable');
  await manda('Runtime.enable');
  await manda('Page.navigate', { url: `http://localhost:${PUERTO_WEB}/pruebas/humo.html` });

  // Esperar de verdad a que la página termine
  let listo = false;
  for (let i = 0; i < 240; i++) {          // hasta 120 s reales
    await duerme(500);
    listo = await evalua("return !!document.getElementById('resumen');").catch(() => false);
    if (listo) break;
  }

  const r = await evalua(`
    var out = document.getElementById('salida');
    if (!out) return null;
    return {
      resumen: (document.getElementById('resumen') || {}).textContent || 'SIN TERMINAR',
      lineas: Array.prototype.map.call(out.children, function (e) {
        return (e.tagName === 'H3' ? '#' : '') + e.textContent.trim();
      })
    };
  `);

  if (!r) { console.log('La página de pruebas no ha producido nada.'); }
  else {
    for (const l of r.lineas) {
      if (l.startsWith('#')) console.log('\n  ── ' + l.slice(1));
      else console.log((l.startsWith('PASA') ? '  [v] ' : '  [X] ') +
                       l.replace(/^PASA /, '').replace(/^FALLA /, ''));
    }
    console.log('\n' + r.resumen);
    salida = /(\d+) fallan/.test(r.resumen) && RegExp.$1 !== '0' ? 1 : 0;
    if (!listo) { console.log('\nAVISO: las pruebas no llegaron al final.'); salida = 1; }
  }
  ws.close();
} catch (e) {
  console.log('ERROR:', e.message);
} finally {
  chrome.kill();
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* da igual */ }
  process.exit(salida);
}
