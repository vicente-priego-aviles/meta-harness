---
name: defuddle
description: Convierte una página web en Markdown limpio (sin menús, anuncios ni ruido) con Defuddle CLI, gastando menos tokens que WebFetch. Úsala para leer documentación o artículos web y para guardar fuentes en raw/ del brain.
disable-model-invocation: true
tags: [web, ingesta, tokens, brain]
origen: "Adaptada de una skill con licencia MIT; ver AVISOS-DE-TERCEROS.md"
---

# Defuddle

Extrae el contenido legible de una página y lo devuelve en Markdown. Prefiérelo a WebFetch en páginas normales: quita navegación y ruido y **reduce tokens**. No hace falta instalarlo: se ejecuta con `npx` (versión fijada).

## Uso
```bash
npx -y defuddle@0.19.6 parse <url> --md                 # a la salida
npx -y defuddle@0.19.6 parse <url> --md -o archivo.md   # a un archivo
npx -y defuddle@0.19.6 parse <url> -p title             # solo un metadato: title, description, domain…
```

| Opción | Salida |
|---|---|
| `--md` | Markdown (la habitual) |
| `--json` | JSON con HTML y Markdown |
| `-p <nombre>` | un metadato |

## Para guardar una fuente en el brain
1. `npx -y defuddle@0.19.6 parse <url> --md -o raw/<tema>/<AAAA-MM-DD>-<slug>.md`
2. Añade arriba la cabecera de `brain/references/plantilla-raw.md` (`herramienta: defuddle 0.19.6`).
3. Sigue con la ingesta de la skill `brain`.

## Cuándo no sirve
Páginas que necesitan JavaScript o login, PDFs y vídeos: usa WebFetch, el navegador o `yt-dlp`. Si `npx` no tiene red o falla, usa WebFetch y dilo.
