# 백엔드 아키텍쳐 (Django)

## 프로젝트 핵심 구조

```
backend_django/
├── manage.py                      # Django 관리 명령어 실행
├── config/                        # Django 설정
│   ├── settings.py               # 환경설정 (DB, API키, CORS 등)
│   ├── urls.py                   # 메인 URL 라우팅
│   ├── wsgi.py                   # WSGI 배포 설정
│   └── asgi.py                   # ASGI 비동기 설정
├── core/                          # 핵심 모델 및 공통 기능
│   ├── models.py                 # 데이터베이스 모델 (Document, Conversation, Message, FAQ)
│   ├── views.py                  # 기본 API (헬스체크, 국가/토픽 목록)
│   ├── urls.py                   # core 앱 URL 라우팅
│   └── admin.py                  # Django Admin 설정
├── chat/                          # 채팅 기능 (통합형)
│   ├── views.py                  # 모든 채팅 로직 (API + 비즈니스 로직)
│   ├── urls.py                   # 채팅 관련 URL 라우팅
│   ├── models.py                 # 채팅 모델 (현재 core에서 관리)
│   └── apps.py                   # 앱 설정
├── ai_services/                   # AI 서비스 모듈
│   ├── llm.py                    # LLM 모델 통합 (OpenAI, Gemini, Phi-2)
│   ├── rag.py                    # RAG 시스템 (ChromaDB + 번역)
│   └── fine_tuning/              # 파인튜닝 관련 코드
│       ├── finetuning_phi-2_v2.ipynb     # 파인튜닝 모델 학습
│       ├── qa_pair_generator.py # QA 쌍 생성기
│       └── inf_test.ipynb       # 파인튜닝 모델 로드 및 기동(추론테스트 포함)
├── data/                        
│   └── vectors/                 
│       ├── chroma.sqlite3       # ChromaDB 메타데이터
├── requirements.txt               # Python 패키지 의존성
└── .env                          # 환경변수 (API 키, DB 설정)
```

### **1. config/ - Django 설정 중심**

- **settings.py**: 전체 Django 프로젝트의 핵심 설정
  - 데이터베이스 연결 (MySQL)
  - API 키 관리 (OpenAI, Google, GPU 서버)
  - CORS 설정 (프론트엔드 연동)
  - REST Framework 설정
  - 로깅 설정
- **urls.py**: 메인 URL 라우터, 각 앱의 URL을 통합

### **2. core/ - 데이터 모델 및 기본 기능**

- **models.py**: 핵심 데이터베이스 모델 정의
  - `Document`: PDF 문서 정보 및 메타데이터
  - `Conversation`: 채팅 세션 관리
  - `Message`: 개별 채팅 메시지 (RAG 참조 포함)
  - `FAQ`: 자주 묻는 질문
  - `COUNTRIES`, `TOPICS`: 상수 데이터
- **views.py**: 기본 API 엔드포인트
  - 헬스 체크, 앱 정보
  - 국가 목록, 토픽 목록, 문서 출처
