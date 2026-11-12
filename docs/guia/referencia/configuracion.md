# Configuración (.mh.json)

`.mh.json`, en la raíz del proyecto, guarda la configuración de **[meta-harness-factory](../ayuda/glosario.md#meta-harness)** en ese proyecto: tus respuestas al instalar, lo que se instaló y los ajustes de los [hooks](../ayuda/glosario.md#hook). Lo crea el instalador y se versiona con el código.

> [!warning] Es un archivo de riesgo 2
> Cambiar `.mh.json` es cambiar las reglas del agente: el agente te pedirá confirmación antes de editarlo, y un cambio en él cuenta como [riesgo](../ayuda/glosario.md#riesgo) 2 para la puerta de `git push`. Si lo cambias tú, súbelo en su propio commit.

## Ejemplo
Así queda tras instalar en un proyecto con GitHub Issues (la parte `plan` y `gestionados`, más larga, se omite):

```json
{
  "version": "0.1.0",
  "perfil": "standard",
  "brain": "brain",
  "desactivados": [],
  "protegidos": [],
  "riesgo": { "nivel0": [], "nivel2": [], "contenido2": [] },
  "git": {
    "convencion": "conventional",
    "formatoRama": "{issue}-{tipo}-{slug}",
    "ramaBase": "main",
    "ramasProtegidas": ["main"]
  },
  "tareas": {
    "gestor": "github",
    "acceso": "cli",
    "proyecto": null,
    "repo": null,
    "permisos": { "comentar": true, "estado": true, "crear": true, "cerrar": true },
    "estados": { "enCurso": "En curso", "revision": "En revisión", "hecho": "Hecho" }
  }
}
```

## Campos que puedes ajustar
| Campo | Valor por defecto | Qué controla |
|---|---|---|
| `perfil` | `standard` (`minimal` si elegiste alcance «pequeño») | qué comprobaciones de los hooks actúan: `minimal` deja solo la orientación y los comandos peligrosos ([perfil de hooks](../ayuda/glosario.md#perfil-de-hooks)) |
| `desactivados` | `[]` | comprobaciones que no quieres, por nombre (lista en [hooks](hooks.md#comprobaciones)) |
| `protegidos` | `[]` | rutas o patrones de tu proyecto que el agente no debe editar sin preguntar, por ejemplo `"**/reglas-negocio.yml"` |
| `brain` | `"brain"` | carpeta del [brain](../ayuda/glosario.md#brain) |
| `riesgo.nivel2` | `[]` | patrones de ruta que pasan a riesgo 2, por ejemplo `"**/pagos/**"` |
| `riesgo.nivel0` | `[]` | patrones que pasan a riesgo 0, por ejemplo `"**/*.adoc"` |
| `riesgo.contenido2` | `[]` | expresiones regulares: si **lo que cambia** en un archivo las contiene, el archivo pasa a riesgo 2 |

Los patrones de ruta usan `*` (dentro de una carpeta) y `**` (cualquier número de carpetas). La tabla de riesgo por defecto está en [riesgo y revisión](../uso/riesgo-revision.md#los-tres-niveles).

### git
| Campo | Valores | Qué controla |
|---|---|---|
| `convencion` | `conventional` · `conventional-gitmoji` | el formato de mensaje que exige la comprobación `convencion-commit` |
| `formatoRama` | `{issue}-{tipo}-{slug}` · `{tipo}/{issue}-{slug}` · `{tipo}/{slug}` | cómo nombra el agente las ramas, por ejemplo `57-fix-reset-cliente` |
| `ramaBase` | la detectada (por defecto `main`) | de qué rama salen las ramas de trabajo |
| `ramasProtegidas` | la rama base y `main` si integras con ramas y [PR](../ayuda/glosario.md#pr); vacía si integras directo | ramas donde la comprobación `rama-protegida` no deja hacer commit |

### tareas
| Campo | Qué controla |
|---|---|
| `gestor` | `github`, `jira`, `gitlab` o `null` (sin gestor) |
| `acceso` | `cli` (recomendado: gasta menos [tokens](../ayuda/glosario.md#token)) o `mcp` (el servidor [MCP](../ayuda/glosario.md#mcp) oficial del gestor, que configuras tú) |
| `proyecto` | clave del proyecto en Jira, por ejemplo `RES` |
| `repo` | `propietario/repo` si el gestor no es el del remoto de git, o si no hay remoto |
| `permisos` | qué puede hacer el agente sin preguntarte: `comentar`, `estado`, `crear`, `cerrar`. Con `false`, te pide permiso cada vez |
| `estados` | el nombre real de cada estado en tu gestor: `enCurso`, `revision`, `hecho`. En Jira, por defecto `In Progress`, `In Review` y `Done` |
| `tipoEpica` | tipo de tarea de las [épicas](../ayuda/glosario.md#epica). En Jira, por defecto `Epic`. En GitHub, el tipo de issue si tu organización los usa; sin él, la épica es una issue normal con el título «Épica: …», igual que en GitLab |

## Campos que escribe el instalador
No los edites a mano: los usa el instalador para saber qué hay instalado.

| Campo | Contenido |
|---|---|
| `version` | versión del catálogo instalada |
| `plan` | id del plan aceptado, fecha, tus respuestas, módulos, [skills](../ayuda/glosario.md#skill), [subagentes](../ayuda/glosario.md#subagente), reglas y referencias instalados, y `vigilar`: las señales de los módulos que no se instalaron, que el hook de arranque comprueba para avisarte |
| `gestionados` | cada archivo que instaló meta-harness-factory con su huella (hash): así `mh comprobar` detecta los que se han cambiado a mano y `mh desinstalar` sabe qué quitar |

Al reinstalar o actualizar, el instalador **conserva** tus ajustes (`perfil`, `desactivados`, `protegidos`, `riesgo`, `git`, `tareas`) y solo rehace `version`, `plan` y `gestionados`.
