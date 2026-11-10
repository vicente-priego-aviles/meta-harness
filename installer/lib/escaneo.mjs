// Escaneo del proyecto: evidencia objetiva para el plan. Solo lee.
import { readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { existe, git, leer } from "./util.mjs";

const instalada = (bin) => spawnSync("sh", ["-c", `command -v ${bin}`], { encoding: "utf8" }).status === 0;

const IGNORAR = new Set([".git", "node_modules", "target", "build", ".idea", ".vscode", ".mh", "brain", "dist", "out", ".gradle"]);

function recorrer(dir, raiz, profundidad, acc) {
  if (profundidad < 0) return acc;
  let entradas = [];
  try { entradas = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entradas) {
    if (IGNORAR.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) recorrer(p, raiz, profundidad - 1, acc);
    else acc.push(relative(raiz, p).split("\\").join("/"));
  }
  return acc;
}

export function escanear(raiz) {
  const archivos = recorrer(raiz, raiz, 12, []);
  const builds = archivos.filter((a) => /(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/.test(a));
  const textoBuild = builds.map((b) => leer(join(raiz, b))).join("\n");
  const dep = (re) => re.test(textoBuild);
  const directorios = new Set(archivos.flatMap((a) => a.split("/").slice(0, -1).map((_, i, arr) => arr.slice(0, i + 1).join("/"))));
  const hayDir = (nombre) => [...directorios].some((d) => d.endsWith(`/${nombre}`) || d === nombre);

  const claudeMd = leer(join(raiz, "CLAUDE.md"), null);
  const gitignore = leer(join(raiz, ".gitignore"), null);
  // check-ignore imprime la ruta si está ignorada (--no-index: aunque el archivo esté versionado o no exista)
  const settingsIgnorado = git(raiz, ["check-ignore", "--no-index", ".claude/settings.json"]) === ".claude/settings.json";
  const skillsExistentes = (dir) => { try { return readdirSync(join(raiz, dir)); } catch { return []; } };
  const modulosMaven = [...leer(join(raiz, "pom.xml")).matchAll(/<module>([^<]+)<\/module>/g)].map((m) => m[1].trim());

  const remoto = git(raiz, ["remote", "get-url", "origin"]);
  const ramas = git(raiz, ["branch", "--format=%(refname:short)"]).split("\n").filter(Boolean);

  const fuentesJava = archivos.filter((a) => /^src\/main\/java\/.+\.java$/.test(a)).map((a) => a.split("/").slice(3, -1));
  let comun = fuentesJava[0] || [];
  for (const f of fuentesJava) { let i = 0; while (i < comun.length && comun[i] === f[i]) i++; comun = comun.slice(0, i); }
  const paquetes = [...new Set(fuentesJava.filter((f) => f.length > comun.length).map((f) => ["src/main/java", ...comun, f[comun.length]].join("/")))].slice(0, 12);

  return {
    nombre: basename(raiz),
    paquetes,
    remoto: { url: remoto || null, host: /github\.com/.test(remoto) ? "github" : /gitlab/.test(remoto) ? "gitlab" : remoto ? "otro" : null },
    ramaBase: ["develop", "main", "master"].find((r) => ramas.includes(r)) || git(raiz, ["rev-parse", "--abbrev-ref", "HEAD"]) || "main",
    clis: { gh: instalada("gh"), acli: instalada("acli"), glab: instalada("glab") },
    esGit: existe(join(raiz, ".git")),
    archivosFuente: archivos.filter((a) => /\.(java|kt)$/.test(a)).length,
    tests: archivos.filter((a) => /src\/test\/.*\.(java|kt)$/.test(a)).length,
    build: builds.length ? (builds.some((b) => b.endsWith("pom.xml")) ? "maven" : "gradle") : null,
    archivosBuild: builds.slice(0, 40),
    // Proyecto de código aunque aún no sea un repositorio git (Java hoy; package.json para un frontend futuro)
    codigo: builds.length > 0 || existe(join(raiz, "package.json")),
    mvnw: existe(join(raiz, "mvnw")),
    modulosMaven,
    señales: {
      springBoot: dep(/spring-boot/),
      camunda: dep(/io\.camunda|camunda-spring-boot/) || archivos.some((a) => /\.(bpmn|dmn)$/.test(a)),
      bpmn: archivos.filter((a) => /\.(bpmn|dmn)$/.test(a)).length,
      vaadin: dep(/com\.vaadin/),
      jmolecules: dep(/jmolecules/),
      dominio: hayDir("dominio") || hayDir("domain"),
      archunit: dep(/archunit/),
      flyway: dep(/flyway/),
      actuator: dep(/spring-boot-starter-actuator/),
    },
    dockerCompose: archivos.filter((a) => /^docker-compose[\w-]*\.ya?ml$|^compose\.ya?ml$/.test(a)),
    claudeMd: claudeMd === null ? null : { lineas: claudeMd.split("\n").length, bloqueMh: claudeMd.includes("<!-- mh:inicio -->") },
    gitignore: gitignore === null ? null : { terminaEnSalto: gitignore.endsWith("\n") || gitignore === "" },
    settingsIgnorado,
    settingsExiste: existe(join(raiz, ".claude", "settings.json")),
    skillsClaude: skillsExistentes(".claude/skills"),
    skillsAgents: skillsExistentes(".agents/skills"),
    brainExiste: existe(join(raiz, "brain")),
    mhJson: existe(join(raiz, ".mh.json")),
  };
}
