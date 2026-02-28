# Backend Service

> 마이크로서비스 아키텍처 기반의 확장 가능한 백엔드 시스템

## 📖 개요

본 프로젝트는 **NestJS**와 **Flask**를 활용한 마이크로서비스 아키텍처 기반의 백엔드 시스템입니다. Nginx를 API Gateway로 사용하여 각 서비스를 라우팅하며, PostgreSQL을 중앙 데이터베이스로 활용합니다.

### 주요 특징

- 🏗️ **마이크로서비스 아키텍처**: 서비스별 독립적인 개발/배포 가능
- 🔐 **JWT 기반 인증**: RSA 키 쌍을 활용한 안전한 토큰 기반 인증 시스템
- 🐳 **Docker 기반 배포**: 일관된 개발/프로덕션 환경 제공
- 🤖 **AI 기능 통합**: Flask 서비스를 통한 AI/LLM 기능 제공
- 📝 **게시판 시스템**: 이미지 업로드, 검색, 댓글, 평점 기능 지원
- 👥 **사용자 관리**: 회원가입, 로그인, 프로필 관리
- 📊 **관리자 기능**: 로그 조회, 게시글 고정 등

## �️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│                   Client                        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│          Nginx API Gateway (:80)                │
│  ┌─────────────────────────────────────────┐   │
│  │  Routing:                               │   │
│  │  • /api/*  → NestJS Service            │   │
│  │  • /llm/*  → Flask Service             │   │
│  └─────────────────────────────────────────┘   │
└──────────────┬───────────────┬──────────────────┘
               │               │
       ┌───────▼─────┐  ┌──────▼──────┐
       │   NestJS    │  │    Flask    │
       │  (:3000)    │  │   (:8000)   │
       │             │  │             │
       │ • Auth      │  │ • AI/LLM    │
       │ • Boards    │  │ • Search    │
       │ • Users     │  │ • Analytics │
       │ • Logs      │  │             │
       └──────┬──────┘  └──────┬──────┘
              │                │
              └────────┬───────┘
                       ▼
              ┌────────────────┐
              │  PostgreSQL    │
              │    (:5432)     │
              └────────────────┘
```

## 🛠️ 기술 스택

### Backend Services
- **NestJS** (TypeScript): 주요 API 서버, RESTful API, 인증/인가
- **Flask** (Python): AI/LLM 서비스, 데이터 분석

### Infrastructure
- **PostgreSQL 16**: 관계형 데이터베이스
- **Nginx**: API Gateway 및 리버스 프록시
- **Docker & Docker Compose**: 컨테이너 오케스트레이션

### Authentication
- **JWT (RS256)**: RSA 키 쌍 기반 토큰 인증
- **Passport.js**: NestJS 인증 전략

## 📂 프로젝트 구조

```
backend/
├── docker-compose.yml          # 서비스 오케스트레이션
├── .env.example               # 환경 변수 템플릿
│
├── nest/                      # NestJS 서비스
│   ├── src/
│   │   ├── auth/             # 인증/인가 모듈
│   │   │   ├── decorators/   # 커스텀 데코레이터
│   │   │   ├── dto/          # Data Transfer Objects
│   │   │   ├── guards/       # Auth Guards
│   │   │   └── strategies/   # Passport 전략
│   │   ├── boards/           # 게시판 모듈
│   │   │   ├── dto/          # 게시글 DTO
│   │   │   └── entities/     # 게시글 엔티티
│   │   ├── users/            # 사용자 모듈
│   │   │   ├── dto/          # 사용자 DTO
│   │   │   └── entities/     # 사용자 엔티티
│   │   ├── log/              # 로그 모듈
│   │   └── main.ts           # 애플리케이션 진입점
│   ├── uploads/              # 업로드된 파일 저장소
│   ├── Dockerfile
│   └── package.json
│
├── flask/                     # Flask 서비스
│   ├── app/
│   │   ├── __init__.py       # Flask 앱 초기화
│   │   ├── llm_service.py    # LLM 서비스 로직
│   │   └── models.py         # 데이터베이스 모델
│   ├── faiss_index/          # AI 검색 인덱스 (별도 다운로드)
│   ├── Dockerfile
│   └── requirements.txt
│
├── db/                        # PostgreSQL 설정
│   ├── init/                 # DB 초기화 스크립트
│   │   ├── 01-schemas.sql    # 스키마 정의
│   │   └── 02-base-tables.sql # 테이블 생성
│   └── data/                 # 데이터 볼륨 (자동 생성)
│
├── docker/
│   └── nginx.conf            # Nginx 설정
│
└── keys/                      # JWT 키 (생성 필요)
    ├── jwt_private.pem       # 개인 키 (NestJS)
    └── jwt_public.pem        # 공개 키 (Flask)
```

## 🚀 시작하기

### 사전 요구사항

- Docker 20.10+
- Docker Compose 2.0+
- OpenSSL (JWT 키 생성용)

### 설치 및 실행

#### 1. 저장소 클론

```bash
git clone <repository-url>
cd backend
```

#### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 환경에 맞게 설정:

```bash
# PostgreSQL 설정
PGUSER=your_db_user
PGPASSWORD=your_secure_password
PGDATABASE=your_database_name
DATABASE_URL=postgres://${PGUSER}:${PGPASSWORD}@db:5432/${PGDATABASE}

# JWT 설정
JWT_AUDIENCE=your-audience
JWT_ISSUER=your-issuer

# Flask 설정
FLASK_SECRET_KEY=your-flask-secret-key
OPENAI_API_KEY=your-openai-api-key  # AI 기능 사용 시
```

#### 3. JWT 키 쌍 생성

RSA 키 쌍을 생성하여 `keys/` 디렉토리에 저장:

```bash
# 디렉토리 생성
mkdir -p keys

# 개인 키 생성 (2048-bit RSA)
openssl genrsa -out keys/jwt_private.pem 2048

# 공개 키 추출
openssl rsa -in keys/jwt_private.pem -pubout -out keys/jwt_public.pem
```

#### 4. AI 검색 데이터 준비 (선택사항)

AI 검색 기능을 사용하려면 FAISS 인덱스 파일이 필요합니다. 별도로 제공된 `faiss_index` 폴더를 `flask/` 디렉토리에 배치하세요:

```
flask/
├── faiss_index/
│   ├── index.faiss
│   └── index.pkl
└── ...
```

#### 5. Docker Compose 실행

전체 스택을 빌드하고 실행:

```bash
# 빌드 후 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build
```

#### 6. 서비스 확인

모든 서비스가 정상 동작하는지 확인:

```bash
# API Gateway 확인
curl http://localhost/health

# NestJS 서비스 확인
curl http://localhost/api/health

# Flask 서비스 확인
curl http://localhost/llm/health
```

### 서비스 중지

```bash
# 서비스 중지
docker-compose down

# 볼륨까지 삭제 (데이터베이스 초기화)
docker-compose down -v
```

## � API 문서

### API Gateway 라우팅

| 경로 패턴 | 대상 서비스 | 포트 | 설명 |
|----------|------------|------|------|
| `/health` | Nginx | - | Gateway 헬스 체크 |
| `/api/*` | NestJS | 3000 | 주요 API 엔드포인트 |
| `/llm/*` | Flask | 8000 | AI/LLM 관련 API |
| `/uploads/*` | Nginx (Static) | - | 업로드된 파일 제공 |

### NestJS API 엔드포인트

#### 🔐 인증 (Authentication)

```
POST   /api/v1/auth/register      # 회원가입
POST   /api/v1/auth/login         # 로그인
POST   /api/v1/auth/refresh       # 토큰 갱신
POST   /api/v1/auth/logout        # 로그아웃
GET    /api/v1/auth/me            # 내 프로필 조회 (JWT 필요)
```

#### 👤 사용자 (Users)

```
# 내 정보 관리
GET    /api/v1/me                 # 내 정보 조회
PATCH  /api/v1/me                 # 내 정보 수정
DELETE /api/v1/me                 # 회원 탈퇴
PUT    /api/v1/me/password        # 비밀번호 변경

# 관리자 전용 - 사용자 관리
GET    /api/v1/admin/users        # 전체 사용자 목록 조회 (ADMIN)
GET    /api/v1/admin/users/:id    # 특정 사용자 상세 조회 (ADMIN)
PUT    /api/v1/admin/users/:id    # 사용자 정보 수정 (ADMIN)
DELETE /api/v1/admin/users/:id    # 사용자 삭제 (ADMIN)
```

#### 📝 게시판 (Boards)

```
GET    /api/v1/boards                    # 게시글 목록 조회
         ?page=1                          # 페이지 번호 (기본: 1)
         &limit=20                        # 페이지당 항목 수 (기본: 20)
         &search=keyword                  # 제목/내용 검색
         &prefix=filter                   # 말머리 필터
         &sortBy=recent                   # 정렬 (recent/views/rating/comments)

POST   /api/v1/boards                    # 게시글 작성
GET    /api/v1/boards/:id                # 게시글 상세 조회
PATCH  /api/v1/boards/:boardId           # 게시글 수정
DELETE /api/v1/boards/:boardId           # 게시글 삭제

# 댓글
POST   /api/v1/boards/:boardId/comments       # 댓글 작성
GET    /api/v1/boards/:boardId/comments       # 댓글 조회
         ?page=1                               # 페이지 번호 (기본: 1)
         &limit=20                             # 페이지당 항목 수 (기본: 20)
PATCH  /api/v1/boards/:boardId/comments/:id   # 댓글 수정
DELETE /api/v1/boards/:boardId/comments/:id   # 댓글 삭제

# 평점
POST   /api/v1/boards/:boardId/rating         # 게시글 평가
GET    /api/v1/boards/:boardId/rating         # 평균 평점 조회
GET    /api/v1/boards/:boardId/rating/my      # 내 평점 조회 (JWT 필요)
DELETE /api/v1/boards/:boardId/rating         # 내 평점 삭제 (JWT 필요)
```

#### 🖼️ 이미지 업로드

게시글 작성 시 이미지를 업로드할 수 있습니다.

**요청 형식:**
- Content-Type: `multipart/form-data`
- 필드 이름: `image`

**지원 형식:**
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

**제한 사항:**
- 최대 파일 크기: **5MB**

**성공 응답:**
```json
{
  "id": 1,
  "title": "게시글 제목",
  "img_url": "/uploads/images/uuid-filename.jpg",
  ...
}
```

**에러 응답:**
```json
{
  "statusCode": 400,
  "message": "지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 지원)",
  "error": "Bad Request"
}
```

#### 📊 관리자 (Admin)

```
GET    /api/v1/admin/logs         # 로그 조회 (ADMIN 전용)
         ?limit=100                # 조회 개수 (기본: 100, 최대: 500)
         &source=nest              # 로그 소스 필터 (nest/flask)
         &path=/api/v1/boards      # API 경로 필터
```

### Flask API 엔드포인트

#### 🤖 LLM 서비스

```
GET    /llm/health                      # 서비스 상태 확인

# 레시피 추천 (AI 기반 검색)
POST   /llm/generate                    # 레시피 추천 (로그인 필요, 무제한)
POST   /llm/generate/anonymous          # 레시피 추천 (비로그인, 10회 제한)

# 검색 기록 관리 (로그인 필요)
GET    /llm/history                     # 검색 기록 목록 조회
         ?limit=10                       # 조회할 개수 (기본: 10, 최대: 100)
         &offset=0                       # 건너뛸 개수 (기본: 0)
         &include_results=false          # 검색 결과 포함 여부 (기본: false)

GET    /llm/history/:id                 # 특정 검색 기록 상세 조회
DELETE /llm/history/:id                 # 특정 검색 기록 삭제
DELETE /llm/history                     # 모든 검색 기록 삭제
```

## 👨‍💻 개발 가이드

### 로컬 개발 환경 설정

#### NestJS 개발

```bash
cd nest

# 의존성 설치
npm install

# 개발 모드 실행 (핫 리로드)
npm run start:dev

# 테스트 실행
npm run test

# 빌드
npm run build
```

#### Flask 개발

```bash
cd flask

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
FLASK_APP=app FLASK_ENV=development flask run --port 8000
```

### 로그 확인

```bash
# 모든 서비스 로그 확인
docker-compose logs -f

# 특정 서비스 로그 확인
docker-compose logs -f nest
docker-compose logs -f flask
docker-compose logs -f db

# 최근 로그만 확인
docker-compose logs --tail=100 nest
```

### 데이터베이스 접속

```bash
# PostgreSQL 컨테이너 접속
docker-compose exec db psql -U <PGUSER> -d <PGDATABASE>

# 테이블 목록 확인
\dt

# 쿼리 실행
SELECT * FROM users;
```

### 데이터베이스 초기화

초기화 스크립트를 수정한 후 데이터베이스 재생성:

```bash
# 볼륨을 포함한 모든 컨테이너 삭제
docker-compose down -v

# 재시작
docker-compose up --build
```

## 🧪 테스트

### NestJS 테스트

```bash
cd nest

# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 커버리지 확인
npm run test:cov
```

### Flask 테스트

```bash
cd flask

# pytest 실행
pytest

# 커버리지 포함
pytest --cov=app
```

## � 문제 해결

### 컨테이너 시작 실패

```bash
# 전체 로그 확인
docker-compose logs

# 특정 서비스 상태 확인
docker-compose ps
```

### 포트 충돌

`.env` 또는 `docker-compose.yml`에서 포트 변경:

```yaml
services:
  gateway:
    ports: ["8080:80"]  # localhost:8080으로 변경
```

### 데이터베이스 연결 오류

1. 데이터베이스 컨테이너 상태 확인
2. `.env` 파일의 `DATABASE_URL` 확인
3. 헬스 체크 로그 확인

```bash
docker-compose logs db
```

### JWT 키 관련 오류

키 파일 권한 및 존재 여부 확인:

```bash
ls -la keys/
# -rw-r--r--  jwt_private.pem
# -rw-r--r--  jwt_public.pem
```

## � 배포

### 프로덕션 환경 변수

프로덕션 환경에서는 다음 사항에 유의하세요:

- 강력한 데이터베이스 비밀번호 설정
- JWT 키를 안전하게 관리 (환경 변수 또는 비밀 관리 서비스)
- CORS 설정 검토
- 로그 레벨 조정 (INFO 또는 WARN)
- HTTPS 적용

### Docker Compose 프로덕션 모드

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🤝 기여 가이드

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## � 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

## 📮 문의

프로젝트 관련 문의사항은 이슈를 통해 남겨주세요.

---

**Built with NestJS, Flask, and Docker**
