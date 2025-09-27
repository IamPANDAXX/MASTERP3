const input = document.getElementById('urlInput');
const agregarBtn = document.getElementById('agregarBtn');
const convertirBtn = document.getElementById('convertirBtn');
const descargaList = document.getElementById('descargaList');

//obtenemos el título del video desde YouTube oEmbed
// 
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

//agregar
agregarBtn.addEventListener('click', async () =>{
    const url = input.value.trim();

    if(!url){
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'No hay URL para agregar',
            confirmButtonText: 'Ok'
        });
        return;
    }

    //el await es un perate deja confirmo papito
    const titulo = await obtenerTituloYoutube(url);    const li = document.createElement('li');
    li.textContent = titulo ? titulo : url;
    descargaList.appendChild(li);
    input.value = '';
});

//convertir
convertirBtn.addEventListener('click', async () => {
  const url = input.value.trim();

  if (!url) {
    Swal.fire({
      icon: 'error',
      title: 'No hay URL',
      text: 'No hay URL para convertir.',
      confirmButtonText: 'Ok'
    });
    return;
  }

  const titulo = await obtenerTituloYoutube(url);

  Swal.fire({
    icon: 'info',
    title: 'Procesando...',
    text: 'Estamos convirtiendo tu video a MP3, espera un momento',
    allowOutsideClick: false,
    didOpen: () =>{
      Swal.showLoading();
    }
  });

  try {
    const response = await fetch ("https://mi-backend.onrender.com/api/convert", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error("Error al convertir");
    const blob = await response.blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${titulo || "video"}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Listo',
      text: `Se descargó: ${titulo || "video"}`,
      confirmButtonText: 'Ok'
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un problema al convertir.',
      confirmButtonText: 'Ok'
    });
  }
});
