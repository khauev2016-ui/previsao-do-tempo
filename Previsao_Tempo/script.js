const API_KEY = import.meta.env.VITE_API_KEY;

async function buscarClima() {
  const cidade = document.getElementById("cidade").value;

  if (!cidade) {
    alert("Digite uma cidade!");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade},BR&appid=${API_KEY}&units=metric&lang=pt_br`;

  try {
    const response = await fetch(url);
    const dados = await response.json();

    if (dados.cod !== 200) {
      document.getElementById("resultado").innerHTML = "Cidade não encontrada!";
      return;
    }

    document.getElementById("resultado").innerHTML = `
      <h2>${dados.name}</h2>
      <p>🌡️ Temperatura: ${dados.main.temp} °C</p>
      <p>☁️ Clima: ${dados.weather[0].description}</p>
      <p>💧 Umidade: ${dados.main.humidity}%</p>
      <p>💨 Vento: ${dados.wind.speed} m/s</p>
    `;
    
  } catch (erro) {
    document.getElementById("resultado").innerHTML = "Erro ao buscar dados!";
    console.error(erro);
  }
}