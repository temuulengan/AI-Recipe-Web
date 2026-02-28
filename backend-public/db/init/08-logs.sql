CREATE TABLE app_error_log (
    id          BIGSERIAL PRIMARY KEY,
    level       VARCHAR(20) NOT NULL,              -- 거의 'error'만 쓸 예정
    source      VARCHAR(50) NOT NULL,              -- nest-api / flask-api ...
    message     TEXT NOT NULL,                     -- 에러 메시지
    stack       TEXT,                              -- stack trace (선택)
    method      VARCHAR(10),                       -- GET/POST 등
    path        TEXT,                              -- 요청 URL
    user_id     VARCHAR(50),                       -- 로그인 유저 ID (있으면)
    context     JSONB,                             -- 기타 정보
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_error_log_created_at ON app_error_log (created_at DESC);
CREATE INDEX idx_app_error_log_level ON app_error_log (level);
CREATE INDEX idx_app_error_log_source ON app_error_log (source);
