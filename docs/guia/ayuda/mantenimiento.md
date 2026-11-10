# Mantenimiento

Una vez instalado, **[meta-harness](../ayuda/glosario.md#meta-harness)** casi no pide atención. Esta página explica las cuatro tareas de mantenimiento que puedes necesitar: comprobar la instalación, añadir módulos cuando el proyecto cambia, actualizar a una versión nueva del catálogo y desinstalar. Todas se hacen con el instalador (opciones completas en la [referencia](../referencia/instalador.md)).

```bash
node ~/meta-harness/installer/mh.mjs <orden> --carpeta ~/proyectos/mi-proyecto
```

Sin `--carpeta`, actúa sobre la carpeta en la que estás. También puedes pedírselo al agente: «comprueba la instalación de meta-harness».

## Comprobar que todo está bien
```bash
mh comprobar
```

No cambia nada. Responde **LISTO** o **INCOMPLETO** con los motivos, avisa de lo que puede dar problemas y mide el [presupuesto](../tokens/presupuesto.md) real:

```text
Estado: LISTO
  ⚠ 2 archivos gestionados modificados a mano (mh actualizar los devolvería a la versión del catálogo).
Presupuesto real: CLAUDE.md 31 líneas · orientación 803 B · 8 skills automáticas (1927 car.) · 10 subagentes (1515 car.) · reglas siempre activas 0
```

| Qué comprueba | Si falla |
|---|---|
| Que están todas las [skills](../ayuda/glosario.md#skill), [subagentes](../ayuda/glosario.md#subagente) y reglas del plan | `mh actualizar` las restaura |
| Que los siete [hooks](../ayuda/glosario.md#hook) están conectados en `.claude/settings.json` | `mh actualizar` los vuelve a conectar |
| Que `.claude/settings.json` no está en `.gitignore` | si lo está, quien clone el repositorio no tendrá los hooks |
| Que el proyecto es un repositorio git | sin git no funcionan la puerta de riesgo ni el registro de sesiones |
| Que no quedan marcadores sin rellenar (`{{…}}`) en `CLAUDE.md`, `init.sh` o el brain | complétalos a mano o con el agente |
| Qué archivos instalados se han cambiado a mano | decide si quieres conservar el cambio antes de actualizar |
| Que lo [siempre activo](../ayuda/glosario.md#siempre-activo) cabe en el presupuesto | recorta `CLAUDE.md` o pasa skills a manuales |

Úsalo después de instalar, después de actualizar y cuando algo no se comporte como esperas.

## Cuando el proyecto cambia: añadir módulos
Si el proyecto empieza a usar algo nuevo (el primer `.bpmn`, la dependencia de Vaadin, un repositorio git donde antes no había), no hace falta que te acuerdes de nada: **el hook de arranque lo detecta** y el agente te lo dice al empezar la sesión:

```text
El proyecto ya tiene señales de camunda (no instalado): propón al usuario ejecutar «mh reevaluar», que no instala nada.
```

`reevaluar` vuelve a analizar el proyecto con tus respuestas de la instalación y dice qué módulos propone ahora, sin instalar nada:

```bash
mh reevaluar
```
```text
Módulos que ahora tienen señales (no se ha instalado nada):
  + camunda — 1 modelo BPMN/DMN

Para verlos en un plan: node ~/meta-harness/installer/mh.mjs instalar --carpeta ~/proyectos/mi-proyecto --modulos java,ddd,camunda
```

La orden que imprime enseña el plan completo con el módulo nuevo; como siempre, no se aplica hasta que lo aceptas con `--aceptar-plan`. El hook de arranque solo mira señales baratas (archivos de build y sus dependencias, la carpeta `.git`): no recorre el proyecto en cada sesión.

## Actualizar a una versión nueva del catálogo
Cuando actualices tu copia de meta-harness (por ejemplo, con `git pull`), lleva los cambios a cada proyecto:

```bash
mh actualizar
```

- Reinstala lo instalado con el catálogo nuevo, con los mismos módulos y las mismas respuestas.
- Retira lo que ya no forma parte del plan (una pieza renombrada o quitada del catálogo).
- **Conserva tu configuración** de `.mh.json` (perfil, comprobaciones desactivadas, archivos protegidos, tabla de riesgo, git, tareas), tus hooks y permisos de `.claude/settings.json` y tu parte de `CLAUDE.md`.
- **No toca el brain** salvo para crear archivos que falten.
- Guarda en `.mh/backups/` una copia de todo lo que sobrescribe.

> [!warning] Los cambios a mano en piezas instaladas se pierden
> Si editaste una skill, un subagente o un hook instalado, `mh actualizar` lo devuelve a la versión del catálogo (con copia en `.mh/backups/`). Antes de actualizar, mira el aviso de `mh comprobar`. Lo que quieras adaptar de forma duradera va en `.mh.json`; si una pieza del catálogo no te sirve, mejor proponer el cambio en meta-harness.

Después, revisa el cambio con `git diff` y haz commit. Recuerda que `.claude/` y `.mh/` son [riesgo](../ayuda/glosario.md#riesgo) 2: súbelo en su propio commit o [PR](../ayuda/glosario.md#pr), antes de abrir ramas de trabajo.

## Desinstalar
```bash
mh desinstalar               # enseña lo que quitaría
mh desinstalar --confirmar   # lo quita
```

Quita `.mh/`, `.mh.json`, las skills, subagentes y reglas instalados, los hooks de meta-harness en `.claude/settings.json` y el bloque `<!-- mh:inicio -->…<!-- mh:fin -->` de `CLAUDE.md`. **No toca** el [brain](../ayuda/glosario.md#brain), `init.sh` ni el resto de `CLAUDE.md`: la memoria del proyecto es tuya y sigue sirviendo sin meta-harness.

## Mantener el brain
El brain también necesita un repaso de vez en cuando. Pídeselo al agente:

- **«Haz [lint](../ayuda/glosario.md#lint) del brain»**: comprueba que cada cifra y cita de `wiki/` está en su fuente, que el índice coincide con los archivos y que no hay enlaces rotos, y te informa de contradicciones, notas huérfanas y notas caducadas.
- **Revisa las lecciones en borrador** (`brain/wiki/lecciones/`): son lo que el agente aprendió; hasta que las revisas, siguen como borrador.
- **Vacía la [cola de decisiones](../ayuda/glosario.md#cola-de-decisiones)** (`brain/factory/decisiones-pendientes.md`): lo marcado como `revisar-después` se acumula si no lo miras.
