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

    // 탭 네비게이션
    document.getElementById("chatTab")?.addEventListener("click", () => {
      this.switchTab("chat")
    })

    document.getElementById("exchangeTab")?.addEventListener("click", () => {
      this.switchTab("exchange")
    })

    document.getElementById("weatherTab")?.addEventListener("click", () => {
      this.switchTab("weather")
    })

    document.getElementById("flightTab")?.addEventListener("click", () => {
      this.switchTab("flight")
    })

    document.getElementById("checklistTab")?.addEventListener("click", () => {
      this.switchTab("checklist")
    })

    document.getElementById("communityTab")?.addEventListener("click", () => {
      this.switchTab("community")
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

  // 탭 전환 메서드
  switchTab(tabName) {
    // 모든 탭 버튼 비활성화
    document.querySelectorAll(".tab-button").forEach((btn) => {
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

      // 탭별 데이터 로드
      this.loadTabContent(tabName)
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
      case "community":
        await this.ui.renderCommunity()
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
})
