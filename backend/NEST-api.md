# NestJS API 문서

## 📋 개요

NestJS 기반 커뮤니티 게시판 및 사용자 관리 서비스 API 문서입니다.

---

## 🔐 인증

대부분의 API는 JWT 인증이 필요합니다.

### 요청 헤더 (for 인증)
```
Authorization: Bearer <JWT_TOKEN>
```

### 권한 레벨
- **PUBLIC**: 인증 불필요
- **USER**: 로그인된 사용자
- **ADMIN**: 관리자 권한 필요

---

## 📡 API 엔드포인트

## 🔑 인증 (Authentication)

### 1. 회원가입

**POST** `/api/v1/auth/register`

새로운 사용자 계정을 생성합니다.

#### 요청 본문
```json
{
  "user_id": "johndoe123",
  "email": "john@example.com",
  "password": "Password123!",
  "username": "John Doe",
  "nickname": "Johnny"
}
```

#### 유효성 검증
| 필드 | 규칙 |
|------|------|
| `user_id` | 최소 3자 이상 |
| `email` | 유효한 이메일 형식 |
| `password` | 최소 8자, 대/소문자, 숫자, 특수문자 포함 |
| `username` | 최소 2자 이상 |
| `nickname` | 최소 2자 이상 |

#### 응답 예시 (201 Created)
```json
{
    "user": {
        "id": "4990cb19-a346-43e4-90a4-689618f32c8a",
        "user_id": "johndoe123",
        "username": "John Doe",
        "nickname": "Johnny",
        "email": "john@example.com",
        "role": "USER",
        "llm_count": null,
        "last_login_at": null,
        "created_at": "2025-11-24T11:25:33.349Z",
        "updated_at": "2025-11-24T11:25:33.349Z"
    },
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTkwY2IxOS1hMzQ2LTQzZTQtOTBhNC02ODk2MThmMzJjOGEiLCJ1c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjM5ODM1MzMsImV4cCI6MTc2Mzk4NDQzMywiYXVkIjoiYXdwLXByb2plY3QiLCJpc3MiOiJhd3AtYmFja2VuZCJ9.liJG-GbIJPcryxdwLx1YB-3nxYiMzIMbI1HEyYTZMzSx3Il2M06Q9CLEK05SqtHtFD9H44PLXG-36DIfgwUVnSIwGsIt8oFdg1Rx7RL4EnF86lJR-g213Gwm9TaZAqR70_IKcgObWQMhlEEY6wflpMjnmJgoZD5eBYahc-bAiv_xcY-oAb8ltlP3cGdXshCiDGMgxgswORG2jLi2zkCiiaqMT3hSPgphB1w3vFI0JcOKgkIUbg9AIJZn-CBlZ1OnZxYnl7CkUxQwrMxuXT-GsQa-kqbBT2fAY9jct4_BA_NB6Ow_sMQYl1xekUSKv11b-poVUUJjdd442l_awk4BRojSiMYWdtz8Kf4jJdgnB9tvqgJ46Al4KuZdRTYR90mdnho7NC-bYrLGkFY82yQZiis9WD5UeERcF8jav6dsTp13sJKoaUlY4WyZyGFTVWXrg88oUg0IRT5qMzwotiG901F4xNvj7NZCm3BKjYYISu26UPWBKiskUqNbYMEJhmxbg-MhhJ0uE9kS2vKPSBwWucMasyx8f7h0UB6P-DvAI7cmKLLCbFK1khXD1CP3aRCYxB5zE7KpT21wRt-33WnHNkEVm1xyJXxX9uUaKeHMwg5Rs3JO4BHNhJtyBoz-OH3gmwN5HHmE9-lYopdo1iZsyoZ-yNc_MU8Odq0H3V6-wDs",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTkwY2IxOS1hMzQ2LTQzZTQtOTBhNC02ODk2MThmMzJjOGEiLCJ1c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjM5ODM1MzMsImV4cCI6MTc2NDU4ODMzMywiYXVkIjoiYXdwLXByb2plY3QiLCJpc3MiOiJhd3AtYmFja2VuZCJ9.DVN-plqdT5x1JOsaDgMKzyKCx8xJdeemv4vxW4mUwql0_fdg1VvYOJtyeAEeQ6jZGWEaJhNi1-gVKq5wEep2UMzGnUPhHLbdLtL7B25BAYWXqq0tA9sSJsdH3dnA-ScqywyMihICge2H8pumGmqX948lDwTsVrj78CcMDazz4TeZRkpb4Aj7N9HBwjr4MoZmvHUcjiHx4No76qzu65p_5Sh00a03fC8yeH81yNzlJbNaoF9XjbMbkNIhPKmenEZ7aVqdjwMDvku0AJ25P6ptIxqpA0J969HqsVkVCDQoy9lkHmmpaToH9GPQ9N6HgbA3e3Fve70p-h_a9FVzAfCz3-J9UAnBr2kdJNWe5d_blNyHhrDyZ3isCHdP92yliEg-We8B7g234FBEjpCUXXIC8U_KXEkH9Iu-7feykGpzNS3KYIE-4USs5PKrE5RLLOZ3qufvLkMC_ptxzn0PIQfWPWhbW3B27JHJPkpVBbuRhQhvKP6uTvaEAxeZBnWPY5cbJIVikdhwpXbT5gwPEh0e8hVj4A--sAnwaO04aI0o4wAyOC1xysNiHXzVL6JVHbHvt4IqPzTXnxytqLAlJ2uhqyf9fXNOWap28rXfouYbzrqnAJeDZHx4ENS2SQMK2RpIxNoPhu-CYqix-7zAaEZVbOHb49MchFwDauxvwfcHKc8",
    "accessTokenExpiresIn": 900
}
```

