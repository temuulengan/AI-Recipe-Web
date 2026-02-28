-- SearchHistory 테이블 생성 (Flask LLM 서비스용)
CREATE TABLE IF NOT EXISTS "search_history" (
  "search_id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(100) NOT NULL,
  "user_query" TEXT NOT NULL,
  "structured_query" JSONB,
  "search_results" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "idx_search_history_user_id" ON "search_history"("user_id");
CREATE INDEX IF NOT EXISTS "idx_search_history_created_at" ON "search_history"("created_at");

-- 주석 추가
COMMENT ON TABLE "search_history" IS 'LLM 검색 기록 테이블';
COMMENT ON COLUMN "search_history"."search_id" IS 'PK, 자동 증가';
COMMENT ON COLUMN "search_history"."user_id" IS '사용자 ID (user.id FK 또는 anonymous_session)';
COMMENT ON COLUMN "search_history"."user_query" IS '사용자가 입력한 질문';
COMMENT ON COLUMN "search_history"."structured_query" IS 'LLM이 구조화한 쿼리 (JSON)';
COMMENT ON COLUMN "search_history"."search_results" IS 'LLM 응답 결과 (JSON)';
COMMENT ON COLUMN "search_history"."created_at" IS '검색 시각';
