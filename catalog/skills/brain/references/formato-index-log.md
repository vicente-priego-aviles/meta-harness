# Formato de index.md y log.md (OKF)

## index.md
Sin frontmatter. Una sección por tema; cada entrada con enlace relativo y la `description` de la nota.

```markdown
# <Tema>

* [<Título>](<tema>/<nota>.md) - <description>
* [<Título archivado>](<tema>/<nota>.md) - [Archivada] <description>
```
Puede haber `index.md` en subcarpetas; el de la raíz de wiki/ enlaza a todos.

## log.md
Lo más reciente arriba. Encabezado por fecha `## AAAA-MM-DD`; una viñeta por operación con palabra clave en negrita.

```markdown
# Registro

## 2026-11-09
* **Ingesta**: <título> (Nueva | Actualiza | En disputa) → [nota](<tema>/<nota>.md); raw `raw/<tema>/<archivo>.md`; cascada: <notas>
* **Sin material**: `raw/<tema>/<archivo>.md`
* **Archivada**: [<título>](<tema>/<nota>.md)
* **Lint**: 4 problemas, 2 arreglados
```

- `**Sin material**: <ruta>` es la clave que usa `verificar_evidencias.py` para no listar ese raw como pendiente.
- Historial por fechas: `grep "^## " wiki/log.md`.
