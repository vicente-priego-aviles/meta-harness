# Skills

Una **[skill](../ayuda/glosario.md#skill)** es un archivo de instrucciones (`SKILL.md`) que el agente carga cuando la tarea lo pide. De cada skill, Claude Code tiene siempre a mano solo su **descripción**, y lee el resto cuando decide usarla. Hay tres formas de cargarse:

- **Automática**: el agente la elige cuando su descripción encaja con lo que estás pidiendo.
- **Con `paths`**: automática, pero Claude Code solo la ofrece cuando el agente trabaja con archivos de ciertas rutas.
- **Manual**: no se carga sola. La invocas tú escribiendo `/nombre`, o el agente la usa cuando otra skill se lo indica. Su descripción no ocupa contexto en cada sesión.

## Núcleo (siempre se instalan)
| Skill | Carga | Para qué |
|---|---|---|
| `ftd` | automática | [Carril](../ayuda/glosario.md#carril) [FTD](../ayuda/glosario.md#ftd) para cambios claros: documento con intención, alcance y checklist con prueba, [TDD](../ayuda/glosario.md#tdd), [riesgo](../ayuda/glosario.md#riesgo), revisión si hace falta y evidencia. Ver [FTD](../uso/ftd.md) |
| `asdd` | automática | Carril [ASDD](../ayuda/glosario.md#asdd) para cambios con decisiones: [spec](../ayuda/glosario.md#spec) de cuatro preguntas que apruebas tú, plan con restricciones literales, bucle por tarea con revisión y cierre con evidencia. Ver [ASDD](../uso/asdd.md) |
| `revision` | automática | Revisión con [subagentes](../ayuda/glosario.md#subagente) de [contexto limpio](../ayuda/glosario.md#revisor-de-contexto-limpio) elegidos por riesgo, verificación de hallazgos y registro en `brain/factory/revisiones/`. Ver [riesgo y revisión](../uso/riesgo-revision.md) |
| `brain` | automática | Ingerir una fuente, consultar qué sabe el proyecto, guardar una decisión o lección («recuérdalo») y hacer [lint](../ayuda/glosario.md#lint) del [brain](../ayuda/glosario.md#brain). Ver [el brain](../arquitectura/brain.md) |
| `obsidian-markdown` | automática | Escribir notas válidas para Obsidian: [frontmatter](../ayuda/glosario.md#frontmatter) [OKF](../ayuda/glosario.md#okf), enlaces relativos, [callouts](../ayuda/glosario.md#callout), [Mermaid](../ayuda/glosario.md#mermaid) |
| `excalidraw` | automática | Diagramas [Excalidraw](../ayuda/glosario.md#excalidraw) para Obsidian a partir de una lista corta de nodos y flechas |
| `interrogar` | manual: `/interrogar` | Entrevista por rondas para afinar un plan, un diseño o una idea; cada pregunta trae una respuesta recomendada. ASDD sigue su método en el paso de aclarar |
| `obsidian-bases` | manual: `/obsidian-bases` | Tableros de Obsidian (`.base`) sobre el frontmatter de las notas |
| `defuddle` | manual: `/defuddle` | Convierte una página web en Markdown limpio, gastando menos que leerla entera; la skill `brain` la usa al ingerir |

## Módulo java
| Skill | Carga | Para qué |
|---|---|---|
| `java-spring-boot` | `paths`: `*.java`, `pom.xml`, `application*.yml`/`.yaml`/`.properties`, `db/migration/` | Java moderno con Spring Boot: inyección, transacciones, validación, errores, configuración, resiliencia, JPA, migraciones Flyway y tests por capa |
| `secuencia` | manual: `/secuencia <endpoint o flujo>` | [Diagrama de secuencia](../ayuda/glosario.md#diagrama-de-secuencia) en Mermaid de un flujo real del código, guardado en `brain/wiki/arquitectura/secuencias/`. Pide confirmación antes de generarlo |

## Módulo ddd
| Skill | Carga | Para qué |
|---|---|---|
| `ddd-hexagonal` | `paths`: `dominio/`, `domain/`, `aplicacion/`, `application/`, `infraestructura/`, `*ArchTest*.java` | [DDD](../ayuda/glosario.md#ddd) táctico y arquitectura hexagonal con [jMolecules](../ayuda/glosario.md#jmolecules): agregados, objetos valor, eventos, puertos y adaptadores, y las reglas de [ArchUnit](../ayuda/glosario.md#archunit) que lo comprueban |

## Módulo camunda
| Skill | Carga | Para qué |
|---|---|---|
| `camunda-8` | `paths`: `*.bpmn`, `*.dmn`, `*.form`, `*Worker*.java`, `camunda/` | Camunda 8 en Spring Boot: workers [idempotentes](../ayuda/glosario.md#idempotencia), los tres tipos de error, variables como contrato, cambios en [BPMN](../ayuda/glosario.md#bpmn-dmn) con [instancias en vuelo](../ayuda/glosario.md#instancia-en-vuelo) y tests de proceso. Consulta la documentación oficial de Camunda copiada en `.mh/vendor/camunda/` |

## Módulo vaadin
| Skill | Carga | Para qué |
|---|---|---|
| `vaadin-flow` | `paths`: `ui/`, `vista/`, `views/`, `*View.java`, `*Vista.java`, `frontend/` | Vistas Vaadin Flow con Spring: seguridad en cada vista, vistas que solo llaman a casos de uso, formularios con `Binder` y tests sin navegador |

## Módulo git
| Skill | Carga | Para qué |
|---|---|---|
| `git` | automática | Commits con la convención del proyecto, ramas con su formato, [PR](../ayuda/glosario.md#pr) con plantilla y respuesta a los comentarios de la revisión |
| `release` | manual: `/release` | Versión [SemVer](../ayuda/glosario.md#semver) a partir de los commits desde la última etiqueta, CHANGELOG en formato [Keep a Changelog](../ayuda/glosario.md#keep-a-changelog), commit y etiqueta. Solo publica si se lo pides |

## Módulo tareas
| Skill | Carga | Para qué |
|---|---|---|
| `tareas` | automática | Trabajar con el [gestor de tareas](../ayuda/glosario.md#gestor-de-tareas): leer una tarea como entrada del FTD o la spec, comentar el avance, cambiar su estado, crear las tareas del plan y cerrarlas. Se activa al nombrar una tarea (`#57`, `RES-12`) |

## Límites
Cada descripción mide 300 caracteres como mucho y un proyecto no pasa de 12 skills automáticas: las descripciones se cargan en cada sesión. Con todos los módulos instalados quedan justo 12 automáticas (y las de `paths` solo se ofrecen al tocar sus archivos). `mh comprobar` mide las de tu proyecto.

> [!info] Origen
> Varias skills están adaptadas de proyectos abiertos con licencia MIT: `brain`, `obsidian-markdown`, `obsidian-bases`, `defuddle`, `excalidraw`, `interrogar`, `git`, `release` y las reglas de Mermaid de `secuencia`. Los proyectos de origen, sus autores y sus licencias están en el archivo `AVISOS-DE-TERCEROS.md` del repositorio de [meta-harness-factory](../ayuda/glosario.md#meta-harness).
