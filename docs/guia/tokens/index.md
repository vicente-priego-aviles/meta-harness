# Ahorro de tokens

Un **[token](../ayuda/glosario.md#token)** es la unidad en la que el modelo lee y escribe texto: unos cuatro caracteres. Todo se paga en tokens, y la idea que guía esta sección es que **lo caro no es lo que el modelo escribe, sino lo que lee una y otra vez**.

## Dónde se gastan los tokens
En cada mensaje, Claude Code envía al modelo **todo el contexto de la sesión**: las instrucciones fijas, la conversación, cada archivo leído y cada salida de comando hasta ese momento. Una salida de Maven de 800 líneas leída al principio se vuelve a enviar en cada mensaje siguiente, hasta que la sesión se compacta o haces `/clear`.

Por eso, en las mediciones de **[meta-harness-factory](../ayuda/glosario.md#meta-harness)**, lo que escribe el modelo es una parte mínima del gasto, y pedirle «responde breve» ahorra poco. Lo que ahorra de verdad es **leer menos**:

| Dónde | Qué hace meta-harness-factory | Detalle |
|---|---|---|
| Lo que está siempre cargado | `CLAUDE.md` corto, descripciones de [skills](../ayuda/glosario.md#skill) medidas, ninguna regla [siempre activa](../ayuda/glosario.md#siempre-activo), orientación de arranque de 1,5 KB como mucho | [presupuesto](presupuesto.md) |
| Lo que se carga al trabajar | reglas y skills de stack solo al tocar sus archivos; el [brain](../ayuda/glosario.md#brain) se consulta por su índice, nunca entero | [las cinco capas](../arquitectura/capas.md#lo-que-carga-claude-code-y-cuando) |
| La salida de las herramientas | Maven filtrado con `mvnq` (≈ 99 % menos); tareas del gestor resumidas por `tarea.mjs`; páginas web limpias con `defuddle` | [salida de Maven](mvnq.md) |
| El reparto del trabajo | lo mecánico (explorar, lanzar tests) en [subagentes](../ayuda/glosario.md#subagente) con Haiku, que devuelven un resumen; Opus solo para la [spec](../ayuda/glosario.md#spec) | [subagentes](../referencia/subagentes.md) |
| La duración de la sesión | [compactación](../ayuda/glosario.md#compactacion) automática al 65 % del contexto y `/clear` entre tareas | [presupuesto](presupuesto.md#habitos-que-ahorran) |

## Lo que dicen las mediciones
- En tareas **pequeñas**, meta-harness-factory cuesta algo **más** (+16 % en un [FTD](../ayuda/glosario.md#ftd), +42 % en una pregunta): el agente lee más y escribe el documento y la evidencia. A cambio, el trabajo queda más completo y comprobado.
- En tareas **grandes** es donde ahorra: en una spec [ASDD](../ayuda/glosario.md#asdd), mandar a un modelo pequeño a hacer el inventario antes de que el grande escriba bajó el coste un **59 %**.
- Filtrar la salida de Maven quita unos 24.000 tokens **por compilación**.

Todas las cifras, con su método, en [resultados medidos](resultados.md).

## Lo que no hace
- **No envía tu contexto a terceros.** Hay herramientas que comprimen el contexto pasándolo por un servicio externo; meta-harness-factory no usa ninguna.
- **No repite instrucciones en cada mensaje.** La orientación se da al arrancar y tras compactar, no en cada turno: cada repetición se quedaría en el contexto.
- **No usa equipos de agentes** (*agent teams*): multiplican el gasto y un cambio normal no los necesita.
