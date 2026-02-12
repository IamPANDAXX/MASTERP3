//server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fetch from "node-fetch"; //usamos esto para obtener el título automáticamente
import "./alive.js";

const app = express();
app.use(cors());
app.use(express.json());

//ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//rutas (public dentro de backend, downloads fuera de el)
const publicPath = path.join(__dirname, "public");
const downloadsDir = path.join(__dirname, "../downloads");

//debug info
console.log("Ruta detectada para frontend:", publicPath);
console.log("Ruta detectada para descargas:", downloadsDir);

//crear carpeta de descargas si no existe
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

//servir archivos estáticos (frontend)
app.use(express.static(publicPath));
//servir MP3 descargados
app.use("/downloads", express.static(downloadsDir));

function normalizarYouTubeURL(url) {
  try {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
    return url;
  } catch {
    return url;
  }
}

//función para obtener el título usando noembed (sin cookies)
async function obtenerTitulo(url) {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return data.title || "audio_sin_nombre";
  } catch (error) {
    console.error("Error al obtener título:", error.message);
    return "audio_sin_nombre";
  }
}

//funcion para auxiliar la descarga (si ocupa cookies o no)
async function intentarDescarga(url, outputTemplate, usarCookies = false) {
  return new Promise((resolve, reject) => {

    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    let command;
    
    if (usarCookies) {
      const cookiesPath = path.join(__dirname, "cookies.txt");

      //verifica si existen cookies
      if (!fs.existsSync(cookiesPath)) {
        return reject(new Error("Cookies no disponibles"));
      }
      //con cookies
      command = `python -m yt_dlp --user-agent "${userAgent}" --cookies "${cookiesPath}" --no-playlist -f "bestaudio/best" -x --audio-format mp3 -o "${outputTemplate}" "${url}"`;
      console.log("Intento con cookies");
    } else {
      //sin cookies
      command = `python -m yt_dlp --no-playlist -f "bestaudio/best" -x --audio-format mp3 -o "${outputTemplate}" "${url}"`;
      console.log("Intento sin cookies");
    }

    const child = exec(command, async (errDown, stdout, stderr) => {
      try {
        //espera a que termine de escribir el archivo
        await new Promise(r => setTimeout(r, 500));
        
        //formatos a cambiar o convertir
        const files = fs.readdirSync(downloadsDir);
        const mp3Files = files.filter(f => f.endsWith('.mp3'));
        
        if (mp3Files.length === 0) {
          return reject(new Error("No se creó archivo MP3"));
        }
        
        //obtiene el archivo más reciente
        const newestFile = mp3Files.sort((a, b) => {
          const statA = fs.statSync(path.join(downloadsDir, a));
          const statB = fs.statSync(path.join(downloadsDir, b));
          return statB.mtime - statA.mtime;
        })[0];

        resolve(newestFile);
      } catch (err) {
        reject(err);
      }
    });

    //log limpio (solo lo importante)
    child.stdout?.on("data", (d) => {
      const msg = d.toString().trim();
      if (msg.includes('[download] 100%')) {
        console.log("Descarga completada");
      } else if (msg.includes('[ExtractAudio]')) {
        console.log("Convirtiendo a MP3...");
      }
    });

    child.stderr?.on("data", (d) => {
      const msg = d.toString().trim();
      
      //filtrar warnings conocidos que no importan
      const ignorar = [
        'not a valid URL',
        'WARNING',
        'PO Token',
        'Skipping client'
      ];
      
      if (ignorar.some(txt => msg.includes(txt))) {
        return; //no imprime la basura del (ignorar)
      }
      
      //solo errores pasados de versa
      if (msg.includes('ERROR')) {
        console.error("!", msg);
      }
    });
  });
}

//Endpoint principal de conversión
app.post("/convert", async (req, res) => {
  let { url } = req.body;
  url = normalizarYouTubeURL(url);
  console.log("URL limpia:", url);

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "URL no válida" });
  }

  console.log("Procesando:", url);

  //const esYouTube = /youtube\.com|youtu\.be/.test(url);

  //funcion template
  const outputTemplate = path.join(downloadsDir, "%(title)s.%(ext)s");

  try {
    //intentar sin cookies primero
    const archivo = await intentarDescarga(url, outputTemplate, false);
    console.log(`Exito sin cookies: ${archivo}`);
    
    const title = await obtenerTitulo(url);
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim();
    
    return res.json({
      success: true,
      title: safeTitle,
      file: `/downloads/${encodeURIComponent(archivo)}`,
      method: 'sin-cookies'
    });
    
  } catch (error1) {
    console.log("Falló sin cookies, activando con cookies...");
    
    try {
      //intentar con cookies
      const archivo = await intentarDescarga(url, outputTemplate, true);
      console.log(`Éxito con cookies: ${archivo}`);
      
      const title = await obtenerTitulo(url);
      const safeTitle = title.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim();
      
      return res.json({
        success: true,
        title: safeTitle,
        file: `/downloads/${encodeURIComponent(archivo)}`,
        method: 'con-cookies'
      });
      
    } catch (error2) {
      console.error("sin cookies nopi, con cookies ahora...");
      return res.status(500).json({ 
        error: "No se pudo procesar el video. Puede tener restricciones de edad o región." 
      });
    }
  }
});

//ruta raíz (sirve el index)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

//arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁Sirviendo archivos desde: ${publicPath}`);
});