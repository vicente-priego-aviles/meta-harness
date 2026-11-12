#!/usr/bin/env python3
"""Genera un diagrama Excalidraw a partir de una especificación JSON corta.

Uso:
    python3 -I diagrama.py <spec.json> <salida.excalidraw.md>   # formato Obsidian (por defecto)
    python3 -I diagrama.py <spec.json> <salida.excalidraw>      # JSON puro (excalidraw.com)

La especificación evita escribir a mano cientos de líneas de JSON: el agente describe
nodos, flechas y grupos, y este script calcula posiciones, tamaños y enlaces.
Formato de la especificación: ver ../references/formato-spec.md
Solo usa la biblioteca estándar de Python.
"""
import json
import random
import sys
import time

COLORES = {  # nombre -> (fondo, trazo)
    "azul": ("#a5d8ff", "#1971c2"),
    "verde": ("#b2f2bb", "#2f9e44"),
    "amarillo": ("#ffec99", "#f08c00"),
    "rojo": ("#ffc9c9", "#e03131"),
    "morado": ("#d0bfff", "#6741d9"),
    "naranja": ("#ffd8a8", "#e8590c"),
    "gris": ("#e9ecef", "#495057"),
    "blanco": ("#ffffff", "#1e1e1e"),
    "transparente": ("transparent", "#1e1e1e"),
}
FUENTE = 5          # Excalifont
TAM_TEXTO = 20
ANCHO_CHAR = 0.55   # estimación de ancho de carácter / tamaño de fuente
ALTO_LINEA = 1.25

_contador = 0
AHORA = int(time.time() * 1000)


def nuevo_id(prefijo="e"):
    global _contador
    _contador += 1
    return f"{prefijo}{_contador:03d}"


def base(tipo, x, y, w, h, color="blanco", **extra):
    fondo, trazo = COLORES.get(color, COLORES["blanco"])
    el = {
        "id": extra.pop("id", None) or nuevo_id(tipo[0]),
        "type": tipo, "x": round(x, 1), "y": round(y, 1),
        "width": round(w, 1), "height": round(h, 1), "angle": 0,
        "strokeColor": trazo, "backgroundColor": fondo,
        "fillStyle": "solid", "strokeWidth": 2, "strokeStyle": "solid",
        "roughness": 1, "opacity": 100, "groupIds": [], "frameId": None,
        "roundness": {"type": 3} if tipo == "rectangle" else ({"type": 2} if tipo != "text" else None),
        "seed": random.randint(1, 2**31), "version": 1,
        "versionNonce": random.randint(1, 2**31), "isDeleted": False,
        "boundElements": [], "updated": AHORA, "link": None, "locked": False,
    }
    el.update(extra)
    return el


def envolver(texto, max_chars):
    """Parte el texto en líneas de como mucho max_chars (respeta \\n explícitos)."""
    lineas = []
    for parrafo in str(texto).split("\n"):
        actual = ""
        for palabra in parrafo.split(" "):
            if actual and len(actual) + 1 + len(palabra) > max_chars:
                lineas.append(actual)
                actual = palabra
            else:
                actual = f"{actual} {palabra}".strip()
        lineas.append(actual)
    return lineas


def medir(lineas, tam):
    ancho = max((len(l) for l in lineas), default=1) * tam * ANCHO_CHAR
    alto = len(lineas) * tam * ALTO_LINEA
    return ancho, alto


def texto_el(texto, x, y, tam=TAM_TEXTO, contenedor=None, alinear="center", color="blanco"):
    lineas = texto.split("\n")
    w, h = medir(lineas, tam)
    el = base("text", x, y, w, h, color, text=texto, originalText=texto,
              fontSize=tam, fontFamily=FUENTE, textAlign=alinear,
              verticalAlign="middle" if contenedor else "top",
              containerId=contenedor, lineHeight=ALTO_LINEA, autoResize=True)
    el["backgroundColor"] = "transparent"
    el["strokeColor"] = "#1e1e1e"
    return el


def borde(nodo, dx, dy, hueco=6):
    """Punto del borde del nodo en la dirección (dx, dy) desde su centro."""
    cx, cy = nodo["x"] + nodo["width"] / 2, nodo["y"] + nodo["height"] / 2
    hw, hh = nodo["width"] / 2 + hueco, nodo["height"] / 2 + hueco
    if dx == 0 and dy == 0:
        return cx, cy
    escala = min(hw / abs(dx) if dx else float("inf"), hh / abs(dy) if dy else float("inf"))
    return cx + dx * escala, cy + dy * escala


