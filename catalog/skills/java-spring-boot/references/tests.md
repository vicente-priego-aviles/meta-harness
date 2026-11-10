# Tests por capa

## Reglas
- Nombre: `<Clase>Test` (unitario), `<Clase>IT` (integración, failsafe). Métodos que cuentan el comportamiento: `deberiaRechazarTarjetaCaducada()`.
- Estructura Dado / Cuando / Entonces; una razón de fallo por test.
- Prohibido: debilitar aserciones, `@Disabled` para pasar, mockear la clase bajo prueba, tests sin aserciones.
- Los datos de prueba con *builders* o *Object Mother* del dominio.

## Dominio (sin Spring)
```java
class ClienteTest {
    @Test
    void deberiaActivarClientePendienteDeValidacion() {
        var cliente = ClienteMother.pendienteDeValidacion();
        cliente.activar();
        assertThat(cliente.getEstado()).isEqualTo(EstadoCliente.ACTIVO);
    }
}
```

## Persistencia con PostgreSQL real
Testcontainers 2.x: la clase está en `org.testcontainers.postgresql` y ya no es genérica (la de `org.testcontainers.containers` está obsoleta).
```java
import org.testcontainers.postgresql.PostgreSQLContainer;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ClienteRepositorioJpaIT {
    @Container @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17");
    // …
}
```

## REST
`@WebMvcTest(ClienteController.class)` + `MockMvc`; simula el puerto de entrada con `@MockitoBean`.

## Evidencia
La salida de `mvnq` del test que demuestra cada criterio de aceptación va al FTD o a la verificación.
