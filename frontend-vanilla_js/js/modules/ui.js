// UI 렌더링
export class UIRenderer {
    constructor(state, dom, api) {
        this.state = state;
        this.dom = dom;
        this.api = api;
        this.documentSources = [];
    }

    // 셀렉트 박스 렌더링
    renderSelects(countries, topics, models) {
        // API 매핑이 없을 경우 기본 매핑 사용
        const countryMap = this.api?.countryMap || {};
        const topicMap = this.api?.topicMap || {};
        
        this.dom.populateSelect(this.dom.$.country, countries, countryMap);
        this.dom.populateSelect(this.dom.$.topic, topics, topicMap);
        this.renderModels(models);
        
        // 기본값 설정
        this.dom.$.country.value = this.state.country;
        this.dom.$.topic.value = this.state.topic;
        this.dom.$.model.value = this.state.model;
    }

    renderModels(models) {
        const select = this.dom.$.model;
        if (!select) return;
        
        this.dom.clear(select);
        const modelList = models.available_models || models;
        
        modelList.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            select.appendChild(option);
        });
    }

    // 채팅 리스트 렌더링
    renderChatList() {
        const container = this.dom.$.chatList;
        if (!container) return;

        if (this.state.chats.length === 0) {
            container.innerHTML = '<span class="text-gray-400 text-sm">대화가 없습니다</span>';
            return;
        }

        container.innerHTML = this.state.chats.map(chat => `
            <button class="chat-list-item text-left px-3 py-2 rounded-lg hover:bg-primary/10 text-gray-800 w-full truncate transition-all ${
                chat.id === this.state.activeChat ? 'bg-primary/20' : ''
            }" data-chat-id="${chat.id}">
                💬 ${chat.title}
            </button>
        `).join('');
    }

    // 채팅 메시지 렌더링
    renderChat() {
        const container = this.dom.$.chatMessages;
        if (!container) return;

        const activeChat = this.state.getActiveChat();
        
        if (!activeChat) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-16">
                    <p class="text-lg font-medium mb-2">대화를 시작하려면</p>
                    <p class="text-sm">'새 대화' 버튼을 클릭하세요</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activeChat.messages.map(message => `
            <div class="flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4">
                ${this.renderMessage(message)}
            </div>
        `).join('');

        this.dom.scrollToBottom(this.dom.$.chatArea);
    }

    renderMessage(message) {
        if (message.role === "bot") {
            return `
                <div class="flex items-end gap-2">
                    <img src="assets/mascot.png" class="w-7 h-7" alt="bot" onerror="this.style.display='none'">
                    <span class="bg-primary/90 text-white px-4 py-2 rounded-2xl rounded-bl-sm max-w-[70%] shadow-sm whitespace-pre-wrap">${message.text}</span>
                </div>
            `;
        } else {
            return `
                <div class="flex items-end gap-2">
                    <span class="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-br-sm max-w-[70%] shadow-sm whitespace-pre-wrap">${message.text}</span>
                    <div class="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white">나</div>
                </div>
            `;
        }
    }

    // FAQ 렌더링
    renderFAQ(examples, sources = []) {
        if (examples.length === 0) {
            this.dom.hide(this.dom.$.faqSection);
            return;
        }

        this.dom.show(this.dom.$.faqSection);
        
        this.dom.$.faqCards.innerHTML = `
            <div class="faq-cards-wrapper">
                ${examples.map(question => `
                    <button class="faq-card min-w-[220px] max-w-[260px] bg-white border border-gray-200 rounded-xl px-5 py-4 text-left flex-shrink-0 hover:ring-4 hover:ring-primary/30 focus:outline-none transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                        <div class="faq-question text-primary font-bold mb-2">${question}</div>
                    </button>
                `).join('')}
            </div>
        `;

        // 소스 정보 표시
        this.documentSources = sources;
        if (sources.length > 0) {
            if (this.dom.$.sourcesCount) {
                this.dom.$.sourcesCount.textContent = sources.length;
            }
            if (this.dom.$.sourcesInfo) {
                this.dom.show(this.dom.$.sourcesInfo);
            }
        } else {
            if (this.dom.$.sourcesInfo) {
                this.dom.hide(this.dom.$.sourcesInfo);
            }
        }
    }

    // 로딩 표시
    showLoading() {
        if (!this.dom.$.chatMessages) return;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = `
            <div class="flex justify-start mb-4">
                <div class="flex items-end gap-2">
                    <img src="assets/mascot.png" class="w-7 h-7" alt="bot" onerror="this.style.display='none'">
                    <span class="bg-primary/90 text-white px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                        <span class="loading-dots">답변 생성 중</span>
                    </span>
                </div>
            </div>
        `;
        this.dom.$.chatMessages.appendChild(loadingDiv);
        this.dom.scrollToBottom(this.dom.$.chatArea);
    }

    hideLoading() {
        document.getElementById('loadingMessage')?.remove();
    }

    // 인터페이스 상태 업데이트
    updateInterface() {
        const isActive = this.state.activeChat !== null;
        const isLoading = this.state.loading;

        // 채팅 영역
        this.dom.$.chatArea?.classList.toggle('opacity-50', !isActive);
        
        // 입력 폼
        this.dom.$.chatForm?.classList.toggle('opacity-50', !isActive);
        if (this.dom.$.messageInput) {
            this.dom.$.messageInput.disabled = !isActive || isLoading;
            this.dom.$.messageInput.placeholder = isActive ? "질문을 입력하세요" : "새 대화 시작 버튼을 눌러주세요";
        }
        
        // 전송 버튼
        if (this.dom.$.sendBtn) {
            this.dom.$.sendBtn.disabled = !isActive || isLoading;
            this.dom.$.sendBtn.textContent = isLoading ? "전송 중..." : "전송";
            this.dom.$.sendBtn.classList.toggle('opacity-60', this.dom.$.sendBtn.disabled);
        }
    }

    // 소스 모달
    showSourcesModal() {
        if (!this.documentSources.length || !this.dom.$.sourcesList) return;
        
        this.dom.$.sourcesList.innerHTML = this.documentSources.map((source, index) => `
            <div class="flex items-start py-2 border-b border-gray-100 last:border-0">
                <span class="text-gray-400 mr-2">${index + 1}.</span>
                <a href="${source}" target="_blank" class="text-sm text-blue-600 hover:underline break-all">
                    ${this.getDomain(source)}
                </a>
            </div>
        `).join('');
        
        this.dom.show(this.dom.$.sourcesModal);
    }

    hideSourcesModal() {
        this.dom.hide(this.dom.$.sourcesModal);
    }

    // 실시간 정보 렌더링
    async renderRealtimeInfo() {
        try {
            const country = this.state.get('country');
            if (!country) {
                this.dom.hide(this.dom.$.realtimeSection);
                return;
            }

            this.dom.show(this.dom.$.realtimeSection);

            // 환율 정보
            const exchangeData = await this.api.getExchangeRates();
            this.renderExchangeRates(exchangeData);

            // 날씨 정보
            const weatherData = await this.api.getWeatherInfo(country);
            this.renderWeatherInfo(weatherData);

            // 대사관 공지
            const noticesData = await this.api.getEmbassyNotices(country, null, 5);
            this.renderEmbassyNotices(noticesData);

        } catch (error) {
            console.error('실시간 정보 렌더링 실패:', error);
        }
    }

    renderExchangeRates(data) {
        if (!this.dom.$.exchangeRates || !data.rates) return;

        const html = `
            <div class="bg-white rounded-lg p-4 shadow">
                <h3 class="text-lg font-bold mb-3">환율 정보</h3>
                <div class="grid grid-cols-2 gap-2">
                    ${Object.entries(data.rates).map(([currency, info]) => `
                        <div class="flex justify-between">
                            <span class="font-medium">${currency}:</span>
                            <span>${info.rate ? info.rate.toFixed(2) : 'N/A'}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="text-xs text-gray-500 mt-2">
                    기준: ${data.base_currency}
                </div>
            </div>
        `;
        this.dom.$.exchangeRates.innerHTML = html;
    }

    renderWeatherInfo(data) {
        if (!this.dom.$.weatherInfo || !data.weather_info || data.weather_info.length === 0) return;

        const weather = data.weather_info[0]; // 첫 번째 도시 정보
        const html = `
            <div class="bg-white rounded-lg p-4 shadow">
                <h3 class="text-lg font-bold mb-3">날씨 정보</h3>
                <div class="text-center">
                    <div class="text-2xl font-bold">${weather.temperature}°C</div>
                    <div class="text-gray-600">${weather.city}, ${weather.country}</div>
                    <div class="text-sm text-gray-500">${weather.description}</div>
                    <div class="text-xs text-gray-400 mt-2">습도: ${weather.humidity}%</div>
                </div>
            </div>
        `;
        this.dom.$.weatherInfo.innerHTML = html;
    }

    renderEmbassyNotices(data) {
        if (!this.dom.$.embassyNotices || !data.notices) return;

        const html = `
            <div class="bg-white rounded-lg p-4 shadow">
                <h3 class="text-lg font-bold mb-3">대사관 공지</h3>
                <div class="space-y-2">
                    ${data.notices.map(notice => `
                        <div class="border-l-4 ${
                            notice.importance === 'high' ? 'border-red-500' :
                            notice.importance === 'medium' ? 'border-yellow-500' :
                            'border-blue-500'
                        } pl-3">
                            <div class="font-medium text-sm">${notice.title}</div>
                            <div class="text-xs text-gray-500">${new Date(notice.notice_date).toLocaleDateString()}</div>
                            <a href="${notice.url}" target="_blank" class="text-blue-600 text-xs hover:underline">자세히 보기</a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        this.dom.$.embassyNotices.innerHTML = html;
    }

    // 체크리스트 렌더링
    async renderChecklists() {
        try {
            const country = this.state.get('country');
            const topic = this.state.get('topic');
            
            if (!country || !topic) {
                this.dom.hide(this.dom.$.checklistSection);
                return;
            }

            this.dom.show(this.dom.$.checklistSection);

            const data = await this.api.getChecklists(country, topic);
            this.renderChecklistList(data.checklists || []);

        } catch (error) {
            console.error('체크리스트 렌더링 실패:', error);
        }
    }

    renderChecklistList(checklists) {
        if (!this.dom.$.checklistList) return;

        if (checklists.length === 0) {
            this.dom.$.checklistList.innerHTML = '<div class="text-gray-500 text-center p-4">해당 조건의 체크리스트가 없습니다.</div>';
            return;
        }

        const html = checklists.map(checklist => `
            <div class="bg-white rounded-lg p-4 shadow cursor-pointer hover:shadow-md transition-shadow" 
                 onclick="window.travelBotApp.showChecklistDetail(${checklist.id})">
                <h4 class="font-bold text-lg mb-2">${checklist.name}</h4>
                <p class="text-gray-600 text-sm mb-3">${checklist.description}</p>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-blue-600">전체 ${checklist.items_count}개 항목</span>
                    <span class="text-red-600">필수 ${checklist.required_items_count}개</span>
                </div>
            </div>
        `).join('');
        
        this.dom.$.checklistList.innerHTML = html;
    }

    // 커뮤니티 렌더링
    async renderCommunity() {
        try {
            const country = this.state.get('country');
            const topic = this.state.get('topic');
            
            this.dom.show(this.dom.$.communitySection);

            const filters = {};
            if (country) filters.country = country;
            if (topic) filters.topic = topic;
            filters.limit = 10;
            filters.sort = 'recent';

            const data = await this.api.getCommunityPosts(filters);
            this.renderCommunityPosts(data.posts || []);

        } catch (error) {
            console.error('커뮤니티 렌더링 실패:', error);
        }
    }

    renderCommunityPosts(posts) {
        if (!this.dom.$.communityPosts) return;

        if (posts.length === 0) {
            this.dom.$.communityPosts.innerHTML = `
                <div class="text-center p-8">
                    <div class="text-gray-500 mb-4">아직 작성된 게시글이 없습니다.</div>
                    <button onclick="window.travelBotApp.showPostForm()" 
                            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        첫 번째 게시글 작성하기
                    </button>
                </div>
            `;
            return;
        }

        const html = `
            <div class="mb-4">
                <button onclick="window.travelBotApp.showPostForm()" 
                        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    새 게시글 작성
                </button>
            </div>
            <div class="space-y-4">
                ${posts.map(post => this.renderCommunityPost(post)).join('')}
            </div>
        `;
        
        this.dom.$.communityPosts.innerHTML = html;
    }

    renderCommunityPost(post) {
        const typeColors = {
            'review': 'bg-green-100 text-green-800',
            'question': 'bg-blue-100 text-blue-800',
            'tip': 'bg-yellow-100 text-yellow-800',
            'info': 'bg-purple-100 text-purple-800'
        };

        const typeColor = typeColors[post.post_type] || 'bg-gray-100 text-gray-800';

        return `
            <div class="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-pointer"
                 onclick="window.travelBotApp.showPostDetail(${post.id})">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 text-xs rounded ${typeColor}">
                            ${post.post_type_display}
                        </span>
                        ${post.rating ? `<div class="text-yellow-500">${'⭐'.repeat(post.rating)}</div>` : ''}
                    </div>
                    <div class="text-xs text-gray-500">
                        ${new Date(post.created_at).toLocaleDateString()}
                    </div>
                </div>
                <h3 class="font-bold text-lg mb-2">${post.title}</h3>
                <p class="text-gray-600 text-sm mb-3">${post.content}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <div class="flex items-center space-x-4">
                        <span>👀 ${post.views}</span>
                        <span>❤️ ${post.likes}</span>
                        <span>💬 ${post.comments_count}</span>
                    </div>
                    <span class="font-medium">${post.author_name}</span>
                </div>
            </div>
        `;
    }

    getDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    }
}