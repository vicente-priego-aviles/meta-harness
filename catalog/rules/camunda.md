---
paths: ["**/*Worker*.java", "**/camunda/**", "**/*.bpmn", "**/*.dmn", "**/*.form"]
---
# Camunda (meta-harness-factory)
- Workers idempotentes (Zeebe entrega al menos una vez) y finos: llaman a un caso de uso.
- `bpmnError` solo para resultados modelados en el BPMN; transitorio → `jobError` con reintentos; bug → que falle (incidente).
- BPMN/DMN/formularios son riesgo 2: plan para instancias en vuelo y test de proceso. Detalle: skill `camunda-8`.
