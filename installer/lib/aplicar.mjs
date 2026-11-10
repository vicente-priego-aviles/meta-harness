// Aplica un plan aceptado. Copia de seguridad de todo lo que modifica; nunca sobrescribe el brain ni archivos propios.
import { chmodSync, existsSync, rmSync, unlinkSync, lstatSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
  CATALOGO, VERSION, anadirLineas, copiarDir, escribir, existe, hashArchivo, hoy, leer, listar, rellenar,
} from "./util.mjs";

export const BLOQUE_INICIO = "<!-- mh:inicio -->";
export const BLOQUE_FIN = "<!-- mh:fin -->";

export function bloqueClaudeMd() {
  return [
    BLOQUE_INICIO,
    "## Meta-harness",
    "Brain: brain/   (memoria del proyecto: consulta brain/wiki/index.md antes de decidir; skill `brain`)",
    "- Carriles Responder · FTD · ASDD; constitución en brain/factory/constitucion.md; glosario en brain/wiki/factoria/glosario.md.",
    "- Maven con `node .mh/scripts/mvnq.mjs <objetivos>`; riesgo del cambio con `node .mh/scripts/riesgo.mjs`.",
    "- Arranque y smoke test: `./init.sh`.",
    BLOQUE_FIN,
  ].join("\n");
}

/** Inserta o sustituye el bloque gestionado en un CLAUDE.md existente. */
export function ponerBloque(texto) {
  const bloque = bloqueClaudeMd();
  const re = new RegExp(`${BLOQUE_INICIO}[\\s\\S]*?${BLOQUE_FIN}`);
  if (re.test(texto)) return texto.replace(re, bloque);
  return `${texto.replace(/\n*$/, "")}\n\n${bloque}\n`;
}

/** Fusiona la plantilla de settings con la del usuario: conserva lo suyo, sustituye solo nuestros hooks. */
export function fusionarSettings(existente, plantilla) {
  const out = { ...existente };
  out.env = { ...(plantilla.env || {}), ...(existente.env || {}) };
  const hooks = { ...(existente.hooks || {}) };
  const esNuestro = (entrada) => JSON.stringify(entrada).includes(".mh/hooks/");
  for (const [evento, entradas] of Object.entries(plantilla.hooks || {})) {
    hooks[evento] = [...(hooks[evento] || []).filter((e) => !esNuestro(e)), ...entradas];
  }
  out.hooks = hooks;
  const allow = new Set([...(existente.permissions?.allow || []), ...(plantilla.permissions?.allow || [])]);
  out.permissions = { ...(existente.permissions || {}), allow: [...allow] };
  if (plantilla.$schema && !out.$schema) out.$schema = plantilla.$schema;
  return out;
}

function valoresPlantilla(esc, plan) {
  const s = esc.señales;
  const stack = [
    esc.build && `- Build: ${esc.build}${esc.mvnw ? " (Maven Wrapper)" : ""}`,
    s.springBoot && "- Spring Boot (versión en el pom.xml)",
    s.camunda && "- Camunda 8 (versión en el pom.xml)",
    s.vaadin && "- Vaadin Flow",
    s.jmolecules && "- jMolecules (DDD) + ArchUnit",
    s.flyway && "- Flyway (migraciones)",
  ].filter(Boolean).join("\n") || "- <completar con el agente>";
  const mapa = (esc.modulosMaven.length ? esc.modulosMaven.map((m) => `| \`${m}/\` | módulo Maven |`)
    : esc.paquetes.length ? esc.paquetes.map((p) => `| \`${p}/\` | paquete |`) : ["| `src/` | código |"]).join("\n");
  const comandos = [
    "node .mh/scripts/mvnq.mjs verify                  # build y tests (salida filtrada)",
    esc.modulosMaven[0] ? `node .mh/scripts/mvnq.mjs verify -pl ${esc.modulosMaven[0]} -am   # un módulo` : null,
  ].filter(Boolean).join("\n");
  // La infraestructura se deja comentada: el instalador no sabe si la app la necesita para arrancar.
  const infra = esc.dockerCompose.length
    ? `# Infraestructura detectada: descomenta lo que la aplicación necesite para arrancar.\n${esc.dockerCompose.map((f) => `# docker compose -f ${f} up -d`).join("\n")}`
    : "# Sin docker compose detectado: añade aquí la infraestructura que necesite la app.";
  const smoke = s.actuator
    ? '# Smoke test: ajusta el puerto de tu aplicación\n# curl -fsS http://localhost:8080/actuator/health'
    : "# Añade aquí un smoke test (p. ej. curl a un endpoint de salud).";
  return { NOMBRE: esc.nombre, DESCRIPCION: plan.respuestas.objetivo, FECHA: hoy(), VERSION, STACK: stack,
    MAPA: mapa, COMANDOS: comandos, INFRA: infra, SMOKE: smoke };
}

