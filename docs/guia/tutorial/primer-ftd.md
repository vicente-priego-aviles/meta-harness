# Tu primer cambio (FTD)

**[meta-harness](../ayuda/glosario.md#meta-harness)** organiza el trabajo en tres **[carriles](../ayuda/glosario.md#carril)**: caminos de trabajo con sus pasos fijos, como los carriles de una autopista. El agente elige uno según lo clara que esté la petición, te lo dice en una línea y tú puedes corregirlo. Un **[FTD](../ayuda/glosario.md#ftd)** (*Fast Track Development*, «desarrollo por la vía rápida») es el carril para cambios **claros y sin decisiones abiertas**: corregir un fallo acotado, quitar una duplicación, añadir un campo. Aquí lo recorres entero con un cambio **real** en Spring PetClinic; todo lo que ves en esta página salió de esa ejecución.

## El cambio
En PetClinic, la comprobación de que **la fecha de nacimiento de una mascota no está en el futuro** está duplicada en `PetController`, una vez en el alta y otra en la edición. Lo natural es que viva en `PetValidator`, junto al resto de validaciones de la mascota.

## 1. Pide el cambio
En una sesión de Claude Code dentro de `spring-petclinic`:

```text
La comprobación de que la fecha de nacimiento de una mascota no está en el futuro está
duplicada en PetController (alta y edición). Muévela a PetValidator con su test, sin cambiar
el comportamiento. Al terminar, haz el commit.
```

> [!tip] Con un gestor de tareas
> Si el proyecto tiene GitHub Issues, Jira o GitLab configurado, basta con «Empieza la tarea #42»: el agente la lee, la marca en curso y la enlaza al trabajo. Lo verás en [uso diario](../uso/ftd.md).

## 2. Qué hace el agente
| Paso | Lo que hizo en PetClinic | Pieza |
|---|---|---|
| Elige carril | FTD: cambio claro, sin decisiones abiertas | orientación |
| Calcula el [riesgo](../ayuda/glosario.md#riesgo) previsto | `riesgo.mjs` con los archivos que va a tocar → **1** (código normal) | script `riesgo` |
| Crea la rama | `refactor/birthdate-futura-petvalidator`, con el formato del proyecto | [skill](../ayuda/glosario.md#skill) `git` |
| Escribe el FTD | `brain/factory/ftd/2026-11-09-birthdate-futura-en-petvalidator.md` | skill `ftd` |
| Test primero | `validateWithFutureBirthDate` **falla** antes del cambio (`expected: <true> but was: <false>`) | [TDD](../ayuda/glosario.md#tdd) |
| Cambio mínimo | la regla pasa a `PetValidator`; se quitan los dos bloques del controlador | — |
| Controles | `node .mh/scripts/mvnq.mjs verify` → **84 tests, 0 fallos**; el agente lee 4 líneas en lugar de 823 | [`mvnq`](../tokens/mvnq.md) |
| Revisión | **un** revisor de [contexto limpio](../ayuda/glosario.md#revisor-de-contexto-limpio) (riesgo 1, terreno Java): `revisor-java-spring` | skill `revision` |
| Evidencia y cierre | FTD con evidencia, `estado: hecho`; commit con código, tests y documentos | skills `ftd` y `git` |

> [!warning] Si el cambio fuera de riesgo 2
> Un cambio en un `.bpmn`, una migración de base de datos, la seguridad o el `pom.xml` es **riesgo 2**: el agente propone **[ASDD](../ayuda/glosario.md#asdd)**, una [spec](../ayuda/glosario.md#spec) que apruebas tú antes de tocar código. Por eso el riesgo se calcula **antes** de empezar, con los archivos que se van a tocar.

## 3. El documento FTD
Así quedó, tal cual lo escribió el agente:

```markdown
---
type: FTD
title: Mover la validación de fecha de nacimiento futura a PetValidator
estado: hecho
rama: refactor/birthdate-futura-petvalidator
riesgo: 1
---
## Intención
Eliminar la duplicación en processCreationForm y processUpdateForm. Mismo código de error
(typeMismatch.birthDate) sobre el campo birthDate.

## Checklist
- [x] El validador rechaza una fecha futura con código typeMismatch.birthDate
      — prueba: PetValidatorTests#validateWithFutureBirthDate
- [x] Hoy y fechas pasadas siguen siendo válidas — prueba: PetValidatorTests#validate
- [x] Alta y edición con fecha futura siguen dando el mismo error — prueba: PetControllerTests (futureBirthDate)
- [x] Controles: node .mh/scripts/mvnq.mjs verify

## Evidencia
> [!success] Validador y controlador
> El test validateWithFutureBirthDate falló antes del cambio (expected: <true> but was: <false>).
> Tras el cambio, mvnq verify: Tests run: 84, Failures: 0, Errors: 0, BUILD SUCCESS. Los tests
> existentes de PetControllerTests siguen en verde sin modificarlos.

## Notas
El error de fecha futura ahora se añade antes que el del nombre duplicado; el formulario muestra
errores por campo, así que no cambia lo visible.
```

Fíjate en tres cosas: **cada punto lleva su prueba**, la evidencia dice **qué falló antes y qué pasa después**, y el agente anotó un efecto secundario sutil (el orden de los errores) en vez de callarlo.

## 4. La revisión
Un [subagente](../ayuda/glosario.md#subagente) que **no vio cómo se escribió el código** revisó el cambio. Su registro:

| # | Hallazgo | Gravedad | Cierre |
|---|---|---|---|
| H1 | `PetValidator.java:61` cambia el orden de errores en el BindingResult | baja | intencionado: la vista muestra errores por campo |
| H2 | Faltaban tests de «hoy es válido» y «fecha nula da un solo error» | baja | arreglado: añadidos en `PetValidatorTests` |

Con riesgo 1 revisa **uno**; con riesgo 2 revisa un panel completo y cada hallazgo se verifica contra el código antes de corregir nada.

## 5. El commit
```text
refactor(owner): mover validación de fecha de nacimiento futura a PetValidator

La comprobación estaba duplicada en PetController (alta y edición).
Se centraliza en PetValidator con el mismo campo y código de error
(typeMismatch.birthDate), sin cambiar el comportamiento. Se añaden
tests del validador, el FTD y el registro de revisión.
```
```text
 brain/factory/ftd/2026-11-09-birthdate-futura-en-petvalidator.md | 39 +++
 brain/factory/revisiones/birthdate-futura-en-petvalidator.md     | 11 +
 src/main/java/…/owner/PetController.java                         | 11 -
 src/main/java/…/owner/PetValidator.java                          |  5 +
 src/test/java/…/owner/PetValidatorTests.java                     | 39 +++
```
El código, los tests y los documentos del [brain](../ayuda/glosario.md#brain) van **en el mismo commit**. El mensaje sigue la convención del proyecto; si no la siguiera, el [hook](../ayuda/glosario.md#hook) lo rechazaría y explicaría el formato. Y si se intenta hacer commit directamente en `main` ([rama protegida](../ayuda/glosario.md#rama-protegida)), el hook lo impide.

> [!note] Lo que pasó de verdad
> En esta ejecución el agente dejó la rama para el final: al hacer el commit en `main`, el hook lo bloqueó y el agente propuso crear la rama en vez de saltarse la protección. A raíz de esta prueba, la skill `ftd` crea la rama **al empezar** cuando la rama base está protegida.

## 6. Lo que queda en el brain
- El **FTD** con su evidencia y el **registro de revisión**, versionados con el código.
- Un **registro de la sesión** en `brain/raw/sesiones/` (commits, archivos, documentos tocados), escrito automáticamente al compactar o cerrar la sesión.
- Si salió una decisión o una lección: «recuérdalo», y el agente la guarda en el brain.

## Cuánto costó
| Parte | Tiempo | Coste |
|---|---|---|
| Del pedido al cambio verificado y revisado | 80 s | 0,36 USD |
| Rama y commit (en la misma sesión, retomada) | — | 0,44 USD |

Medido con Sonnet 5.5 a tarifas de la API ([qué significa ese precio](../uso/ftd.md#cuanto-cuesta)). Retomar una sesión vuelve a cargar todo su contexto; hacerlo todo en la misma conversación sale más barato. Más datos en [ahorro de tokens](../tokens/index.md).

> [!success] Ya sabes trabajar con **meta-harness**
> Lo siguiente: los [carriles de uso diario](../uso/index.md) en detalle, sobre todo **ASDD** para cambios con decisiones.
