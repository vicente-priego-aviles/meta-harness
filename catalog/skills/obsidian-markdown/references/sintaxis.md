# Referencia de sintaxis Obsidian (resumen)

Fuente: una colección de skills de Obsidian con licencia MIT (ver AVISOS-DE-TERCEROS.md), traducida y resumida.

## Tipos de propiedad (frontmatter)
| Tipo | Ejemplo |
|---|---|
| Texto | `title: Mi título` |
| Número | `prioridad: 2` |
| Casilla | `hecho: false` |
| Fecha | `fecha: 2026-11-09` |
| Fecha y hora | `vence: 2026-11-09T14:30:00` |
| Lista | `tags: [a, b]` |
| Enlace | `relacionada: "[[Otra nota]]"` (en propiedades, Obsidian solo reconoce wikilinks) |

Propiedades por defecto: `tags`, `aliases`, `cssclasses`. Etiquetas: letras, números (no al inicio), `_`, `-`, `/` para anidar.

## Embeds
| Qué | Sintaxis |
|---|---|
| Imagen con ancho | `![[img.png\|300]]` o `![alt\|300](img.png)` |
| PDF por página | `![[doc.pdf#page=3]]` |
| Audio | `![[audio.mp3]]` |
| Base / vista | `![[tablero.base]]`, `![[tablero.base#Vista]]` |
| Lista con id | `![[Nota#^id-lista]]` |
| Resultados de búsqueda | bloque ```` ```query ```` con `tag:#x status:done` |

## Callouts
Plegables: `[!tipo]-` (cerrado) / `[!tipo]+` (abierto). Anidables con `> >`.

| Tipo | Alias | Color |
|---|---|---|
| note | — | azul |
| abstract | summary, tldr | turquesa |
| info | — | azul |
| todo | — | azul |
| tip | hint, important | cian |
| success | check, done | verde |
| question | help, faq | amarillo |
| warning | caution, attention | naranja |
| failure | fail, missing | rojo |
| danger | error | rojo |
| bug | — | rojo |
| example | — | morado |
| quote | cite | gris |

## Matemáticas
`$…$` en línea, `$$…$$` en bloque (LaTeX).
