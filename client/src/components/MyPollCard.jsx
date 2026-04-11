import { Link } from "react-router";

export function MyPollCard({ poll, handleDeletePoll, deletingPollId }) {
    const isDeleting = Number(deletingPollId) === Number(poll.id);

    return (
        <div className="my-poll-card">
            <Link to={`/polls/${poll.id}`} className="my-poll-card-link">
                <div className="poll">
                    <h2>{poll.title}</h2>
                    <p>Votes: {poll.votes}</p>
                </div>
            </Link>
            <div className="my-poll-card-actions">
                <button
                    className="btn btn-delete"
                    onClick={() => { handleDeletePoll(poll.id) }}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Deleting..." : "Delete"}
                </button>
            </div>
        </div>
    );
}