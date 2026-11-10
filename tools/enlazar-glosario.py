#!/usr/bin/env python3
"""Enlaza al glosario de la web la primera aparición de cada término en las páginas de la guía.

Uso: python3 -I tools/enlazar-glosario.py [--comprobar] [páginas...]   (sin páginas: todas las de docs/guia salvo el glosario y la portada)
- Solo toca texto corrido: no entra en bloques de código, `código`, enlaces, títulos ni HTML.
- Es idempotente: si la página ya enlaza un término, no lo vuelve a enlazar.
- --comprobar: no escribe; lista los términos sin enlazar y sale con código 1 si hay alguno.
Los términos y su forma de aparecer en el texto están en TERMINOS; el ancla es la del título en el glosario.
"""
import pathlib
import re
import sys
import unicodedata

GUIA = pathlib.Path("docs/guia")
GLOSARIO = GUIA / "ayuda" / "glosario.md"
# La portada va en bloques HTML (tarjetas): ahí los enlaces Markdown no siempre se convierten
EXCLUIDAS = {GLOSARIO, GUIA / "index.md"}

# título en el glosario → expresión con la que aparece en el texto. Se omiten palabras demasiado comunes
# (plan, tarea, base, módulo, evidencia, bloqueo, orientación, ingerir…) para no enlazar usos corrientes.
TERMINOS = {
    "Software factory": r"software factory",
    "Carril": r"\bcarril(?:es)?\b",
    "FTD": r"\bFTD\b",
    "SDD": r"\bSDD\b",
    "ASDD": r"\bASDD\b",
    "Spec": r"\bspecs?\b",
    "Cola de decisiones": r"\bcola de decisiones\b",
    "Constitución": r"\bconstitución\b",
    "Definición de terminado": r"\bdefinición de terminado\b",
    "Riesgo": r"\briesgo\b",
    "Revisor de contexto limpio": r"\bcontexto limpio\b",
    "Verificador de hallazgos": r"\bverificador(?: de hallazgos)?\b",
    "TDD": r"\bTDD\b",
    "Smoke test": r"\bsmoke tests?\b",
    "e2e": r"\be2e\b",
    "Worklog": r"\bworklog\b",
    "Brain": r"\bbrain\b",
    "Lint": r"\blint\b",
    "Divulgación progresiva": r"\bdivulgación progresiva\b",
    "OKF": r"\bOKF\b",
    "Frontmatter": r"\bfrontmatter\b",
    "ADR": r"\bADRs?\b(?!-)",
    "LLM": r"\bLLMs?\b",
    "Harness": r"(?<![-\w])harness\b",
    "Meta-harness": r"\bmeta-harness\b",
    "Skill": r"\bskills?\b",
    "Subagente": r"\bsubagentes?\b",
    "Hook": r"\bhooks?\b",
    "Regla con paths": r"\breglas? con paths\b",
    "Siempre activo": r"\bsiempre activos?\b",
    "Compactación": r"\bcompactación\b",
    "Token": r"\btokens?\b",
    "MCP": r"\bMCP\b",
    "LSP": r"\bLSP\b",
    "Perfil de hooks": r"\bperfil de hooks\b",
    "Fallo en abierto": r"\bfallo en abierto\b",
    "Referencia de proveedor": r"\breferencias? de proveedor\b",
    "Onboarding": r"\bonboarding\b",
    "Primero el plan": r"\bprimero el plan\b",
    "Bóveda": r"\bbóvedas?\b",
    "Callout": r"\bcallouts?\b",
    "Excalidraw": r"\bExcalidraw\b",
    "Diagrama de secuencia": r"\bdiagramas? de secuencia\b",
    "Mermaid": r"\bMermaid\b",
    "DDD": r"\bDDD\b",
    "Lenguaje ubicuo": r"\blenguaje ubicuo\b",
    "BPMN / DMN": r"\bBPMN\b",
    "Conventional Commits": r"\bConventional Commits\b",
    "SemVer": r"\bSemVer\b",
    "Keep a Changelog": r"\bKeep a Changelog\b",
    "Rama protegida": r"\bramas? protegidas?\b",
    "Gestor de tareas": r"\bgestor(?:es)? de tareas\b",
    "Épica": r"\bépicas?\b",
    "Sub-issue": r"\bsub-issues?\b",
    "Rebanada vertical": r"\brebanadas? vertical(?:es)?\b",
    "Node.js": r"\bNode\.js\b",
    "CLI": r"\bCLIs?\b",
    "Zeebe": r"\bZeebe\b",
    "Idempotencia": r"\bidempoten(?:cia|te)s?\b",
    "Instancia en vuelo": r"\binstancias? en vuelo\b",
    "jMolecules": r"\bjMolecules\b",
    "Testcontainers": r"\bTestcontainers\b",
    "ArchUnit": r"\bArchUnit\b",
    "PR": r"\bPRs?\b",
    "Worktree": r"\bworktrees?\b",
}
SENSIBLE = {"FTD", "SDD", "ASDD", "TDD", "OKF", "ADR", "LLM", "MCP", "LSP", "DDD", "BPMN / DMN", "CLI", "PR"}
# Tramos que no se tocan: código, enlaces (y su texto), cursivas (traducciones y siglas desarrolladas), HTML, URLs
PROTEGIDO = re.compile(r"`[^`\n]*`|(?<![*\w])\*(?!\*)[^*\n]+\*(?![*\w])|!?\[[^\]\n]*\]\([^)\n]*\)|<[^>\n]+>|https?://\S+")


