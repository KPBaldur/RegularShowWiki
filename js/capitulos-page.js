(function () {
  const API = "https://apiregularshow.onrender.com";

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const norm = (s = "") =>
    s.toString().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  const IMG_FALLBACK = "../img/placeholder-episodio.jpg";

  /* --------- helpers UI --------- */
  function cardEpisodio(ep) {
    const img   = ep.imagen_url || IMG_FALLBACK;
    const fecha = ep.fecha_estreno || "Desconocido";
    const score = ep.imdb_score ?? "N/A";
    const temp  = String(ep.temporada ?? "").padStart(2, "0");
    const num   = String(ep.numero    ?? "").padStart(2, "0");

    return `
      <article class="episode-card">
        <div class="episode-card__media">
          <img class="episode-card__img" src="${img}" alt="Capítulo ${ep.titulo}">
        </div>
        <div class="episode-card__body">
          <div class="episode-card__title"><b>${ep.titulo}</b></div>
          <ul class="episode-card__meta">
            <li><b>ID:</b> ${ep.id}</li>
            <li><b>Temporada:</b> ${temp}</li>
            <li><b>Número:</b> ${num}</li>
            <li><b>Estreno:</b> ${fecha}</li>
            <li><b>IMDb:</b> ${score}</li>
          </ul>
        </div>
      </article>
    `;
  }

  /* --------- fetchers --------- */
  async function fetchPaginadoTodos(baseUrl) {
    const PAGE = 100;
    let skip = 0;
    const out = [];

    while (true) {
      const url = `${baseUrl}?skip=${skip}&limit=${PAGE}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
      const data = await r.json();
      if (!Array.isArray(data) || data.length === 0) break;

      // normaliza tipos numéricos
      for (const ep of data) {
        if (ep.numero != null) ep.numero = Number(ep.numero);
        if (ep.temporada != null) ep.temporada = Number(ep.temporada);
        if (ep.imdb_score != null) ep.imdb_score = Number(ep.imdb_score);
      }

      out.push(...data);
      if (data.length < PAGE) break;
      skip += PAGE;
      if (skip > 2000) break;
    }
    return out;
  }

  let cacheCaps = null;
  async function getTodosLosCapitulos() {
    if (cacheCaps) return cacheCaps;
    cacheCaps = await fetchPaginadoTodos(`${API}/capitulos`);
    return cacheCaps;
  }

  /* --------- aleatorios (10) --------- */
  async function cargarAleatorios() {
    const cont = $("#aleatorios-caps");
    if (!cont) return;
    cont.innerHTML = '<div class="skeleton">Cargando episodios…</div>';

    try {
      const todos = await getTodosLosCapitulos();
      const arr = [...todos];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      cont.innerHTML = arr.slice(0, 10).map(cardEpisodio).join("");
    } catch (e) {
      console.error(e);
      cont.innerHTML = '<p class="error">No se pudieron cargar episodios aleatorios.</p>';
    }
  }

  /* --------- buscador --------- */
  function parseQuery(raw) {
    const q = norm(raw.trim());
    const out = { text: "", temporada: null, numero: null, id: null };

    const idm = q.match(/\bcap\d{3}\b/);
    if (idm) out.id = idm[0].toUpperCase();

    const tm = q.match(/temporada\s+(\d{1,2})/);
    if (tm) out.temporada = parseInt(tm[1], 10);

    const nm = q.match(/(numero|número)\s+(\d{1,3})/);
    if (nm) out.numero = parseInt(nm[2], 10);

    out.text = q
      .replace(/\bcap\d{3}\b/, "")
      .replace(/temporada\s+\d{1,2}/, "")
      .replace(/(numero|número)\s+\d{1,3}/, "")
      .trim();

    return out;
  }

  async function onBuscar(ev) {
    ev.preventDefault();
    const input = $("#q-capitulo");
    const cont  = $("#resultados-caps");
    if (!input || !cont) return;

    const { text, temporada, numero, id } = parseQuery(input.value);
    cont.innerHTML = '<div class="skeleton">Buscando…</div>';

    try {
      const todos = await getTodosLosCapitulos();
      let res = todos;

      if (id)         res = res.filter(ep => (ep.id || "").toUpperCase() === id);
      if (temporada)  res = res.filter(ep => Number(ep.temporada) === Number(temporada));
      if (numero)     res = res.filter(ep => Number(ep.numero) === Number(numero));
      if (text) {
        const t = norm(text);
        res = res.filter(ep => norm(ep.titulo || "").includes(t));
      }

      res.sort((a,b) => (a.temporada - b.temporada) || (a.numero - b.numero));

      cont.innerHTML = res.length
        ? res.map(cardEpisodio).join("")
        : '<p class="hero-note">Sin resultados.</p>';
    } catch (e) {
      console.error(e);
      cont.innerHTML = '<p class="error">No se pudo realizar la búsqueda.</p>';
    }
  }

  function onLimpiar() {
    const input = $("#q-capitulo");
    const cont  = $("#resultados-caps");
    if (input) input.value = "";
    if (cont)  cont.innerHTML = "";
    input?.focus();
  }

  /* --------- temporadas (acordeón) --------- */

  // obtiene el número de temporada de forma robusta
  function numTemporada(t, idx) {
    if (t.numero != null) return Number(t.numero);
    const m = String(t.id || "").match(/\d+/);
    if (m) return Number(m[0]);
    return idx + 1;
  }

  // calcula promedio IMDb con 1 decimal (ignorando null/NaN)
  function promedioImdb(caps) {
    const vals = caps
      .map(c => Number(c.imdb_score))
      .filter(v => Number.isFinite(v));
    if (!vals.length) return "N/A";
    const avg = vals.reduce((a,b) => a + b, 0) / vals.length;
    return avg.toFixed(1);
  }

  async function cargarAcordeonTemporadas() {
    const wrap = $("#lista-temporadas");
    if (!wrap) return;
    wrap.innerHTML = '<div class="skeleton">Cargando temporadas…</div>';

    try {
      // 1) meta de temporadas
      const rt = await fetch(`${API}/temporadas`);
      if (!rt.ok) throw new Error(rt.status);
      const temporadas = await rt.json();

      // 2) universo de capítulos
      const caps = await getTodosLosCapitulos();
      const byId = new Map(caps.map(c => [c.id, c]));

      // 3) pintar acordeón
      const html = temporadas
        .sort((a, b) => numTemporada(a, 0) - numTemporada(b, 0))
        .map((t, idx) => {
          const nTemp = numTemporada(t, idx);

          // Preferimos la lista explícita; si no existe o es mala, derivamos por 'ep.temporada'
          let lista = Array.isArray(t.capitulos) && t.capitulos.length
            ? t.capitulos.map(id => byId.get(id)).filter(Boolean)
            : caps.filter(c => Number(c.temporada) === Number(nTemp));

          // Orden estable por número
          lista.sort((a, b) => Number(a.numero) - Number(b.numero));

          const total = t.numero_capitulos ?? lista.length;
          const imdbMedio = (t.promedio_imdb != null && t.promedio_imdb !== "")
            ? t.promedio_imdb
            : promedioImdb(lista);

          const cards = lista.length
            ? lista.map(cardEpisodio).join("")
            : '<p class="hero-note">Sin capítulos enlazados.</p>';

          return `
            <details class="acc">
              <summary>
                <span>Temporada ${String(nTemp).padStart(2, "0")}</span>
                <small>(${total} eps · IMDb medio: ${imdbMedio})</small>
              </summary>
              <div class="acc__panel grid-episodios">
                ${cards}
              </div>
            </details>
          `;
        })
        .join("");

      wrap.innerHTML = html;
    } catch (e) {
      console.error(e);
      wrap.innerHTML = '<p class="error">No se pudieron cargar las temporadas.</p>';
    }
  }

  /* --------- init --------- */
  document.addEventListener("DOMContentLoaded", () => {
    $("#form-buscar-caps")?.addEventListener("submit", onBuscar);
    $("#btn-limpiar-caps")?.addEventListener("click", onLimpiar);
    $("#btn-aleatorios-caps")?.addEventListener("click", cargarAleatorios);

    cargarAleatorios();
    cargarAcordeonTemporadas();
  });
})();