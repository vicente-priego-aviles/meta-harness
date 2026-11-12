---
paths: ["**/*.java"]
---
# Java (meta-harness-factory)
- Maven con `node .mh/scripts/mvnq.mjs`; tests por capa según la skill `java-spring-boot`.
- Inyección por constructor; `@Transactional` solo en servicios de aplicación; nada de `catch (Exception e)` que oculte errores.
- TDD: test primero; nunca debilitar, desactivar ni borrar un test para que pase.
