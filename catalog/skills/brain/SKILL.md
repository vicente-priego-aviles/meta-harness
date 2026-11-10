---
name: brain
description: Mantiene el brain del proyecto (raw/ inmutable + wiki/ del agente, Obsidian). Úsala para ingerir una fuente, consultar qué sabemos, guardar una decisión o lección («recuérdalo») o hacer lint del brain. No para specs o FTD.
tags: [brain, obsidian, conocimiento, okf, llm-wiki]
origen: "Adaptada de una skill con licencia MIT; ver AVISOS-DE-TERCEROS.md; formato OKF y convenciones del meta-harness"
---

# Brain

El brain es la memoria duradera del proyecto. Patrón «LLM Wiki»: **el agente escribe y mantiene la wiki; el usuario la lee y pregunta**. Se consulta antes de actuar y se actualiza después.

## Dónde está
La raíz del brain se declara en el `CLAUDE.md` del proyecto con una línea `Brain: <ruta>`. Dentro hay:
- `raw/` — fuentes originales, **inmutables**. Se leen, nunca se editan.
- `wiki/` — notas escritas por el agente, un nivel de carpetas por tema: `wiki/<tema>/<nota>.md`.
- `wiki/index.md` — catálogo (formato OKF, sin frontmatter) · `wiki/log.md` — historial, lo más reciente arriba.

Si falta la estructura en la primera ingesta, crea solo lo que falte; nunca sobrescribas. Para consultar o hacer lint sin estructura: di «Primero hay que ingerir una fuente para crear el brain».

## Regla de oro: datos anclados a la fuente
Toda cifra, fecha o cita literal de `wiki/` **existe tal cual en los raw** que la nota cita en `sources`.
- Antes de escribir un dato, **localízalo** en el raw (grep o lectura) y cópialo exacto.
- Valores calculados: muestra sus componentes (cada uno localizable).
- Si no lo encuentras, no lo escribas con precisión: quítalo o dilo sin cifra.
- Cita literal → comillas rectas `"…"`. Traducción o paráfrasis → comillas españolas `«…»` (no se verifican).
- `scripts/verificar_evidencias.py` lo comprueba (ver Lint).

---

## Ingerir
1. **Guardar en raw/**: `raw/<tema>/<slug>.md` con la cabecera de `references/plantilla-raw.md`.
   - Página web: `npx -y defuddle@0.19.6 parse <url> --md -o <archivo>` (skill `defuddle`); si falla, WebFetch.
   - Vídeo de YouTube: subtítulos con `yt-dlp --skip-download --write-auto-subs --sub-langs "es.*,en.*"`.
   - Repo: archivos clave con `gh api` y el commit en la cabecera. Conserva el texto; limpia solo ruido.
2. **Clasificar** antes de tocar wiki/: busca en wiki/ las entidades clave y sinónimos y declara: **Nueva** (crea nota) · **Actualiza** (fusiona en nota existente) · **En disputa** (contradice algo; combinable) · **Sin material** (no aporta nada: guarda el raw, regístralo en el log y para; no fuerces una nota).
3. **Compilar**: misma tesis → fusiona en la nota existente y añade la fuente; concepto nuevo → nota nueva con el nombre del concepto; varios temas → la carpeta más relevante + sección «Ver también». Formato en `references/plantilla-nota.md`.
4. **Cascada**: busca en toda la wiki (no solo en el índice) las entidades y afirmaciones afectadas y actualiza cada nota tocada (y su `generated.at`). Si algo queda superado o en conflicto, **no lo borres**: márcalo con un callout `> [!warning] Desactualizado (AAAA-MM-DD)` o `> [!question] En disputa`.
5. **Índice y log**: añade/actualiza las entradas en `wiki/index.md` y apunta en `wiki/log.md` (formatos en `references/formato-index-log.md`).

Varias fuentes a la vez: se pueden buscar en paralelo, pero **se compilan de una en una** (índice, log y cascada son estado compartido).

## Consultar
1. Lee `wiki/index.md` y busca en wiki/ los términos **y sus sinónimos**. No digas «el brain no tiene nada» sin haber hecho ambas cosas, y di que lo hiciste.
2. Lee solo las notas encontradas (nunca cargues la wiki entera) y responde citándolas con enlaces relativos a la raíz.
3. Prefiere el brain a tu conocimiento propio; si lo completas con conocimiento propio, dilo.
4. No escribas archivos salvo que lo pidan. Si piden guardar la respuesta: nota nueva `type: Respuesta archivada` (`references/plantilla-nota.md`), nunca fusionada; entrada en índice con prefijo «[Archivada]» y en el log.

## Recordar («recuérdalo», «apunta que…»)
Decisiones y lecciones van al brain, no a la memoria privada del agente:
- Decisión → nota en `wiki/decisiones/` (o ADR si el proyecto los usa) con contexto, decisión y fuente.
- Lección → `wiki/lecciones/` con `status: draft` hasta que el usuario la revise (`verified: { by: human:<nombre>, … }`).

## Lint
**Arreglos seguros (automáticos)**
- Índice ↔ archivos: añade notas que falten (resumen = su `description`), marca `[FALTA]` las entradas sin archivo (no las borres).
- Enlaces internos y `sources` rotos: si hay un único archivo con ese nombre, corrige la ruta; si no, informa.

**Informe mecánico (no se arregla solo)**
```bash
python3 -I <ruta-skill>/scripts/verificar_evidencias.py <raiz-brain> [nota.md …]
```
Sospechosos de fidelidad (júzgalos contra el raw: los valores derivados o traducidos también salen), errores de evidencia (notas sin raw, recursos inexistentes) y raw sin citar (pendientes de ingerir).

**Informe de criterio (no se arregla solo)**: contradicciones entre notas, afirmaciones superadas sin callout, notas huérfanas, conceptos citados a menudo sin nota propia, notas con `stale_after` vencido, respuestas archivadas cuyas fuentes cambiaron mucho.

Al terminar: entrada en el log `* **Lint**: N problemas, M arreglados`.

## Convenciones
- Formato **OKF** + callouts de Obsidian; enlaces markdown **relativos al archivo** dentro de la wiki y relativos a la raíz del proyecto en la conversación (skill `obsidian-markdown`).
- Una sola capa de carpetas de tema en wiki/.
- Fechas: hoy para log y captura; `generated.at` = último cambio de contenido (no de formato).
- La longitud es un coste: notas que destilan, no que copian.
