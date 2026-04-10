import connection from "../db/connection.js";

export class AppError extends Error {
    constructor(message, statusCode=500) {
        super(message);
        this.statusCode = statusCode;
    }
}

export async function requirePollOwnership(req, res, next) {
    try {
        if (!req.user) {
            return next(new AppError("You must be logged in.", 401));
        }

    const pollId = req.params.id ?? req.params.pollId ?? req.body.pollId ?? req.body.id;
    if (!pollId) {
        return next(new AppError("Poll ID is required.", 400));
    }

    const result = await connection.query("SELECT user_id FROM polls WHERE id = $1", [pollId]);

    if (result.rows.length === 0) {
        return next(new AppError("Poll not found.", 404));
    }

    if (result.rows[0].user_id !== req.user.id) {
        return next(new AppError("You do not have permission to perform this action.", 403));
    }

    return next();
    } catch (error) {
        return next(error);
    }
}

export async function checkVoteAnonymity(req, res, next) {
    try {
        const pollId = req.params.id ?? req.params.pollId ?? req.body.pollId ?? req.body.id;
        if (!pollId) {
            return next(new AppError("Poll ID is required.", 400));
        }

        const result = await connection.query("SELECT allow_anonymous FROM polls WHERE id = $1", [pollId]);

        if (result.rows.length === 0) {
            return next(new AppError("Poll not found.", 404));
        }

        req.allowAnonymous = result.rows[0].allow_anonymous;
        if (!req.allowAnonymous && !req.user) {
            return next(new AppError("You must be logged in to vote on this poll.", 401));
        }
        return next();
    } catch (error) {
        return next(error);
    }
}