---

### 2. 로그인

**POST** `/api/v1/auth/login`

사용자 인증 및 JWT 토큰 발급

#### 요청 본문
```json
{
  "user_id": "johndoe123",
  "password": "Password123!"
}
```

#### 응답 예시 (200 OK)
```json
{
    "user": {
        "id": "4990cb19-a346-43e4-90a4-689618f32c8a",
        "user_id": "johndoe123",
        "username": "John Doe",
        "nickname": "Johnny",
        "email": "john@example.com",
        "role": "USER",
        "llm_count": null,
        "last_login_at": "2025-11-24T12:25:48.609Z",
        "created_at": "2025-11-24T11:25:33.349Z",
        "updated_at": "2025-11-24T11:25:33.349Z"
    },
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTkwY2IxOS1hMzQ2LTQzZTQtOTBhNC02ODk2MThmMzJjOGEiLCJ1c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjM5ODcxNDgsImV4cCI6MTc2Mzk4ODA0OCwiYXVkIjoiYXdwLXByb2plY3QiLCJpc3MiOiJhd3AtYmFja2VuZCJ9.cOG4T2rOwmkzFzBT0jkDv1Rnqt_u7ONPkUN_52WdyQC0p1MJ7KO4YsuVOd5acBj-9BQVK8fTJojLJKlZ2eol2AFiF52Uc_0qnzKcb-pWBhcOW4EaaTUyRp7fcBzueJQy-NpTn1XlpNXG3b_3v8a8Cbih7VH3hgF3xNqhV_jTdEGsRn3MVJnHXkpzBgVubcpq89EGZyY4iemI0xintL0swS9I2UVhkzL8v7QPRnKzcS-K2_Pn2HdxB-W5H60qhFsNOOiM5ooN5fcj6MYaUq5qnqxH0SmaZ5zC3EzRRjoZmGrUKZoLbUHDHNiANzmmyujEDqhhREcSPD6VxxLLTZ2ASR9Uyxc8nLBu9dE9ctZZZAxSDNg36WUeUUuLc5IMS7anfoXsZm13FJmhqsq8x312P2fS9seokX8b8aYzyVwDKcJK6mw8B4yaHfdqlUw0BThgcJfNGtst1qZXP0B5a9VAw9_VY7k2lOD2jCw5rKkoeTK1Q1JJMGO-e-OZOwihXMzM-lCaxp9AiZ4VSdT7Qy2Uk4OI36DAczRURlSAyAxHNvXazHpukVvcxTYOszx1vOKRnLDKi26IZ2tYxBwa0NXw-Ufq0HH0n3aNLGO20MwWVfepK4Vm4inuD2B-T_eU-qMxpZk1az6msdFC2F5DZalF5khKJVrYcDg5HYkmm9glgWs",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTkwY2IxOS1hMzQ2LTQzZTQtOTBhNC02ODk2MThmMzJjOGEiLCJ1c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjM5ODcxNDgsImV4cCI6MTc2NDU5MTk0OCwiYXVkIjoiYXdwLXByb2plY3QiLCJpc3MiOiJhd3AtYmFja2VuZCJ9.g7T5R8kgKqsV1W4NhU2E-R-PtxnvESHdJU8rj4tw3j3F9AFT1DLXt8pwLqUEdxNBpiZfR__KmlGypwesDn8U994zIjfzy125soA9meoqk-AoLrKdqgWOsEfIjaHCyTYI8L9i0Xqe3M7oNJKDiyWISrI2eyCpJ5iXZ-ExfV8cK8c-aAhEVpVISWGCeBJ1JezaVDnhIg4hdFh9c8X0dGDnhllPLkbhoC4uLEBck9-hNjnkY5AhsS2OFAI1Qe6rFiwoAopxEna4ua4EcJU3Z_6RqsFHUf8K5R6R2ONIfVLiX86imkPW2jsX8ts7HYWFzuijGSihXbmrROdjsN1zk9S_7R6cVBX3huIqcD2l6qg_A1kA4jWZmuxoyMqdJJkZvv-JHZvecIfW4R2unG6cyAhmpQFcAai8dpuLzXGBexv7aY6CthhbwmmpNULsxGW4nboUPAAbCS4zzhHC8pxSaH6DJDQe6vodGiv1fIZHPtx3EzwVX0X-7kv7jTEmtjrnvXhnIgsRYwMGTMUC-Q3YXzxFVeq9dSwFsYJ51GTqbj9Tk5fVnAiQ3xHHkI5R4IJ-rxQ5PqAMTqpD23QvJTW6zl4bdd4nZQvANEKbbfsvV_3q85Y2BQHwAWFvSxiRZ2eZqbfNPuB-mypPc_ExdwzJ8Bp1qiZAhtynWdbs-XIXrqh6BRs",
    "accessTokenExpiresIn": 900
}
```

---

### 3. 로그아웃

**POST** `/api/v1/auth/logout`

🔒 **인증 필요**

헤더: Authorization: Bearer <accessToken> 추가
현재 사용자의 Refresh Token을 무효화합니다.

#### 요청 본문
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 응답 (204 No Content)
```
(응답 본문 없음)
```

---

### 4. 토큰 갱신

