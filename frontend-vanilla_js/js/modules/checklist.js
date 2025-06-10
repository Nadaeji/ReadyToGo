// 노션 스타일 체크리스트 UI
export class NotionChecklistUI {
  constructor(state, api) {
    this.state = state
    this.api = api
    this.categoryIcons = {
      '준비물': "🗓️",
      '준비 사항': "🛫",
    }
    this.categoryColors = {
      '준비물': "from-blue-500 to-indigo-600",
      '준비 사항': "from-green-500 to-emerald-600",
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
      const serverChecklists = data.checklists || []

      // 커스텀 항목 추가
      const customItems = this.getCustomItems()
      const allChecklists = [...serverChecklists, ...customItems]

      this.renderChecklistList(allChecklists)
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

    const html = `
  <!-- 체크리스트 헤더 with 액션 버튼들 -->
  <div class="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <span class="text-xl">📋</span>
        ${this.api.countryMap[this.state.get("country")] || this.state.get("country")} 여행 체크리스트
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">총 ${checklists.length}개 항목</p>
    </div>
    <div class="flex items-center gap-2">
      <button 
        id="addChecklistItemBtn" 
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        항목 추가
      </button>
      <button 
        id="exportChecklistBtn" 
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        텍스트로 내보내기
      </button>
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
                     style="animation-delay: ${(categoryIndex * items.length + itemIndex) * 100}ms"
                     data-checklist-id="${checklist.id || itemIndex}">
                  
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
                  
                  <!-- 삭제 버튼 (커스텀 항목만) -->
                  ${
                    checklist.isCustom
                      ? `
                    <button class="delete-item-btn opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-md flex items-center justify-center text-white transition-all duration-200 text-xs" title="항목 삭제">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  `
                      : ""
                  }
                  
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
        // 삭제 버튼 클릭 시에는 체크박스 토글하지 않음
        if (e.target.closest(".delete-item-btn")) {
          return
        }

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

    // 새로운 기능들 초기화
    this.initAddItemFeature()
    this.initExportFeature()
    this.initDeleteItemFeature()
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

  // 체크리스트 항목 추가 기능
  initAddItemFeature() {
    const addBtn = document.getElementById("addChecklistItemBtn")
    if (!addBtn) return

    addBtn.addEventListener("click", () => {
      this.showAddItemModal()
    })
  }

  // 항목 추가 모달 표시
  showAddItemModal() {
    const modal = this.createAddItemModal()
    document.body.appendChild(modal)

    // 모달 표시 애니메이션
    requestAnimationFrame(() => {
      modal.classList.remove("opacity-0")
      modal.classList.add("opacity-100")
    })
  }

  // 항목 추가 모달 생성
  createAddItemModal() {
    const modal = document.createElement("div")
    modal.className =
      "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-300"
    modal.id = "addItemModal"

    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 transform scale-95 transition-transform duration-300">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-sm">+</span>
            새 체크리스트 항목 추가
          </h3>
          <button id="closeAddItemModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form id="addItemForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">항목 내용</label>
            <textarea 
              id="newItemText" 
              required 
              rows="3"
              class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
              placeholder="예: 여권 유효기간 확인하기"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">카테고리</label>
            <select 
              id="newItemCategory" 
              class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              ${Object.keys(this.categoryIcons)
                .map((category) => `<option value="${category}">${this.categoryIcons[category]} ${category}</option>`)
                .join("")}
            </select>
          </div>
          
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              id="cancelAddItem" 
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              취소
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              추가하기
            </button>
          </div>
        </form>
      </div>
    `

    // 이벤트 리스너 추가
    this.initAddItemModalEvents(modal)

    return modal
  }

  // 항목 추가 모달 이벤트 초기화
  initAddItemModalEvents(modal) {
    const closeBtn = modal.querySelector("#closeAddItemModal")
    const cancelBtn = modal.querySelector("#cancelAddItem")
    const form = modal.querySelector("#addItemForm")

    // 모달 닫기
    const closeModal = () => {
      modal.classList.remove("opacity-100")
      modal.classList.add("opacity-0")
      setTimeout(() => modal.remove(), 300)
    }

    closeBtn.addEventListener("click", closeModal)
    cancelBtn.addEventListener("click", closeModal)

    // 배경 클릭으로 닫기
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal()
    })

    // 폼 제출
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      const text = modal.querySelector("#newItemText").value.trim()
      const category = modal.querySelector("#newItemCategory").value

