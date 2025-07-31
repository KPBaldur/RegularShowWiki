// Cargar personajes principales
async function cargarPersonajesPrincipales() {
    try {
        const response = await fetch("http://127.0.0.1:8000/personajes/principales");
        const personajes = await response.json();

        const contenedor = document.getElementById("personajes-principales");
        contenedor.className = "contenedor-personajes";

        personajes.forEach(p => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${p.imagen_url}" alt="Imagen de ${p.nombre}">
                <h2>${p.nombre}</h2>
                <p class="stats">
                    <span>Raza</span> <span>${p.raza}</span><br>
                    <span>Profesión</span> <span>${p.profesion}</span><br>
                </p>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar personajes principales:", error);
    }
}

// Cargar personajes aleatorios
async function cargarPersonajesAleatorios() {
    try {
        const response = await fetch("http://127.0.0.1:8000/personajes/aleatorio/6");
        const personajes = await response.json();

        const contenedor = document.getElementById("personajes-dinamicos");
        contenedor.className = "contenedor-personajes";

        personajes.forEach(p => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${p.imagen_url}" alt="Imagen de ${p.nombre}">
                <h2>${p.nombre}</h2>
                <p class="stats">
                    <span>Raza</span> <span>${p.raza}</span><br>
                    <span>Profesión</span> <span>${p.profesion}</span><br>
                </p>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar personajes aleatorios:", error);
    }
}

// Ejecutar ambos al cargar la página
window.addEventListener("DOMContentLoaded", () => {
    cargarPersonajesPrincipales();
    cargarPersonajesAleatorios();
});
