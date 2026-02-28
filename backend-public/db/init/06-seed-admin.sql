-- 초기 관리자 계정 생성
-- 보안: 배포 후 반드시 비밀번호를 변경하세요!
-- 기본 계정 정보:
--   user_id: admin
--   password: Admin@2024!
--   role: ADMIN

INSERT INTO "user" (
  "id",
  "user_id",
  "username",
  "nickname",
  "email",
  "password",
  "role",
  "llm_count",
  "created_at",
  "updated_at"
) VALUES (
  gen_random_uuid(),
  'admin',
  'Administrator',
  'admin',
  'seoultechawp@gmail.com',
  '$2b$12$cjEVT726TBfy3lPOtFXkd.40SHuCX9Rh4/B6yMj3aIfWXzEB8LzIq',
  'ADMIN',
  0,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 주석
-- 위 INSERT는 admin 계정이 이미 존재하면 무시됩니다 (ON CONFLICT DO NOTHING)
-- 이렇게 하면 DB를 재초기화해도 안전하게 관리자 계정이 생성됩니다.
