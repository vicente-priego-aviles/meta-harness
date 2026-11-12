#!/usr/bin/env node
// meta-harness-factory: instalador para Claude Code (primero el plan).
//
//   mh instalar    [--carpeta <dir>] [--nivel … --tipo … --objetivo "…" --alcance … --integracion …] [--modulos a,b] [--json]
//   mh instalar    … --aceptar-plan <id>    aplica el plan exacto (si el proyecto cambió, no escribe nada)
//   mh comprobar   [--carpeta <dir>] [--json]  estado de la instalación
//   mh reevaluar   [--carpeta <dir>]        ¿hay módulos nuevos que proponer? (no escribe nada)
//   mh actualizar  [--carpeta <dir>]        reinstala lo instalado con el catálogo actual
//   mh desinstalar [--carpeta <dir>] [--confirmar]   quita lo gestionado (nunca el brain)
//
// Alias en inglés: onboard, doctor, reassess, sync, uninstall · --target, --accept-plan.
//
// Códigos de salida: 0 bien · 1 error · 2 faltan respuestas · 3 el plan cambió.
import { existsSync, lstatSync, readdirSync, readlinkSync, rmSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { aplicar, BLOQUE_FIN, BLOQUE_INICIO, fusionarSettings } from "./lib/aplicar.mjs";
import { doctor } from "./lib/doctor.mjs";
import { escanear } from "./lib/escaneo.mjs";
import { construirPlan } from "./lib/plan.mjs";
import { PREGUNTAS, preguntar, validar } from "./lib/preguntas.mjs";
import { RAIZ_MH, VERSION, escribir, leer } from "./lib/util.mjs";

const CAMPOS = ["nivel", "tipo", "objetivo", "alcance", "integracion", "convencion", "formatoRama", "gestor", "proyecto", "acceso"];

const ALIAS_ORDEN = { onboard: "instalar", doctor: "comprobar", reassess: "reevaluar", sync: "actualizar", uninstall: "desinstalar" };
const ALIAS_OPCION = { target: "carpeta", "accept-plan": "aceptar-plan" };

function argumentos(argv) {
  const [orden, ...resto] = argv;
  const opts = { orden: ALIAS_ORDEN[orden] || orden || "ayuda", banderas: new Set() };
  for (let i = 0; i < resto.length; i++) {
    const a = resto[i];
    if (!a.startsWith("--")) continue;
    const clave = ALIAS_OPCION[a.slice(2)] || a.slice(2);
    const sig = resto[i + 1];
    if (sig === undefined || sig.startsWith("--")) opts.banderas.add(clave);
    else { opts[clave] = sig; i++; }
  }
  return opts;
}

const salir = (codigo, texto) => { if (texto) console.log(texto); process.exit(codigo); };
const cfgDe = (raiz) => { try { return JSON.parse(leer(join(raiz, ".mh.json"), "{}") || "{}"); } catch { return {}; } };

function respuestasDe(opts, raiz) {
  const previas = cfgDe(raiz).plan?.respuestas || {};
  const r = { ...previas };
  for (const c of CAMPOS) if (opts[c] !== undefined) r[c] = opts[c];
  if (opts["objetivo-b64"]) r.objetivo = Buffer.from(opts["objetivo-b64"], "base64").toString("utf8");
  if (opts.modulos) r.modulos = opts.modulos.split(",").map((s) => s.trim()).filter(Boolean);
  return r;
}

const ICONO = { seleccionado: "✔", aplazado: "⏸", excluido: "✖" };

export function mostrarPlan(plan, raiz) {
  const l = [];
  l.push(`Plan de instalación ${plan.id} · meta-harness-factory ${plan.version} · proyecto ${plan.proyecto} · perfil ${plan.perfil}`, "");
  l.push("Módulos:");
  for (const [id, d] of Object.entries(plan.modulos)) {
    l.push(`  ${ICONO[d.estado]} ${id.padEnd(8)} ${d.estado} — ${d.motivo}${d.reevaluarSi ? ` (se propondrá si ${d.reevaluarSi})` : ""}`);
  }
  const c = plan.componentes;
  const sel = (x) => x.filter((i) => i.estado === "seleccionado");
  l.push("", "Componentes:");
  l.push(`  skills (${sel(c.skills).length}): ${sel(c.skills).map((s) => s.id + (s.automatica ? "" : " (manual)")).join(", ")}`);
  l.push(`  subagentes (${sel(c.agentes).length}): ${sel(c.agentes).map((a) => a.id).join(", ")}`);
  if (c.reglas.length) l.push(`  reglas con paths (${c.reglas.length}): ${c.reglas.map((r) => r.id).join(", ")}`);
  if (c.vendor.length) l.push(`  referencias de proveedor: ${c.vendor.map((v) => v.id).join(", ")}`);
  const excl = [...c.skills, ...c.agentes].filter((x) => x.estado === "excluido");
  for (const x of excl) l.push(`  ✖ ${x.id}: ${x.motivo}`);
  l.push("", "Archivos:");
  const agrupar = { copiar: ".claude/" };
  for (const a of plan.archivos.filter((x) => !agrupar[x.accion])) l.push(`  ${a.accion.padEnd(17)} ${a.ruta}${a.motivo ? ` — ${a.motivo}` : ""}`);
  const n = (pre) => plan.archivos.filter((x) => x.ruta.startsWith(pre)).length;
  if (n(".claude/skills/")) l.push(`  ${"copiar".padEnd(17)} .claude/skills/ — ${n(".claude/skills/")} skills`);
  if (n(".claude/agents/")) l.push(`  ${"copiar".padEnd(17)} .claude/agents/ — ${n(".claude/agents/")} subagentes`);
  if (n(".claude/rules/")) l.push(`  ${"copiar".padEnd(17)} .claude/rules/ — ${n(".claude/rules/")} reglas`);
  const p = plan.presupuesto;
  l.push("", "Presupuesto siempre activo:");
  l.push(`  CLAUDE.md ~${p.claudeMdLineas} líneas · orientación ${p.orientacionBytes} B (+ estado, máx. ${p.inyeccionArranqueMaxBytes} B al arrancar)`);
  l.push(`  ${p.skillsAutomaticas} skills automáticas (${p.descripcionesSkillsChars} caracteres de descripción) · subagentes ${p.descripcionesAgentesChars} car. · reglas siempre activas: ${p.reglasSiempreActivas}`);
  if (plan.avisos.length) {
    l.push("", "Avisos:");
    for (const a of plan.avisos) l.push(`  ⚠ ${a.texto}`, `    → ${a.sugerencia}`);
  }
  const r = plan.respuestas;
  const b64 = Buffer.from(r.objetivo || "", "utf8").toString("base64");
  const extra = ["convencion", "formatoRama", "gestor", "proyecto", "acceso"].filter((k) => r[k]).map((k) => `--${k} '${r[k]}'`).join(" ");
  const cmd = `node ${join(RAIZ_MH, "installer", "mh.mjs")} instalar --carpeta ${raiz} --nivel ${r.nivel} --tipo ${r.tipo} --alcance ${r.alcance} --integracion ${r.integracion} ${extra} --objetivo-b64 ${b64}` +
    `${r.modulos ? ` --modulos ${r.modulos.join(",")}` : ""} --aceptar-plan ${plan.id}`;
  l.push("", "No se ha escrito nada. Para aplicar exactamente este plan:", `  ${cmd}`);
  return l.join("\n");
}

function mostrarDoctor(d) {
  const l = [`Estado: ${d.estado}`];
  for (const e of d.errores) l.push(`  ✖ ${e}`);
  for (const a of d.avisos) l.push(`  ⚠ ${a}`);
  if (d.presupuesto) {
    const p = d.presupuesto;
    l.push(`Presupuesto real: CLAUDE.md ${p.claudeMdLineas} líneas · orientación ${p.orientacionBytes} B · ${p.skillsAutomaticas} skills automáticas (${p.descripcionesSkillsChars} car.) · ${p.agentes} subagentes (${p.descripcionesAgentesChars} car.) · reglas siempre activas ${p.reglasSiempreActivas}`);
  }
  return l.join("\n");
}

async function onboard(opts, raiz) {
  const resp = respuestasDe(opts, raiz);
  const { faltan, errores } = validar(resp);
  if (errores.length) salir(1, `Respuestas no válidas:\n  ${errores.join("\n  ")}`);
  if (faltan.length) {
    if (process.stdin.isTTY && !opts.banderas.has("json")) await preguntar(resp);
    else salir(2, JSON.stringify({ codigo: "MH_FALTAN_RESPUESTAS",
      instruccion: "Pregunta al usuario cada una; no las deduzcas del código. Luego repite la orden con --<id> <valor>.",
      preguntas: faltan.map((p) => ({ id: p.id, texto: p.texto, opciones: p.opciones ? Object.keys(p.opciones) : "texto libre" })) }, null, 1));
  }
  const esc = escanear(raiz);
  const plan = construirPlan(raiz, esc, resp);
  const json = opts.banderas.has("json");
  if (!opts["aceptar-plan"]) salir(0, json ? JSON.stringify(plan, null, 1) : mostrarPlan(plan, raiz));
  if (opts["aceptar-plan"] !== plan.id) {
    salir(3, `MH_PLAN_CAMBIADO: el proyecto o las respuestas cambiaron desde que viste el plan ${opts["aceptar-plan"]}. No se ha escrito nada.\n\n${mostrarPlan(plan, raiz)}`);
  }
  const res = aplicar(raiz, plan, esc);
  const d = doctor(raiz);
  const out = { codigo: d.estado === "LISTO" ? "MH_LISTO" : "MH_INCOMPLETO", plan: plan.id, escritos: res.escritos.length, copiaDeSeguridad: res.backup, doctor: d };
  salir(d.estado === "LISTO" ? 0 : 1, json ? JSON.stringify(out, null, 1)
    : `Plan ${plan.id} aplicado: ${res.escritos.length} elementos escritos${res.backup ? `; copia de seguridad en ${res.backup}` : ""}.\n${mostrarDoctor(d)}\n\nSiguiente: abre brain/ como bóveda en Obsidian y revisa con el agente brain/factory/constitucion.md (borrador).`);
}

function reassess(raiz) {
  const cfg = cfgDe(raiz);
  if (!cfg.plan) salir(1, "No hay instalación (.mh.json sin plan): usa «mh instalar».");
  const { modulos: _ignorar, ...resp } = cfg.plan.respuestas;
  const plan = construirPlan(raiz, escanear(raiz), resp);
  const nuevos = Object.entries(plan.modulos).filter(([id, d]) => d.estado === "seleccionado" && !cfg.plan.modulos.includes(id));
  if (!nuevos.length) salir(0, "Sin novedades: el proyecto no pide módulos nuevos. No se ha escrito nada.");
  const lista = [...cfg.plan.modulos, ...nuevos.map(([id]) => id)].join(",");
  salir(0, [`Módulos que ahora tienen señales (no se ha instalado nada):`, ...nuevos.map(([id, d]) => `  + ${id} — ${d.motivo}`),
    "", `Para verlos en un plan: node ${join(RAIZ_MH, "installer", "mh.mjs")} instalar --carpeta ${raiz} --modulos ${lista}`].join("\n"));
}

function sync(raiz) {
  const cfg = cfgDe(raiz);
  if (!cfg.plan) salir(1, "No hay instalación: usa «mh instalar».");
  const resp = { ...cfg.plan.respuestas, modulos: cfg.plan.modulos.filter((m) => m !== "nucleo") };
  const esc = escanear(raiz);
  const plan = construirPlan(raiz, esc, resp);
  const res = aplicar(raiz, plan, esc);
  salir(0, `Actualizado con el catálogo ${VERSION}: ${res.escritos.length} elementos${res.backup ? `; copia de seguridad en ${res.backup}` : ""}.\n${mostrarDoctor(doctor(raiz))}`);
}

function uninstall(raiz, confirmar) {
  const cfg = cfgDe(raiz);
  // Instalaciones antiguas: enlaces simbólicos de .claude/skills a .mh/skills
  const enlaces = (() => { try { return readdirSync(join(raiz, ".claude", "skills")); } catch { return []; } })()
    .filter((s) => { const p = join(raiz, ".claude", "skills", s); try { return lstatSync(p).isSymbolicLink() && readlinkSync(p).includes(".mh/skills/"); } catch { return false; } });
  const skills = (cfg.plan?.skills || []).filter((s) => existsSync(join(raiz, ".claude", "skills", s)) && !enlaces.includes(s));
  const copias = Object.keys(cfg.gestionados || {}).filter((r) => r.startsWith(".claude/") && !r.startsWith(".claude/skills/"));
  const lista = [".mh/", ".mh.json", ...[...enlaces, ...skills].map((s) => `.claude/skills/${s}/`), ...copias, "hooks de meta-harness-factory en .claude/settings.json", "bloque <!-- mh --> de CLAUDE.md"];
  if (!confirmar) salir(0, `Se quitaría:\n  ${lista.join("\n  ")}\nNo se toca: brain/, init.sh ni el resto de CLAUDE.md. Repite con --confirmar para hacerlo.`);
  for (const s of enlaces) unlinkSync(join(raiz, ".claude", "skills", s));
  for (const s of skills) rmSync(join(raiz, ".claude", "skills", s), { recursive: true, force: true });
  for (const r of copias) rmSync(join(raiz, r), { force: true });
  const settingsRuta = join(raiz, ".claude", "settings.json");
  if (existsSync(settingsRuta)) {
    const s = JSON.parse(leer(settingsRuta, "{}"));
    const limpio = fusionarSettings(s, { hooks: Object.fromEntries(Object.keys(s.hooks || {}).map((k) => [k, []])) });
    for (const k of Object.keys(limpio.hooks)) if (!limpio.hooks[k].length) delete limpio.hooks[k];
    // Quita lo que puso la plantilla (si el usuario no lo cambió) y lo que quede vacío
    const plantilla = JSON.parse(leer(join(RAIZ_MH, "catalog", "templates", "settings.json")));
    const nuestros = new Set(plantilla.permissions?.allow || []);
    limpio.permissions.allow = limpio.permissions.allow.filter((a) => !a.includes(".mh/") && !nuestros.has(a));
    for (const [k, v] of Object.entries(plantilla.env || {})) if (limpio.env?.[k] === v) delete limpio.env[k];
    for (const k of ["env", "hooks"]) if (limpio[k] && !Object.keys(limpio[k]).length) delete limpio[k];
    if (!limpio.permissions.allow.length) delete limpio.permissions.allow;
    if (!Object.keys(limpio.permissions).length) delete limpio.permissions;
    const quedan = Object.keys(limpio).filter((k) => k !== "$schema");
    if (quedan.length) escribir(settingsRuta, `${JSON.stringify(limpio, null, 2)}\n`);
    else rmSync(settingsRuta, { force: true });
  }
  const claudeMd = join(raiz, "CLAUDE.md");
  if (existsSync(claudeMd)) escribir(claudeMd, leer(claudeMd).replace(new RegExp(`\\n*${BLOQUE_INICIO}[\\s\\S]*?${BLOQUE_FIN}\\n?`), "\n"));
  const gi = join(raiz, ".gitignore");
  if (existsSync(gi)) escribir(gi, leer(gi).split("\n").filter((l) => ![".mh/tmp/", ".mh/backups/"].includes(l.trim())).join("\n"));
  for (const d of ["skills", "agents", "rules"]) {
    const dir = join(raiz, ".claude", d);
    try { if (!readdirSync(dir).length) rmSync(dir, { recursive: true }); } catch {}
  }
  rmSync(join(raiz, ".mh"), { recursive: true, force: true });
  rmSync(join(raiz, ".mh.json"), { force: true });
  salir(0, "Meta-harness desinstalado. Se conservan brain/, init.sh y tu CLAUDE.md.");
}

async function main() {
  const opts = argumentos(process.argv.slice(2));
  const raiz = resolve(opts.carpeta || process.cwd());
  switch (opts.orden) {
    case "instalar": return onboard(opts, raiz);
    case "comprobar": {
      const d = doctor(raiz);
      return salir(d.estado === "LISTO" ? 0 : 1, opts.banderas.has("json") ? JSON.stringify(d, null, 1) : mostrarDoctor(d));
    }
    case "reevaluar": return reassess(raiz);
    case "actualizar": return sync(raiz);
    case "desinstalar": return uninstall(raiz, opts.banderas.has("confirmar"));
    default:
      return salir(0, `meta-harness-factory ${VERSION}\nÓrdenes: instalar · comprobar · reevaluar · actualizar · desinstalar (en inglés también: onboard · doctor · reassess · sync · uninstall)\nPreguntas de la instalación: ${PREGUNTAS.map((p) => p.id).join(", ")}`);
  }
}

main().catch((e) => salir(1, `Error: ${e.message}`));
