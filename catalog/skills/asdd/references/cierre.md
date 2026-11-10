# Cierre

1. Integra la rama principal en la de trabajo y vuelve a pasar los controles.
2. Comprueba **cada criterio de aceptación** con su prueba (pregunta 4) y guarda la evidencia.
3. Escribe la verificación:

```markdown
---
type: Verificación
title: Verificación — <capacidad>
spec: ../specs/<slug>.md
rama: <rama>
fecha: <AAAA-MM-DD>
resultado: aprobada | con-fallos
---

| Criterio | Prueba | Resultado |
|---|---|---|
| CA1 | `…` | ✅ pasado · ❌ fallido · ⏸ no ejecutado |

## Controles
| Control | Resultado |
|---|---|
| `mvnq verify` | ✅ |
| ArchUnit | ✅ |
| Tests de proceso | ⏸ no ejecutado (motivo) |

## Evidencias
> [!success] CA1
> <salida recortada, respuesta de API, captura>

## Plan de vuelta atrás
<Cómo revertir: commit, migración inversa, versión anterior del proceso BPMN.>
```

4. Revisión de cierre (skill `revision`) sobre el diff completo; con resultado `aprobada` en `revisiones/<slug>.md`.
5. PR con: Qué · Por qué (enlace a la spec) · Pruebas (enlace a la verificación) · Riesgo · Cómo revertir. Riesgo 2 → el usuario aprueba el PR. Riesgo 0–1 con todo en verde → merge si el usuario lo autorizó.
6. Spec `estado: implementada`, progreso `estado: cerrado`. Decisiones y lecciones al brain.
