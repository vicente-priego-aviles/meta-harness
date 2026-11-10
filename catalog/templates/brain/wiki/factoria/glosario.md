---
type: Glosario
title: Glosario de la factoría
description: Siglas y términos del proceso de trabajo con agentes (FTD, ASDD, riesgo, evidencia, brain…), explicados en lenguaje claro.
tags: [glosario, factoria]
generated: { by: meta-harness, at: {{FECHA}} }
status: stable
---

# Glosario de la factoría

> [!tip] Cómo usarlo
> Los términos están ordenados por tema. Para enlazar uno desde otra nota del brain: `[FTD](wiki/factoria/glosario.md#FTD)` (ruta relativa a la nota).

## Proceso de trabajo (la factoría)

### Software factory
Forma de trabajar en la que una petición entra, pasa por pasos definidos y sale verificada, siempre igual y dejando rastro. Tiene tres tipos de paso: **código** (determinista: tests, compilación, cálculo de riesgo), **agente** (razona con unas instrucciones claras) y **humano** (aprueba donde el riesgo lo pide). Ver software factory.

### Carril
Camino que sigue una petición según lo clara que esté. Hay tres: [Responder](#Responder), [FTD](#FTD) y [ASDD](#ASDD). El agente elige el carril, te lo dice en una línea y tú puedes corregirlo.

### Responder
Carril para preguntas. El agente busca y contesta **sin escribir nada** en el repo. *Ejemplo*: «¿qué worker procesa el job `reservar-vuelo`?».

### FTD
**Fast Track Development** — *desarrollo por vía rápida*. Carril para cambios **claros, sin decisiones abiertas**. Se documenta en un único archivo (`brain/factory/ftd/<nombre>.md`) con la intención, el alcance y una lista de comprobación donde cada punto tiene su prueba. Término tomado de un harness de código abierto. *Ejemplo*: corregir una validación de un DTO o añadir un campo a una vista Vaadin. Si el cambio resulta de [riesgo 2](#Riesgo) o choca con una decisión anterior, **sube a ASDD**.

### SDD
**Spec Driven Development** — *desarrollo guiado por especificación*. Primero se escribe qué hay que construir (la spec), luego el plan, luego el código. Es el antecesor de ASDD.

### ASDD
**Agent Spec Driven Development** — *desarrollo guiado por especificación, pensado para agentes*. Variante de SDD propuesta por un divulgador del desarrollo con agentes tras comprobar que un agente con specs detalladas y 4.500 tests en verde construyó algo distinto de lo pedido (rellenó huecos con supuestos). Carril para cambios **con decisiones abiertas o encadenadas**. Su spec responde 4 preguntas: qué podrá hacer el usuario, qué resultado observable obtiene, qué debe respetar y cómo se demuestra. La revisión ocurre **dentro** de cada tarea, no solo al final. *Ejemplo*: un nuevo subproceso de compensación en Camunda o un nuevo agregado de dominio.

### Spec
*Especificación*. Documento que dice **qué** hay que construir y cómo se sabrá que está bien hecho, antes de escribir código. En ASDD vive en `brain/factory/specs/`. Tú la apruebas antes de seguir.

### Plan
Documento que dice **cómo** se va a construir lo de la spec: restricciones, arquitectura, contratos, estrategia de pruebas y la lista de tareas. Empieza con las **restricciones globales literales**: las reglas copiadas tal cual para que las vean el desarrollador y los revisores, que trabajan aislados.

### Tarea
Unidad de trabajo del plan (`T001`, `T002`…), con su comprobación de terminado. `[P]` marca las que pueden hacerse en paralelo.

### Cola de decisiones
Lista (`brain/factory/decisiones-pendientes.md`) de lo que el agente no debe decidir solo. `bloqueante`: para y te espera. `revisar-después`: sigue y lo revisas después. En el harness de código abierto del que viene la idea se llaman `blocking` y `review-after`.

### Constitución
Reglas fijas del proyecto que el agente no puede saltarse (stack, convenciones, seguridad, definición de terminado). Se pactan contigo y cambiarlas requiere tu confirmación. Vive en `brain/factory/constitucion.md`.

### Definición de terminado
Lo que tiene que cumplirse para dar algo por hecho: compila, tests en verde, reglas de arquitectura, tests de proceso y **evidencia** del comportamiento pedido. Un control que no se ejecutó cuenta como «no ejecutado», nunca como «pasado».

### Evidencia
Prueba guardada de que algo funciona: salida de un test, respuesta de la API, captura de una pantalla. Se guarda en el documento FTD o en la verificación. Lema: **hecho = demostrado**.

### Riesgo
Nivel 0, 1 o 2 que **calcula un script** a partir de los archivos tocados (no lo decide el agente).
- **0**: documentación → controles básicos.
- **1**: código normal → además, un revisor.
- **2**: procesos BPMN/DMN, migraciones de BD, seguridad, configuración de producción, dependencias, CI → spec ASDD, revisión completa y **tu aprobación del PR**.

### Revisor de contexto limpio
Subagente que revisa el cambio **sin haber visto cómo se hizo**: solo lee el resultado. Así no arrastra los mismos supuestos que quien lo escribió. Hay revisores de Java/Spring, DDD, Camunda/BPMN, seguridad y tests.

### Verificador de hallazgos
Subagente que comprueba cada problema que reporta un revisor partiendo de que **es falso** hasta demostrarlo contra el código. Solo los hallazgos confirmados bloquean.

### TDD
**Test Driven Development** — *desarrollo guiado por pruebas*. Primero se escribe un test que falla, luego el código mínimo que lo hace pasar, luego se mejora. Prohibido debilitar un test para que pase.

### Smoke test
*Prueba de humo*. Comprobación rápida de que la aplicación arranca y responde (p. ej. `/actuator/health`) antes de tocar nada.

### e2e
**End to end** — *de punta a punta*. Prueba que recorre el sistema como lo haría un usuario (de la pantalla Vaadin o la API hasta la base de datos y el proceso Camunda), no solo una pieza aislada.

### Worklog
*Registro de sesión*. Resumen de lo hecho en una sesión (qué se cambió, qué queda, decisiones). Lo escribe un hook al compactar o cerrar la sesión en `brain/raw/sesiones/`.

## Memoria (el brain)

### Brain
*Cerebro*. Memoria duradera del proyecto: una wiki en Markdown que el agente **consulta antes de actuar** y **actualiza después**. Vive en `brain/` dentro de cada repo y se abre como bóveda de Obsidian. Ver brain.

### raw
Carpeta de **fuentes originales** (documentación, artículos, transcripciones, worklogs). Son **inmutables**: se leen, nunca se editan. Son la referencia contra la que se comprueba la wiki.

### wiki
Carpeta de **conocimiento elaborado** que escribe el agente a partir de raw: notas por tema, decisiones, lecciones.

### Ingerir
Añadir una fuente al brain: guardarla en raw, decidir si aporta algo, escribir o actualizar notas, el índice y el log.

### Lint
*Revisión de calidad* del brain: enlaces rotos, índice desactualizado, contradicciones, notas caducadas y datos que no están en sus fuentes. El término viene de las herramientas que revisan el código sin ejecutarlo.

### Datos anclados a la fuente
Regla del brain: toda cifra, fecha o cita literal de la wiki está **tal cual** en la fuente original. Las paráfrasis y traducciones van entre «comillas españolas». Lo comprueba `verificar_evidencias.py`.

### Divulgación progresiva
*Progressive disclosure*. Cargar primero solo un índice o un resumen, y abrir el detalle solo cuando hace falta. Es la principal técnica de ahorro de tokens (índice del brain, descripciones de skills, `references/`).

### OKF
**Open Knowledge Format** — formato abierto de Google Cloud para guardar conocimiento como carpetas de Markdown con frontmatter YAML (`type`, `description`, `sources`, `status`…), `index.md` y `log.md`. Lo usamos en el brain y en la documentación (ADR-0002).

### Frontmatter
Bloque YAML entre `---` al principio de una nota con sus propiedades. Obsidian las muestra como «Propiedades» y las Bases las usan para filtrar.

### ADR
**Architecture Decision Record** — *registro de decisión de arquitectura*. Nota corta con el contexto, la decisión y sus consecuencias. En este proyecto están en `brain/wiki/decisiones/`. Estado `draft` = pendiente de tu revisión.

## Claude Code (piezas del harness)

### LLM
*Large Language Model*, **modelo de lenguaje** grande: la inteligencia artificial que lee el texto (tu petición, el código, las instrucciones) y genera la respuesta. Claude es un LLM. Cuando esta documentación habla de «modelo», se refiere a un LLM.

### Modelos de Claude
Anthropic ofrece modelos de varios tamaños. Los **grandes** (Opus) razonan mejor y cuestan más por token; los **medianos** (Sonnet) son el equilibrio para el trabajo diario; los **pequeños** (Haiku) son rápidos y baratos, suficientes para tareas mecánicas como buscar archivos o lanzar tests. El meta-harness asigna a cada subagente el tamaño que necesita su tarea.

### Harness
*Arnés*. Lo que rodea al modelo de IA para que trabaje bien: herramientas, permisos, instrucciones, memoria y controles. Claude Code es un harness.

### Meta-harness
Lo que montamos **encima** de Claude Code: este proyecto. Un catálogo y un instalador que preparan el harness de cada proyecto nuevo a su medida.

### CLAUDE.md
Archivo de instrucciones que Claude Code lee en cada petición. En el meta-harness es un **índice corto** que apunta al brain, las skills y los comandos. Un `CLAUDE.md` dentro de un módulo solo se carga al trabajar en ese módulo.

### Skill
*Habilidad*. Carpeta con instrucciones (`SKILL.md`) y, si hace falta, referencias y scripts para una tarea concreta. Claude solo ve su descripción hasta que la usa. Las del proyecto están en `.claude/skills/`.

### Subagente
Instancia de Claude con **su propio contexto**, herramientas y modelo, a la que se le encarga una tarea y devuelve un resultado. Sirve para aislar trabajo (revisar, explorar, ejecutar tests) sin llenar la sesión principal.

### Hook
*Gancho*. Script que Claude Code ejecuta automáticamente en un momento concreto (al empezar la sesión, antes de usar una herramienta, al terminar…). Puede bloquear acciones o añadir contexto. Es la forma de **imponer** reglas, no solo pedirlas.

### Regla con paths
Archivo en `.claude/rules/` con un campo `paths` (p. ej. `**/*.bpmn`). Solo se carga cuando Claude trabaja con archivos que coinciden, así no ocupa contexto el resto del tiempo.

### Siempre activo
Todo lo que se carga en **cada** petición (CLAUDE.md, reglas sin paths, descripciones de skills, lo que inyectan los hooks). Se paga continuamente, por eso tiene un presupuesto (ADR-0007).

### Compactación
Cuando la conversación llena el contexto, Claude Code la resume para seguir. Se pierde detalle, por eso el estado importante vive en el brain y no solo en el chat.

### Token
Unidad en la que el modelo lee y escribe texto (aprox. ¾ de palabra). Lo que se cobra y lo que limita el contexto.

### MCP
**Model Context Protocol** — protocolo para conectar herramientas externas a Claude. El meta-harness prefiere CLI (`gh`, `mvn`, `docker`) porque gasta menos contexto.

### LSP
**Language Server Protocol** — el «motor» que usan los IDE para ir a definiciones o ver errores. Con el plugin `jdtls-lsp`, Claude navega el código Java por símbolos en vez de leer archivos enteros.

### Orientación
Bloque corto (menos de 1 KB) que el hook de inicio inyecta en cada sesión: el decisor de carriles, la regla de consultar el brain y la regla de estilo. Es lo único del proceso que está siempre cargado.

### Perfil de hooks
Nivel de control del harness en un proyecto: `minimal` (orientación y comandos peligrosos), `standard` (todo el núcleo) o `strict` (reservado para más controles). Se elige en `.mh.json`; cada comprobación se puede desactivar por su id.

### Fallo en abierto
Si un hook falla por un error propio (entrada rara, git ausente), **no bloquea**: deja seguir sin decidir nada. Así un fallo del harness nunca impide trabajar.

### mvnq
Envoltorio de Maven del meta-harness (`node .mh/scripts/mvnq.mjs <objetivos>`): ejecuta Maven, muestra solo errores, fallos de test y resumen, y guarda el log completo en `.mh/tmp/`. Ahorra muchos tokens en cada build.

### .mh
Carpeta del proyecto con lo que instala el meta-harness: hooks, scripts, orientación y temporales (`.mh/tmp/`, que git ignora). Su configuración está en `.mh.json`.

### Referencia de proveedor
Documentación mantenida por el fabricante de una tecnología (p. ej. las skills oficiales de Camunda) que el meta-harness instala en `.mh/vendor/` sin reescribirla. No ocupa contexto: una skill propia la cita cuando hace falta.

### Onboarding
Primera instalación del meta-harness en un proyecto (`mh instalar`): entrevista de cinco preguntas, escaneo del proyecto, plan y aplicación tras aceptarlo.

### Módulo
Paquete del catálogo que se instala entero o no se instala: `nucleo` (siempre), `java`, `ddd`, `camunda`, `vaadin`. Cada uno trae sus skills, revisores y reglas, y se propone según las señales del proyecto.

### Primero el plan
Forma de instalar del meta-harness: primero **propone** qué instalar (cada pieza como *seleccionada*, *aplazada* o *excluida*, con su motivo) y no escribe nada hasta que aceptas ese plan concreto.

## Obsidian

### Bóveda
Carpeta que Obsidian abre como espacio de notas; en inglés, *vault*, el término que verás en la interfaz de Obsidian. En cada proyecto, la bóveda es `brain/`.

### Callout
Bloque destacado en Obsidian (`> [!warning]`). En el brain marcan estados: desactualizado, en disputa, evidencia…

### Base
Archivo `.base` de Obsidian: una vista tipo tabla o tarjetas sobre las propiedades de las notas. Lo usamos para tableros.

### Diagrama de secuencia
Diagrama UML que muestra **quién habla con quién y en qué orden**: participantes en columnas y mensajes como flechas de arriba abajo. *Ejemplo*: `POST /reservas` → controlador → caso de uso → repositorio → base de datos, y la respuesta de vuelta. En los proyectos lo genera la skill `/secuencia`, siempre preguntando antes.

### Mermaid
Lenguaje para dibujar diagramas escribiendo texto en un bloque de código ` ```mermaid `. Obsidian y la guía web lo muestran como dibujo sin generar nada. Lo usamos para diagramas sencillos y de secuencia (ADR-0014).

### Excalidraw
Plugin de Obsidian para diagramas con aspecto de dibujo a mano. Nuestros diagramas se generan desde una especificación corta (ADR-0003).

### defuddle
Herramienta que convierte una página web en Markdown limpio, sin menús ni anuncios, para gastar menos tokens.

## Stack habitual

### DDD
**Domain Driven Design** — *diseño guiado por el dominio*. Organizar el código alrededor del negocio: lenguaje ubicuo, contextos acotados, agregados. En arquitectura hexagonal, el dominio no depende de Spring ni de la infraestructura.

### Lenguaje ubicuo
Vocabulario del negocio que comparten código, documentación y personas. En el brain vive en `wiki/producto/glosario`.

### BPMN / DMN
**Business Process Model and Notation** / **Decision Model and Notation** — estándares para modelar procesos y tablas de decisión que ejecuta Camunda. Un `.bpmn` desplegado es un contrato: cambiarlo es [riesgo 2](#Riesgo).

### Conventional Commits
Convención de mensajes de commit: `<tipo>(<ámbito>): <descripción>`, con tipos como `feat`, `fix`, `docs`, `refactor`… Permite generar el CHANGELOG y decidir la versión automáticamente. Variante con **gitmoji**: el mensaje empieza por un emoji según el tipo (🐛 para `fix`).

### SemVer
**Semantic Versioning** — *versionado semántico*: versión `MAYOR.MENOR.PARCHE`. Sube la mayor con cambios incompatibles, la menor con funcionalidades nuevas y el parche con correcciones.

### Keep a Changelog
Formato de `CHANGELOG.md` con una sección por versión y apartados fijos (Añadido, Cambiado, Corregido, Eliminado, Obsoleto, Seguridad).

### Rama protegida
Rama en la que no se hace commit directo (por ejemplo `main` o `develop`): los cambios llegan por rama de trabajo y PR. El hook la hace cumplir según `.mh.json`.

### Gestor de tareas
Herramienta donde viven las tareas del proyecto: GitHub Issues, Jira o GitLab Issues. El meta-harness habla con ella a través de su CLI (`gh`, `acli`, `glab`) con el script `tarea.mjs`.

### Épica
Tarea grande que agrupa otras: en el gestor de tareas, las tareas de una funcionalidad cuelgan de ella. En ASDD, si el trabajo no viene de una tarea, se crea una épica a partir de la spec aprobada. Jira la tiene como tipo (`Epic`); en GitHub solo existe en organizaciones con tipos de issue, y si no, el título empieza por «Épica:».

### Sub-issue
Issue de GitHub que cuelga de otra (su padre) y aparece en ella como lista de progreso. `tarea.mjs crear --padre` la crea así.

### Rebanada vertical
Tarea que atraviesa todas las capas que necesita (dominio, aplicación, adaptador, proceso, vista y test) y se puede demostrar sola, en lugar de hacer una capa entera cada vez. *Ejemplo*: «cancelar una reserva sin pago» de la API a la base de datos, antes de «cancelar con reembolso».

### Bloqueo
Relación entre dos tareas: una no puede empezar hasta que la otra termine. Sale de la columna «Depende» del plan ASDD y se publica como `--bloqueada-por`.

### Frontera
En una entrevista por rondas (`/interrogar`), las decisiones que ya se pueden tomar porque no dependen de otra aún abierta. Cada ronda pregunta solo la frontera.

### Node.js
Entorno que ejecuta programas escritos en JavaScript fuera del navegador; para JavaScript es lo que la JVM para Java. El instalador, los hooks y los scripts del meta-harness son programas de Node.js sin dependencias externas.

### .mjs
Extensión de un archivo JavaScript escrito como **módulo ES** (el sistema de módulos estándar de JavaScript, con `import`/`export`). Node.js lo ejecuta directamente, sin compilar: `node installer/mh.mjs`. En `mh.mjs`, *mh* son las iniciales de meta-harness.

### CLI
**Command Line Interface** — *interfaz de línea de comandos*: programa que se usa desde la terminal (por ejemplo `gh`). El meta-harness la prefiere a MCP porque gasta menos contexto.

### Lockfile
Archivo que fija la versión exacta de cada dependencia de un proyecto Node.js (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`), para que todos instalen lo mismo. Cambiarlo es cambiar dependencias: en el meta-harness es riesgo 2, igual que `package.json` o `pom.xml`.

### Zeebe
Motor de procesos de Camunda 8: ejecuta los BPMN desplegados y reparte el trabajo de cada tarea automática como *jobs*.

### Worker
Código que Zeebe invoca para hacer una tarea automática del BPMN (un *job*): recibe variables, llama a un caso de uso y devuelve variables, o señala un error. En Spring se marca con `@JobWorker(type = "...")`.

### Idempotencia
Propiedad de una operación que puede repetirse sin cambiar el resultado. Zeebe entrega cada job **al menos una vez**, así que un worker debe poder ejecutarse dos veces con el mismo job sin duplicar efectos ni fallar.

### Instancia en vuelo
Ejecución de un proceso BPMN que ya empezó y aún no terminó. Sigue usando la versión del proceso con la que arrancó; por eso cambiar un BPMN desplegado requiere un plan para ellas.

### jMolecules
Biblioteca que permite marcar en el código los conceptos de DDD (`@AggregateRoot`, `@ValueObject`…) y de arquitectura hexagonal; con ArchUnit, esas marcas se convierten en reglas comprobables.

### Testcontainers
Biblioteca que arranca contenedores Docker (p. ej. PostgreSQL real) durante los tests de integración.

### ArchUnit
Biblioteca de tests Java que comprueba reglas de arquitectura (p. ej. «el dominio no importa Spring»).

### PR
**Pull Request** — petición para integrar una rama en la principal, donde se revisa antes de hacer merge.

### Worktree
Copia de trabajo adicional del mismo repo git en otra carpeta y otra rama. Permite trabajar en varias tareas a la vez sin mezclarlas.
