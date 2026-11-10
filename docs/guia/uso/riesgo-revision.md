# Riesgo y revisión

Cuánto control necesita un cambio no lo decide el agente «a ojo»: lo calcula un **script** según los archivos que toca. Con ese nivel se decide el [carril](../ayuda/glosario.md#carril), cuántos revisores lo miran y si se puede subir sin tu aprobación.

## Los tres niveles
| Nivel | Qué archivos | Qué exige |
|---|---|---|
| **0** | documentación: `brain/**`, `docs/**`, `*.md` | controles básicos |
| **1** | todo lo demás: código de la aplicación y tests | + **un** revisor de [contexto limpio](../ayuda/glosario.md#revisor-de-contexto-limpio) |
| **2** | archivos sensibles (abajo) | carril **[ASDD](../ayuda/glosario.md#asdd)**: [spec](../ayuda/glosario.md#spec) aprobada, panel completo de revisores y ✋ tu aprobación del [PR](../ayuda/glosario.md#pr) |

Son de **[riesgo](../ayuda/glosario.md#riesgo) 2**:

- procesos y decisiones: `*.bpmn`, `*.dmn`, formularios de Camunda (`*.form`);
- base de datos: migraciones (`db/migration/**`, `db/changelog/**`) y cualquier `*.sql`;
- seguridad: `*SecurityConfig*`, `security/**`;
- configuración de producción: `application-prod.*`;
- build y dependencias: `pom.xml`, `build.gradle`, `package.json` y sus [lockfiles](../ayuda/glosario.md#lockfile) (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`);
- CI: `.github/**`, `.gitlab-ci.yml`, `Jenkinsfile`;
- el propio [harness](../ayuda/glosario.md#harness) y la configuración del agente: `.claude/**`, `.mh/**`, `.mh.json`, `CLAUDE.md`;
- secretos: `.env*`, `*secret*`, `*credential*`.

Un archivo de código normal sube a 2 si **lo que cambia** contiene algo sensible: `PasswordEncoder`, `BCrypt`, `Cipher`, `@PreAuthorize`, `SecurityFilterChain`, `ALTER TABLE`, `CREATE TABLE`…

## El script, en PetClinic
El agente lo ejecuta **antes de empezar**, con los archivos que piensa tocar, y otra vez **al terminar**, con lo que de verdad cambió:

```text
$ node .mh/scripts/riesgo.mjs src/main/java/…/owner/PetValidator.java README.md
Riesgo 1 (2 archivos)
  1  src/main/java/org/springframework/samples/petclinic/owner/PetValidator.java  — código

$ node .mh/scripts/riesgo.mjs pom.xml src/main/resources/db/h2/schema.sql src/main/java/…/owner/Owner.java
Riesgo 2 (3 archivos)
  2  pom.xml  — ruta sensible
  2  src/main/resources/db/h2/schema.sql  — ruta sensible
```

El nivel del cambio es el **más alto** de sus archivos, y el script solo enseña los que lo determinan. Sin argumentos, mide todo lo que ha cambiado en la rama frente a la rama base.

## Las dos redes de seguridad
Calcular el riesgo es una instrucción para el agente, y las instrucciones a veces se olvidan. Por eso hay dos [hooks](../ayuda/glosario.md#hook) que no dependen de su memoria. Esto es lo que dijeron en PetClinic al cambiar el `pom.xml` en una rama sin spec:

**Al terminar cada respuesta** (hook `Stop`), un aviso que el agente tiene que transmitirte:

```text
Hay cambios de riesgo 2 sin spec ASDD aprobada para la rama feat/prueba-riesgo: pom.xml.
Antes de cerrar: díselo al usuario, refléjalo en el FTD (riesgo: 2) y propón pasar el cambio
a ASDD (skill asdd). No reviertas nada sin que el usuario lo pida.
```

**Al intentar subir el cambio** (`git push`, o crear o integrar el PR con `gh` o `glab`), un bloqueo:

```text
Riesgo 2 (pom.xml (ruta sensible)). Antes de push/PR falta una spec en brain/factory/specs/
con «rama: feat/prueba-riesgo» y «estado: aprobada» y una revisión en brain/factory/revisiones/
con «rama: feat/prueba-riesgo» y «resultado: aprobada». Sigue el carril ASDD (skill asdd) y la
skill revision. Si crees que la tabla de riesgo se equivoca, díselo al usuario: se ajusta en .mh.json.
```

Los hooks solo actúan sobre lo que hace el agente: en tu terminal, `git push` funciona como siempre.

> [!warning] Sube la instalación antes de abrir ramas de trabajo
> La instalación de **[meta-harness](../ayuda/glosario.md#meta-harness)** cambia `.claude/` y `.mh/`, que son riesgo 2. Si el commit de la instalación no está en la rama base del remoto, cada rama nueva lo arrastra y su riesgo sale 2. Súbelo tú (o con su propio PR) antes de empezar a trabajar: el agente no puede hacerlo sin una spec, precisamente porque toca la configuración del agente.

## Ajustar la tabla a tu proyecto
La tabla se amplía en `.mh.json`:

```json
"riesgo": {
  "nivel2": ["**/pagos/**", "**/*Liquidacion*.java"],
  "nivel0": ["**/*.adoc"],
  "contenido2": ["RestTemplate\\.exchange"]
}
```

Así, por ejemplo, todo lo que toque el cálculo de pagos pasa por ASDD. Los archivos del paquete de dominio se quedan en riesgo 1, pero si el proyecto tiene el módulo [DDD](../ayuda/glosario.md#ddd), el revisor de DDD es el que los revisa.

## La revisión con contexto limpio
**Quien escribe el código no lo revisa.** Cada revisor es un [subagente](../ayuda/glosario.md#subagente) de solo lectura que recibe el diff, las reglas del proyecto y el alcance del cambio, pero **no la conversación**: no sabe qué intentó el agente ni por qué, así que mira el código como lo miraría un compañero.

| Riesgo | Revisores |
|---|---|
| 0 | ninguno |
| 1 | **uno**, el del terreno del cambio: Camunda si toca workers o [BPMN](../ayuda/glosario.md#bpmn-dmn), DDD si toca dominio o adaptadores, Java/Spring para el resto (o el de corrección general si no hay de stack) |
| 2 | corrección + tests + seguridad + todos los de stack que toque el cambio |

El panel crece con el riesgo porque cada revisor es una llamada completa a un modelo: un cambio pequeño no necesita cinco opiniones.

### Verificar antes de corregir
Los hallazgos que piden un cambio pasan por el subagente `verificador-hallazgos`, que parte de que **cada hallazgo es falso** y lo comprueba contra el código: CONFIRMADO, REFUTADO o SIN PROBAR. Solo lo confirmado vuelve al desarrollador; los de gravedad baja que solo informan pueden cerrarse sin verificar, como en el ejemplo de abajo. Así no se «arreglan» cosas que no estaban rotas, que es uno de los errores más caros de un agente.

### El registro
Cada revisión queda en `brain/factory/revisiones/`. Esta es la de PetClinic, de riesgo 1 con un solo revisor:

| # | Revisor | Hallazgo | Gravedad | Veredicto | Cierre |
|---|---|---|---|---|---|
| H1 | java-spring | `PetValidator.java:61` cambia el orden de errores en el BindingResult | baja | no verificado (informativo) | intencionado: la vista muestra errores por campo |
| H2 | java-spring | Faltaban tests de «hoy es válido» y «fecha nula da un solo error» | baja | no verificado (informativo) | arreglado: añadidos en `PetValidatorTests` |

Cada hallazgo se cierra con un motivo: `arreglado`, `falso`, `intencionado`, `irrelevante` o `aparcado`. Como mucho hay tres rondas; si después sigue habiendo desacuerdo, pasa a la [cola de decisiones](../ayuda/glosario.md#cola-de-decisiones) y decides tú.

## Qué cuenta como fallo
`brain/factory/revision.md` dice, para tu proyecto, qué bloquea una revisión y qué no. Por ejemplo: romper un contrato de proceso (una variable o un código de error de un BPMN) bloquea, y una preferencia de estilo no. El instalador crea un borrador y lo completas con el agente la primera vez, junto con la [constitución](../ayuda/glosario.md#constitucion).
