//server.js
import express from "express";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fetch from "node-fetch"; // ✨ usamos esto para obtener el título automáticamente
import "./keepAlive.js";

const app = express();
app.use(cors());
app.use(express.json());

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas (public dentro de backend, downloads fuera)
const publicPath = path.join(__dirname, "public");
const downloadsDir = path.join(__dirname, "../downloads");

// Debug info
console.log("📁 Ruta detectada para frontend:", publicPath);
console.log("📁 Ruta detectada para descargas:", downloadsDir);

// Crear carpeta de descargas si no existe
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

// Servir archivos estáticos (frontend)
app.use(express.static(publicPath));

// Servir MP3 descargados
app.use("/downloads", express.static(downloadsDir));

// 🌟 Función para obtener el título usando noembed (sin cookies)
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

// 🎧 Endpoint principal de conversión
app.post("/convert", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "URL no válida" });
  }

  console.log("🎬 Procesando:", url);

  // Obtener título con noembed
  const title = await obtenerTitulo(url);
  const safeTitle = title.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim();
  const fileName = `${safeTitle}.mp3`;
  const outputPath = path.join(downloadsDir, fileName);

  // Comando yt-dlp (sin cookies.txt)
  const command = `python -m yt_dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`;

  const child = exec(command, (errDown) => {
    if (errDown) {
      console.error("❌ Error al convertir:", errDown.message);
      return res.status(500).json({ error: "Error al procesar el video" });
    }

    console.log(`✅ Conversión completada: ${fileName}`);
    res.json({
      success: true,
      title: safeTitle,
      file: `/downloads/${encodeURIComponent(fileName)}`
    });
  });

  child.stdout?.on("data", (d) => console.log("yt-dlp:", d.toString().trim()));
  child.stderr?.on("data", (d) => console.log("yt-dlp error:", d.toString().trim()));
});

// 🏠 Ruta raíz (sirve el index)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// 🚀 Arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Sirviendo archivos desde: ${publicPath}`);
});
