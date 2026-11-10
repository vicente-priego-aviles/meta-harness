#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): si se edita código sin documento FTD ni spec en curso,
// lo recuerda UNA vez por sesión (no bloquea).
import { relative } from "node:path";
import { activo, contexto, enAbierto, git, leerConfig, leerEntrada, primeraVez, raizProyecto } from "./lib/comun.mjs";
import { ramaBase } from "../scripts/riesgo.mjs";

const CODIGO = /\.(java|kt|groovy|ts|tsx|js|py|sql|bpmn|dmn|form|ya?ml|properties|xml)$/i;

export function esCodigo(rel, brain = "brain") {
  return CODIGO.test(rel) && !rel.startsWith(`${brain}/`) && !rel.startsWith(".mh/") && !rel.startsWith(".claude/");
}

/** ¿Hay un FTD, spec o progreso tocado en el árbol de trabajo o en la rama? */
export function hayDocumento(raiz, brain = "brain") {
  const cambios = git(raiz, ["status", "--porcelain", "--", `${brain}/factory`]);
  if (cambios) return true;
  const rama = git(raiz, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!rama || ["main", "master", "HEAD"].includes(rama)) return false;
  const base = ramaBase(raiz);
  const mb = base ? git(raiz, ["merge-base", base, "HEAD"]) : "";
  return Boolean(mb && git(raiz, ["log", "--oneline", "-n", "1", `${mb}..HEAD`, "--", `${brain}/factory`]));
}

if (process.argv[1]?.endsWith("editar-posterior.mjs")) {
  enAbierto(() => {
    const entrada = leerEntrada();
    const raiz = raizProyecto(entrada);
    const config = leerConfig(raiz);
    if (!activo(config, "aviso-ftd")) return;
    const ruta = entrada?.tool_input?.file_path;
    if (!ruta) return;
    const brain = config.brain || "brain";
    if (!esCodigo(relative(raiz, ruta).split("\\").join("/"), brain)) return;
    if (hayDocumento(raiz, brain)) return;
    if (!primeraVez(raiz, entrada.session_id, "aviso-ftd")) return;
    contexto("PostToolUse",
      "Estás cambiando código sin documento FTD ni spec en curso. Si es un cambio claro, crea el FTD (skill ftd) " +
      "con intención, alcance y checklist con prueba; si hay decisiones abiertas, carril ASDD. Este aviso no se repite en la sesión.");
  });
}
