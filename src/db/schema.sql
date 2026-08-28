-- Speed Math Leaderboard schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(32) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at   TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS games (
    id              VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(64) UNIQUE NOT NULL,
    description     TEXT
);

INSERT INTO games (id, name, description)
VALUES ('speed_math', 'Speed Math', '30-second arithmetic challenge')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id         VARCHAR(32) NOT NULL REFERENCES games(id),
    score           INTEGER NOT NULL CHECK (score >= 0),
    duration_seconds INTEGER NOT NULL,
    played_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_seed     VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_game_id ON scores(game_id);
CREATE INDEX IF NOT EXISTS idx_scores_played_at ON scores(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_score_desc ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Best score per user (all time), used by the leaderboard endpoint
CREATE OR REPLACE VIEW best_scores_all_time AS
SELECT DISTINCT ON (s.user_id)
    s.user_id, u.username, s.score, s.played_at
FROM scores s
JOIN users u ON u.id = s.user_id
WHERE s.game_id = 'speed_math'
ORDER BY s.user_id, s.score DESC, s.played_at ASC;
