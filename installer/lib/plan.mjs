// Construye el plan de instalación a partir del escaneo y las respuestas. No escribe nada.
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CATALOGO, RAIZ_MH, VERSION, canonico, descripcion, esEnlaceA, esManual, existe, leer, sha256 } from "./util.mjs";

export const MANIFIESTO = () => JSON.parse(readFileSync(join(RAIZ_MH, "manifests", "modules.json"), "utf8")).modulos;
export const MAX_LINEAS_CLAUDE_MD = 120;
const BLOQUE_LINEAS = 9; // líneas del bloque gestionado que se añade a un CLAUDE.md existente

function decidirModulos(esc, resp, manifiesto) {
  const s = esc.señales;
  const java = Boolean(esc.build) || s.springBoot;
  const d = {};
  d.nucleo = { estado: "seleccionado", motivo: "siempre" };
  d.java = java ? { estado: "seleccionado", motivo: `build ${esc.build || "Java"}${s.springBoot ? " con Spring Boot" : ""}` }
    : { estado: "excluido", motivo: "no hay build Java (pom.xml / Gradle)" };
  const segun = (sel, motivoSel, reevaluar) => (!java ? { estado: "excluido", motivo: "requiere el módulo java" }
    : sel ? { estado: "seleccionado", motivo: motivoSel } : { estado: "aplazado", motivo: "sin señales todavía", reevaluarSi: reevaluar });
  d.ddd = segun(s.dominio || s.jmolecules, [s.dominio && "paquetes dominio/", s.jmolecules && "jMolecules"].filter(Boolean).join(" + "),
    "aparece un paquete dominio/ o la dependencia jmolecules");
  d.camunda = segun(s.camunda || resp.tipo === "orquestador-procesos",
    s.bpmn ? `${s.bpmn} ${s.bpmn === 1 ? "modelo" : "modelos"} BPMN/DMN` : s.camunda ? "dependencia de Camunda" : "proyecto de orquestación de procesos",
    "aparece un .bpmn/.dmn o la dependencia io.camunda");
  d.git = esc.esGit ? { estado: "seleccionado", motivo: "repositorio git" }
    : esc.codigo ? { estado: "seleccionado", motivo: "proyecto de código (build detectado): sus reglas actúan en cuanto inicies el repositorio" }
    : { estado: "aplazado", motivo: "ni repositorio git ni build", reevaluarSi: "se inicializa git o aparece un pom.xml, build.gradle o package.json" };
  d.tareas = resp.gestor && resp.gestor !== "ninguno" ? { estado: "seleccionado", motivo: `gestor ${resp.gestor}${resp.acceso === "mcp" ? " por MCP" : " por CLI"}` }
    : { estado: "excluido", motivo: "sin gestor de tareas elegido" };
  d.vaadin = segun(s.vaadin || resp.tipo === "ui-vaadin", s.vaadin ? "dependencia com.vaadin" : "proyecto con UI Vaadin",
    "aparece la dependencia com.vaadin");

  if (resp.modulos) { // elección explícita del usuario
    const elegidos = new Set(["nucleo", ...resp.modulos]);
    for (const id of [...elegidos]) for (const r of manifiesto[id]?.requiere || []) elegidos.add(r);
    for (const id of Object.keys(manifiesto)) {
      if (elegidos.has(id) && d[id].estado !== "seleccionado") d[id] = { estado: "seleccionado", motivo: "elegido por el usuario" };
      if (!elegidos.has(id)) d[id] = { estado: "excluido", motivo: "no elegido por el usuario" };
    }
  }
  return d;
}

function componentes(raiz, modulos, manifiesto) {
  const out = { skills: [], agentes: [], reglas: [], vendor: [], hooks: [] };
  let instaladas = [];
  try { instaladas = JSON.parse(leer(join(raiz, ".mh.json"), "{}") || "{}").plan?.skills || []; } catch {}
  for (const [id, dec] of Object.entries(modulos)) {
    if (dec.estado !== "seleccionado") continue;
    const m = manifiesto[id];
    for (const s of m.skills || []) {
      const destino = join(raiz, ".claude", "skills", s);
      const nuestro = esEnlaceA(destino, `../../.mh/skills/${s}`) || instaladas.includes(s);
      out.skills.push(existe(destino) && !nuestro
        ? { id: s, modulo: id, estado: "excluido", motivo: "ya existe una skill propia con ese nombre en .claude/skills; no se sobrescribe" }
        : { id: s, modulo: id, estado: "seleccionado", automatica: !esManual(join(CATALOGO, "skills", s, "SKILL.md")) });
    }
    for (const a of m.agentes || []) {
      const destino = join(raiz, ".claude", "agents", `${a}.md`);
      const propio = existe(destino) && !leer(destino).includes("meta-harness") && !leer(join(raiz, ".mh.json")).includes(`"${a}"`);
      out.agentes.push(propio ? { id: a, modulo: id, estado: "excluido", motivo: "ya existe un agente propio con ese nombre" }
        : { id: a, modulo: id, estado: "seleccionado" });
    }
    for (const r of m.reglas || []) out.reglas.push({ id: r, modulo: id, estado: "seleccionado" });
    for (const v of m.vendor || []) out.vendor.push({ id: v, modulo: id, estado: "seleccionado" });
    for (const h of m.hooks || []) out.hooks.push({ id: h, modulo: id, estado: "seleccionado" });
  }
  return out;
}

