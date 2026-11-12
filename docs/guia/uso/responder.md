# Responder

Es el [carril](../ayuda/glosario.md#carril) de las **preguntas**: dónde está algo, por qué funciona así, qué pasaría si… El agente busca, lee y contesta, y **no escribe ningún archivo**.

## Cómo se usa
Pregunta con naturalidad. El agente anuncia el carril en una línea y responde:

```text
Tú:      ¿Qué worker procesa el job activar-cliente?
Agente:  Carril: Responder.
         ActivarClienteWorker, en infraestructura/adaptador/entrada/camunda/. Ningún BPMN
         desplegado usa ese job type, así que hoy no se ejecuta. Dos detalles: …
```
<small>Respuesta resumida de la prueba en el proyecto de reservas de viaje.</small>

## Qué aporta meta-harness-factory en una pregunta
En el proyecto de reservas de viaje se hizo la misma pregunta con y sin **[meta-harness-factory](../ayuda/glosario.md#meta-harness)**. Los dos encontraron el worker y vieron que ningún [BPMN](../ayuda/glosario.md#bpmn-dmn) lo usa. Con **meta-harness-factory**, el agente además:

- vio que leer `clienteId` puede lanzar un `NullPointerException` **fuera** del `try`, y que el job fallaría sin un error claro;
- citó la regla del proyecto que incumple el `catch (Exception e)` del worker (la regla de Camunda que se carga al leer código de workers).

Lo encontró porque **meta-harness-factory** le da contexto del stack solo cuando lo necesita: la regla de Camunda se carga al tocar un worker, no en cada sesión.

## Cuánto cuesta
| | Sin meta-harness-factory | Con meta-harness-factory |
|---|---|---|
| Coste | 0,092 USD | 0,131 USD (+42 %) |
| Turnos | 4 | 7 |

Una pregunta cuesta algo más con **meta-harness-factory**, porque el agente lee más (el caso de uso, la regla, el [brain](../ayuda/glosario.md#brain)) y cada turno vuelve a leer todo el contexto. A cambio, la respuesta es más completa. La diferencia en céntimos es pequeña; en la sección de [tokens](../tokens/index.md) está el desglose.

> [!tip] Preguntas más baratas
> - **Sé concreto**: «¿qué hace `ActivarClienteWorker` si el cliente no existe?» cuesta menos que «explícame los workers».
> - **Pregunta antes de pedir un cambio**: una respuesta cuesta céntimos; un cambio mal planteado, mucho más.
> - Para exploraciones grandes, el agente recurre al [subagente](../ayuda/glosario.md#subagente) `explorador`, que usa un modelo de lenguaje ([LLM](../ayuda/glosario.md#llm)) pequeño y barato (Haiku) y devuelve un resumen en vez de llenar la conversación de archivos.

## Cuándo una pregunta se convierte en otra cosa
Si en la respuesta aparece un fallo («esto nunca se captura»), el agente lo dice pero **no lo arregla** por su cuenta. Tú decides: «arréglalo» lo convierte en un [FTD](../ayuda/glosario.md#ftd); si hay que decidir cómo arreglarlo, en un [ASDD](../ayuda/glosario.md#asdd).
