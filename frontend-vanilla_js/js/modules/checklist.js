// 노션 스타일 체크리스트 UI
export class NotionChecklistUI {
  constructor(state, api) {
    this.state = state
    this.api = api
    this.categoryIcons = {
      item: "📋",
      preparation: "🛫",
      document: "📄",
      money: "💳",
      health: "🏥",
      communication: "📱",
      safety: "🛡️",
      clothes: "👕",
      food: "🍽️",
      transport: "🚗",
      기타: "📝",
    }
    this.categoryColors = {
      item: "from-blue-500 to-indigo-600",
      preparation: "from-green-500 to-emerald-600",
      document: "from-yellow-500 to-orange-600",
      money: "from-purple-500 to-pink-600",
      health: "from-red-500 to-rose-600",
      communication: "from-cyan-500 to-blue-600",
      safety: "from-orange-500 to-red-600",
      clothes: "from-pink-500 to-purple-600",
      food: "from-amber-500 to-yellow-600",
      transport: "from-teal-500 to-cyan-600",
      기타: "from-gray-500 to-slate-600",
    }
    this.motivationalMessages = [
      "좋은 시작이에요! 계속 진행해보세요.",
      "절반 완료! 잘 하고 있어요.",
      "거의 다 왔어요! 조금만 더 힘내세요.",
      "멋져요! 계속 진행 중이에요.",
      "좋은 진행 상황이에요!",
      "완벽해요! 곧 여행 준비가 끝나요.",
    ]
  }

  // 체크리스트 렌더링
  async renderChecklists() {
    try {
      const country = this.state.get("country")

      if (!country) {
        const container = document.getElementById("checklistList")
        if (container) {
          container.innerHTML = `
            <div class="text-center p-12">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full mb-4 animate-pulse">
                <span class="text-2xl">✈️</span>
              </div>
              <p class="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">여행 준비를 시작해보세요!</p>
              <p class="text-gray-500 dark:text-gray-500 text-sm">국가를 선택하면 맞춤형 체크리스트를 제공해드립니다.</p>
            </div>
          `
        }
        return
      }

      // 로딩 상태 표시
      this.showLoadingState()

      const data = await this.api.getChecklists(country)
      this.renderChecklistList(data.checklists || [])
    } catch (error) {
      console.error("체크리스트 렌더링 실패:", error)
      const container = document.getElementById("checklistList")
      if (container) {
        container.innerHTML = `
          <div class="text-center p-8">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <span class="text-xl text-red-600">⚠️</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400">체크리스트를 불러올 수 없습니다.</p>
            <button onclick="location.reload()" class="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
              다시 시도
            </button>
          </div>
        `
      }
    }
  }

