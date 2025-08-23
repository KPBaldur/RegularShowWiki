(function () {
  const API = "https://apiregularshow.onrender.com";

  function normaliza(s = "") {
    return (s || "").toString().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  }
  function el(sel) { return document.querySelector(sel); }
  function htmlCardPersonaje(p) {
    const img = p.imagen_url || "../img/placeholder.png";
    const raza = p.raza || "—";
    const profesion = p.profesion || "—";
    return `
      <article class="card">
        <div class="card__media">
          <img class="card__img" src="${img}" alt="Imagen de ${p.nombre}">
        </div>
        <div class="card__body">
          <h3 class="card__title">${p.nombre}</h3>
          <div class="card__meta">
            <div><b>Raza:</b> ${raza}</div>
            <div><b>Profesión:</b> ${profesion}</div>
            <div><b>ID:</b> ${p.id}</div>
          </div>
        </div>
      </article>
    `;
  }
  function pintarLista(divDestino, lista) {
    if (!divDestino) return;
    if (!Array.isArray(lista) || lista.length === 0) {
      divDestino.innerHTML = '<p class="hero-note">Sin resultados.</p>';
      return;
    }
    divDestino.innerHTML = lista.map(htmlCardPersonaje).join("");
  }

  async function fetchTodosPersonajes() {
    const PAGE = 100;
    let skip = 0;
    const todos = [];
    while (true) {
      const url = `${API}/personajes?skip=${skip}&limit=${PAGE}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      todos.push(...data);
      if (data.length < PAGE) break;
      skip += PAGE;
      if (skip > 1000) break; // tope de seguridad
    }
    return todos;
  }

  // ---- ALEATORIOS (20) ----
  async function cargarAleatorios20() {
    const cont = el("#aleatorios-personajes");
    if (!cont) return;
    cont.innerHTML = '<div class="skeleton">Cargando aleatorios…</div>';
    try {
      const r = await fetch(`${API}/personajes/aleatorio/20`);
      if (r.ok) {
        const data = await r.json();
        pintarLista(cont, data);
        return;
      }
      const todos = await fetchTodosPersonajes();
      const barajados = [...todos].sort(() => Math.random() - 0.5).slice(0, 20);
      pintarLista(cont, barajados);
    } catch (e) {
      console.error(e);
      cont.innerHTML = '<p class="error">No se pudieron cargar los aleatorios.</p>';
    }
  }

  // ---- BUSCADOR ----
  let cachePersonajes = null;
  async function buscarPorNombre(q) {
    const cont = el("#resultados-personajes");
    if (!cont) return;
    const qn = normaliza(q);
    if (!cachePersonajes) {
      cont.innerHTML = '<div class="skeleton">Cargando personajes…</div>';
      try {
        cachePersonajes = await fetchTodosPersonajes();
      } catch (e) {
        console.error(e);
        cont.innerHTML = '<p class="error">No se pudieron cargar los personajes.</p>';
        return;
      }
    }
    const filtrados = cachePersonajes.filter(p => {
      const n1 = normaliza(p.nombre);
      const n2 = normaliza(p.nombre_ingles || "");
      return n1.includes(qn) || n2.includes(qn);
    });
    pintarLista(cont, filtrados);
  }

  document.addEventListener("DOMContentLoaded", () => {
    cargarAleatorios20();

    const form = el("#form-buscar");
    const input = el("#q-personaje");
    const btnLimpiar = el("#btn-limpiar");
    const contResultados = el("#resultados-personajes");

    if (form && input) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const q = input.value.trim();
        if (!q) {
          contResultados.innerHTML = '<p class="hero-note">Escribe un nombre para buscar.</p>';
          return;
        }
        buscarPorNombre(q);
      });
    }

    if (btnLimpiar && input && contResultados) {
      btnLimpiar.addEventListener("click", () => {
        input.value = "";
        contResultados.innerHTML = "";
        input.focus();
      });
    }

    const btnAleatorios = el("#btn-aleatorios");
    if (btnAleatorios) {
      btnAleatorios.addEventListener("click", cargarAleatorios20);
    }
  });
})();
