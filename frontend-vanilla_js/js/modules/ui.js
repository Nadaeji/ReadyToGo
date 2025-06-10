// UI 렌더링 - 깔끔한 미니멀 스타일
export class UIRenderer {
  constructor(state, dom, api) {
    this.state = state
    this.dom = dom
    this.api = api
    this.documentSources = []
    this.initDarkMode()
  }

  // 다크모드 초기화
  initDarkMode() {
    const darkModeToggle = document.getElementById("darkModeToggle")
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
    }

    darkModeToggle?.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark")
      const isDark = document.documentElement.classList.contains("dark")
      localStorage.setItem("theme", isDark ? "dark" : "light")
    })
  }

  // 셀렉트 박스 렌더링
  renderSelects(countries, topics, models) {
    const countryMap = this.api?.countryMap || {}
    const topicMap = this.api?.topicMap || {}

    this.dom.populateSelect(this.dom.$.country, countries, countryMap)
    this.dom.populateSelect(this.dom.$.topic, topics, topicMap)
    this.renderModels(models)

    // 기본값 설정
    this.dom.$.country.value = this.state.country
    this.dom.$.topic.value = this.state.topic
    this.dom.$.model.value = this.state.model
  }

  renderModels(models) {
    const select = this.dom.$.model
    if (!select) return

    this.dom.clear(select)
    const modelList = models.available_models || models

    modelList.forEach((model) => {
      const option = document.createElement("option")
      option.value = model.id
      option.textContent = model.name
      select.appendChild(option)
    })
  }

  // 채팅 리스트 렌더링
  renderChatList() {
    const container = this.dom.$.chatList
    if (!container) return

    if (this.state.chats.length === 0) {
      container.innerHTML = `
                <div class="text-gray-400 dark:text-gray-500 text-sm text-center py-8 animate-fade-in">
                    <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2 opacity-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                    </div>
                    대화가 없습니다
                </div>
            `
      return
    }

    container.innerHTML = this.state.chats
      .map(
        (chat, index) => `
            <button class="chat-list-item text-left px-3 py-2 rounded-lg text-gray-800 dark:text-gray-200 w-full transition-all ${
              chat.id === this.state.activeChat ? "active" : ""
            }" data-chat-id="${chat.id}">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-accent-500 rounded-md flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        ${index + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium truncate text-sm">
                            ${chat.title}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            ${chat.messages.length}개 메시지
                        </div>
                    </div>
                </div>
            </button>
        `,
      )
      .join("")
  }

  // 채팅 메시지 렌더링
  renderChat() {
    const container = this.dom.$.chatMessages
    if (!container) return

    const activeChat = this.state.getActiveChat()

    if (!activeChat) {
      container.innerHTML = `
                <div id="emptyState" class="text-center text-gray-500 dark:text-gray-400 py-16 animate-fade-in">
                    <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                    </div>
                    <p class="font-medium mb-1">AI와 대화를 시작해보세요</p>
                    <p class="text-sm opacity-75">'새 대화 시작' 버튼을 클릭하세요</p>
                </div>
            `
      return
    }

    container.innerHTML = activeChat.messages
      .map(
        (message, index) => `
            <div class="chat-message ${message.role} animate-fade-in">
                ${this.renderMessage(message)}
            </div>
        `,
      )
      .join("")

    this.dom.scrollToBottom(this.dom.$.chatArea)
  }

  renderMessage(message) {
    if (message.role === "bot") {
      return `
                <div class="flex items-start gap-3 max-w-[85%]">
                    <div class="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <img src="assets/mascot.png" class="w-4 h-4" alt="bot" onerror="this.style.display='none'">
                        <span class="text-white text-xs font-medium" style="display: none;">🤖</span>
                    </div>
                    <div class="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 max-w-full">
                        <div class="whitespace-pre-wrap break-words text-sm">${message.text}</div>
                    </div>
                </div>
            `
    } else {
      return `
                <div class="flex items-start gap-3 max-w-[85%] ml-auto justify-end">
                    <div class="bg-accent-500 text-white px-4 py-3 rounded-lg max-w-full">
                        <div class="whitespace-pre-wrap break-words text-sm">${message.text}</div>
                    </div>
                    <div class="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        나
                    </div>
                </div>
            `
    }
  }

  // FAQ 렌더링
  renderFAQ(examples, sources = []) {
    if (examples.length === 0) {
      this.dom.hide(this.dom.$.faqSection)
      return
    }

    this.dom.show(this.dom.$.faqSection)

    this.dom.$.faqCards.innerHTML = `
            <div class="faq-cards-wrapper">
                ${examples
                  .map(
                    (question, index) => `
                    <button class="faq-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-left flex-shrink-0 hover:shadow-md focus:outline-none transition-all group">
                        <div class="flex items-start gap-3">
                            <div class="w-6 h-6 bg-accent-500 rounded-md flex items-center justify-center flex-shrink-0">
                                <span class="text-white text-xs font-medium">Q</span>
                            </div>
                            <div class="flex-1">
                                <div class="faq-question text-accent-600 dark:text-accent-400 font-medium mb-1 text-sm leading-relaxed">
                                    ${question}
                                </div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    클릭하여 질문하기
                                </div>
                            </div>
                        </div>
                    </button>
                `,
                  )
                  .join("")}
            </div>
        `

    // 소스 정보 표시
    this.documentSources = sources
    if (sources.length > 0) {
      if (this.dom.$.sourcesCount) {
        this.dom.$.sourcesCount.textContent = sources.length
      }
      if (this.dom.$.sourcesInfo) {
        this.dom.show(this.dom.$.sourcesInfo)
      }
    } else {
      if (this.dom.$.sourcesInfo) {
        this.dom.hide(this.dom.$.sourcesInfo)
      }
    }
  }

  // 로딩 표시
  showLoading() {
    if (!this.dom.$.chatMessages) return

    const loadingDiv = document.createElement("div")
    loadingDiv.id = "loadingMessage"
    loadingDiv.className = "chat-message bot animate-fade-in"
    loadingDiv.innerHTML = `
            <div class="flex items-start gap-3 max-w-[85%]">
                <div class="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div class="spinner"></div>
                </div>
                <div class="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div class="flex items-center gap-2">
                        <span class="loading-dots text-sm">AI가 답변을 생성하고 있습니다</span>
                    </div>
                </div>
            </div>
        `
    this.dom.$.chatMessages.appendChild(loadingDiv)
    this.dom.scrollToBottom(this.dom.$.chatArea)
  }

  hideLoading() {
    document.getElementById("loadingMessage")?.remove()
  }

  // 인터페이스 상태 업데이트
  updateInterface() {
    const isActive = this.state.activeChat !== null
    const isLoading = this.state.loading

    // 입력 폼 업데이트
    if (this.dom.$.messageInput) {
      this.dom.$.messageInput.disabled = !isActive || isLoading
      this.dom.$.messageInput.placeholder = isActive ? "메시지를 입력하세요..." : "새 대화 시작 버튼을 눌러주세요"
    }

    // 전송 버튼 업데이트
    if (this.dom.$.sendBtn) {
      this.dom.$.sendBtn.disabled = !isActive || isLoading

      if (isLoading) {
        this.dom.$.sendBtn.innerHTML = `
                    <div class="spinner"></div>
                    전송 중...
                `
      } else {
        this.dom.$.sendBtn.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    전송
                `
      }
    }
  }

  // 소스 모달
  showSourcesModal() {
    if (!this.documentSources.length || !this.dom.$.sourcesList) return

    this.dom.$.sourcesList.innerHTML = this.documentSources
      .map(
        (source, index) => `
            <div class="flex items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 -mx-2 transition-colors">
                <div class="w-5 h-5 bg-accent-500 rounded flex items-center justify-center text-white text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
                    ${index + 1}
                </div>
                <div class="flex-1">
                    <a href="${source}" target="_blank" class="text-sm text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 font-medium break-all hover:underline transition-colors">
                        ${this.getDomain(source)}
                    </a>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        공식 문서 • 클릭하여 원본 보기
                    </div>
                </div>
            </div>
        `,
      )
      .join("")

    this.dom.show(this.dom.$.sourcesModal)
  }

  hideSourcesModal() {
    this.dom.hide(this.dom.$.sourcesModal)
  }

  // 환율 탭 렌더링
  async renderExchangeTab() {
    try {
      const exchangeData = await this.api.getExchangeRates()
      const container = document.getElementById("exchangeContent")
      if (!container) return

      const html = `
      <!-- 환전 계산기 섹션 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
            <span class="text-white text-xs">🧮</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">환전 계산기</h3>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- 입력 섹션 -->
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">보내는 금액</label>
              <div class="flex gap-2">
                <select id="fromCurrency" class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 font-medium min-w-[80px] text-sm">
                  <option value="KRW">KRW</option>
                  ${Object.keys(exchangeData.rates || {})
                    .map((currency) => `<option value="${currency}">${currency}</option>`)
                    .join("")}
                </select>
                <input 
                  type="number" 
                  id="fromAmount" 
                  placeholder="금액을 입력하세요" 
                  class="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors text-sm"
                  value="100000"
                />
              </div>
            </div>
            
            <div class="flex justify-center">
              <button id="swapCurrencies" class="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-md flex items-center justify-center text-white transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                </svg>
              </button>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">받는 금액</label>
              <div class="flex gap-2">
                <select id="toCurrency" class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 font-medium min-w-[80px] text-sm">
                  <option value="USD">USD</option>
                  <option value="KRW">KRW</option>
                  ${Object.keys(exchangeData.rates || {})
                    .map((currency) => `<option value="${currency}">${currency}</option>`)
                    .join("")}
                </select>
                <div class="flex-1 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md">
                  <div id="toAmount" class="text-sm font-semibold text-green-700 dark:text-green-400">계산 중...</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 결과 섹션 -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">환전 정보</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">환율</span>
                <span id="exchangeRate" class="font-medium text-gray-900 dark:text-gray-100">-</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">수수료 (예상)</span>
                <span class="font-medium text-gray-900 dark:text-gray-100">1-3%</span>
              </div>
              <div class="border-t border-blue-200 dark:border-blue-700 pt-2">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">실제 받을 금액</span>
                  <span id="actualAmount" class="font-semibold text-blue-700 dark:text-blue-400">-</span>
                </div>
              </div>
            </div>
            
            <!-- 빠른 금액 버튼 -->
            <div class="mt-3">
              <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">빠른 선택</div>
              <div class="grid grid-cols-3 gap-1">
                <button class="quick-amount px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" data-amount="100000">10만원</button>
                <button class="quick-amount px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" data-amount="500000">50만원</button>
                <button class="quick-amount px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" data-amount="1000000">100만원</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 기존 환율 정보 카드들 -->
      <div class="mb-3">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">주요 통화 환율</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${Object.entries(exchangeData.rates || {})
          .map(
            ([currency, info]) => `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer card-hover" onclick="window.travelBotApp.ui.selectCurrency('${currency}')">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                            <span class="text-white font-medium text-xs">${currency}</span>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">${currency}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400">실시간 환율</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold ${info.rate ? "text-green-600 dark:text-green-400" : "text-red-500"}">
                            ${info.rate ? info.rate.toFixed(2) : "N/A"}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">KRW</div>
                    </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-md p-2">
                    <div class="flex justify-between text-xs">
                        <span class="text-gray-600 dark:text-gray-400">변동률</span>
                        <span class="font-medium ${Math.random() > 0.5 ? "text-green-600" : "text-red-500"}">
                            ${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 2).toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        `,
          )
          .join("")}
      </div>
      <div class="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 mb-3">
            <div class="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                <span class="text-white text-xs">📊</span>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">환율 정보</h3>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>• 기준 통화: ${exchangeData.base_currency || "KRW"}</p>
            <p>• 업데이트: 실시간</p>
            <p>• 데이터 제공: 한국은행</p>
            <p>• 실제 환전 시 은행 수수료가 추가될 수 있습니다</p>
        </div>
      </div>
    `
      container.innerHTML = html

      // 환전 계산기 이벤트 리스너 추가
      this.initExchangeCalculator(exchangeData)
    } catch (error) {
      console.error("환율 정보 렌더링 실패:", error)
      const container = document.getElementById("exchangeContent")
      if (container) {
        container.innerHTML = `
        <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4 opacity-50">
                <span class="text-lg">💱</span>
            </div>
            <div class="text-gray-500 dark:text-gray-400">환율 정보를 불러올 수 없습니다.</div>
        </div>
      `
      }
    }
  }

  // 환전 계산기 초기화
  initExchangeCalculator(exchangeData) {
    const fromAmount = document.getElementById("fromAmount")
    const fromCurrency = document.getElementById("fromCurrency")
    const toCurrency = document.getElementById("toCurrency")
    const toAmount = document.getElementById("toAmount")
    const exchangeRate = document.getElementById("exchangeRate")
    const actualAmount = document.getElementById("actualAmount")
    const swapBtn = document.getElementById("swapCurrencies")
    const quickAmountBtns = document.querySelectorAll(".quick-amount")

    if (!fromAmount || !fromCurrency || !toCurrency) return

    // 환전 계산 함수
    const calculateExchange = () => {
      const amount = Number.parseFloat(fromAmount.value) || 0
      const from = fromCurrency.value
      const to = toCurrency.value

      if (amount <= 0) {
        toAmount.textContent = "0"
        exchangeRate.textContent = "-"
        actualAmount.textContent = "-"
        return
      }

      let rate = 1
      let result = amount

      // KRW 기준으로 계산
      if (from === "KRW" && to !== "KRW") {
        // KRW -> 외화
        const targetRate = exchangeData.rates?.[to]?.rate
        if (targetRate) {
          rate = 1 / targetRate
          result = amount * rate
        }
      } else if (from !== "KRW" && to === "KRW") {
        // 외화 -> KRW
        const sourceRate = exchangeData.rates?.[from]?.rate
        if (sourceRate) {
          rate = sourceRate
          result = amount * rate
        }
      } else if (from !== "KRW" && to !== "KRW") {
        // 외화 -> 외화
        const sourceRate = exchangeData.rates?.[from]?.rate
        const targetRate = exchangeData.rates?.[to]?.rate
        if (sourceRate && targetRate) {
          // 먼저 KRW로 변환 후 목표 통화로 변환
          const krwAmount = amount * sourceRate
          rate = 1 / targetRate
          result = krwAmount * rate
        }
      } else if (from === to) {
        // 같은 통화
        rate = 1
        result = amount
      }

      // 결과 표시
      toAmount.textContent = result.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

      exchangeRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`

      // 수수료 차감 (2% 가정)
      const feeRate = 0.02
      const actualResult = result * (1 - feeRate)
      actualAmount.textContent = `${actualResult.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${to}`
    }

    // 이벤트 리스너
    fromAmount.addEventListener("input", calculateExchange)
    fromCurrency.addEventListener("change", calculateExchange)
    toCurrency.addEventListener("change", calculateExchange)

    // 통화 스왑
    swapBtn.addEventListener("click", () => {
      const fromValue = fromCurrency.value
      const toValue = toCurrency.value
      fromCurrency.value = toValue
      toCurrency.value = fromValue
      calculateExchange()
    })

    // 빠른 금액 선택
    quickAmountBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        fromAmount.value = btn.dataset.amount
        calculateExchange()
      })
    })

    // 초기 계산
    calculateExchange()
  }

  // 통화 선택 헬퍼 메서드
  selectCurrency(currency) {
    const toCurrency = document.getElementById("toCurrency")
    if (toCurrency) {
      toCurrency.value = currency
      const event = new Event("change")
      toCurrency.dispatchEvent(event)
    }
  }

  // 날씨 탭 렌더링
  async renderWeatherTab() {
    try {
      const country = this.state.get("country")
      if (!country) {
        const container = document.getElementById("weatherContent")
        if (container) {
          container.innerHTML = `
            <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span class="text-white text-lg">🌤️</span>
                </div>
                <div class="text-gray-500 dark:text-gray-400 mb-4">국가를 선택하면 날씨 정보를 확인할 수 있습니다.</div>
            </div>
          `
        }
        return
      }

      const weatherData = await this.api.getWeatherInfo(country)
      const container = document.getElementById("weatherContent")
      if (!container) return

      if (!weatherData.weather_info || weatherData.weather_info.length === 0) {
        container.innerHTML = `
          <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4 opacity-50">
                  <span class="text-lg">🌤️</span>
              </div>
              <div class="text-gray-500 dark:text-gray-400">해당 국가의 날씨 정보를 찾을 수 없습니다.</div>
          </div>
        `
        return
      }

      const html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${weatherData.weather_info
              .map(
                (weather, index) => `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all card-hover">
                    <div class="text-center mb-3">
                        <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <span class="text-white text-lg">${this.getWeatherIcon(weather.description)}</span>
                        </div>
                        <h3 class="font-semibold text-gray-900 dark:text-white">${weather.city}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${weather.country}</p>
                    </div>
                    <div class="text-center mb-3">
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">${weather.temperature}°C</div>
                        <div class="text-gray-600 dark:text-gray-400 font-medium text-sm">${weather.description}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-md p-3 space-y-2">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">습도</span>
                            <span class="font-medium">${weather.humidity}%</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">체감온도</span>
                            <span class="font-medium">${weather.feels_like || weather.temperature}°C</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">풍속</span>
                            <span class="font-medium">${weather.wind_speed || "N/A"} m/s</span>
                        </div>
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
      `
      container.innerHTML = html
    } catch (error) {
      console.error("날씨 정보 렌더링 실패:", error)
      const container = document.getElementById("weatherContent")
      if (container) {
        container.innerHTML = `
          <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4 opacity-50">
                  <span class="text-lg">🌤️</span>
              </div>
              <div class="text-gray-500 dark:text-gray-400">날씨 정보를 불러올 수 없습니다.</div>
          </div>
        `
      }
    }
  }

  // 항공권 탭 렌더링
  async renderFlightTab() {
    try {
      const country = this.state.get("country")
      const container = document.getElementById("flightContent")
      if (!container) return

      if (!country) {
        container.innerHTML = `
          <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div class="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span class="text-white text-lg">✈️</span>
              </div>
              <div class="text-gray-500 dark:text-gray-400 mb-4">국가를 선택하면 항공권 정보를 확인할 수 있습니다.</div>
          </div>
        `
        return
      }

      // 항공권 정보 (임시 데이터)
      const flightData = {
        routes: [
          {
            from: "ICN",
            to: this.getAirportCode(country),
            airline: "대한항공",
            price: Math.floor(Math.random() * 1000000) + 500000,
            duration: "12시간 30분",
            stops: 0,
          },
          {
            from: "ICN",
            to: this.getAirportCode(country),
            airline: "아시아나항공",
            price: Math.floor(Math.random() * 1000000) + 500000,
            duration: "13시간 15분",
            stops: 1,
          },
          {
            from: "ICN",
            to: this.getAirportCode(country),
            airline: "에어프랑스",
            price: Math.floor(Math.random() * 1000000) + 600000,
            duration: "14시간 45분",
            stops: 1,
          },
        ],
      }

      const html = `
        <div class="space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-3">
                    <div class="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center">
                        <span class="text-white text-xs">🔍</span>
                    </div>
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">항공편 검색</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">출발지</label>
                        <div class="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div class="font-medium text-sm">인천국제공항 (ICN)</div>
                            <div class="text-xs text-gray-500">서울, 대한민국</div>
                        </div>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">도착지</label>
                        <div class="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div class="font-medium text-sm">${this.getAirportCode(country)}</div>
                            <div class="text-xs text-gray-500">${this.api.countryMap[country] || country}</div>
                        </div>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">출발일</label>
                        <div class="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div class="font-medium text-sm">${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                            <div class="text-xs text-gray-500">1주일 후</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="space-y-3">
                ${flightData.routes
                  .map(
                    (flight, index) => `
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all card-hover">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                    <span class="text-white font-medium text-sm">${flight.airline.charAt(0)}</span>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-gray-900 dark:text-white">${flight.airline}</h4>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">${flight.from} → ${flight.to}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                    ₩${flight.price.toLocaleString()}
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">편도</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-700 rounded-md p-3">
                            <div class="text-center">
                                <div class="text-sm text-gray-600 dark:text-gray-400">소요시간</div>
                                <div class="font-medium text-sm">${flight.duration}</div>
                            </div>
                            <div class="text-center">
                                <div class="text-sm text-gray-600 dark:text-gray-400">경유</div>
                                <div class="font-medium text-sm">${flight.stops === 0 ? "직항" : `${flight.stops}회 경유`}</div>
                            </div>
                            <div class="text-center">
                                <div class="text-sm text-gray-600 dark:text-gray-400">좌석</div>
                                <div class="font-medium text-sm text-green-600">예약 가능</div>
                            </div>
                        </div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>
      `
      container.innerHTML = html
    } catch (error) {
      console.error("항공권 정보 렌더링 실패:", error)
      const container = document.getElementById("flightContent")
      if (container) {
        container.innerHTML = `
          <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4 opacity-50">
                  <span class="text-lg">✈️</span>
              </div>
              <div class="text-gray-500 dark:text-gray-400">항공권 정보를 불러올 수 없습니다.</div>
          </div>
        `
      }
    }
  }

  // 체크리스트 렌더링
  async renderChecklists() {
    try {
      const country = this.state.get("country")
      const topic = this.state.get("topic")

      if (!country || !topic) {
        const container = document.getElementById("checklistList")
        if (container) {
          container.innerHTML = `
            <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span class="text-white text-lg">✅</span>
                </div>
                <div class="text-gray-500 dark:text-gray-400 mb-4">국가와 주제를 선택하면 체크리스트를 확인할 수 있습니다.</div>
            </div>
          `
        }
        return
      }

      const data = await this.api.getChecklists(country, topic)
      this.renderChecklistList(data.checklists || [])
    } catch (error) {
      console.error("체크리스트 렌더링 실패:", error)
    }
  }

  renderChecklistList(checklists) {
    const container = document.getElementById("checklistList")
    if (!container) return

    if (checklists.length === 0) {
      container.innerHTML = `
        <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4 opacity-50">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
            </div>
            <div class="text-gray-500 dark:text-gray-400">해당 조건의 체크리스트가 없습니다.</div>
        </div>
      `
      return
    }

    const html = checklists
      .map(
        (checklist, index) => `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all card-hover" 
             onclick="window.travelBotApp.showChecklistDetail(${checklist.id})">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span class="text-white text-sm">✅</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold mb-2 text-gray-900 dark:text-white">${checklist.name}</h4>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">${checklist.description}</p>
                    <div class="flex justify-between items-center">
                        <div class="flex gap-3">
                            <span class="text-sm text-blue-600 dark:text-blue-400 font-medium">전체 ${checklist.items_count}개</span>
                            <span class="text-sm text-red-600 dark:text-red-400 font-medium">필수 ${checklist.required_items_count}개</span>
                        </div>
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    `,
      )
      .join("")

    container.innerHTML = html
  }

  // 커뮤니티 렌더링
  async renderCommunity() {
    try {
      const country = this.state.get("country")
      const topic = this.state.get("topic")

      const filters = {}
      if (country) filters.country = country
      if (topic) filters.topic = topic
      filters.limit = 10
      filters.sort = "recent"

      const data = await this.api.getCommunityPosts(filters)
      this.renderCommunityPosts(data.posts || [])
    } catch (error) {
      console.error("커뮤니티 렌더링 실패:", error)
    }
  }

  renderCommunityPosts(posts) {
    const container = document.getElementById("communityPosts")
    if (!container) return

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span class="text-white text-lg">👥</span>
            </div>
            <div class="text-gray-500 dark:text-gray-400 mb-4">아직 작성된 게시글이 없습니다.</div>
            <button onclick="window.travelBotApp.showPostForm()" 
                    class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                첫 번째 게시글 작성하기
            </button>
        </div>
      `
      return
    }

    const html = `
      <div class="mb-4">
          <button onclick="window.travelBotApp.showPostForm()" 
                  class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              새 게시글 작성
          </button>
      </div>
      <div class="space-y-3">
          ${posts.map((post, index) => this.renderCommunityPost(post, index)).join("")}
      </div>
    `

    container.innerHTML = html
  }

  renderCommunityPost(post, index) {
    const typeColors = {
      review: "bg-green-500",
      question: "bg-blue-500",
      tip: "bg-yellow-500",
      info: "bg-purple-500",
    }

    const typeIcons = {
      review: "⭐",
      question: "❓",
      tip: "💡",
      info: "ℹ️",
    }

    const typeColor = typeColors[post.post_type] || "bg-gray-500"
    const typeIcon = typeIcons[post.post_type] || "📝"

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer card-hover"
           onclick="window.travelBotApp.showPostDetail(${post.id})">
          <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-2">
                  <div class="w-8 h-8 ${typeColor} rounded-lg flex items-center justify-center">
                      <span class="text-white text-sm">${typeIcon}</span>
                  </div>
                  <div>
                      <span class="px-2 py-1 text-xs rounded-full ${typeColor} text-white font-medium">
                          ${post.post_type_display}
                      </span>
                      ${post.rating ? `<div class="text-yellow-500 mt-1 text-sm">${"⭐".repeat(post.rating)}</div>` : ""}
                  </div>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                  ${new Date(post.created_at).toLocaleDateString()}
              </div>
          </div>
          <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">${post.title}</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed line-clamp-3">${post.content}</p>
          <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      ${post.views}
                  </span>
                  <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                      ${post.likes}
                  </span>
                  <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      ${post.comments_count}
                  </span>
              </div>
              <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-700 dark:text-gray-300 text-sm">${post.author_name}</span>
                  <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
              </div>
          </div>
      </div>
    `
  }

  // 헬퍼 메서드들
  getWeatherIcon(description) {
    const desc = description.toLowerCase()
    if (desc.includes("맑")) return "☀️"
    if (desc.includes("구름")) return "☁️"
    if (desc.includes("비")) return "🌧️"
    if (desc.includes("눈")) return "❄️"
    if (desc.includes("안개")) return "🌫️"
    return "🌤️"
  }

  getAirportCode(country) {
    const codes = {
      America: "LAX",
      Australia: "SYD",
      Austria: "VIE",
      Canada: "YVR",
      China: "PEK",
      France: "CDG",
      Germany: "FRA",
      Italy: "FCO",
      Japan: "NRT",
      "New Zealand": "AKL",
      Philippines: "MNL",
      Singapore: "SIN",
      UK: "LHR",
    }
    return codes[country] || "XXX"
  }

  getDomain(url) {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
    }
  }
}
