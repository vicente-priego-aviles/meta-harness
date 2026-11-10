#!/usr/bin/env node
// Interfaz única con el gestor de tareas del proyecto (GitHub Issues, Jira o GitLab) mediante su CLI.
// Devuelve resúmenes compactos (no el JSON completo) para gastar menos tokens.
//
//   node .mh/scripts/tarea.mjs ver <id>
//   node .mh/scripts/tarea.mjs buscar [texto]
//   node .mh/scripts/tarea.mjs crear --titulo "…" [--cuerpo "…" | --archivo f.md] [--padre <id>] [--tipo Task] [--epica] [--bloqueada-por "id1,id2"]
//   node .mh/scripts/tarea.mjs comentar <id> (--texto "…" | --archivo f.md)
//   node .mh/scripts/tarea.mjs estado <id> <enCurso|revision|hecho>
//   node .mh/scripts/tarea.mjs cerrar <id> [--texto "…"]
// Configuración en .mh.json → tareas: { gestor: github|jira|gitlab, repo: "propietario/repo", proyecto: "CLAVE", permisos, estados, tipoEpica }
// Opciones: --simular (muestra el comando sin ejecutarlo) · --confirmado (si el permiso está desactivado en .mh.json)
// Salida: 0 bien · 1 error · 4 requiere confirmación del usuario (permiso desactivado).
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_CUERPO = 3000;
const MAX_COMENTARIO = 300;
const PERMISO = { crear: "crear", comentar: "comentar", estado: "estado", cerrar: "cerrar" };

export function config(raiz) {
  let mh = {};
  try { mh = JSON.parse(readFileSync(join(raiz, ".mh.json"), "utf8")); } catch {}
  const t = mh.tareas || {};
  return {
    gestor: t.gestor || null,
    proyecto: t.proyecto || null,
    repo: t.repo || null,
    permisos: { comentar: true, estado: true, crear: true, cerrar: true, ...(t.permisos || {}) },
    estados: { enCurso: "En curso", revision: "En revisión", hecho: "Hecho", ...(t.estados || {}) },
    // Nombre del tipo «épica»: en Jira, «Epic» (o «Épica» si la instancia está en español); en GitHub, solo si la organización tiene tipos de issue
    tipoEpica: t.tipoEpica || null,
  };
}

function args(argv) {
  const pos = [];
  const op = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const k = argv[i].slice(2);
      if (argv[i + 1] === undefined || argv[i + 1].startsWith("--")) op[k] = true;
      else op[k] = argv[++i];
    } else pos.push(argv[i]);
  }
  return { pos, op };
}

