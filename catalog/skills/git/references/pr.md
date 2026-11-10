# Pull requests

## Abrir
Título: el del commit principal (`fix(pagos): …`). Cuerpo:

```markdown
## Qué
<Resumen en 2–4 líneas.>

## Por qué
Tarea: #57 · Spec: brain/factory/specs/<slug>.md (o FTD: brain/factory/ftd/<slug>.md)

## Pruebas
Verificación: brain/factory/verificaciones/<slug>-<fecha>.md
- `node .mh/scripts/mvnq.mjs verify` → <resultado>
- Criterios: CA1 ✅ · CA2 ✅

## Riesgo
<0|1|2> según `node .mh/scripts/riesgo.mjs` — <archivos sensibles si los hay>

## Cómo revertir
<revert del merge; migración inversa; versión anterior del proceso BPMN…>

Closes #57
```

- GitHub: `gh pr create --base <ramaBase> --title "…" --body-file <archivo>`. GitLab: `glab mr create --target-branch <ramaBase> --title "…" --description "…"`.
- Push y PR solo si el usuario lo pide. Riesgo 2: la puerta de riesgo exige spec aprobada y revisión; el merge lo aprueba el usuario.

## Atender comentarios de revisión
1. **Reúne** los comentarios pendientes (`gh pr view <n> --comments`, `gh api repos/{owner}/{repo}/pulls/<n>/comments`) y ordénalos para que se lean con sentido (primero los de diseño, luego los de detalle).
2. **Presenta cada uno** con su archivo y línea, tu valoración (aplicar, aplicar con matices, no aplicar) y la razón; contrástalo con el código como un hallazgo (skill `revision`).
3. **Plan**: lista lo que vas a cambiar y lo que vas a responder; el usuario lo aprueba.
4. **Ejecuta**: commits con la convención; **haz push antes de responder** si la respuesta cita un commit; resuelve solo los hilos que el plan marca; vuelve a pedir revisión al final.
