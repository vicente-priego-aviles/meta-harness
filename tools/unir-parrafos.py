#!/usr/bin/env python3
"""Une los párrafos partidos con saltos de línea manuales (Obsidian los muestra como saltos reales).

Uso: python3 -I tools/unir-parrafos.py [--comprobar] <archivo.md|carpeta> ...
  --comprobar  no modifica: lista los archivos que tienen párrafos partidos (código de salida 1 si hay alguno).

No toca: frontmatter, bloques de código, tablas, encabezados, separadores ni los dibujos .excalidraw.md.
Une: líneas de un mismo párrafo, continuaciones de un elemento de lista y de un callout/cita.
"""
import pathlib
import re
import sys

INICIO_BLOQUE = re.compile(r"^\s*(\*\*[^*\n]+\*\*\s*:|[-*+]\s|\d+[.)]\s|#|\||>|```|~~~|---\s*$|\*\*\*\s*$|<!--|!\[\[|\$\$|%%|\[\^)")
LISTA = re.compile(r"^(\s*)([-*+]|\d+[.)])\s")


ETIQUETA = re.compile(r"^\s*\*\*[^*\n]+\*\*\s*:")


def es_texto(linea, como_anterior=False):
    """¿Es una línea de prosa? Una línea «**Etiqueta**: …» empieza párrafo, pero puede continuarse."""
    if linea.strip() == "":
        return False
    if como_anterior and ETIQUETA.match(linea):
        return True
    return not INICIO_BLOQUE.match(linea)


def unir(texto):
    lineas = texto.split("\n")
    out = []
    i = 0
    # frontmatter
    if lineas and lineas[0] == "---":
        fin = next((j for j in range(1, len(lineas)) if lineas[j] == "---"), None)
        if fin is not None:
            out.extend(lineas[: fin + 1])
            i = fin + 1
    en_codigo = False
    for linea in lineas[i:]:
        if re.match(r"^\s*(```|~~~)", linea):
            en_codigo = not en_codigo
            out.append(linea)
            continue
        if en_codigo or not out:
            out.append(linea)
            continue
        prev = out[-1]
        # continuación de cita/callout: "> texto" tras "> texto" (no si empieza un callout o elemento nuevo)
        if linea.startswith(">") and prev.startswith(">"):
            cont = linea[1:].strip()
            prev_cont = prev[1:].strip()
            if cont and prev_cont and not cont.startswith("[!") and not prev_cont.startswith("[!") and not INICIO_BLOQUE.match(cont) and not prev.rstrip().endswith("  "):
                out[-1] = prev.rstrip() + " " + cont
                continue
            out.append(linea)
            continue
        # continuación de un elemento de lista (línea sangrada que no es un elemento nuevo)
        if prev.strip() and (LISTA.match(prev) or out_es_lista(out)) and linea.startswith((" ", "\t")) and linea.strip() \
                and not LISTA.match(linea) and not INICIO_BLOQUE.match(linea.strip()):
            out[-1] = prev.rstrip() + " " + linea.strip()
            continue
        # continuación de párrafo normal
        if es_texto(linea) and es_texto(prev, como_anterior=True) and not linea.startswith((" ", "\t")) and not prev.rstrip().endswith("  "):
            out[-1] = prev.rstrip() + " " + linea.strip()
            continue
        out.append(linea)
    return "\n".join(out)


def out_es_lista(out):
    """¿La última línea escrita pertenece a un elemento de lista (ya unido)?"""
    return bool(out) and bool(LISTA.match(out[-1]))


def archivos(rutas):
    for r in rutas:
        p = pathlib.Path(r)
        candidatos = p.rglob("*.md") if p.is_dir() else [p]
        for f in candidatos:
            if f.name.endswith(".excalidraw.md") or "/raw/" in str(f) or "/vendor/" in str(f) or "/always-on/" in str(f):
                continue
            yield f


def main():
    args = sys.argv[1:]
    comprobar = "--comprobar" in args
    rutas = [a for a in args if a != "--comprobar"]
    if not rutas:
        sys.exit(__doc__)
    cambiados = []
    for f in archivos(rutas):
        txt = f.read_text(encoding="utf-8")
        nuevo = unir(txt)
        if nuevo != txt:
            cambiados.append(str(f))
            if not comprobar:
                f.write_text(nuevo, encoding="utf-8")
    verbo = "con párrafos partidos" if comprobar else "corregidos"
    print(f"{len(cambiados)} archivos {verbo}")
    for c in cambiados:
        print(f"  {c}")
    if comprobar and cambiados:
        sys.exit(1)


if __name__ == "__main__":
    main()
