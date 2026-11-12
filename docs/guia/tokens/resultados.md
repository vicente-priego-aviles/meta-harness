# Resultados medidos

Todas las cifras de esta guía salen de pruebas reales con Claude Code: un proyecto propio con Spring Boot y Camunda («el proyecto de reservas de viaje») y Spring PetClinic. Esta página las reúne con su método, lo que salió bien y lo que salió mal.

## Cómo se midió
- **Proyectos**: una copia aparte del proyecto de reservas de viaje (seis microservicios Spring Boot 4, Camunda 8.9, [jMolecules](../ayuda/glosario.md#jmolecules) y siete modelos [BPMN](../ayuda/glosario.md#bpmn-dmn)/DMN), sin tocar el original, y un clon de Spring PetClinic.
- **Con y sin**: la misma petición en dos clones del mismo commit, uno con **[meta-harness-factory](../ayuda/glosario.md#meta-harness)** instalado y otro sin él.
- **Modelo**: Sonnet 5.5 como agente principal, con Claude Code en modo no interactivo (`claude -p`). Los [subagentes](../ayuda/glosario.md#subagente) usan su propio modelo (Haiku, Sonnet u Opus).
- **Coste**: el que informa Claude Code al terminar, calculado con las tarifas de la API ([tabla de tarifas](../uso/ftd.md#cuanto-cuesta)). Con una suscripción Pro o Max no se paga por tarea: cuenta contra el límite de uso del plan.

La medición completa del proyecto de reservas de viaje costó 4,21 USD.

## Con y sin meta-harness-factory
| Tarea | Sin meta-harness-factory | Con meta-harness-factory | Diferencia |
|---|---|---|---|
| **Pregunta**: qué worker procesa `activar-cliente` | 0,092 USD · 4 turnos | 0,131 USD · 7 turnos | +42 % |
| **[FTD](../ayuda/glosario.md#ftd)**: test de arquitectura con [ArchUnit](../ayuda/glosario.md#archunit) | 0,167 USD · 8 turnos | 0,193 USD · 11 turnos | +16 % |

En las dos tareas, los dos clones llegaron al mismo resultado principal. Lo que añadió meta-harness-factory:

- **En la pregunta**, encontró además un posible `NullPointerException` fuera del `try` y citó la regla de Camunda que incumple el worker ([Responder](../uso/responder.md)).
- **En el FTD**, dejó un documento con checklist y evidencia, y declaró como «no ejecutado» el control que no ejecutó, en lugar de darlo por pasado ([FTD](../uso/ftd.md#cuando-algo-sale-en-rojo)).

El sobrecoste es sobre todo **de comportamiento**: más turnos para leer el caso de uso o escribir el documento, y cada turno vuelve a enviar todo el contexto. Lo fijo que añade meta-harness-factory es pequeño, unos 3.000 [tokens](../ayuda/glosario.md#token).

## Una spec ASDD
| Versión | Coste | De eso, Opus | De eso, Haiku |
|---|---|---|---|
| Primera prueba: el especificador exploraba el servicio entero por su cuenta | 2,58 USD | 2,43 USD | — |
| Con un inventario previo hecho por el `explorador` | **1,05 USD (−59 %)** | 0,73 USD | 0,03 USD |

La [spec](../ayuda/glosario.md#spec) inventarió 15 workers, encontró un fallo grave que nadie había pedido buscar (una reentrega de job compensaba una reserva ya pagada), seis workers sin proceso que los use y códigos de error que no coincidían con el BPMN, y propuso 17 criterios de aceptación con su test. Detalle en [ASDD](../uso/asdd.md).

## Otras medidas
| Medida | Resultado |
|---|---|
| `mvn verify` de PetClinic (84 tests) en verde | 823 líneas → 4 con `mvnq` (−99,8 %, unos 24.000 tokens menos) |
| El mismo `verify` con un test que falla | 837 líneas → 14 con `mvnq` (−98,7 %) |
| Tutorial: cambio en PetClinic, del pedido al cambio revisado | 0,36 USD en 80 s |
| Tutorial: rama y commit, retomando la sesión | 0,44 USD |
| «Empieza la tarea #51» (ya estaba hecha; el agente lo detectó) | 0,22 USD |
| «Empieza la tarea #23» (rama, FTD, estado de la tarea) | 0,19 USD |
| Orientación de arranque en el proyecto de reservas de viaje | 981 bytes (límite: 1.500) |
| [Siempre activo](../ayuda/glosario.md#siempre-activo) en el proyecto de reservas de viaje | 9 [skills](../ayuda/glosario.md#skill) automáticas (2.146 caracteres de descripciones), 0 reglas |

## Lo que salió mal y se corrigió
Las pruebas destaparon fallos de meta-harness-factory. Todos están corregidos en el catálogo:

| Qué pasó | Corrección |
|---|---|
| Un FTD cambió el `pom.xml` con un comando `sed`, se declaró de [riesgo](../ayuda/glosario.md#riesgo) 0 y ningún [hook](../ayuda/glosario.md#hook) lo vio: los de edición no ven los cambios hechos con comandos | hook `parar`: al terminar cada respuesta recalcula el riesgo con lo que de verdad cambió y avisa si es 2 sin spec |
| El especificador (Opus) exploró el servicio entero dentro de su contexto: 85 llamadas a herramientas | inventario previo con Haiku, límite de turnos y lectura acotada (el −59 % de arriba) |
| El riesgo de la spec lo estimó un subagente que no podía ejecutar el script | el agente principal calcula el riesgo con `riesgo.mjs` antes de delegar |
| Al empezar la tarea #23 (un `.bpmn`) estimó riesgo 1: aún no había cambios que medir | el riesgo se calcula con las rutas previstas antes de tocar nada |
| El agente partía los párrafos de las notas del [brain](../ayuda/glosario.md#brain) en varias líneas | regla del brain que se carga solo al escribir en `brain/` |
| Claude Code ignoró los permisos de `settings.json` porque la carpeta no estaba marcada como de confianza | documentado en [requisitos](../tutorial/requisitos.md) |
| La puerta de riesgo no bloqueaba `glab mr create` (GitLab) | añadido, con su test |

## Conclusión
En tareas pequeñas, meta-harness-factory cuesta unos céntimos más y a cambio deja el trabajo comprobado y escrito. En tareas grandes, el reparto entre modelos y el filtro de Maven ahorran más de lo que cuesta el [harness](../ayuda/glosario.md#harness). La medición pendiente es un [ASDD](../ayuda/glosario.md#asdd) completo, de la spec al [PR](../ayuda/glosario.md#pr), con y sin meta-harness-factory.
