import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { MyPollCard } from "../components/MyPollCard";

function MyPolls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingPollId, setDeletingPollId] = useState(null);
  const [error, setError] = useState("");

  const myPolls = useMemo(() => {
    if (!user) {
      return [];
    }

    return polls.filter(
      (poll) => Number(poll.creator?.id ?? poll.user_id) === Number(user.id)
    );
  }, [polls, user]);

  const fetchMyPolls = useCallback(async () => {
    if (!user) {
      setPolls([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    setError("");

    try {
      const res = await fetch("/api/polls", {
        method: "GET",
        credentials: "include",
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Unable to load polls.");
        setPolls([]);
        return;
      }

      setPolls(Array.isArray(body) ? body : body.polls ?? []);
    } catch {
      setError("Unable to load polls.");
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyPolls();
  }, [fetchMyPolls]);

  async function handleDeletePoll(pollId) {
    setDeletingPollId(pollId);
    setError("");

    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Unable to delete poll.");
        return;
      }

      await fetchMyPolls();
    } catch {
      setError("Unable to delete poll.");
    } finally {
      setDeletingPollId(null);
    }
  }

  return (
    <div className="my-polls-page">
      <header className="my-polls-header">
        <p className="my-polls-eyebrow">Your Dashboard</p>
        <h2 className="my-polls-heading">My Polls</h2>
        <p className="my-polls-description">Manage polls you have created and remove any that are no longer needed.</p>
      </header>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Loading your polls...</p>
      ) : myPolls.length === 0 ? (
        <p>You haven't created any polls yet.</p>
      ) : (
        <div className="poll-list">
          {myPolls.map((poll) => (
            <MyPollCard key={poll.id} poll={poll} handleDeletePoll={handleDeletePoll} deletingPollId={deletingPollId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyPolls;