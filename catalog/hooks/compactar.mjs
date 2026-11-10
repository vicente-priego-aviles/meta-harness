#!/usr/bin/env node
// PreCompact: guarda el worklog de hechos en el brain y da instrucciones para el resumen de compactación
// (Claude Code usa la salida estándar de este hook como instrucciones del resumen).
import { relative } from "node:path";
import { activo, enAbierto, leerConfig, leerEntrada, raizProyecto } from "./lib/comun.mjs";
import { guardarWorklog } from "./lib/worklog.mjs";

export const INSTRUCCIONES = (worklog) => [
  "Conserva en el resumen, con rutas exactas:",
  "- carril actual (Responder/FTD/ASDD) y el documento FTD o la spec en curso;",
  "- tarea en curso del plan y su comprobación de terminado;",
  "- decisiones tomadas y entradas nuevas de la cola de decisiones;",
  "- controles ejecutados y su resultado (y los no ejecutados);",
  "- archivos modificados y lo que falta.",
  worklog ? `Worklog de hechos guardado en ${worklog}.` : "",
].filter(Boolean).join("\n");

if (process.argv[1]?.endsWith("compactar.mjs")) {
  enAbierto(() => {
    const entrada = leerEntrada();
    const raiz = raizProyecto(entrada);
    const config = leerConfig(raiz);
    if (!activo(config, "worklog")) return;
    const ruta = guardarWorklog(raiz, config.brain || "brain", entrada.session_id, `compactación (${entrada.trigger || "?"})`);
    process.stdout.write(INSTRUCCIONES(ruta ? relative(raiz, ruta) : null));
  });
}
