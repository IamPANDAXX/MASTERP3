import express from "express";
import ytdl from "ytdl-core";
import ytpl from "ytpl"; // para playlists
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Helper: verifica si es playlist
const esPlaylist = (url) => url.includes("list=");

// Ruta del convertidor
app.post("/api/convert", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).send("URL inválida");

    // Si es playlist, devolvemos lista de videos
    if (esPlaylist(url)) {
      const playlist = await ytpl(url, { limit: 50 }); // máximo 50 videos
      const videos = playlist.items.map(item => ({
        title: item.title,
        url: item.url
      }));
      return res.json({ playlistTitle: playlist.title, videos });
    }

    // Verifica que sea URL de video válida
    if (!ytdl.validateURL(url)) return res.status(400).send("URL inválida");

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[\/\\?%*:|"<>]/g, "-"); // limpia caracteres

    // Headers para descarga
    res.setHeader("Content-Disposition", `attachment; filename="${title}.mp3"`);
    res.setHeader("Content-Type", "audio/mpeg");

    // Streaming progresivo para videos largos
    res.write(Buffer.from([0])); // fuerza actividad inicial
    ytdl(url, { filter: "audioonly", quality: "highestaudio" })
      .on("error", err => {
        console.error("Error en ytdl:", err);
        res.end();
      })
      .pipe(res);

  } catch (err) {
    console.error("Error catch:", err);
    res.status(500).send("Error en la conversión");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en ${PORT}`));