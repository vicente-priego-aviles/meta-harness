#!/usr/bin/env python3
"""Genera desde docs/glosario.md (única fuente) las dos copias del glosario:

- catalog/templates/brain/wiki/factoria/glosario.md: el de cada proyecto instalado.
- docs/guia/ayuda/glosario.md: la página «Glosario» de la guía web.

Quita los enlaces que apuntan a documentos de meta-harness-factory (fuera del repo, o de la web, no existirían) y adapta un par de frases.
Uso: python3 -I tools/generar-glosario-factoria.py   (desde la raíz del repo)
Un test (tests/catalogo) comprueba que las tres versiones tienen los mismos términos.
"""
import pathlib
import re
import unicodedata

origen = pathlib.Path("docs/glosario.md").read_text(encoding="utf-8")
cuerpo_original = origen.split("\n---\n", 1)[1]
cuerpo = cuerpo_original
cuerpo = re.sub(r"\[([^\]]+)\]\((?!#)[^)]*\)", r"\1", cuerpo)
cuerpo = cuerpo.replace("## Tu stack", "## Stack habitual")
cuerpo = cuerpo.replace("Los de meta-harness-factory están en `docs/adr/`; los de cada proyecto en `brain/wiki/decisiones/`.",
                        "En este proyecto están en `brain/wiki/decisiones/`.")
cuerpo = cuerpo.replace("Las de meta-harness-factory están en `catalog/skills/`.", "Las del proyecto están en `.claude/skills/`.")
cuerpo = cuerpo.replace("# Glosario\n", "# Glosario de la factoría\n", 1)
cuerpo = re.sub(r"> Los términos están ordenados por tema\..*\n",
                "> Los términos están ordenados por tema. Para enlazar uno desde otra nota del brain: "
                "`[FTD](wiki/factoria/glosario.md#FTD)` (ruta relativa a la nota).\n", cuerpo)
cabecera = """---
type: Glosario
title: Glosario de la factoría
description: Siglas y términos del proceso de trabajo con agentes (FTD, ASDD, riesgo, evidencia, brain…), explicados en lenguaje claro.
tags: [glosario, factoria]
generated: { by: meta-harness-factory, at: {{FECHA}} }
status: stable
---
"""
destino = pathlib.Path("catalog/templates/brain/wiki/factoria/glosario.md")
destino.write_text(cabecera + cuerpo, encoding="utf-8")
print(f"OK {destino} ({len(re.findall(r'^### ', cuerpo, re.M))} términos)")


# --- Guía web (MkDocs): anclas en el formato de MkDocs (#gestor-de-tareas) y sin enlaces a docs/ ---
def ancla(texto):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[-\s]+", "-", re.sub(r"[^\w\s-]", "", t).strip().lower())


# Documentos de diseño con página equivalente en la guía; el resto de enlaces quedan como texto
EQUIVALENTES = {"02-software-factory.md": "../uso/index.md", "03-brain.md": "../arquitectura/brain.md"}
web = re.sub(r"\[([^\]]+)\]\(([^)#][^)]*)\)",
             lambda m: f"[{m.group(1)}]({EQUIVALENTES[m.group(2)]})" if m.group(2) in EQUIVALENTES else m.group(1), cuerpo_original)
web = re.sub(r"\]\(#([^)]+)\)", lambda m: f"](#{ancla(m.group(1))})", web)
web = re.sub(r"> \[!tip\] Cómo usarlo\n(> .*\n)+",
             "> [!tip] Cómo usarlo\n> Los términos están ordenados por tema. Usa el buscador (arriba) o el índice de la derecha para ir a uno.\n", web)
destino_web = pathlib.Path("docs/guia/ayuda/glosario.md")
destino_web.write_text("<!-- Generado por tools/generar-glosario-factoria.py desde docs/glosario.md: no lo edites a mano. -->\n" + web.lstrip("\n"), encoding="utf-8")
print(f"OK {destino_web} ({len(re.findall(r'^### ', web, re.M))} términos)")
