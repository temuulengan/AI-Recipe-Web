-- Post 테이블 생성
CREATE TABLE IF NOT EXISTS "post" (
  "id" SERIAL PRIMARY KEY,
  "author_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "content" TEXT NOT NULL,
  "prefix" VARCHAR(50) NOT NULL DEFAULT 'General',
  "is_pinned" BOOLEAN NOT NULL DEFAULT false,
  "views" INTEGER NOT NULL DEFAULT 0,
  "comment_count" INTEGER NOT NULL DEFAULT 0,
  "average_rating" DECIMAL(2, 1) NOT NULL DEFAULT 0,
  "rating_count" INTEGER NOT NULL DEFAULT 0,
  "img_url" VARCHAR(500) DEFAULT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_post_author" 
    FOREIGN KEY ("author_id") 
    REFERENCES "user"("id") 
    ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "idx_post_author_id" ON "post"("author_id");
CREATE INDEX IF NOT EXISTS "idx_post_created_at" ON "post"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_post_is_pinned" ON "post"("is_pinned");
CREATE INDEX IF NOT EXISTS "idx_post_prefix" ON "post"("prefix");

-- 주석 추가
COMMENT ON TABLE "post" IS '게시글 테이블';
COMMENT ON COLUMN "post"."id" IS 'PK (SERIAL)';
COMMENT ON COLUMN "post"."author_id" IS 'FK | 작성자의 user.id';
COMMENT ON COLUMN "post"."title" IS '제목';
COMMENT ON COLUMN "post"."content" IS '본문(Markdown)';
COMMENT ON COLUMN "post"."prefix" IS '분류/말머리 (공지/레시피 등)';
COMMENT ON COLUMN "post"."is_pinned" IS '상단 고정';
COMMENT ON COLUMN "post"."views" IS '조회수';
COMMENT ON COLUMN "post"."comment_count" IS '댓글 수 캐시';
COMMENT ON COLUMN "post"."average_rating" IS '별점 평균(1~5)';
COMMENT ON COLUMN "post"."rating_count" IS '별점 참여 수';
COMMENT ON COLUMN "post"."img_url" IS '이미지 경로';
COMMENT ON COLUMN "post"."created_at" IS '작성 시각';
COMMENT ON COLUMN "post"."updated_at" IS '수정 시각';
