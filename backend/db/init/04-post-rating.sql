-- PostRating 테이블 생성
CREATE TABLE IF NOT EXISTS "post_rating" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "post_id" INTEGER NOT NULL,
  "score" SMALLINT NOT NULL,
  "comment" TEXT DEFAULT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "fk_post_rating_user" 
    FOREIGN KEY ("user_id") 
    REFERENCES "user"("id") 
    ON DELETE CASCADE,
    
  CONSTRAINT "fk_post_rating_post" 
    FOREIGN KEY ("post_id") 
    REFERENCES "post"("id") 
    ON DELETE CASCADE,
    
  CONSTRAINT "chk_post_rating_score" 
    CHECK ("score" BETWEEN 1 AND 5),
    
  CONSTRAINT "uq_post_rating_user_post" 
    UNIQUE ("user_id", "post_id")
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "idx_post_rating_user_id" ON "post_rating"("user_id");
CREATE INDEX IF NOT EXISTS "idx_post_rating_post_id" ON "post_rating"("post_id");
CREATE INDEX IF NOT EXISTS "idx_post_rating_created_at" ON "post_rating"("created_at");

-- 주석 추가
COMMENT ON TABLE "post_rating" IS '게시글 별점 테이블';
COMMENT ON COLUMN "post_rating"."id" IS 'PK';
COMMENT ON COLUMN "post_rating"."user_id" IS 'FK | user.id';
COMMENT ON COLUMN "post_rating"."post_id" IS 'FK | post.id';
COMMENT ON COLUMN "post_rating"."score" IS '1~5 정수';
COMMENT ON COLUMN "post_rating"."comment" IS '별점 코멘트';
COMMENT ON COLUMN "post_rating"."created_at" IS '평가 시각';
COMMENT ON COLUMN "post_rating"."updated_at" IS '수정 시각';
