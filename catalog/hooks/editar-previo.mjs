#!/usr/bin/env node
// PreToolUse (Edit|Write|MultiEdit): protege la configuración que no debe relajarse para "hacer pasar" el código.
// Pide confirmación (ask) en vez de bloquear: a veces el cambio es legítimo.
import { relative } from "node:path";
import { activo, decisionPreTool, enAbierto, leerConfig, leerEntrada, raizProyecto } from "./lib/comun.mjs";
import { globARegex } from "../scripts/riesgo.mjs";

export const PROTEGIDOS = [
  ["**/checkstyle*.xml", "reglas de estilo (Checkstyle)"],
  ["**/spotbugs*.xml", "reglas de SpotBugs"],
  ["**/pmd*.xml", "reglas de PMD"],
  ["**/.editorconfig", "formato del editor"],
  ["**/*ArchTest*.java", "test de arquitectura (ArchUnit)"],
  ["**/*ArchitectureTest*.java", "test de arquitectura (ArchUnit)"],
  ["**/archunit.properties", "configuración de ArchUnit"],
  [".mh.json", "configuración del meta-harness (tabla de riesgo, perfil)"],
  [".claude/settings.json", "hooks y permisos del harness"],
  [".mh/**", "piezas instaladas del meta-harness"],
  ["brain/factory/constitucion.md", "constitución del proyecto"],
];

export function comprobar(rutaRelativa, extra = []) {
  const hit = [...PROTEGIDOS, ...extra].find(([g]) => globARegex(g).test(rutaRelativa));
  return hit
    ? `${rutaRelativa} es ${hit[1]}. No la relajes para que el código pase: corrige el código. Confirma solo si el usuario lo pidió.`
    : null;
}

if (process.argv[1]?.endsWith("editar-previo.mjs")) {
  enAbierto(() => {
    const entrada = leerEntrada();
    const raiz = raizProyecto(entrada);
    const config = leerConfig(raiz);
    if (!activo(config, "proteger-config")) return;
    const ruta = entrada?.tool_input?.file_path;
    if (!ruta) return;
    const rel = relative(raiz, ruta).split("\\").join("/");
    const extra = (config.protegidos || []).map((g) => [g, "archivo protegido por el proyecto"]);
    const motivo = comprobar(rel, extra);
    if (motivo) decisionPreTool("ask", motivo);
  });
}
