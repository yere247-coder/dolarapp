// Configuración de la URL de tu backend en Render
const API_BASE_URL = "https://dolarapp-95xs.onrender.com"; 

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
    const res = await fetch(`${API_BASE_URL}/api/tasa?update=${Date.now()}`);
    const data = await res.json();
    
    // Guardamos el valor numérico real
    tasa = parseFloat(data.tasa);

    // Mostramos la tasa con 4 decimales y formato venezolano (coma para decimales)
    tasaEl.innerText = tasa.toLocaleString('es-VE', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });

    fechaEl.innerText = data.fecha;

    localStorage.setItem("ultimaTasa", tasa);
    localStorage.setItem("ultimaFecha", data.fecha);
  } catch (error) {
    console.error("Error cargando tasa:", error);
    // Respaldo local también con 4 decimales
    tasa = parseFloat(localStorage.getItem("ultimaTasa")) || 0;
    tasaEl.innerText = tasa.toLocaleString('es-VE', { minimumFractionDigits: 4 });
    fechaEl.innerText = localStorage.getItem("ultimaFecha") || "--/--/----";
  }
  calcularResultado(); // Esto seguirá mostrando 2 decimales en el monto final
}

// Cargar historial
async function cargarHistorial() {
  try {
    // Se cambia localhost por la URL de producción de Render
    const res = await fetch(`${API_BASE_URL}/api/historial`);
    const historial = await res.json();
    historialSelect.innerHTML = "";
    historial.forEach(item => {
    const option = document.createElement("option");
    option.value = item.usd;
    option.dataset.fecha = item.fecha;
    option.text = `${item.fecha} → ${item.usd.toFixed(4)} VES/USD`;
    historialSelect.appendChild(option);
  });
    localStorage.setItem("historial", JSON.stringify(historial));
  } catch (error) {
    console.error("Error cargando historial:", error);
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
    resultadoEl.innerText = "0,00";
    return;
  }
  
  const resultado = monedaEl.value === "usd" ? monto * tasa : monto / tasa;

  resultadoEl.innerText = resultado.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Eventos
montoEl.addEventListener("input", calcularResultado);
monedaEl.addEventListener("change", calcularResultado);

usarTasaBtn.addEventListener("click", () => {
  const seleccion = historialSelect.options[historialSelect.selectedIndex];
  
  if (seleccion) {
    const valorTasa = parseFloat(seleccion.value);
    const fechaTasa = seleccion.dataset.fecha;

    if (!isNaN(valorTasa)) {
      tasa = valorTasa;
      tasaEl.innerText = tasa.toLocaleString('es-VE', { minimumFractionDigits: 4 });
      fechaEl.innerText = fechaTasa;
      calcularResultado();
    }
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
    await cargarTasa(); 
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