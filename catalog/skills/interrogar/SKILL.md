---
name: interrogar
description: Entrevista por rondas para afinar un plan, un diseño o una idea hasta no dejar nada supuesto; cada pregunta trae una respuesta recomendada. Se invoca con /interrogar.
disable-model-invocation: true
tags: [proceso, decisiones, entrevista]
origen: "Adaptada de una skill con licencia MIT; ver AVISOS-DE-TERCEROS.md"
---

# Interrogar

Entrevista al usuario hasta llegar a un entendimiento compartido. Trata las decisiones como un **árbol**: cada una abre las que dependen de ella.

## Rondas
1. La **frontera** son las decisiones cuyos requisitos ya están resueltos: lo que se puede preguntar ahora sin adivinar respuestas que aún no tienes.
2. Pregunta **toda la frontera en una ronda**, numerada, cada pregunta con tu respuesta recomendada y redactada para que «sí» la acepte:

   ```
   ❓ **P1 · <título>**: <pregunta; opciones si las hay>
   ➡️ <respuesta recomendada y por qué, en una línea>
   ```

3. Espera las respuestas. Recalcula la frontera con lo decidido y lanza la siguiente ronda. Una pregunta que depende de otra de la misma ronda va en la siguiente.

## Reglas
- **Los hechos los buscas tú; las decisiones son del usuario.** Lo que se pueda averiguar (código, brain, configuración, CLI) lo averigua el subagente `explorador` (o tú, si es una sola lectura); no lo preguntes. Mientras explora, pregunta lo que no dependa de ese dato.
- Consulta el brain: lo que ya decide `wiki/decisiones/` no se pregunta; se cita.
- Termina cuando la frontera queda vacía: todas las ramas visitadas y nada supuesto en silencio. Resume lo decidido y **no actúes** hasta que el usuario confirme el resumen.
- Dentro de ASDD, las decisiones van a «Puntos abiertos» de la spec; fuera, ofrece guardarlas con la skill `brain`.