- **management/commands/**: Django 커스텀 명령어
  - PDF 문서 자동 인덱싱
  - 데이터 마이그레이션 도구

### **3. chat/ - 채팅 시스템**

- **views.py**: 채팅 관련 모든 비즈니스 로직
  - `create_conversation()`: 새 채팅 세션 생성
  - `process_message()`: 사용자 메시지 처리 및 AI 응답 생성
  - `get_conversation_history()`: 채팅 기록 조회
  - `get_available_models()`: 사용 가능한 AI 모델 목록
  - `get_example_questions()`: 예시 질문 반환
  - `get_document_sources()`: 문서 출처 URL 제공

### **4. ai_services/ - AI 핵심 기능**

- **llm.py**: 다중 LLM 모델 통합 관리
  - OpenAI GPT-3.5/4 지원
  - Google Gemini 1.5 Flash 지원
  - Phi-2 Fine-tuned 모델 (GPU 서버 연동)
  - 자동 번역 기능 (한국어 ↔ 영어)
  - 폴백 체인 (모델 실패 시 자동 전환)

- **rag.py**: RAG(Retrieval-Augmented Generation) 시스템
  - ChromaDB 기반 벡터 검색
  - PDF 문서 자동 청킹 및 임베딩
  - 다국어 질의 번역 및 검색
  - MMR(Maximum Marginal Relevance) 검색
  - 메타데이터 필터링 (국가, 토픽별)

- **fine_tuning/**: 모델 파인튜닝 도구
  - Phi-2 모델 커스텀 학습
  - QA 쌍 자동 생성
  - 학습 데이터 전처리

### **5. data/ - 데이터 저장**

- **vectors/**: ChromaDB 벡터 데이터베이스
  - 문서 임베딩 저장
  - 메타데이터 관리
  - 지속성 보장

---

## 워크플로우

### **1. 서버 초기화**

```python
# 1. Django 서버 시작
python manage.py runserver

# 2. AI 서비스 인스턴스 생성 (싱글톤)
llm_instance = LLM()  # 다중 모델 지원
rag_instance = RAG()  # 벡터 검색 시스템

# 3. 데이터베이스 연결 확인
# MySQL 연결, 마이그레이션 적용
```

### **2. 채팅 플로우**

```python
# 1. 새 대화 세션 생성
POST /api/chat/conversation/
{
    "session_id": "unique_id",
    "country_id": "america",
    "topic_id": "visa"
}
→ Conversation 모델에 저장

# 2. 메시지 처리 파이프라인
POST /api/chat/message/
{
    "message": "미국 비자 신청 방법?",
    "conversation_id": 123,
    "model_id": "gpt-4"
}

# 3. RAG 검색 실행
query_translation = "How to apply for US visa?"
→ rag.search_with_translation(query, country="america", topic="visa")
→ ChromaDB에서 관련 문서 검색
→ context + references 반환

# 4. LLM 응답 생성
→ llm.generate_with_translation(query, context, references, history)
→ 영어로 응답 생성 후 한국어 번역

# 5. 응답 저장 및 반환
→ Message 모델에 저장 (references JSON 포함)
→ 프론트엔드로 응답 전송
```

### **3. 다중 모델 지원**

```python
# 모델별 처리 로직
if model_name.startswith("gemini-"):
    → _generate_gemini_response()
elif "phi" in model_name.lower():
    → _generate_phi_response()  # GPU 서버 호출
else:
    → _generate_openai_response()

# 폴백 체인
try:
    primary_model_response()
except Exception:
    fallback_model_response()
```

### **4. 번역 시스템**

```python
# 입력: 한국어 질문
korean_query = "미국 비자 신청 방법?"

# 1단계: 영어 번역
english_query = GoogleTranslator.translate(korean_query)
# → "How to apply for US visa?"

# 2단계: 영어로 RAG 검색 및 LLM 응답
english_response = llm.generate(english_query, context)

# 3단계: 한국어 번역
korean_response = translator.translate(english_response)
# → 자연스러운 한국어 응답
```

---

## API 엔드포인트

### **기본 정보 (core/)**

| Method | Endpoint | 설명 | 응답 |
|--------|----------|------|------|
| GET | `/api/` | 앱 정보 | 버전, 상태 정보 |
| GET | `/api/health/` | 헬스 체크 | 서버 상태 확인 |
| GET | `/api/countries/` | 국가 목록 | 이모지, 한국어명, 영어명 |
| GET | `/api/topics/` | 주제 목록 | visa, insurance, immigration 등 |
| GET | `/api/sources/` | 문서 출처 | 정부/대사관 URL |

### **채팅 (chat/)**

| Method | Endpoint | 설명 | 요청 데이터 |
|--------|----------|------|------------|
| POST | `/api/chat/conversation/` | 새 대화 세션 생성 | session_id, country_id, topic_id |
| POST | `/api/chat/message/` | 메시지 전송 | message, conversation_id, model_id |
| GET | `/api/chat/history/<id>/` | 대화 기록 조회 | - |
| GET | `/api/chat/examples/` | 예시 질문 | country, topic (쿼리 파라미터) |
| GET | `/api/chat/sources/` | 문서 출처 | country, topic (쿼리 파라미터) |
| GET | `/api/chat/settings/models/` | 사용 가능한 모델 | - |

---

## 데이터베이스 모델

### **Document**
```python
- title: 문서 제목
- url: 원본 URL
- country: 국가 (필터링용)
- topic: 주제 (필터링용)  
- source: 출처 정보
- created_at: 생성일시
```

### **Conversation**
```python
- session_id: 세션 식별자
- country: 선택한 국가
- topic: 선택한 주제
- created_at: 생성일시
```

### **Message**
```python
- conversation: 대화 참조
- role: user/assistant
- content: 메시지 내용
- references: RAG 참조 (JSON)
- created_at: 생성일시
```

### **FAQ**
```python
- question: 질문 내용
- country: 국가
- topic: 주제
- created_at: 생성일시
```

---

## 실행
```bash
# 백엔드 서버 시작
python manage.py runserver

# API 접속: http://localhost:8000/api/
```
