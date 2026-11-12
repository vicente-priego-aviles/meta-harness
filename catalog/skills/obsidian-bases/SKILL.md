---
name: obsidian-bases
description: Crea y edita Bases de Obsidian (.base): tablas, tarjetas y listas sobre el frontmatter, con filtros y fórmulas. Úsala para tableros del brain o de la factoría (specs, FTD, ADRs, pendientes, caducadas).
disable-model-invocation: true
tags: [obsidian, bases, tableros, okf]
origen: "Adaptada de una skill con licencia MIT; ver AVISOS-DE-TERCEROS.md"
---

# Bases de Obsidian

Un `.base` es YAML que filtra notas por sus propiedades y las muestra como tabla, tarjetas o lista. Es nativo de Obsidian (no necesita Dataview) y encaja con el frontmatter OKF (`type`, `status`, `tags`…).

## Pasos
1. Crea `<carpeta>/tableros/<nombre>.base` (en el brain o en `docs/`).
2. **Ámbito**: `filters` por carpeta, propiedad o etiqueta.
3. **Fórmulas** (opcional) en `formulas`.
4. **Vistas** (`table`, `cards`, `list`) con `order` de columnas.
5. **Validar**: YAML válido, comillas correctas, cada `formula.X` definida. Si puedes, ábrelo en Obsidian.
6. Embébelo en la nota que lo explica: `![[<nombre>.base#<Vista>]]`.

## Esquema
```yaml
filters:                 # globales: cadena o objeto con UNA clave and | or | not
  and:
    - file.inFolder("research/wiki")
    - 'file.ext == "md"'
formulas:
  dias: '(now() - file.mtime).days'
properties:
  formula.dias:
    displayName: "Días sin tocar"
views:
  - type: table          # table | cards | list
    name: "Vista"
    filters: 'status == "draft"'
    groupBy: { property: type, direction: ASC }
    order: [file.name, type, status, description, formula.dias]
    limit: 50
```

## Propiedades
- De la nota: `status` o `note.status`. Objetos anidados de OKF: `generated.at`.
- Del archivo: `file.name`, `file.basename`, `file.path`, `file.folder`, `file.ext`, `file.size`, `file.ctime`, `file.mtime`, `file.tags`, `file.links`, `file.backlinks`.
- Fórmulas: `formula.<nombre>`.

## Filtros y funciones más usados
Operadores `== != > < >= <= && || !`. Funciones: `file.inFolder("x")`, `file.hasTag("x")`, `file.hasLink("x")`, `if(cond, a, b)`, `date("2026-11-09")`, `now()`, `today()`, `x.isEmpty()`, `list.contains(v)`. Referencia completa (en inglés) en `references/FUNCTIONS_REFERENCE.md` — léela solo si la necesitas.

## Trampas
- Fórmulas con comillas dobles → envuelve en simples: `'if(hecho, "Sí", "No")'`.
- Cadenas con `: { } [ ] , & * # ? | - < > = ! % @` → entre comillas.
- Restar fechas da un **Duration**: usa `.days` antes de redondear: `'(now() - file.ctime).days.round(0)'`.
- Propiedad que puede faltar → protégela con `if()`.
- `formula.X` en `order` sin definir `X` → falla en silencio.

## Tableros típicos de meta-harness-factory
| Tablero | Filtro clave |
|---|---|
| Conocimiento por tipo | `file.inFolder("<brain>/wiki")`, `groupBy: type` |
| Pendiente de revisión | `status == "draft"` o sin `verified` |
| Caducadas | `'if(stale_after, date(stale_after) < now(), false)'` |
| ADRs | `type == "ADR"`, orden por `file.name` |
| Specs y FTD | `type == "Spec" \|\| type == "FTD"`, `groupBy: status` |
Ejemplo real: `docs/tableros/conocimiento.base` del repo meta-harness-factory.
