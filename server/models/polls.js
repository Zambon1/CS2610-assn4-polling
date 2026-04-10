import db from "../db/connection.js";

export const getAllPolls = async () => {
  const { rows } = await db.query("SELECT * FROM polls");
  return rows;
};

export const getPollById = async (id) => {
  const { rows } = await db.query("SELECT * FROM polls WHERE id = $1", [id]);
  return rows[0];
};

export const createPoll = async (question, options, description, allowAnonymous, userId) => {
  const { rows } = await db.query(
    "INSERT INTO polls (question, options, description, allow_anonymous, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [question, options, description, allowAnonymous, userId]
  );
  return rows[0];
}

export const getVotesForPoll = async (pollId) => {
  const { rows } = await db.query(
    "SELECT option, COUNT(*) as votes FROM votes WHERE poll_id = $1 GROUP BY option",
    [pollId]
  );
  return rows;
};

export const getOptionsForPoll = async (pollId) => {
  const { rows } = await db.query(
    "SELECT options FROM polls WHERE poll_id = $1",
    [pollId]
  );
  return rows[0]?.options || [];
};