# 초기 관리자 계정 정보

## 기본 관리자 계정

데이터베이스 초기화 시 자동으로 생성되는 관리자 계정:

| 항목 | 값 |
|------|-----|
| **user_id** | `admin` |
| **password** | `Admin@2024!` |
| **role** | `ADMIN` |
| **email** | `seoultechawp@gmail.com` |
| **username** | `Administrator` |
| **nickname** | `admin` |

## ⚠️ 보안 주의사항

> [!CAUTION]
> **배포 후 반드시 관리자 비밀번호를 변경하세요!**
> 
> 기본 비밀번호는 Git 저장소에 공개되어 있으므로, 프로덕션 환경에서는 첫 로그인 시 즉시 변경해야 합니다.

## 비밀번호 변경 방법

1. 관리자 계정으로 로그인
2. `/api/v1/users/{userId}/password` PATCH 엔드포인트 호출
3. 강력한 새 비밀번호로 변경

```bash
# 예시: 비밀번호 변경 API 호출
curl -X PATCH http://localhost:3000/api/v1/users/{admin-user-id}/password \
  -H "Authorization: Bearer {access-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Admin@2024!",
    "newPassword": "YourNewStrongPassword123!",
    "confirmPassword": "YourNewStrongPassword123!"
  }'
```

## 기술적 세부사항

- 비밀번호는 **bcrypt (12 rounds)**로 해시되어 저장
- `ON CONFLICT (user_id) DO NOTHING` 구문으로 중복 생성 방지
- DB 재초기화 시에도 안전하게 관리자 계정 유지
