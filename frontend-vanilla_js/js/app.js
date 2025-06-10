// 메인 애플리케이션
import { AppState } from "./modules/state.js"
import { DOMManager } from "./modules/dom.js"
import { APIManager } from "./modules/api.js"
import { ChatManager } from "./modules/chat.js"
import { UIRenderer } from "./modules/ui.js"

class TravelBotApp {
  constructor() {
    this.state = new AppState()
    this.dom = new DOMManager()
    this.api = new APIManager()
    this.chat = new ChatManager(this.state, this.dom, this.api)
    this.ui = new UIRenderer(this.state, this.dom, this.api)

    this.init()
  }

  async init() {
    this.bindEvents()
    await this.loadInitialData()
    this.ui.updateInterface()
    this.initEnhancedTabNavigation()
  }

  bindEvents() {
    // 셀렉트 박스
    this.dom.$.country?.addEventListener("change", (e) => {
      this.state.set("country", e.target.value)
      this.state.set("topic", "")
      this.dom.$.topic.value = ""
      this.loadExamples()
    })

    this.dom.$.topic?.addEventListener("change", (e) => {
      this.state.set("topic", e.target.value)
      this.loadExamples()
    })

    this.dom.$.model?.addEventListener("change", (e) => {
      this.state.set("model", e.target.value)
    })

    // 버튼
    this.dom.$.newChatBtn?.addEventListener("click", async () => {
      const success = await this.chat.createNew()
      if (success) {
        this.ui.renderChatList()
        this.ui.renderChat()
        this.ui.updateInterface()
        // 채팅 탭으로 자동 전환
        this.switchTab("chat")
      }
    })

    this.dom.$.sendBtn?.addEventListener("click", (e) => {
      e.preventDefault()
      this.sendMessage()
    })

    this.dom.$.chatForm?.addEventListener("submit", (e) => {
      e.preventDefault()
      this.sendMessage()
    })

    // 채팅 선택
    this.dom.$.chatList?.addEventListener("click", (e) => {
      const chatItem = e.target.closest("[data-chat-id]")
      if (chatItem) {
        this.chat.select(Number.parseInt(chatItem.dataset.chatId))
        this.ui.renderChatList()
        this.ui.renderChat()
        this.ui.updateInterface()
        // 채팅 탭으로 자동 전환
        this.switchTab("chat")
      }
    })

    // FAQ 클릭
    this.dom.$.faqCards?.addEventListener("click", (e) => {
      const faqCard = e.target.closest(".faq-card")
      if (faqCard && this.state.activeChat !== null) {
        const question = faqCard.querySelector(".faq-question").textContent
        this.dom.$.messageInput.value = question
        this.sendMessage()
      }
    })

    // 소스 모달
    this.dom.$.sourcesBtn?.addEventListener("click", () => {
      this.ui.showSourcesModal()
    })

    this.dom.$.closeSourcesModal?.addEventListener("click", () => {
      this.ui.hideSourcesModal()
    })

    this.dom.$.sourcesModal?.addEventListener("click", (e) => {
      if (e.target === this.dom.$.sourcesModal) {
        this.ui.hideSourcesModal()
      }
    })

    // 입력 변화 감지
    this.dom.$.messageInput?.addEventListener("input", () => {
      this.ui.updateInterface()
    })
  }

