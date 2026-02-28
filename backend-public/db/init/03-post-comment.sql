-- PostComment 테이블 생성
CREATE TABLE IF NOT EXISTS "post_comment" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL,
  "author_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "parent_id" INTEGER DEFAULT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_post_comment_post" 
    FOREIGN KEY ("post_id") 
    REFERENCES "post"("id") 
    ON DELETE CASCADE,
    
  CONSTRAINT "fk_post_comment_author" 
    FOREIGN KEY ("author_id") 
    REFERENCES "user"("id") 
    ON DELETE CASCADE,
    
  CONSTRAINT "fk_post_comment_parent" 
    FOREIGN KEY ("parent_id") 
    REFERENCES "post_comment"("id") 
    ON DELETE SET NULL
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "idx_post_comment_post_id" ON "post_comment"("post_id");
CREATE INDEX IF NOT EXISTS "idx_post_comment_author_id" ON "post_comment"("author_id");
CREATE INDEX IF NOT EXISTS "idx_post_comment_parent_id" ON "post_comment"("parent_id");
CREATE INDEX IF NOT EXISTS "idx_post_comment_created_at" ON "post_comment"("created_at");

-- 주석 추가
COMMENT ON TABLE "post_comment" IS '게시글 댓글 테이블';
COMMENT ON COLUMN "post_comment"."id" IS 'PK';
COMMENT ON COLUMN "post_comment"."post_id" IS 'FK | post.id';
COMMENT ON COLUMN "post_comment"."author_id" IS 'FK | user.id';
COMMENT ON COLUMN "post_comment"."content" IS '댓글 내용';
COMMENT ON COLUMN "post_comment"."parent_id" IS '부모 댓글(대댓글)';
COMMENT ON COLUMN "post_comment"."created_at" IS '작성 시각';
COMMENT ON COLUMN "post_comment"."updated_at" IS '수정 시각';
