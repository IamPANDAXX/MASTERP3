const input = document.getElementById('urlInput');
const agregarBtn = document.getElementById('agregarBtn');
const convertirBtn = document.getElementById('convertirBtn');
const descargaList = document.getElementById('descargaList');

//limpiar la URL
function limpiarYoutubeUrl(url) {
  try {
    const urlObj = new URL(url);
    let videoId = "";

    if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v");
    }

    if (videoId && videoId.length === 11) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    return null;
  } catch (err) {
    return null;
  }
}

//obtener título desde YouTube oEmbed
async function obtenerTituloYoutube(url) {
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const resp = await fetch(endpoint);
    if (!resp.ok) throw new Error("No se pudo obtener el título");
    const data = await resp.json();
    return data.title;
  } catch (err) {
    console.error('Error al obtener título:', err);
    return null;
 }
}

//agregar a lista
agregarBtn.addEventListener('click', async () => {
  const url = input.value.trim();
  if (!url) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'No hay URL para agregar',
      confirmButtonText: 'Ok'
    });
    return;
  }

  const titulo = await obtenerTituloYoutube(url);
  const li = document.createElement('li');
  li.textContent = titulo ? titulo : `Video sin título (${url})`;
  descargaList.appendChild(li);
  input.value = '';
});

//convertir usando nueva librería
convertirBtn.addEventListener('click', async () => {
  const url = input.value.trim();
  if (!url) {
    Swal.fire({
      icon: 'error',
      title: 'No hay URL',
      text: 'Ingresa una URL para convertir.',
      confirmButtonText: 'Ok'
    });
    return;
  }

  Swal.fire({
    icon: 'info',
    title: 'Procesando...',
    text: 'Convirtiendo tu video en audio MP3',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const API_BASE = window.location.origin.includes("localhost")
  ? "http://localhost:3000"
  : window.location.origin;

    const resp = await fetch(`${API_BASE}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const data = await resp.json();
    if (!data.success) throw new Error(data.error || "Error desconocido");

    const titulo = data.title || "audio";

    //crea enlace para descargar con nombre del video
    const baseUrl = window.location.origin; 
    const link = document.createElement("a");
    link.href = baseUrl + data.file; // ahora apunta correctamente
    link.download = `${titulo}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Listo',
      text: `Se descargó: ${titulo}`,
      confirmButtonText: 'Ok'
    });

    input.value = '';
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message || 'Hubo un problema al convertir el video.',
      confirmButtonText: 'Ok'
    });
  }
});