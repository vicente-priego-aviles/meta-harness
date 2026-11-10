#!/usr/bin/env bash
# Regenera los SVG de la guía web desde las especificaciones de los diagramas (fuente de verdad, ADR-0003).
# Uso: tools/diagramas-web.sh [nombre ...]   (sin argumentos: todos los de LISTA)
set -euo pipefail
cd "$(dirname "$0")/.."
LISTA=(arquitectura software-factory ftd-flujo asdd-flujo brain-flujo hooks-sesion modulos instalador)
TMP=$(mktemp -d)
for n in "${@:-${LISTA[@]}}"; do
  python3 -I catalog/skills/excalidraw/scripts/diagrama.py "docs/diagramas/$n.spec.json" "$TMP/$n.excalidraw" >/dev/null
  node tools/exportar-svg.mjs "$TMP/$n.excalidraw" "docs/guia/assets/diagramas/$n.svg"
done
rm -rf "$TMP"