  // 개선된 탭 네비게이션 초기화
  initEnhancedTabNavigation() {
    // 탭 버튼 이벤트
    document.querySelectorAll(".enhanced-tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const tabName = button.dataset.tab
        this.switchTab(tabName)
      })
    })

    // 새로고침 버튼
    document.getElementById("refreshTabBtn")?.addEventListener("click", () => {
      this.refreshCurrentTab()
    })

    // 전체화면 버튼
    document.getElementById("fullscreenBtn")?.addEventListener("click", () => {
      this.toggleFullscreen()
    })

    // 더보기 메뉴
    const moreMenuBtn = document.getElementById("moreMenuBtn")
    const moreMenu = document.getElementById("moreMenu")

    moreMenuBtn?.addEventListener("click", (e) => {
      e.stopPropagation()
      moreMenu.classList.toggle("hidden")
      moreMenu.classList.toggle("show")
    })

    // 메뉴 외부 클릭 시 닫기
    document.addEventListener("click", () => {
      moreMenu?.classList.add("hidden")
      moreMenu?.classList.remove("show")
    })

    // 키보드 단축키
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault()
            this.switchTab("chat")
            break
          case "2":
            e.preventDefault()
            this.switchTab("exchange")
            break
          case "3":
            e.preventDefault()
            this.switchTab("weather")
            break
          case "4":
            e.preventDefault()
            this.switchTab("flight")
            break
          case "5":
            e.preventDefault()
            this.switchTab("checklist")
            break
          case "r":
            e.preventDefault()
            this.refreshCurrentTab()
            break
        }
      }
    })
  }

  async loadInitialData() {
    try {
      const [countries, topics, models] = await Promise.all([
        this.api.getCountries(),
        this.api.getTopics(),
        this.api.getModels(),
      ])

      this.ui.renderSelects(countries, topics, models)
      await this.loadExamples()
    } catch (error) {
      console.error("초기 데이터 로드 실패:", error)
    }
  }

  async loadExamples() {
    const { country, topic } = this.state.data
    if (!country || !topic) {
      this.dom.hide(this.dom.$.faqSection)
      return
    }

    try {
      const [examples, sources] = await Promise.all([
        this.api.getExamples(country, topic),
        this.api.getSources(country, topic),
      ])

      this.ui.renderFAQ(examples.examples || [], sources.sources || [])
    } catch (error) {
      console.error("예시 로드 실패:", error)
    }
  }

  async sendMessage() {
    const text = this.dom.$.messageInput?.value.trim()
    if (!text) return

    // 사용자 메시지를 먼저 채팅에 추가
    const activeChat = this.state.getActiveChat()
    if (!activeChat) return

    activeChat.messages.push({ role: "user", text })

    this.dom.$.messageInput.value = ""
    this.ui.renderChat() // 사용자 메시지 즉시 표시
    this.ui.showLoading()
    this.ui.updateInterface()

    const success = await this.chat.sendMessage(text, true) // skipUserMessage 플래그 추가
    if (success) {
      this.ui.hideLoading()
      this.ui.renderChat()
      this.ui.updateInterface()
    }
  }

  // 개선된 탭 전환 메서드
  switchTab(tabName) {
    // 진행 표시기 시작
    this.showTabProgress()

    // 모든 탭 버튼 비활성화
    document.querySelectorAll(".enhanced-tab-button").forEach((btn) => {
      btn.classList.remove("active")
    })

    // 모든 탭 컨텐츠 숨기기
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
      content.classList.add("hidden")
    })

    // 선택된 탭 활성화
    const activeTabBtn = document.getElementById(`${tabName}Tab`)
    const activeTabContent = document.getElementById(`${tabName}TabContent`)

    if (activeTabBtn && activeTabContent) {
      activeTabBtn.classList.add("active")
      activeTabContent.classList.remove("hidden")
      activeTabContent.classList.add("active")

      // 현재 탭 상태 저장
      this.state.set("currentTab", tabName)

      // 탭별 데이터 로드
      this.loadTabContent(tabName)
    }
  }

  // 탭 진행 표시기
  showTabProgress() {
    const progressBar = document.querySelector(".tab-progress-bar")
    if (progressBar) {
      progressBar.classList.add("loading")
      setTimeout(() => {
        progressBar.classList.remove("loading")
      }, 1000)
    }
  }

  // 현재 탭 새로고침
  refreshCurrentTab() {
    const currentTab = this.state.get("currentTab") || "chat"
    this.loadTabContent(currentTab)

    // 새로고침 버튼 애니메이션
    const refreshBtn = document.getElementById("refreshTabBtn")
    if (refreshBtn) {
      refreshBtn.style.transform = "rotate(360deg)"
      setTimeout(() => {
        refreshBtn.style.transform = "rotate(0deg)"
      }, 500)
    }
  }

  // 전체화면 토글
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // 탭 컨텐츠 로드
  async loadTabContent(tabName) {
    switch (tabName) {
      case "chat":
        // 채팅 탭은 이미 로드되어 있음
        break
      case "exchange":
        await this.ui.renderExchangeTab()
        break
      case "weather":
        await this.ui.renderWeatherTab()
        break
      case "flight":
        await this.ui.renderFlightTab()
        break
      case "checklist":
        await this.ui.renderChecklists()
        break
    }
  }

  // 커뮤니티 관련 메서드들
  showPostForm() {
    // 간단한 프롬프트로 게시글 작성
    const title = prompt("게시글 제목을 입력하세요:")
    if (!title) return

    const content = prompt("게시글 내용을 입력하세요:")
    if (!content) return

    const postType = prompt("게시글 유형을 선택하세요 (review/question/tip/info):") || "info"

    this.createPost({
      title,
      content,
      post_type: postType,
      country: this.state.get("country") || "general",
      topic: this.state.get("topic") || "general",
      author_name: prompt("작성자 이름:") || "익명",
    })
  }

  async createPost(postData) {
    try {
      await this.api.createCommunityPost(postData)
      alert("게시글이 작성되었습니다!")
      this.ui.renderCommunity() // 게시글 목록 새로고침
    } catch (error) {
      console.error("게시글 작성 실패:", error)
      alert("게시글 작성에 실패했습니다.")
    }
  }

  async showPostDetail(postId) {
    try {
      const post = await this.api.getCommunityPostDetail(postId)

      // 간단한 alert로 게시글 상세 보기 (실제로는 모달이나 새 페이지로 구현)
      const message = `
제목: ${post.title}
작성자: ${post.author_name}
날짜: ${new Date(post.created_at).toLocaleString()}
조회수: ${post.views} | 좋아요: ${post.likes}

내용:
${post.content}

댓글 ${post.comments.length}개
            `
      alert(message)
    } catch (error) {
      console.error("게시글 상세 보기 실패:", error)
    }
  }

  async showChecklistDetail(checklistId) {
    try {
      const checklist = await this.api.getChecklistDetail(checklistId)

      // 체크리스트 상세 보기
      let message = `${checklist.name}\n\n${checklist.description}\n\n체크리스트 항목들:\n\n`

      checklist.items.forEach((item, index) => {
        message += `${index + 1}. ${item.title}${item.is_required ? " (필수)" : " (선택)"}\n`
        if (item.description) {
          message += `   - ${item.description}\n`
        }
        if (item.estimated_time) {
          message += `   - 예상 소요시간: ${item.estimated_time}\n`
        }
        message += "\n"
      })

      alert(message)
    } catch (error) {
      console.error("체크리스트 상세 보기 실패:", error)
    }
  }
}

// 앱 초기화
document.addEventListener("DOMContentLoaded", () => {
  window.travelBotApp = new TravelBotApp()
  
  // 개발용: 전역 함수 노출
  window.testSourcesModal = () => {
    if (window.travelBotApp && window.travelBotApp.ui) {
      console.log('테스트용 showSourcesModal 호출');
      window.travelBotApp.ui.showSourcesModal();
    }
  };
})
