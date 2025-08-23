(function () {
  const API = "https://apiregularshow.onrender.com";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const norm = (s="") => s.toString().normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();

  const imgFallback = "../img/placeholder-episodio.jpg";

  function cardEpisodio(ep) {
    const img = ep.imagen_url || imgFallback;
    const fecha = ep.fecha_estreno || "Desconocido";
    const score = (ep.imdb_score ?? "N/A");
    return `
      <article class="episode-card">
        <div class="episode-card__media">
          <img class="episode-card__img" src="${img}" alt="Capítulo ${ep.titulo}">
        </div>
        <div class="episode-card__body">
          <div class="episode-card__title">
            <b>${ep.titulo}</b>
          </div>
          <ul class="episode-card__meta">
            <li><b>ID:</b> ${ep.id}</li>
            <li><b>Temporada:</b> ${String(ep.temporada).padStart(2,"0")}</li>
            <li><b>Número:</b> ${String(ep.numero).padStart(2,"0")}</li>
            <li><b>Estreno:</b> ${fecha}</li>
            <li><b>IMDb:</b> ${score}</li>
          </ul>
        </div>
      </article>
    `;
  }

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

  // Aleatorios (20)
  async function cargarAleatorios() {
    const cont = $("#aleatorios-caps");
    if (!cont) return;
    cont.innerHTML = '<div class="skeleton">Cargando episodios…</div>';
    try {
      const todos = await getTodosLosCapitulos();
      // fisher-yates
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

  // Buscador: título / id (CAPxxx) / temporada / numero
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
    const cont = $("#resultados-caps");
    if (!input || !cont) return;

    const { text, temporada, numero, id } = parseQuery(input.value);
    cont.innerHTML = '<div class="skeleton">Buscando…</div>';

    try {
      const todos = await getTodosLosCapitulos();
      let res = todos;

      if (id) res = res.filter(ep => (ep.id || "").toUpperCase() === id);
      if (temporada != null) res = res.filter(ep => +ep.temporada === +temporada);
      if (numero != null) res = res.filter(ep => +ep.numero === +numero);
      if (text) {
        const t = norm(text);
        res = res.filter(ep => norm(ep.titulo || "").includes(t));
      }

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
    const cont = $("#resultados-caps");
    if (input) input.value = "";
    if (cont) cont.innerHTML = "";
    input?.focus();
  }

  // Acordeón de temporadas
  async function cargarAcordeonTemporadas() {
  const wrap = $("#lista-temporadas");
  if (!wrap) return;
  wrap.innerHTML = '<div class="skeleton">Cargando temporadas…</div>';

  try {
    const rt = await fetch(`${API}/temporadas`);
    if (!rt.ok) throw new Error(rt.status);
    const temps = await rt.json();

    const caps = await getTodosLosCapitulos();
    const byId = new Map(caps.map(c => [c.id, c]));

    const getNumeroTemp = (t, idx) => {
      if (t.numero != null) return Number(t.numero);
      const m = String(t.id || "").match(/\d+/);
      if (m) return Number(m[0]);
      return idx + 1;
    };

    const html = temps
      // ordénalas por numero robusto
      .sort((a, b) => getNumeroTemp(a, 0) - getNumeroTemp(b, 0))
      .map((t, i) => {
        const numTemp = getNumeroTemp(t, i);

        const capsDeTemp = (t.capitulos || [])
          .map(id => byId.get(id))
          .filter(Boolean)
          .sort((a, b) => a.numero - b.numero)
          .map(cardEpisodio)
          .join("");

        const imdbMedio = (t.promedio_imdb ?? "N/A");
        const total = (t.numero_capitulos ?? (t.capitulos?.length ?? "0"));

        return `
          <details class="acc">
            <summary>
              <span>Temporada ${String(numTemp).padStart(2, "0")}</span>
              <small>(${total} eps · IMDb medio: ${imdbMedio})</small>
            </summary>
            <div class="acc__panel grid-episodios">
              ${capsDeTemp || '<p class="hero-note">Sin capítulos enlazados.</p>'}
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

  document.addEventListener("DOMContentLoaded", () => {
    $("#form-buscar-caps")?.addEventListener("submit", onBuscar);
    $("#btn-limpiar-caps")?.addEventListener("click", onLimpiar);
    $("#btn-aleatorios-caps")?.addEventListener("click", cargarAleatorios);
    cargarAleatorios();
    cargarAcordeonTemporadas();
  });
})();
