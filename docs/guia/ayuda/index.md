# Ayuda

| Página | Para qué |
|---|---|
| [Mantenimiento](mantenimiento.md) | comprobar la instalación, añadir módulos cuando el proyecto cambia, actualizar, desinstalar y mantener el brain |
| [Problemas frecuentes](problemas.md) | [hooks](../ayuda/glosario.md#hook) que no actúan, bloqueos de `git push`, `mvn` o commits, errores del [gestor de tareas](../ayuda/glosario.md#gestor-de-tareas), Obsidian y Windows |
| [Glosario](glosario.md) | todas las siglas y términos de la guía, de [ADR](../ayuda/glosario.md#adr) a *worktree* |

## Preguntas rápidas
**¿Puedo usarlo en un proyecto que no es Java?** Sí. El núcleo (brain, [carriles](../ayuda/glosario.md#carril) [FTD](../ayuda/glosario.md#ftd) y [ASDD](../ayuda/glosario.md#asdd), revisión, hooks, git y tareas) no depende del lenguaje. Lo que no tendrás son los módulos de stack (Spring Boot, [DDD](../ayuda/glosario.md#ddd), Camunda, Vaadin) ni `mvnq`, y la tabla de [riesgo](glosario.md#riesgo) conviene ajustarla a tus archivos sensibles.

**¿Funciona con otros asistentes además de Claude Code?** No. Usa piezas propias de Claude Code (hooks, [subagentes](../ayuda/glosario.md#subagente), [skills](../ayuda/glosario.md#skill) con `paths`) y está medido con él.

**¿Necesito Obsidian?** No. El [brain](glosario.md#brain) son archivos Markdown que el agente lee y escribe igual sin él. Obsidian sirve para leerlo cómodamente: enlaces, grafo, diagramas y tableros.

**¿Y si trabajo en equipo?** Todo se versiona con el código: los hooks, la configuración y el brain llegan a cada compañero con `git pull`. Cada uno necesita [Node.js](../ayuda/glosario.md#nodejs) y abrir Claude Code una vez en el proyecto para confiar en la carpeta.

**¿Cuánto cuesta?** Unos céntimos más por tarea pequeña y menos en las grandes; con una suscripción Pro o Max no pagas por tarea. Cifras en [resultados medidos](../tokens/resultados.md).

**¿Cómo lo quito?** `mh desinstalar --confirmar`. El brain se queda: es la memoria de tu proyecto ([mantenimiento](mantenimiento.md#desinstalar)).