def ancla(texto):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[-\s]+", "-", re.sub(r"[^\w\s-]", "", t).strip().lower())


def procesar(ruta, comprobar=False):
    destino = pathlib.Path(*([".."] * (len(ruta.relative_to(GUIA).parts) - 1)), "ayuda", "glosario.md").as_posix()
    texto = ruta.read_text(encoding="utf-8")
    pendientes = {t: re.compile(p, 0 if t in SENSIBLE else re.I) for t, p in TERMINOS.items()
                  if f"glosario.md#{ancla(t)})" not in texto}
    lineas, en_codigo, faltan = texto.split("\n"), False, []
    for i, linea in enumerate(lineas):
        if linea.lstrip().startswith("```"):
            en_codigo = not en_codigo
            continue
        if en_codigo or linea.lstrip().startswith(("#", "<")) or re.match(r"\s*>\s*\[!", linea):
            continue
        for termino, rx in list(pendientes.items()):
            libres, pos = [], 0
            for m in PROTEGIDO.finditer(linea):
                libres.append((pos, m.start()))
                pos = m.end()
            libres.append((pos, len(linea)))
            for a, b in libres:
                m = rx.search(linea, a, b)
                if m:
                    faltan.append((termino, i + 1))
                    enlace = f"[{m.group(0)}]({destino}#{ancla(termino)})"
                    linea = linea[:m.start()] + enlace + linea[m.end():]
                    del pendientes[termino]
                    break
        lineas[i] = linea
    if faltan and not comprobar:
        ruta.write_text("\n".join(lineas), encoding="utf-8")
    return faltan


def main():
    args = [a for a in sys.argv[1:] if a != "--comprobar"]
    comprobar = "--comprobar" in sys.argv
    paginas = [pathlib.Path(a) for a in args] or sorted(p for p in GUIA.rglob("*.md") if p not in EXCLUIDAS)
    total = 0
    for p in paginas:
        faltan = procesar(p, comprobar)
        total += len(faltan)
        if faltan:
            print(f"{p}: {', '.join(f'{t} (l. {n})' for t, n in faltan)}")
    print(f"{'Sin enlazar' if comprobar else 'Enlazados'}: {total}")
    sys.exit(1 if comprobar and total else 0)


if __name__ == "__main__":
    main()
