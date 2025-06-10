// Weather module
const WeatherModule = {
  elements: {
    weatherContent: document.getElementById("weatherContent"),
    weatherResult: document.getElementById("weatherResult"),
    weatherLocation: document.getElementById("weatherLocation"),
    weatherIcon: document.getElementById("weatherIcon"),
    weatherTemp: document.getElementById("weatherTemp"),
    weatherCondition: document.getElementById("weatherCondition"),
    weatherHumidity: document.getElementById("weatherHumidity"),
    weatherWind: document.getElementById("weatherWind"),
    forecastContainer: document.getElementById("forecastContainer"),
    toggleSearchBtn: document.getElementById("toggleSearchBtn"),
    manualSearch: document.getElementById("manualSearch"),
    cityInput: document.getElementById("cityInput"),
    getWeatherBtn: document.getElementById("getWeatherBtn"),
  },

  // 국가별 주요 도시 매핑
  countryToCities: {
    "South Korea": ["Seoul", "Busan", "Incheon"],
    "Japan": ["Tokyo", "Osaka", "Kyoto"],
    "United States": ["New York", "Los Angeles", "Chicago"],
    "United Kingdom": ["London", "Manchester", "Birmingham"],
    "Germany": ["Berlin", "Munich", "Hamburg"],
    "France": ["Paris", "Lyon", "Marseille"],
    "Australia": ["Sydney", "Melbourne", "Brisbane"],
    "Canada": ["Toronto", "Vancouver", "Montreal"],
    "Singapore": ["Singapore"],
    "Thailand": ["Bangkok", "Chiang Mai", "Phuket"],
    "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang"],
    "Philippines": ["Manila", "Cebu", "Davao"],
    "Indonesia": ["Jakarta", "Surabaya", "Bandung"],
    "Malaysia": ["Kuala Lumpur", "George Town", "Johor Bahru"],
    "India": ["New Delhi", "Mumbai", "Bangalore"],
    "China": ["Beijing", "Shanghai", "Guangzhou"],
  },

  currentCountry: null,
}

function initWeather() {
  setupWeatherEventListeners()
  updateWeatherContent()
}

function setupWeatherEventListeners() {
  // 수동 검색 토글
  WeatherModule.elements.toggleSearchBtn.addEventListener("click", toggleManualSearch)

  // 수동 검색 기능
  WeatherModule.elements.getWeatherBtn.addEventListener("click", getManualWeather)
  WeatherModule.elements.cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      getManualWeather()
    }
  })

  // 국가 변경 감지
  window.addEventListener("configChanged", (e) => {
    const newCountry = e.detail.config.country
    if (newCountry !== WeatherModule.currentCountry) {
      WeatherModule.currentCountry = newCountry
      updateWeatherContent()
    }
  })

  // 탭 변경 감지
  window.addEventListener("tabChanged", (e) => {
    if (e.detail.tab === "weather") {
      updateWeatherContent()
    }
  })
}

function toggleManualSearch() {
  const isVisible = WeatherModule.elements.manualSearch.style.display !== "none"
  WeatherModule.elements.manualSearch.style.display = isVisible ? "none" : "block"

  if (!isVisible) {
    WeatherModule.elements.cityInput.focus()
  }
}

async function updateWeatherContent() {
  const country = window.AppState?.chatConfig?.country || WeatherModule.currentCountry

  if (!country) {
    showNoCountryMessage()
    return
  }

  // 해당 국가의 주요 도시 가져오기
  const cities = WeatherModule.countryToCities[country]
  if (!cities || cities.length === 0) {
    showNoDataMessage(country)
    return
  }

  // 첫 번째 주요 도시의 날씨 정보 가져오기
  const mainCity = cities[0]
  await getWeatherForCity(mainCity, country)
}

function showNoCountryMessage() {
  WeatherModule.elements.weatherContent.innerHTML = `
    <div class="no-country-message">
      <i class="fas fa-cloud"></i>
      <h3>날씨 정보</h3>
      <p>날씨 정보를 보려면 국가를 선택해주세요.</p>
    </div>
  `
  WeatherModule.elements.weatherResult.style.display = "none"
}

function showNoDataMessage(country) {
  WeatherModule.elements.weatherContent.innerHTML = `
    <div class="no-country-message">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>날씨 정보</h3>
      <p>${country}의 날씨 데이터를 현재 사용할 수 없습니다.</p>
    </div>
  `
  WeatherModule.elements.weatherResult.style.display = "none"
}

