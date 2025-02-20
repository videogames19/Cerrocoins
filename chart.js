// Inicializa el historial de precios para cada empresa
const priceHistory = {};
companies.forEach(company => {
  priceHistory[company] = [];
});

// Función que actualiza el historial y la gráfica
function updatePriceHistory() {
  companies.forEach(company => {
    const price = parseFloat(getPrice(company));
    if (priceHistory[company].length >= 10) {
      priceHistory[company].shift(); // conserva los últimos 10 valores
    }
    priceHistory[company].push(price);
  });
  updateChart();
}

// Configuración e inicialización del gráfico
const ctx = document.getElementById("stockChart").getContext("2d");
const stockChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [...Array(10).keys()], // etiquetas 0 a 9
    datasets: companies.map(company => ({
      label: company,
      data: priceHistory[company],
      borderColor: getRandomColor(),
      fill: false
    }))
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: "Muestras" } },
      y: { title: { display: true, text: "Precio (CC)" }, min: 1, max: 5 }
    }
  }
});

// Función para actualizar los datos del gráfico
function updateChart() {
  // Usamos la longitud del historial (máximo 10)
  stockChart.data.labels = [...Array(priceHistory[companies[0]].length).keys()];
  stockChart.data.datasets.forEach(dataset => {
    dataset.data = priceHistory[dataset.label];
  });
  stockChart.update();
}

// Generador de colores aleatorios para cada línea
function getRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
}

// Actualiza el historial y gráfico cada 5 segundos
document.addEventListener("DOMContentLoaded", () => {
  setInterval(updatePriceHistory, 5000);
});
