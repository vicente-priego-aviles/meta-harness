// Tests del instalador sobre proyectos de prueba. Ejecutar: node --test "tests/**/*.test.mjs"
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MH = join(RAIZ, "installer", "mh.mjs");
const RESP = ["--nivel", "tecnico", "--tipo", "microservicios", "--objetivo", "Probar el instalador", "--alcance", "complejo", "--integracion", "ramas",
  "--convencion", "conventional", "--formatoRama", "{issue}-{tipo}-{slug}", "--gestor", "ninguno"];

function escribir(base, ruta, txt) {
  mkdirSync(dirname(join(base, ruta)), { recursive: true });
  writeFileSync(join(base, ruta), txt);
}

/** Proyecto parecido al piloto: Maven + Spring Boot + Camunda + dominio, CLAUDE.md propio, .gitignore sin salto final. */
function proyecto() {
  const dir = mkdtempSync(join(tmpdir(), "mh-inst-"));
  escribir(dir, "pom.xml", "<project><modules><module>servicio-a</module></modules><dependencies><dependency><artifactId>spring-boot-starter</artifactId></dependency><dependency><groupId>io.camunda</groupId><artifactId>camunda-spring-boot-starter</artifactId></dependency></dependencies></project>");
  escribir(dir, "servicio-a/src/main/java/x/dominio/Reserva.java", "class Reserva {}");
  escribir(dir, "bpmn/reserva.bpmn", "<bpmn/>");
  escribir(dir, "CLAUDE.md", "# Proyecto\n\nInstrucciones propias.\n");
  escribir(dir, ".gitignore", "target/\n.claude/settings.json");
  escribir(dir, ".claude/settings.json", JSON.stringify({ permissions: { allow: ["Bash(git status)"] }, hooks: { Stop: [{ hooks: [{ type: "command", command: "echo mio" }] }] } }));
  escribir(dir, ".claude/skills/brain/SKILL.md", "---\nname: brain\ndescription: mi skill propia\n---\n");
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
  return dir;
}

const mh = (args) => spawnSync("node", [MH, ...args], { encoding: "utf8", input: "" });
const planJson = (dir, extra = []) => JSON.parse(mh(["instalar", "--carpeta", dir, ...RESP, ...extra, "--json"]).stdout);