**POST** `/api/v1/auth/refresh`

Refresh Token을 사용하여 새로운 Access Token 발급

#### 요청 본문
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 응답 예시 (201 CREATED)
```json
{
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0OTkwY2IxOS1hMzQ2LTQzZTQtOTBhNC02ODk2MThmMzJjOGEiLCJ1c2VybmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3NjM5ODc0NzgsImV4cCI6MTc2Mzk4ODM3OCwiYXVkIjoiYXdwLXByb2plY3QiLCJpc3MiOiJhd3AtYmFja2VuZCJ9.qEvkab4B3HPR_3nYMeWwp0deMUX4winQqZdensBNuZC9OGcHpBKekUrQtufECltJ3t-Kotq789rrwWVeWFgFdH6f4jwNwZHqIGQntct-NYUwDX87k5gHNPIfyQa8qmdUefEUTLzqqHEajkUO37Alwzw4LIdx9cvz9zfWHgwFZS678JOCVFB4apF4VyQOeuEe_iuWVDt8Lge0m3BTDZ2pUBeu8pe6iD3fClMyZ8XL4fuHAApjzVOxa0Gahp87U_kCkgcWKQfV3VFhAbKRJik4OohDqMkyWYhpyTyu3mXjTsQ2kExh3rTvvKcK4Pdg0qkYaWDbjiVCgvZf9O8HMoIaOyUbUNg5Tc5SkXQoHBxV6Ey_yiI09mXx2abHyxYQ7JavW7Y0km1sZfCCJT_mqypVYxjD2ZJ1HYw1ej6sKUc1sueuD1lszlfHriFiow5FykD5ha7lsWBdtUhA0fkKaQPeutmYWF7HJ6Bjfq7ZmNwOXaKTNSRzmudzYeIvzz-B5uVCp2Ty5_7vgOkJbG8WfYw5MxQfFtMlq5i5obpsoyOSkLKQmJsISXw5VerjBx_ZKuzgcPiJhRTgHsrYy66AnFWGeb6o2on5bYys2AzaT0cO2XtiWDORwzW_bJnkGeBCDNjwxZYQyTMKT0wuw4_SIM7NTLbOA3AJM9Zd_jnD7rJbuB4",
    "accessTokenExpiresIn": 900
}
```

---

### 5. 내 프로필 조회

**GET** `/api/v1/auth/me`

🔒 **인증 필요**

현재 로그인한 사용자의 프로필 정보를 조회합니다.

#### 응답 예시 (200 OK)
```json
{
    "id": "4990cb19-a346-43e4-90a4-689618f32c8a",
    "user_id": "johndoe123",
    "username": "John Doe",
    "nickname": "Johnny",
    "email": "john@example.com",
    "role": "USER",
    "llm_count": null,
    "last_login_at": "2025-11-24T12:30:35.507Z",
    "created_at": "2025-11-24T11:25:33.349Z",
    "updated_at": "2025-11-24T12:30:35.508Z"
}
```

---

## 👤 사용자 정보 관리 (Me API)

### 6. 내 정보 조회

**GET** `/api/v1/me`

🔒 **인증 필요**

본인의 상세 정보를 조회합니다.

#### 응답 예시 (200 OK)
```json
{
    "id": "4990cb19-a346-43e4-90a4-689618f32c8a",
    "user_id": "johndoe123",
    "username": "John Doe",
    "nickname": "Johnny",
    "email": "john@example.com",
    "role": "USER",
    "llm_count": null,
    "last_login_at": "2025-11-24T12:30:35.507Z",
    "created_at": "2025-11-24T11:25:33.349Z",
    "updated_at": "2025-11-24T12:30:35.508Z"
}
```

---

### 7. 내 정보 수정

**PATCH** `/api/v1/me`

🔒 **인증 필요**

본인의 정보를 수정합니다.

#### 요청 본문 (수정하는 부분만 요청을 보냄)
```json
{
  "username": "John Smith",
  "nickname": "JS",
  "email": "john.smith@example.com"
}
```

#### 응답 예시 (200 OK)
```json
{
    "id": "4990cb19-a346-43e4-90a4-689618f32c8a",
    "user_id": "johndoe123",
    "username": "John Smith",
    "nickname": "JS",
    "email": "john.smith@example.com",
    "role": "USER",
    "llm_count": null,
    "last_login_at": "2025-11-24T12:30:35.507Z",
    "created_at": "2025-11-24T11:25:33.349Z",
    "updated_at": "2025-11-24T12:33:43.763Z"
}
```

---

### 8. 비밀번호 변경

**PUT** `/api/v1/me/password`

🔒 **인증 필요**

본인의 비밀번호를 변경합니다.

#### 요청 본문
```json
{
  "currentPassword": "Password123!",
  "newPassword": "Ghkfkd11!@",
  "confirmPassword": "Ghkfkd11!@"
}
```

#### 응답 (204 No Content)
```
(응답 본문 없음)
```

---

### 9. 회원 탈퇴

**DELETE** `/api/v1/me`

🔒 **인증 필요**

본인의 계정을 삭제합니다.

#### 요청 본문
```
(요청 본문 없음)
```

#### 응답 (204 No Content)
```
(응답 본문 없음)
```

---

## 👥 사용자 관리 (Admin Only)

### 10. 전체 사용자 목록 조회

**GET** `/api/v1/admin/users`

🔒 **ADMIN 전용**

모든 사용자 목록을 조회합니다.

