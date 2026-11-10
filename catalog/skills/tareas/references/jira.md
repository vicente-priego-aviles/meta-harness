# Jira (`acli`, CLI oficial de Atlassian)

- **Sesión**: `acli jira auth status`; si no hay sesión, el usuario ejecuta `acli jira auth login`.
- **Proyecto**: `.mh.json` → `tareas.proyecto` (clave, p. ej. `RES`); se usa en búsquedas y al crear.
- **Estados**: `tarea.mjs estado` hace una **transición** al estado con el nombre de `tareas.estados` (p. ej. `In Progress`, `In Review`, `Done`). Los nombres deben coincidir con el flujo de trabajo del proyecto Jira; si una transición falla, revisa los nombres.
- **Descripción**: Jira usa ADF; `tarea.mjs ver` la convierte a texto.
- **Sub-tareas**: `crear --padre RES-12` (tipo por defecto `Task`; `--tipo Sub-task` si el proyecto lo usa).
- **Épicas**: `crear --epica` usa el tipo `Epic`; si la instancia está en español u otro idioma, `.mh.json` → `tareas.tipoEpica: "Épica"`. Las hijas cuelgan con `--padre`. Los bloqueos van como texto («Bloqueada por: RES-21») al final de la descripción.
- **MCP opcional**: el servidor MCP remoto oficial de Atlassian, si el proyecto lo eligió al instalar.
