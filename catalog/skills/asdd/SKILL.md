---
name: asdd
description: Carril ASDD (Agent Spec Driven Development) para cambios con decisiones abiertas, ambigüedad o riesgo 2 — spec de 4 preguntas aprobada por el usuario, plan con restricciones literales, bucle por tarea con revisión y cierre con evidencia.
tags: [factoria, asdd, spec, proceso]
---

# ASDD — Agent Spec Driven Development

Para cambios donde un supuesto equivocado sale caro: nuevas capacidades, procesos BPMN, modelo de dominio, migraciones, seguridad. **Ningún código antes de que el usuario apruebe la spec.**

Artefactos en `brain/factory/` (plantillas en `references/`, léelas al llegar a cada paso):

| Paso | Qué haces | Artefacto | Referencia |
|---|---|---|---|
| 0 | Si no existe, redacta la constitución con el usuario | `constitucion.md`, `revision.md` | `constitucion.md` |
| 1 | **Spec**: primero el subagente `explorador` (barato) hace un inventario de lo afectado (≤ 40 líneas con rutas); calcula el riesgo con `node .mh/scripts/riesgo.mjs <rutas>`; después delega en `especificador` pasándole el inventario, el riesgo y las notas del brain relevantes | `specs/<slug>.md` | `spec.md` |
| 2 | **Aclarar** en rondas (con respuesta recomendada; método de `/interrogar`); el usuario decide. ✋ **Aprobación** → `estado: aprobada` | spec | `spec.md` |
| 3 | **Plan + tareas**: §0 restricciones literales, contratos, pruebas por criterio, tareas `T001 [P]` en rebanadas verticales. Con gestor de tareas: reparto aprobado → tareas creadas (y épica si no hay tarea de origen; skill `tareas`) | `planes/<slug>.md` | `plan.md` |
| 4 | **Bucle por tarea** (abajo) | `progreso/<slug>.md` | `implementar.md` |
| 5 | **Cierre**: verificación final, evidencias, PR | `verificaciones/<slug>-<fecha>.md` | `cierre.md` |

## Bucle por tarea
1. Desarrollador (subagente `desarrollador`) hace la tarea con TDD y su comprobación de terminado.
2. `node .mh/scripts/riesgo.mjs` → elige el panel (skill `revision`).
3. Revisores con contexto limpio → verificador de hallazgos → solo lo confirmado vuelve al desarrollador.
4. Controles (`node .mh/scripts/mvnq.mjs verify`, ArchUnit, tests de proceso).
5. Como mucho **3 rondas** por tarea. Lo que necesite criterio humano va a `decisiones-pendientes.md`: `bloqueante` (para) o `revisar-después` (sigue).
6. Anota en `progreso/<slug>.md` (solo se añade): tarea, resultado, evidencia, siguiente.

## Reglas
- Consulta el brain antes de la spec y antes de cada decisión; no contradigas `wiki/decisiones/` sin decirlo.
- No rellenes huecos con supuestos: pregunta o anótalo como «supuesto tomado» en la spec.
- Una tarea por vez; deja el repo compilando al terminar cada una.
- «Hecho» = la prueba de la pregunta 4 con evidencia, no «tests en verde».
- Al aprobarse la spec, añade `rama:`; la puerta de riesgo exige spec aprobada y revisión para push/PR de riesgo 2.
- Modo autopiloto solo si el usuario lo pide: no preguntes entre pasos, aparca en la cola lo que necesite su criterio.
