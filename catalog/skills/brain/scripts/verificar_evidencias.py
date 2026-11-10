#!/usr/bin/env python3
"""Comprueba que los datos de la wiki del brain están respaldados por sus fuentes en raw/.

Solo informa; nunca modifica archivos. Adaptado de check_evidence.py de
una skill con licencia MIT (ver AVISOS-DE-TERCEROS.md) al formato OKF y a números en español.

Uso: python3 -I verificar_evidencias.py <raiz-brain> [nota.md ...]
     <raiz-brain> contiene raw/ y wiki/. Sin notas, revisa toda la wiki.

Tres barridos:
1. Fidelidad: extrae literales (citas entre comillas rectas o “tipográficas” de 15+
   caracteres, fechas ISO y números concretos) del cuerpo de cada nota y comprueba
   que aparecen en los archivos de raw/ que la nota cita en `sources[].resource`
   (directamente o a través de otra nota de la wiki que cite). Los fallos son
   SOSPECHOSOS, no veredictos: valores derivados o traducidos también aparecen.
   Las comillas «españolas» se usan para paráfrasis/traducciones y no se comprueban.
2. Errores de evidencia: notas sin ninguna fuente en raw/, recursos que no existen
   o que salen de raw/. Las notas `type: Respuesta archivada` no necesitan raw.
3. Inventario: archivos de raw/ que ninguna nota cita (salvo los registrados en
   log.md como `**Sin material**: <ruta>` y los LEEME.md).
"""
import re
import sys
from pathlib import Path

NUMERO_RE = re.compile(
    r"(?<![\w.,])(?:\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)+|\d{4,}|\d+)"
    r"(?:\s?(?:%|[KMB](?![A-Za-z])))?(?![\w])"
)
FECHA_RE = re.compile(r"(?<!\d)\d{4}-\d{2}(?:-\d{2})?(?!\d)")
CITA_RES = [re.compile(r'(?<![\w*])"([^"\s][^"\n]{13,}[^"\s])"(?![\w])'), re.compile(r"“([^”\n]{15,})”")]
ENLACE_RE = re.compile(r"\[[^\]\n]*\]\([^)]*\)")  # etiqueta + destino: no son datos
CODIGO_LINEA_RE = re.compile(r"`[^`\n]*`")
RESOURCE_RE = re.compile(r"resource:\s*([^\s,}]+)")
SIN_MATERIAL_RE = re.compile(r"\*\*Sin material\*\*:\s*`?([^`\s]+)")
TYPE_RE = re.compile(r"^type:\s*(.+)$", re.M)
ESPACIOS = re.compile(r"\s+")
OMITIR = {"index.md", "log.md"}
EXT_TEXTO = {".md", ".txt", ".vtt", ".json", ".js", ".mjs", ".py", ".yaml", ".yml", ".html"}


def partir(texto):
    """Devuelve (frontmatter, cuerpo)."""
    if texto.startswith("---\n"):
        fin = texto.find("\n---", 4)
        if fin != -1:
            return texto[4:fin], texto[fin + 4:]
    return "", texto


def sin_codigo(cuerpo):
    cuerpo = re.sub(r"^(```|~~~).*?^\1", "", cuerpo, flags=re.S | re.M)
    cuerpo = re.sub(r"^```.*?^```", "", cuerpo, flags=re.S | re.M)
    cuerpo = CODIGO_LINEA_RE.sub(" ", cuerpo)
    return ENLACE_RE.sub(" ", cuerpo)


def canon_numero(tok):
    """'4.500' y '4,500' -> '4500'; '0,3 %' y '0.3%' -> '03%'."""
    return re.sub(r"[\s.,]", "", tok)


def es_relevante(tok):
    """Solo números con información: agrupados, decimales, sufijo, o 4+ dígitos."""
    t = tok.strip()
    return bool(re.search(r"[.,]\d|[%KMB]$", t)) or len(re.sub(r"\D", "", t)) >= 4


def candidatos(cuerpo):
    limpio = sin_codigo(cuerpo)
    out = []
    for rx in CITA_RES:
        out += [("cita", m.group(1)) for m in rx.finditer(limpio)]
    sin_citas = limpio
    for rx in CITA_RES:
        sin_citas = rx.sub(" ", sin_citas)
    fechas = set(FECHA_RE.findall(sin_citas))
    out += [("fecha", f) for f in sorted(fechas)]
    sin_fechas = FECHA_RE.sub(" ", sin_citas)
    vistos = set()
    for m in NUMERO_RE.finditer(sin_fechas):
        tok = m.group(0).strip()
        if es_relevante(tok) and tok not in vistos:
            vistos.add(tok)
            out.append(("número", tok))
    return out


