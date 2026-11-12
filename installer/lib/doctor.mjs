// Comprueba una instalación: piezas presentes, enlaces, hooks conectados, marcadores sin rellenar y presupuesto real.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { VERSION, descripcion, esManual, existe, git, hashArchivo, leer, listar } from "./util.mjs";
import { MAX_LINEAS_CLAUDE_MD } from "./plan.mjs";

export function doctor(raiz) {
  const errores = [];
  const avisos = [];
  const cfgTxt = leer(join(raiz, ".mh.json"), null);
  if (cfgTxt === null) return { estado: "INCOMPLETO", errores: ["Falta .mh.json: meta-harness-factory no está instalado (mh instalar)."], avisos, presupuesto: null };
  let cfg;
  try { cfg = JSON.parse(cfgTxt); } catch { return { estado: "INCOMPLETO", errores: [".mh.json no es JSON válido."], avisos, presupuesto: null }; }

  if (cfg.version !== VERSION) avisos.push(`Instalado con la versión ${cfg.version}; el catálogo va por la ${VERSION}: ejecuta «mh actualizar».`);
  let modificados = 0;
  for (const [rel, hash] of Object.entries(cfg.gestionados || {})) {
    const p = join(raiz, rel);
    if (!existe(p)) errores.push(`Falta ${rel} (mh actualizar lo restaura).`);
    else if (hashArchivo(p) !== hash) modificados++;
  }
  if (modificados) avisos.push(`${modificados} archivos gestionados modificados a mano (mh actualizar los devolvería a la versión del catálogo).`);

  for (const s of cfg.plan?.skills || []) {
    if (!existe(join(raiz, ".claude", "skills", s, "SKILL.md"))) errores.push(`Falta la skill .claude/skills/${s}/SKILL.md (mh actualizar la restaura).`);
  }
  const settings = leer(join(raiz, ".claude", "settings.json"));
  for (const h of ["sesion-inicio", "bash-previo", "editar-previo", "editar-posterior", "compactar", "sesion-fin", "parar"]) {
    if (!settings.includes(`.mh/hooks/${h}.mjs`)) errores.push(`El hook ${h} no está conectado en .claude/settings.json.`);
  }
  if (git(raiz, ["check-ignore", "--no-index", ".claude/settings.json"]) === ".claude/settings.json") {
    avisos.push(".claude/settings.json está en .gitignore: los hooks no llegarán a quien clone el repo.");
  }
  if (!existe(join(raiz, ".git"))) avisos.push("No es un repositorio git: la puerta de riesgo y el worklog no funcionarán.");

  const conMarcadores = ["CLAUDE.md", "init.sh", ...listar(join(raiz, "brain")).filter((f) => f.endsWith(".md")).map((f) => `brain/${f}`)]
    .filter((rel) => /\{\{\w+\}\}/.test(leer(join(raiz, rel))));
  if (conMarcadores.length) avisos.push(`Marcadores sin rellenar en: ${conMarcadores.slice(0, 5).join(", ")}`);

  // Presupuesto real (incluye las skills que ya tuviera el usuario en .claude/skills)
  const lineasClaude = leer(join(raiz, "CLAUDE.md")).split("\n").length;
  if (lineasClaude > MAX_LINEAS_CLAUDE_MD) avisos.push(`CLAUDE.md tiene ${lineasClaude} líneas (máx. ${MAX_LINEAS_CLAUDE_MD}).`);
  let skills = [];
  try { skills = readdirSync(join(raiz, ".claude", "skills")); } catch {}
  const auto = skills.filter((s) => existe(join(raiz, ".claude", "skills", s, "SKILL.md")) && !esManual(join(raiz, ".claude", "skills", s, "SKILL.md")));
  const descSkills = auto.reduce((n, s) => n + descripcion(join(raiz, ".claude", "skills", s, "SKILL.md")).length, 0);
  if (auto.length > 12) avisos.push(`${auto.length} skills automáticas en .claude/skills (máx. recomendado 12).`);
  let agentes = [];
  try { agentes = readdirSync(join(raiz, ".claude", "agents")).filter((f) => f.endsWith(".md")); } catch {}
  const reglasSiempre = (() => { try { return readdirSync(join(raiz, ".claude", "rules")).filter((r) => !/^---\npaths:/.test(leer(join(raiz, ".claude", "rules", r)))).length; } catch { return 0; } })();
  if (reglasSiempre) avisos.push(`${reglasSiempre} reglas sin paths en .claude/rules: se cargan siempre.`);

  const presupuesto = {
    claudeMdLineas: lineasClaude,
    orientacionBytes: Buffer.byteLength(leer(join(raiz, ".mh", "orientacion.md"))),
    skillsAutomaticas: auto.length,
    descripcionesSkillsChars: descSkills,
    agentes: agentes.length,
    descripcionesAgentesChars: agentes.reduce((n, a) => n + descripcion(join(raiz, ".claude", "agents", a)).length, 0),
    reglasSiempreActivas: reglasSiempre,
  };
  return { estado: errores.length ? "INCOMPLETO" : "LISTO", errores, avisos, presupuesto };
}
