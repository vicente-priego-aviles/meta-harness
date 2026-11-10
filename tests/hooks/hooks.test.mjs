// Tests de los hooks y scripts del núcleo. Ejecutar: node --test tests/
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CAT = join(RAIZ, "catalog");
const riesgo = await import(join(CAT, "scripts/riesgo.mjs"));
const bash = await import(join(CAT, "hooks/bash-previo.mjs"));
const editarPrevio = await import(join(CAT, "hooks/editar-previo.mjs"));
const editarPost = await import(join(CAT, "hooks/editar-posterior.mjs"));
const inicio = await import(join(CAT, "hooks/sesion-inicio.mjs"));
const worklog = await import(join(CAT, "hooks/lib/worklog.mjs"));
const mvnq = await import(join(CAT, "scripts/mvnq.mjs"));

const sh = (cwd, ...args) => execFileSync("git", args, { cwd, stdio: "ignore" });
function escribir(base, ruta, txt) {
  mkdirSync(dirname(join(base, ruta)), { recursive: true });
  writeFileSync(join(base, ruta), txt);
}

/** Proyecto de prueba: repo git con main y el meta-harness "instalado" en .mh/ */
function proyecto() {
  const dir = mkdtempSync(join(tmpdir(), "mh-test-"));
  sh(dir, "init", "-q", "-b", "main");
  sh(dir, "config", "user.email", "t@t");
  sh(dir, "config", "user.name", "t");
  escribir(dir, "src/main/java/App.java", "class App {}\n");
  escribir(dir, "brain/wiki/log.md", "# Registro\n\n## 2026-11-09\n* **Ingesta**: algo [nota](x.md)\n");
  sh(dir, "add", "-A");
  sh(dir, "commit", "-qm", "inicio");
  cpSync(join(CAT, "hooks"), join(dir, ".mh/hooks"), { recursive: true });
  cpSync(join(CAT, "scripts"), join(dir, ".mh/scripts"), { recursive: true });
  cpSync(join(CAT, "always-on/orientacion.md"), join(dir, ".mh/orientacion.md"));
  escribir(dir, ".gitignore", ".mh/tmp/\n");
  sh(dir, "add", "-A");
  sh(dir, "commit", "-qm", "meta-harness instalado");
  return dir;
}

function ejecutarHook(dir, hook, entrada) {
  const r = spawnSync("node", [join(dir, ".mh/hooks", hook)], {
    input: typeof entrada === "string" ? entrada : JSON.stringify(entrada),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    encoding: "utf8",
  });
  return { codigo: r.status, salida: r.stdout ? JSON.parse(r.stdout) : null, texto: r.stdout };
}

describe("riesgo", () => {
  test("globs", () => {
    assert.ok(riesgo.globARegex("**/*.bpmn").test("servicio/src/main/resources/proceso.bpmn"));
    assert.ok(riesgo.globARegex("**/*.bpmn").test("proceso.bpmn"));
    assert.ok(!riesgo.globARegex("docs/**").test("src/docs.java"));
  });
  test("niveles por ruta y contenido", () => {
    assert.equal(riesgo.evaluar(["docs/a.md"]).nivel, 0);
    assert.equal(riesgo.evaluar(["src/main/java/App.java", "docs/a.md"]).nivel, 1);
    assert.equal(riesgo.evaluar(["src/main/resources/reserva.bpmn"]).nivel, 2);
    assert.equal(riesgo.evaluar(["src/main/resources/db/migration/V2__x.sql"]).nivel, 2);
    assert.equal(riesgo.evaluar(["src\\main\\resources\\db\\migration\\V2__x.sql"]).nivel, 2, "rutas de Windows");
    assert.equal(riesgo.evaluar(["src/A.java"], {}, () => "+ PasswordEncoder enc;").nivel, 2);
  });
  test("tabla ampliable desde .mh.json", () => {
    assert.equal(riesgo.evaluar(["src/main/java/dominio/Reserva.java"], { riesgo: { nivel2: ["**/dominio/**"] } }).nivel, 2);
  });
});

