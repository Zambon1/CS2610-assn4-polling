import db from "../db/connection.js";

export const getAllPolls = async () => {
  const { rows } = await db.query("SELECT * FROM polls");
  return rows;
};

export const getPollById = async (id) => {
  const { rows } = await db.query("SELECT * FROM polls WHERE id = $1", [id]);
  return rows[0];
};

export const createPoll = async (title, description, allowAnonymous, userId, options) => {
  await db.query("BEGIN");
  try {
    const { rows } = await db.query(
      "INSERT INTO polls (title, description, allow_anonymous, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, allowAnonymous, userId]
    );

    const poll = rows[0];
    for (const optionText of options) {
      await db.query(
        "INSERT INTO options (poll_id, text) VALUES ($1, $2)",
        [poll.id, optionText]
      );
    }

    await db.query("COMMIT");
    return poll;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

export const getVotesForPoll = async (pollId) => {
  const { rows } = await db.query(
    "SELECT option_id, COUNT(*) as votes FROM votes WHERE poll_id = $1 GROUP BY option_id",
    [pollId]
  );
  return rows;
};

export const getVoteCountsForPollIds = async (pollIds) => {
  if (!Array.isArray(pollIds) || pollIds.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(pollIds.map((id) => Number(id)).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return [];
  }

  const { rows } = await db.query(
    "SELECT poll_id, COUNT(*)::int AS votes FROM votes WHERE poll_id = ANY($1::int[]) GROUP BY poll_id",
    [uniqueIds]
  );
  return rows;
};

export const getOptionsForPoll = async (pollId) => {
  const { rows } = await db.query(
    "SELECT * FROM options WHERE poll_id = $1",
    [pollId]
  );
  return rows;
};