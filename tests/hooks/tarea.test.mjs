// Tests de catalog/scripts/tarea.mjs con CLIs simuladas (nunca toca un gestor real).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCRIPT = join(RAIZ, "catalog/scripts/tarea.mjs");
const t = await import(SCRIPT);

let dir, bin;
const RESPUESTAS = {
  gh: JSON.stringify({ number: 57, title: "Reset del cliente", body: "Descripción larga", state: "OPEN", labels: [{ name: "bug" }], url: "https://x/57", comments: [{ author: { login: "dev" }, body: "visto" }] }),
  acli: JSON.stringify({ key: "RES-12", fields: { summary: "Compensación", status: { name: "To Do" }, issuetype: { name: "Story" },
    description: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hola desde ADF" }] }] }, comment: { comments: [] } } }),
  glab: JSON.stringify([{ iid: 3, title: "Vista de clientes", state: "opened" }, { iid: 4, title: "Otra cosa", state: "opened" }]),
};

function proyecto(tareas) {
  writeFileSync(join(dir, ".mh.json"), JSON.stringify({ tareas }));
}
function correr(...argv) {
  const r = spawnSync("node", [SCRIPT, ...argv], { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLAUDE_PROJECT_DIR: dir } });
  return { codigo: r.status, salida: r.stdout.trim() };
}
const registro = (cli) => readFileSync(join(dir, `${cli}.log`), "utf8");

before(() => {
  dir = mkdtempSync(join(tmpdir(), "mh-tarea-"));
  bin = join(dir, "bin");
  spawnSync("mkdir", ["-p", bin]);
  for (const cli of ["gh", "acli", "glab"]) {
    const ruta = join(bin, cli);
    writeFileSync(ruta, `#!/bin/sh\necho "$@" > "${dir}/${cli}.log"\ncat >> "${dir}/${cli}.log" 2>/dev/null\nprintf '%s' '${RESPUESTAS[cli].replace(/'/g, "")}'\n`);
    chmodSync(ruta, 0o755);
  }
});
after(() => rmSync(dir, { recursive: true, force: true }));

describe("tarea.mjs", () => {
  test("sin gestor configurado lo dice y no falla", () => {
    proyecto({});
    const r = correr("ver", "1");
    assert.equal(r.codigo, 1);
    assert.match(r.salida, /no tiene gestor/);
  });

  test("GitHub: resume la tarea y pasa el repositorio explícito", () => {
    proyecto({ gestor: "github", repo: "org/repo" });
    const r = correr("ver", "#57");
    assert.equal(r.codigo, 0);
    assert.match(r.salida, /^#57 · OPEN · Reset del cliente/);
    assert.match(r.salida, /Etiquetas: bug/);
    assert.match(r.salida, /- dev: visto/);
    assert.match(registro("gh"), /issue view 57 --json .* -R org\/repo/);
  });

  test("GitHub: comentar envía el texto por la entrada estándar; estado cambia etiquetas", () => {
    proyecto({ gestor: "github" });
    assert.equal(correr("comentar", "57", "--texto", "Avance: T001 hecha").codigo, 0);
    assert.match(registro("gh"), /issue comment 57 --body-file -\nAvance: T001 hecha/);
    correr("estado", "57", "revision");
    assert.match(registro("gh"), /issue edit 57 --add-label En revisión --remove-label En curso --remove-label Hecho/);
  });

  test("Jira: convierte la descripción ADF a texto y usa transition para el estado", () => {
    proyecto({ gestor: "jira", proyecto: "RES", estados: { hecho: "Done" } });
    const r = correr("ver", "RES-12");
    assert.match(r.salida, /^RES-12 · To Do · Compensación/);
    assert.match(r.salida, /Hola desde ADF/);
    correr("cerrar", "RES-12");
    assert.match(registro("acli"), /jira workitem transition --key RES-12 --status Done --yes/);
    correr("crear", "--titulo", "T001 idempotencia", "--cuerpo", "detalle", "--padre", "RES-12");
    assert.match(registro("acli"), /workitem create --summary T001 idempotencia --project RES --type Task --description detalle --parent RES-12 --json/);
  });

  test("GitLab: buscar filtra por texto en local", () => {
    proyecto({ gestor: "gitlab" });
    const r = correr("buscar", "clientes");
    assert.equal(r.salida, "#3 · opened · Vista de clientes");
  });

  test("permiso desactivado → código 4 salvo --confirmado", () => {
    proyecto({ gestor: "github", permisos: { crear: false } });
    const r = correr("crear", "--titulo", "x");
    assert.equal(r.codigo, 4);
    assert.match(r.salida, /MH_REQUIERE_CONFIRMACION/);
    assert.equal(correr("crear", "--titulo", "x", "--confirmado").codigo, 0);
  });

  test("--simular no ejecuta nada", () => {
    proyecto({ gestor: "github" });
    rmSync(join(dir, "gh.log"), { force: true });
    const r = correr("cerrar", "57", "--texto", "Resuelto en #60", "--simular");
    assert.match(r.salida, /\[simulación\] gh issue close 57 --comment "Resuelto en #60"/);
    assert.throws(() => registro("gh"));
  });

  test("épica: Jira usa el tipo Epic (o el configurado) y las hijas cuelgan con --parent", () => {
    proyecto({ gestor: "jira", proyecto: "RES" });
    correr("crear", "--titulo", "Compensación de reservas", "--cuerpo", "spec", "--epica");
    assert.match(registro("acli"), /--summary Compensación de reservas --project RES --type Epic --description spec --json/);
    proyecto({ gestor: "jira", proyecto: "RES", tipoEpica: "Épica" });
    correr("crear", "--titulo", "X", "--cuerpo", "c", "--epica");
    assert.match(registro("acli"), /--type Épica/);
    correr("crear", "--titulo", "T002", "--cuerpo", "c", "--padre", "RES-20", "--bloqueada-por", "RES-21");
    assert.match(registro("acli"), /--type Task --description c\n\nBloqueada por: RES-21 --parent RES-20/);
  });

  test("épica en GitHub: título marcado; hijas como sub-issue nativo con bloqueos", () => {
    proyecto({ gestor: "github" });
    correr("crear", "--titulo", "Compensación", "--cuerpo", "spec", "--epica");
    assert.match(registro("gh"), /issue create --title Épica: Compensación --body-file -\nspec$/);
    correr("crear", "--titulo", "T001", "--cuerpo", "c", "--padre", "#40", "--bloqueada-por", "41,#42");
    assert.match(registro("gh"), /--body-file - --parent 40 --blocked-by 41,42\nc$/);
    proyecto({ gestor: "github", tipoEpica: "Epic" });
    correr("crear", "--titulo", "Compensación", "--cuerpo", "spec", "--epica");
    assert.match(registro("gh"), /--title Compensación --body-file - --type Epic/);
  });

  test("gh antiguo sin --parent: repite con padre y bloqueos como texto", () => {
    proyecto({ gestor: "github" });
    const ruta = join(bin, "gh");
    const original = readFileSync(ruta, "utf8");
    writeFileSync(ruta, `#!/bin/sh\ncase "$*" in *--parent*) echo "unknown flag: --parent" >&2; exit 1;; esac\necho "$@" > "${dir}/gh.log"\ncat >> "${dir}/gh.log"\necho https://x/43\n`);
    try {
      const r = correr("crear", "--titulo", "T001", "--cuerpo", "c", "--padre", "40", "--bloqueada-por", "41");
      assert.equal(r.codigo, 0);
      assert.equal(r.salida, "https://x/43");
      assert.match(registro("gh"), /--body-file -\nc\n\nParte de #40\nBloqueada por: #41$/);
    } finally { writeFileSync(ruta, original); }
  });

  test("GitLab: épica marcada en el título; padre y bloqueos como texto", () => {
    proyecto({ gestor: "gitlab" });
    correr("crear", "--titulo", "T001", "--cuerpo", "c", "--padre", "3", "--bloqueada-por", "4", "--epica");
    assert.match(registro("glab"), /-t Épica: T001 --description-file - --yes\nc\n\nParte de #3\nBloqueada por: #4/);
  });

  test("adfATexto", () => {
    assert.equal(t.adfATexto({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "a" }, { type: "text", text: "b" }] }] }), "ab\n");
  });
});