function archivos(raiz, esc, comp) {
  const a = [
    { ruta: ".mh/", accion: esc.mhJson ? "actualizar" : "crear", motivo: "hooks, scripts, orientación y referencias" },
    { ruta: ".mh.json", accion: esc.mhJson ? "actualizar" : "crear", motivo: "configuración y plan aceptado" },
    { ruta: ".claude/settings.json", accion: esc.settingsExiste ? "fusionar" : "crear", motivo: "hooks y permisos (se conservan los tuyos)" },
    { ruta: "CLAUDE.md", accion: esc.claudeMd ? (esc.claudeMd.bloqueMh ? "actualizar-bloque" : "añadir-bloque") : "crear",
      motivo: esc.claudeMd ? "bloque gestionado entre <!-- mh:inicio --> y <!-- mh:fin -->" : "índice corto desde plantilla" },
    { ruta: "init.sh", accion: existe(join(raiz, "init.sh")) ? "conservar" : "crear", motivo: "arranque y smoke test" },
    { ruta: "brain/", accion: esc.brainExiste ? "completar" : "crear", motivo: "solo se crean los archivos que falten; nunca se sobrescribe" },
    { ruta: ".gitignore", accion: "añadir-lineas", motivo: ".mh/tmp/ y .mh/backups/" },
  ];
  for (const s of comp.skills.filter((x) => x.estado === "seleccionado")) a.push({ ruta: `.claude/skills/${s.id}`, accion: "copiar", motivo: "skill" });
  for (const g of comp.agentes.filter((x) => x.estado === "seleccionado")) a.push({ ruta: `.claude/agents/${g.id}.md`, accion: "copiar", motivo: "subagente" });
  for (const r of comp.reglas) a.push({ ruta: `.claude/rules/${r.id}.md`, accion: "copiar", motivo: "regla con paths" });
  return a;
}

const CLI = { github: "gh", jira: "acli", gitlab: "glab" };
const SESION = { github: ["gh", ["auth", "status"]], jira: ["acli", ["jira", "auth", "status"]], gitlab: ["glab", ["auth", "status"]] };

function avisosTareas(esc, resp) {
  const out = [];
  const g = resp.gestor;
  if (!g || g === "ninguno") {
    if (esc.remoto?.host === "github" || esc.remoto?.host === "gitlab") out.push({ id: "gestor-detectado", texto: `El remoto es de ${esc.remoto.host === "github" ? "GitHub" : "GitLab"} pero no has elegido gestor de tareas.`, sugerencia: `Si trabajas con sus issues, repite con --gestor ${esc.remoto.host}.` });
    return out;
  }
  if (resp.acceso === "mcp") out.push({ id: "mcp", texto: "Has elegido MCP: el instalador no lo configura por ti.", sugerencia: "Añade el servidor MCP oficial del gestor con «claude mcp add» siguiendo su documentación; tarea.mjs seguirá disponible como alternativa." });
  if (!esc.clis[CLI[g]]) {
    out.push({ id: "cli-ausente", texto: `La CLI «${CLI[g]}» no está instalada: tarea.mjs no podrá hablar con ${g}.`, sugerencia: g === "github" ? "Instala GitHub CLI (gh) y ejecuta gh auth login." : g === "jira" ? "Instala la CLI de Atlassian (acli) y ejecuta acli jira auth login." : "Instala GitLab CLI (glab) y ejecuta glab auth login." });
  } else {
    const [bin, a] = SESION[g];
    const r = spawnSync(bin, a, { encoding: "utf8", timeout: 8000 });
    if (r.status !== 0) out.push({ id: "cli-sin-sesion", texto: `«${CLI[g]}» no tiene sesión iniciada.`, sugerencia: `Ejecuta: ${bin} ${a.join(" ").replace("status", "login")}` });
  }
  if ((g === "github" || g === "gitlab") && esc.remoto?.host !== g) out.push({ id: "sin-remoto", texto: `El proyecto no tiene un remoto de ${g}: tarea.mjs necesita saber el repositorio.`, sugerencia: "Indica el repositorio en .mh.json → tareas.repo (\"propietario/repo\") tras instalar." });
  return out;
}

