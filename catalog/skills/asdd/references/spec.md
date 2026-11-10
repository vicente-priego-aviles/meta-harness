# Spec ASDD

Ruta: `brain/factory/specs/<slug>.md`. La redacta el subagente `especificador` tras consultar el brain. El usuario la aprueba; entonces `estado: aprobada` y `rama: <rama de trabajo>`.

```markdown
---
type: Spec
title: <Capacidad>
description: <Una frase: qué podrá hacer quién.>
tags: [spec, <contexto-acotado>]
estado: borrador          # borrador | aprobada | implementada | descartada
rama:
riesgo: <1|2>
sources:
  - { resource: ../../wiki/<tema>/<nota>.md }      # notas del brain consultadas
generated: { by: agent:<modelo>, at: <AAAA-MM-DD> }
---

# <Título>

## Problema
<Qué pasa hoy y a quién le duele.>

## Coste de no hacerlo
## Alternativa más barata
<Y por qué no basta.>

## Objetivos / No objetivos

## Las 4 preguntas
### 1. ¿Qué podrá hacer el usuario?
<Actor, acción, precondiciones, permisos.>
### 2. ¿Qué resultado observable obtiene?
<Respuesta de API esperada, pantalla Vaadin (boceto), estado del proceso BPMN… frente a una referencia aprobada.>
### 3. ¿Qué debe respetar?
<Restricciones, comportamiento existente que no cambia, decisiones del brain (enlázalas), lenguaje ubicuo.>
### 4. ¿Cómo se demuestra?
<Test o comando por cada criterio y dónde quedará la evidencia.>

## Criterios de aceptación
- **CA1** Dado <contexto>, cuando <acción>, entonces <resultado observable>.

## Puntos abiertos
| # | Tipo | Punto | Decisión |
|---|---|---|---|
| P1 | pregunta abierta \| supuesto tomado \| decisión aplazada | … | (la del usuario) |
```

## Aclarar (paso 2)
- Pregunta **en rondas**: en cada una, solo los puntos que ya se pueden decidir (los que no dependen de otro aún abierto), numerados y con tu respuesta recomendada, redactada para que «sí» la acepte.
- Los hechos (código, brain, configuración) los averiguas tú o el `explorador`; al usuario solo le llegan decisiones.
- Tras cada ronda, anota la decisión en la tabla y recalcula qué se puede preguntar ahora. Para cuando no quede nada por decidir.

Comprobación antes de pedir aprobación: cada criterio tiene prueba; no queda ninguna «pregunta abierta» sin decidir; los supuestos están a la vista.