#### 응답 예시 (200 OK)
```json
[
    {
        "id": "e289149e-2a57-4dbb-ab21-030487b014e1",
        "user_id": "johndoe123",
        "username": "John Doe",
        "nickname": "Johnny",
        "email": "john@example.com",
        "role": "USER",
        "llm_count": null,
        "last_login_at": null,
        "created_at": "2025-11-24T12:56:49.398Z",
        "updated_at": "2025-11-24T12:56:49.398Z"
    },
    {
        "id": "0993573f-a70d-4b91-b903-79b6580e487d",
        "user_id": "admin",
        "username": "Administrator",
        "nickname": "admin",
        "email": "seoultechawp@gmail.com",
        "role": "ADMIN",
        "llm_count": 1,
        "last_login_at": "2025-11-24T12:59:44.936Z",
        "created_at": "2025-11-23T11:58:38.432Z",
        "updated_at": "2025-11-24T12:59:44.937Z"
    }
]
```

---

### 11. 특정 사용자 조회

**GET** `/api/v1/admin/users/:id`

🔒 **ADMIN 전용**

특정 사용자의 상세 정보를 조회합니다.

#### 경로 파라미터
- `id`: 사용자 UUID (예: e289149e-2a57-4dbb-ab21-030487b014e1)

#### 응답 예시 (200 OK)
```json
{
    "id": "e289149e-2a57-4dbb-ab21-030487b014e1",
    "user_id": "johndoe123",
    "username": "John Doe",
    "nickname": "Johnny",
    "email": "john@example.com",
    "role": "USER",
    "llm_count": null,
    "last_login_at": null,
    "created_at": "2025-11-24T12:56:49.398Z",
    "updated_at": "2025-11-24T12:56:49.398Z"
}
```

---

### 12. 사용자 정보 수정

**PUT** `/api/v1/admin/users/:id`

🔒 **ADMIN 전용**

특정 사용자의 정보를 수정합니다.

#### 경로 파라미터
- `id`: 사용자 UUID

#### 요청 본문 (아래 3개 중 하나만 보내도 됨, 하나 이상 요청 가능)
```json
{
  "username": "Jane Smith",
  "nickname": "JaneyS",
  "email": "jane.smith@example.com"
}
```

#### 응답 예시 (200 OK)
```json
{
    "id": "e289149e-2a57-4dbb-ab21-030487b014e1",
    "user_id": "johndoe123",
    "username": "Updated Name",
    "nickname": "JaneyS",
    "email": "jane.smith@example.com",
    "role": "USER",
    "llm_count": null,
    "last_login_at": null,
    "created_at": "2025-11-24T12:56:49.398Z",
    "updated_at": "2025-11-24T13:11:24.543Z"
}
```

---

### 13. 사용자 삭제

**DELETE** `/api/v1/admin/users/:id`

🔒 **ADMIN 전용**

특정 사용자를 삭제합니다.

#### 경로 파라미터
- `id`: 사용자 UUID

#### 요청
```
(요청 본문 없음)
```

#### 응답 (204 No Content)
```
(응답 본문 없음)
```

---

### 14. 에러 로그 조회

**GET** `/api/v1/admin/logs`

🔒 **ADMIN 전용**

조회된 에러 로그 목록을 반환합니다. 지원되는 쿼리 파라미터:
- `source` (string) – 로그 발생 소스 (예: nest-api, flask-api)
- `path` (string) – 요청 경로 필터 (예: /api/v1/auth/login)
- `limit` (number) – 반환 개수 (default 100, max 500)

#### 응답 예시 (200 OK)
```json
[
    {
        "id": 71,
        "level": "error",
        "source": "nest-api",
        "message": "Bad Request Exception",
        "stack": "BadRequestException: Bad Request Exception\n    at ValidationPipe.exceptionFactory (/app/node_modules/@nestjs/common/pipes/validation.pipe.js:101:20)\n    at ValidationPipe.transform (/app/node_modules/@nestjs/common/pipes/validation.pipe.js:74:30)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async /app/node_modules/@nestjs/core/pipes/pipes-consumer.js:15:25\n    at async resolveParamValue (/app/node_modules/@nestjs/core/router/router-execution-context.js:148:23)\n    at async Promise.all (index 0)\n    at async pipesFn (/app/node_modules/@nestjs/core/router/router-execution-context.js:151:13)\n    at async /app/node_modules/@nestjs/core/router/router-execution-context.js:37:30\n    at async /app/node_modules/@nestjs/core/router/router-execution-context.js:46:28\n    at async /app/node_modules/@nestjs/core/router/router-proxy.js:9:17",
        "method": "PUT",
        "path": "/api/v1/admin/users/e289149e-2a57-4dbb-ab21-030487b014e1",
        "userId": null,
        "context": {
            "body": {
                "role": "ADMIN",
                "username": "Updated Name"
            },
            "query": {},
            "status": 400
        },
        "createdAt": "2025-11-24T13:09:32.196Z"
    },
    {
        "id": 70,
        "level": "error",
        "source": "nest-api",
        "message": "Validation failed (uuid is expected)",
        "stack": "BadRequestException: Validation failed (uuid is expected)\n    at ParseUUIDPipe.exceptionFactory (/app/node_modules/@nestjs/common/pipes/parse-uuid.pipe.js:26:27)\n    at ParseUUIDPipe.transform (/app/node_modules/@nestjs/common/pipes/parse-uuid.pipe.js:33:24)\n    at /app/node_modules/@nestjs/core/pipes/pipes-consumer.js:16:33\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async resolveParamValue (/app/node_modules/@nestjs/core/router/router-execution-context.js:148:23)\n    at async Promise.all (index 0)\n    at async pipesFn (/app/node_modules/@nestjs/core/router/router-execution-context.js:151:13)\n    at async /app/node_modules/@nestjs/core/router/router-execution-context.js:37:30\n    at async /app/node_modules/@nestjs/core/router/router-execution-context.js:46:28\n    at async /app/node_modules/@nestjs/core/router/router-proxy.js:9:17",
        "method": "GET",
        "path": "/api/v1/admin/users/%22e289149e-2a57-4dbb-ab21-030487b014e1%22",
        "userId": null,
        "context": {
            "body": {},
            "query": {},
            "status": 400
        },
        "createdAt": "2025-11-24T13:08:13.799Z"
    },
    ...
]
```


