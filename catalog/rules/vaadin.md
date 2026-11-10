---
paths: ["**/ui/**", "**/vista/**", "**/views/**", "**/*View.java", "**/*Vista.java"]
---
# Vaadin (meta-harness)
- Toda `@Route` lleva `@RolesAllowed`, `@PermitAll` o `@AnonymousAllowed`; la autorización se repite en el caso de uso.
- Las vistas solo llaman a casos de uso; nada de repositorios ni reglas de negocio. Detalle: skill `vaadin-flow`.
