# GitHub Issues (`gh`)

- **Sesión**: `gh auth status`; si no hay sesión, el usuario ejecuta `gh auth login`.
- **Repositorio**: el del remoto `origin`; si no hay remoto o hay varios, `.mh.json` → `tareas.repo: "propietario/repo"`.
- **Estados**: GitHub no tiene estados intermedios; `tarea.mjs estado` usa **etiquetas** con los nombres de `tareas.estados` (por defecto «En curso», «En revisión», «Hecho»). Las etiquetas deben existir: créalas una vez con `gh label create "En curso"` (si el usuario lo aprueba) o ajusta los nombres en `.mh.json`.
- **Cerrar**: `gh issue close` (opcionalmente con comentario). Un PR con `Closes #57` la cierra al integrarse.
- **Sub-tareas y bloqueos**: `--padre` crea un sub-issue nativo y `--bloqueada-por` un bloqueo nativo (`gh` reciente; probado con 2.96). Con un `gh` antiguo, el script repite con «Parte de #N» y «Bloqueada por: #M» en el cuerpo.
- **Épicas**: GitHub no tiene tipo épica salvo en organizaciones con tipos de issue; sin `tareas.tipoEpica`, el título empieza por «Épica:». Con tipos (p. ej. `"tipoEpica": "Epic"`) usa `--type`.
- **MCP opcional**: el servidor MCP oficial de GitHub, si el proyecto lo eligió al instalar; consume más contexto.
