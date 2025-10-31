//server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import "./keepAlive.js";

const app = express();
app.use(cors());
app.use(express.json());

//ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//rutas (ajustadas a tu estructura: public dentro de backend, downloads en la raíz del proyecto)
const publicPath = path.join(__dirname, "public");
const downloadsDir = path.join(__dirname, "../downloads");

//debug info
console.log("📁 Ruta detectada para frontend:", publicPath);
console.log("📁 Ruta detectada para descargas:", downloadsDir);

//crear downloads si no existe
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

//servir archivos estáticos de frontend
app.use(express.static(publicPath));

//servir los mp3 guardados
app.use("/downloads", express.static(downloadsDir));

//para obtener el titulo usando noembed
async function obtenerTitulo(url) {
  try {
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return data.title || "audio_sin_nombre";
  } catch (error) {
    console.error("⚠️ Error al obtener título:", error.message);
    return "audio_sin_nombre";
  }
}

//endpoint de conversión
app.post("/convert", (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "URL no válida" });
  }

  console.log("🎬 Procesando:", url);

  //obtener título


    const title = await obtenerTitulo(url);
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim();
    const fileName = `${safeTitle}.mp3`;
    const outputPath = path.join(downloadsDir, fileName);

    //comando yt-dlp sin cookies
    const command = `python -m yt_dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`;


    const child = exec(command, (errDown) => {
      if (errDown) {
        console.error("❌ Error al convertir:", errDown.message);
        return res.status(500).json({ error: "Error al procesar el video" });
      }

      console.log(`✅ Conversión completada: ${fileName}`);
      //devolvemos la ruta pública para que el front la use
      res.json({
        success: true,
        title: safeTitle,
        file: `/downloads/${encodeURIComponent(fileName)}`
      });
    });

    child.stdout?.on("data", (d) => console.log("yt-dlp:", d.toString().trim()));
    child.stderr?.on("data", (d) => console.log("yt-dlp error:", d.toString().trim()));
  });

//ruta raíz, enviar index.html explícitamente (buena práctica debug)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath,"index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Sirviendo archivos desde: ${publicPath}`);
});

