---
name: camunda-8
description: Camunda 8 en Spring Boot — workers idempotentes, errores (BPMN, reintento, incidente), variables como contrato, cambios en BPMN/DMN y tests de proceso. Úsala al tocar workers, *.bpmn, *.dmn, formularios o tests de proceso.
paths: ["**/*.bpmn", "**/*.dmn", "**/*.form", "**/*Worker*.java", "**/camunda/**"]
tags: [stack, camunda, bpmn, procesos]
---

# Camunda 8

Convenciones de meta-harness-factory sobre Camunda 8.8+ con `camunda-spring-boot-starter` (Spring Boot 4; con Spring Boot 3.5 el puente es `camunda-spring-boot-3-starter`). El detalle de API lo da la **documentación oficial de Camunda**, instalada como referencia en `.mh/vendor/camunda/` (léela solo cuando la necesites):

| Necesitas… | Lee |
|---|---|
| `@JobWorker`, `@Variable`, `@VariablesAsType`, `CamundaError`, configuración | `.mh/vendor/camunda/camunda-job-workers/references/worker-sdk-spring.md` |
| Elementos BPMN, extensiones `zeebe:`, estilo y lint del XML | `.mh/vendor/camunda/camunda-bpmn/SKILL.md` |
| Tests de proceso (`camunda-process-test-spring`) | `.mh/vendor/camunda/camunda-process-test/SKILL.md` |
| Expresiones FEEL | `.mh/vendor/camunda/camunda-feel/SKILL.md` |
| ¿Worker, conector o plantilla? | `.mh/vendor/camunda/camunda-development/SKILL.md` |

## Workers (adaptador de entrada)
1. **Fino**: el worker traduce variables → llama a un **puerto de entrada** (caso de uso) → devuelve variables. Nada de lógica de negocio ni repositorios en el worker.
2. **Idempotente**: Zeebe entrega cada job **al menos una vez**. Repetir el mismo job no debe duplicar efectos ni fallar porque «ya se hizo». Usa `job.getKey()` o un id de negocio como clave de idempotencia en el sistema destino, o comprueba antes de escribir. Guardar «ya procesado» en memoria del worker **no** es idempotencia.
3. **Tres tipos de fallo** — nunca los mezcles:
   | Situación | Respuesta |
   |---|---|
   | Resultado de negocio **modelado en el BPMN** (pago rechazado, cliente inexistente) | `CamundaError.bpmnError("CODIGO", mensaje)` con un evento de error que lo capture |
   | Fallo **transitorio** (red, 5xx, BD caída) | `CamundaError.jobError(...)` con reintentos y espera |
   | **Error de programación** (NPE, bug) | deja que falle → reintentos → incidente visible en Operate |
   ❌ `catch (Exception e) { throw bpmnError(...) }` convierte bugs en «negocio» y los oculta.
4. **Variables = contrato**: documenta entrada, salida y errores BPMN del worker (Javadoc o nota del brain). Prefiere `@Variable` / `@VariablesAsType` (record) a `getVariablesAsMap()` y comprueba nulos. Devuelve solo las variables que el proceso usa.
5. Tipo de job en kebab-case y estable (`activar-cliente`): cambiarlo rompe el BPMN desplegado.

## Cambios en BPMN / DMN / formularios — riesgo 2
- Un proceso desplegado es un **contrato**: hay instancias en vuelo con la versión anterior.
- Antes de cambiar: ¿qué pasa con las instancias activas? (siguen con su versión, se migran o se cancelan) → decídelo en la spec.
- No renombres ids de elementos, tipos de job, códigos de error ni mensajes sin plan de compatibilidad.
- Cada elemento con `zeebe:taskDefinition` tiene su worker; cada `bpmnError` del worker, su evento de captura.
- Diagrama legible: nombres en el lenguaje ubicuo del negocio.

## Tests
- **Proceso**: `camunda-process-test-spring` — recorre el camino feliz y cada error BPMN; simula workers externos.
- **Worker**: test unitario del worker con el caso de uso simulado (comprueba mapeo de variables y clasificación de errores).
- **Idempotencia**: ejecuta el worker dos veces con el mismo job y comprueba que no duplica ni falla.
- Ejecuta con `node .mh/scripts/mvnq.mjs verify` (o el subagente `ejecutor-tests`).
