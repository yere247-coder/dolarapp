const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

// API pública correcta
const API_URL = "https://bcv-api.rafnixg.dev/rates/";
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

// Obtener última tasa (SIEMPRE DESDE INTERNET)
app.get("/api/tasa", async (req, res) => {
  try {
    console.log("Solicitando tasa actualizada a la API...");
    // Aumentamos el timeout a 10 segundos para evitar que falle por lentitud
    const response = await axios.get(API_URL, { timeout: 10000 });
    const json = response.data;

    if (!json || !json.dollar || !json.date) {
      throw new Error("Respuesta API no válida");
    }

    const tasa = parseFloat(json.dollar);
    const fecha = json.date;

    // Guardamos en el historial en segundo plano solo si es un día nuevo
    let historial = leerHistorial();
    if (!historial.find(h => h.fecha === fecha)) {
      historial.push({ fecha, usd: tasa });
      guardarHistorial(historial);
      console.log(`Nueva tasa guardada en historial: ${fecha}`);
    }

    // Enviamos la respuesta fresca de internet
    res.json({ tasa, fecha });

  } catch (error) {
    console.log("Error crítico: No se pudo obtener la tasa de internet:", error.message);
    
    // Solo en caso de error total de internet, enviamos un error claro
    // Esto evitará que el frontend muestre datos viejos sin que te des cuenta
    res.status(503).json({ error: "Servicio de tasa no disponible temporalmente" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`)
);
