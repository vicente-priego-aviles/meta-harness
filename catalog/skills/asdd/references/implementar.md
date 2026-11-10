# Bucle de implementación

## Progreso (`brain/factory/progreso/<slug>.md`, solo se añade)
```markdown
---
type: Progreso
title: Progreso — <capacidad>
spec: ../specs/<slug>.md
plan: ../planes/<slug>.md
estado: en-curso          # en-curso | cerrado
---

## 2026-11-09 · T001
- Resultado: hecho | bloqueado | aparcado
- Rondas de revisión: 1
- Evidencia: `mvnq test -Dtest=ReservaTest` → 4 tests, 0 fallos
- Siguiente: T002
```

## Encargo al desarrollador (subagente `desarrollador`)
Pásale: la tarea literal, su «hecho cuando», el §0 del plan y las rutas relevantes. Nada más.

## Revisión
Skill `revision` con el diff de la tarea. Hallazgos confirmados → vuelven al desarrollador con su evidencia. Cada hallazgo se cierra como `arreglado | falso | intencionado | irrelevante | aparcado` (con motivo).

## Cola de decisiones (`brain/factory/decisiones-pendientes.md`)
```markdown
- [bloqueante] D3 — <spec>/<tarea>: <qué hay que decidir>. Opciones: A) … B) …. Recomendación: …
- [revisar-después] D4 — <spec>/<tarea>: <qué se decidió provisionalmente y por qué>.
```
`bloqueante` detiene la tarea; `revisar-después` permite seguir. Al resolverse, se mueve a `wiki/decisiones/` si es relevante.

## Límites
3 rondas por tarea; si sigue fallando, aparca con diagnóstico y avisa. No cambies la spec en silencio: si hace falta, propón el cambio al usuario.