function avisos(esc) {
  const out = [];
  if (!esc.esGit) out.push({ id: "sin-git", texto: "No es un repositorio git: la puerta de riesgo, el aviso FTD y el worklog lo necesitan.", sugerencia: "git init" });
  if (esc.settingsIgnorado) out.push({ id: "settings-ignorado", texto: "Tu .gitignore excluye .claude/settings.json: los hooks funcionarán en tu máquina pero no llegarán a quien clone el repo.",
    sugerencia: "Quita esa línea del .gitignore si quieres compartir el harness (las preferencias personales van en .claude/settings.local.json)." });
  if (esc.claudeMd && esc.claudeMd.lineas + (esc.claudeMd.bloqueMh ? 0 : BLOQUE_LINEAS) > MAX_LINEAS_CLAUDE_MD) {
    out.push({ id: "claude-md-largo", texto: `CLAUDE.md tendrá ~${esc.claudeMd.lineas + (esc.claudeMd.bloqueMh ? 0 : BLOQUE_LINEAS)} líneas (máx. ${MAX_LINEAS_CLAUDE_MD}): se carga entero en cada petición.`,
      sugerencia: esc.modulosMaven.length ? `Tras instalar, pide al agente mover el detalle de cada módulo a su propio CLAUDE.md (${esc.modulosMaven.join(", ")}): solo se cargan al trabajar en ellos.`
        : "Tras instalar, pide al agente mover el detalle a skills, reglas o al brain." });
  }
  if (esc.skillsAgents.length) out.push({ id: "skills-agents", texto: `Hay ${esc.skillsAgents.length} skills en .agents/skills/. Según la documentación de Claude Code, no las carga desde esa carpeta (sí otros agentes).`,
    sugerencia: "No se tocan. Si quieres alguna en Claude Code, evalúala antes: puede solaparse con las del meta-harness (p. ej. las de Camunda ya están como referencia oficial)." });
  if (esc.build && esc.tests === 0) out.push({ id: "sin-tests", texto: "No hay tests en src/test: la constitución exige TDD y evidencia.",
    sugerencia: esc.señales.archunit ? "Primera tarea FTD sugerida: el test de arquitectura (plantilla en la skill ddd-hexagonal)." : "Primera tarea FTD sugerida: un test de humo del arranque." });
  if (esc.build === "maven" && !esc.mvnw) out.push({ id: "sin-mvnw", texto: "No hay Maven Wrapper (mvnw): mvnq usará el mvn del sistema.", sugerencia: "mvn wrapper:wrapper" });
  return out;
}

function presupuesto(raiz, esc, comp) {
  const orientacion = statSync(join(CATALOGO, "always-on", "orientacion.md")).size;
  const auto = comp.skills.filter((s) => s.estado === "seleccionado" && s.automatica);
  const descSkills = auto.reduce((n, s) => n + descripcion(join(CATALOGO, "skills", s.id, "SKILL.md")).length, 0);
  const descAgentes = comp.agentes.filter((a) => a.estado === "seleccionado")
    .reduce((n, a) => n + descripcion(join(CATALOGO, "agents", `${a.id}.md`)).length, 0);
  const plantilla = leer(join(CATALOGO, "templates", "CLAUDE.md")).split("\n").length;
  const lineasClaude = esc.claudeMd ? esc.claudeMd.lineas + (esc.claudeMd.bloqueMh ? 0 : BLOQUE_LINEAS) : plantilla;
  return { orientacionBytes: orientacion, inyeccionArranqueMaxBytes: 1500, claudeMdLineas: lineasClaude,
    skillsAutomaticas: auto.length, descripcionesSkillsChars: descSkills, descripcionesAgentesChars: descAgentes, reglasSiempreActivas: 0 };
}

/** Señales baratas de los módulos no instalados, para que el hook de arranque avise cuando aparezcan (sin escanear el proyecto). */
function vigilar(modulos, manifiesto) {
  const v = {};
  for (const [id, d] of Object.entries(modulos)) {
    if (d.estado === "seleccionado") continue;
    const { git, archivos, dependencias } = manifiesto[id]?.["señales"] || {};
    const s = { ...(git ? { git: true } : {}), ...(archivos ? { archivos } : {}), ...(dependencias ? { dependencias } : {}) };
    if (Object.keys(s).length) v[id] = s;
  }
  return v;
}

export function construirPlan(raiz, esc, resp) {
  const manifiesto = MANIFIESTO();
  const modulos = decidirModulos(esc, resp, manifiesto);
  const comp = componentes(raiz, modulos, manifiesto);
  const cuerpo = {
    version: VERSION,
    proyecto: esc.nombre,
    respuestas: Object.fromEntries(["nivel", "tipo", "objetivo", "alcance", "integracion", "convencion", "formatoRama", "gestor", "proyecto", "acceso"]
      .filter((k) => resp[k] !== undefined).map((k) => [k, resp[k]])),
    perfil: resp.alcance === "pequeno" ? "minimal" : "standard",
    modulos,
    componentes: comp,
    archivos: archivos(raiz, esc, comp),
    avisos: [...avisos(esc), ...avisosTareas(esc, resp)],
    git: { ramaBase: esc.ramaBase, remoto: esc.remoto?.host || null },
    presupuesto: presupuesto(raiz, esc, comp),
    vigilar: vigilar(modulos, manifiesto),
    archivosBuild: esc.archivosBuild || [],
  };
  return { id: sha256(canonico(cuerpo)).slice(0, 12), ...cuerpo };
}