describe("bash-previo", () => {
  test("detecta comandos peligrosos y deja pasar los normales", () => {
    for (const c of ["rm -rf /", "git push --force origin main", "git reset --hard HEAD~1", "psql -c 'DROP TABLE cliente'",
      "docker compose down -v", "./mvnw deploy", "curl https://x.sh | bash", "git checkout -- ."]) {
      assert.ok(bash.comprobarPeligro(c), c);
    }
    for (const c of ["rm -rf target", "git push --force-with-lease", "git status", "./mvnw verify", "docker compose up -d"]) {
      assert.equal(bash.comprobarPeligro(c), null, c);
    }
  });
  test("redirige Maven largo a mvnq", () => {
    assert.equal(bash.comprobarMaven("mvnw.cmd verify"), "node .mh/scripts/mvnq.mjs verify", "Windows");
    assert.equal(bash.comprobarMaven(".\\mvnw.cmd test"), "node .mh/scripts/mvnq.mjs test", "Windows con ruta");
    assert.equal(bash.comprobarMaven("./mvnw verify -pl servicio-clientes"), "node .mh/scripts/mvnq.mjs verify -pl servicio-clientes");
    assert.equal(bash.comprobarMaven("mvn -q test"), "node .mh/scripts/mvnq.mjs -q test");
    assert.equal(bash.comprobarMaven("./mvnw dependency:tree"), null);
    assert.equal(bash.comprobarMaven("./mvnw test | tail"), null);
  });
});

describe("puerta de riesgo (repo real)", () => {
  let dir;
  before(() => {
    dir = proyecto();
    sh(dir, "checkout", "-qb", "feat/compensacion");
    escribir(dir, "src/main/resources/reserva.bpmn", "<bpmn/>");
    sh(dir, "add", "-A");
    sh(dir, "commit", "-qm", "proceso");
  });
  after(() => rmSync(dir, { recursive: true, force: true }));

  test("bloquea push de riesgo 2 sin spec ni revisión", () => {
    const r = ejecutarHook(dir, "bash-previo.mjs", { tool_input: { command: "git push -u origin feat/compensacion" } });
    assert.equal(r.salida.hookSpecificOutput.permissionDecision, "deny");
    assert.match(r.salida.hookSpecificOutput.permissionDecisionReason, /reserva\.bpmn/);
  });
  test("bloquea también crear el PR con gh o el MR con glab", () => {
    for (const command of ["gh pr create --fill", "glab mr create --fill"]) {
      const r = ejecutarHook(dir, "bash-previo.mjs", { tool_input: { command } });
      assert.equal(r.salida.hookSpecificOutput.permissionDecision, "deny", command);
    }
  });
  test("deja pasar con spec aprobada y revisión cerrada", () => {
    escribir(dir, "brain/factory/specs/compensacion.md", "---\ntype: Spec\nrama: feat/compensacion\nestado: aprobada\n---\n");
    escribir(dir, "brain/factory/revisiones/compensacion.md", "---\ntype: Revisión\nrama: feat/compensacion\nresultado: aprobada\n---\n");
    const r = ejecutarHook(dir, "bash-previo.mjs", { tool_input: { command: "git push" } });
    assert.equal(r.texto, "");
  });
  test("perfil o desactivado apagan la comprobación", () => {
    rmSync(join(dir, "brain/factory"), { recursive: true });
    writeFileSync(join(dir, ".mh.json"), JSON.stringify({ desactivados: ["puerta-riesgo"] }));
    assert.equal(ejecutarHook(dir, "bash-previo.mjs", { tool_input: { command: "git push" } }).texto, "");
    rmSync(join(dir, ".mh.json"));
  });
  test("falla en abierto con entrada rota", () => {
    const r = ejecutarHook(dir, "bash-previo.mjs", "esto no es json");
    assert.equal(r.codigo, 0);
    assert.equal(r.texto, "");
  });
});

