---
name: git
description: Commits con la convención del proyecto (Conventional Commits, opcional gitmoji), ramas con su formato, pull requests con plantilla y atender comentarios de un PR. Úsala al hacer commit, crear una rama, abrir un PR o responder a su revisión.
tags: [git, commits, ramas, pull-request]
origen: "Adaptada de una skill con licencia MIT; ver AVISOS-DE-TERCEROS.md"
---

# Git

Lee primero la configuración del proyecto en `.mh.json` → `git`:

| Clave | Ejemplo | Uso |
|---|---|---|
| `convencion` | `conventional` · `conventional-gitmoji` | formato del mensaje (gitmoji: `references/gitmoji.md`) |
| `formatoRama` | `{issue}-{tipo}-{slug}` · `{tipo}/{issue}-{slug}` · `{tipo}/{slug}` | nombre de las ramas |
| `ramaBase` | `develop` | de dónde salen las ramas y contra qué van los PR |
| `ramasProtegidas` | `["main", "develop"]` | nunca se hace commit directo en ellas |

Si el repositorio tiene reglas propias (commitlint, `CONTRIBUTING.md`, los últimos `git log --oneline -10`), mandan sobre esta skill.

## Commits
- Formato: `<tipo>(<ámbito>): <descripción>`; descripción en **infinitivo**, en el idioma del proyecto, sin punto final, primera línea ≤ 72 caracteres. Cuerpo: qué cambia y **por qué**.
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Cambio incompatible: `!` antes de los dos puntos o pie `BREAKING CHANGE:`.
- **Un cambio lógico por commit**: si el diff mezcla cosas, divídelo (procedimiento en `references/commits.md`).
- **El FTD, la spec o el progreso van en el mismo commit que el código que documentan.**
- Tarea enlazada: pie `Refs: #57` mientras se trabaja y `Closes: #57` en el último (Jira: `Refs: RES-12`).
- Nunca: secretos, `--no-verify`, `--amend` de algo ya publicado, cambiar la configuración de git, push sin que el usuario lo pida.

## Ramas
- Nombre según `formatoRama`: `{tipo}` = `feat|fix|chore|docs|refactor|test`, `{issue}` = número o clave de la tarea, `{slug}` = descripción corta en minúsculas, sin tildes, con guiones, ≤ 50 caracteres. Sin tarea: se omite `{issue}` y el separador.
- Sale de `ramaBase` actualizada (`git fetch` + `git switch -c <rama> origin/<ramaBase>` si hay remoto).
- No crees ramas por iniciativa propia: solo cuando el usuario lo pide o al empezar una tarea de FTD/ASDD que lo indique.

## Pull requests
Plantilla y forma de atender la revisión en `references/pr.md`. El cuerpo enlaza la spec y la verificación del brain, declara el riesgo (`node .mh/scripts/riesgo.mjs`) y cómo revertir. Riesgo 2: lo aprueba el usuario.

## Comprobaciones automáticas
Los hooks rechazan un `git commit -m` que no siga la convención y los commits directos en ramas protegidas; el mensaje de rechazo dice cómo corregirlo.
