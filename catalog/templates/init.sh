#!/usr/bin/env bash
# Arranque del entorno y smoke test (rutina de inicio de sesión).
# Generado por el meta-harness; ajústalo a tu proyecto.
set -euo pipefail
cd "$(dirname "$0")"

{{INFRA}}

echo "› Compilando…"
node .mh/scripts/mvnq.mjs -q compile

{{SMOKE}}

echo "✔ Entorno listo"
