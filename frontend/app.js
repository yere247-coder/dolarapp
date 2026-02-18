const tasaEl = document.getElementById("tasa");
const fechaEl = document.getElementById("fecha");
const montoEl = document.getElementById("monto");
const monedaEl = document.getElementById("moneda");
const resultadoEl = document.getElementById("resultado");
const historialSelect = document.getElementById("historial-fechas");
const usarTasaBtn = document.getElementById("usar-tasa");

let tasa = 0;

// Cargar última tasa y respaldo offline
async function cargarTasa() {
  try {
    const res = await fetch("http://localhost:4000/api/tasa");
    const data = await res.json();
    tasa = parseFloat(data.tasa);
    tasaEl.innerText = tasa.toFixed(2);
    fechaEl.innerText = data.fecha;

    localStorage.setItem("ultimaTasa", tasa);
    localStorage.setItem("ultimaFecha", data.fecha);
  } catch {
    // Respaldo local
    tasa = parseFloat(localStorage.getItem("ultimaTasa")) || 0;
    tasaEl.innerText = tasa.toFixed(2);
    fechaEl.innerText = localStorage.getItem("ultimaFecha") || "--/--/----";
  }
  calcularResultado();
}

// Cargar historial
async function cargarHistorial() {
  try {
    const res = await fetch("http://localhost:4000/api/historial");
    const historial = await res.json();
    historialSelect.innerHTML = "";
    historial.forEach(item => {
      const option = document.createElement("option");
      option.value = item.usd;
      option.text = `${item.fecha} → ${item.usd.toFixed(2)} VES/USD`;
      historialSelect.appendChild(option);
    });
    localStorage.setItem("historial", JSON.stringify(historial));
  } catch {
    const backup = JSON.parse(localStorage.getItem("historial")) || [];
    historialSelect.innerHTML = "";
    backup.forEach(item => {
      const option = document.createElement("option");
      option.value = item.usd;
      option.text = `${item.fecha} → ${item.usd.toFixed(2)} VES/USD`;
      historialSelect.appendChild(option);
    });
  }
}

// Calcular conversión en tiempo real
function calcularResultado() {
  const monto = parseFloat(montoEl.value);
  if (!monto || tasa === 0) {
    resultadoEl.innerText = "0.00";
    return;
  }
  const resultado = monedaEl.value === "usd" ? monto * tasa : monto / tasa;
  resultadoEl.innerText = resultado.toFixed(2);
}

// Eventos
montoEl.addEventListener("input", calcularResultado);
monedaEl.addEventListener("change", calcularResultado);

usarTasaBtn.addEventListener("click", () => {
  const seleccion = parseFloat(historialSelect.value);
  if (!isNaN(seleccion)) {
    tasa = seleccion;
    tasaEl.innerText = tasa.toFixed(2);
    calcularResultado();
  }
});

const copiarBtn = document.getElementById("copiar-btn");

copiarBtn.addEventListener("click", () => {
  const texto = resultadoEl.innerText;
  if (!texto || texto === "0.00") return;

  // Copiar al portapapeles
  navigator.clipboard.writeText(texto)
    .then(() => alert(`Monto copiado: ${texto}`))
    .catch(err => alert("Error al copiar: " + err));
});

const actualizarBtn = document.getElementById("actualizar-tasa");

actualizarBtn.addEventListener("click", async () => {
  actualizarBtn.disabled = true;
  actualizarBtn.innerText = "Actualizando...";
  try {
    await cargarTasa(); // reutiliza la función existente
  } catch (err) {
    alert("Error al actualizar la tasa: " + err);
  } finally {
    actualizarBtn.disabled = false;
    actualizarBtn.innerText = "Actualizar tasa";
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js")
    .then(() => console.log("Service Worker registrado"))
    .catch(err => console.log("Error SW:", err));
}

// Inicialización
cargarTasa();
cargarHistorial();
setInterval(cargarTasa, 60000); // actualizar cada minuto
