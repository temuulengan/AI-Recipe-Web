-- User 테이블 생성
CREATE TABLE IF NOT EXISTS "user" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR(64) NOT NULL UNIQUE,
  "username" VARCHAR(100) NOT NULL,
  "nickname" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" VARCHAR(10) NOT NULL DEFAULT 'USER',
  "llm_count" INTEGER DEFAULT NULL,
  "last_login_at" TIMESTAMPTZ DEFAULT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "idx_user_user_id" ON "user"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "user"("email");
CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "user"("created_at");

-- 주석 추가
COMMENT ON TABLE "user" IS '사용자 정보 테이블';
COMMENT ON COLUMN "user"."id" IS 'PK, UUID';
COMMENT ON COLUMN "user"."user_id" IS '로그인 아이디';
COMMENT ON COLUMN "user"."username" IS '사용자 이름';
COMMENT ON COLUMN "user"."nickname" IS '사용자 닉네임';
COMMENT ON COLUMN "user"."email" IS '사용자 이메일';
COMMENT ON COLUMN "user"."password" IS '비밀번호 + 솔트(해시)';
COMMENT ON COLUMN "user"."role" IS 'USER / ADMIN 권한 구분';
COMMENT ON COLUMN "user"."llm_count" IS 'LLM 질문 횟수';
COMMENT ON COLUMN "user"."last_login_at" IS '마지막 로그인 시각';
COMMENT ON COLUMN "user"."created_at" IS '계정 생성 일자';
COMMENT ON COLUMN "user"."updated_at" IS '마지막 업데이트 일자';
