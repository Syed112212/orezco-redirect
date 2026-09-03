# Orezco — CRM

Un CRM pequeño: empresas, contactos, oportunidades en un embudo, y tareas con fecha.
Vive en **orezco.com**.

## Cómo está hecho

HTML, CSS y JavaScript a pelo. Sin framework, sin compilación, sin dependencias: se
publica tal cual en GitHub Pages, que es lo único que hay contratado.

```
index.html          la aplicación entera (el esqueleto)
assets/app.css      el sistema visual — leer DESIGN.md antes de tocarlo
assets/app.js       toda la lógica
assets/marca.svg    el icono de pestaña
404.html            para cualquier otra dirección
pruebas/            pruebas, solo funcionan en local
DESIGN.md           SSOT visual. Manda sobre cualquier improvisación
```

## Dónde están los datos

En el almacén del navegador (`localStorage`, clave `orezco.crm.v1`). **No hay
servidor.** Consecuencias, que están dichas también dentro de la aplicación:

- los datos no salen de ese equipo y ese navegador;
- no se sincronizan entre dispositivos ni entre personas;
- si se borran los datos de navegación, se van con ellos.

Por eso Ajustes trae descarga e importación de una copia en JSON, y exportación a CSV
por tabla. La copia de seguridad no es un extra, es el plan.

Para pasar a multiusuario haría falta un backend (base de datos y cuentas). Ni la
cuenta de Hostinger ni GitHub Pages lo dan: sería otra decisión y otro coste.

## Trabajar en local

```bash
python -m http.server 8791
```

Y abrir <http://localhost:8791/>.

### Las pruebas

Tres páginas, y **solo arrancan en localhost** — escriben y borran el almacén, así que
en producción se quedan paradas a propósito.

| Página | Para qué |
|---|---|
| `pruebas/humo.html` | 21 comprobaciones sobre la aplicación real: alta, validación, XSS, embudo, tareas, buscador, anclas |
| `pruebas/marco-movil.html` | El móvil de verdad, en iframes de 390 y 320 px |
| `pruebas/datos-demo.html` | Carga datos inventados para mirar las pantallas llenas. **Sustituye lo que haya guardado** |

Las de humo se leen a ojo, o en headless:

```bash
chrome --headless --virtual-time-budget=9000 --dump-dom \
  http://localhost:8791/pruebas/humo.html | grep -o 'RESULTADO:[^<]*'
```

## Al tocar el código

- **Escapar siempre lo que escribe el usuario.** Todo pasa por `esc()` antes de llegar
  al HTML. Hay una prueba que lo comprueba; si se salta el escapado, falla.
- **Subir la huella de versión** de `app.css?v=` y `app.js?v=` en `index.html` al
  cambiarlos, o el navegador servirá los viejos.
- **Leer DESIGN.md** antes de tocar colores, tipos o espaciados.
- **Nada de datos inventados** en la aplicación. Las pantallas vacías se quedan vacías
  y explican para qué sirve la sección.

## Pendiente

- Sin backend: un solo usuario, un solo equipo (arriba).
- El embudo se arrastra con ratón; en móvil hay que abrir la tarjeta y usar *Mover a*.
- No hay importación desde CSV, solo exportación y copia en JSON.
