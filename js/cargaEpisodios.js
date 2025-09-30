async function fetchTodosLosCapitulos(baseUrl) {
  const PAGE_SIZE = 100;
  let skip = 0;
  const todos = [];
  while (true) {
    const url = `${baseUrl}?skip=${skip}&limit=${PAGE_SIZE}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;
    todos.push(...page);
    if (page.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
    if (skip > 1000) break;
  }
  return todos;
}

function sampleAleatorio(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function tarjetaEpisodio(ep) {
  const img = ep.imagen_url || "img/placeholder-episodio.jpg";
  const fecha = ep.fecha_estreno || "Desconocido";
  const score = (ep.imdb_score ?? "N/A");
  const nroEpisodio = (ep.numero ?? ep.capitulo ?? "");
  const nroFmt = String(nroEpisodio).padStart(2, "0");

  // Manejar títulos en español e inglés
  const titulo = ep.titulo_es || ep.titulo_eng || ep.titulo || "Sin título";

  const temporadaFmt = String(ep.temporada ?? "").padStart(2, "0");
  return `
    <article class="episode-card">
      <div class="episode-card__media">
        <img class="episode-card__img" src="${img}" alt="Capítulo ${titulo}">
      </div>
      <div class="episode-card__body">
        <div class="episode-card__title"><b>Nombre Capítulo:</b> ${titulo}</div>
        <ul class="episode-card__meta">
          <li><b>Temporada:</b> ${temporadaFmt}</li>
          <li><b>Capitulo:</b> ${nroFmt}</li>
          <li><b>Estreno:</b> ${fecha}</li>
          <li><b>Puntuación IMDb:</b> ${score}</li>
        </ul>
      </div>
    </article>
  `;
}

async function cargarEpisodios() {
  const contenedor = document.getElementById("episodios-container");
  if (!contenedor) return;
  contenedor.innerHTML = '<div class="skeleton">Cargando episodios…</div>';

  try {
    const BASE = "https://apiregularshow.onrender.com/capitulos";
    const episodios = await fetchTodosLosCapitulos(BASE);
    const muestra = sampleAleatorio(episodios, 6);
    contenedor.innerHTML = muestra.map(tarjetaEpisodio).join("");
  } catch (err) {
    console.error("Error al cargar episodios:", err);
    contenedor.innerHTML = '<p class="error">No se pudieron cargar los episodios. Intenta más tarde.</p>';
  }
}

document.addEventListener("DOMContentLoaded", cargarEpisodios);
