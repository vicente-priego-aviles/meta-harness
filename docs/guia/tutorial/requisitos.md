# Requisitos

## Imprescindibles
| Herramienta | Para qué | Comprobar |
|---|---|---|
| **Claude Code** | el agente con el que trabajas | `claude --version` |
| **[Node.js](../ayuda/glosario.md#nodejs) 18 o superior** | instalador, [hooks](../ayuda/glosario.md#hook) y scripts (sin dependencias externas) | `node --version` |
| **git** | ramas, commits, cálculo de [riesgo](../ayuda/glosario.md#riesgo) y registro de sesiones | `git --version` |
| **Python 3** | verificación del [brain](../ayuda/glosario.md#brain) y generación de diagramas | `python3 --version` |

El proyecto donde instalas debe ser un **repositorio git**: el riesgo de cada cambio y los avisos se calculan a partir de él.

## Según tu stack
| Si tu proyecto usa… | Necesitas |
|---|---|
| Java con Maven | JDK y, preferiblemente, Maven Wrapper (`mvnw`) en el proyecto |
| Camunda 8, [BPMN](../ayuda/glosario.md#bpmn-dmn) | nada más: la documentación oficial de Camunda viene incluida como referencia |
| Docker Compose para la infraestructura | Docker, si quieres que `init.sh` la levante |

## Opcionales
| Herramienta | Para qué |
|---|---|
| **Obsidian** + plugin comunitario **[Excalidraw](../ayuda/glosario.md#excalidraw)** | leer el brain y los diagramas cómodamente |
| `gh` (GitHub), `acli` (Jira) o `glab` (GitLab) con sesión iniciada | trabajar desde las tareas de tu gestor |
| Plugin [LSP](../ayuda/glosario.md#lsp) de Java para Claude Code | navegar el código por símbolos en vez de leer archivos enteros (menos [tokens](../ayuda/glosario.md#token)) |

=== "GitHub"

    ```bash
    gh auth status        # si no hay sesión: gh auth login
    ```

=== "Jira"

    ```bash
    acli jira auth status # si no hay sesión: acli jira auth login
    ```

=== "GitLab"

    ```bash
    glab auth status      # si no hay sesión: glab auth login
    ```

> [!warning] Abre Claude Code una vez en el proyecto antes de usarlo en modo automático
> Claude Code pide confiar en cada carpeta nueva. Hasta que aceptas, **ignora los permisos** de `.claude/settings.json` del proyecto (los hooks sí funcionan). Ábrelo una vez de forma interactiva en el proyecto y acepta.
