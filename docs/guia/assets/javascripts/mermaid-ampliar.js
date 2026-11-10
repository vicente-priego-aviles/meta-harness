// Ampliar los diagramas Mermaid con el mismo visor (GLightbox) que las imágenes de la guía.
// Material dibuja cada diagrama en un shadow DOM cerrado y descarta su texto, así que guardamos
// el texto antes de que lo dibuje y, al hacer clic, lo volvemos a dibujar dentro del visor.
(function () {
  let fuentes = [];
  let n = 0;

  function preparar() {
    fuentes = [...document.querySelectorAll("pre.mermaid")].map((e) => e.textContent);
    // Material sustituye cada bloque por un div.mermaid nuevo, en el mismo orden
    const marcar = () => {
      const nuevos = document.querySelectorAll("div.mermaid:not([data-mh])");
      if (!nuevos.length && fuentes.length) return setTimeout(marcar, 200);
      nuevos.forEach((el, i) => {
        el.dataset.mh = String(i);
        el.title = "Haz clic para ampliar";
        el.addEventListener("click", () => ampliar(fuentes[i]));
      });
    };
    if (fuentes.length) setTimeout(marcar, 200);
  }

  async function ampliar(fuente) {
    if (!fuente || typeof mermaid === "undefined" || typeof GLightbox === "undefined") return;
    const { svg } = await mermaid.render(`mh_ampliado_${n++}`, fuente);
    GLightbox({ elements: [{ content: `<div class="mh-mermaid-ampliado">${svg}</div>`, width: "95vw", height: "auto" }] }).open();
  }

  if (typeof document$ !== "undefined") document$.subscribe(preparar);
  else document.addEventListener("DOMContentLoaded", preparar);
})();
