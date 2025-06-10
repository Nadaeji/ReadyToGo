// Main application state
const AppState = {
  chatHistory: [],
  currentChatId: null,
  chatConfig: {
    country: "",
    topic: "",
    aiModel: "gpt-3.5-turbo",
  },
  isLoading: false,
}

// DOM elements
const elements = {
  // Configuration
  countrySelect: document.getElementById("countrySelect"),
  topicSelect: document.getElementById("topicSelect"),
  modelSelect: document.getElementById("modelSelect"),

  // Chat
  chatMessages: document.getElementById("chatMessages"),
  messageInput: document.getElementById("messageInput"),
  sendButton: document.getElementById("sendButton"),
  newChatBtn: document.getElementById("newChatBtn"),
  
  // FAQ
  faqSection: document.getElementById("faqSection"),
  faqCards: document.querySelectorAll(".faq-card"),
  
  // History
  chatHistoryList: document.getElementById("chatHistoryList"),
  
  // Tools
  toolBtns: document.querySelectorAll(".tool-btn"),
  toolsModal: document.getElementById("toolsModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  closeModal: document.getElementById("closeModal"),
}

// Chat history management
class ChatHistory {
  constructor() {
    this.chats = this.loadFromStorage() || [];
    this.render();
  }

  createNewChat() {
    const chatId = 'chat_' + Date.now();
    const newChat = {
      id: chatId,
      title: '새로운 대화',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.chats.unshift(newChat);
    this.setActiveChat(chatId);
    this.saveToStorage();
    this.render();
    this.clearChatMessages();
    this.showFAQ();
    
    return chatId;
  }

  setActiveChat(chatId) {
    AppState.currentChatId = chatId;
    this.render();
    const chat = this.chats.find(c => c.id === chatId);
    if (chat) {
      this.loadChatMessages(chat);
    }
  }

  addMessage(message) {
    const currentChat = this.chats.find(c => c.id === AppState.currentChatId);
    if (currentChat) {
      currentChat.messages.push(message);
      currentChat.updatedAt = new Date();
      
      // Update title if it's the first user message
      if (currentChat.messages.length === 1 && message.type === 'user') {
        currentChat.title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
      }
      
      this.saveToStorage();
      this.render();
    }
  }

  loadChatMessages(chat) {
    this.clearChatMessages();
    if (chat.messages.length === 0) {
      this.showFAQ();
    } else {
      this.hideFAQ();
      chat.messages.forEach(message => {
        this.displayMessage(message.content, message.type, false);
      });
    }
  }

  clearChatMessages() {
    elements.chatMessages.innerHTML = `
      <div class="welcome-message">
        <div class="ai-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <h3>안녕하세요! Ready To Go 챗봇입니다. 무엇을 도와드릴까요?</h3>
        </div>
      </div>
    `;
  }

  showFAQ() {
    elements.faqSection.style.display = 'block';
  }

  hideFAQ() {
    elements.faqSection.style.display = 'none';
  }

  displayMessage(content, type, addToHistory = true) {
    this.hideFAQ();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (type === 'user') {
      avatar.innerHTML = '<i class="fas fa-user"></i>';
    } else {
      avatar.innerHTML = '<i class="fas fa-robot"></i>';
    }
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    if (addToHistory) {
      this.addMessage({ content, type, timestamp: new Date() });
    }
  }

  render() {
    elements.chatHistoryList.innerHTML = '';
    
    this.chats.forEach(chat => {
      const historyItem = document.createElement('button');
      historyItem.className = `history-item ${chat.id === AppState.currentChatId ? 'active' : ''}`;
      historyItem.textContent = chat.title;
      historyItem.onclick = () => this.setActiveChat(chat.id);
      
      elements.chatHistoryList.appendChild(historyItem);
    });
  }

  saveToStorage() {
    localStorage.setItem('chatHistory', JSON.stringify(this.chats));
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('chatHistory');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return null;
    }
  }
}

// Initialize chat history
const chatHistory = new ChatHistory();

// Initialize application
function initApp() {
  setupEventListeners();
  
  // Create initial chat if none exists
  if (chatHistory.chats.length === 0) {
    chatHistory.createNewChat();
  } else {
    // Set the first chat as active
    chatHistory.setActiveChat(chatHistory.chats[0].id);
  }
}

// Setup event listeners
function setupEventListeners() {
  // New chat button
  elements.newChatBtn.addEventListener('click', () => {
    chatHistory.createNewChat();
  });

  // Configuration changes
  elements.countrySelect.addEventListener('change', (e) => {
    AppState.chatConfig.country = e.target.value;
    updateFAQQuestions();
  });

  elements.topicSelect.addEventListener('change', (e) => {
    AppState.chatConfig.topic = e.target.value;
    updateFAQQuestions();
  });

  elements.modelSelect.addEventListener('change', (e) => {
    AppState.chatConfig.aiModel = e.target.value;
  });

  // Chat input
  elements.messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  elements.sendButton.addEventListener('click', sendMessage);

  // FAQ cards
  elements.faqCards.forEach(card => {
    card.addEventListener('click', () => {
      const question = card.dataset.question;
      sendFAQQuestion(question);
    });
  });

  // Tools
  elements.toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      openToolModal(tool);
    });
  });

  // Modal
  elements.closeModal.addEventListener('click', closeToolModal);
  elements.toolsModal.addEventListener('click', (e) => {
    if (e.target === elements.toolsModal) {
      closeToolModal();
    }
  });
}

