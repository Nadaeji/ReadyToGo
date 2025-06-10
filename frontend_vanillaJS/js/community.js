// Community module
const CommunityModule = {
  elements: {
    communitySearch: document.getElementById("communitySearch"),
    newPostBtn: document.getElementById("newPostBtn"),
    newPostForm: document.getElementById("newPostForm"),
    postTitle: document.getElementById("postTitle"),
    postCategory: document.getElementById("postCategory"),
    postContent: document.getElementById("postContent"),
    submitPostBtn: document.getElementById("submitPostBtn"),
    cancelPostBtn: document.getElementById("cancelPostBtn"),
    communityPosts: document.getElementById("communityPosts"),
    filterBtns: document.querySelectorAll(".filter-btn"),
  },

  state: {
    posts: [],
    selectedCategory: "All",
    searchTerm: "",
    currentPage: 1,
    hasMore: true,
    isLoading: false,
    currentCountry: null,
    currentTopic: null,
  }
}

function initCommunity() {
  setupCommunityEventListeners()
  loadPosts()
}

function setupCommunityEventListeners() {
  CommunityModule.elements.newPostBtn.addEventListener("click", toggleNewPostForm)
  CommunityModule.elements.submitPostBtn.addEventListener("click", submitPost)
  CommunityModule.elements.cancelPostBtn.addEventListener("click", () => toggleNewPostForm(false))

  CommunityModule.elements.communitySearch.addEventListener("input", debounce((e) => {
    CommunityModule.state.searchTerm = e.target.value
    resetAndLoadPosts()
  }, 300))

  CommunityModule.elements.filterBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      CommunityModule.state.selectedCategory = e.target.dataset.category
      updateFilterButtons()
      resetAndLoadPosts()
    })
  })

  // 국가/토픽 변경 감지
  window.addEventListener("configChanged", (e) => {
    const { country, topic } = e.detail.config
    if (country !== CommunityModule.state.currentCountry || topic !== CommunityModule.state.currentTopic) {
      CommunityModule.state.currentCountry = country
      CommunityModule.state.currentTopic = topic
      resetAndLoadPosts()
    }
  })

  // 탭 변경 감지
  window.addEventListener("tabChanged", (e) => {
    if (e.detail.tab === "community") {
      resetAndLoadPosts()
    }
  })
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function resetAndLoadPosts() {
  CommunityModule.state.currentPage = 1
  CommunityModule.state.posts = []
  CommunityModule.state.hasMore = true
  CommunityModule.elements.communityPosts.innerHTML = ""
  loadPosts()
}

async function loadPosts() {
  if (CommunityModule.state.isLoading) return
  
  CommunityModule.state.isLoading = true
  showLoadingMessage()

  try {
    const params = {
      page: CommunityModule.state.currentPage,
      limit: 10,
      sort: 'recent'
    }

    // 필터 적용
    if (CommunityModule.state.selectedCategory !== "All") {
      params.type = mapCategoryToBackend(CommunityModule.state.selectedCategory)
    }

    if (CommunityModule.state.currentCountry) {
      params.country = CommunityModule.state.currentCountry
    }

    if (CommunityModule.state.currentTopic) {
      params.topic = mapTopicToBackend(CommunityModule.state.currentTopic)
    }

    const response = await apiGet(API_CONFIG.ENDPOINTS.COMMUNITY_POSTS, params)
    
    if (response.posts) {
      if (CommunityModule.state.currentPage === 1) {
        CommunityModule.state.posts = response.posts
      } else {
        CommunityModule.state.posts.push(...response.posts)
      }

      renderPosts()
    } else {
      loadMockPosts()
    }

  } catch (error) {
    console.error("Failed to load community posts:", error)
    loadMockPosts()
    showNotification("커뮤니티 게시글을 불러오는데 실패했습니다. 예시 데이터를 표시합니다.", "warning")
  } finally {
    CommunityModule.state.isLoading = false
    hideLoadingMessage()
  }
}

