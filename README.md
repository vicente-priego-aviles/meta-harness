# meta-harness

Tu software factory con **Claude Code**: memoria del proyecto en **Obsidian**, procesos que se cumplen y menos tokens.

**meta-harness** monta en cada proyecto, a medida, lo que Claude Code necesita para trabajar con método:

- **Tres carriles de trabajo**: responder preguntas, **FTD** para cambios claros y **ASDD** para cambios con decisiones, con tu aprobación en los puntos clave.
- **Brain**: la memoria del proyecto en `brain/`, una bóveda de Obsidian versionada con el código (decisiones, specs, evidencias, lecciones).
- **Reglas que se cumplen**: hooks que calculan el riesgo de cada cambio, frenan comandos peligrosos y exigen spec y revisión antes de subir lo delicado.
- **Revisión con contexto limpio**: subagentes revisores que no ven la conversación y un verificador que descarta los falsos positivos.
- **Menos tokens, medido**: presupuesto para lo siempre cargado, salida de Maven reducida un 99 % y el trabajo repartido entre modelos.

Pensado para proyectos **Java con Spring Boot**, **DDD hexagonal**, **Camunda 8 / BPMN** y **Vaadin**. El núcleo sirve para cualquier proyecto; los módulos de stack se instalan solo si el proyecto los usa.

## Empezar
Requisitos: Claude Code, Node.js 18 o posterior, git y Python 3.

```bash
git clone https://github.com/vicente-priego-aviles/meta-harness.git ~/meta-harness
node ~/meta-harness/installer/mh.mjs instalar --carpeta ~/proyectos/mi-proyecto
```

El instalador te hace unas preguntas, analiza el proyecto y te enseña un plan; no escribe nada hasta que lo aceptas. También puedes pedírselo a Claude Code desde el proyecto: «instala meta-harness en este proyecto».

La **guía** completa (tutorial con Spring PetClinic, uso diario, arquitectura, referencia) está en **https://vicente-priego-aviles.github.io/meta-harness/** y en `docs/guia/`. Para verla en local:

```bash
python3 -m venv .venv-docs && .venv-docs/bin/pip install -r requirements-docs.txt
.venv-docs/bin/mkdocs serve
```

## Estructura
| Carpeta | Contenido |
|---|---|
| `catalog/` | lo que se instala en los proyectos: skills, subagentes, hooks, reglas, scripts y plantillas |
| `manifests/` | los módulos del catálogo y qué los activa |
| `installer/` | el instalador `mh`: instalar, comprobar, reevaluar, actualizar, desinstalar |
| `tests/` | tests de Node (hooks, catálogo, instalador) y de Python (brain) |
| `tools/` | herramientas de la guía: diagramas, glosario |
| `docs/guia/` | la guía web |

```bash
node --test "tests/**/*.test.mjs"
python3 -m unittest discover -s tests -t .
```

## Estado
Probado en Linux con proyectos Spring Boot reales. En Windows y macOS no se ha probado todavía: la guía explica qué puede fallar.

## Licencia
MIT (ver `LICENSE`). Parte del material está adaptado de proyectos de código abierto con su propia licencia: ver `AVISOS-DE-TERCEROS.md`.
