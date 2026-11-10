#!/usr/bin/env node
// SessionEnd: guarda el worklog de hechos de la sesión en el brain y limpia los marcadores temporales.
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { activo, enAbierto, leerConfig, leerEntrada, raizProyecto, tmp } from "./lib/comun.mjs";
import { guardarWorklog } from "./lib/worklog.mjs";

if (process.argv[1]?.endsWith("sesion-fin.mjs")) {
  enAbierto(() => {
    const entrada = leerEntrada();
    const raiz = raizProyecto(entrada);
    const config = leerConfig(raiz);
    if (!activo(config, "worklog")) return;
    guardarWorklog(raiz, config.brain || "brain", entrada.session_id, `fin de sesión (${entrada.reason || "?"})`);
    const id = (entrada.session_id || "").slice(0, 36);
    if (id) for (const f of readdirSync(tmp(raiz))) if (f.endsWith(id) || f.includes(`-${id}.`)) rmSync(join(tmp(raiz), f), { force: true });
  });
}
