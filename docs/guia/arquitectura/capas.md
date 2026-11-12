# Las cinco capas

**[meta-harness-factory](../ayuda/glosario.md#meta-harness)** organiza lo que instala en cinco capas. Cada una responde a una pregunta y la implementa una pieza concreta de Claude Code:

| # | Capa | Pregunta | Dónde vive en el proyecto | Pieza de Claude Code |
|---|---|---|---|---|
| 1 | **Brain** | ¿Qué sabemos y qué decidimos? | `brain/` | [skill](../ayuda/glosario.md#skill) `brain` y [hook](../ayuda/glosario.md#hook) de arranque |
| 2 | **Constitución** | ¿Qué reglas no se rompen nunca? | `brain/factory/constitucion.md`, `.claude/rules/` | reglas con `paths` y revisores |
| 3 | **Procesos** | ¿Cómo se hace un cambio? | `brain/factory/` | skills `ftd`, `asdd`, `revision` y [subagentes](../ayuda/glosario.md#subagente) |
| 4 | **Guardarraíles** | ¿Qué impide saltarse lo anterior? | `.claude/settings.json`, `.mh/hooks/` | hooks |
| 5 | **Herramientas** | ¿Cómo se prueba lo externo? | `init.sh`, `.mh/scripts/`, `brain/wiki/herramientas/` | scripts y comandos documentados |

Las capas 1 a 3 son **instrucciones**: el agente las sigue porque se le piden. La 4 se **impone con código**: comprueba que las otras se cumplen, aunque el agente se olvide. Y hay un tema que las atraviesa todas, el [ahorro de tokens](#lo-que-carga-claude-code-y-cuando).

## 1. Brain: la memoria
El modelo empieza cada sesión sin recordar nada. El **[brain](../ayuda/glosario.md#brain)** es la memoria del proyecto: una carpeta de Markdown que se abre como [bóveda](../ayuda/glosario.md#boveda) de Obsidian y se versiona con el código. Guarda el conocimiento (producto, arquitectura, decisiones, lecciones), las fuentes de donde sale y los documentos de trabajo de cada cambio.

Al arrancar, un hook le da al agente un resumen de pocas líneas (rama, trabajo en curso, últimas entradas). Lo demás lo consulta él cuando lo necesita, empezando por el índice. Detalle en [El brain en Obsidian](brain.md).

## 2. Constitución: las reglas fijas
La **[constitución](../ayuda/glosario.md#constitucion)** (`brain/factory/constitucion.md`) recoge lo que no se negocia en cada cambio: el stack, las reglas de arquitectura, de procesos, de calidad, de seguridad y de git, y la **[definición de terminado](../ayuda/glosario.md#definicion-de-terminado)**. El instalador crea un borrador con el stack detectado; tú lo completas con el agente la primera vez:

```markdown
## 2. Arquitectura
- C1. El dominio no depende de Spring ni de infraestructura (lo comprueba ArchUnit).

## 3. Procesos
- P1. Un proceso BPMN desplegado es un contrato: cambiarlo es riesgo 2.

## 7. Definición de terminado
- [ ] `node .mh/scripts/mvnq.mjs verify` en verde
- [ ] Evidencia del comportamiento pedido (FTD o verificación)
- [ ] Controles no ejecutados declarados como «no ejecutado»
```

Junto a ella, `brain/factory/revision.md` dice qué cuenta como fallo en una revisión de este proyecto.

Las **reglas** de `.claude/rules/` son el complemento técnico: notas cortas sobre Java, el dominio, Camunda, Vaadin o las migraciones. Todas llevan `paths`, así que Claude Code solo las carga cuando el agente toca archivos que encajan (las de Camunda, por ejemplo, con un `*.bpmn` o un `*Worker*.java`). Y los revisores comprueban la constitución en cada revisión.

## 3. Procesos: cómo se hace un cambio
Cada petición va por un **[carril](../ayuda/glosario.md#carril)**: responder, [FTD](../ayuda/glosario.md#ftd) o [ASDD](../ayuda/glosario.md#asdd) (ver [uso diario](../uso/index.md)). Cada carril es una skill con sus pasos y deja sus documentos en `brain/factory/`: [specs](../ayuda/glosario.md#spec), planes, FTD, progreso, revisiones y verificaciones.

El trabajo se reparte entre el agente principal y **subagentes**, cada uno con su propio contexto y el modelo que necesita su tarea:

| Rol | Subagente | Modelo | Por qué ese modelo |
|---|---|---|---|
| Inventariar el código, seguir llamadas | `explorador` | Haiku | lee mucho y devuelve un resumen; tarea mecánica |
| Lanzar tests y resumir el resultado | `ejecutor-tests` | Haiku | mecánica |
| Redactar la spec de un ASDD | `especificador` | Opus | sus decisiones tienen mucho impacto |
| Implementar una tarea con [TDD](../ayuda/glosario.md#tdd) | `desarrollador` | Sonnet | equilibrio entre calidad y coste |
| Arreglar un fallo de compilación | `reparador-compilacion` | Sonnet | |
| Revisar el diff | `revisor-*` (corrección, tests, seguridad y uno por stack) | Sonnet | [contexto limpio](../ayuda/glosario.md#revisor-de-contexto-limpio), solo lectura |
| Confirmar o refutar hallazgos | `verificador-hallazgos` | Sonnet | evita «arreglar» lo que no estaba roto |

El agente principal usa el modelo que tengas elegido en Claude Code. Un subagente no ve la conversación: recibe solo lo que necesita (la tarea, las restricciones, el diff). Así gasta menos y, en el caso de los revisores, mira el código sin el sesgo de quien lo escribió.

## 4. Guardarraíles: lo que no depende de la memoria del agente
Los **hooks** son scripts que Claude Code ejecuta en momentos fijos: al empezar la sesión, antes de un comando, antes y después de editar, al terminar cada respuesta, al compactar y al cerrar. Calculan el [riesgo](../ayuda/glosario.md#riesgo), piden confirmación ante comandos destructivos, bloquean el `git push` de un cambio de riesgo 2 sin spec aprobada y dejan un registro de la sesión en el brain. Si un hook falla por un error propio, no bloquea nada ([fallo en abierto](../ayuda/glosario.md#fallo-en-abierto)). Detalle en [Hooks y guardarraíles](hooks.md).

## 5. Herramientas: lo externo, probado
Lo que el agente necesita para tocar el mundo exterior está escrito y se puede comprobar:

- **`init.sh`** arranca el entorno y hace un [smoke test](../ayuda/glosario.md#smoke-test). La infraestructura detectada (base de datos, Camunda…) queda comentada para que la actives tú.
- **Scripts** en `.mh/scripts/`: `riesgo.mjs` (nivel de riesgo de un cambio), `mvnq.mjs` (Maven con [salida reducida](../tokens/mvnq.md)) y `tarea.mjs` (GitHub Issues, Jira o GitLab).
- **`brain/wiki/herramientas/`**: una nota por conexión (base de datos, Camunda, una API) con cómo se configura y cómo se prueba.

Se prefieren las herramientas de línea de comandos (`gh`, `mvn`, `docker`) a los servidores [MCP](../ayuda/glosario.md#mcp): un comando solo cuesta contexto cuando se usa, y un servidor MCP carga sus herramientas en cada sesión.

## Lo que carga Claude Code y cuándo
Todo lo que el agente tiene en contexto se paga en cada mensaje. Por eso cada pieza se carga lo más tarde posible:

| Pieza | Cuándo se carga | Límite en meta-harness-factory |
|---|---|---|
| `CLAUDE.md` raíz | siempre | índice corto: qué es, mapa, comandos |
| Orientación del hook de arranque | al empezar, tras `/clear` y tras compactar | ≤ 1,5 KB |
| Descripción de cada skill | siempre | ≤ 300 caracteres, ≤ 12 skills automáticas |
| Cuerpo de una skill | al usarla | corto; lo extenso va en archivos aparte que lee si los necesita |
| Skill manual (`/interrogar`, `/secuencia`, `/release`…) | solo cuando la escribes | — |
| Reglas | al tocar archivos de sus `paths` | ninguna regla [siempre activa](../ayuda/glosario.md#siempre-activo) |
| Subagente | en su propio contexto | devuelve un resumen, no todo lo que leyó |
| Hook | fuera del modelo | solo cuesta lo que escribe al agente |

En PetClinic, tras instalar, lo siempre activo quedó así: `CLAUDE.md` de 31 líneas, orientación de 803 bytes, 8 skills automáticas (1.927 caracteres de descripciones) y ninguna regla siempre activa. `mh comprobar` lo mide en tu proyecto. Más en [ahorro de tokens](../tokens/index.md).