// Send message
async function sendMessage() {
  const message = elements.messageInput.value.trim();
  if (!message) return;

  // Clear input
  elements.messageInput.value = '';
  elements.sendButton.disabled = true;

  // Display user message
  chatHistory.displayMessage(message, 'user');

  // Show typing indicator
  showTypingIndicator();

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate AI response
    const response = generateAIResponse(message);
    
    // Hide typing indicator and show response
    hideTypingIndicator();
    chatHistory.displayMessage(response, 'assistant');
    
  } catch (error) {
    hideTypingIndicator();
    chatHistory.displayMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.', 'assistant');
  } finally {
    elements.sendButton.disabled = false;
  }
}

// Send FAQ question
function sendFAQQuestion(question) {
  elements.messageInput.value = question;
  sendMessage();
}

// Generate AI response (placeholder)
function generateAIResponse(message) {
  const { country, topic } = AppState.chatConfig;
  
  const responses = {
    visa: [
      `${country}의 비자 신청을 위해서는 먼저 여권이 필요하며, 온라인으로 신청할 수 있습니다.`,
      `${country} 비자 신청 시 필요한 서류는 여권, 사진, 재정증명서, 여행계획서 등입니다.`,
      `${country} 비자 처리 기간은 보통 5-10일 정도 소요되며, 성수기에는 더 오래 걸릴 수 있습니다.`
    ],
    여행: [
      `${country}은 아름다운 관광지로 유명합니다. 현지 문화를 존중하며 여행하시기 바랍니다.`,
      `${country} 여행 시 추천 명소는 현지 관광청 웹사이트에서 확인하실 수 있습니다.`,
      `${country} 여행을 위한 예산 계획을 세우시는 것을 추천드립니다.`
    ],
    숙박: [
      `${country}에서는 다양한 숙박 옵션이 있습니다. 호텔, 민박, 에어비앤비 등을 고려해보세요.`,
      `${country} 숙박 예약 시 위치, 가격, 리뷰를 꼼꼼히 확인하시기 바랍니다.`,
      `${country}의 성수기에는 미리 숙박을 예약하시는 것이 좋습니다.`
    ],
    교통: [
      `${country}의 대중교통은 잘 발달되어 있어 여행하기 편리합니다.`,
      `${country} 내 이동 시 교통카드나 교통앱을 이용하시면 편리합니다.`,
      `${country}의 택시나 우버 서비스도 잘 되어 있습니다.`
    ],
    문화: [
      `${country}의 문화를 이해하고 존중하는 것이 중요합니다.`,
      `${country}의 전통과 관습을 미리 알아보시면 더 좋은 여행이 될 것입니다.`,
      `${country} 현지인들과의 소통을 위해 기본적인 인사말을 배워보세요.`
    ],
    안전: [
      `${country} 여행 시 안전을 위해 여행자 보험 가입을 권장합니다.`,
      `${country}의 응급 연락처와 영사관 정보를 미리 확인해두세요.`,
      `${country} 여행 중 귀중품 관리에 주의하시기 바랍니다.`
    ],
    default: [
      `${country}에 대한 더 자세한 정보가 필요하시면 관련 기관에 문의해주세요.`,
      '죄송하지만 정확한 답변을 드리기 어렵습니다. 더 구체적으로 질문해주시면 도움을 드릴 수 있습니다.',
      '궁금한 점이 있으시면 언제든지 질문해주세요. 최선을 다해 도움을 드리겠습니다.'
    ]
  };

  // Select appropriate response category
  let category = 'default';
  if (topic && responses[topic]) {
    category = topic;
  } else {
    // Try to match keywords in the message
    const keywords = {
      'visa': ['비자', '비자 신청', '비자 발급'],
      '여행': ['여행', '관광', '명소', '여행지'],
      '숙박': ['숙박', '호텔', '민박', '에어비앤비'],
      '교통': ['교통', '대중교통', '택시', '지하철'],
      '문화': ['문화', '관습', '전통', '예절'],
      '안전': ['안전', '치안', '보험', '응급']
    };

    for (const [key, words] of Object.entries(keywords)) {
      if (words.some(word => message.includes(word))) {
        category = key;
        break;
      }
    }
  }

  const categoryResponses = responses[category];
  const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  
  return randomResponse;
}

// Show typing indicator
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message assistant typing-message';
  typingDiv.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="typing-indicator">
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  
  elements.chatMessages.appendChild(typingDiv);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
  const typingMessage = elements.chatMessages.querySelector('.typing-message');
  if (typingMessage) {
    typingMessage.remove();
  }
}

