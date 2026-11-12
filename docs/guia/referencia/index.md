# Referencia

Esta sección es para **consultar**, no para leer de corrido: la lista completa de piezas que **[meta-harness-factory](../ayuda/glosario.md#meta-harness)** puede instalar en un proyecto, con su nombre exacto, qué hacen y cómo se configuran. Si buscas el porqué de cada pieza, está en [Arquitectura](../arquitectura/index.md).

| Página | Qué encontrarás |
|---|---|
| [Skills](skills.md) | las 17 [skills](../ayuda/glosario.md#skill): cuándo se cargan, cuáles se invocan a mano y de qué módulo son |
| [Subagentes](subagentes.md) | los 12 [subagentes](../ayuda/glosario.md#subagente): modelo, herramientas que pueden usar y quién los llama |
| [Hooks](hooks.md) | cada [hook](../ayuda/glosario.md#hook) con su evento, sus comprobaciones, el perfil en que actúan y qué devuelven |
| [Scripts](scripts.md) | `riesgo.mjs`, `mvnq.mjs` y `tarea.mjs`: opciones, salida y códigos de salida |
| [Configuración (.mh.json)](configuracion.md) | cada campo del archivo de configuración del proyecto |
| [Instalador (mh)](instalador.md) | las órdenes del instalador, sus opciones y sus códigos de salida |

## Dónde está cada pieza en tu proyecto
| Pieza | Ruta |
|---|---|
| Skills | `.claude/skills/<nombre>/SKILL.md` |
| Subagentes | `.claude/agents/<nombre>.md` |
| Reglas | `.claude/rules/<nombre>.md` |
| Hooks | `.mh/hooks/*.mjs`, conectados en `.claude/settings.json` |
| Scripts | `.mh/scripts/*.mjs` |
| Documentación oficial de proveedores | `.mh/vendor/` |
| Configuración | `.mh.json` |
| Memoria y documentos de trabajo | `brain/` |

Todo son archivos de texto que puedes leer. Si cambias uno a mano, `mh comprobar` te avisa, y `mh actualizar` lo devuelve a la versión del catálogo después de guardar una copia en `.mh/backups/`. Lo que quieras adaptar de forma duradera va en `.mh.json` (ver [instalador](instalador.md)).
