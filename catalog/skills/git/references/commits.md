# Procedimiento de commit

1. **Reglas del repositorio**: commitlint, `CONTRIBUTING.md`, `git log --oneline -10`. Si difieren de la skill, mandan.
2. **Ver los cambios**: `git status --porcelain`, `git diff --staged`, `git diff`. Sin cambios: no hagas un commit vacío.
3. **Operación en curso** (ejecuta cada comando por separado):
   ```bash
   git rev-parse -q --verify MERGE_HEAD
   git rev-parse -q --verify CHERRY_PICK_HEAD
   git rev-parse -q --verify REVERT_HEAD
   git diff --name-only --diff-filter=U
   git status --long
   ```
   - Rebase, `am`, cherry-pick o revert en curso → para y díselo al usuario.
   - Archivos sin resolver → no los añadas sin que el usuario confirme que están resueltos; no dividas el commit; termina con `git commit --no-edit` para conservar el mensaje que prepara git.
4. **Un cambio lógico por commit**: si lo preparado mezcla cambios, saca lo ajeno (`git reset -q -- <rutas>`) y añade solo lo de este cambio (`git add -- <rutas>`; globs entre comillas). Nada de `git add -p` ni `-i` (piden interacción). Revisa `git diff --staged --name-only`: ningún `.env`, credencial ni clave.
5. **Mensaje**: tipo, ámbito (módulo o área) y descripción salen del diff. Cuerpo con el porqué si no es obvio. Pies `Refs:` / `Closes:` con la tarea.
6. **Commit**: un `-m` por párrafo (`git commit -m "fix(pagos): …" -m "Cuerpo" -m "Refs: #57"`); para mensajes largos, `git commit -F <archivo>`.
7. **Comprobar**: `git log -1 --stat` y `git status --porcelain`.
8. Si un hook de git falla, corrige y repite el mismo commit (sin `--amend`, sin `--no-verify`).
