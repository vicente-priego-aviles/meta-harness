---
name: excalidraw
description: Crea diagramas Excalidraw para Obsidian (.excalidraw.md) desde una spec corta de nodos, flechas y grupos. Úsala para arquitectura, flujos, mapas o «dibújame cómo funciona X». Para diagramas triviales, Mermaid en la nota.
tags: [diagramas, obsidian, documentacion]
origen: "Adaptada de una skill con licencia MIT; ver AVISOS-DE-TERCEROS.md"
---

# Excalidraw para Obsidian

Genera diagramas que se abren con el plugin **Excalidraw** de Obsidian. No escribas el JSON de Excalidraw a mano: escribe una **especificación corta** y deja que `scripts/diagrama.py` calcule posiciones, tamaños y flechas enlazadas. Ahorra tokens y evita errores.

## Cuándo usar Excalidraw y cuándo Mermaid
| Caso | Herramienta |
|---|---|
| Arquitectura, capas, flujos con grupos, mapas de conceptos | Excalidraw (esta skill) |
| Secuencia simple, lista de pasos, árbol pequeño dentro de una nota | Mermaid en la propia nota (más barato) |

## Pasos
1. **Entiende qué hay que mostrar**: tipo de diagrama, elementos clave (3–12), relaciones. Si hay más de 15 elementos, propón partirlo en un diagrama general y otros de detalle.
2. **Escribe la especificación** `docs/diagramas/<nombre>.spec.json` (formato en `references/formato-spec.md`). Usa `fila`/`col` para colocar los nodos en una cuadrícula.
3. **Genera el diagrama**:
   ```bash
   python3 -I <ruta-skill>/scripts/diagrama.py docs/diagramas/<nombre>.spec.json docs/diagramas/<nombre>.excalidraw.md
   ```
4. **Insértalo en la nota** que lo explica: `![[<nombre>.excalidraw]]`.
5. **Explica el diagrama** en 2–4 frases debajo, en español.

Guarda siempre la `.spec.json` junto al diagrama: para cambiarlo, se edita la spec y se regenera. Si el usuario retoca el dibujo a mano en Obsidian, **no lo regeneres** sin avisar: perdería sus cambios.

## Colores (significado fijo)
| Color | Uso |
|---|---|
| `azul` | componentes principales |
| `verde` | resultados, artefactos, éxito |
| `amarillo` | elemento central o punto de decisión humana |
| `rojo` | riesgo, bloqueo, guardarraíl |
| `morado` | agentes / IA |
| `naranja` | entradas externas |
| `gris` | grupos, contexto secundario |

Cada diagrama lleva `leyenda` con lo que significa cada color **en ese diagrama** (y el rombo si hay decisiones): el lector no tiene por qué conocer esta tabla.

## Formas
- `rectangle` (por defecto): componente, paso.
- `ellipse`: inicio/fin, actor.
- `diamond`: decisión.

## Diagramas complejos
Para tipos con notación especial (clases UML, ER, secuencia, swimlanes) parte de las plantillas en `plantillas/*.excalidraw` y consulta `references/element-types.md` y `references/excalidraw-schema.md`. Solo léelas si las necesitas.

## Problemas frecuentes
| Problema | Solución |
|---|---|
| Textos que no caben | sube `maxCaracteres` o usa `\n` en el texto |
| Nodos solapados | revisa `fila`/`col` repetidos |
| Flechas que cruzan todo | reordena columnas o divide el diagrama |
| Obsidian muestra el JSON | menú ⋯ > «Open as Excalidraw drawing»; comprueba que el plugin está instalado |
