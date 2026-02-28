-- Refresh Token 테이블 생성
CREATE TABLE IF NOT EXISTS "refresh_token" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "is_revoked" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_refresh_token_user" 
    FOREIGN KEY ("user_id") 
    REFERENCES "user"("id") 
    ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "idx_refresh_token_user_id" ON "refresh_token"("user_id");
CREATE INDEX IF NOT EXISTS "idx_refresh_token_token" ON "refresh_token"("token");
CREATE INDEX IF NOT EXISTS "idx_refresh_token_expires_at" ON "refresh_token"("expires_at");

-- 주석 추가
COMMENT ON TABLE "refresh_token" IS 'Refresh Token 관리 테이블';
COMMENT ON COLUMN "refresh_token"."id" IS 'PK';
COMMENT ON COLUMN "refresh_token"."user_id" IS 'FK | user.id';
COMMENT ON COLUMN "refresh_token"."token" IS 'refresh token (JWT)';
COMMENT ON COLUMN "refresh_token"."expires_at" IS '만료 시각';
COMMENT ON COLUMN "refresh_token"."is_revoked" IS '폐기 여부';
COMMENT ON COLUMN "refresh_token"."created_at" IS '생성 시각';
