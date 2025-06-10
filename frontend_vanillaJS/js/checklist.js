// Checklist module
const ChecklistModule = {
  elements: {
    progressText: document.getElementById("progressText"),
    progressPercent: document.getElementById("progressPercent"),
    progressFill: document.getElementById("progressFill"),
    newItemInput: document.getElementById("newItemInput"),
    itemCategory: document.getElementById("itemCategory"),
    addItemBtn: document.getElementById("addItemBtn"),
    checklistCategories: document.getElementById("checklistCategories"),
  },

  state: {
    templates: [],
    customItems: [],
    currentCountry: null,
    currentTopic: null,
  }
}

function initChecklist() {
  setupChecklistEventListeners()
  loadChecklistData()
}

function setupChecklistEventListeners() {
  ChecklistModule.elements.addItemBtn.addEventListener("click", addNewItem)

  ChecklistModule.elements.newItemInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addNewItem()
    }
  })

  // 국가/토픽 변경 감지
  window.addEventListener("configChanged", (e) => {
    const { country, topic } = e.detail.config
    if (country !== ChecklistModule.state.currentCountry || topic !== ChecklistModule.state.currentTopic) {
      ChecklistModule.state.currentCountry = country
      ChecklistModule.state.currentTopic = topic
      loadChecklistData()
    }
  })

  // 탭 변경 감지
  window.addEventListener("tabChanged", (e) => {
    if (e.detail.tab === "checklist") {
      loadChecklistData()
    }
  })
}

async function loadChecklistData() {
  try {
    showLoadingMessage()
    
    const country = window.AppState?.chatConfig?.country
    const topic = window.AppState?.chatConfig?.topic
    
    const params = {}
    if (country) params.country = country
    if (topic) params.topic = mapTopicToBackend(topic)

    const checklistData = await apiGet(API_CONFIG.ENDPOINTS.CHECKLISTS, params)
    
    if (checklistData.checklists && checklistData.checklists.length > 0) {
      await loadChecklistDetails(checklistData.checklists)
    } else {
      // 백엔드에 데이터가 없으면 기본 체크리스트 사용
      loadDefaultChecklist()
    }

  } catch (error) {
    console.error("Failed to load checklist data:", error)
    // 에러 발생시 기본 체크리스트 사용
    loadDefaultChecklist()
    showNotification("체크리스트를 불러오는데 실패했습니다. 기본 체크리스트를 표시합니다.", "warning")
  }
}

function mapTopicToBackend(frontendTopic) {
  const topicMapping = {
    "General Travel": "general",
    "Visa Information": "visa",
    "Insurance": "insurance", 
    "Safety & Security": "safety",
    "Healthcare": "healthcare",
    "Banking & Finance": "finance",
    "Housing": "housing",
    "Transportation": "transportation",
    "Culture & Customs": "culture",
    "Language Learning": "language",
    "Job Search": "jobs",
    "Education": "education"
  }
  
  return topicMapping[frontendTopic] || frontendTopic?.toLowerCase()
}

async function loadChecklistDetails(templates) {
  const allItems = []
  
  for (const template of templates) {
    try {
      const detailData = await apiGet(`${API_CONFIG.ENDPOINTS.CHECKLIST_DETAIL}${template.id}/`)
      
      if (detailData.items) {
        detailData.items.forEach(item => {
          allItems.push({
            id: `template_${item.id}`,
            text: item.title,
            description: item.description,
            completed: false,
            category: categorizeItem(item.title, template.topic),
            isRequired: item.is_required,
            estimatedTime: item.estimated_time,
            source: 'backend'
          })
        })
      }
    } catch (error) {
      console.error(`Failed to load checklist details for template ${template.id}:`, error)
    }
  }

  if (allItems.length > 0) {
    ChecklistModule.state.templates = allItems
    loadCustomItems()
    renderChecklist()
  } else {
    loadDefaultChecklist()
  }
}

