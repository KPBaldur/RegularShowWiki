function tarjetaPersonaje(p) {
  const img = p.imagen_url || "img/placeholder.png";
  const raza = p.raza || "Desconocida";
  const profesion = p.profesion || "Desconocida";
  const estado = p.estado || "Desconocido";
  const aparicion = p.capitulo_aparicion || "—";

  return `
    <div class="card">
      <div class="card__media">
        <img class="card__img" src="${img}" alt="${p.nombre}">
      </div>
      <div class="card__body">
        <h3 class="card__title">${p.nombre}</h3>
        <div class="card__meta">
          <div><b>Raza:</b> ${raza}</div>
          <div><b>Profesión:</b> ${profesion}</div>
          <div><b>Estado:</b> ${estado}</div>
          <div><b>Aparición:</b> ${aparicion}</div>
        </div>
      </div>
    </div>
  `;
}

// ---------- PRINCIPALES ----------
async function cargarPersonajesPrincipales() {
  try {
    const resp = await fetch("https://apiregularshow.onrender.com/personajes/principales");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const personajes = await resp.json();

    const cont = document.getElementById("personajes-principales");
    cont.className = "contenedor-personajes"; // usa el alias de grid
    cont.innerHTML = personajes.map(tarjetaPersonaje).join("");
  } catch (err) {
    console.error("Error al cargar personajes principales:", err);
  }
}

// ---------- ALEATORIOS ----------
async function cargarPersonajesAleatorios() {
  try {
    const resp = await fetch("https://apiregularshow.onrender.com/personajes/aleatorio/6");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const personajes = await resp.json();

    const cont = document.getElementById("personajes-dinamicos");
    cont.className = "contenedor-personajes"; // usa el alias de grid
    cont.innerHTML = personajes.map(tarjetaPersonaje).join("");
  } catch (err) {
    console.error("Error al cargar personajes aleatorios:", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  cargarPersonajesPrincipales();
  cargarPersonajesAleatorios();
});
