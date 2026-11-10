---
paths: ["**/dominio/**", "**/domain/**"]
---
# Dominio (meta-harness)
- Sin `org.springframework`, `jakarta.persistence`, `io.camunda` ni Jackson. Solo Java, jMolecules y Lombok.
- Invariantes dentro del agregado; otros agregados se referencian por id; objetos valor inmutables (records).
- Nombres del lenguaje ubicuo (`brain/wiki/producto/glosario.md`). Detalle: skill `ddd-hexagonal`.
