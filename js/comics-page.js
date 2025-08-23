(function () {
  const API = "https://apiregularshow.onrender.com";

  const $ = (sel) => document.querySelector(sel);
  const norm = (s = "") =>
    (s || "").toString().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  function htmlCardComic(c) {
    const img = c.imagen_url || "../img/placeholder.png";
    const titulo = c.titulo || "—";
    const tipo = c.tipo || "—";
    const issues = c.numero_issues != null ? c.numero_issues : "—";
    const autores = Array.isArray(c.autores) ? c.autores.join(", ") : (c.autores || "—");
    const ilustradores = Array.isArray(c.ilustradores) ? c.ilustradores.join(", ") : (c.ilustradores || "—");
    const publicacion = c.publicacion || "—";

    return `
      <article class="card">
        <div class="card__media">
          <img class="card__img" src="${img}" alt="Portada de ${titulo}">
        </div>
        <div class="card__body">
          <h3 class="card__title">${titulo}</h3>
          <div class="card__meta">
            <div><b>ID:</b> ${c.id || "—"}</div>
            <div><b>Tipo:</b> ${tipo}</div>
            <div><b>Nº de issues:</b> ${issues}</div>
            <div><b>Autores:</b> ${autores}</div>
            <div><b>Ilustradores:</b> ${ilustradores}</div>
            <div><b>Publicación:</b> ${publicacion}</div>
          </div>
        </div>
      </article>
    `;
  }

  function pintarLista($dest, lista) {
    if (!$dest) return;
    if (!Array.isArray(lista) || !lista.length) {
      $dest.innerHTML = '<p class="hero-note">Sin resultados.</p>';
      return;
    }
    $dest.innerHTML = lista.map(htmlCardComic).join("");
  }

  async function fetchTodosComics() {
    const PAGE = 100;
    let skip = 0;
    const todos = [];
    while (true) {
      const url = `${API}/comics?skip=${skip}&limit=${PAGE}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      todos.push(...data);
      if (data.length < PAGE) break;
      skip += PAGE;
      if (skip > 2000) break;
    }
    return todos;
  }

  async function cargarComicsAleatorios() {
    const cont = $("#aleatorios-comics");
    if (!cont) return;
    cont.innerHTML = '<div class="skeleton">Cargando cómics…</div>';

    try {
      const todos = await fetchTodosComics();
      const mezclados = [...todos].sort(() => Math.random() - 0.5).slice(0, 8);
      pintarLista(cont, mezclados);
    } catch (e) {
      console.error(e);
      cont.innerHTML = '<p class="error">No se pudieron cargar los cómics.</p>';
    }
  }

  let cache = null;
  async function buscarComics(q) {
    const cont = $("#resultados-comics");
    if (!cont) return;
    const qn = norm(q);

    if (!cache) {
      cont.innerHTML = '<div class="skeleton">Cargando catálogo…</div>';
      try {
        cache = await fetchTodosComics();
      } catch (e) {
        console.error(e);
        cont.innerHTML = '<p class="error">No se pudieron cargar los cómics.</p>';
        return;
      }
    }

    const filtrados = cache.filter(c => {
      const t = norm(c.titulo || "");
      const ty = norm(c.tipo || "");
      return t.includes(qn) || ty.includes(qn);
    });

    pintarLista(cont, filtrados);
  }

  document.addEventListener("DOMContentLoaded", () => {
    cargarComicsAleatorios();
    const form = $("#form-buscar-comics");
    const input = $("#q-comic");
    const btnClr = $("#btn-limpiar-comics");
    const contRes = $("#resultados-comics");

    if (form && input) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const q = input.value.trim();
        if (!q) {
          contRes.innerHTML = '<p class="hero-note">Escribe un texto para buscar.</p>';
          return;
        }
        buscarComics(q);
      });
    }

    if (btnClr && input && contRes) {
      btnClr.addEventListener("click", () => {
        input.value = "";
        contRes.innerHTML = "";
        input.focus();
      });
    }

    const btnRand = $("#btn-aleatorios-comics");
    if (btnRand) btnRand.addEventListener("click", cargarComicsAleatorios);
  });
})();