def archivos_de(ruta):
    if ruta.is_dir():
        return [p for p in ruta.rglob("*") if p.is_file() and p.suffix in EXT_TEXTO]
    return [ruta] if ruta.is_file() else []


class Brain:
    def __init__(self, raiz):
        self.raiz = Path(raiz).resolve()
        self.raw = self.raiz / "raw"
        self.wiki = self.raiz / "wiki"
        self._cache = {}

    def recursos(self, nota):
        fm, _ = partir(nota.read_text(encoding="utf-8"))
        return [r for r in RESOURCE_RE.findall(fm) if not r.startswith(("http://", "https://"))]

    def evidencias(self, nota, profundidad=1):
        """Archivos raw que respaldan la nota (+ los de notas wiki citadas, 1 nivel)."""
        raws, errores = [], []
        for r in self.recursos(nota):
            destino = (nota.parent / r).resolve()
            if not destino.exists():
                errores.append(f"recurso inexistente: {r}")
            elif destino.is_relative_to(self.raw):
                raws += archivos_de(destino)
            elif destino.is_relative_to(self.wiki) and destino.suffix == ".md":
                if profundidad > 0:
                    sub, _ = self.evidencias(destino, profundidad - 1)
                    raws += sub
            else:
                errores.append(f"recurso fuera de raw/ y wiki/: {r}")
        return raws, errores

    def texto_raw(self, archivos):
        partes = []
        for a in archivos:
            if a not in self._cache:
                try:
                    self._cache[a] = a.read_text(encoding="utf-8", errors="ignore")
                except OSError:
                    self._cache[a] = ""
            partes.append(self._cache[a])
        return "\n".join(partes)


def revisar(raiz, notas_pedidas):
    b = Brain(raiz)
    if not b.wiki.is_dir():
        sys.exit(f"No encuentro {b.wiki}. ¿Es la raíz del brain?")
    notas = [Path(n).resolve() for n in notas_pedidas] or sorted(
        p for p in b.wiki.rglob("*.md") if p.name not in OMITIR and not p.name.endswith(".excalidraw.md"))

    sospechosos, errores, citados = [], [], set()
    for nota in notas:
        rel = nota.relative_to(b.raiz)
        fm, cuerpo = partir(nota.read_text(encoding="utf-8"))
        tipo = (TYPE_RE.search(fm).group(1).strip() if TYPE_RE.search(fm) else "")
        raws, errs = b.evidencias(nota)
        for r in b.recursos(nota):
            d = (nota.parent / r).resolve()
            if d.exists() and d.is_relative_to(b.raw):
                citados.update(archivos_de(d))
        errores += [f"{rel}: {e}" for e in errs]
        if tipo.lower().startswith("respuesta archivada"):
            continue
        if not raws:
            errores.append(f"{rel}: sin fuentes en raw/ (ni directas ni vía notas citadas)")
            continue
        texto = b.texto_raw(raws)
        texto_norm = ESPACIOS.sub(" ", texto).lower()
        numeros_raw = {canon_numero(m.group(0)) for m in NUMERO_RE.finditer(texto)}
        for clase, valor in candidatos(cuerpo):
            if clase == "cita":
                ok = ESPACIOS.sub(" ", valor).strip().lower() in texto_norm
            elif clase == "fecha":
                ok = valor in texto or valor.replace("-", "") in texto
            else:
                ok = canon_numero(valor) in numeros_raw
            if not ok:
                sospechosos.append(f"{rel}: {clase} «{valor}» no aparece en sus fuentes raw")

    inventario = []
    if not notas_pedidas and b.raw.is_dir():
        sin_material = set()
        for log in b.raiz.rglob("log.md"):
            sin_material |= {(b.raiz / m).resolve() for m in SIN_MATERIAL_RE.findall(log.read_text(encoding="utf-8"))}
        for a in sorted(archivos_de(b.raw)):
            if a not in citados and a not in sin_material and a.name != "LEEME.md":
                inventario.append(str(a.relative_to(b.raiz)))

    print(f"# Evidencias del brain: {b.raiz.name} ({len(notas)} notas)\n")
    print(f"## Sospechosos de fidelidad ({len(sospechosos)})")
    print("\n".join(f"- {s}" for s in sospechosos) or "- ninguno")
    print(f"\n## Errores de evidencia ({len(errores)})")
    print("\n".join(f"- {e}" for e in errores) or "- ninguno")
    if not notas_pedidas:
        print(f"\n## Raw sin citar ({len(inventario)})")
        print("\n".join(f"- {i}" for i in inventario[:50]) or "- ninguno")
        if len(inventario) > 50:
            print(f"- … y {len(inventario) - 50} más")
    return len(sospechosos), len(errores), len(inventario)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    revisar(sys.argv[1], sys.argv[2:])
