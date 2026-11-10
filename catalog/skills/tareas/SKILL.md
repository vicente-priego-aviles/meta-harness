---
name: tareas
description: Trabaja desde el gestor de tareas del proyecto (GitHub Issues, Jira o GitLab) — leer una tarea como entrada del FTD o la spec, comentar el avance, cambiar su estado, crear tareas desde el plan y cerrarlas. Úsala cuando se nombre una tarea (#57, RES-12) o se pida actualizarla.
tags: [tareas, jira, github, gitlab, factoria]
---

# Tareas

Todo pasa por `node .mh/scripts/tarea.mjs`, que llama a la CLI del gestor configurado en `.mh.json` → `tareas` y devuelve **resúmenes cortos**. No uses la CLI ni el MCP directamente salvo para algo que el script no cubra.

| Operación | Comando |
|---|---|
| Leer | `tarea.mjs ver <id>` |
| Buscar abiertas | `tarea.mjs buscar [texto]` |
| Comentar | `tarea.mjs comentar <id> --texto "…"` (o `--archivo`) |
| Cambiar estado | `tarea.mjs estado <id> enCurso\|revision\|hecho` |
| Crear | `tarea.mjs crear --titulo "…" --archivo cuerpo.md [--padre <id>] [--bloqueada-por "id1,id2"]` |
| Crear épica | `tarea.mjs crear --epica --titulo "…" --archivo cuerpo.md` |
| Cerrar | `tarea.mjs cerrar <id> [--texto "…"]` |
| Probar sin ejecutar | añade `--simular` |

Si una operación devuelve `MH_REQUIERE_CONFIRMACION`, pide permiso al usuario y repite con `--confirmado`.

## Ciclo con una tarea
1. **Leer** (`ver`) y consultar el brain. El título, la descripción y los criterios son la entrada del FTD o de la spec; anota `tarea: <id>` en su frontmatter. Lo que la tarea no aclare va a los puntos abiertos, no a supuestos.
2. **Empezar**: rama con el formato del proyecto (skill `git`), `estado <id> enCurso` y un comentario breve: carril, rama y documento del brain.
3. **Avanzar**: un comentario al cerrar cada hito (tarea del plan hecha, bloqueo, decisión pendiente), con evidencia resumida. Sin ruido: no comentes cada commit.
4. **Revisión**: al abrir el PR, `estado <id> revision` y comentario con el enlace.
5. **Cerrar**: al integrarse el PR (o si el usuario lo pide), `cerrar <id>` con un resumen y el enlace a la verificación.

## ASDD → tareas
Con la spec aprobada y el plan hecho (si `tareas.permisos.crear`):
1. **Padre**: la tarea de origen. Si el trabajo no viene de ninguna, crea la **épica** con `--epica`: título = capacidad de la spec; cuerpo = problema, objetivos y no objetivos, criterios de aceptación y enlace a la spec (resumen, no la spec entera).
2. **Reparto**: enseña la lista (id del plan, título, bloqueada por, qué entrega) y pregunta si el tamaño y los bloqueos son correctos. **No crees nada hasta que el usuario lo apruebe.**
3. **Crear** en orden de dependencias (primero las que no dependen de nada), cada una con `--padre <épica o tarea de origen>` y `--bloqueada-por` con los ids ya creados de su columna «Depende». Cuerpo: qué entrega, «hecho cuando» y criterios de aceptación; sin rutas ni código, que caducan.
4. Anota cada id en la columna «Gestor» del plan y el de la épica en el frontmatter de la spec (`tarea: <id>`). No modifiques ni cierres la tarea de origen.

## Gestores
Detalles de cada uno (sesión, estados, peculiaridades) en `references/github.md`, `references/jira.md` y `references/gitlab.md`. Léelo solo si algo falla.
