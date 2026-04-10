CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_vote_if_user_id_not_null
    ON votes (poll_id, user_id)
    WHERE user_id IS NOT NULL;