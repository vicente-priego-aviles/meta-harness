---
name: java-spring-boot
description: Java moderno con Spring Boot 4 — inyección, transacciones, validación, errores, configuración, resiliencia, JPA y migraciones Flyway, y la estrategia de tests por capa. Úsala al escribir o cambiar código Java, configuración o migraciones.
paths: ["**/*.java", "**/pom.xml", "**/application*.yml", "**/application*.yaml", "**/application*.properties", "**/db/migration/**"]
tags: [stack, java, spring-boot, jpa, flyway, tests]
---

# Java + Spring Boot

Para el modelo de dominio y las capas, skill `ddd-hexagonal`; para workers y BPMN, skill `camunda-8`.

## Java
- Records para DTOs, comandos, eventos y objetos valor; `sealed` + `switch` con patrones para variantes cerradas.
- `Optional` solo como retorno; nunca `.get()` sin comprobar (`orElseThrow` con excepción de dominio).
- Excepciones de dominio con nombre del negocio (`ClienteNoEncontradoExcepcion`), no `RuntimeException` genéricas.
- Nada de `catch (Exception e)` que oculte bugs; captura lo que sabes tratar.

## Spring
- Inyección por constructor (`@RequiredArgsConstructor` o constructor explícito); nunca `@Autowired` en campos.
- `@Transactional` en el servicio de aplicación (caso de uso), no en controladores ni repositorios. Ojo: la autoinvocación (`this.metodo()`) **salta el proxy** y la transacción no aplica.
- Validación: `@Valid` + Bean Validation en la entrada; invariantes de negocio en el dominio.
- Errores REST: `@RestControllerAdvice` que devuelve `ProblemDetail`; nunca trazas al cliente.
- Configuración: `@ConfigurationProperties` con records validados; secretos solo por variables de entorno o un gestor de secretos (p. ej. HashiCorp Vault).
- Resiliencia (Resilience4j) en adaptadores de salida a sistemas externos: timeout + reintento + circuit breaker.
- Logs: sin datos personales ni de tarjetas; nivel `debug` para lo verboso.

## Persistencia
- La entidad JPA vive en `infraestructura/.../persistencia` y se mapea al agregado (MapStruct); el agregado no es la entidad.
- Evita N+1: `JOIN FETCH` o entity graphs donde se necesite; `FetchType.LAZY` por defecto.
- **Migraciones Flyway** (riesgo 2) — `references/migraciones.md`: nunca modifiques una migración aplicada.

## Tests por capa — `references/tests.md`
| Capa | Tipo | Herramienta |
|---|---|---|
| Dominio | unitario puro, sin Spring | JUnit 5 + AssertJ |
| Aplicación | unitario con puertos simulados | Mockito |
| Adaptador REST | slice | `@WebMvcTest` |
| Persistencia | slice con BD real | `@DataJpaTest` + Testcontainers (PostgreSQL) |
| Proceso | Camunda | skill `camunda-8` |
| Arquitectura | reglas | ArchUnit (skill `ddd-hexagonal`) |

Build y tests: `node .mh/scripts/mvnq.mjs verify` (un módulo: `-pl <modulo> -am`).
