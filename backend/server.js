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
    let command;

    const inicio = Date.now(); //tiempo de inicio

    if (usarCookies) {
      const cookiesPath = path.join(__dirname, "cookies.txt");
      if (!fs.existsSync(cookiesPath)) {
        return reject(new Error("Cookies no disponibles"));
      }

      command = `python -m yt_dlp --cookies "${cookiesPath}" --no-playlist -f "bestaudio/best" -x --audio-format mp3 -o "${outputTemplate}" "${url}"`;
      console.log("Intento con cookies");
    } else {
      command = `python -m yt_dlp --no-playlist -f "bestaudio/best" -x --audio-format mp3 -o "${outputTemplate}" "${url}"`;
      console.log("Intento sin cookies");
    }

    const child = exec(command, async () => {
      try {
        await new Promise(r => setTimeout(r, 500));

        const mp3Files = fs.readdirSync(downloadsDir)
          .filter(f => f.endsWith(".mp3"))
          .map(f => ({
            name: f,
            time: fs.statSync(path.join(downloadsDir, f)).mtimeMs
          }))
          //solo archivos creados despues de iniciar
          .filter(f => f.time >= inicio);

        if (mp3Files.length === 0) {
          return reject(new Error("No se generó MP3 nuevo (bloqueado por YouTube)"));
        }

        //si hay varios, agarra el más reciente
        mp3Files.sort((a, b) => b.time - a.time);

        resolve(mp3Files[0].name);
      } catch (err) {
        reject(err);
      }
    });

    child.stderr?.on("data", (d) => {
      const msg = d.toString();
      if (msg.includes("Sign in to confirm")) {
        console.warn("YouTube detectó bot");
      }
    });
  });
}

//Endpoint principal de conversión
app.post("/convert", async (req, res) => {
  const { url } = req.body;

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