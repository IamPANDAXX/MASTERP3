const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");

const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

//ruta del convertidor
app.post("/api/convert", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).send("URL inválida");
    }

    res.setHeader("Content-Disposition", 'attachment; filename="audio.mp3"');
    res.setHeader("Content-Type", "audio/mpeg");

    ytdl(url, { filter: "audioonly", quality: "highestaudio" })
      .pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error en la conversión");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en ${PORT}`));

//ruta visitas globales
app.get("/api/visitas", (req, res) => {
  const filePath = path.join(__dirname, "visitas.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer visitas.json:", err);
      return res.status(500).json({ error: "Error al contar visitas" });
    }

    let visitas = JSON.parse(data);
    visitas.contador += 1;

    fs.writeFile(filePath, JSON.stringify(visitas), (err) => {
      if (err) {
        console.error("Error al escribir visitas.json:", err);
        return res.status(500).json({ error: "Error al guardar visita" });
      }

      res.json({ visitas: visitas.contador });
    });
  });
});