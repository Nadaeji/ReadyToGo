// DOM 관리
export class DOMManager {
    constructor() {
        this.$ = this.getElements();
    }

    getElements() {
        return {
            // 셀렉트 박스
            country: document.getElementById('country'),
            topic: document.getElementById('topic'),
            model: document.getElementById('model'),
            
            // 버튼
            newChatBtn: document.getElementById('newChatBtn'),
            sendBtn: document.getElementById('sendBtn'),
            
            // 채팅 영역
            chatList: document.getElementById('chatList'),
            chatArea: document.getElementById('chatArea'),
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            chatForm: document.getElementById('chatForm'),
            
            // FAQ 영역
            faqSection: document.getElementById('faqSection'),
            faqCards: document.getElementById('faqCards'),
            sourcesInfo: document.getElementById('sourcesInfo'),
            
            // 소스 모달
            sourcesBtn: document.getElementById('sourcesBtn'),
            sourcesCount: document.getElementById('sourcesCount'),
            sourcesModal: document.getElementById('sourcesModal'),
            sourcesList: document.getElementById('sourcesList'),
            closeSourcesModal: document.getElementById('closeSourcesModal'),

            // 신규 기능 버튼
            realtimeBtn: document.getElementById('realtimeBtn'),
            checklistBtn: document.getElementById('checklistBtn'),
            communityBtn: document.getElementById('communityBtn'),

            // 실시간 정보 영역
            realtimeSection: document.getElementById('realtimeSection'),
            exchangeRates: document.getElementById('exchangeRates'),
            weatherInfo: document.getElementById('weatherInfo'),
            embassyNotices: document.getElementById('embassyNotices'),

            // 체크리스트 영역
            checklistSection: document.getElementById('checklistSection'),
            checklistList: document.getElementById('checklistList'),

            // 커뮤니티 영역
            communitySection: document.getElementById('communitySection'),
            communityPosts: document.getElementById('communityPosts'),
            postForm: document.getElementById('postForm'),
            postModal: document.getElementById('postModal'),
            createPostBtn: document.getElementById('createPostBtn'),
            closePostModal: document.getElementById('closePostModal')
        };
    }

    // 유틸리티
    show(element) {
        element?.classList.remove('hidden');
    }

    hide(element) {
        element?.classList.add('hidden');
    }

    clear(element) {
        if (element) element.innerHTML = '';
    }

    scrollToBottom(element) {
        setTimeout(() => {
            if (element) element.scrollTop = element.scrollHeight;
        }, 100);
    }

    populateSelect(select, options, mapping = {}) {
        if (!select) return;
        
        select.innerHTML = '<option value="">선택하세요</option>';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = mapping[option] || option;
            select.appendChild(opt);
        });
    }
}