---
paths: ["**/db/migration/**", "**/db/changelog/**", "**/*.sql"]
---
# Migraciones (meta-harness)
- Nunca modifiques una migración aplicada: crea una nueva (`V<n>__<descripcion>.sql`).
- Destructivas solo con plan de vuelta atrás en la spec. Riesgo 2. Detalle: skill `java-spring-boot` → `references/migraciones.md`.
