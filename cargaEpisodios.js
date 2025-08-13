async function fetchTodosLosCapitulos(baseUrl) {
  // La API limita limit<=100; paginamos: skip=0,100,200...
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
    if (page.length < PAGE_SIZE) break; // última página
    skip += PAGE_SIZE;

    // hard stop de seguridad (si un día crece infinito)
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

async function cargarEpisodios() {
  const contenedor = document.getElementById("episodios-container");
  if (!contenedor) {
    console.error("No existe #episodios-container");
    return;
  }

  // Placeholder mientras carga
  contenedor.innerHTML = '<div class="skeleton">Cargando episodios…</div>';

  try {
    // ✅ URL correcta (sin doble 'h')
    const BASE = "https://apiregularshow.onrender.com/capitulos";

    // Traemos varias páginas para cubrir todas las temporadas
    const episodios = await fetchTodosLosCapitulos(BASE);

    // Si por alguna razón la API no soporta paginación, haz un fallback:
    if (!episodios.length) {
      const res = await fetch(`${BASE}?limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const solo100 = await res.json();
      episodios.push(...solo100);
    }

    // Muestra 5 al azar (sin sesgo por orden)
    const episodiosAleatorios = sampleAleatorio(episodios, 6);

    contenedor.innerHTML = "";
    episodiosAleatorios.forEach(ep => {
      const card = document.createElement("div");
      card.classList.add("card");

      // imagen opcional si tu JSON la trae (algunos capítulos la tienen)
      const imagen = ep.imagen_url ? `<img src="${ep.imagen_url}" alt="Capítulo ${ep.titulo}">` : "";

      card.innerHTML = `
        ${imagen}
        <h3>${ep.titulo}</h3>
        <p><strong>Temporada:</strong> ${ep.temporada}</p>
        <p><strong>Estreno:</strong> ${ep.fecha_estreno || "Desconocido"}</p>
        <p><strong>Puntuación IMDb:</strong> ${ep.imdb_score ?? "N/A"}</p>
      `;

      contenedor.appendChild(card);
    });

  } catch (error) {
    console.error("Error al cargar episodios:", error);
    contenedor.innerHTML = '<p class="error">No se pudieron cargar los episodios. Intenta más tarde.</p>';
  }
}

document.addEventListener("DOMContentLoaded", cargarEpisodios);
