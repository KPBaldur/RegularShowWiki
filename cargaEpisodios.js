async function cargarEpisodios() {
    try {
        const respuesta = await fetch("hhttps://apiregularshow.onrender.com/capitulos"); // URL de la API en producción
        const episodios = await respuesta.json();

        // Selecciona aleatoriamente 5 episodios
        const episodiosAleatorios = episodios.sort(() => 0.5 - Math.random()).slice(0, 5);

        const contenedor = document.getElementById("episodios-container");
        episodiosAleatorios.forEach(ep => {
            const card = document.createElement("div");
            card.classList.add("card");

            card.innerHTML = `
                <h3>${ep.titulo}</h3>
                <p><strong>Temporada:</strong> ${ep.temporada}</p>
                <p><strong>Estreno:</strong> ${ep.fecha_estreno || "Desconocido"}</p>
                <p><strong>Puntuación IMDb:</strong> ${ep.imdb_score ?? "N/A"}</p>
            `;

            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar episodios:", error);
    }
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", cargarEpisodios);