def construir(spec):
    elementos = []
    dir_lr = spec.get("direccion", "LR").upper() == "LR"
    tam = spec.get("tamTexto", TAM_TEXTO)
    max_chars = spec.get("maxCaracteres", 22)
    nodos_spec = spec.get("nodos", [])

    # 1. Medir nodos y asignar celdas
    medidos = []
    for i, n in enumerate(nodos_spec):
        lineas = envolver(n.get("texto", n["id"]), n.get("maxCaracteres", max_chars))
        tw, th = medir(lineas, tam)
        w = max(n.get("ancho", 0), tw + 40, 140)
        h = max(n.get("alto", 0), th + 36, 70)
        if n.get("forma") == "diamond":
            w, h = w * 1.4, h * 1.5
        fila = n.get("fila", 0 if dir_lr else i)
        col = n.get("col", i if dir_lr else 0)
        medidos.append((n, lineas, w, h, fila, col))

    celda_w = max((m[2] for m in medidos), default=200) + spec.get("huecoX", 90)
    celda_h = max((m[3] for m in medidos), default=90) + spec.get("huecoY", 80)
    y0 = 80 if spec.get("titulo") else 0

    por_id = {}
    for n, lineas, w, h, fila, col in medidos:
        cx = col * celda_w + celda_w / 2
        cy = y0 + fila * celda_h + celda_h / 2
        forma = n.get("forma", "rectangle")
        caja = base(forma, cx - w / 2, cy - h / 2, w, h, n.get("color", "azul"),
                    id=n["id"])
        if n.get("discontinuo"):
            caja["strokeStyle"] = "dashed"
        txt = texto_el("\n".join(lineas), cx, cy, tam, contenedor=caja["id"])
        txt["x"], txt["y"] = cx - txt["width"] / 2, cy - txt["height"] / 2
        caja["boundElements"].append({"type": "text", "id": txt["id"]})
        if n.get("enlace"):
            caja["link"] = n["enlace"]
        por_id[n["id"]] = caja
        elementos += [caja, txt]

    # 2. Grupos: marcos detrás de sus nodos
    marcos = []
    for g in spec.get("grupos", []):
        miembros = [por_id[i] for i in g["nodos"] if i in por_id]
        if not miembros:
            continue
        pad = 30
        x1 = min(m["x"] for m in miembros) - pad
        y1 = min(m["y"] for m in miembros) - pad - 30
        x2 = max(m["x"] + m["width"] for m in miembros) + pad
        y2 = max(m["y"] + m["height"] for m in miembros) + pad
        marco = base("rectangle", x1, y1, x2 - x1, y2 - y1, g.get("color", "gris"))
        marco["strokeStyle"] = "dashed"
        marco["opacity"] = 60
        etiqueta = texto_el(g["texto"], x1 + 12, y1 + 8, tam - 2, alinear="left")
        marcos += [marco, etiqueta]
    elementos = marcos + elementos

    # 3. Flechas enlazadas a sus nodos
    for a in spec.get("aristas", []):
        o, d = por_id.get(a["de"]), por_id.get(a["a"])
        if not o or not d:
            raise SystemExit(f"Arista con nodo desconocido: {a}")
        ocx, ocy = o["x"] + o["width"] / 2, o["y"] + o["height"] / 2
        dcx, dcy = d["x"] + d["width"] / 2, d["y"] + d["height"] / 2
        dx, dy = dcx - ocx, dcy - ocy
        sx, sy = borde(o, dx, dy)
        ex, ey = borde(d, -dx, -dy)
        # Oblicua → curva (Bézier cuadrática muestreada); recta si es horizontal o vertical
        vx, vy = ex - sx, ey - sy
        largo = (vx * vx + vy * vy) ** 0.5 or 1
        nx, ny = -vy / largo, vx / largo                      # normal unitaria
        if ny > 0 or (ny == 0 and nx > 0):                    # la normal apunta hacia arriba (o a la izquierda)
            nx, ny = -nx, -ny
        oblicua = min(abs(vx), abs(vy)) > 30
        curva = a.get("curva", 0.12 if oblicua else 0)       # flecha hacia arriba: + arquea por arriba
        cpx, cpy = sx + vx / 2 + nx * curva * largo, sy + vy / 2 + ny * curva * largo

        def punto(t):
            u = 1 - t
            return (u * u * sx + 2 * u * t * cpx + t * t * ex, u * u * sy + 2 * u * t * cpy + t * t * ey)

        muestras = [punto(i / 8) for i in range(9)] if curva else [(sx, sy), (ex, ey)]
        flecha = base("arrow", min(p[0] for p in muestras), min(p[1] for p in muestras),
                      max(p[0] for p in muestras) - min(p[0] for p in muestras),
                      max(p[1] for p in muestras) - min(p[1] for p in muestras), "transparente",
                      points=[[round(px - sx, 1), round(py - sy, 1)] for px, py in muestras],
                      lastCommittedPoint=None,
                      startBinding={"elementId": o["id"], "focus": 0, "gap": 6},
                      endBinding={"elementId": d["id"], "focus": 0, "gap": 6},
                      startArrowhead="arrow" if a.get("doble") else None,
                      endArrowhead="arrow", elbowed=False)
        flecha["x"], flecha["y"] = round(sx, 1), round(sy, 1)
        if not curva:
            flecha["roundness"] = None
        flecha["strokeColor"] = "#495057"
        if a.get("estilo") in ("dashed", "discontinua"):
            flecha["strokeStyle"] = "dashed"
        o["boundElements"].append({"type": "arrow", "id": flecha["id"]})
        d["boundElements"].append({"type": "arrow", "id": flecha["id"]})
        elementos.append(flecha)
        if a.get("texto"):
            # Etiqueta suelta (sin fondo) junto a la línea, nunca encima
            mx, my = punto(a.get("posTexto", 0.5))
            et = texto_el(a["texto"], mx, my, tam - 4, alinear="left")
            w, h = et["width"], et["height"]
            if abs(vy) <= 30:      # horizontal: encima
                et["x"], et["y"] = mx - w / 2, my - h - 8
            elif abs(vx) <= 30:    # vertical: a la izquierda
                et["x"], et["y"] = mx - w - 10, my - h / 2
            else:                  # oblicua: por fuera de la curva, separada lo que mide la etiqueta en esa dirección
                lado = 1 if curva >= 0 else -1
                sep = abs(nx) * w / 2 + abs(ny) * h / 2 + 8
                cx, cy = mx + lado * nx * sep, my + lado * ny * sep
                et["x"], et["y"] = cx - w / 2, cy - h / 2
            elementos.append(et)

    # 4. Título y notas sueltas
    if spec.get("titulo"):
        elementos.insert(0, texto_el(spec["titulo"], 20, 10, tam + 8, alinear="left"))
    for nota in spec.get("notas", []):
        lineas = envolver(nota["texto"], nota.get("maxCaracteres", 40))
        x = nota.get("col", 0) * celda_w + 20
        y = y0 + nota.get("fila", 0) * celda_h + 20
        elementos.append(texto_el("\n".join(lineas), x, y, tam - 4, alinear="left"))

    # 5. Leyenda: qué significa cada color (y forma) en este diagrama, debajo del dibujo
    if spec.get("leyenda"):
        cajas = [e for e in elementos if e["type"] != "text"]
        x_min = min(e["x"] for e in cajas)
        x_max = max(e["x"] + e["width"] for e in cajas)
        y = max(e["y"] + e["height"] for e in cajas) + 50
        tam_l = tam - 4
        titulo = texto_el("Leyenda:", x_min, y, tam_l, alinear="left")
        elementos.append(titulo)
        x = x_min + titulo["width"] + 24
        for item in spec["leyenda"]:
            et = texto_el(item["texto"], 0, 0, tam_l, alinear="left")
            ancho = 34 + 10 + et["width"]
            if x + ancho > max(x_max, x_min + 600) and x > x_min + titulo["width"] + 24:
                x, y = x_min + titulo["width"] + 24, y + et["height"] + 18
            forma = item.get("forma", "rectangle")
            muestra = base(forma, x, y + et["height"] / 2 - 11, 34, 22, item.get("color", "blanco"))
            et["x"], et["y"] = x + 44, y
            elementos += [muestra, et]
            x += ancho + 30

    for i, el in enumerate(elementos):
        el["index"] = f"a{i:04d}"
    return {
        "type": "excalidraw", "version": 2, "source": "meta-harness-factory/diagrama.py",
        "elements": elementos,
        "appState": {"viewBackgroundColor": "#ffffff", "gridSize": 20},
        "files": {},
    }


