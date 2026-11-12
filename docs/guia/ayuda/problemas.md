# Problemas frecuentes

Lo primero, casi siempre, es `mh comprobar` (ver [mantenimiento](mantenimiento.md#comprobar-que-todo-esta-bien)): dice si falta algo y cómo arreglarlo.

## Los hooks no hacen nada
No aparece la orientación al arrancar, Maven no se redirige a `mvnq`, el `git push` de [riesgo](../ayuda/glosario.md#riesgo) 2 no se bloquea…

1. **¿Está [Node.js](../ayuda/glosario.md#nodejs) instalado y en el `PATH`?** `node --version` debe dar 18 o más. Si Claude Code no encuentra `node`, los [hooks](../ayuda/glosario.md#hook) no se ejecutan.
2. **¿Están conectados?** `mh comprobar` avisa si falta alguno en `.claude/settings.json`; `mh actualizar` los vuelve a conectar.
3. **¿Está `.claude/settings.json` en `.gitignore`?** Entonces quien clona el repositorio no recibe los hooks. Sácalo del `.gitignore` y súbelo.
4. **¿Hay alguno desactivado?** Mira `perfil` y `desactivados` en `.mh.json`, y si arrancaste Claude Code con `MH_DESACTIVAR`.
5. **¿Falla por dentro?** Los hooks [fallan en abierto](../ayuda/glosario.md#fallo-en-abierto): si algo va mal, se callan. Arranca con `MH_DEBUG=1 claude` para ver el error.

## Claude Code no respeta los permisos del proyecto
Claude Code pide **confiar** en cada carpeta nueva y, hasta que aceptas, ignora los permisos de `.claude/settings.json` del proyecto (los hooks sí funcionan). Pasa sobre todo si lo lanzas por primera vez en modo no interactivo (`claude -p`). Ábrelo una vez de forma normal en el proyecto y acepta.

## No me deja hacer `git push` (riesgo 2)
El agente recibe un bloqueo como este:

```text
Riesgo 2 (pom.xml (ruta sensible)). Antes de push/PR falta una spec en brain/factory/specs/ …
```

Es la puerta de riesgo: el cambio toca algo sensible y la rama no tiene [spec](../ayuda/glosario.md#spec) aprobada ni revisión aprobada. Tienes tres salidas:

- **Es un cambio sensible de verdad**: sigue el [carril](../ayuda/glosario.md#carril) [ASDD](../uso/asdd.md); al aprobar la spec y cerrar la revisión, el push pasa.
- **El cambio es la propia instalación** (`.claude/`, `.mh/`, `.mh.json`): súbela tú desde tu terminal, donde los hooks no actúan, o con su propio [PR](../ayuda/glosario.md#pr). Hazlo **antes** de abrir ramas de trabajo; si no, todas las ramas arrastran ese cambio y salen de riesgo 2 (ver [riesgo y revisión](../uso/riesgo-revision.md#las-dos-redes-de-seguridad)).
- **La tabla se equivoca para tu proyecto**: ajústala en `riesgo` de `.mh.json` ([configuración](../referencia/configuracion.md#campos-que-puedes-ajustar)).

## Me bloquea `mvn verify`
Es la comprobación `maven`: el agente debe usar `node .mh/scripts/mvnq.mjs verify`, que da el mismo resultado leyendo un 99 % menos. El propio bloqueo le da el comando. Si necesitas la salida completa, está en `.mh/tmp/mvn-ultimo.log`. Para una sesión concreta: `MH_DESACTIVAR=maven claude`.

## Me bloquea el commit
- **«Estás en "main", una [rama protegida](../ayuda/glosario.md#rama-protegida)»**: con integración por ramas y PR, no se hace commit directo en la rama base. El agente debe crear una rama. Si de verdad quieres el commit directo, díselo; para una sesión, `MH_DESACTIVAR=rama-protegida`; para siempre, vacía `git.ramasProtegidas` en `.mh.json`.
- **«El mensaje no sigue la convención del proyecto»**: el mensaje debe ser del tipo `fix(pagos): corregir la compensación duplicada`. El bloqueo trae un ejemplo y el agente lo corrige solo. La convención se cambia en `git.convencion`.

## No me deja editar un archivo
Con un archivo protegido (reglas de Checkstyle o PMD, tests de [ArchUnit](../ayuda/glosario.md#archunit), la [constitución](../ayuda/glosario.md#constitucion), la configuración del agente), Claude Code te **pregunta** antes de editar. No es un error: si el cambio es lo que quieres, acepta. La idea es que un test que falla se arregla cambiando el código, no la regla que lo comprueba.

## El agente avisa de un módulo «no instalado»
El proyecto tiene ahora señales de un módulo que no se instaló (un `.bpmn`, la dependencia de Vaadin…). Ejecuta `mh reevaluar` para verlo; no instala nada hasta que aceptes el plan. Ver [mantenimiento](mantenimiento.md#cuando-el-proyecto-cambia-anadir-modulos).

## `tarea.mjs` falla
| Mensaje o síntoma | Causa | Solución |
|---|---|---|
| no encuentra `gh`, `acli` o `glab` | la [CLI](../ayuda/glosario.md#cli) del gestor no está instalada | instálala (ver [requisitos](../tutorial/requisitos.md#opcionales)) |
| error de autenticación | la CLI no tiene sesión | `gh auth login`, `acli jira auth login` o `glab auth login` |
| no encuentra el repositorio | el proyecto no tiene remoto, o las tareas están en otro repositorio | pon `tareas.repo` en `.mh.json` (`propietario/repo`) |
| `MH_REQUIERE_CONFIRMACION` (código 4) | la acción está desactivada en `tareas.permisos` | no es un error: el agente te pide permiso y la repite |
| el estado no cambia en Jira | los estados de tu proyecto se llaman de otra forma | ajusta `tareas.estados` |

Para ver qué comando lanzaría sin ejecutarlo: `node .mh/scripts/tarea.mjs <orden> … --simular`.

## Una skill mía ha desaparecido del plan
Si ya tenías una [skill](../ayuda/glosario.md#skill) o un [subagente](../ayuda/glosario.md#subagente) con el mismo nombre que uno del catálogo, el instalador **no lo toca** y deja fuera el suyo. El plan lo marca como excluido. Si prefieres el de [meta-harness-factory](../ayuda/glosario.md#meta-harness), renombra el tuyo y vuelve a instalar.

## `CLAUDE.md` demasiado largo
`mh comprobar` y el hook de arranque avisan si pasa de 120 líneas, porque se carga en cada mensaje. Mueve el detalle a donde se carga solo cuando hace falta: un `CLAUDE.md` por módulo de Maven, las reglas o el [brain](../ayuda/glosario.md#brain).

## En Obsidian
- **Veo el código del proyecto en la bóveda**: abre como [bóveda](../ayuda/glosario.md#boveda) la carpeta `brain/`, no el repositorio entero.
- **Los diagramas salen como texto**: instala el plugin comunitario **[Excalidraw](../ayuda/glosario.md#excalidraw)**.
- **Un diagrama aparece cambiado en git sin tocarlo**: el plugin Excalidraw guarda los dibujos comprimidos al abrirlos. El contenido es el mismo; puedes hacer commit o descartar el cambio.

## En Windows
**meta-harness-factory** se ha desarrollado y probado en Linux. Los scripts tienen en cuenta Windows (`mvnq` usa `mvnw.cmd` o `mvn.cmd`, las rutas con `\` se aceptan y las skills se copian, sin enlaces simbólicos), pero **no se ha probado en una máquina Windows**. Lo que puede fallar:

- `init.sh` es un script de bash: necesitas Git Bash o WSL.
- Los scripts de Python de las skills (verificación del brain, diagramas) se lanzan con `python3`; en Windows el comando puede llamarse `python` o `py`.
- Que Claude Code ejecute los hooks con la ruta del proyecto (`$CLAUDE_PROJECT_DIR`) igual que en Linux y macOS.

Si lo usas en Windows y algo falla, abre una incidencia con el mensaje de `MH_DEBUG=1`.
