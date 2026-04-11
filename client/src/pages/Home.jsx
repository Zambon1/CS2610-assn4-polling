import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Poll } from "../components/PollCard";
import { useNavigate } from "react-router";

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [polls, setPolls] = useState([]);

  useEffect(() => {
    async function getPolls() {
      const res = await fetch("/api/polls", {
        method: "GET",
        credentials: "include",
      });
      const body = await res.json();
      setPolls(Array.isArray(body) ? body : body.polls ?? []);
    }

    getPolls();
  }, []);

  return (
    <div className="home-page">
      <header className="home-header">
        <p className="home-eyebrow">Polling App</p>
        <h2>{user ? `Welcome, ${user.username}!` : "Welcome to Polling App"}</h2>
        <p className="home-description">Browse active polls, check the latest results, and jump into a new vote whenever you’re ready.</p>
      </header>

      <div className="home-section-title">
        <h3>Recent Polls</h3>
      </div>

      <ul className="home-poll-list">
        {polls.map((poll) => (
          <li key={poll.id} className="home-poll-list-item">
            <Poll poll={poll} />
          </li>
        ))}
      </ul>
      {user && (
        <button onClick={() => navigate("/polls/new")} className="create-poll-button">
          Create New Poll
        </button>
      )}
    </div>
  );
}

export default Home;
