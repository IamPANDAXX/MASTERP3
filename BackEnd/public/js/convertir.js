const input = document.getElementById('urlInput');
const agregarBtn = document.getElementById('agregarBtn');
const convertirBtn = document.getElementById('convertirBtn');
const descargaList = document.getElementById('descargaList');

// Limpiar la URL de YouTube
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

// Agregar URL a la lista
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

  const urlLimpia = limpiarYoutubeUrl(url) || url;

  const li = document.createElement('li');
  li.textContent = urlLimpia;
  descargaList.appendChild(li);
  input.value = '';
});

// Convertir video a MP3
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

  const li = document.createElement('li');
  li.textContent = `Procesando: ${url}`;
  descargaList.appendChild(li);

  Swal.fire({
    icon: 'info',
    title: 'Procesando...',
    text: 'Convirtiendo tu video en audio MP3',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const resp = await fetch("https://masterp3.onrender.com/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const data = await resp.json();
    if (!data.success) throw new Error(data.error || "Error desconocido");

    const titulo = data.title || "audio";
    const baseUrl = window.location.origin;
    const link = document.createElement("a");
    link.href = baseUrl + data.file;
    link.download = `${titulo}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Actualiza la lista de descargas
    li.textContent = `Descargado: ${titulo}`;

    Swal.fire({
      icon: 'success',
      title: 'Listo',
      text: `Se descargó: ${titulo}`,
      confirmButtonText: 'Ok'
    });

    input.value = '';
  } catch (err) {
    console.error(err);
    li.textContent = `Error: ${url}`;
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message || 'Hubo un problema al convertir el video.',
      confirmButtonText: 'Ok'
    });
  }
});