export function aplicar(raiz, plan, esc) {
  const marca = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = join(raiz, ".mh", "backups", marca);
  const respaldar = (rel) => {
    const p = join(raiz, rel);
    if (existsSync(p) && !lstatSync(p).isSymbolicLink()) escribir(join(backup, rel), leer(p));
  };
  const escritos = [];
  const gestionados = {};
  const anotar = (rel) => { gestionados[rel] = hashArchivo(join(raiz, rel)); };
  const v = valoresPlantilla(esc, plan);
  const sel = (lista) => lista.filter((x) => x.estado === "seleccionado");
  const { componentes: comp } = plan;

  // 0. Retirar lo que se instaló antes y ya no forma parte del plan (piezas renombradas o módulos quitados)
  const anterior = JSON.parse(leer(join(raiz, ".mh.json"), "{}") || "{}");
  const nuevosAgentes = new Set(sel(comp.agentes).map((a) => `.claude/agents/${a.id}.md`));
  const nuevasReglas = new Set(comp.reglas.map((r) => `.claude/rules/${r.id}.md`));
  for (const rel of Object.keys(anterior.gestionados || {})) {
    const sobra = (rel.startsWith(".claude/agents/") && !nuevosAgentes.has(rel)) || (rel.startsWith(".claude/rules/") && !nuevasReglas.has(rel));
    if (sobra && existsSync(join(raiz, rel))) { respaldar(rel); rmSync(join(raiz, rel), { force: true }); escritos.push(`retirado ${rel}`); }
  }
  const nuevasSkills = new Set(sel(comp.skills).map((s) => s.id));
  for (const s of anterior.plan?.skills || []) {
    if (nuevasSkills.has(s)) continue;
    for (const rel of Object.keys(anterior.gestionados || {})) if (rel.startsWith(`.claude/skills/${s}/`)) respaldar(rel);
    const dir = join(raiz, ".claude", "skills", s);
    if (existe(dir)) { rmSync(dir, { recursive: true, force: true }); escritos.push(`retirado .claude/skills/${s}`); }
  }
  // Instalaciones antiguas: las skills vivían en .mh/skills con un enlace simbólico en .claude/skills
  rmSync(join(raiz, ".mh", "skills"), { recursive: true, force: true });

  // 1. Piezas del harness en .mh/
  for (const dir of ["hooks", "scripts"]) {
    rmSync(join(raiz, ".mh", dir), { recursive: true, force: true });
    copiarDir(join(CATALOGO, dir), join(raiz, ".mh", dir));
    for (const f of listar(join(raiz, ".mh", dir))) anotar(`.mh/${dir}/${f}`);
  }
  let orientacion = leer(join(CATALOGO, "always-on", "orientacion.md"));
  if (plan.respuestas.nivel === "sencillo") orientacion += "Usuario: explica con palabras sencillas y analogías, sin jerga; define cada término técnico la primera vez.\n";
  escribir(join(raiz, ".mh", "orientacion.md"), orientacion);
  anotar(".mh/orientacion.md");

  // 2. Skills, agentes y reglas: copias en .claude/ (sin enlaces simbólicos, para que funcione igual en Windows,
  //    Linux y macOS y al clonar el repo en cualquiera de ellos). Cuáles son nuestras lo dice .mh.json.
  for (const s of sel(comp.skills)) {
    const destino = join(raiz, ".claude", "skills", s.id);
    for (const rel of Object.keys(anterior.gestionados || {})) if (rel.startsWith(`.claude/skills/${s.id}/`)) respaldar(rel);
    // el plan ya excluyó las skills propias con ese nombre; aquí solo se sustituye la nuestra (o un enlace antiguo)
    if (existe(destino)) (lstatSync(destino).isSymbolicLink() ? unlinkSync(destino) : rmSync(destino, { recursive: true, force: true }));
    copiarDir(join(CATALOGO, "skills", s.id), destino);
    for (const f of listar(destino)) anotar(`.claude/skills/${s.id}/${f}`);
    escritos.push(`.claude/skills/${s.id}/`);
  }
  for (const a of sel(comp.agentes)) {
    const rel = `.claude/agents/${a.id}.md`;
    respaldar(rel);
    escribir(join(raiz, rel), leer(join(CATALOGO, "agents", `${a.id}.md`)));
    anotar(rel);
  }
  for (const r of comp.reglas) {
    const rel = `.claude/rules/${r.id}.md`;
    respaldar(rel);
    escribir(join(raiz, rel), leer(join(CATALOGO, "rules", `${r.id}.md`)));
    anotar(rel);
  }
  for (const vnd of comp.vendor) {
    const destino = join(raiz, ".mh", "vendor", vnd.id);
    rmSync(destino, { recursive: true, force: true });
    copiarDir(join(CATALOGO, "vendor", vnd.id), destino);
    for (const f of listar(destino)) anotar(`.mh/vendor/${vnd.id}/${f}`);
  }

  // 3. settings.json (fusión)
  respaldar(".claude/settings.json");
  const plantillaSettings = JSON.parse(leer(join(CATALOGO, "templates", "settings.json")));
  const actual = JSON.parse(leer(join(raiz, ".claude", "settings.json"), "{}") || "{}");
  escribir(join(raiz, ".claude", "settings.json"), `${JSON.stringify(fusionarSettings(actual, plantillaSettings), null, 2)}\n`);
  escritos.push(".claude/settings.json");

  // 4. CLAUDE.md (plantilla o bloque gestionado) e init.sh (solo si no existe)
  const claudeMd = join(raiz, "CLAUDE.md");
  respaldar("CLAUDE.md");
  // Un CLAUDE.md creado desde la plantilla ya lleva la línea «Brain:»; solo se añade el bloque a los del usuario.
  const actualMd = existsSync(claudeMd) ? leer(claudeMd) : null;
  if (actualMd === null) escribir(claudeMd, rellenar(leer(join(CATALOGO, "templates", "CLAUDE.md")), v));
  else if (actualMd.includes(BLOQUE_INICIO) || !actualMd.includes("Brain: brain/   (memoria del proyecto")) escribir(claudeMd, ponerBloque(actualMd));
  escritos.push("CLAUDE.md");
  if (!existsSync(join(raiz, "init.sh"))) {
    escribir(join(raiz, "init.sh"), rellenar(leer(join(CATALOGO, "templates", "init.sh")), v));
    chmodSync(join(raiz, "init.sh"), 0o755);
    escritos.push("init.sh");
  }

  // 5. brain/: solo lo que falte (nunca se sobrescribe conocimiento)
  const plantillaBrain = join(CATALOGO, "templates", "brain");
  for (const rel of listar(plantillaBrain)) {
    const destino = join(raiz, "brain", rel);
    if (existe(destino)) continue;
    escribir(destino, rellenar(leer(join(plantillaBrain, rel)), v));
    escritos.push(`brain/${rel}`);
  }

  // 6. .gitignore
  respaldar(".gitignore");
  if (anadirLineas(join(raiz, ".gitignore"), [".mh/tmp/", ".mh/backups/"])) escritos.push(".gitignore");

  // 7. .mh.json (conserva la configuración del usuario)
  respaldar(".mh.json");
  const previo = JSON.parse(leer(join(raiz, ".mh.json"), "{}") || "{}");
  const base = JSON.parse(leer(join(CATALOGO, "templates", "mh.json")));
  const config = {
    ...base, ...previo,
    version: VERSION,
    perfil: previo.perfil || plan.perfil,
    git: {
      convencion: plan.respuestas.convencion,
      formatoRama: plan.respuestas.formatoRama,
      ramaBase: plan.git?.ramaBase || "main",
      ramasProtegidas: plan.respuestas.integracion === "ramas" ? [...new Set([plan.git?.ramaBase || "main", "main"])] : [],
      ...(previo.git || {}),
    },
    tareas: (() => {
      const g = plan.respuestas.gestor;
      if (!g || g === "ninguno") return previo.tareas || { gestor: null };
      const estados = g === "jira" ? { enCurso: "In Progress", revision: "In Review", hecho: "Done" } : { enCurso: "En curso", revision: "En revisión", hecho: "Hecho" };
      return { gestor: g, acceso: plan.respuestas.acceso || "cli", proyecto: plan.respuestas.proyecto || null, repo: null,
        permisos: { comentar: true, estado: true, crear: true, cerrar: true }, estados, ...(previo.tareas || {}), gestor: g };
    })(),
    plan: {
      id: plan.id, aceptado: new Date().toISOString(), respuestas: plan.respuestas,
      modulos: Object.entries(plan.modulos).filter(([, d]) => d.estado === "seleccionado").map(([id]) => id),
      skills: sel(comp.skills).map((s) => s.id), agentes: sel(comp.agentes).map((a) => a.id),
      reglas: comp.reglas.map((r) => r.id), vendor: comp.vendor.map((x) => x.id),
      vigilar: plan.vigilar || {}, archivosBuild: plan.archivosBuild || [],
    },
    gestionados,
  };
  escribir(join(raiz, ".mh.json"), `${JSON.stringify(config, null, 2)}\n`);
  escritos.push(".mh.json");
  return { escritos, backup: existsSync(backup) ? relative(raiz, backup) : null };
}
