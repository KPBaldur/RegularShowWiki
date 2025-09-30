(function () {
  const API = "https://apiregularshow.onrender.com";

  const el = (sel) => document.querySelector(sel);
  const safe = (v, fb = "—") => (v ?? fb);
  const pad2 = (n) => String(n ?? "").padStart(2, "0");

  async function fetchTop10Direct() {
    try {
      const r = await fetch(`${API}/capitulos/top-imdb?limit=10`);
      if (!r.ok) return null;
      const data = await r.json();
      return Array.isArray(data) ? data.slice(0, 10) : null;
    } catch {
      return null;
    }
  }

  async function fetchAllCapitulos() {
    let limit = 100;
    const limitsFallback = [100, 50, 25, 10];
    let skip = 0;
    const todos = [];

    for (const L of limitsFallback) {
      limit = L;
      skip = 0;
      todos.length = 0;

      while (true) {
        const url = `${API}/capitulos?skip=${skip}&limit=${limit}`;
        const r = await fetch(url);
        if (!r.ok) {
          if (r.status === 422) break;
          throw new Error(`HTTP ${r.status} en ${url}`);
        }
        const page = await r.json();
        if (!Array.isArray(page) || page.length === 0) return todos;
        todos.push(...page);
        if (page.length < limit) return todos;
        skip += limit;
        if (skip > 5000) return todos;
      }
    }
    return todos;
  }

  async function fetchTop10() {
    const direct = await fetchTop10Direct();
    if (direct && direct.length) return direct;

    const todos = await fetchAllCapitulos();
    return todos
      .filter(e => typeof e.imdb_score === "number")
      .sort((a, b) => b.imdb_score - a.imdb_score)
      .slice(0, 10);
  }

  function htmlItem(ep, idx) {
    const rank = 10 - idx;
    const titulo = safe(ep.titulo_es || ep.titulo_eng || ep.titulo, "Sin título");
    const score = ep.imdb_score != null ? ep.imdb_score : "N/A";
    const temp = pad2(ep.temporada);
    const num  = pad2(ep.capitulo ?? ep.numero);
    const img  = ep.imagen_url || "../img/placeholder-episodio.jpg";
    const sinopsis = safe(ep.sinopsis, "Sin descripción disponible.");

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
      if (!top || !top.length) {
        cont.innerHTML = `<p class="error">No se pudo obtener el Top 10.</p>`;
        return;
      }
      cont.innerHTML = top.map(htmlItem).join("");
    } catch (e) {
      console.error(e);
      cont.innerHTML = `<p class="error">No se pudo cargar el Top 10. Intenta más tarde.</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