def a_obsidian(escena, spec):
    """Envuelve la escena en el formato .excalidraw.md del plugin de Obsidian."""
    tags = ["excalidraw"] + spec.get("tags", [])
    textos = [el for el in escena["elements"] if el["type"] == "text"]
    partes = [
        "---",
        "excalidraw-plugin: parsed",
        f"tags: [{', '.join(tags)}]",
        "---",
        "",
        spec.get("descripcion", "") + "\n" if spec.get("descripcion") else "",
        "==⚠ Abre esta nota en vista Excalidraw (menú ⋯ > «Open as Excalidraw drawing»). ⚠==",
        "",
        "# Excalidraw Data",
        "",
        "## Text Elements",
    ]
    for t in textos:
        partes.append(f"{t['text']} ^{t['id']}")
        partes.append("")
    partes += ["%%", "## Drawing", "```json", json.dumps(escena, ensure_ascii=False, indent=1), "```", "%%", ""]
    return "\n".join(partes)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    random.seed(sys.argv[1])  # salida estable para la misma spec
    with open(sys.argv[1], encoding="utf-8") as f:
        spec = json.load(f)
    escena = construir(spec)
    salida = sys.argv[2]
    contenido = a_obsidian(escena, spec) if salida.endswith(".md") else json.dumps(escena, ensure_ascii=False, indent=1)
    with open(salida, "w", encoding="utf-8") as f:
        f.write(contenido)
    print(f"OK {salida}: {len(spec.get('nodos', []))} nodos, {len(spec.get('aristas', []))} flechas")


if __name__ == "__main__":
    main()
