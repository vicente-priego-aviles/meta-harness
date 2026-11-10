---
name: release
description: Prepara una release — versión SemVer a partir de los commits desde la última etiqueta, CHANGELOG en formato Keep a Changelog, commit y etiqueta; la publica solo si el usuario lo pide. Se invoca con /release.
disable-model-invocation: true
tags: [git, release, changelog, semver]
origen: "Adaptada de una skill con licencia MIT; ver AVISOS-DE-TERCEROS.md"
---

# Release

1. **Base al día**: rama `git.ramaBase` (o la principal) sin cambios pendientes; `git fetch --tags` si hay remoto.
2. **Última versión**: `git tag --list 'v*' --sort=-version:refname | head -1` (ordena 1.10.0 por encima de 1.9.0). Sin etiquetas: la versión del `pom.xml` o `0.1.0`.
3. **Qué cambió**: `git log <etiqueta>..HEAD --format='%s%n%b'` y, como contraste, el diff del código público (APIs, contratos REST, procesos BPMN, variables de proceso). Si los commits y el diff no cuentan lo mismo, manda el diff.
4. **Siguiente versión (SemVer)**:
   | Hay… | Sube |
   |---|---|
   | `!` o `BREAKING CHANGE`, un contrato público eliminado o incompatible | mayor (en `0.x`, la menor) |
   | algún `feat` | menor |
   | solo `fix`, `perf`, `refactor`… | parche |
   Propón la versión y el motivo al usuario antes de seguir.
5. **CHANGELOG.md** (Keep a Changelog, en español): mueve lo de `[Unreleased]` a `## [X.Y.Z] - AAAA-MM-DD` con las secciones que apliquen — **Añadido** (feat), **Cambiado**, **Obsoleto**, **Eliminado**, **Corregido** (fix), **Seguridad** —, una línea por cambio con su tarea (`#57`). Actualiza los enlaces de comparación del pie si existen.
6. **Versión en el build**: `./mvnw versions:set -DnewVersion=X.Y.Z -DgenerateBackupPoms=false` si el proyecto la lleva en el `pom.xml` (cambiar el `pom.xml` es riesgo 2: díselo al usuario).
7. **Commit y etiqueta**: `chore(release): vX.Y.Z` (con la convención del proyecto) y `git tag -a vX.Y.Z -m "vX.Y.Z"`.
8. **Publicar solo si el usuario lo pide**: `git push` + `git push origin vX.Y.Z`; release en GitHub con `gh release create vX.Y.Z --title "vX.Y.Z" --notes-file <sección del CHANGELOG>` (GitLab: `glab release create`).
9. Anota la release en el brain (`brain/wiki/log.md`).