function categorizeItem(title, topic) {
  const titleLower = title.toLowerCase()
  
  if (titleLower.includes('passport') || titleLower.includes('visa') || titleLower.includes('document')) {
    return 'Documents'
  } else if (titleLower.includes('flight') || titleLower.includes('hotel') || titleLower.includes('booking')) {
    return 'Travel'
  } else if (titleLower.includes('insurance')) {
    return 'Insurance'
  } else if (titleLower.includes('bank') || titleLower.includes('money') || titleLower.includes('card')) {
    return 'Finance'
  } else if (titleLower.includes('health') || titleLower.includes('medical') || titleLower.includes('vaccine')) {
    return 'Health'
  } else if (titleLower.includes('pack') || titleLower.includes('luggage') || titleLower.includes('clothes')) {
    return 'Packing'
  } else if (titleLower.includes('app') || titleLower.includes('phone') || titleLower.includes('internet')) {
    return 'Apps'
  } else if (titleLower.includes('safety') || titleLower.includes('emergency') || titleLower.includes('contact')) {
    return 'Safety'
  } else {
    return 'General'
  }
}

function loadDefaultChecklist() {
  ChecklistModule.state.templates = [
    { id: "1", text: "여권 유효기간 확인 (6개월 이상)", completed: false, category: "Documents", isRequired: true },
    { id: "2", text: "비자 신청 (필요한 경우)", completed: false, category: "Documents", isRequired: true },
    { id: "3", text: "항공편 예약", completed: false, category: "Travel", isRequired: true },
    { id: "4", text: "숙박시설 예약", completed: false, category: "Travel", isRequired: true },
    { id: "5", text: "여행자 보험 가입", completed: false, category: "Insurance", isRequired: true },
    { id: "6", text: "은행에 해외 여행 계획 통보", completed: false, category: "Finance", isRequired: false },
    { id: "7", text: "예방접종 요구사항 확인", completed: false, category: "Health", isRequired: false },
    { id: "8", text: "필수품 짐싸기", completed: false, category: "Packing", isRequired: true },
    { id: "9", text: "오프라인 지도 앱 다운로드", completed: false, category: "Apps", isRequired: false },
    { id: "10", text: "가족/친구에게 여행 일정 알리기", completed: false, category: "Safety", isRequired: false },
  ]
  
  loadCustomItems()
  renderChecklist()
}

function loadCustomItems() {
  // 로컬 스토리지에서 사용자 추가 항목 불러오기
  const savedItems = localStorage.getItem('travel_checklist_custom_items')
  if (savedItems) {
    try {
      ChecklistModule.state.customItems = JSON.parse(savedItems)
    } catch (error) {
      console.error('Failed to parse saved checklist items:', error)
      ChecklistModule.state.customItems = []
    }
  }

  // 완료 상태 불러오기
  const savedStates = localStorage.getItem('travel_checklist_states')
  if (savedStates) {
    try {
      const states = JSON.parse(savedStates)
      // 템플릿 항목 상태 업데이트
      ChecklistModule.state.templates.forEach(item => {
        if (states[item.id] !== undefined) {
          item.completed = states[item.id]
        }
      })
      // 커스텀 항목 상태 업데이트
      ChecklistModule.state.customItems.forEach(item => {
        if (states[item.id] !== undefined) {
          item.completed = states[item.id]
        }
      })
    } catch (error) {
      console.error('Failed to parse saved states:', error)
    }
  }
}

function saveCustomItems() {
  localStorage.setItem('travel_checklist_custom_items', JSON.stringify(ChecklistModule.state.customItems))
  saveStates()
}

function saveStates() {
  const states = {}
  
  ChecklistModule.state.templates.forEach(item => {
    states[item.id] = item.completed
  })
  
  ChecklistModule.state.customItems.forEach(item => {
    states[item.id] = item.completed
  })
  
  localStorage.setItem('travel_checklist_states', JSON.stringify(states))
}

function showLoadingMessage() {
  ChecklistModule.elements.checklistCategories.innerHTML = `
    <div class="loading-checklist">
      <i class="fas fa-spinner fa-spin"></i>
      <h3>체크리스트 로딩 중</h3>
      <p>맞춤형 체크리스트를 준비하고 있습니다...</p>
    </div>
  `
}

function addNewItem() {
  const text = ChecklistModule.elements.newItemInput.value.trim()
  const category = ChecklistModule.elements.itemCategory.value

  if (!text) {
    showNotification("체크리스트 항목을 입력해주세요.", "warning")
    return
  }

  const newItem = {
    id: `custom_${Date.now()}`,
    text: text,
    completed: false,
    category: category,
    isRequired: false,
    source: 'custom'
  }

  ChecklistModule.state.customItems.push(newItem)
  ChecklistModule.elements.newItemInput.value = ""
  
  saveCustomItems()
  renderChecklist()
  
  showNotification("새 항목이 추가되었습니다.", "success")
}

