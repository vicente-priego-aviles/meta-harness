# Subagentes

Un **[subagente](../ayuda/glosario.md#subagente)** es un agente que el agente principal lanza para una tarea concreta. Trabaja en **su propio contexto**: no ve la conversación, recibe solo lo que se le pasa y devuelve un resumen. Cada uno está definido en `.claude/agents/<nombre>.md` con su modelo, las herramientas que puede usar y sus instrucciones.

El agente principal los llama de dos maneras: porque una [skill](../ayuda/glosario.md#skill) se lo indica (por ejemplo, [ASDD](../ayuda/glosario.md#asdd) lanza el `especificador`), o por su cuenta, cuando la descripción del subagente encaja con lo que tiene que hacer (por ejemplo, el `explorador` para una búsqueda que exige leer mucho).

## Núcleo
| Subagente | Modelo | Herramientas | Qué hace | Quién lo llama |
|---|---|---|---|---|
| `explorador` | Haiku | leer y buscar | Busca en el código y el [brain](../ayuda/glosario.md#brain) y devuelve un resumen corto con rutas, sin volcar archivos | ASDD (inventario), `/secuencia`, `/interrogar`, o el agente para preguntas que exigen leer mucho |
| `ejecutor-tests` | Haiku | leer y comandos | Lanza tests o builds largos y devuelve solo el resultado y los fallos resumidos | el agente, para no llenar su contexto con la salida |
| `especificador` | Opus | leer, buscar y escribir | Redacta la [spec](../ayuda/glosario.md#spec) de cuatro preguntas y el plan con las restricciones literales, a partir del brain | ASDD, pasos 1 y 3 |
| `desarrollador` | Sonnet | leer, buscar, editar y comandos | Implementa **una** tarea del plan o del [FTD](../ayuda/glosario.md#ftd) con [TDD](../ayuda/glosario.md#tdd) y comprueba que está terminada | el bucle de ASDD y la corrección de hallazgos confirmados |
| `revisor-correccion` | Sonnet | solo lectura | Errores lógicos, casos límite y efectos en otras partes del código | skill `revision` |
| `revisor-tests` | Sonnet | solo lectura | Comprueba que los tests prueban de verdad el comportamiento pedido | skill `revision`, cuando se tocan o añaden tests |
| `revisor-seguridad` | Sonnet | solo lectura | Autenticación, autorización, datos, migraciones, secretos y entrada externa | skill `revision`, en riesgo 2 |
| `verificador-hallazgos` | Sonnet | solo lectura | Parte de que cada hallazgo es falso y lo comprueba contra el código: CONFIRMADO, REFUTADO o SIN PROBAR | skill `revision` |

## De los módulos de stack
| Subagente | Módulo | Modelo | Herramientas | Qué hace |
|---|---|---|---|---|
| `revisor-java-spring` | java | Sonnet | solo lectura | Transacciones, inyección, errores, JPA, migraciones y tests |
| `reparador-compilacion` | java | Sonnet | leer, buscar, editar y comandos | Arregla un error de compilación o de dependencias con el cambio mínimo, en tres intentos como mucho, sin tocar tests ni reglas de calidad |
| `revisor-ddd` | ddd | Sonnet | solo lectura | Dominio sin dependencias técnicas, agregados, capas y [lenguaje ubicuo](../ayuda/glosario.md#lenguaje-ubicuo) |
| `revisor-camunda` | camunda | Sonnet | solo lectura | Workers [idempotentes](../ayuda/glosario.md#idempotencia), errores, variables y compatibilidad con las [instancias en vuelo](../ayuda/glosario.md#instancia-en-vuelo) |

Los revisores de stack **precargan la skill de su terreno** (`java-spring-boot`, `ddd-hexagonal` o `camunda-8`), igual que `reparador-compilacion`: revisan y corrigen con las mismas reglas con las que se escribió el código.

## Qué revisores actúan
Los elige la skill `revision` según el [riesgo](../ayuda/glosario.md#riesgo) real del cambio:

| Riesgo | Panel |
|---|---|
| 0 | ninguno |
| 1 | uno: el del terreno del cambio (Camunda, después [DDD](../ayuda/glosario.md#ddd), después Java/Spring); si no hay de stack, `revisor-correccion` |
| 2 | `revisor-correccion`, `revisor-tests`, `revisor-seguridad` y todos los de stack que toque el cambio |

Los hallazgos que piden un cambio pasan siempre por `verificador-hallazgos` antes de volver al `desarrollador`. Detalle en [riesgo y revisión](../uso/riesgo-revision.md#la-revision-con-contexto-limpio).

## Cambiar un modelo
El modelo de cada subagente está en la línea `model:` de su archivo (`haiku`, `sonnet` u `opus`). Puedes cambiarlo, pero ten en cuenta dos cosas: `mh actualizar` lo devuelve al del catálogo, y el reparto actual está medido (con el inventario de Haiku antes del `especificador`, una spec costó un 59 % menos; ver [ASDD](../uso/asdd.md#cuanto-cuesta)). Las tarifas de cada modelo están en [FTD](../uso/ftd.md#cuanto-cuesta).
