/* =============================================
   PREVISAO DO TEMPO — SCRIPT
   ============================================= */

(function () {
  "use strict";

  // ==================
  // CONFIG
  // ==================
  // -------------------------------------------------------
  // IMPORTANTE: Se a chave abaixo nao funcionar, gere uma
  // nova GRATUITA em: https://home.openweathermap.org/api_keys
  // (chaves novas demoram ate 2h para ativar)
  // -------------------------------------------------------
  var API_KEY = "5fc4f0de89a62dcf5bf11c85fea44d44";
  var currentMode = "cidade";
  var leafletMap = null;
  var weatherMarker = null;

  // ==================
  // MAP
  // ==================
  function initMap() {
    if (typeof L === "undefined") {
      document.getElementById("map").innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;' +
        'font-size:0.9rem;padding:20px;text-align:center;">' +
        '<div><i class="fa-solid fa-map" style="font-size:2rem;display:block;margin-bottom:10px;"></i>' +
        "Mapa indisponivel. Verifique sua conexao com a internet.</div></div>";
      return;
    }

    leafletMap = L.map("map", {
      center: [-15.78, -47.93],
      zoom: 4,
      zoomControl: true,
    });

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }
    ).addTo(leafletMap);

    leafletMap.on("click", function (e) {
      buscarClimaPorCoords(e.latlng.lat, e.latlng.lng);
    });
  }

  function updateMap(lat, lon, popupHTML) {
    if (!leafletMap) return;
    leafletMap.flyTo([lat, lon], 11, { duration: 1.2 });
    if (weatherMarker) leafletMap.removeLayer(weatherMarker);
    weatherMarker = L.marker([lat, lon]).addTo(leafletMap);
    if (popupHTML) {
      weatherMarker.bindPopup(popupHTML, { maxWidth: 240 }).openPopup();
    }
  }

  // ==================
  // TABS
  // ==================
  window.switchTab = function (mode) {
    currentMode = mode;
    document.querySelectorAll(".search-tab").forEach(function (t) {
      t.classList.remove("active");
    });
    document
      .querySelector('[data-mode="' + mode + '"]')
      .classList.add("active");

    var input = document.getElementById("searchInput");
    var btnText = document.getElementById("searchBtnText");
    var hint = document.getElementById("searchHint");
    var icon = document.getElementById("inputIcon");

    input.style.display = "";
    hint.classList.remove("visible");
    hint.innerHTML = "";

    if (mode === "cidade") {
      input.placeholder = "Digite o nome da cidade...";
      input.maxLength = 100;
      icon.className = "fa-solid fa-magnifying-glass";
      btnText.textContent = "Buscar";
    } else if (mode === "cep") {
      input.placeholder = "Digite o CEP (ex: 01001-000)...";
      input.maxLength = 9;
      icon.className = "fa-solid fa-envelope";
      btnText.textContent = "Buscar";
      hint.innerHTML =
        '<i class="fa-solid fa-circle-info"></i> O CEP sera convertido automaticamente para a cidade correspondente.';
      hint.classList.add("visible");
    } else if (mode === "loc") {
      input.style.display = "none";
      btnText.textContent = "Obter Localizacao";
      hint.innerHTML =
        '<i class="fa-solid fa-circle-info"></i> Sera solicitada permissao de localizacao do navegador.';
      hint.classList.add("visible");
    }

    input.value = "";
    if (mode !== "loc") input.focus();
  };

  // Enter key
  document
    .getElementById("searchInput")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") handleSearch();
    });

  // ==================
  // SEARCH HANDLER
  // ==================
  window.handleSearch = async function () {
    if (currentMode === "loc") return buscarPorGeolocalizacao();

    var input = document.getElementById("searchInput").value.trim();
    if (!input) {
      showError(
        currentMode === "cidade"
          ? "Digite o nome de uma cidade!"
          : "Digite um CEP valido!"
      );
      return;
    }

    if (currentMode === "cep") await buscarPorCEP(input);
    else await buscarClimaPorCidade(input);
  };

  // ==================
  // CEP (ViaCEP -> cidade -> OpenWeather)
  // ==================
  async function buscarPorCEP(cep) {
    var cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      showError("CEP invalido. Use 8 digitos (ex: 01001000).");
      return;
    }

    showLoading("Consultando CEP...");

    try {
      var res = await fetch(
        "https://viacep.com.br/ws/" + cepLimpo + "/json/"
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();

      if (data.erro) {
        showError("CEP nao encontrado na base do ViaCEP.");
        return;
      }

      var hint = document.getElementById("searchHint");
      hint.innerHTML =
        '<i class="fa-solid fa-check" style="color:var(--success)"></i> CEP encontrado: <strong>' +
        data.localidade +
        " - " +
        data.uf +
        "</strong>. Buscando clima...";
      hint.classList.add("visible");

      await buscarClimaPorCidade(data.localidade);
    } catch (e) {
      showError("Erro ao consultar o CEP. Verifique sua conexao.");
      console.error("ViaCEP error:", e);
    }
  }

  // ==================
  // GEOLOCATION
  // ==================
  function buscarPorGeolocalizacao() {
    if (!navigator.geolocation) {
      showError("Geolocalizacao nao suportada pelo navegador.");
      return;
    }

    showLoading("Obtendo localizacao...");

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        buscarClimaPorCoords(pos.coords.latitude, pos.coords.longitude);
      },
      function (err) {
        var msgs = {
          1: "Permissao de localizacao negada.",
          2: "Localizacao indisponivel.",
          3: "Tempo esgotado.",
        };
        showError(msgs[err.code] || "Erro ao obter localizacao.");
        console.error("Geo error:", err);
      },
      { timeout: 10000 }
    );
  }

  // ==================
  // WEATHER BY CITY
  // ==================
  async function buscarClimaPorCidade(cidade) {
    if (!API_KEY) {
      showError(
        "API Key nao configurada! Abra o arquivo script.js e cole sua chave da OpenWeather na variavel API_KEY."
      );
      return;
    }

    showLoading("Buscando clima...");

    var urls = [
      "https://api.openweathermap.org/data/2.5/weather?q=" +
        encodeURIComponent(cidade) +
        ",BR&appid=" +
        API_KEY +
        "&units=metric&lang=pt_br",
      "https://api.openweathermap.org/data/2.5/weather?q=" +
        encodeURIComponent(cidade) +
        "&appid=" +
        API_KEY +
        "&units=metric&lang=pt_br",
    ];

    var lastError = "";

    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i]);
        var data = await res.json();

        // Debug: mostra resposta completa no console (F12)
        console.log("OpenWeather resposta (tentativa " + (i + 1) + "):", data);

        // cod vem como number (200) OU string ("404") dependendo do caso
        var cod = Number(data.cod);

        if (cod === 401) {
          showError(
            "API Key invalida ou expirada. Gere uma nova em openweathermap.org/api e atualize o script.js."
          );
          return;
        }

        if (cod === 200) {
          displayWeather(data);
          fetchForecast(data.coord.lat, data.coord.lon);
          return;
        }

        lastError = data.message || "Erro " + data.cod;
      } catch (e) {
        console.error("Tentativa " + (i + 1) + " falhou:", e);
        lastError = e.message;
      }
    }

    showError(
      "Nao foi possivel buscar o clima. Resposta da API: " + lastError
    );
  }

  // ==================
  // WEATHER BY COORDS
  // ==================
  async function buscarClimaPorCoords(lat, lon) {
    if (!API_KEY) {
      showError(
        "API Key nao configurada! Abra o arquivo script.js e cole sua chave da OpenWeather na variavel API_KEY."
      );
      return;
    }

    showLoading("Buscando clima...");

    try {
      var res = await fetch(
        "https://api.openweathermap.org/data/2.5/weather?lat=" +
          lat +
          "&lon=" +
          lon +
          "&appid=" +
          API_KEY +
          "&units=metric&lang=pt_br"
      );
      var data = await res.json();

      console.log("OpenWeather resposta (coords):", data);

      var cod = Number(data.cod);

      if (cod === 401) {
        showError(
          "API Key invalida ou expirada. Gere uma nova em openweathermap.org/api e atualize o script.js."
        );
        return;
      }

      if (cod !== 200) {
        showError(
          "Nao foi possivel obter o clima. Resposta da API: " +
            (data.message || "Erro " + data.cod)
        );
        return;
      }

      displayWeather(data);
      fetchForecast(lat, lon);
    } catch (e) {
      showError("Erro ao buscar dados. Verifique sua conexao.");
      console.error(e);
    }
  }

  // ==================
  // 5-DAY FORECAST
  // ==================
  async function fetchForecast(lat, lon) {
    try {
      var res = await fetch(
        "https://api.openweathermap.org/data/2.5/forecast?lat=" +
          lat +
          "&lon=" +
          lon +
          "&appid=" +
          API_KEY +
          "&units=metric&lang=pt_br"
      );
      var data = await res.json();
      console.log("OpenWeather forecast resposta:", data);
      if (Number(data.cod) !== 200) return;

      // Group by day — pick the reading closest to midday
      var daily = {};
      data.list.forEach(function (item) {
        var date = item.dt_txt.split(" ")[0];
        var hour = parseInt(item.dt_txt.split(" ")[1].split(":")[0]);
        if (
          !daily[date] ||
          Math.abs(hour - 12) <
            Math.abs(parseInt(daily[date].dt_txt.split(" ")[1]) - 12)
        ) {
          daily[date] = item;
        }
      });

      var days = Object.values(daily).slice(0, 5);
      var grid = document.getElementById("forecastGrid");
      grid.innerHTML = "";
      var dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

      days.forEach(function (day) {
        var d = new Date(day.dt * 1000);
        var iconInfo = getWeatherIcon(day.weather[0].icon);
        var item = document.createElement("div");
        item.className = "forecast-item";
        item.innerHTML =
          '<div class="forecast-day">' +
          dayNames[d.getDay()] +
          " " +
          d.getDate() +
          "/" +
          (d.getMonth() + 1) +
          "</div>" +
          '<div class="forecast-icon"><i class="' +
          iconInfo.cls +
          '" style="color:' +
          iconInfo.color +
          '"></i></div>' +
          '<div class="forecast-temp">' +
          Math.round(day.main.temp_max) +
          "&deg; " +
          '<span class="forecast-temp-min">' +
          Math.round(day.main.temp_min) +
          "&deg;</span></div>";
        grid.appendChild(item);
      });

      document.getElementById("forecastSection").classList.add("visible");
    } catch (e) {
      console.error("Forecast error:", e);
    }
  }

  // ==================
  // DISPLAY WEATHER RESULT
  // ==================
  function displayWeather(data) {
    hideAll();

    document.getElementById("cityName").textContent = data.name;
    document.getElementById("cityCountry").textContent =
      data.sys.country || "";
    document.getElementById("tempValue").textContent = Math.round(
      data.main.temp
    );

    var iconInfo = getWeatherIcon(data.weather[0].icon);
    var tempIcon = document.getElementById("tempIcon");
    tempIcon.className = iconInfo.cls;
    tempIcon.style.color = iconInfo.color;

    document.getElementById("weatherDesc").querySelector("span").textContent =
      data.weather[0].description;
    document.getElementById("feelsLike").textContent =
      Math.round(data.main.feels_like) + "\u00B0C";
    document.getElementById("humidity").textContent =
      data.main.humidity + "%";
    document.getElementById("wind").textContent = data.wind.speed + " m/s";
    document.getElementById("visibility").textContent = data.visibility
      ? (data.visibility / 1000).toFixed(1) + " km"
      : "\u2014";

    var sr = data.sys.sunrise ? new Date(data.sys.sunrise * 1000) : null;
    var ss = data.sys.sunset ? new Date(data.sys.sunset * 1000) : null;
    document.getElementById("sunrise").textContent = sr
      ? sr.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "\u2014";
    document.getElementById("sunset").textContent = ss
      ? ss.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "\u2014";

    document.getElementById("weatherResult").classList.add("visible");

    // Update map
    updateMap(
      data.coord.lat,
      data.coord.lon,
      "<strong>" +
        data.name +
        "</strong><br>" +
        Math.round(data.main.temp) +
        "\u00B0C \u2014 " +
        data.weather[0].description
    );
  }

  // ==================
  // ICON MAPPING (Font Awesome)
  // ==================
  function getWeatherIcon(code) {
    var m = {
      "01d": { cls: "fa-solid fa-sun",                  color: "#fbbf24" },
      "01n": { cls: "fa-solid fa-moon",                 color: "#a78bfa" },
      "02d": { cls: "fa-solid fa-cloud-sun",            color: "#fbbf24" },
      "02n": { cls: "fa-solid fa-cloud-moon",           color: "#a78bfa" },
      "03d": { cls: "fa-solid fa-cloud",                color: "#94a3b8" },
      "03n": { cls: "fa-solid fa-cloud",                color: "#94a3b8" },
      "04d": { cls: "fa-solid fa-cloud",                color: "#64748b" },
      "04n": { cls: "fa-solid fa-cloud",                color: "#64748b" },
      "09d": { cls: "fa-solid fa-cloud-showers-heavy",  color: "#38bdf8" },
      "09n": { cls: "fa-solid fa-cloud-showers-heavy",  color: "#38bdf8" },
      "10d": { cls: "fa-solid fa-cloud-sun-rain",       color: "#38bdf8" },
      "10n": { cls: "fa-solid fa-cloud-moon-rain",      color: "#818cf8" },
      "11d": { cls: "fa-solid fa-cloud-bolt",           color: "#fbbf24" },
      "11n": { cls: "fa-solid fa-cloud-bolt",           color: "#fbbf24" },
      "13d": { cls: "fa-solid fa-snowflake",            color: "#e2e8f0" },
      "13n": { cls: "fa-solid fa-snowflake",            color: "#e2e8f0" },
      "50d": { cls: "fa-solid fa-smog",                 color: "#94a3b8" },
      "50n": { cls: "fa-solid fa-smog",                 color: "#94a3b8" },
    };
    return m[code] || { cls: "fa-solid fa-temperature-half", color: "#94a3b8" };
  }

  // ==================
  // UI STATE HELPERS
  // ==================
  function showLoading(msg) {
    hideAll();
    document.querySelector(".loading-text").textContent =
      msg || "Buscando dados...";
    document.getElementById("loading").classList.add("visible");
  }

  function showError(msg) {
    hideAll();
    document.getElementById("errorText").textContent = msg;
    document.getElementById("errorMsg").classList.add("visible");
  }

  function hideAll() {
    document.getElementById("placeholder").style.display = "none";
    document.getElementById("loading").classList.remove("visible");
    document.getElementById("errorMsg").classList.remove("visible");
    document.getElementById("weatherResult").classList.remove("visible");
    document.getElementById("forecastSection").classList.remove("visible");
  }

  // ==================
  // INIT
  // ==================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMap);
  } else {
    initMap();
  }
})();