## 📝 게시판 (Boards)

### 14. 게시글 작성

**POST** `/api/v1/boards`

🔒 **USER/ADMIN**

새로운 게시글을 작성합니다. (이미지 업로드 가능)

#### 요청 (Multipart Form Data)
```
title: "Community Rules"
content: "Welcome to Our Community!..."
prefix: "Notice"  (선택: 'General', 'Notice', 'Recipe', 'Question', 'Tip')
image: (file)  (선택)
```

#### 응답 예시 (201 Created)
```json
{
    "authorId": "0993573f-a70d-4b91-b903-79b6580e487d",
    "title": "Community Rules",
    "content": "Welcome to Our Community!\n\nThank you for joining our community. To ensure a positive and respectful environment for everyone, please review and follow these community guidelines.\n\n════════════════════════════════════════\n\nBE RESPECTFUL AND KIND\n\n- Treat all members with respect and courtesy\n- Embrace diverse perspectives and opinions\n- Disagree constructively without personal attacks\n- Avoid discriminatory, offensive, or harmful language\n\n════════════════════════════════════════\n\nQUALITY CONTENT GUIDELINES\n\nAllowed Content:\n✓ Helpful recipes and cooking tips\n✓ Food-related questions and discussions\n✓ Constructive feedback and suggestions\n✓ Original photos and content (with proper credit if shared)\n\nNot Allowed:\n✗ Spam, advertisements, or self-promotion without permission\n✗ Off-topic content unrelated to food and cooking\n✗ Inappropriate, offensive, or explicit material\n✗ Misinformation or misleading content\n✗ Duplicate posts\n\n════════════════════════════════════════\n\nPRIVACY AND SAFETY\n\n- Never share personal information (phone numbers, addresses, etc.)\n- Don't request personal information from other members\n- Respect others' privacy and intellectual property\n- Report any suspicious or concerning behavior to moderators\n\n════════════════════════════════════════\n\nCOPYRIGHT AND ATTRIBUTION\n\n- Only post content you own or have permission to share\n- Give proper credit when sharing others' recipes or photos\n- Respect copyright laws and intellectual property rights\n\n════════════════════════════════════════\n\nPROHIBITED ACTIVITIES\n\nThe following will result in post removal and potential account suspension:\n\n1. Harassment or bullying of any kind\n2. Hate speech or discriminatory content\n3. Impersonation of others\n4. Promotion of illegal activities\n5. Multiple or duplicate accounts\n\n════════════════════════════════════════\n\nHOW TO USE PREFIXES\n\nWhen creating posts, please use the appropriate prefix:\n\n- General - Regular posts and discussions\n- Notice - Important announcements (moderators only)\n- Recipe - Recipe sharing and food preparations\n- Question - Questions seeking help or advice\n- Tip - Helpful tips and tricks\n\n════════════════════════════════════════\n\nREPORTING ISSUES\n\nIf you encounter rule violations or concerning content:\n\n1. Use the report feature (if available)\n2. Contact moderators directly\n3. Include specific details about the issue\n\nWe take all reports seriously and will respond as quickly as possible.\n\n════════════════════════════════════════\n\nENFORCEMENT\n\nViolations may result in:\n\n- First offense: Warning and post removal\n- Repeated violations: Temporary suspension\n- Severe violations: Permanent account ban\n\nModerators reserve the right to take action on a case-by-case basis.\n\n════════════════════════════════════════\n\nQUESTIONS?\n\nIf you have questions about these rules or need clarification, please contact our moderation team.\n\n════════════════════════════════════════\n\nBy participating in this community, you agree to follow these guidelines.\n\nThank you for helping us maintain a welcoming and enjoyable space for all members!\n\nLast updated: November 2025",
    "prefix": "Notice",
    "img_url": null,
    "id": 1,
    "isPinned": false,
    "views": 0,
    "commentCount": 0,
    "averageRating": "0.0",
    "ratingCount": 0,
    "createdAt": "2025-11-24T13:50:25.338Z",
    "updatedAt": "2025-11-24T13:50:25.338Z"
}
```

---

### 15. 게시글 목록 조회

**GET** `/api/v1/boards`

게시글 목록을 조회합니다. (페이지네이션)

#### 쿼리 파라미터
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | integer | 1 | 페이지 번호 |
| `limit` | integer | 20 | 페이지당 개수 |
| `prefix` | string | - | 말머리 필터 |
| `search` | string | - | 검색어 (제목+내용) |

#### 요청 예시
```
GET /api/v1/boards?page=1&limit=20&prefix=General&search=tes
```

