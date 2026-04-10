import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { AppError, requirePollOwnership, checkVoteAnonymity } from '../middleware/error_handler.js';
import { getAllPolls, getPollById, createPoll, getVotesForPoll } from '../models/polls.js';
import { findById } from '../models/users.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const polls = await getAllPolls();
        const creators = await findById(polls.map(p => p.user_id));
        polls.forEach(poll => {
            poll.creator = creators.find(c => c.id === poll.user_id);
        });
        //Get the votes for each poll, add the number, then add the property to each poll object
        const voteCount = await getVotesForPoll(polls.map(p => p.id));
        polls.forEach(poll => {
            poll.votes = voteCount.find(v => v.poll_id === poll.id)?.votes || 0;
        });
        res.json(polls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const { title, options, description, allowAnonymous } = req.body;
    const userId = req.user.id;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'Title and at least 2 options are required' });
    }

    try {
        const poll = await createPoll(title, options, description, allowAnonymous, userId);
        res.status(201).json(poll);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    const poll = await getPollById(parseInt(req.params.id), req.user.id);
    if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
    }
    const options = await getOptionsForPoll(poll.id);
    const votes = await getVotesForPoll(poll.id);
    poll.options = options;
    poll.votes = votes;

    res.json(poll);
});

router.delete("/:id", requireAuth, requirePollOwnership, async (req, res) => {
    let inTransaction = false;
    try {
        await connection.query("BEGIN");
        inTransaction = true;

        const pollId = parseInt(req.params.id);
        await connection.query("DELETE FROM votes WHERE poll_id = $1", [pollId]);
        await connection.query("DELETE FROM polls WHERE id = $1", [pollId]);
        const result = await connection.query("DELETE FROM polls WHERE id = $1 AND user_id = $2 RETURNING *", [pollId, req.user.id]);

        if (result.rowCount === 0) {
            throw new AppError("You are not allowed to delete this poll.", 403);
        }
        await connection.query("COMMIT");
        inTransaction = false;
        res.json({ success: true });
    } catch (error) {
        if (inTransaction) {
            await connection.query("ROLLBACK");
        }
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.post("/:id/vote", checkVoteAnonymity, async (req, res) => {
    const pollId = parseInt(req.params.id);
    const { option } = req.body;
    const userId = req.allowAnonymous ? null : req.user.id;

    try {
        await connection.query(
            "INSERT INTO votes (poll_id, user_id, option_id) VALUES ($1, $2, $3) RETURNING *",
            [pollId, userId, option.id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;