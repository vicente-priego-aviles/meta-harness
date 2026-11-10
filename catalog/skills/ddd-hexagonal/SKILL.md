---
name: ddd-hexagonal
description: DDD táctico y arquitectura hexagonal en Java con jMolecules — agregados, objetos valor, eventos, puertos y adaptadores, y reglas ArchUnit que lo comprueban. Úsala al crear o cambiar código de dominio, casos de uso, puertos o adaptadores.
paths: ["**/dominio/**", "**/domain/**", "**/aplicacion/**", "**/application/**", "**/infraestructura/**", "**/*ArchTest*.java"]
tags: [stack, ddd, hexagonal, arquitectura, jmolecules]
---

# DDD táctico y arquitectura hexagonal

## Estructura de paquetes (convención del meta-harness, en español)
```
<contexto>/
├── dominio/                 modelo/{agregado,entidad,objetovalor} · servicio · repositorio (interfaces) · evento · excepcion
├── aplicacion/              puerto/entrada (casos de uso) · puerto/salida · servicio (implementa casos de uso) · dto · mapper
└── infraestructura/         adaptador/entrada/{rest,camunda,ui} · adaptador/salida/{persistencia,cliente,mensajeria} · configuracion
```
Dependencias: `infraestructura → aplicacion → dominio`. **Nunca al revés.**

## Reglas
1. **El dominio no conoce a Spring ni a la infraestructura**: ni `org.springframework.*`, ni JPA, ni Camunda, ni Jackson. Lombok está permitido. Los eventos de dominio se registran en el agregado sin heredar clases de Spring.
2. **Agregado** (`@AggregateRoot` de jMolecules): una única puerta de entrada; los invariantes se comprueban en sus métodos; no hay setters públicos; se referencia a otros agregados **por id** (objeto valor `XxxId`), nunca por objeto.
3. **Objeto valor** (`@ValueObject`, preferiblemente `record`): inmutable, valida en el constructor, sin identidad.
4. **Una transacción modifica un agregado.** Para coordinar varios: eventos de dominio o el proceso Camunda.
5. **Casos de uso** (puerto de entrada): interfaz en `aplicacion/puerto/entrada`, nombre de intención (`ActivarCliente`), implementación en `aplicacion/servicio` con `@Transactional`.
6. **Repositorio**: interfaz en dominio con lenguaje del dominio; implementación JPA en `infraestructura/adaptador/salida/persistencia` con su propia entidad JPA y mapper (el agregado no es la entidad JPA).
7. **Adaptadores de entrada** (REST, workers Camunda, vistas Vaadin) solo llaman a puertos de entrada.
8. Nombres del **lenguaje ubicuo** (`brain/wiki/producto/glosario.md`); si aparece un término nuevo, añádelo al glosario.

## Comprobarlo con ArchUnit + jMolecules
Dependencias de test: `org.jmolecules.integrations:jmolecules-archunit` y `com.tngtech.archunit:archunit-junit5`. Plantilla en `references/arquitectura-test.md`. Este test es **configuración protegida**: no se relaja para que el código pase.

## Señales de alarma (las busca el revisor DDD)
- Import de `org.springframework` o `jakarta.persistence` en `dominio/`.
- Agregado que contiene otro agregado (en vez de su id) o que se modifica junto a otro en la misma transacción.
- Lógica de negocio en controladores, workers, vistas o servicios de infraestructura.
- Getters usados para decidir fuera del agregado («pregunta y luego decide» en vez de «dile que lo haga»).
- Objetos valor mutables o sin validación.