function mapCategoryToBackend(category) {
  const mapping = {
    "Housing": "housing",
    "Visa": "visa", 
    "Insurance": "insurance",
    "Safety": "safety",
    "Culture": "culture",
    "Jobs": "jobs",
    "General": "general"
  }
  return mapping[category] || category.toLowerCase()
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

function loadMockPosts() {
  const mockPosts = [
    {
      id: "1",
      author_name: "김수진",
      title: "서울에서 외국인이 살기 좋은 동네 추천",
      content: "2년간 서울에서 거주하면서 경험한 여러 동네들을 공유하고 싶어요. 강남은 비싸지만 편리하고, 홍대는 밤문화가 좋지만...",
      post_type: "tip",
      post_type_display: "팁",
      country: "South Korea",
      topic: "housing",
      views: 124,
      likes: 24,
      comments_count: 8,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2", 
      author_name: "Mike Johnson",
      title: "일본 비자 연장 과정 - 2024년 업데이트",
      content: "최근에 비자 연장을 마쳤는데, 작년과 비교해서 달라진 점들이 있어서 공유드립니다. 서류가 좀 더 간소화되었고...",
      post_type: "info",
      post_type_display: "정보",
      country: "Japan",
      topic: "visa",
      views: 89,
      likes: 18,
      comments_count: 12,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      author_name: "Emma Chen", 
      title: "디지털 노마드를 위한 여행자 보험 비교",
      content: "장기 여행자를 위한 보험 상품들을 비교해봤습니다. 상위 5개 보험사의 장단점을 정리해서 공유드려요...",
      post_type: "review",
      post_type_display: "후기",
      country: "Thailand",
      topic: "insurance",
      views: 156,
      likes: 31,
      comments_count: 15,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  CommunityModule.state.posts = mockPosts
  renderPosts()
}

function showLoadingMessage() {
  CommunityModule.elements.communityPosts.innerHTML = `
    <div class="loading-community">
      <i class="fas fa-spinner fa-spin"></i>
      <h3>커뮤니티 게시글 로딩 중</h3>
      <p>최신 게시글을 불러오고 있습니다...</p>
    </div>
  `
}

function hideLoadingMessage() {
  const spinner = document.getElementById('loadMoreSpinner')
  if (spinner) {
    spinner.remove()
  }
}

function toggleNewPostForm(show = null) {
  const isVisible = CommunityModule.elements.newPostForm.style.display !== "none"
  const shouldShow = show !== null ? show : !isVisible

  CommunityModule.elements.newPostForm.style.display = shouldShow ? "block" : "none"

  if (!shouldShow) {
    CommunityModule.elements.postTitle.value = ""
    CommunityModule.elements.postContent.value = ""
    CommunityModule.elements.postCategory.value = "General"
  } else {
    CommunityModule.elements.postTitle.focus()
  }
}

async function submitPost() {
  const title = CommunityModule.elements.postTitle.value.trim()
  const content = CommunityModule.elements.postContent.value.trim()
  const category = CommunityModule.elements.postCategory.value

  if (!title || !content) {
    showNotification("제목과 내용을 모두 입력해주세요.", "warning")
    return
  }

  setLoadingState(CommunityModule.elements.submitPostBtn, true)

  try {
    const postData = {
      title: title,
      content: content,
      post_type: mapCategoryToBackend(category),
      country: CommunityModule.state.currentCountry || "Global",
      topic: mapTopicToBackend(CommunityModule.state.currentTopic) || "general",
      author_name: "익명"
    }

    const response = await apiPost(API_CONFIG.ENDPOINTS.COMMUNITY_CREATE_POST, postData)
    
    if (response.id) {
      showNotification("게시글이 성공적으로 작성되었습니다.", "success")
      toggleNewPostForm(false)
      resetAndLoadPosts()
    }

  } catch (error) {
    console.error("Failed to create post:", error)
    addMockPost(title, content, category)
    showNotification("게시글이 임시로 저장되었습니다.", "warning")
  } finally {
    setLoadingState(CommunityModule.elements.submitPostBtn, false)
  }
}

function addMockPost(title, content, category) {
  const newPost = {
    id: `temp_${Date.now()}`,
    author_name: "나",
    title: title,
    content: content,
    post_type: mapCategoryToBackend(category),
    post_type_display: category,
    country: CommunityModule.state.currentCountry || "Global",
    topic: mapTopicToBackend(CommunityModule.state.currentTopic) || "general",
    views: 0,
    likes: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
  }

  CommunityModule.state.posts.unshift(newPost)
  toggleNewPostForm(false)
  renderPosts()
}

function updateFilterButtons() {
  CommunityModule.elements.filterBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.category === CommunityModule.state.selectedCategory)
  })
}

