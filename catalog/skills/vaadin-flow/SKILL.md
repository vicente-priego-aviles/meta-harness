---
name: vaadin-flow
description: Vistas Vaadin Flow con Spring — seguridad en cada vista, vistas que solo llaman a casos de uso, formularios con Binder y tests sin navegador. Úsala al crear o cambiar vistas, layouts o la seguridad de la UI.
paths: ["**/ui/**", "**/vista/**", "**/views/**", "**/*View.java", "**/*Vista.java", "**/frontend/**"]
tags: [stack, vaadin, ui, seguridad]
---

# Vaadin Flow

## Dónde va
Las vistas son **adaptadores de entrada** (`infraestructura/adaptador/entrada/ui`): llaman a puertos de entrada (casos de uso) y muestran DTOs. Nunca repositorios ni entidades JPA en una vista; nada de reglas de negocio.

## Seguridad — cada `@Route` declara quién entra
- Configuración con `VaadinSecurityConfigurer` (`http.with(VaadinSecurityConfigurer.vaadin(), c -> c.loginView(LoginView.class))`). No uses `formLogin()` a la vez (bucles de redirección).
- Cada vista con **una** anotación de acceso: `@RolesAllowed("ADMIN")`, `@PermitAll` (autenticados) o `@AnonymousAllowed` (pública). **Ninguna vista sin anotar.**
- La autorización real se repite en el caso de uso o servicio: ocultar un botón no protege nada.
- Cambios de seguridad = riesgo 2.

## Formularios
- `Binder<Dto>` con validadores; los errores de negocio del caso de uso se muestran con `Notification`, sin trazas.
- Operaciones largas fuera del hilo de UI (`UI.access` con push) o con indicador de progreso.

## Tests sin navegador
Extiende `SpringBrowserlessTest` y simula usuarios con `@WithMockUser` / `@WithAnonymousUser`:
```java
@SpringBootTest
class ClientesViewSeguridadTest extends SpringBrowserlessTest {
    @Test @WithAnonymousUser
    void anonimoEsRedirigidoAlLogin() { navigate("clientes", LoginView.class); }

    @Test @WithMockUser(roles = "ADMIN")
    void adminVeLaTabla() {
        navigate(ClientesView.class);
        assertThat(find(Grid.class).single()).isNotNull();
    }
}
```
Pruebas de extremo a extremo con navegador real solo para los flujos críticos (Playwright o TestBench).
