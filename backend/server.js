const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

// API pública correcta
const API_URL = "https://ve.dolarapi.com/v1/dolares/oficial";
const HISTORIAL_FILE = path.join(__dirname, "historial.json");

// Leer historial
function leerHistorial() {
  try {
    return JSON.parse(fs.readFileSync(HISTORIAL_FILE));
  } catch {
    return [];
  }
}

// Guardar historial
function guardarHistorial(historial) {
  fs.writeFileSync(HISTORIAL_FILE, JSON.stringify(historial, null, 2));
}

// Guardar tasa diaria
app.get("/api/tasa/diaria", async (req, res) => {
  try {
    const response = await axios.get(API_URL, { timeout: 5000 });
    const json = response.data;

    if (!json || !json.dollar || !json.date) {
      throw new Error("Respuesta API no válida");
    }

    const nuevaTasa = {
      fecha: json.date,
      usd: parseFloat(json.dollar)
    };

    let historial = leerHistorial();
    const index = historial.findIndex(h => h.fecha === nuevaTasa.fecha);

    if (index >= 0) historial[index] = nuevaTasa;
    else historial.push(nuevaTasa);

    guardarHistorial(historial);

    res.json({ mensaje: "Tasa diaria guardada", nuevaTasa });
  } catch (error) {
    console.log("Error API diaria:", error.message);
    res.status(500).json({ error: "No se pudo guardar la tasa diaria" });
  }
});

// Obtener historial
app.get("/api/historial", (req, res) => {
  res.json(leerHistorial());
});

app.get("/api/tasa", async (req, res) => {
  try {
    console.log("Solicitando tasa actualizada a DolarApi...");
    const response = await axios.get(API_URL, { timeout: 10000 });
    const data = response.data;

    // El formato de esta API es diferente: { "promedio": 398.74, "fechaActualizacion": "..." }
    const tasa = parseFloat(data.promedio);
    // Convertimos la fecha al formato que usas (YYYY-MM-DD)
    const fecha = data.fechaActualizacion.split('T')[0]; 

    // Guardar en historial si es nuevo
    let historial = leerHistorial();
    if (!historial.find(h => h.fecha === fecha)) {
      historial.push({ fecha, usd: tasa });
      guardarHistorial(historial);
    }

    res.json({ tasa, fecha });

  } catch (error) {
    console.log("Fallo DolarApi, usando historial:", error.message);
    const historial = leerHistorial();
    if (historial.length > 0) {
      const ultima = historial[historial.length - 1];
      return res.json({ tasa: ultima.usd, fecha: ultima.fecha });
    }
    res.json({ tasa: 398.74, fecha: "2026-02-19" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`)
);