  showLoadingState() {
    const container = document.getElementById("checklistList")
    if (!container) return

    container.innerHTML = `
      <div class="space-y-6">
        ${[1, 2, 3]
          .map(
            (i) => `
          <div class="animate-pulse">
            <div class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 mb-3"></div>
            <div class="space-y-2">
              ${[1, 2, 3]
                .map(
                  (j) => `
                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div class="w-4 h-4 bg-gray-200 rounded-sm"></div>
                  <div class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded flex-1"></div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `
  }

  renderChecklistList(checklists) {
    const container = document.getElementById("checklistList")
    if (!container) return

    if (checklists.length === 0) {
      container.innerHTML = `
        <div class="text-center p-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-yellow-200 rounded-full mb-4">
            <span class="text-2xl">📋</span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">아직 체크리스트가 없습니다</p>
          <p class="text-gray-500 dark:text-gray-500 text-sm">다른 국가를 선택해보세요.</p>
        </div>
      `
      return
    }

    // 카테고리별로 그룹화
    const groupedChecklists = {}
    checklists.forEach((checklist) => {
      const category = checklist.category || "기타"
      if (!groupedChecklists[category]) {
        groupedChecklists[category] = []
      }
      groupedChecklists[category].push(checklist)
    })

    // 진행률 계산
    const totalItems = checklists.length
    const completedItems = 0 // 초기에는 0개 완료

    const html = `
      <!-- 진행률 표시 -->
      <div class="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span class="text-white text-sm">📊</span>
            </div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">여행 준비 진행률</h2>
          </div>
          <div class="text-right">
            <div id="progressText" class="text-sm font-medium text-blue-600 dark:text-blue-400">0/${totalItems} 완료</div>
            <div id="progressPercent" class="text-xs text-gray-500 dark:text-gray-400">0%</div>
          </div>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div id="progressBar" class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-out" style="width: 0%"></div>
        </div>
      </div>

      <!-- 체크리스트 항목들 -->
      <div class="space-y-6">
        ${Object.entries(groupedChecklists)
          .map(([category, items], categoryIndex) => {
            const icon = this.categoryIcons[category] || this.categoryIcons["기타"]
            const colorClass = this.categoryColors[category] || this.categoryColors["기타"]

            return `
              <div class="checklist-category" style="animation-delay: ${categoryIndex * 150}ms">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-8 h-8 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center shadow-lg">
                    <span class="text-white text-sm">${icon}</span>
                  </div>
                  <div class="flex-1">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">${category}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${items.length}개 항목</p>
                  </div>
                  <div class="category-progress-badge bg-white dark:bg-gray-800 px-2 py-1 rounded-full border">
                    <span class="text-xs text-gray-600 dark:text-gray-400">0/${items.length}</span>
                  </div>
                </div>
                
                <div class="space-y-2 ml-3 border-l-2 border-gray-100 dark:border-gray-700 pl-4">
                  ${items
                    .map(
                      (checklist, itemIndex) => `
                    <div class="enhanced-checklist-item group relative flex items-start gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800/50 dark:hover:to-blue-900/20 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-100 dark:hover:border-blue-800" 
                         style="animation-delay: ${(categoryIndex * items.length + itemIndex) * 100}ms">
                      
                      <!-- 체크박스 -->
                      <label class="flex items-center cursor-pointer group-hover:scale-110 transition-transform duration-200">
                        <input type="checkbox" class="enhanced-checkbox sr-only" />
                        <div class="checkbox-enhanced w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-white dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
                          <svg class="checkmark-enhanced w-3 h-3 text-white opacity-0 transition-all duration-200 transform scale-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                          </svg>
                        </div>
                      </label>
                      
                      <!-- 텍스트 -->
                      <div class="flex-1 min-w-0">
                        <span class="checklist-text-enhanced block text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-medium">
                          ${checklist.checklist_item}
                        </span>
                        <div class="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                            </svg>
                            ${checklist.country}
                          </span>
                          <span class="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>${category}</span>
                        </div>
                      </div>
                      
                      <!-- 상태 인디케이터 -->
                      <div class="status-indicator w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      
                      <!-- 완료 시 파티클 효과를 위한 컨테이너 -->
                      <div class="particle-container absolute inset-0 pointer-events-none"></div>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              </div>
            `
          })
          .join("")}
      </div>
      
      <!-- 모든 항목 완료 시 축하 메시지 영역 -->
      <div id="celebrationArea" class="hidden mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 text-center">
        <div class="text-4xl mb-2">🎉</div>
        <h3 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-1">모든 준비 완료!</h3>
        <p class="text-sm text-green-600 dark:text-green-300">완벽한 여행을 떠날 준비가 되었습니다!</p>
      </div>
    `

    container.innerHTML = html

    // 애니메이션 클래스 추가
    requestAnimationFrame(() => {
      container.querySelectorAll(".checklist-category").forEach((el, index) => {
        el.style.animation = "slideInUp 0.6s ease-out forwards"
        el.style.opacity = "0"
        el.style.transform = "translateY(20px)"

        setTimeout(() => {
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
        }, index * 150)
      })
    })

    // 체크박스 이벤트 리스너 추가
    this.initEnhancedChecklistEvents()
  }

  // 향상된 체크리스트 이벤트 초기화
  initEnhancedChecklistEvents() {
    const checklistItems = document.querySelectorAll(".enhanced-checklist-item")

    checklistItems.forEach((item) => {
      const checkbox = item.querySelector(".enhanced-checkbox")
      const customCheckbox = item.querySelector(".checkbox-enhanced")
      const checkmark = item.querySelector(".checkmark-enhanced")
      const text = item.querySelector(".checklist-text-enhanced")
      const statusIndicator = item.querySelector(".status-indicator")

      // 체크박스 클릭 이벤트
      item.addEventListener("click", (e) => {
        e.preventDefault()
        checkbox.checked = !checkbox.checked

        if (checkbox.checked) {
          // 체크됨 - 매력적인 애니메이션
          customCheckbox.classList.add(
            "bg-gradient-to-br",
            "from-green-400",
            "to-emerald-500",
            "border-green-500",
            "shadow-lg",
          )
          customCheckbox.classList.remove("bg-white", "dark:bg-gray-700", "border-gray-300", "dark:border-gray-600")
          checkmark.classList.remove("opacity-0", "scale-0")
          checkmark.classList.add("opacity-100", "scale-100")
          text.classList.add("line-through", "text-gray-500", "dark:text-gray-400")
          statusIndicator.classList.add("bg-green-400")
          statusIndicator.classList.remove("bg-gray-300", "dark:bg-gray-600")
          item.classList.add("bg-green-50/50", "dark:bg-green-900/10")

          // 파티클 효과
          this.createParticleEffect(item)
        } else {
          // 체크 해제
          customCheckbox.classList.remove(
            "bg-gradient-to-br",
            "from-green-400",
            "to-emerald-500",
            "border-green-500",
            "shadow-lg",
          )
          customCheckbox.classList.add("bg-white", "dark:bg-gray-700", "border-gray-300", "dark:border-gray-600")
          checkmark.classList.add("opacity-0", "scale-0")
          checkmark.classList.remove("opacity-100", "scale-100")
          text.classList.remove("line-through", "text-gray-500", "dark:text-gray-400")
          statusIndicator.classList.remove("bg-green-400")
          statusIndicator.classList.add("bg-gray-300", "dark:bg-gray-600")
          item.classList.remove("bg-green-50/50", "dark:bg-green-900/10")
        }

        this.updateEnhancedProgress()
      })
    })
  }

  // 파티클 효과 생성
  createParticleEffect(item) {
    const container = item.querySelector(".particle-container")
    const particles = ["✨", "⭐", "💫", "🌟"]

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const particle = document.createElement("div")
        particle.textContent = particles[Math.floor(Math.random() * particles.length)]
        particle.className = "absolute text-xs animate-ping"
        particle.style.left = Math.random() * 100 + "%"
        particle.style.top = Math.random() * 100 + "%"
        particle.style.animationDuration = "1s"

        container.appendChild(particle)

        setTimeout(() => particle.remove(), 1000)
      }, i * 100)
    }
  }

  // 향상된 진행률 업데이트
  updateEnhancedProgress() {
    const totalItems = document.querySelectorAll(".enhanced-checkbox").length
    const completedItems = document.querySelectorAll(".enhanced-checkbox:checked").length
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

    // 전체 진행률 업데이트
    const progressBar = document.getElementById("progressBar")
    const progressText = document.getElementById("progressText")
    const progressPercent = document.getElementById("progressPercent")
    const motivationMessage = document.getElementById("motivationMessage")

    if (progressBar) {
      progressBar.style.width = progress + "%"
      // 진행률에 따른 색상 변화
      if (progress === 100) {
        progressBar.className =
          "h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
      } else if (progress >= 75) {
        progressBar.className =
          "h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
      } else {
        progressBar.className =
          "h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
      }
    }

    if (progressText) {
      progressText.textContent = `${completedItems}/${totalItems} 완료`
      // 완료 텍스트 애니메이션
      if (completedItems > 0) {
        progressText.style.animation = "countUp 0.5s ease-out"
        setTimeout(() => (progressText.style.animation = ""), 500)
      }
    }

    if (progressPercent) progressPercent.textContent = `${progress}%`

    // 동기부여 메시지 업데이트
    if (motivationMessage) {
      let message = this.motivationalMessages[0]
      if (progress === 100) {
        message = "🎉 완벽해요! 멋진 여행 되세요!"
      } else if (progress >= 80) {
        message = this.motivationalMessages[5]
      } else if (progress >= 60) {
        message = this.motivationalMessages[3]
      } else if (progress >= 40) {
        message = this.motivationalMessages[1]
      } else if (progress >= 20) {
        message = this.motivationalMessages[4]
      } else if (progress > 0) {
        message = this.motivationalMessages[0]
      }

      motivationMessage.textContent = message
      motivationMessage.style.opacity = "1"
      motivationMessage.style.transform = "translateY(0)"
    }

    // 카테고리별 진행률 업데이트
    document.querySelectorAll(".checklist-category").forEach((category) => {
      const categoryItems = category.querySelectorAll(".enhanced-checkbox")
      const categoryCompleted = category.querySelectorAll(".enhanced-checkbox:checked")
      const badge = category.querySelector(".category-progress-badge span")
      const progressBar = category.querySelector(".category-progress-bar")
      const categoryProgress = categoryItems.length > 0 ? (categoryCompleted.length / categoryItems.length) * 100 : 0

      if (badge) {
        badge.textContent = `${categoryCompleted.length}/${categoryItems.length}`

        // 카테고리 완료 시 효과
        if (categoryCompleted.length === categoryItems.length && categoryItems.length > 0) {
          badge.parentElement.classList.add(
            "bg-gradient-to-r",
            "from-green-100",
            "to-emerald-100",
            "dark:from-green-900/40",
            "dark:to-emerald-900/40",
            "text-green-700",
            "dark:text-green-300",
            "border-green-300",
            "dark:border-green-600",
            "shadow-lg",
          )
          badge.parentElement.classList.remove(
            "bg-gradient-to-r",
            "from-gray-100",
            "to-gray-200",
            "dark:from-gray-700",
            "dark:to-gray-600",
          )

          // 카테고리 완료 애니메이션
          this.playCategoryCompleteAnimation(category)
        } else {
          badge.parentElement.classList.remove(
            "bg-gradient-to-r",
            "from-green-100",
            "to-emerald-100",
            "dark:from-green-900/40",
            "dark:to-emerald-900/40",
            "text-green-700",
            "dark:text-green-300",
            "border-green-300",
            "dark:border-green-600",
            "shadow-lg",
          )
          badge.parentElement.classList.add(
            "bg-gradient-to-r",
            "from-gray-100",
            "to-gray-200",
            "dark:from-gray-700",
            "dark:to-gray-600",
          )
        }
      }

      if (progressBar) {
        progressBar.style.width = categoryProgress + "%"
      }
    })

    // 전체 완료 체크
    if (completedItems === totalItems && totalItems > 0) {
      setTimeout(() => this.showCelebration(), 500)
    } else {
      this.hideCelebration()
    }
  }

  // 카테고리 완료 애니메이션
  playCategoryCompleteAnimation(category) {
    const header = category.querySelector(".sticky")
    if (header) {
      header.style.animation = "categoryComplete 0.8s ease-out"
      setTimeout(() => (header.style.animation = ""), 800)
    }
  }

  // 축하 메시지 표시
  showCelebration() {
    const celebrationArea = document.getElementById("celebrationArea")
    if (celebrationArea) {
      celebrationArea.classList.remove("hidden")
      celebrationArea.style.animation = "celebrationBounce 1s ease-out"

      // 전역 축하 효과
      this.createGlobalCelebration()

      // 사운드 효과 (선택적)
      this.playCompletionSound()
    }
  }

  hideCelebration() {
    const celebrationArea = document.getElementById("celebrationArea")
    if (celebrationArea && !celebrationArea.classList.contains("hidden")) {
      celebrationArea.style.animation = "fadeOut 0.5s ease-out forwards"
      setTimeout(() => {
        celebrationArea.classList.add("hidden")
        celebrationArea.style.animation = ""
      }, 500)
    }
  }

  // 전역 축하 효과
  createGlobalCelebration() {
    const emojis = ["🎉", "🎊", "✨", "🌟", "💫", "🎈", "🥳", "🏆", "⭐", "💥"]
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]

    // 폭죽 효과
    for (let i = 0; i < 25; i++) {
      setTimeout(() => {
        const emoji = document.createElement("div")
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)]
        emoji.className = "fixed text-3xl pointer-events-none z-50 font-bold"
        emoji.style.left = Math.random() * window.innerWidth + "px"
        emoji.style.top = "-50px"
        emoji.style.color = colors[Math.floor(Math.random() * colors.length)]
        emoji.style.animation = `confettiFall ${2 + Math.random() * 2}s linear forwards`
        emoji.style.transform = `rotate(${Math.random() * 360}deg)`

        document.body.appendChild(emoji)

        setTimeout(() => emoji.remove(), 4000)
      }, i * 100)
    }

    // 화면 중앙에서 퍼지는 효과
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const particle = document.createElement("div")
        particle.className = "fixed w-4 h-4 pointer-events-none z-50"
        particle.style.left = "50%"
        particle.style.top = "50%"
        particle.style.background = `linear-gradient(45deg, ${colors[Math.floor(Math.random() * colors.length)]}, ${colors[Math.floor(Math.random() * colors.length)]})`
        particle.style.borderRadius = "50%"
        particle.style.animation = `explode 1.5s ease-out forwards`
        particle.style.animationDelay = `${i * 0.1}s`

        const angle = (360 / 12) * i
        particle.style.setProperty("--angle", angle + "deg")

        document.body.appendChild(particle)

        setTimeout(() => particle.remove(), 1500)
      }, i * 50)
    }
  }

  // 완료 사운드 효과 (웹 오디오 API 사용)
  playCompletionSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // 성공 사운드 시퀀스
      const notes = [523.25, 659.25, 783.99] // C, E, G

      notes.forEach((frequency, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
          oscillator.type = "sine"

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
        }, index * 150)
      })
    } catch (error) {
      // 오디오 컨텍스트를 지원하지 않는 브라우저에서는 무시
      console.log("Audio context not supported")
    }
  }
}

// 향상된 CSS 애니메이션
const enhancedStyle = document.createElement("style")
enhancedStyle.textContent = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes sparkle {
    0% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1.2) rotate(180deg);
    }
    100% {
      opacity: 0;
      transform: scale(0) rotate(360deg) translateY(-20px);
    }
  }
  
  @keyframes successPulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    }
    50% {
      transform: scale(1.1);
      box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
  }
  
  @keyframes countUp {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
  
  @keyframes categoryComplete {
    0% {
      transform: scale(1);
    }
    25% {
      transform: scale(1.02) rotate(1deg);
    }
    50% {
      transform: scale(1.04) rotate(-1deg);
    }
    75% {
      transform: scale(1.02) rotate(0.5deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  }
  
  @keyframes celebrationBounce {
    0% {
      opacity: 0;
      transform: scale(0.3) translateY(100px);
    }
    50% {
      opacity: 1;
      transform: scale(1.05) translateY(-10px);
    }
    70% {
      transform: scale(0.95) translateY(5px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes confettiFall {
    0% {
      transform: translateY(-100vh) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
  
  @keyframes explode {
    0% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(200px) scale(0);
      opacity: 0;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.9);
    }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -15px, 0);
    }
    70% {
      transform: translate3d(0, -8px, 0);
    }
    90% {
      transform: translate3d(0, -3px, 0);
    }
  }
  
  /* 호버 효과 강화 */
  .enhanced-checklist-item:hover {
    transform: translateX(4px);
  }
  
  .enhanced-checklist-item:hover .checkbox-enhanced {
    transform: scale(1.15) rotate(5deg);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  /* 체크박스 완료 상태 */
  .enhanced-checkbox:checked + .checkbox-enhanced {
    animation: successPulse 0.6s ease-out;
  }
  
  /* 스크롤바 스타일링 */
  .checklist-category::-webkit-scrollbar {
    width: 6px;
  }
  
  .checklist-category::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .checklist-category::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
    border-radius: 3px;
  }
  
  .checklist-category::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #2563eb, #7c3aed);
  }
  
  /* 다크모드 스크롤바 */
  @media (prefers-color-scheme: dark) {
    .checklist-category::-webkit-scrollbar-track {
      background: #374151;
    }
  }
  
  /* 반응형 최적화 */
  @media (max-width: 768px) {
    .enhanced-checklist-item {
      padding: 12px;
    }
    
    .enhanced-checklist-item:hover {
      transform: none;
    }
  }
`
document.head.appendChild(enhancedStyle)
