# GitLab Issues (`glab`)

- **Sesión**: `glab auth status`; si no hay sesión, el usuario ejecuta `glab auth login`.
- **Repositorio**: el del remoto; si no, `.mh.json` → `tareas.repo: "grupo/proyecto"`.
- **Estados**: como en GitHub, con **etiquetas** (`glab issue update --label/--unlabel`) con los nombres de `tareas.estados`; puede usar las etiquetas con ámbito del tablero (p. ej. `estado::en-curso`).
- **Búsqueda**: `tarea.mjs buscar` lista las abiertas y filtra por texto en local.
- **Épicas, padre y bloqueos**: las épicas de GitLab son de grupo y de pago; `crear --epica` crea una issue con el título «Épica: …», y el padre y los bloqueos van como texto («Parte de #3», «Bloqueada por: #4»).
- **Cerrar**: `glab issue close`; un MR con `Closes #3` la cierra al integrarse.
- **MCP opcional**: el servidor MCP de GitLab, si el proyecto lo eligió al instalar.