#### 응답 예시 (200 OK)
```json
{
    "data": [
        {
            "id": 2,
            "title": "TEST1",
            "content": "test1",
            "prefix": "General",
            "isPinned": false,
            "views": 0,
            "commentCount": 0,
            "averageRating": "0.0",
            "ratingCount": 0,
            "img_url": null,
            "createdAt": "2025-11-24T13:51:43.508Z",
            "updatedAt": "2025-11-24T13:51:43.508Z",
            "author": {
                "id": "0993573f-a70d-4b91-b903-79b6580e487d",
                "username": "Administrator",
                "nickname": "admin",
                "role": "ADMIN"
            }
        },
        {
            "id": 1,
            "title": "Community Rules",
            "content": "Welcome to Our Community!\n\nThank you for joining our community. To ensure a positive and respectful environment for everyone, please review and follow these community guidelines.\n\n════════════════════════════════════════\n\nBE RESPECTFUL AND KIND\n\n- Treat all members with respect and courtesy\n- Embrace diverse perspectives and opinions\n- Disagree constructively without personal attacks\n- Avoid discriminatory, offensive, or harmful language\n\n════════════════════════════════════════\n\nQUALITY CONTENT GUIDELINES\n\nAllowed Content:\n✓ Helpful recipes and cooking tips\n✓ Food-related questions and discussions\n✓ Constructive feedback and suggestions\n✓ Original photos and content (with proper credit if shared)\n\nNot Allowed:\n✗ Spam, advertisements, or self-promotion without permission\n✗ Off-topic content unrelated to food and cooking\n✗ Inappropriate, offensive, or explicit material\n✗ Misinformation or misleading content\n✗ Duplicate posts\n\n════════════════════════════════════════\n\nPRIVACY AND SAFETY\n\n- Never share personal information (phone numbers, addresses, etc.)\n- Don't request personal information from other members\n- Respect others' privacy and intellectual property\n- Report any suspicious or concerning behavior to moderators\n\n════════════════════════════════════════\n\nCOPYRIGHT AND ATTRIBUTION\n\n- Only post content you own or have permission to share\n- Give proper credit when sharing others' recipes or photos\n- Respect copyright laws and intellectual property rights\n\n════════════════════════════════════════\n\nPROHIBITED ACTIVITIES\n\nThe following will result in post removal and potential account suspension:\n\n1. Harassment or bullying of any kind\n2. Hate speech or discriminatory content\n3. Impersonation of others\n4. Promotion of illegal activities\n5. Multiple or duplicate accounts\n\n════════════════════════════════════════\n\nHOW TO USE PREFIXES\n\nWhen creating posts, please use the appropriate prefix:\n\n- General - Regular posts and discussions\n- Notice - Important announcements (moderators only)\n- Recipe - Recipe sharing and food preparations\n- Question - Questions seeking help or advice\n- Tip - Helpful tips and tricks\n\n════════════════════════════════════════\n\nREPORTING ISSUES\n\nIf you encounter rule violations or concerning content:\n\n1. Use the report feature (if available)\n2. Contact moderators directly\n3. Include specific details about the issue\n\nWe take all reports seriously and will respond as quickly as possible.\n\n════════════════════════════════════════\n\nENFORCEMENT\n\nViolations may result in:\n\n- First offense: Warning and post removal\n- Repeated violations: Temporary suspension\n- Severe violations: Permanent account ban\n\nModerators reserve the right to take action on a case-by-case basis.\n\n════════════════════════════════════════\n\nQUESTIONS?\n\nIf you have questions about these rules or need clarification, please contact our moderation team.\n\n════════════════════════════════════════\n\nBy participating in this community, you agree to follow these guidelines.\n\nThank you for helping us maintain a welcoming and enjoyable space for all members!\n\nLast updated: November 2025",
            "prefix": "Notice",
            "isPinned": false,
            "views": 0,
            "commentCount": 0,
            "averageRating": "0.0",
            "ratingCount": 0,
            "img_url": null,
            "createdAt": "2025-11-24T13:50:25.338Z",
            "updatedAt": "2025-11-24T13:50:25.338Z",
            "author": {
                "id": "0993573f-a70d-4b91-b903-79b6580e487d",
                "username": "Administrator",
                "nickname": "admin",
                "role": "ADMIN"
            }
        }
    ],
    "meta": {
        "total": 2,
        "page": 1,
        "limit": 20,
        "totalPages": 1
    }
}
```

---

### 16. 게시글 상세 조회

**GET** `/api/v1/boards/:id`

특정 게시글의 상세 정보를 조회합니다.

#### 경로 파라미터
- `id`: 게시글 ID

#### 응답 예시 (200 OK) - id=2
```json
{
    "id": 2,
    "title": "TEST1",
    "content": "test1",
    "prefix": "General",
    "isPinned": false,
    "views": 1,
    "commentCount": 0,
    "averageRating": "0.0",
    "ratingCount": 0,
    "img_url": null,
    "createdAt": "2025-11-24T13:51:43.508Z",
    "updatedAt": "2025-11-24T13:51:43.508Z",
    "author": {
        "id": "0993573f-a70d-4b91-b903-79b6580e487d",
        "username": "Administrator",
        "nickname": "admin",
        "role": "ADMIN"
    }
}
```

---

### 17. 게시글 수정

**PATCH** `/api/v1/boards/:boardId`

🔒 **인증 필요**