      if (text) {
        this.addCustomItem(text, category)
        closeModal()
      }
    })
  }

  // 커스텀 항목 추가
  addCustomItem(text, category) {
    const country = this.state.get("country")
    const newItem = {
      id: `custom_${Date.now()}`,
      checklist_item: text,
      category: category,
      country: this.api.countryMap[country] || country,
      isCustom: true,
    }

    // 로컬 스토리지에 저장
    const customItems = this.getCustomItems()
    customItems.push(newItem)
    this.saveCustomItems(customItems)

    // 체크리스트 다시 렌더링
    this.renderChecklists()

    // 성공 메시지
    this.showToast("새 항목이 추가되었습니다!", "success")
  }

  // 커스텀 항목 관리
  getCustomItems() {
    const country = this.state.get("country")
    const key = `custom_checklist_${country}`
    return JSON.parse(localStorage.getItem(key) || "[]")
  }

  saveCustomItems(items) {
    const country = this.state.get("country")
    const key = `custom_checklist_${country}`
    localStorage.setItem(key, JSON.stringify(items))
  }

  // 항목 삭제 기능
  initDeleteItemFeature() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".delete-item-btn")) {
        const item = e.target.closest(".enhanced-checklist-item")
        const itemId = item.dataset.checklistId

        if (confirm("이 항목을 삭제하시겠습니까?")) {
          this.deleteCustomItem(itemId)
        }
      }
    })
  }

  deleteCustomItem(itemId) {
    const customItems = this.getCustomItems()
    const filteredItems = customItems.filter((item) => item.id !== itemId)
    this.saveCustomItems(filteredItems)

    // 체크리스트 다시 렌더링
    this.renderChecklists()

    // 성공 메시지
    this.showToast("항목이 삭제되었습니다.", "info")
  }

  // 텍스트 파일 내보내기 기능
  initExportFeature() {
    const exportBtn = document.getElementById("exportChecklistBtn")
    if (!exportBtn) return

    exportBtn.addEventListener("click", () => {
      this.exportToTextFile()
    })
  }

  // 텍스트 파일로 내보내기
  exportToTextFile() {
    const country = this.state.get("country")
    const countryName = this.api.countryMap[country] || country

    // 현재 체크리스트 상태 수집
    const checklistItems = document.querySelectorAll(".enhanced-checklist-item")
    const categories = {}

    checklistItems.forEach((item) => {
      const text = item.querySelector(".checklist-text-enhanced").textContent.trim()
      const isChecked = item.querySelector(".enhanced-checkbox").checked
      const categoryElement = item.closest(".checklist-category")
      const categoryName = categoryElement.querySelector("h3").textContent.trim()

      if (!categories[categoryName]) {
        categories[categoryName] = []
      }

      categories[categoryName].push({
        text,
        checked: isChecked,
      })
    })

    // 텍스트 파일 내용 생성
    let content = `${countryName} 여행 체크리스트\n`
    content += `생성일: ${new Date().toLocaleDateString("ko-KR")}\n`
    content += `생성시간: ${new Date().toLocaleTimeString("ko-KR")}\n`
    content += `\n${"=".repeat(50)}\n\n`

    // 카테고리별 항목 추가
    Object.entries(categories).forEach(([categoryName, items]) => {
      const categoryIcon = this.categoryIcons[categoryName] || "📝"
      const completedInCategory = items.filter((item) => item.checked).length

      content += `${categoryIcon} ${categoryName} (${completedInCategory}/${items.length})\n`
      content += `${"-".repeat(30)}\n`

      items.forEach((item) => {
        const status = item.checked ? "✅" : "⬜"
        content += `${status} ${item.text}\n`
      })

      content += "\n"
    })

    // 완료된 항목과 미완료 항목 요약
    content += `\n${"=".repeat(50)}\n`
    content += `📋 요약\n`
    content += `${"-".repeat(20)}\n`

    const completedList = []
    const pendingList = []

    Object.values(categories)
      .flat()
      .forEach((item) => {
        if (item.checked) {
          completedList.push(item.text)
        } else {
          pendingList.push(item.text)
        }
      })

    if (completedList.length > 0) {
      content += `\n✅ 완료된 항목 (${completedList.length}개):\n`
      completedList.forEach((item, index) => {
        content += `${index + 1}. ${item}\n`
      })
    }

    if (pendingList.length > 0) {
      content += `\n⬜ 미완료 항목 (${pendingList.length}개):\n`
      pendingList.forEach((item, index) => {
        content += `${index + 1}. ${item}\n`
      })
    }

    content += `\n${"=".repeat(50)}\n`
    content += `Ready To Go - AI 여행 어시스턴트\n`
    content += `https://readytogo.travel\n`

    // 파일 다운로드
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    const fileName = `${countryName}_여행체크리스트_${new Date().toISOString().split("T")[0]}.txt`
    a.href = url
    a.download = fileName
    a.style.display = "none"

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // 성공 메시지
    this.showToast(`체크리스트가 "${fileName}" 파일로 저장되었습니다!`, "success")
  }

  // 토스트 메시지 표시
  showToast(message, type = "info") {
    const toast = document.createElement("div")
    const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"

    toast.className = `fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 flex items-center gap-2`
    toast.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span class="font-medium">${message}</span>
    `

    document.body.appendChild(toast)

    // 애니메이션
    requestAnimationFrame(() => {
      toast.classList.remove("translate-x-full")
      toast.classList.add("translate-x-0")
    })

    // 자동 제거
    setTimeout(() => {
      toast.classList.remove("translate-x-0")
      toast.classList.add("translate-x-full")
      setTimeout(() => toast.remove(), 300)
    }, 3000)
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
