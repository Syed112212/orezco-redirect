# Orezco — sistema visual

SSOT visual del proyecto. Cualquier cambio de color, tipografía, espaciado o
componente se decide aquí primero y se sincroniza en el mismo commit que el código.

**Dirección**: *broadsheet editorial en sala verde*. Un CRM que se lee como un
periódico financiero impreso llevado a pantalla: cifras monumentales con serifa,
micro-etiquetas en versalitas y un único verde saturado que funciona como rotulador
sobre un lienzo por lo demás monocromo. Mundo visual único y deliberado — no hay
tema oscuro alternativo, todos los colores se pintan explícitamente.

Referencia de partida: `styles.refero.design/style/1a519123-071a-449f-b5df-0def73ed7f35`

Esta dirección es la que se eligió para Orezco antes del cambio de marca, y se
recupera aquí. **No se parece a contaes.com a propósito**: son dos productos
distintos y no deben confundirse.

## Color

| Token | Hex | Nombre | Uso |
|---|---|---|---|
| `--verde` | `#2bee4b` | Rotulador | **Único acento vivo.** Botón principal, icono de la sección activa, etapa Ganada |
| `--verde-hondo` | `#17a832` | Verde hondo | El mismo verde donde hace falta contraste: enlaces, foco |
| `--musgo` | `#93b799` | Musgo | Apoyo. Sombra del CTA, contadores, bordes al pasar. **Nunca color de acción** |
| `--eco` | `#c4e4c9` | Eco | Separadores y bordes de retícula |
| `--tinta` | `#000000` | Tinta | Texto corrido |
| `--prensa` | `#121613` | Negro prensa | Barra lateral, titulares. Negro con sesgo verde frío |
| `--pizarra` | `#232924` | Pizarra | Superficie secundaria dentro de la barra lateral |
| `--gris` | `#516254` | Gris papel | Texto auxiliar y etiquetas apagadas |
| `--salvia` | `#c8d2c8` | Salvia | Texto claro sobre la barra lateral |
| `--hueso` | `#fafffa` | Blanco hueso | Lienzo. Casi blanco con tinte verde, para que lea como papel |
| `--papel` | `#ffffff` | Papel | Tarjetas y tablas, para que despeguen del lienzo |
| `--ambar` | `#b06b00` | Ámbar | Vencido. Solo estado, nunca decoración |
| `--granate` | `#9c2c2c` | Granate | Perdido y acciones destructivas |

**Regla dura**: el verde `#2bee4b` es un rotulador, no un color de relleno. Si
aparece en más de dos sitios por pantalla, algo está mal. En la práctica: el botón
*Nuevo* y el icono de la sección activa. La etapa *Ganada* del embudo es la tercera
excepción admitida, porque ahí el verde significa exactamente lo que parece.

## Tipografía

La referencia usa TWK Lausanne, PP Mondwest y Editorial New — las tres de pago. Se
sustituyen por equivalentes de Google Fonts, que es lo que la propia referencia
recomienda como fallback:

| Rol | Original | En uso | Ajustes |
|---|---|---|---|
| Display | PP Mondwest | **Instrument Serif** 400 | `line-height: .95`, `letter-spacing: -.035em` |
| UI / texto | TWK Lausanne | **Inter** 400/500/600 | micro-etiquetas 11px / 600 / `+.06em` mayúsculas |

- El display se reserva para tres cosas: el título de la vista, la cifra grande del
  indicador y el título de la ficha. **En ningún otro sitio.** Una serifa editorial
  dentro de una tabla es ruido.
- El tracking apretado del display es la dirección entera. Si se afloja, se pierde.
- Las micro-etiquetas en versalitas son estructura, no decoración: dicen de qué habla
  el bloque que viene debajo.
- Los números de dinero llevan `font-variant-numeric: tabular-nums` para que las
  columnas cuadren.

## Ritmo y forma

| | |
|---|---|
| Ancho máximo del contenido | `1400px` |
| Ancho de la barra lateral | `236px` |
| Separación entre bloques | `20px` |
| Radio de botones | `5px` |
| Radio de píldoras | `10px` |
| Radio de tarjetas y cajas | `14px` |

Densidad **espaciosa en las cabeceras, apretada en las listas**: un CRM se usa para
mirar muchas filas seguidas, y ahí el aire estorba.

## Componentes

- **CTA primario**: relleno `--verde`, texto `--prensa`, sombra sólida de 2px en
  `--musgo`. Es el único elemento con sombra en toda la aplicación.
- **Retículas**: se dibujan con `gap: 1px` sobre fondo `--eco`, no con bordes por
  celda. Así las hairlines no se duplican.
- **Estados vacíos**: llevan siempre título en display, una frase que explica para qué
  sirve la sección y una acción. Nunca se rellenan con datos de ejemplo.

## Dos trampas ya pagadas

1. **`[hidden]` pierde contra `display`.** `.cajon` y `.aviso` son `flex`, así que se
   pintaban estando ocultos y tapaban media pantalla. Existe
   `[hidden]{display:none!important}` justo después del reset: **no quitarlo**.
2. **Chrome headless en Windows no baja de ~500px de ancho.** Una captura pedida a
   414px es un recorte de un render de 500 y aparenta desbordes que no existen. Para
   ver el móvil de verdad hay que usar `pruebas/marco-movil.html`, que mete la
   aplicación en un iframe del ancho exacto.

## Accesibilidad

- Contraste AA comprobado en los pares que se usan: `--gris` sobre `--hueso`,
  `--salvia` sobre `--prensa`, `--prensa` sobre `--verde`.
- Todo lo que se pulsa es un `<button>` real, con foco visible en `--verde-hondo`.
- El embudo se puede recorrer con el teclado: las tarjetas son `tabindex="0"` y se
  abren con Enter. **Arrastrar no puede ser la única forma de trabajar.**
- `prefers-reduced-motion` apaga las animaciones.
