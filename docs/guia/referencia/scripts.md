# Scripts

Tres scripts de [Node.js](../ayuda/glosario.md#nodejs) en `.mh/scripts/`, sin dependencias. Los usa el agente, pero también puedes lanzarlos tú desde la raíz del proyecto.

## riesgo.mjs
Calcula el [riesgo](../ayuda/glosario.md#riesgo) (0, 1 o 2) de un cambio a partir de los archivos que toca. Lo decide este script, no el agente.

```bash
node .mh/scripts/riesgo.mjs [--base <rama>] [--json] [archivo ...]
```

| Opción | Efecto |
|---|---|
| `archivo ...` | evalúa esas rutas (lo que el agente **piensa** tocar, antes de empezar) |
| sin archivos | evalúa lo que ha cambiado: el diff de la rama frente a la base, más los cambios sin commit y los archivos nuevos |
| `--base <rama>` | rama con la que comparar; por defecto, la rama principal del remoto (`origin/HEAD`) o, si no hay remoto, `main` o `master` |
| `--json` | salida en JSON, con el nivel y el motivo de cada archivo |

Salida: el nivel del cambio (el más alto de sus archivos) y solo los archivos que lo determinan, con su motivo.

```text
Riesgo 2 (3 archivos)
  2  pom.xml  — ruta sensible
  2  src/main/resources/db/h2/schema.sql  — ruta sensible
```

La tabla de niveles y cómo ampliarla están en [riesgo y revisión](../uso/riesgo-revision.md#los-tres-niveles).

## mvnq.mjs
Ejecuta Maven y muestra solo lo que importa: errores de compilación, tests que fallan con su causa, y el resumen. El log completo queda en `.mh/tmp/mvn-ultimo.log`.

```bash
node .mh/scripts/mvnq.mjs <objetivos y opciones de Maven>
node .mh/scripts/mvnq.mjs verify
node .mh/scripts/mvnq.mjs -pl servicio-clientes test -Dtest=ClienteTest
```

- Usa `./mvnw` si el proyecto tiene Maven Wrapper (en la carpeta actual o en la raíz) y, si no, `mvn`. En Windows, `mvnw.cmd` o `mvn.cmd`.
- Devuelve el mismo código de salida que Maven, así que se puede encadenar como el comando original.
- El [hook](../ayuda/glosario.md#hook) `maven` bloquea `mvn test`, `verify`, `package` e `install` lanzados sin él y propone el comando equivalente.

Cuánto ahorra y ejemplos de salida: [la salida de Maven](../tokens/mvnq.md).

## tarea.mjs
Interfaz única con el [gestor de tareas](../ayuda/glosario.md#gestor-de-tareas) del proyecto: GitHub Issues (con `gh`), Jira (con `acli`) o GitLab (con `glab`). Devuelve resúmenes compactos en lugar del JSON completo de cada tarea. Lo instala el módulo **tareas**.

| Orden | Qué hace | Permiso en `.mh.json` |
|---|---|---|
| `ver <id>` | título, estado, descripción y criterios de la tarea | — |
| `buscar [texto]` | tareas abiertas que coinciden | — |
| `crear --titulo "…"` con `--cuerpo "…"` o `--archivo f.md` | crea una tarea | `crear` |
| `crear … --epica` | crea una [épica](../ayuda/glosario.md#epica) | `crear` |
| `crear … --padre <id>` | la cuelga de otra tarea (en GitHub, como [sub-issue](../ayuda/glosario.md#sub-issue)) | `crear` |
| `crear … --bloqueada-por "id1,id2"` | marca de qué tareas depende | `crear` |
| `crear … --tipo <tipo>` | tipo de tarea en Jira (por defecto, `Task`) | `crear` |
| `comentar <id>` con `--texto "…"` o `--archivo f.md` | añade un comentario | `comentar` |
| `estado <id> <estado>` | cambia el estado a `enCurso`, `revision` o `hecho` (los nombres reales en tu gestor están en `tareas.estados`) | `estado` |
| `cerrar <id> [--texto "…"]` | cierra la tarea, con un comentario opcional | `cerrar` |

```bash
node .mh/scripts/tarea.mjs ver 23
node .mh/scripts/tarea.mjs crear --titulo "T002 Clasificador de errores" --archivo t002.md --padre 40 --bloqueada-por 41
```

| Opción global | Efecto |
|---|---|
| `--simular` | muestra el comando de `gh`, `acli` o `glab` que ejecutaría, sin ejecutarlo |
| `--confirmado` | ejecuta una acción cuyo permiso está desactivado; el agente solo lo usa después de preguntarte |

| Código de salida | Significado |
|---|---|
| 0 | bien |
| 1 | error (la [CLI](../ayuda/glosario.md#cli) falta, no tiene sesión, la tarea no existe…) |
| 4 | la acción está desactivada en `tareas.permisos`: hay que pedirte permiso |

La configuración (gestor, repositorio o proyecto, permisos, nombres de los estados) está en [`.mh.json`](configuracion.md#tareas).