const texto = (op) => (op.archivo ? readFileSync(op.archivo, "utf8") : op.texto ?? op.cuerpo ?? "");
const num = (id) => String(id).trim().replace(/^#/, "");
const lista = (v) => (typeof v === "string" ? v.split(",").map(num).filter(Boolean) : []);
/** Sin tipo «épica» en el gestor, el título lo dice. */
const tituloEpica = (op, tipo) => (op.epica && !tipo && !/^épica:/i.test(op.titulo) ? `Épica: ${op.titulo}` : op.titulo);
/** Padre y bloqueos como texto al final del cuerpo, para los gestores (o versiones) sin enlace nativo. */
function pie(op, { padre = true, bloqueos = true } = {}) {
  const l = [];
  if (padre && op.padre) l.push(`Parte de #${num(op.padre)}`);
  if (bloqueos && lista(op["bloqueada-por"]).length) l.push(`Bloqueada por: ${lista(op["bloqueada-por"]).map((x) => (/^\d+$/.test(x) ? `#${x}` : x)).join(", ")}`);
  return l.length ? `\n\n${l.join("\n")}` : "";
}
const recortar = (t, n) => { t = String(t || "").trim(); return t.length > n ? `${t.slice(0, n)}… (+${t.length - n} car.)` : t; };

/** Texto plano de un documento ADF de Jira. */
export function adfATexto(nodo) {
  if (!nodo) return "";
  if (typeof nodo === "string") return nodo;
  if (nodo.type === "text") return nodo.text || "";
  const hijos = (nodo.content || []).map(adfATexto).join(nodo.type === "doc" ? "" : "");
  return ["paragraph", "heading", "listItem", "codeBlock"].includes(nodo.type) ? `${hijos}\n` : hijos;
}

/** Comando de CLI para cada operación y gestor: [binario, argumentos, entrada estándar]. */
export function comando(gestor, accion, id, op, cfg) {
  const n = String(id || "").replace(/^#/, "");
  if (gestor === "github") {
    switch (accion) {
      case "ver": return ["gh", ["issue", "view", n, "--json", "number,title,body,state,labels,assignees,url,comments"]];
      case "buscar": return ["gh", ["issue", "list", "--state", "open", "--limit", "20", "--json", "number,title,state,labels", ...(op.q ? ["--search", op.q] : [])]];
      case "crear": {
        // gh moderno enlaza de forma nativa (sub-issue y bloqueos); op.sinNativo = versión antigua de gh → texto en el cuerpo
        const nativo = !op.sinNativo;
        const bloq = lista(op["bloqueada-por"]);
        return ["gh", ["issue", "create", "--title", tituloEpica(op, cfg.tipoEpica), "--body-file", "-",
          ...(op.epica && cfg.tipoEpica ? ["--type", cfg.tipoEpica] : []),
          ...(nativo && op.padre ? ["--parent", num(op.padre)] : []),
          ...(nativo && bloq.length ? ["--blocked-by", bloq.join(",")] : [])],
          texto(op) + pie(op, { padre: !nativo, bloqueos: !nativo })];
      }
      case "comentar": return ["gh", ["issue", "comment", n, "--body-file", "-"], texto(op)];
      case "estado": {
        const otros = Object.values(cfg.estados).filter((e) => e !== op.estado);
        return ["gh", ["issue", "edit", n, "--add-label", op.estado, ...otros.flatMap((e) => ["--remove-label", e])]];
      }
      case "cerrar": return ["gh", ["issue", "close", n, ...(op.texto ? ["--comment", op.texto] : [])]];
    }
  }
  if (gestor === "jira") {
    switch (accion) {
      case "ver": return ["acli", ["jira", "workitem", "view", n, "--json"]];
      case "buscar": {
        const jql = [cfg.proyecto && `project = ${cfg.proyecto}`, "statusCategory != Done", op.q && `text ~ "${op.q.replace(/"/g, "")}"`].filter(Boolean).join(" AND ");
        return ["acli", ["jira", "workitem", "search", "--jql", jql, "--limit", "20", "--json"]];
      }
      case "crear": return ["acli", ["jira", "workitem", "create", "--summary", op.titulo, "--project", op.proyecto || cfg.proyecto,
        "--type", op.epica ? cfg.tipoEpica || "Epic" : op.tipo || "Task",
        "--description", texto(op) + pie(op, { padre: false }), ...(op.padre ? ["--parent", String(op.padre)] : []), "--json"]];
      case "comentar": return ["acli", ["jira", "workitem", "comment", "create", "--key", n, "--body", texto(op)]];
      case "estado": return ["acli", ["jira", "workitem", "transition", "--key", n, "--status", op.estado, "--yes"]];
      case "cerrar": return ["acli", ["jira", "workitem", "transition", "--key", n, "--status", cfg.estados.hecho, "--yes"]];
    }
  }
  if (gestor === "gitlab") {
    switch (accion) {
      case "ver": return ["glab", ["issue", "view", n, "--comments", "-F", "json"]];
      case "buscar": return ["glab", ["issue", "list", "-F", "json", "-P", "50"]];
      case "crear": return ["glab", ["issue", "create", "-t", tituloEpica(op, null), "--description-file", "-", "--yes"], texto(op) + pie(op)];
      case "comentar": return ["glab", ["issue", "note", n], texto(op)];
      case "estado": {
        const otros = Object.values(cfg.estados).filter((e) => e !== op.estado);
        return ["glab", ["issue", "update", n, "--label", op.estado, ...(otros.length ? ["--unlabel", otros.join(",")] : [])]];
      }
      case "cerrar": return ["glab", ["issue", "close", n]];
    }
  }
  throw new Error(`Operación «${accion}» no disponible para el gestor «${gestor}»`);
}

/** Resume la salida JSON de «ver» y «buscar» en un formato común y corto. */
export function resumir(gestor, accion, salida, q) {
  let d;
  try { d = JSON.parse(salida); } catch { return salida.trim(); }
  if (accion === "buscar") {
    let lista = Array.isArray(d) ? d : d.issues || d.workItems || d.values || [];
    if (gestor === "gitlab" && q) lista = lista.filter((i) => `${i.title} ${i.description || ""}`.toLowerCase().includes(q.toLowerCase()));
    if (!lista.length) return "Sin tareas abiertas que coincidan.";
    return lista.slice(0, 20).map((i) => {
      const id = gestor === "jira" ? i.key : `#${i.number ?? i.iid}`;
      const titulo = i.title ?? i.fields?.summary ?? i.summary;
      const estado = i.state ?? i.fields?.status?.name ?? i.status;
      return `${id} · ${estado} · ${titulo}`;
    }).join("\n");
  }
  if (gestor === "jira") {
    const f = d.fields || d;
    const desc = typeof f.description === "object" ? adfATexto(f.description) : f.description;
    const coms = f.comment?.comments || [];
    return [`${d.key} · ${f.status?.name ?? "?"} · ${f.summary}`, f.issuetype?.name && `Tipo: ${f.issuetype.name}${f.parent ? ` · Padre: ${f.parent.key}` : ""}`,
      "---", recortar(desc, MAX_CUERPO) || "(sin descripción)",
      coms.length ? `--- Últimos comentarios (${Math.min(3, coms.length)} de ${coms.length}) ---\n${coms.slice(-3).map((c) => `- ${c.author?.displayName ?? "?"}: ${recortar(typeof c.body === "object" ? adfATexto(c.body) : c.body, MAX_COMENTARIO)}`).join("\n")}` : null,
    ].filter(Boolean).join("\n");
  }
  const coms = d.comments || d.notes || [];
  const etiquetas = (d.labels || []).map((l) => l.name ?? l).join(", ");
  return [`#${d.number ?? d.iid} · ${d.state} · ${d.title}`, d.url ?? d.web_url, etiquetas && `Etiquetas: ${etiquetas}`, "---",
    recortar(d.body ?? d.description, MAX_CUERPO) || "(sin descripción)",
    coms.length ? `--- Últimos comentarios (${Math.min(3, coms.length)} de ${coms.length}) ---\n${coms.slice(-3).map((c) => `- ${c.author?.login ?? c.author?.username ?? "?"}: ${recortar(c.body, MAX_COMENTARIO)}`).join("\n")}` : null,
  ].filter(Boolean).join("\n");
}

export function ejecutar(argv, raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd()) {
  const { pos, op } = args(argv);
  const [accion, id, extra] = pos;
  const cfg = config(raiz);
  if (!accion) return { codigo: 1, salida: "Uso: tarea.mjs ver|buscar|crear|comentar|estado|cerrar … (ver cabecera del script)" };
  if (!cfg.gestor) return { codigo: 1, salida: "Este proyecto no tiene gestor de tareas configurado (.mh.json → tareas.gestor). Trabaja sin tarea enlazada." };
  if (PERMISO[accion] && !cfg.permisos[PERMISO[accion]] && !op.confirmado) {
    return { codigo: 4, salida: `MH_REQUIERE_CONFIRMACION: «${accion}» está desactivado en .mh.json (tareas.permisos). Pide permiso al usuario y repite con --confirmado.` };
  }
  if (accion === "buscar") op.q = id;
  if (accion === "estado") {
    if (!cfg.estados[extra]) return { codigo: 1, salida: `Estado «${extra}» desconocido. Usa: ${Object.keys(cfg.estados).join(", ")}` };
    op.estado = cfg.estados[extra];
  }
  if (accion === "crear" && !op.titulo) return { codigo: 1, salida: "Falta --titulo" };
  const preparar = () => {
    const [bin, a0, entrada] = comando(cfg.gestor, accion, id, op, cfg);
    // GitHub y GitLab: repositorio explícito si el proyecto no tiene remoto o tiene varios
    return [bin, cfg.repo && bin !== "acli" ? [...a0, "-R", cfg.repo] : a0, entrada];
  };
  let [bin, a, entrada] = preparar();
  if (op.simular) return { codigo: 0, salida: `[simulación] ${bin} ${a.map((x) => (/\s/.test(x) ? JSON.stringify(x) : x)).join(" ")}${entrada ? `\n[entrada estándar] ${recortar(entrada, 200)}` : ""}` };
  let r = spawnSync(bin, a, { input: entrada, encoding: "utf8", cwd: raiz });
  // gh antiguo sin --parent/--blocked-by: se repite con los enlaces como texto
  if (r.status !== 0 && bin === "gh" && accion === "crear" && /unknown flag/i.test(r.stderr || "") && !op.sinNativo) {
    op.sinNativo = true;
    [bin, a, entrada] = preparar();
    r = spawnSync(bin, a, { input: entrada, encoding: "utf8", cwd: raiz });
  }
  if (r.error) return { codigo: 1, salida: `No se pudo ejecutar «${bin}»: ${r.error.code === "ENOENT" ? "no está instalado" : r.error.message}. Comprueba la instalación y la sesión (doctor).` };
  if (r.status !== 0) return { codigo: 1, salida: `«${bin} ${a.slice(0, 3).join(" ")}» falló: ${recortar(r.stderr || r.stdout, 600)}` };
  const salida = ["ver", "buscar"].includes(accion) ? resumir(cfg.gestor, accion, r.stdout, op.q) : (r.stdout.trim() || "Hecho.");
  return { codigo: 0, salida };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const { codigo, salida } = ejecutar(process.argv.slice(2));
  console.log(salida);
  process.exit(codigo);
}