function toggleItem(id) {
  // 템플릿 항목에서 찾기
  let item = ChecklistModule.state.templates.find(item => item.id === id)
  
  // 커스텀 항목에서 찾기
  if (!item) {
    item = ChecklistModule.state.customItems.find(item => item.id === id)
  }
  
  if (item) {
    item.completed = !item.completed
    saveStates()
    renderChecklist()
  }
}

function deleteItem(id) {
  // 커스텀 항목만 삭제 가능
  const itemIndex = ChecklistModule.state.customItems.findIndex(item => item.id === id)
  
  if (itemIndex !== -1) {
    ChecklistModule.state.customItems.splice(itemIndex, 1)
    saveCustomItems()
    renderChecklist()
    showNotification("항목이 삭제되었습니다.", "success")
  } else {
    showNotification("기본 항목은 삭제할 수 없습니다.", "warning")
  }
}

function renderChecklist() {
  updateProgress()
  renderCategories()
}

function updateProgress() {
  const allItems = [...ChecklistModule.state.templates, ...ChecklistModule.state.customItems]
  const completedCount = allItems.filter(item => item.completed).length
  const totalCount = allItems.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  ChecklistModule.elements.progressText.textContent = `진행률: ${completedCount}개 중 ${totalCount}개 완료`
  ChecklistModule.elements.progressPercent.textContent = `${Math.round(progress)}%`
  ChecklistModule.elements.progressFill.style.width = `${progress}%`
}

function renderCategories() {
  const categories = ["Documents", "Travel", "Insurance", "Finance", "Health", "Packing", "Apps", "Safety", "General"]
  const allItems = [...ChecklistModule.state.templates, ...ChecklistModule.state.customItems]

  ChecklistModule.elements.checklistCategories.innerHTML = ""

  categories.forEach(category => {
    const categoryItems = allItems.filter(item => item.category === category)
    if (categoryItems.length === 0) return

    const completedCount = categoryItems.filter(item => item.completed).length
    const progress = (completedCount / categoryItems.length) * 100
    const requiredCount = categoryItems.filter(item => item.isRequired).length

    const categorySection = document.createElement("div")
    categorySection.className = "category-section"
    categorySection.innerHTML = `
      <div class="category-header">
        <div class="category-title">
          ${getCategoryTitle(category)}
          ${requiredCount > 0 ? `<span class="required-indicator">(필수 ${requiredCount}개)</span>` : ''}
        </div>
        <div class="category-count">${completedCount}/${categoryItems.length}</div>
      </div>
      <div class="category-progress">
        <div class="category-progress-fill" style="width: ${progress}%"></div>
      </div>
      <div class="category-items">
        ${categoryItems.map(item => `
          <div class="checklist-item ${item.completed ? "completed" : ""} ${item.isRequired ? "required" : ""}">
            <div class="item-main">
              <input type="checkbox" id="item-${item.id}" ${item.completed ? "checked" : ""} 
                     onchange="toggleItem('${item.id}')">
              <label for="item-${item.id}" class="item-label">
                <span class="item-text">${item.text}</span>
                ${item.isRequired ? '<span class="required-badge">필수</span>' : ''}
                ${item.estimatedTime ? `<span class="time-estimate">${item.estimatedTime}</span>` : ''}
              </label>
            </div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            <div class="item-actions">
              ${item.source === 'custom' ? `
                <button class="delete-item-btn" onclick="deleteItem('${item.id}')" title="삭제">
                  <i class="fas fa-trash"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `).join("")}
      </div>
    `

    ChecklistModule.elements.checklistCategories.appendChild(categorySection)
  })
}

function getCategoryTitle(category) {
  const titles = {
    "Documents": "서류",
    "Travel": "여행",
    "Insurance": "보험",
    "Finance": "금융",
    "Health": "건강",
    "Packing": "짐싸기",
    "Apps": "앱/기술",
    "Safety": "안전",
    "General": "일반"
  }
  return titles[category] || category
}

// 전역 함수로 등록
window.toggleItem = toggleItem
window.deleteItem = deleteItem