function renderPosts() {
  let filteredPosts = CommunityModule.state.posts
  
  if (CommunityModule.state.searchTerm) {
    const searchLower = CommunityModule.state.searchTerm.toLowerCase()
    filteredPosts = filteredPosts.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower)
    )
  }

  CommunityModule.elements.communityPosts.innerHTML = ""

  if (filteredPosts.length === 0) {
    CommunityModule.elements.communityPosts.innerHTML = `
      <div class="no-posts-message">
        <i class="fas fa-comments"></i>
        <h3>게시글이 없습니다</h3>
        <p>첫 번째 게시글을 작성해보세요!</p>
      </div>
    `
    return
  }

  filteredPosts.forEach(post => {
    const postElement = document.createElement("div")
    postElement.className = "post-item"
    
    const timeAgo = getTimeAgo(post.created_at)
    const authorInitials = post.author_name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
    
    postElement.innerHTML = `
      <div class="post-header">
        <div class="post-avatar">
          ${authorInitials}
        </div>
        <div class="post-meta">
          <div class="post-author-info">
            <div class="post-author">${post.author_name}</div>
            <div class="post-type-badge ${post.post_type}">${post.post_type_display}</div>
          </div>
          <div class="post-location-time">
            ${post.country} • ${timeAgo}
          </div>
        </div>
      </div>
      <div class="post-content" onclick="viewPostDetail('${post.id}')">
        <div class="post-title">${post.title}</div>
        <div class="post-text">${truncateContent(post.content, 150)}</div>
      </div>
      <div class="post-actions">
        <button class="post-action" onclick="toggleLike('${post.id}')">
          <i class="fas fa-heart"></i>
          <span id="likes-${post.id}">${post.likes}</span>
        </button>
        <button class="post-action" onclick="viewPostDetail('${post.id}')">
          <i class="fas fa-comment"></i>
          ${post.comments_count}
        </button>
        <button class="post-action" onclick="sharePost('${post.id}')">
          <i class="fas fa-share"></i>
          공유
        </button>
        <div class="post-views">
          <i class="fas fa-eye"></i>
          ${post.views}
        </div>
      </div>
    `

    CommunityModule.elements.communityPosts.appendChild(postElement)
  })
}

function truncateContent(content, maxLength) {
  if (content.length <= maxLength) {
    return content
  }
  return content.substring(0, maxLength) + '...'
}

function getTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) {
    return '방금 전'
  } else if (diffMins < 60) {
    return `${diffMins}분 전`
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`
  } else if (diffDays < 7) {
    return `${diffDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR')
  }
}

async function toggleLike(id) {
  try {
    const requestData = {
      post_id: id,
      user_session: getSessionId()
    }

    const response = await apiPost(API_CONFIG.ENDPOINTS.COMMUNITY_TOGGLE_LIKE, requestData)
    
    if (response.likes_count !== undefined) {
      const likesElement = document.getElementById(`likes-${id}`)
      if (likesElement) {
        likesElement.textContent = response.likes_count
      }
      
      const post = CommunityModule.state.posts.find(p => p.id === id)
      if (post) {
        post.likes = response.likes_count
      }
    }
    
  } catch (error) {
    console.error('Failed to toggle like:', error)
    const post = CommunityModule.state.posts.find(p => p.id === id)
    if (post) {
      post.likes += 1
      const likesElement = document.getElementById(`likes-${id}`)
      if (likesElement) {
        likesElement.textContent = post.likes
      }
    }
    showNotification('좋아요가 임시로 적용되었습니다.', 'info')
  }
}

function viewPostDetail(postId) {
  const post = CommunityModule.state.posts.find(p => p.id === postId)
  if (post) {
    showNotification("게시글 상세보기 기능은 추후 구현 예정입니다.", "info")
  }
}

function sharePost(postId) {
  const post = CommunityModule.state.posts.find(p => p.id === postId)
  if (post) {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content.substring(0, 100) + '...',
        url: window.location.href + '#post-' + postId
      })
    } else {
      const url = window.location.href + '#post-' + postId
      navigator.clipboard.writeText(url).then(() => {
        showNotification('링크가 클립보드에 복사되었습니다.', 'success')
      })
    }
  }
}

// 전역 함수로 등록
window.toggleLike = toggleLike
window.viewPostDetail = viewPostDetail
window.sharePost = sharePost
