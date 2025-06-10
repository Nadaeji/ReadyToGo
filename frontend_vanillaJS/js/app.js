// Main application state
const AppState = {
  activeTab: "chat",
  chatConfig: {
    country: "",
    topic: "",
    aiModel: "gpt-4",
  },
  isLoading: false,
}

// DOM elements
const elements = {
  // Navigation
  navItems: document.querySelectorAll(".nav-item"),
  tabContents: document.querySelectorAll(".tab-content"),

  // Configuration
  countrySelect: document.getElementById("countrySelect"),
  topicSelect: document.getElementById("topicSelect"),
  modelSelect: document.getElementById("modelSelect"),

  // Context displays
  chatContext: document.getElementById("chatContext"),
  weatherContext: document.getElementById("weatherContext"),
  exchangeContext: document.getElementById("exchangeContext"),
  flightsContext: document.getElementById("flightsContext"),
  safetyContext: document.getElementById("safetyContext"),
}

// Initialize application
function initApp() {
  setupEventListeners()
  loadCountriesAndTopicsAndModels()
  updateContextDisplays()

  // Initialize modules
  if (typeof initChat === "function") initChat()
  if (typeof initWeather === "function") initWeather()
  if (typeof initExchange === "function") initExchange()
  if (typeof initFlights === "function") initFlights()
  if (typeof initSafety === "function") initSafety()
  if (typeof initChecklist === "function") initChecklist()
  if (typeof initCommunity === "function") initCommunity()
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  elements.navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      const tab = e.currentTarget.dataset.tab
      switchTab(tab)
    })
  })

  // Configuration changes
  elements.countrySelect.addEventListener("change", (e) => {
    AppState.chatConfig.country = e.target.value
    updateContextDisplays()
    notifyConfigChange()
  })

  elements.topicSelect.addEventListener("change", (e) => {
    AppState.chatConfig.topic = e.target.value
    updateContextDisplays()
    notifyConfigChange()
  })

  elements.modelSelect.addEventListener("change", (e) => {
    AppState.chatConfig.aiModel = e.target.value
    notifyConfigChange()
  })
}

// Load countries and topics from backend
async function loadCountriesAndTopicsAndModels() {
  try {
    // 국가 목록 로드
    const countriesData = await apiGet(API_CONFIG.ENDPOINTS.COUNTRIES)
    if (countriesData && countriesData.length > 0) {
      populateCountrySelect(countriesData)
    }
  } catch (error) {
    console.error('Failed to load countries:', error)
    // 백엔드 연결 실패시 기본 국가 목록 유지
  }

  try {
    // 토픽 목록 로드
    const topicsData = await apiGet(API_CONFIG.ENDPOINTS.TOPICS)
    if (topicsData && topicsData.length > 0) {
      populateTopicSelect(topicsData)
    }
  } catch (error) {
    console.error('Failed to load topics:', error)
    // 백엔드 연결 실패시 기본 토픽 목록 유지
  }

  try {
    // 토픽 목록 로드
    const modelsData = await apiGet(API_CONFIG.ENDPOINTS.CHAT_MODELS)
    if (modelsData && modelsData.length > 0) {
      populateTopicSelect(modelsData)
    }
  } catch (error) {
    console.error('Failed to load topics:', error)
    // 백엔드 연결 실패시 기본 토픽 목록 유지
  }
}

function populateCountrySelect(countries) {
  // 기존 옵션 제거 (첫 번째 "Select country" 옵션은 유지)
  const options = elements.countrySelect.querySelectorAll('option:not(:first-child)')
  options.forEach(option => option.remove())
  
  // 새 옵션 추가
  countries.forEach(country => {
    const option = document.createElement('option')
    option.value = country.name || country
    option.textContent = country.display_name || country.name || country
    elements.countrySelect.appendChild(option)
  })
}

function populateTopicSelect(topics) {
  // 기존 옵션 제거 (첫 번째 "Select topic" 옵션은 유지)
  const options = elements.topicSelect.querySelectorAll('option:not(:first-child)')
  options.forEach(option => option.remove())
  
  // 새 옵션 추가
  topics.forEach(topic => {
    const option = document.createElement('option')
    option.value = topic.name || topic
    option.textContent = topic.display_name || topic.name || topic
    elements.topicSelect.appendChild(option)
  })
}

// Switch between tabs
function switchTab(tabName) {
  AppState.activeTab = tabName

  // Update navigation
  elements.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === tabName)
  })

  // Update tab content
  elements.tabContents.forEach((content) => {
    content.classList.toggle("active", content.id === `${tabName}Tab`)
  })

  // Notify modules of tab change
  window.dispatchEvent(
    new CustomEvent("tabChanged", {
      detail: { tab: tabName, config: AppState.chatConfig },
    }),
  )
}

// Update context displays
function updateContextDisplays() {
  const contextText =
    AppState.chatConfig.country && AppState.chatConfig.topic
      ? `• ${AppState.chatConfig.country} • ${AppState.chatConfig.topic}`
      : ""

  if (elements.chatContext) elements.chatContext.textContent = contextText
  if (elements.weatherContext)
    elements.weatherContext.textContent = AppState.chatConfig.country ? `• ${AppState.chatConfig.country}` : ""
  if (elements.exchangeContext)
    elements.exchangeContext.textContent = AppState.chatConfig.country ? `• ${AppState.chatConfig.country}` : ""
  if (elements.flightsContext)
    elements.flightsContext.textContent = AppState.chatConfig.country ? `• ${AppState.chatConfig.country}` : ""
  if (elements.safetyContext)
    elements.safetyContext.textContent = AppState.chatConfig.country ? `• ${AppState.chatConfig.country}` : ""
}

// Notify modules of configuration changes
function notifyConfigChange() {
  window.dispatchEvent(
    new CustomEvent("configChanged", {
      detail: { config: AppState.chatConfig },
    }),
  )
}

// Health check
async function checkBackendHealth() {
  try {
    const healthData = await apiGet(API_CONFIG.ENDPOINTS.HEALTH)
    console.log('Backend health check:', healthData)
    return true
  } catch (error) {
    console.warn('Backend health check failed:', error)
    showNotification('백엔드 서버와의 연결을 확인해주세요.', 'warning')
    return false
  }
}

// Utility functions
function showLoading(element) {
  if (!element) return
  
  element.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>로딩 중...</p>
    </div>
  `
}

function hideLoading(element) {
  if (element) {
    element.style.display = "none"
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function formatTime(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date)
}

function formatCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

// Error handling
function handleError(error, context = '') {
  console.error(`Error in ${context}:`, error)
  
  let message = '오류가 발생했습니다.'
  if (error.message) {
    message = error.message
  }
  
  showNotification(message, 'error')
}

// App initialization
function initializeApp() { 
  // 설정 파일이 로드되었는지 확인 
  if (typeof API_CONFIG === 'undefined') { 
    console.error('API_CONFIG is not loaded. Make sure config.js is included.') 
    showNotification('설정 파일을 불러올 수 없습니다.', 'error')
    return // 초기화 중단
  }

  // 앱 초기화 진행
  try {
    initApp()
  } catch (error) {
    console.error('Failed to initialize app:', error)
    showNotification('앱 초기화 중 오류가 발생했습니다.', 'error')
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp)

// Export for use in other modules
window.AppState = AppState
window.showLoading = showLoading
window.hideLoading = hideLoading
window.formatDate = formatDate
window.formatTime = formatTime
window.formatCurrency = formatCurrency
window.handleError = handleError
window.checkBackendHealth = checkBackendHealth
