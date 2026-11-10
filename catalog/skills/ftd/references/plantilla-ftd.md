# Plantilla FTD

```markdown
---
type: FTD
title: <Qué se cambia, en pocas palabras>
description: <Una frase: el problema y el resultado esperado.>
tags: [ftd, <módulo>]
estado: en-curso          # en-curso | hecho | subido-a-asdd
rama: <rama o vacío>
riesgo: <0|1>
generated: { by: agent:<modelo>, at: <AAAA-MM-DD> }
---

# <Título>

## Intención
<Por qué y para quién. Enlaza la nota del brain o la incidencia si existe.>

## Alcance
- <qué entra>

## Fuera de alcance
- <qué no se toca>

## Checklist
- [ ] <Comportamiento 1> — prueba: `<test o comando>`
- [ ] <Comportamiento 2> — prueba: `<test o comando>`
- [ ] Controles: `node .mh/scripts/mvnq.mjs verify`

## Evidencia
> [!success] <Comportamiento 1>
> <salida recortada o descripción de la comprobación>

## Notas
<Decisiones menores, sorpresas, lo que se aprendió. Si es una decisión real → brain/wiki/decisiones/.>
```
