(function () {
  const API = "https://apiregularshow.onrender.com";

  // Utilidades
  const el = (sel) => document.querySelector(sel);
  const safe = (v, fallback = "—") => (v ?? fallback);
  const pad2 = (n) => String(n ?? "").padStart(2, "0");

  // Intenta endpoint dedicado; si no existe, ordena todos por imdb_score desc
  async function fetchTop10() {
    // 1) Endpoint dedicado (si lo tienes):
    try {
      const r = await fetch(`${API}/capitulos/top-imdb?limit=10`);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length) return data.slice(0, 10);
      }
    } catch {}

    // 2) Fallback: traer todo, ordenar por score desc y tomar 10
    const PAGE = 200;
    let skip = 0;
    const todos = [];
    while (true) {
      const url = `${API}/capitulos?skip=${skip}&limit=${PAGE}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
      const page = await r.json();
      if (!Array.isArray(page) || page.length === 0) break;
      todos.push(...page);
      if (page.length < PAGE) break;
      skip += PAGE;
      if (skip > 2000) break; // tope de seguridad
    }
    return todos
      .filter(e => typeof e.imdb_score === "number")
      .sort((a, b) => b.imdb_score - a.imdb_score)
      .slice(0, 10);
  }

  function htmlItem(ep, idx) {
    const rank = 10 - idx; // 10 → 1 (como tu mock)
    const titulo = safe(ep.titulo, "Sin título");
    const score = ep.imdb_score != null ? ep.imdb_score : "N/A";
    const temp = pad2(ep.temporada);
    const num  = pad2(ep.capitulo ?? ep.numero);
    const img  = ep.imagen_url || "../img/placeholder-episodio.jpg";
    const sinopsis = safe(ep.sinopsis, "Sin descripción disponible.");
    // Si algún día agregas video_url / youtube_id, lo renderizamos:
    const video = ep.video_url || ep.youtube_id
      ? `<div class="topep__video">
           <iframe src="${ep.video_url || `https://www.youtube.com/embed/${ep.youtube_id}`}"
                   title="YouTube video player" frameborder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowfullscreen loading="lazy"></iframe>
         </div>`
      : "";

    return `
      <article class="topep">
        <h3 class="topep__title">
          N° ${rank} – ${titulo} – <span class="topep__score">${score}</span>
        </h3>
        <hr>
        <div class="topep__media">
          <img src="${img}" alt="Capítulo ${titulo}">
        </div>
        <ul class="topep__meta">
          <li><b>Temporada:</b> ${temp}</li>
          <li><b>Capítulo:</b> ${num}</li>
          <li><b>IMDb:</b> ${score}</li>
        </ul>
        ${video}
        <p class="topep__desc">${sinopsis}</p>
        <br>
      </article>
    `;
  }

  async function init() {
    const cont = el("#lista-top");
    if (!cont) return;
    cont.innerHTML = `<div class="skeleton">Cargando Top 10…</div>`;
    try {
      const top = await fetchTop10();
      cont.innerHTML = top.map(htmlItem).join("");
    } catch (e) {
      console.error(e);
      cont.innerHTML = `<p class="error">No se pudo cargar el Top 10. Intenta más tarde.</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