function showLoadingMessage(city) {
  WeatherModule.elements.weatherContent.innerHTML = `
    <div class="loading-weather">
      <i class="fas fa-spinner fa-spin"></i>
      <h3>날씨 정보 로딩 중</h3>
      <p>${city}의 날씨 데이터를 가져오는 중...</p>
    </div>
  `
  WeatherModule.elements.weatherResult.style.display = "none"
}

async function getWeatherForCity(city, country = null) {
  showLoadingMessage(city)

  try {
    const params = {
      country: country || city,
      city: city
    };

    const weatherData = await apiGet(API_CONFIG.ENDPOINTS.WEATHER, params);
    displayWeatherData(weatherData, city, country);
    WeatherModule.elements.weatherContent.style.display = "none"
  } catch (error) {
    console.error("Weather fetch error:", error)
    const errorMessage = handleApiError(error, `${city}의 날씨 정보를 불러오는데 실패했습니다.`);
    WeatherModule.elements.weatherContent.innerHTML = `
      <div class="no-country-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>날씨 정보 오류</h3>
        <p>${errorMessage}</p>
        <button onclick="getWeatherForCity('${city}', '${country}')" class="retry-btn">
          <i class="fas fa-redo"></i>
          다시 시도
        </button>
      </div>
    `
    WeatherModule.elements.weatherResult.style.display = "none"
  }
}

async function getManualWeather() {
  const city = WeatherModule.elements.cityInput.value.trim()
  if (!city) return

  setLoadingState(WeatherModule.elements.getWeatherBtn, true)

  try {
    await getWeatherForCity(city)
  } finally {
    setLoadingState(WeatherModule.elements.getWeatherBtn, false)
  }
}

function displayWeatherData(data, city, country) {
  // API 응답 데이터 구조에 맞게 조정
  const location = data.location || `${city}${country ? `, ${country}` : ''}`;
  const current = data.current || data;
  const forecast = data.forecast || data.daily || [];

  WeatherModule.elements.weatherLocation.textContent = location
  WeatherModule.elements.weatherTemp.textContent = `${Math.round(current.temperature || current.temp)}°C`
  WeatherModule.elements.weatherCondition.textContent = current.condition || current.description || 'Clear'
  WeatherModule.elements.weatherHumidity.textContent = `${current.humidity || 50}%`
  WeatherModule.elements.weatherWind.textContent = `${current.wind_speed || current.wind || 10} km/h`

  // Set weather icon
  const iconClass = getWeatherIconClass(current.condition || current.description || 'clear')
  WeatherModule.elements.weatherIcon.className = `fas ${iconClass} weather-icon`

  // Display forecast
  WeatherModule.elements.forecastContainer.innerHTML = ""
  
  // 예보 데이터가 있으면 표시, 없으면 Mock 데이터 생성
  const forecastData = forecast.length > 0 ? forecast.slice(0, 5) : generateMockForecast();
  
  forecastData.forEach((day, index) => {
    const forecastItem = document.createElement("div")
    forecastItem.className = "forecast-item"
    
    const dayName = day.day || getDayName(index);
    const condition = day.condition || day.description || 'clear';
    const high = day.high || day.temp_max || (Math.round(current.temperature || 20) + Math.random() * 5);
    const low = day.low || day.temp_min || (Math.round(current.temperature || 20) - Math.random() * 5);
    
    forecastItem.innerHTML = `
      <div class="day">${dayName}</div>
      <i class="fas ${getWeatherIconClass(condition)}"></i>
      <div class="temps">
        <span class="temp-high">${Math.round(high)}°</span>
        <span class="temp-low">/${Math.round(low)}°</span>
      </div>
    `
    WeatherModule.elements.forecastContainer.appendChild(forecastItem)
  })

  WeatherModule.elements.weatherResult.style.display = "block"
}

function generateMockForecast() {
  const days = ['오늘', '내일', '모레', '목', '금'];
  return days.map(day => ({
    day: day,
    high: Math.floor(Math.random() * 25) + 15,
    low: Math.floor(Math.random() * 15) + 5,
    condition: ['clear', 'cloudy', 'rain'][Math.floor(Math.random() * 3)]
  }));
}

function getDayName(index) {
  const days = ['오늘', '내일', '모레', '목요일', '금요일'];
  return days[index] || '일요일';
}

function getWeatherIconClass(condition) {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
    return "fa-sun"
  } else if (conditionLower.includes('cloud')) {
    return "fa-cloud"
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return "fa-cloud-rain"
  } else if (conditionLower.includes('snow')) {
    return "fa-snowflake"
  } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
    return "fa-bolt"
  } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    return "fa-smog"
  } else {
    return "fa-cloud"
  }
}