// Update FAQ questions based on selected country
function updateFAQQuestions() {
  const country = AppState.chatConfig.country || 'America';
  
  const faqQuestions = [
    `${country}에 여행하려면 어떤 준비가 필요한가요?`,
    `${country} 비자를 받는 데 얼마나 걸리나요?`,
    `${country} 비자를 신청하려면 어떤 서류가 필요한가요?`,
    `${country}에 갈 수 있는 항공편을 알려주세요.`
  ];

  elements.faqCards.forEach((card, index) => {
    if (faqQuestions[index]) {
      card.dataset.question = faqQuestions[index];
      card.querySelector('span').textContent = faqQuestions[index];
    }
  });
}

// Tool modal functions
function openToolModal(tool) {
  elements.toolsModal.style.display = 'flex';
  
  const toolTitles = {
    weather: '날씨 정보',
    exchange: '환율 정보',
    flights: '항공편 검색',
    checklist: '여행 체크리스트'
  };

  elements.modalTitle.textContent = toolTitles[tool] || '도구';
  
  // Load tool content
  loadToolContent(tool);
}

function closeToolModal() {
  elements.toolsModal.style.display = 'none';
}

function loadToolContent(tool) {
  elements.modalBody.innerHTML = '<div class="loading"><div class="spinner"></div><p>로딩 중...</p></div>';
  
  setTimeout(() => {
    switch (tool) {
      case 'weather':
        loadWeatherContent();
        break;
      case 'exchange':
        loadExchangeContent();
        break;
      case 'flights':
        loadFlightsContent();
        break;
      case 'checklist':
        loadChecklistContent();
        break;
      default:
        elements.modalBody.innerHTML = '<p>준비 중인 기능입니다.</p>';
    }
  }, 1000);
}

function loadWeatherContent() {
  const country = AppState.chatConfig.country || '서울';
  elements.modalBody.innerHTML = `
    <div class="weather-content">
      <div class="current-weather">
        <div class="weather-location">${country}</div>
        <div class="weather-main">
          <i class="fas fa-sun weather-icon"></i>
          <span class="temperature">22°C</span>
        </div>
        <div class="weather-condition">맑음</div>
      </div>
      <div class="weather-details">
        <div class="detail-item">
          <i class="fas fa-tint"></i>
          <div>습도</div>
          <div>65%</div>
        </div>
        <div class="detail-item">
          <i class="fas fa-wind"></i>
          <div>바람</div>
          <div>5 km/h</div>
        </div>
      </div>
    </div>
  `;
}

function loadExchangeContent() {
  elements.modalBody.innerHTML = `
    <div class="exchange-content">
      <div class="exchange-form">
        <div class="currency-row">
          <div class="form-group">
            <label>From</label>
            <select>
              <option>KRW - 한국 원</option>
              <option>USD - 미국 달러</option>
              <option>EUR - 유로</option>
              <option>JPY - 일본 엔</option>
            </select>
          </div>
          <div class="form-group">
            <label>To</label>
            <select>
              <option>USD - 미국 달러</option>
              <option>KRW - 한국 원</option>
              <option>EUR - 유로</option>
              <option>JPY - 일본 엔</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>금액</label>
          <input type="number" value="1000" placeholder="금액을 입력하세요">
        </div>
        <button class="exchange-btn">환율 조회</button>
      </div>
      <div class="exchange-result">
        <div class="conversion-text">1,000 KRW = 0.75 USD</div>
        <div class="rate-text">1 USD = 1,333.33 KRW</div>
      </div>
    </div>
  `;
}

function loadFlightsContent() {
  elements.modalBody.innerHTML = `
    <div class="flights-content">
      <div class="form-group">
        <label>출발지</label>
        <input type="text" placeholder="출발 도시를 입력하세요">
      </div>
      <div class="form-group">
        <label>도착지</label>
        <input type="text" placeholder="도착 도시를 입력하세요">
      </div>
      <div class="currency-row">
        <div class="form-group">
          <label>출발일</label>
          <input type="date">
        </div>
        <div class="form-group">
          <label>도착일</label>
          <input type="date">
        </div>
      </div>
      <button class="exchange-btn">항공편 검색</button>
    </div>
  `;
}

function loadChecklistContent() {
  elements.modalBody.innerHTML = `
    <div class="checklist-content">
      <div class="form-group">
        <input type="text" placeholder="체크리스트 항목을 추가하세요">
        <button class="exchange-btn">추가</button>
      </div>
      <div style="margin-top: 1rem;">
        <div style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox"> 여권 확인
          </label>
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox"> 비자 신청
          </label>
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox"> 항공편 예약
          </label>
        </div>
        <div style="margin-bottom: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox"> 숙박 예약
          </label>
        </div>
      </div>
    </div>
  `;
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);

// Export for use in other modules
window.AppState = AppState;
window.chatHistory = chatHistory;