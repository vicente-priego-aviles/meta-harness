---
name: ftd
description: Carril FTD (Fast Track Development) para cambios claros sin decisiones abiertas — un documento con intención, alcance y checklist con prueba, TDD, riesgo, revisión si hace falta y evidencia. Úsala al corregir un bug acotado o hacer un cambio pequeño y claro.
tags: [factoria, ftd, proceso]
---

# FTD — Fast Track Development

Cambio **claro y sin decisiones abiertas**. Si aparece ambigüedad, una decisión que no te corresponde o riesgo 2, **para y sube a ASDD** (skill `asdd`).

## Pasos
1. **Consulta el brain**: `brain/wiki/index.md` y notas relacionadas (decisiones, arquitectura, glosario). Si lo pedido contradice una decisión, dilo antes de seguir.
2. **Rama**: si el proyecto integra con ramas (`.mh.json` → `git.ramasProtegidas`) y estás en una protegida, crea ya la rama de trabajo con el formato del proyecto (skill `git`); no lo dejes para el commit.
3. **Crea el documento** `brain/factory/ftd/<AAAA-MM-DD>-<slug>.md` con `references/plantilla-ftd.md` (intención, alcance, fuera de alcance, checklist con la prueba de cada punto). Anota `rama:` si trabajas en rama.
4. **Riesgo previsto, antes de tocar nada**: `node .mh/scripts/riesgo.mjs <rutas que vas a cambiar>` (sin rutas solo mira el diff actual, que al empezar está vacío). Si sale 2 (p. ej. un `.bpmn`, una migración, el `pom.xml`), **sube a ASDD** desde el principio.
5. **Arranque**: si vas a ejecutar la app, `./init.sh` y smoke test antes de tocar nada.
6. **TDD**: test que falla → código mínimo → test en verde → refactor. No debilites tests para que pasen.
7. **Riesgo real** al terminar: `node .mh/scripts/riesgo.mjs`.
   - 0 → sigue. 1 → un revisor de contexto limpio (skill `revision`, panel mínimo). 2 → **sube a ASDD**.
8. **Controles**: `node .mh/scripts/mvnq.mjs verify` (y los de la constitución). Lo que no ejecutes queda como «no ejecutado», nunca «pasado».
9. **Evidencia**: en la sección Evidencia del FTD, salida relevante de tests/comandos (recortada) y cómo se comprobó el comportamiento. Marca cada punto del checklist solo con su prueba.
10. **Cierre**: `estado: hecho`, commit con el código y el FTD juntos. Si salió una decisión o lección, guárdala (skill `brain`, «recordar»).

## Qué no hacer
- Hacer push o merge sin que el usuario lo pida (crear la rama de trabajo sí, como dice el paso 2).
- Ampliar el alcance sin anotarlo en el FTD y decirlo.
- Cerrar con «tests en verde» sin la evidencia del comportamiento pedido.
