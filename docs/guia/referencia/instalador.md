# Instalador (mh)

`installer/mh.mjs`, en la carpeta de **[meta-harness-factory](../ayuda/glosario.md#meta-harness)**, instala y mantiene el [harness](../ayuda/glosario.md#harness) en un proyecto. No necesita dependencias: basta con [Node.js](../ayuda/glosario.md#nodejs) 18 o posterior.

```bash
node ~/meta-harness-factory/installer/mh.mjs <orden> --carpeta <proyecto> [opciones]
```

Sin `--carpeta`, actúa sobre la carpeta actual. Los ejemplos de esta página abrevian la ruta como `mh`.

## Órdenes
| Orden | Qué hace | ¿Escribe? |
|---|---|---|
| `instalar` | entrevista, analiza el proyecto y enseña el plan | no |
| `instalar … --aceptar-plan <id>` | aplica exactamente ese plan | sí |
| `comprobar` | revisa la instalación: **LISTO** o **INCOMPLETO** con los motivos, y mide el presupuesto real | no |
| `reevaluar` | vuelve a analizar el proyecto y dice si ahora pide módulos que no se instalaron | no |
| `actualizar` | reinstala lo instalado con la versión actual del catálogo y retira lo que ya no forma parte del plan | sí |
| `desinstalar` | enseña lo que quitaría | no |
| `desinstalar --confirmar` | quita lo que instaló meta-harness-factory; **nunca** el [brain](../ayuda/glosario.md#brain) | sí |

Las órdenes también aceptan su nombre en inglés: `onboard`, `doctor`, `reassess`, `sync`, `uninstall`, y las opciones `--target` y `--accept-plan`.

Cómo y cuándo usar cada una, con ejemplos, está en [mantenimiento](../ayuda/mantenimiento.md).

## Opciones de `instalar`
Cada pregunta de la entrevista tiene su opción. Las que no pases, el instalador te las pregunta (o, si lo lanza el agente, se las devuelve para que te las haga a ti: nunca las deduce del código).

| Opción | Valores |
|---|---|
| `--nivel` | `tecnico` · `sencillo` |
| `--tipo` | `microservicios` · `orquestador-procesos` · `ui-vaadin` · `monolito-modular` · `libreria` · `otro` |
| `--objetivo` | una frase, entre comillas |
| `--alcance` | `pequeno` · `creciente` · `complejo` |
| `--integracion` | `ramas` · `main` |
| `--convencion` | `conventional` · `conventional-gitmoji` |
| `--formatoRama` | `{issue}-{tipo}-{slug}` · `{tipo}/{issue}-{slug}` · `{tipo}/{slug}` |
| `--gestor` | `ninguno` · `github` · `jira` · `gitlab` |
| `--proyecto` | clave del proyecto en Jira |
| `--acceso` | `cli` · `mcp` |
| `--modulos` | lista separada por comas (`java,ddd,camunda`): impone los módulos en lugar de la propuesta |
| `--json` | salida en JSON (la usa el agente) |
| `--aceptar-plan <id>` | aplica el plan con ese id |

El **id del plan** es una huella de lo que se va a hacer. Si entre ver el plan y aceptarlo cambian el proyecto o las respuestas, el id ya no coincide y no se escribe nada: hay que volver a ver el plan. El propio plan imprime al final la orden exacta para aceptarlo.

## Qué escribe al aplicar
| Destino | Acción |
|---|---|
| `.mh/` | [hooks](../ayuda/glosario.md#hook), scripts, orientación y documentación de proveedores |
| `.claude/skills/`, `.claude/agents/`, `.claude/rules/` | copia de las piezas elegidas. Si ya tienes una [skill](../ayuda/glosario.md#skill) o un [subagente](../ayuda/glosario.md#subagente) con el mismo nombre, el instalador **no lo toca** y deja fuera la suya |
| `.claude/settings.json` | se **fusiona**: conserva tus hooks, permisos y variables, y solo sustituye los de meta-harness-factory |
| `CLAUDE.md` | si no existe, uno nuevo; si existe, añade un bloque entre `<!-- mh:inicio -->` y `<!-- mh:fin -->` y no toca el resto |
| `init.sh` | solo si no existe |
| `brain/` | solo los archivos que falten |
| `.gitignore` | añade `.mh/tmp/` y `.mh/backups/` |
| `.mh.json` | ver [configuración](configuracion.md); conserva tus ajustes |

Antes de modificar un archivo, guarda una copia en `.mh/backups/`. Al terminar, ejecuta `comprobar`.

## Avisos del plan
El plan avisa, con una sugerencia, de lo que puede dar problemas: el proyecto no es un repositorio git, `.claude/settings.json` está ignorado por git, el `CLAUDE.md` es demasiado largo, hay skills en `.agents/`, no hay tests o no hay Maven Wrapper.

## Códigos de salida
| Código | Significado |
|---|---|
| 0 | bien |
| 1 | error |
| 2 | faltan respuestas de la entrevista (con `--json`, las devuelve para que el agente te las haga) |
| 3 | el plan ha cambiado: el id no coincide y no se ha escrito nada |
