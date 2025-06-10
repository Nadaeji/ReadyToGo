// API 설정
const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    // Chat API
    CHAT_CONVERSATION: '/api/chat/conversation/',
    CHAT_MESSAGE: '/api/chat/message/',
    CHAT_HISTORY: '/api/chat/history/',
    CHAT_MODELS: '/api/chat/settings/models/',
    CHAT_EXAMPLES: '/api/chat/examples/',
    CHAT_SOURCES: '/api/chat/sources/',

    // Realtime Info API
    EXCHANGE_RATES: '/api/realtime/exchange-rates/',
    WEATHER: '/api/realtime/weather/',
    EMBASSY_NOTICES: '/api/realtime/embassy-notices/',
    FLIGHT_TRENDS: '/api/realtime/flight-trends/',

    // Checklist API
    CHECKLISTS: '/api/checklist/',
    CHECKLIST_DETAIL: '/api/checklist/',

    // Community API
    COMMUNITY_POSTS: '/api/community/posts/',
    COMMUNITY_POST_DETAIL: '/api/community/posts/',
    COMMUNITY_CREATE_POST: '/api/community/posts/create/',
    COMMUNITY_CREATE_COMMENT: '/api/community/posts/',
    COMMUNITY_TOGGLE_LIKE: '/api/community/like/',

    // Core API
    HEALTH: '/api/health/',
    APP_INFO: '/api/',
    COUNTRIES: '/api/countries/',
    TOPICS: '/api/topics/',
    SOURCES: '/api/sources/',
  }
};

// API 헬퍼 함수
async function apiCall(endpoint, options = {}) {
  const url = API_CONFIG.BASE_URL + endpoint;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// GET 요청 헬퍼
async function apiGet(endpoint, params = {}) {
  const url = new URL(API_CONFIG.BASE_URL + endpoint);
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  return apiCall(url.pathname + url.search);
}

// POST 요청 헬퍼
async function apiPost(endpoint, data = {}) {
  return apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// PUT 요청 헬퍼
async function apiPut(endpoint, data = {}) {
  return apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE 요청 헬퍼
async function apiDelete(endpoint) {
  return apiCall(endpoint, {
    method: 'DELETE',
  });
}

// 세션 ID 생성/관리
function getSessionId() {
  let sessionId = localStorage.getItem('travel_assistant_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('travel_assistant_session_id', sessionId);
  }
  return sessionId;
}

// 에러 처리 헬퍼
function handleApiError(error, fallbackMessage = 'An error occurred') {
  console.error('API Error:', error);
  
  let errorMessage = fallbackMessage;
  if (error.message) {
    errorMessage = error.message;
  }
  
  // 사용자에게 에러 표시
  showNotification(errorMessage, 'error');
  
  return errorMessage;
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
  // 기존 알림 제거
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // 새 알림 생성
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  // 스타일 추가
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
    background: ${getNotificationColor(type)};
    color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideInRight 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // 5초 후 자동 제거
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return 'check-circle';
    case 'error': return 'exclamation-circle';
    case 'warning': return 'exclamation-triangle';
    default: return 'info-circle';
  }
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#10b981';
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    default: return '#3b82f6';
  }
}

// 로딩 상태 관리
function setLoadingState(element, loading = true) {
  if (loading) {
    element.disabled = true;
    const originalText = element.textContent;
    element.dataset.originalText = originalText;
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  } else {
    element.disabled = false;
    element.textContent = element.dataset.originalText || 'Submit';
  }
}

// 전역으로 사용할 수 있도록 내보내기
window.API_CONFIG = API_CONFIG;
window.apiCall = apiCall;
window.apiGet = apiGet;
window.apiPost = apiPost;
window.apiPut = apiPut;
window.apiDelete = apiDelete;
window.getSessionId = getSessionId;
window.handleApiError = handleApiError;
window.showNotification = showNotification;
window.setLoadingState = setLoadingState;