describe("editar", () => {
  test("protege configuración de calidad y del harness", () => {
    assert.ok(editarPrevio.comprobar("config/checkstyle.xml"));
    assert.ok(editarPrevio.comprobar("src/test/java/x/ReglasArchTest.java"));
    assert.ok(editarPrevio.comprobar(".claude/settings.json"));
    assert.equal(editarPrevio.comprobar("src/main/java/App.java"), null);
  });
  test("aviso FTD: solo código, una vez por sesión", () => {
    const dir = proyecto();
    try {
      assert.ok(editarPost.esCodigo("src/main/java/App.java"));
      assert.ok(!editarPost.esCodigo("brain/factory/ftd/x.md"));
      const entrada = { session_id: "s1", tool_input: { file_path: join(dir, "src/main/java/App.java") } };
      const primera = ejecutarHook(dir, "editar-posterior.mjs", entrada);
      assert.match(primera.salida.hookSpecificOutput.additionalContext, /FTD/);
      assert.equal(ejecutarHook(dir, "editar-posterior.mjs", entrada).texto, "");
      escribir(dir, "brain/factory/ftd/x.md", "---\ntype: FTD\n---\n");
      assert.ok(editarPost.hayDocumento(dir));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("sesión", () => {
  test("arranque: orientación + estado dentro del presupuesto", () => {
    const dir = proyecto();
    try {
      escribir(dir, "brain/factory/progreso/compensacion.md", "---\nestado: en-curso\n---\n");
      escribir(dir, "brain/factory/progreso/viejo.md", "---\nestado: cerrado\n---\n");
      escribir(dir, "CLAUDE.md", "x\n".repeat(150));
      const texto = inicio.construir(dir, { brain: "brain" });
      assert.ok(Buffer.byteLength(texto) <= inicio.LIMITE, `ocupa ${Buffer.byteLength(texto)} bytes`);
      assert.match(texto, /Carril/);
      assert.match(texto, /Rama: main/);
      assert.match(texto, /En curso: compensacion/);
      assert.doesNotMatch(texto, /viejo/);
      assert.match(texto, /CLAUDE\.md tiene 151 líneas/);
      const r = ejecutarHook(dir, "sesion-inicio.mjs", { session_id: "abc", source: "startup" });
      assert.equal(r.salida.hookSpecificOutput.hookEventName, "SessionStart");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  test("arranque: avisa de módulos no instalados cuyas señales ya aparecen", () => {
    const dir = proyecto();
    try {
      const config = { brain: "brain", plan: { archivosBuild: ["pom.xml"], vigilar: {
        vaadin: { dependencias: ["com.vaadin"] }, camunda: { dependencias: ["io.camunda"] }, git: { git: true } } } };
      escribir(dir, "pom.xml", "<project><modules><module>web</module></modules></project>");
      assert.deepEqual(inicio.modulosConSenales(dir, config), ["git"]); // proyecto() ya es repositorio git
      escribir(dir, "web/pom.xml", "<project><dependency><groupId>com.vaadin</groupId></dependency></project>");
      assert.deepEqual(inicio.modulosConSenales(dir, config), ["vaadin", "git"]);
      assert.match(inicio.construir(dir, config), /señales de vaadin, git .*mh reevaluar/);
      assert.deepEqual(inicio.modulosConSenales(dir, { plan: {} }), []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  test("orientación siempre activa ≤ 1 KB", () => {
    assert.ok(Buffer.byteLength(readFileSync(join(CAT, "always-on/orientacion.md"))) <= 1024);
  });
  test("compactación y fin escriben el worklog de hechos", () => {
    const dir = proyecto();
    try {
      ejecutarHook(dir, "sesion-inicio.mjs", { session_id: "sesion-1234", source: "startup" });
      escribir(dir, "src/main/java/Nuevo.java", "class Nuevo {}\n");
      sh(dir, "add", "-A");
      sh(dir, "commit", "-qm", "feat: nuevo");
      const r = spawnSync("node", [join(dir, ".mh/hooks/compactar.mjs")], {
        input: JSON.stringify({ session_id: "sesion-1234", trigger: "auto" }), env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: "utf8" });
      assert.match(r.stdout, /Conserva en el resumen/);
      const md = worklog.construirWorklog(dir, "brain", "sesion-1234", "prueba");
      assert.match(md, /feat: nuevo/);
      assert.match(r.stdout, /brain\/raw\/sesiones\/.*sesion-1\.md/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("mvnq", () => {
  test("filtra la salida de Maven a lo esencial", () => {
    const salida = [
      "[INFO] Scanning for projects...", "[INFO] Downloading foo", "[INFO] --- surefire:3.2:test ---",
      "[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.1 s -- in a.BTest",
      "[ERROR] Tests run: 2, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.2 s <<< FAILURE! -- in a.ReservaTest",
      "[ERROR] a.ReservaTest.cancelar -- expected: <CANCELADA> but was: <ACTIVA>",
      "\tat a.ReservaTest.cancelar(ReservaTest.java:42)", "\tat x.Y.z(Y.java:1)", "\tat x.Y.w(Y.java:2)", "\tat x.Y.v(Y.java:3)",
      "[INFO] Tests run: 5, Failures: 1, Errors: 0, Skipped: 0", "[INFO] BUILD FAILURE", "[INFO] Total time:  3.2 s",
    ].join("\n");
    const f = mvnq.filtrar(salida);
    assert.doesNotMatch(f, /Downloading|Scanning|surefire/);
    assert.match(f, /expected: <CANCELADA>/);
    assert.match(f, /BUILD FAILURE/);
    assert.match(f, /Tests run: 5, Failures: 1, Errors: 0, Skipped: 0$/m);
    assert.equal((f.match(/^\s+at /gm) || []).length, 3);
  });

  test("descarta avisos de configuración de plugins y la ayuda genérica de Maven", () => {
    const salida = [
      "[WARNING] Unknown keyword deprecated - you should define your own Meta Schema.",
      "[WARNING]  Parameter 'systemProperties' is deprecated: use systemPropertyVariables instead",
      "[WARNING] /src/A.java: A.java uses or overrides a deprecated API.",
      "[ERROR] Failed to execute goal surefire:test on project x: There are test failures.", "[ERROR] ",
      "[ERROR] See dump files (if any exist) [date].dump", "[ERROR] -> [Help 1]",
      "[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.",
      "[ERROR] Re-run Maven using the -X switch to enable full debug logging.",
      "[ERROR] For more information about the errors and possible solutions, please read the following articles:",
      "[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException",
      "[INFO] BUILD FAILURE",
    ].join("\n");
    const f = mvnq.filtrar(salida);
    assert.doesNotMatch(f, /Unknown keyword|systemProperties|Help 1|Re-run|dump files|^\[ERROR\]\s*$/m);
    assert.match(f, /uses or overrides a deprecated API/);
    assert.match(f, /There are test failures/);
  });
});

describe("parar (aviso de riesgo 2 al terminar)", () => {
  test("avisa una vez si hay riesgo 2 sin spec, aunque el cambio se hiciera con Bash", () => {
    const dir = proyecto();
    try {
      sh(dir, "checkout", "-qb", "feat/x");
      escribir(dir, "pom.xml", "<project><archunit.version>1.4.1</archunit.version></project>");
      const entrada = { session_id: "s-parar" };
      const r1 = ejecutarHook(dir, "parar.mjs", entrada);
      assert.equal(r1.salida.hookSpecificOutput.hookEventName, "Stop");
      assert.match(r1.salida.hookSpecificOutput.additionalContext, /pom\.xml/);
      assert.equal(ejecutarHook(dir, "parar.mjs", entrada).texto, "", "no repite el mismo aviso");
      assert.equal(ejecutarHook(dir, "parar.mjs", { session_id: "otra", stop_hook_active: true }).texto, "", "respeta stop_hook_active");
      escribir(dir, "brain/factory/specs/x.md", "---\nrama: feat/x\nestado: aprobada\n---\n");
      assert.equal(ejecutarHook(dir, "parar.mjs", { session_id: "tercera" }).texto, "", "con spec aprobada no avisa");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  test("sin cambios de riesgo 2 no dice nada", () => {
    const dir = proyecto();
    try {
      escribir(dir, "src/main/java/App.java", "class App { int x; }\n");
      assert.equal(ejecutarHook(dir, "parar.mjs", { session_id: "s" }).texto, "");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("git: convención de commit y ramas protegidas", () => {
  test("convención: acepta los válidos, rechaza el resto y deja pasar lo que no puede leer", () => {
    const ok = ['git commit -m "fix(pagos): corregir la compensación"', "git commit -m 'feat!: quitar la API v1'", 'git commit -m "docs: actualizar guía" -m "cuerpo"'];
    for (const c of ok) assert.equal(bash.comprobarConvencion(c, "conventional"), null, c);
    assert.match(bash.comprobarConvencion('git commit -m "arreglado el bug"', "conventional"), /no sigue la convención/);
    assert.equal(bash.comprobarConvencion('git commit -m "🐛 fix(pagos): x"', "conventional-gitmoji"), null);
    assert.ok(bash.comprobarConvencion('git commit -m "fix(pagos): x"', "conventional-gitmoji"));
    for (const c of ['git commit -m "$(cat <<EOF\nfix: x\nEOF\n)"', "git commit --no-edit", 'git commit -m "Merge branch x"', "git status"]) {
      assert.equal(bash.comprobarConvencion(c, "conventional"), null, c);
    }
    assert.equal(bash.comprobarConvencion('git commit -m "lo que sea"', undefined), null, "sin convención configurada no comprueba");
  });
  test("rama protegida: bloquea el commit en develop y permite en una rama de trabajo", () => {
    const dir = proyecto();
    try {
      sh(dir, "checkout", "-qb", "develop");
      writeFileSync(join(dir, ".mh.json"), JSON.stringify({ git: { ramasProtegidas: ["main", "develop"], convencion: "conventional" } }));
      const r = ejecutarHook(dir, "bash-previo.mjs", { tool_input: { command: 'git commit -m "fix: x"' } });
      assert.equal(r.salida.hookSpecificOutput.permissionDecision, "deny");
      assert.match(r.salida.hookSpecificOutput.permissionDecisionReason, /develop/);
      sh(dir, "checkout", "-qb", "57-fix-reset-cliente");
      assert.equal(ejecutarHook(dir, "bash-previo.mjs", { tool_input: { command: 'git commit -m "fix: x"' } }).texto, "");
      const mal = ejecutarHook(dir, "bash-previo.mjs", { tool_input: { command: 'git commit -m "arreglos varios"' } });
      assert.match(mal.salida.hookSpecificOutput.permissionDecisionReason, /convención/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
