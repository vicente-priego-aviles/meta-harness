#!/usr/bin/env node
// Stop: al terminar una respuesta, si hay cambios de riesgo 2 sin spec ASDD aprobada para la rama, lo recuerda UNA vez
// por conjunto de archivos. Detecta también cambios hechos con Bash (sed, scripts), que los hooks de edición no ven.
// Origen: piloto (Fase 5), un FTD cambió pom.xml con sed y se declaró riesgo 0.
import { join } from "node:path";
import { activo, contexto, enAbierto, git, leerConfig, leerEntrada, primeraVez, raizProyecto } from "./lib/comun.mjs";
import { archivosCambiados, evaluar, ramaBase, textoCambiado } from "../scripts/riesgo.mjs";
import { specAprobada } from "./bash-previo.mjs";
import { createHash } from "node:crypto";

export function avisoRiesgo(raiz, config) {
  const base = ramaBase(raiz);
  const { nivel, archivos } = evaluar(archivosCambiados(raiz, base), config, (r) => textoCambiado(raiz, base, r));
  if (nivel < 2) return null;
  const rama = git(raiz, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (rama && specAprobada(join(raiz, config.brain || "brain", "factory", "specs"), rama)) return null;
  const sensibles = archivos.filter((a) => a.nivel === 2).map((a) => a.ruta);
  return {
    clave: createHash("sha256").update(sensibles.sort().join("|")).digest("hex").slice(0, 12),
    texto: `Hay cambios de riesgo 2 sin spec ASDD aprobada para la rama ${rama || "?"}: ${sensibles.slice(0, 6).join(", ")}. ` +
      "Antes de cerrar: díselo al usuario, refléjalo en el FTD (riesgo: 2) y propón pasar el cambio a ASDD (skill asdd). " +
      "No reviertas nada sin que el usuario lo pida.",
  };
}

if (process.argv[1]?.endsWith("parar.mjs")) {
  enAbierto(() => {
    const entrada = leerEntrada();
    if (entrada.stop_hook_active) return; // evita bucles
    const raiz = raizProyecto(entrada);
    const config = leerConfig(raiz);
    if (!activo(config, "aviso-riesgo")) return;
    const aviso = avisoRiesgo(raiz, config);
    if (!aviso || !primeraVez(raiz, entrada.session_id, `aviso-riesgo-${aviso.clave}`)) return;
    contexto("Stop", aviso.texto);
  });
}
