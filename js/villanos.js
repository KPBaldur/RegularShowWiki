// js/villanos.js
(function () {
  const API = "https://apiregularshow.onrender.com";

  const $ = (sel) => document.querySelector(sel);
  const norm = (s="") => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const safe = (v, fb="—") => (v ?? fb);

  // Tarjeta visual de villano (imagen, nombre, estado, capítulo aparición)
  function cardVillano(p) {
    const img  = p.imagen_url || "../img/placeholder.png";
    const nom  = safe(p.nombre, "Sin nombre");
    const est  = safe(p.estado, "Desconocido");
    const cap  = safe(p.capitulo_aparicion, "—");

    return `
      <article class="card">
        <div class="card__media">
          <img class="card__img" src="${img}" alt="Villano ${nom}">
        </div>
        <div class="card__body">
          <h3 class="card__title">${nom}</h3>
          <div class="card__meta">
            <div><b>Estado:</b> ${est}</div>
            <div><b>Capítulo de aparición:</b> ${cap}</div>
          </div>
        </div>
      </article>
    `;
  }

  // Paginar de forma segura (tu API suele aceptar hasta 100)
  async function fetchTodosPersonajes() {
    const PAGE = 100;
    let skip = 0;
    const todos = [];
    while (true) {
      const url = `${API}/personajes?skip=${skip}&limit=${PAGE}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      const page = await res.json();
      if (!Array.isArray(page) || page.length === 0) break;
      todos.push(...page);
      if (page.length < PAGE) break;
      skip += PAGE;
      if (skip > 2000) break; // tope de seguridad
    }
    return todos;
  }

  function esAntagonista(p) {
    const t = norm(String(p.tipo_personaje || ""));
    // tolerante a formas como "antagonista", "antagónico", "antagonistas", etc.
    return t.includes("antagon");
  }

  async function cargarVillanos() {
    const cont = $("#lista-villanos");
    if (!cont) return;
    cont.innerHTML = `<div class="skeleton">Cargando antagonistas…</div>`;
    try {
      const personajes = await fetchTodosPersonajes();
      const villanos = personajes.filter(esAntagonista)
                                 .sort((a, b) => norm(a.nombre).localeCompare(norm(b.nombre)));
      if (!villanos.length) {
        cont.innerHTML = `<p class="hero-note">No se encontraron antagonistas en la API.</p>`;
        return;
      }
      cont.innerHTML = villanos.map(cardVillano).join("");
    } catch (err) {
      console.error(err);
      cont.innerHTML = `<p class="error">No se pudo cargar el listado de antagonistas. Intenta más tarde.</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", cargarVillanos);
})();
