# Constitución del proyecto

Se redacta **una vez** con el usuario (el instalador deja un borrador en `brain/factory/constitucion.md`). Cada principio debe ser **comprobable**: si no se puede verificar, no es un principio, es un deseo.

Secciones:
1. **Stack canónico** — versiones (Java, Spring Boot, Camunda, Vaadin), herramientas de build.
2. **Arquitectura** — hexagonal/DDD: dependencias permitidas (dominio sin Spring), comprobadas con ArchUnit.
3. **Procesos** — versionado de BPMN, migración de instancias, workers idempotentes.
4. **Calidad** — TDD, tipos de test por capa, sin debilitar tests.
5. **Seguridad** — secretos fuera del repo, validación de entrada, autorización.
6. **Git** — ramas, commits, quién hace merge según el riesgo.
7. **Definición de terminado** — controles obligatorios y evidencia.
8. **Registro de enmiendas** — fecha, cambio, quién lo aprobó.

`revision.md` acompaña a la constitución: qué cuenta como fallo en este repo (lo leen los revisores).

Cambiar la constitución pide confirmación del usuario (el hook de protección lo recuerda).
