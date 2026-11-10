# Plantilla de archivo raw

Ruta: `raw/<tema>/<AAAA-MM-DD>-<slug>.md` (fecha de publicación; si no se conoce, sin prefijo). Slug en kebab-case, máx. 60 caracteres; si existe, sufijo `-2`.

```markdown
---
tipo: fuente-raw
formato: articulo | documentacion | transcripcion-youtube | repositorio | tweet | nota-usuario
titulo: "<título original>"
autor: "<autor u organización>"
url: <url o descripción del origen>
publicado: <AAAA-MM-DD o Desconocida>
capturado: <AAAA-MM-DD>
herramienta: <defuddle 0.19.6 | yt-dlp | gh api @<commit> | manual>
---

<Contenido original. Conserva el texto fielmente. Limpia solo ruido de formato (espacios, restos de HTML,
navegación). No reescribas opiniones ni cambies el sentido.>
```

Para repositorios se puede guardar una carpeta `raw/repos/<nombre>/` con los archivos originales tal cual y anotar el commit y la licencia en `raw/LEEME.md`.
