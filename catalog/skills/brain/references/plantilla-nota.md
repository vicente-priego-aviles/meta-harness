# Plantillas de nota de la wiki (OKF)

## Nota de conocimiento
```markdown
---
type: <Fuente | Concepto | Decisión | Lección | Comparativa | …>
title: <Título>
description: <Una frase. Es lo que aparece en el índice.>
tags: [<tema>, <tema>]
sources:
  - { id: <clave>, resource: ../../raw/<tema>/<archivo>.md, title: "<qué es>" }
  - { resource: ../<otro-tema>/<nota>.md }          # otra nota de la wiki (sus raw cuentan como evidencia)
generated: { by: agent:<modelo>, at: <AAAA-MM-DD> }
# verified: { by: human:<nombre>, at: <AAAA-MM-DD> }   # cuando el usuario la revise
status: stable          # draft | stable | deprecated
# stale_after: <AAAA-MM-DDT00:00:00Z>                # si caduca (versiones, precios, estrellas…)
---

# <Título>

<Un párrafo de resumen.>

## <Secciones>
<Destila y reorganiza; no copies. Citas literales con "…" solo si están tal cual en el raw; paráfrasis con «…».>

> [!warning] Desactualizado (AAAA-MM-DD)
> <Qué cambió y cuál es lo vigente, con su fuente.>

> [!question] En disputa
> <Las versiones enfrentadas, cada una con su fuente.>

## Ver también
- [<Otra nota>](<otra-nota>.md)
- [<Nota de otro tema>](../<otro-tema>/<nota>.md)
```

## Respuesta archivada (desde una consulta)
```markdown
---
type: Respuesta archivada
title: <Pregunta o tema>
description: <Una frase.>
tags: [archivada, <tema>]
sources:
  - { resource: ../<tema>/<nota-citada>.md }
generated: { by: agent:<modelo>, at: <AAAA-MM-DD> }
status: stable
---

# <Título>

<Respuesta sintetizada. Es una foto fija: no se actualiza en cascada.>
```