describe("onboarding", () => {
  let dir;
  before(() => { dir = proyecto(); });
  after(() => rmSync(dir, { recursive: true, force: true }));

  test("sin respuestas no inventa: devuelve las preguntas (código 2) y no escribe", () => {
    const r = mh(["instalar", "--carpeta", dir, "--json"]);
    assert.equal(r.status, 2);
    assert.equal(JSON.parse(r.stdout).codigo, "MH_FALTAN_RESPUESTAS");
    assert.ok(!existsSync(join(dir, ".mh.json")));
  });

  test("el plan detecta el stack, respeta la skill propia y avisa", () => {
    const plan = planJson(dir);
    assert.equal(plan.modulos.java.estado, "seleccionado");
    assert.equal(plan.modulos.ddd.estado, "seleccionado");
    assert.equal(plan.modulos.camunda.estado, "seleccionado");
    assert.equal(plan.modulos.vaadin.estado, "aplazado");
    assert.equal(plan.componentes.skills.find((s) => s.id === "brain").estado, "excluido");
    const avisos = plan.avisos.map((a) => a.id);
    assert.ok(avisos.includes("settings-ignorado"));
    assert.ok(avisos.includes("sin-tests"));
    assert.ok(plan.presupuesto.skillsAutomaticas <= 12);
    assert.equal(plan.presupuesto.reglasSiempreActivas, 0);
    assert.equal(planJson(dir).id, plan.id, "el id es estable");
    assert.ok(!existsSync(join(dir, ".mh")), "ver el plan no escribe");
  });

  test("preguntas condicionales: Jira pide la clave del proyecto y el acceso", () => {
    const base = RESP.filter((x, i) => !(x === "--gestor" || RESP[i - 1] === "--gestor"));
    const r = mh(["instalar", "--carpeta", dir, ...base, "--gestor", "jira", "--json"]);
    assert.equal(r.status, 2);
    const ids = JSON.parse(r.stdout).preguntas.map((q) => q.id);
    assert.deepEqual(ids, ["proyecto", "acceso"]);
    const plan = planJson(dir, ["--gestor", "ninguno"]);
    assert.equal(plan.modulos.git.estado, "seleccionado");
    assert.equal(plan.modulos.tareas.estado, "excluido");
  });

  test("--modulos del usuario manda sobre la detección", () => {
    const plan = planJson(dir, ["--modulos", "java"]);
    assert.equal(plan.modulos.camunda.estado, "excluido");
    assert.equal(plan.modulos.java.estado, "seleccionado");
  });

  test("un id distinto no escribe nada (código 3)", () => {
    const r = mh(["instalar", "--carpeta", dir, ...RESP, "--aceptar-plan", "000000000000"]);
    assert.equal(r.status, 3);
    assert.match(r.stdout, /MH_PLAN_CAMBIADO/);
    assert.ok(!existsSync(join(dir, ".mh")));
  });

  test("aceptar el plan instala y queda LISTO", () => {
    const { id } = planJson(dir);
    const r = mh(["instalar", "--carpeta", dir, ...RESP, "--aceptar-plan", id, "--json"]);
    assert.equal(r.status, 0, r.stdout);
    assert.equal(JSON.parse(r.stdout).codigo, "MH_LISTO");
    // enlaces y piezas
    assert.ok(existsSync(join(dir, ".claude/skills/camunda-8/SKILL.md")) && !lstatSync(join(dir, ".claude/skills/camunda-8")).isSymbolicLink(), "skill copiada, sin enlace");
    assert.ok(!lstatSync(join(dir, ".claude/skills/brain")).isSymbolicLink(), "la skill propia sigue intacta");
    assert.ok(existsSync(join(dir, ".mh/vendor/camunda/camunda-job-workers/SKILL.md")));
    assert.ok(existsSync(join(dir, ".claude/agents/revisor-camunda.md")));
    // settings fusionado conservando lo del usuario
    const s = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8"));
    assert.ok(s.permissions.allow.includes("Bash(git status)"));
    assert.ok(JSON.stringify(s.hooks.Stop).includes("echo mio"));
    assert.ok(JSON.stringify(s.hooks.SessionStart).includes(".mh/hooks/sesion-inicio.mjs"));
    // CLAUDE.md con bloque, .gitignore bien unido, brain sin marcadores
    const claude = readFileSync(join(dir, "CLAUDE.md"), "utf8");
    assert.match(claude, /Instrucciones propias/);
    assert.equal((claude.match(/mh:inicio/g) || []).length, 1);
    assert.match(readFileSync(join(dir, ".gitignore"), "utf8"), /\.claude\/settings\.json\n\.mh\/tmp\/\n/);
    assert.doesNotMatch(readFileSync(join(dir, "brain/factory/constitucion.md"), "utf8"), /\{\{/);
    assert.match(readFileSync(join(dir, "brain/factory/constitucion.md"), "utf8"), /Camunda 8/);
    const cfg = JSON.parse(readFileSync(join(dir, ".mh.json"), "utf8"));
    assert.equal(cfg.git.convencion, "conventional");
    assert.equal(cfg.git.formatoRama, "{issue}-{tipo}-{slug}");
    assert.deepEqual(cfg.git.ramasProtegidas, ["main"]);
    assert.equal(cfg.tareas.gestor, null);
    assert.ok(existsSync(join(dir, ".claude/skills/git/SKILL.md")));
  });

  test("sync es idempotente y no pisa el brain", () => {
    writeFileSync(join(dir, "brain/wiki/log.md"), "# Registro\n\nmi conocimiento\n");
    const r = mh(["actualizar", "--carpeta", dir]);
    assert.equal(r.status, 0, r.stdout);
    assert.match(readFileSync(join(dir, "brain/wiki/log.md"), "utf8"), /mi conocimiento/);
    assert.equal((readFileSync(join(dir, "CLAUDE.md"), "utf8").match(/mh:inicio/g) || []).length, 1);
    assert.equal(mh(["comprobar", "--carpeta", dir]).status, 0);
  });

  test(".mh.json guarda las señales de lo no instalado para el aviso de arranque", () => {
    const cfg = JSON.parse(readFileSync(join(dir, ".mh.json"), "utf8"));
    assert.deepEqual(cfg.plan.vigilar.vaadin, { dependencias: ["com.vaadin"] });
    assert.ok(!cfg.plan.vigilar.java && !cfg.plan.vigilar.git);
    assert.ok(cfg.plan.archivosBuild.includes("pom.xml"));
  });

  test("git se instala con un build aunque aún no haya repositorio; sin build ni git, queda aplazado", () => {
    const sinGit = mkdtempSync(join(tmpdir(), "mh-sin-git-"));
    try {
      escribir(sinGit, "pom.xml", "<project><dependencies><dependency><artifactId>spring-boot-starter-web</artifactId></dependency></dependencies></project>");
      assert.equal(planJson(sinGit).modulos.git.estado, "seleccionado");
      rmSync(join(sinGit, "pom.xml"));
      escribir(sinGit, "package.json", "{}");
      assert.equal(planJson(sinGit).modulos.git.estado, "seleccionado");
      rmSync(join(sinGit, "package.json"));
      const plan = planJson(sinGit);
      assert.equal(plan.modulos.git.estado, "aplazado");
      assert.deepEqual(plan.vigilar.git.archivos, ["pom.xml", "build.gradle", "build.gradle.kts", "package.json"]);
    } finally {
      rmSync(sinGit, { recursive: true, force: true });
    }
  });

  test("reevaluar propone vaadin cuando aparece su dependencia (sin instalar)", () => {
    assert.match(mh(["reevaluar", "--carpeta", dir]).stdout, /Sin novedades/);
    escribir(dir, "servicio-a/pom.xml", "<project><dependencies><dependency><groupId>com.vaadin</groupId></dependency></dependencies></project>");
    const r = mh(["reevaluar", "--carpeta", dir]);
    assert.match(r.stdout, /\+ vaadin/);
    assert.ok(!existsSync(join(dir, ".claude/skills/vaadin-flow")));
    rmSync(join(dir, "servicio-a/pom.xml"));
  });

  test("doctor detecta piezas rotas", () => {
    rmSync(join(dir, ".mh/hooks/compactar.mjs"));
    const r = mh(["comprobar", "--carpeta", dir, "--json"]);
    assert.equal(r.status, 1);
    assert.match(JSON.parse(r.stdout).errores.join(" "), /compactar/);
    mh(["actualizar", "--carpeta", dir]);
  });

  test("desinstalar quita lo gestionado y conserva brain, init.sh y lo del usuario", () => {
    const r = mh(["desinstalar", "--carpeta", dir, "--confirmar"]);
    assert.equal(r.status, 0);
    assert.ok(!existsSync(join(dir, ".mh")) && !existsSync(join(dir, ".mh.json")));
    assert.ok(existsSync(join(dir, "brain/wiki/log.md")) && existsSync(join(dir, "init.sh")));
    assert.ok(existsSync(join(dir, ".claude/skills/brain/SKILL.md")), "la skill propia sigue");
    const s = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8"));
    assert.ok(!JSON.stringify(s).includes(".mh/"));
    assert.ok(JSON.stringify(s.hooks.Stop).includes("echo mio"));
    assert.doesNotMatch(readFileSync(join(dir, "CLAUDE.md"), "utf8"), /mh:inicio/);
  });
});

describe("proyecto sin CLAUDE.md (plantilla)", () => {
  test("crea el índice desde la plantilla, lista paquetes y sync no duplica el bloque", () => {
    const dir = mkdtempSync(join(tmpdir(), "mh-inst2-"));
    try {
      escribir(dir, "pom.xml", "<project><dependencies><dependency><artifactId>spring-boot-starter-web</artifactId></dependency></dependencies></project>");
      escribir(dir, "src/main/java/org/ej/app/owner/Owner.java", "class Owner {}");
      escribir(dir, "src/main/java/org/ej/app/vet/Vet.java", "class Vet {}");
      escribir(dir, "src/test/java/org/ej/app/OwnerTest.java", "class OwnerTest {}");
      escribir(dir, "docker-compose.yml", "services: {}");
      execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
      const { id } = planJson(dir);
      assert.equal(mh(["instalar", "--carpeta", dir, ...RESP, "--aceptar-plan", id]).status, 0);
      const claude = readFileSync(join(dir, "CLAUDE.md"), "utf8");
      assert.match(claude, /src\/main\/java\/org\/ej\/app\/owner/);
      assert.doesNotMatch(claude, /mh:inicio/);
      assert.match(readFileSync(join(dir, "init.sh"), "utf8"), /^# docker compose -f docker-compose\.yml up -d$/m);
      mh(["actualizar", "--carpeta", dir]);
      const tras = readFileSync(join(dir, "CLAUDE.md"), "utf8");
      assert.doesNotMatch(tras, /mh:inicio/);
      assert.equal((tras.match(/Brain: brain\//g) || []).length, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("actualizar retira piezas que ya no están en el plan", () => {
  test("un agente instalado antes y que ya no existe en el catálogo se retira (con copia de seguridad)", () => {
    const dir = proyecto();
    try {
      const { id } = planJson(dir);
      mh(["instalar", "--carpeta", dir, ...RESP, "--aceptar-plan", id]);
      // simula una instalación antigua con un agente que luego se renombró
      escribir(dir, ".claude/agents/agente-antiguo.md", "---\nname: agente-antiguo\n---\n");
      const cfg = JSON.parse(readFileSync(join(dir, ".mh.json"), "utf8"));
      cfg.gestionados[".claude/agents/agente-antiguo.md"] = "x";
      writeFileSync(join(dir, ".mh.json"), JSON.stringify(cfg));
      escribir(dir, ".claude/agents/mi-agente.md", "---\nname: mi-agente\n---\n"); // del usuario: no gestionado
      const r = mh(["actualizar", "--carpeta", dir]);
      assert.equal(r.status, 0, r.stdout);
      assert.ok(!existsSync(join(dir, ".claude/agents/agente-antiguo.md")), "se retira el antiguo");
      assert.ok(existsSync(join(dir, ".claude/agents/mi-agente.md")), "el del usuario se conserva");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("alias en inglés", () => {
  test("onboard/doctor/sync con --target y --accept-plan siguen funcionando", () => {
    const dir = proyecto();
    try {
      const { id } = JSON.parse(mh(["onboard", "--target", dir, ...RESP, "--json"]).stdout);
      assert.equal(mh(["onboard", "--target", dir, ...RESP, "--accept-plan", id]).status, 0);
      assert.equal(mh(["doctor", "--target", dir]).status, 0);
      assert.match(mh(["sync", "--target", dir]).stdout, /Actualizado con el catálogo/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("skills sin enlaces simbólicos (Windows)", () => {
  test("una instalación antigua con enlaces se convierte en copias al actualizar, y desinstalar las quita", () => {
    const dir = proyecto();
    try {
      const { id } = planJson(dir);
      mh(["instalar", "--carpeta", dir, ...RESP, "--aceptar-plan", id]);
      // simula el formato antiguo: la skill en .mh/skills y un enlace en .claude/skills
      const skill = join(dir, ".claude/skills/git");
      cpSync(skill, join(dir, ".mh/skills/git"), { recursive: true });
      rmSync(skill, { recursive: true });
      symlinkSync("../../.mh/skills/git", skill);
      assert.equal(mh(["actualizar", "--carpeta", dir]).status, 0);
      assert.ok(!lstatSync(skill).isSymbolicLink() && existsSync(join(skill, "SKILL.md")), "ahora es una copia");
      assert.ok(!existsSync(join(dir, ".mh/skills")), "sin la carpeta antigua");
      assert.equal(mh(["desinstalar", "--carpeta", dir, "--confirmar"]).status, 0);
      assert.ok(!existsSync(skill), "desinstalar quita la skill copiada");
      assert.ok(existsSync(join(dir, ".claude/skills/brain/SKILL.md")), "la skill propia sigue");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
