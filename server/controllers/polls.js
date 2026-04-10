import { Router } from 'express';
import { RequireAuth } from '../middleware/auth.js';
import { getAllPolls, getPollById, createPoll, getVotesForPoll } from '../models/polls.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const polls = await getAllPolls();
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

router.post('/', RequireAuth, async (req, res) => {
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
    res.json(poll);
});