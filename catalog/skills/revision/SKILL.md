---
name: revision
description: Revisión de un cambio con subagentes de contexto limpio elegidos por riesgo, verificación de hallazgos contra el código y registro en brain/factory/revisiones/. Úsala en cada tarea ASDD, en FTD de riesgo 1 y antes de push/PR.
tags: [factoria, revision, calidad]
---

# Revisión con contexto limpio

Quien escribió el código no lo revisa. Los revisores son **subagentes de solo lectura** que reciben el diff y las reglas, no la conversación.

## 1. Elegir el panel
`node .mh/scripts/riesgo.mjs` y los archivos tocados deciden:

| Situación | Revisores |
|---|---|
| Riesgo 0 | ninguno (controles básicos) |
| Riesgo 1 | **un** revisor: el del terreno principal del diff (abajo); si no hay de stack, `revisor-correccion` |
| Riesgo 2 | `revisor-correccion` + `revisor-tests` + `revisor-seguridad` + **todos** los de stack que toque el diff |

Revisores de stack (si están instalados), por orden de prioridad para riesgo 1:

| Terreno del diff | Revisor |
|---|---|
| workers, `*.bpmn`, `*.dmn`, formularios | `revisor-camunda` |
| `dominio/`, `aplicacion/`, adaptadores | `revisor-ddd` |
| resto de Java, configuración, migraciones | `revisor-java-spring` |

El panel crece con el riesgo porque cada revisor es una llamada completa a un modelo.

## 2. Encargo a cada revisor
Pásale solo: el diff (`git diff <base>...HEAD -- <rutas>`), el §0 del plan o el alcance del FTD, `brain/factory/revision.md` y la ruta de la spec. Lanza los revisores en paralelo.

## 3. Verificar hallazgos
Junta los hallazgos, quita duplicados y pásalos al `verificador-hallazgos`. Solo lo **CONFIRMADO** vuelve al desarrollador. REFUTADO se descarta con motivo; SIN PROBAR se anota y se decide (cola de decisiones si es relevante).

## 4. Registrar
`brain/factory/revisiones/<slug>.md`:
```markdown
---
type: Revisión
title: Revisión — <slug>
rama: <rama>
resultado: abierta        # abierta | aprobada | rechazada
rondas: 1
---
| # | Revisor | Hallazgo | Gravedad | Veredicto | Cierre |
|---|---|---|---|---|---|
| H1 | correccion | `Reserva.java:42` … | alta | CONFIRMADO | arreglado (commit abc123) |
```
Cierres válidos: `arreglado | falso | intencionado | irrelevante | aparcado` (siempre con motivo). `resultado: aprobada` cuando no quedan confirmados abiertos. Máximo 3 rondas; después, a la cola de decisiones.
