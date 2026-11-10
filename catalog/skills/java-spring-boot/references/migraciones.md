# Migraciones Flyway

- Nombre: `V<versión>__<descripcion_en_snake_case>.sql` en `src/main/resources/db/migration/`.
- **Nunca modifiques una migración ya aplicada** en algún entorno: Flyway compara checksums y falla con `CHECKSUM_MISMATCH` («revert the changes to the migration or run `repair`»). `repair` solo realinea el historial; no arregla el esquema. Para cambiar algo: **migración nueva**.
- Cambios compatibles hacia atrás (expandir → migrar datos → contraer) cuando hay varias versiones de la app o instancias de proceso en vuelo: primero añadir columna nullable, luego rellenar, después hacerla obligatoria y por último retirar lo viejo, en migraciones separadas.
- Toda migración destructiva (`DROP`, `TRUNCATE`, cambio de tipo) lleva en la spec su plan de vuelta atrás y copia de datos.
- Prueba la migración contra PostgreSQL real (Testcontainers), no solo H2.
- Las migraciones son **riesgo 2**: spec ASDD, revisión de seguridad y PR aprobado por el usuario.
