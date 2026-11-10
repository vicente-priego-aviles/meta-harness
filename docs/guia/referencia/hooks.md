# Hooks

Lista completa de [hooks](../ayuda/glosario.md#hook) y de sus comprobaciones. Qué hace cada uno en el día a día y por qué está ahí se explica en [Hooks y guardarraíles](../arquitectura/hooks.md).

## Cómo están conectados
Los scripts están en `.mh/hooks/` y el instalador los conecta en `.claude/settings.json`, conservando los hooks que ya tuvieras:

| Evento de Claude Code | Filtro | Script |
|---|---|---|
| `SessionStart` | `startup`, `resume`, `clear`, `compact` | `sesion-inicio.mjs` |
| `PreToolUse` | `Bash` | `bash-previo.mjs` |
| `PreToolUse` | `Edit`, `Write`, `MultiEdit` | `editar-previo.mjs` |
| `PostToolUse` | `Edit`, `Write`, `MultiEdit` | `editar-posterior.mjs` |
| `Stop` | — | `parar.mjs` |
| `PreCompact` | — | `compactar.mjs` |
| `SessionEnd` | — | `sesion-fin.mjs` |

Cada uno se ejecuta como `node "$CLAUDE_PROJECT_DIR/.mh/hooks/<script>"`. Necesitan [Node.js](../ayuda/glosario.md#nodejs) 18 o posterior y no tienen dependencias.

## Comprobaciones
Cada comprobación tiene un **nombre** (el que se usa para desactivarla) y un **perfil mínimo**: con `minimal` solo actúan las marcadas como `minimal`; con `standard`, todas.

| Comprobación | Script | Perfil | Resultado | Cuándo actúa |
|---|---|---|---|---|
| `sesion-inicio` | `sesion-inicio.mjs` | minimal | contexto para el agente | siempre: orientación, rama, trabajo en curso, últimas entradas del [brain](../ayuda/glosario.md#brain) y avisos (≤ 1,5 KB) |
| `peligro` | `bash-previo.mjs` | minimal | **pregunta** | comando destructivo (lista abajo) |
| `puerta-riesgo` | `bash-previo.mjs` | standard | **bloquea** | `git push`, `gh pr create/merge` o `glab mr create/merge` con [riesgo](../ayuda/glosario.md#riesgo) 2 sin [spec](../ayuda/glosario.md#spec) y revisión aprobadas para la rama |
| `rama-protegida` | `bash-previo.mjs` | standard | **bloquea** | `git commit` en una rama de `git.ramasProtegidas` (se permite cerrar un merge) |
| `convencion-commit` | `bash-previo.mjs` | standard | **bloquea** | `git commit -m` con un mensaje fuera de `git.convencion` |
| `maven` | `bash-previo.mjs` | standard | **bloquea** con alternativa | `mvn` o `./mvnw` con `test`, `verify`, `package` o `install` sin pasar por `mvnq` |
| `proteger-config` | `editar-previo.mjs` | standard | **pregunta** | editar un archivo protegido (lista abajo) |
| `aviso-ftd` | `editar-posterior.mjs` | standard | aviso, una vez por sesión | se edita código sin un [FTD](../ayuda/glosario.md#ftd) ni una spec en curso |
| `aviso-riesgo` | `parar.mjs` | standard | aviso, una vez por conjunto de archivos | hay cambios de riesgo 2 sin spec aprobada para la rama |
| `worklog` | `compactar.mjs`, `sesion-fin.mjs` | standard | escribe en el brain | al compactar y al cerrar: registro de la sesión en `brain/raw/sesiones/` |

«Pregunta» significa que Claude Code te pide confirmación antes de ejecutar. «Bloquea» significa que el comando no se ejecuta y el agente recibe el motivo y cómo seguir.

## Comandos que piden confirmación (`peligro`)
- borrado recursivo de una ruta raíz (`rm -rf /`, `~`, `.`, `..`);
- `git push --force` (no `--force-with-lease`), `git reset --hard`, `git clean -f`, `git checkout .` o `git restore .`, `git branch -D`;
- SQL destructivo: `DROP TABLE`, `DROP DATABASE`, `DROP SCHEMA`, `TRUNCATE`, `DELETE FROM` sin `WHERE`;
- Docker: `docker system prune`, `docker volume prune`, `docker volume rm`, `docker compose down -v`;
- `mvn deploy`, `chmod -R 777` y ejecutar un script descargado (`curl … | sh`).

## Archivos protegidos (`proteger-config`)
- reglas de calidad: `checkstyle*.xml`, `spotbugs*.xml`, `pmd*.xml`, `.editorconfig`;
- tests y configuración de [ArchUnit](../ayuda/glosario.md#archunit): `*ArchTest*.java`, `*ArchitectureTest*.java`, `archunit.properties`;
- el [harness](../ayuda/glosario.md#harness): `.mh.json`, `.claude/settings.json`, `.mh/**`;
- la [constitución](../ayuda/glosario.md#constitucion): `brain/factory/constitucion.md`;
- los que añadas en `protegidos` de `.mh.json`.

## Variables de entorno
| Variable | Efecto |
|---|---|
| `MH_DESACTIVAR=maven,aviso-ftd` | desactiva esas comprobaciones en la sesión que arranques con ella |
| `MH_DEBUG=1` | muestra en la salida de error los fallos internos de los hooks (por defecto se callan: [fallo en abierto](../ayuda/glosario.md#fallo-en-abierto)) |

La configuración permanente (perfil, comprobaciones desactivadas, archivos protegidos, tabla de riesgo) está en [`.mh.json`](configuracion.md).
