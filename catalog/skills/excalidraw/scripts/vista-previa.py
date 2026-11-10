#!/usr/bin/env python3
"""Vista previa aproximada (PNG) de un diagrama Excalidraw, para revisarlo sin abrir Obsidian.

Uso: python3 -I vista-previa.py <diagrama.excalidraw.md|.excalidraw> <salida.png>
Necesita ImageMagick (`magick`) o `rsvg-convert`. El trazo "a mano" real lo dibuja Obsidian.
"""
import html, json, re, shutil, subprocess, sys, tempfile


def cargar(ruta):
    txt = open(ruta, encoding="utf-8").read()
    if ruta.endswith(".md"):
        m = re.search(r"```json\n(.*?)\n```", txt, re.S)
        if not m:
            sys.exit("No encuentro el bloque ```json (¿está comprimido? desactiva compressed-json en el plugin)")
        txt = m.group(1)
    return json.loads(txt)


def a_svg(d):
    E = [e for e in d["elements"] if not e.get("isDeleted")]
    X = min(e["x"] for e in E) - 20
    Y = min(e["y"] for e in E) - 20
    W = max(e["x"] + e["width"] for e in E) - X + 40
    H = max(e["y"] + e["height"] for e in E) - Y + 40
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="{X} {Y} {W} {H}">',
         '<defs><marker id="a" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">'
         '<path d="M0,0 L10,5 L0,10 z" fill="#495057"/></marker></defs>',
         f'<rect x="{X}" y="{Y}" width="{W}" height="{H}" fill="white"/>']
    for e in E:
        s, f = e["strokeColor"], e["backgroundColor"]
        f = "none" if f == "transparent" else f
        da = ' stroke-dasharray="8 6"' if e["strokeStyle"] == "dashed" else ""
        op = e.get("opacity", 100) / 100
        x, y, w, h = e["x"], e["y"], e["width"], e["height"]
        if e["type"] == "rectangle":
            o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{f}" stroke="{s}" stroke-width="2" opacity="{op}"{da}/>')
        elif e["type"] == "ellipse":
            o.append(f'<ellipse cx="{x+w/2}" cy="{y+h/2}" rx="{w/2}" ry="{h/2}" fill="{f}" stroke="{s}" stroke-width="2"{da}/>')
        elif e["type"] == "diamond":
            cx, cy = x + w / 2, y + h / 2
            o.append(f'<polygon points="{cx},{y} {x+w},{cy} {cx},{y+h} {x},{cy}" fill="{f}" stroke="{s}" stroke-width="2"{da}/>')
        elif e["type"] in ("arrow", "line"):
            pts = " ".join(f"{x+p[0]},{y+p[1]}" for p in e["points"])
            mk = ' marker-end="url(#a)"' if e.get("endArrowhead") else ""
            o.append(f'<polyline points="{pts}" fill="none" stroke="{s}" stroke-width="2"{da}{mk}/>')
    for e in E:
        if e["type"] == "text":
            fs = e["fontSize"]
            centro = e.get("textAlign") == "center"
            tx = e["x"] + e["width"] / 2 if centro else e["x"]
            for i, linea in enumerate(e["text"].split("\n")):
                o.append(f'<text x="{tx}" y="{e["y"] + fs * (i + 0.9) * 1.25}" font-size="{fs}" '
                         f'font-family="sans-serif" text-anchor="{"middle" if centro else "start"}">{html.escape(linea)}</text>')
    o.append("</svg>")
    return "\n".join(o)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False, encoding="utf-8") as t:
        t.write(a_svg(cargar(sys.argv[1])))
    if shutil.which("magick"):
        subprocess.run(["magick", t.name, sys.argv[2]], check=True)
    elif shutil.which("rsvg-convert"):
        subprocess.run(["rsvg-convert", t.name, "-o", sys.argv[2]], check=True)
    else:
        sys.exit(f"Sin conversor PNG; SVG en {t.name}")
    print(f"OK {sys.argv[2]}")


if __name__ == "__main__":
    main()
