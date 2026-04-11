import { Link } from "react-router";

export function Poll({ poll }) {
  return (
    <Link to={`/polls/${poll.id}`} className="poll-card">
    <div className="poll">
      <h2>{poll.title}</h2>
      <p>Created by: {poll.creator?.username ?? poll.creator}</p>
      <p> Votes: {poll.votes}</p>
    </div>
    </Link>
  );
}