# Plan y tareas

Ruta: `brain/factory/planes/<slug>.md`. Lo redacta el subagente `especificador` a partir de la spec aprobada.

```markdown
---
type: Plan
title: Plan — <capacidad>
description: <Una frase.>
tags: [plan]
spec: ../specs/<slug>.md
estado: vigente           # vigente | cerrado
generated: { by: agent:<modelo>, at: <AAAA-MM-DD> }
---

# Plan — <capacidad>

## §0 Restricciones globales (literales)
<Copiadas TAL CUAL de la constitución, la spec (pregunta 3) y las decisiones del brain que apliquen.
El desarrollador y los revisores trabajan aislados: esto es lo único que verán seguro.>
- …

## Arquitectura
<Contexto acotado, capas hexagonales tocadas (dominio · aplicación · infraestructura/adaptadores), procesos BPMN.>

## Contratos
<API REST, eventos, mensajes Zeebe, variables de proceso, puertos.>

## Datos
<Entidades, migraciones (riesgo 2).>

## Estrategia de pruebas
| Criterio | Tipo de prueba | Dónde |
|---|---|---|
| CA1 | test de dominio / integración / proceso / e2e | `…Test.java` |

## Tareas
| Id | Tarea | Hecho cuando (literal) | Depende | CA | Gestor |
|---|---|---|---|---|---|
| T001 [P] | … | `node .mh/scripts/mvnq.mjs test -Dtest=…` pasa | — | CA1 | <id al crearla> |

## Riesgos
```

Reglas:
- Tareas pequeñas (una sesión como mucho); `[P]` solo si no comparten archivos; cada tarea deja el repo compilando.
- **Rebanadas verticales**: cada tarea atraviesa las capas que necesite (dominio, aplicación, adaptador, proceso, vista, test) y se puede demostrar sola; no «primero toda la base de datos, luego toda la API». La preparación del código (refactor previo) va primero.
- **Refactor amplio** (renombrar algo usado en todo el código): ampliar (lo nuevo junto a lo viejo) → migrar por lotes (una tarea por módulo) → retirar lo viejo.
- «Depende» solo lista las tareas que de verdad bloquean; se convierte en el bloqueo de la tarea en el gestor.