본인이 작성한 게시글을 수정합니다. (ADMIN은 모든 게시글 수정 가능)
ispinned(boolean) - admin만 설정 가능 (일반 유저의 요청에는 포함시키지 말 것)

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 요청 본문
```json
{
  "title": "Change Test1",
  "content": "change test1",
  "prefix": "Tip"
}
```

#### 응답 예시 (200 OK)
```json
{
    "id": 2,
    "authorId": "0993573f-a70d-4b91-b903-79b6580e487d",
    "title": "Change Test1",
    "content": "change test1",
    "prefix": "Tip",
    "isPinned": false,
    "views": 2,
    "commentCount": 0,
    "averageRating": "0.0",
    "ratingCount": 0,
    "img_url": null,
    "createdAt": "2025-11-24T13:51:43.508Z",
    "updatedAt": "2025-11-24T13:55:26.222Z"
}```

---

### 18. 게시글 삭제

**DELETE** `/api/v1/boards/:boardId`

🔒 **인증 필요**

본인이 작성한 게시글을 삭제합니다. (ADMIN은 모든 게시글 삭제 가능)

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 응답 (204 No Content)
```
(응답 본문 없음)
```

---

## 💬 댓글 (Comments)

### 19. 댓글 작성

**POST** `/api/v1/boards/:boardId/comments`

🔒 **USER/ADMIN**

특정 게시글에 댓글을 작성합니다.

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 요청 본문
```json
{
  "content": "Please Check this Notice!"
}
또는
{
  "content": "And welcome to our website!",
  "parentId": 1
}
```

#### 응답 예시 (201 Created)
```json
{
    "postId": 1,
    "authorId": "0993573f-a70d-4b91-b903-79b6580e487d",
    "content": "Please Check this Notice!",
    "parentId": null,
    "id": 1,
    "createdAt": "2025-11-24T13:56:53.722Z",
    "updatedAt": "2025-11-24T13:56:53.722Z"
}
또는
{
    "postId": 1,
    "authorId": "0993573f-a70d-4b91-b903-79b6580e487d",
    "content": "And welcome to our website!",
    "parentId": 1,
    "id": 2,
    "createdAt": "2025-11-24T13:59:01.988Z",
    "updatedAt": "2025-11-24T13:59:01.988Z"
}
```

---

### 20. 댓글 목록 조회

**GET** `/api/v1/boards/:boardId/comments`

특정 게시글의 댓글 목록을 조회합니다.

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 쿼리 파라미터
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | integer | 1 | 페이지 번호 |
| `limit` | integer | 20 | 페이지당 개수 |

#### 응답 예시 (200 OK)
```json
{
    "data": [
        {
            "id": 1,
            "content": "Please Check this Notice!",
            "parentId": null,
            "createdAt": "2025-11-24T13:56:53.722Z",
            "updatedAt": "2025-11-24T13:56:53.722Z",
            "author": {
                "id": "0993573f-a70d-4b91-b903-79b6580e487d",
                "username": "Administrator",
                "nickname": "admin",
                "role": "ADMIN"
            },
            "children": [
                {
                    "id": 2,
                    "content": "And welcome to our website!",
                    "createdAt": "2025-11-24T13:59:01.988Z",
                    "updatedAt": "2025-11-24T13:59:01.988Z",
                    "author": {
                        "id": "0993573f-a70d-4b91-b903-79b6580e487d",
                        "username": "Administrator",
                        "nickname": "admin",
                        "role": "ADMIN"
                    }
                }
            ]
        }
    ],
    "meta": {
        "total": 1,
        "page": 1,
        "limit": 50,
        "totalPages": 1
    }
}
```

---

### 21. 댓글 수정

**PATCH** `/api/v1/boards/:boardId/comments/:id`

🔒 **인증 필요**

본인이 작성한 댓글을 수정합니다. (ADMIN은 모든 댓글 수정 가능)

#### 경로 파라미터
- `boardId`: 게시글 ID
- `id`: 댓글 ID

#### 요청 본문
```json
{
  "content": "And welcome to our website! (fixed)"
}
```

#### 응답 예시 (200 OK)
```json
{
    "id": 2,
    "postId": 1,
    "authorId": "0993573f-a70d-4b91-b903-79b6580e487d",
    "content": "And welcome to our website! (fixed)",
    "parentId": 1,
    "createdAt": "2025-11-24T13:59:01.988Z",
    "updatedAt": "2025-11-24T14:04:30.832Z"
}
```

---

### 22. 댓글 삭제

**DELETE** `/api/v1/boards/:boardId/comments/:id`

🔒 **인증 필요**

본인이 작성한 댓글을 삭제합니다. (ADMIN은 모든 댓글 삭제 가능)

#### 경로 파라미터
- `boardId`: 게시글 ID
- `id`: 댓글 ID

#### 요청
```
(요청 본문 없음)
```

#### 응답 (204 No Content)
```
(응답 본문 없음)
```

---

## ⭐ 평점 (Rating)

### 23. 게시글 평가

**POST** `/api/v1/boards/:boardId/rating`

🔒 **USER/ADMIN**

게시글에 평점을 부여합니다.

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 요청 본문
```json
{
  "rating": 5,
  "comment": "Checked this Notice!"
}
```

#### 유효성 검증
- `rating`: 1~5 사이의 정수

#### 응답 예시 (201 Created)
```json
{
    "userId": "0993573f-a70d-4b91-b903-79b6580e487d",
    "postId": 1,
    "score": 5,
    "comment": "Checked this Notice!",
    "id": 2,
    "createdAt": "2025-11-24T14:14:18.995Z",
    "updatedAt": "2025-11-24T14:14:18.995Z"
}
```

