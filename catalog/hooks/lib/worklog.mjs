// Worklog de sesión: hechos observables (git y archivos de la factoría), sin opiniones ni contenido del chat.
// Se escribe en <brain>/raw/sesiones/AAAA-MM-DD-<sesion>.md (raw: registro de hechos).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { git, tmp } from "./comun.mjs";

export function datosSesion(raiz, sesion) {
  try {
    return JSON.parse(readFileSync(join(tmp(raiz), `sesion-${(sesion || "x").slice(0, 36)}.json`), "utf8"));
  } catch {
    return {};
  }
}

export function construirWorklog(raiz, brain, sesion, motivo, ahora = new Date()) {
  const { head, inicio } = datosSesion(raiz, sesion);
  const rama = git(raiz, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const actual = git(raiz, ["rev-parse", "HEAD"]);
  const commits = head && actual && head !== actual ? git(raiz, ["log", "--oneline", `${head}..${actual}`]) : "";
  const sinCommit = git(raiz, ["status", "--porcelain"]);
  const factory = sinCommit.split("\n").filter((l) => l.includes(`${brain}/factory/`)).map((l) => l.slice(3));
  const lineas = [
    "---",
    "tipo: fuente-raw",
    "formato: worklog",
    `sesion: ${sesion || "desconocida"}`,
    `inicio: ${inicio || "desconocido"}`,
    `fin: ${ahora.toISOString()}`,
    `motivo: ${motivo}`,
    `rama: ${rama || "?"}`,
    "---",
    "",
    `# Worklog ${ahora.toISOString().slice(0, 10)} · ${rama || "?"}`,
    "",
    "## Commits de la sesión",
    commits ? commits.split("\n").map((c) => `- ${c}`).join("\n") : "- ninguno",
    "",
    "## Cambios sin commit",
    sinCommit ? sinCommit.split("\n").slice(0, 40).map((c) => `- \`${c.trim()}\``).join("\n") : "- ninguno",
    "",
    "## Documentos de la factoría tocados",
    factory.length ? factory.map((f) => `- ${f}`).join("\n") : "- ninguno",
    "",
  ];
  return lineas.join("\n");
}

export function guardarWorklog(raiz, brain, sesion, motivo) {
  const dir = join(raiz, brain, "raw", "sesiones");
  if (!existsSync(join(raiz, brain))) return null;
  mkdirSync(dir, { recursive: true });
  const ruta = join(dir, `${new Date().toISOString().slice(0, 10)}-${(sesion || "sesion").slice(0, 8)}.md`);
  writeFileSync(ruta, construirWorklog(raiz, brain, sesion, motivo));
  return ruta;
}
