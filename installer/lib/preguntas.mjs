// Entrevista del onboarding. En modo no interactivo (lo usa Claude), si falta una respuesta NO se inventa:
// se devuelven las preguntas para que el agente se las haga al usuario.
import { createInterface } from "node:readline/promises";

export const PREGUNTAS = [
  { id: "nivel", texto: "¿Cómo quieres que te hable el agente?", opciones: {
    tecnico: "Técnico: domino el código y las herramientas", sencillo: "Sencillo: con analogías y sin jerga" } },
  { id: "tipo", texto: "¿Qué tipo de proyecto es?", opciones: {
    microservicios: "Microservicios", "orquestador-procesos": "Orquestación de procesos (Camunda)", "ui-vaadin": "Aplicación con UI Vaadin",
    "monolito-modular": "Monolito modular", libreria: "Librería o herramienta", otro: "Otro" } },
  { id: "objetivo", texto: "En una frase, ¿qué debe conseguir este proyecto?", libre: true },
  { id: "alcance", texto: "¿Cuánto desarrollo esperas ahora?", opciones: {
    pequeno: "Pequeño: cambios puntuales (perfil minimal)", creciente: "Creciente: varias funcionalidades",
    complejo: "Complejo: decisiones de diseño, procesos, varios módulos" } },
  { id: "integracion", texto: "¿Cómo se integran los cambios?", opciones: {
    ramas: "Ramas y PR (recomendado: activa la puerta de riesgo y protege las ramas base)", main: "Directamente en la rama principal" } },
  { id: "convencion", texto: "¿Qué convención siguen los mensajes de commit?", opciones: {
    conventional: "Conventional Commits: fix(pagos): corregir …", "conventional-gitmoji": "Conventional + gitmoji: 🐛 fix(pagos): corregir …" } },
  { id: "formatoRama", texto: "¿Qué formato tienen las ramas?", opciones: {
    "{issue}-{tipo}-{slug}": "57-fix-reset-cliente", "{tipo}/{issue}-{slug}": "fix/57-reset-cliente", "{tipo}/{slug}": "fix/reset-cliente (sin número de tarea)" } },
  { id: "gestor", texto: "¿De qué gestor salen las tareas?", opciones: {
    ninguno: "Ninguno", github: "GitHub Issues (CLI gh)", jira: "Jira (CLI acli)", gitlab: "GitLab Issues (CLI glab)" } },
  { id: "proyecto", texto: "Clave del proyecto en Jira (p. ej. RES)", libre: true, si: (r) => r.gestor === "jira" },
  { id: "acceso", texto: "¿Cómo se conecta el agente al gestor?", si: (r) => r.gestor && r.gestor !== "ninguno", opciones: {
    cli: "CLI (recomendado: menos tokens)", mcp: "MCP oficial del gestor (lo configuras tú con claude mcp add)" } },
];

export const aplica = (p, r) => !p.si || p.si(r);

export function validar(respuestas) {
  const faltan = [];
  const errores = [];
  for (const p of PREGUNTAS.filter((q) => aplica(q, respuestas))) {
    const v = respuestas[p.id];
    if (v === undefined || v === "") faltan.push(p);
    else if (p.opciones && !(v in p.opciones)) errores.push(`${p.id}: «${v}» no es válido (${Object.keys(p.opciones).join(" | ")})`);
  }
  return { faltan, errores };
}

/** Pregunta por terminal lo que falte. */
export async function preguntar(respuestas) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (const p of PREGUNTAS) {
      if (respuestas[p.id] || !aplica(p, respuestas)) continue;
      if (p.libre) {
        let r = "";
        while (!r.trim()) r = await rl.question(`\n${p.texto}\n> `);
        respuestas[p.id] = r.trim();
        continue;
      }
      const claves = Object.keys(p.opciones);
      console.log(`\n${p.texto}`);
      claves.forEach((k, i) => console.log(`  ${i + 1}) ${p.opciones[k]}`));
      let elegido;
      while (!elegido) {
        const r = (await rl.question("> ")).trim();
        elegido = claves[Number(r) - 1] || (claves.includes(r) ? r : undefined);
      }
      respuestas[p.id] = elegido;
    }
  } finally {
    rl.close();
  }
  return respuestas;
}
