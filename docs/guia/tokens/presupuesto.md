# Presupuesto y medidas

Lo que está **siempre cargado** se paga en cada mensaje de cada sesión. Por eso **[meta-harness-factory](../ayuda/glosario.md#meta-harness)** le pone un presupuesto con límites concretos, lo enseña en el plan antes de instalar y lo mide después en tu proyecto.

## El presupuesto
| Pieza | Límite | Cómo se cumple |
|---|---|---|
| `CLAUDE.md` raíz | 120 líneas | es un índice (qué es el proyecto, mapa, comandos); los detalles van a [skills](../ayuda/glosario.md#skill), reglas o al [brain](../ayuda/glosario.md#brain) |
| Orientación al arrancar | 1,5 KB | el [hook](../ayuda/glosario.md#hook) de arranque recorta lo que no cabe |
| Descripción de cada skill | 300 caracteres | lo comprueban los tests del catálogo |
| Skills automáticas | 12 | las que solo se usan a veces son manuales (`/interrogar`, `/secuencia`, `/release`…) |
| Reglas siempre activas | 0 | todas las reglas llevan `paths` |
| Texto añadido en cada turno | 0 | los hooks avisan una sola vez; nada se reinyecta en cada mensaje |
| Servidores [MCP](../ayuda/glosario.md#mcp) | 0 por defecto | se prefieren las [CLI](../ayuda/glosario.md#cli) (`gh`, `mvn`, `docker`): solo cuestan cuando se usan |

## Medirlo en tu proyecto
`mh comprobar` mide lo que hay realmente instalado, incluidas las skills que ya tuvieras en `.claude/skills/`:

```text
Estado: LISTO
Presupuesto real: CLAUDE.md 31 líneas · orientación 803 B · 8 skills automáticas (1927 car.) · 10 subagentes (1515 car.) · reglas siempre activas 0
```

Si algo se pasa del límite, lo dice como aviso: un `CLAUDE.md` de más de 120 líneas, más de 12 skills automáticas o reglas sin `paths`.

Dentro de una sesión, `/context` enseña qué ocupa el contexto en ese momento: instrucciones fijas, herramientas, skills, archivos leídos y conversación.

## El coste fijo que no viene de meta-harness-factory
En el piloto, lo fijo que añadía **meta-harness-factory** eran unos 10.000 caracteres (≈ 3.000 [tokens](../ayuda/glosario.md#token)) entre skills, [subagentes](../ayuda/glosario.md#subagente), hooks y reglas. El **mayor coste fijo** era otro: las skills globales del usuario y las de los plugins instalados, unos 19.400 caracteres (≈ 5.000 tokens) **en cada petición** y en cualquier proyecto.

> [!tip] Revisa tus skills globales
> Cada skill de `~/.claude/skills/` y de cada plugin activo carga su descripción en todas las sesiones, la uses o no. Si tienes muchas, desactiva los plugins que no uses en este proyecto o mueve las skills que solo sirven para un proyecto a su `.claude/skills/`.

## Hábitos que ahorran
- **`/clear` al cambiar de tarea.** El brain guarda lo importante y la sesión nueva arranca orientada; seguir en la misma sesión arrastra todo lo leído antes.
- **Una tarea larga, una sesión.** Al revés que el punto anterior: si vas a seguir con lo mismo, no cierres y retomes. Retomar una sesión vuelve a cargar todo su contexto (en el tutorial, la misma tarea costó 0,36 USD de una vez y 0,44 USD más al retomarla para el commit).
- **Pregunta antes de pedir cambios.** Una pregunta ([carril](../ayuda/glosario.md#carril) Responder) es barata y evita un cambio mal planteado.
- **Deja que compacte.** meta-harness-factory configura la [compactación](../ayuda/glosario.md#compactacion) automática al 65 % del contexto (`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` en `.claude/settings.json`) y el hook de compactación le dice al resumen qué conservar: carril, documento, tarea y decisiones.

## Medidas opcionales
Probadas o valoradas, pero no activadas por defecto:

| Medida | Por qué no va por defecto |
|---|---|
| [LSP](../ayuda/glosario.md#lsp) de Java (`jdtls-lsp`) para ir a definiciones sin leer archivos enteros | recomendado, pero es un plugin que instalas tú y necesita un servidor de Java |
| Modos de respuesta telegráfica | ahorran poco: la salida es una parte mínima del gasto, y sus instrucciones ocupan contexto |
| Filtros genéricos de salida para git o Maven | `mvnq` cubre Maven, que es el caso caro; el resto se activará solo si una medición demuestra que mejora |
