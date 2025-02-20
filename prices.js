const companies = ["Herrero", "Mago", "Carpintero"];

/* 
  Función que simula la generación de periodos con duración aleatoria.
  Para evitar iterar desde el tiempo 0, usamos un tiempo base fijo (por ejemplo, el 1 de enero de 2025).
  Se utiliza un generador pseudoaleatorio con semilla fija para determinar cada intervalo (entre 1 y 20 minutos).
*/
function getPeriodData() {
  const now = Date.now();
  const baseTime = new Date('2025-01-01T00:00:00Z').getTime();
  const dt = now - baseTime;
  let periodIndex = 0;
  let sum = 0;
  let s = 123456789; // semilla fija
  while (true) {
    s = (s * 9301 + 49297) % 233280;
    let r = s / 233280; // número entre 0 y 1
    const intervalMs = (1 + r * 19) * 60 * 1000; // intervalo entre 1 y 20 minutos en milisegundos
    if (sum + intervalMs > dt) {
      return { periodIndex, periodStart: baseTime + sum, periodLength: intervalMs };
    }
    sum += intervalMs;
    periodIndex++;
  }
}

/* 
  Calcula el precio de una empresa en función de su nombre y el índice del periodo actual.
  Se utiliza una función hash para transformar (empresa + periodo) en un valor numérico,
  y se escala para que el precio esté entre 1.00 y 5.00.
*/
function getPrice(companyName) {
  const periodData = getPeriodData();
  const periodIndex = periodData.periodIndex;
  const str = companyName + periodIndex;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  let price = 1 + (hash % 401) / 100;
  return price.toFixed(2);
}