---

### 24. 평균 평점 조회

**GET** `/api/v1/boards/:boardId/rating`

게시글의 평균 평점을 조회합니다.

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 요청 본문 : 없음

#### 응답 예시 (200 OK)
```json
{
    "averageRating": "5.0",
    "ratingCount": 1
}
```

---

### 25. 내 평점 조회

**GET** `/api/v1/boards/:boardId/rating/my`

🔒 **인증 필요**

본인이 부여한 평점을 조회합니다.

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 요청 본문 : 없음

#### 응답 예시 (200 OK)
```json
{
    "rating": 5,
    "comment": "Checked this Notice!"
}
```

#### 응답 (평가 작성 전)
```json
{
    "rating": null,
    "comment": null
}
```

---

### 26. 모든 평점 조회

**GET** `/api/v1/boards/:boardId/rating/all`

게시글의 모든 평점을 조회합니다. (사용자 정보 포함)

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 요청 본문 : 없음

#### 응답 예시 (200 OK)
```json
[
    {
        "id": 2,
        "score": 5,
        "comment": "Checked this Notice!",
        "userId": "0993573f-a70d-4b91-b903-79b6580e487d",
        "username": "admin",
        "createdAt": "2025-11-24T14:14:18.995Z",
        "updatedAt": "2025-11-24T14:14:18.995Z"
    },
    {
        "id": 1,
        "score": 4,
        "comment": null,
        "userId": "e289149e-2a57-4dbb-ab21-030487b014e1",
        "username": "Johnny",
        "createdAt": "2025-11-24T13:10:05.123Z",
        "updatedAt": "2025-11-24T13:10:05.123Z"
    }
]
```

#### 응답 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 평점 ID |
| `score` | number | 평점 (1~5) |
| `comment` | string \| null | 평점 코멘트 |
| `userId` | string | 평가한 사용자 UUID |
| `username` | string | 평가한 사용자 이름 |
| `createdAt` | string | 평가 생성 시각 |
| `updatedAt` | string | 평가 수정 시각 |

#### 참고사항
- 최신 평점이 먼저 표시됩니다 (createdAt 내림차순)
- 평점이 없는 경우 빈 배열 `[]` 반환

---

### 27. 평점 삭제

**DELETE** `/api/v1/boards/:boardId/rating`

🔒 **인증 필요**

본인이 부여한 평점을 삭제합니다.

#### 경로 파라미터
- `boardId`: 게시글 ID

#### 요청 본문 : 없음

#### 응답 (204 No Content)
```
(응답 본문 없음)
```

#### 에러 응답 (404)
```
{
    "statusCode": 404,
    "message": "해당 게시글에 대한 별점을 찾을 수 없습니다."
}
```

------------위 엔드포인트까지 최신화 완료 (12/04)------------

## 🔒 보안 및 권한

### 인증 방식
- JWT (RS256 알고리즘)
- Access Token + Refresh Token

### 권한 제어
- **PUBLIC**: 누구나 접근 가능
- **USER**: 로그인한 사용자만 접근
- **ADMIN**: 관리자만 접근

### 데이터 접근 제어
- 사용자는 본인의 데이터만 수정/삭제 가능
- ADMIN은 모든 데이터에 접근 가능

---

## ⚠️ 오류 응답

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "password는 최소 8자 이상이어야 합니다.",
    "password는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다."
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "이미 존재하는 user_id입니다."
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## 📊 사용 예시

### cURL 예시

#### 1. 회원가입
```bash
curl -X POST "http://localhost/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "johndoe123",
    "email": "john@example.com",
    "password": "Password123!",
    "username": "John Doe",
    "nickname": "Johnny"
  }'
```

#### 2. 로그인
```bash
curl -X POST "http://localhost/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "johndoe123",
    "password": "Password123!"
  }'
```

#### 3. 게시글 목록 조회
```bash
curl -X GET "http://localhost/api/v1/boards?page=1&limit=20"
```

#### 4. 게시글 작성 (이미지 포함)
```bash
curl -X POST "http://localhost/api/v1/boards" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=맛있는 파스타" \
  -F "content=레시피 내용..." \
  -F "prefix=레시피" \
  -F "image=@/path/to/image.jpg"
```

### JavaScript (Fetch) 예시

```javascript
// 로그인
const loginResponse = await fetch('http://localhost/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'johndoe123',
    password: 'Password123!'
  })
});

const { accessToken } = await loginResponse.json();

// 내 정보 조회
const meResponse = await fetch('http://localhost/api/v1/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const myProfile = await meResponse.json();
```

---

## 🚀 배포 정보

### 로컬 개발
```bash
# NestJS 개발 서버
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

### Docker
```bash
# 컨테이너 시작
docker-compose up -d nest

# 로그 확인
docker-compose logs -f nest
```

---

## 📝 변경 이력

### v1.0.0 (Initial)
- ✅ 인증 시스템 (회원가입/로그인/로그아웃/토큰 갱신)
- ✅ 사용자 관리 (내 정보 CRUD, Admin 관리)
- ✅ 게시판 기능 (게시글 CRUD, 이미지 업로드)
- ✅ 댓글 기능 (댓글 CRUD)
- ✅ 평점 기능 (평가/조회/삭제)
- ✅ JWT 인증 및 Role 기반 권한 관리
