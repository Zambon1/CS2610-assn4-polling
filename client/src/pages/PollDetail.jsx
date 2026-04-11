import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option, index) => {
    if (typeof option === "string") {
      return { id: index + 1, text: option };
    }

    return {
      id: option.id ?? option.option_id ?? index + 1,
      text: option.text ?? option.option ?? option.label ?? `Option ${index + 1}`,
    };
  });
}

function getVoteCount(votesByOption, optionId, optionText) {
  const match = votesByOption.find(
    (entry) =>
      String(entry.option_id ?? entry.optionId ?? entry.id ?? entry.option) ===
      String(optionId ?? optionText)
  );

  if (!match) {
    return 0;
  }

  return Number(match.votes ?? match.count ?? 0);
}

function PollDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [deletingPoll, setDeletingPoll] = useState(false);
  const [hasLocalVote, setHasLocalVote] = useState(false);
  const [localChosenOptionId, setLocalChosenOptionId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPoll() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/polls/${id}`, {
          credentials: "include",
        });
        const body = await res.json();

        if (!res.ok) {
          setError(body.error || "Unable to load poll.");
          setLoading(false);
          return;
        }

        const normalizedPoll = {
          ...body,
          title: body.title ?? body.question,
          description: body.description ?? "",
          allowAnonymous: Boolean(body.allow_anonymous ?? body.allowAnonymous),
          creatorName:
            body.creator?.username ??
            body.creator?.name ??
            body.creator_username ??
            body.creatorName ??
            "Unknown",
          createdAt: body.created_at ?? body.createdAt,
          options: normalizeOptions(body.options),
          votesByOption: Array.isArray(body.votes) ? body.votes : [],
          hasVoted: Boolean(
            body.has_voted ??
              body.hasVoted ??
              body.user_vote_option_id ??
              body.userVoteOptionId ??
              body.votedOptionId ??
              false
          ),
          chosenOptionId:
            body.user_vote_option_id ??
            body.userVoteOptionId ??
            body.votedOptionId ??
            null,
        };

        setPoll(normalizedPoll);
      } catch {
        setError("Unable to load poll.");
      } finally {
        setLoading(false);
      }
    }

    fetchPoll();
  }, [id]);

  const totalVotes = useMemo(() => {
    if (!poll) {
      return 0;
    }

    return poll.options.reduce(
      (sum, option) =>
        sum + getVoteCount(poll.votesByOption, option.id, option.text),
      0
    );
  }, [poll]);

  if (loading) {
    return <p>Loading poll...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!poll) {
    return <p className="error-message">Poll not found.</p>;
  }

  const currentUserOwnsPoll = user && Number(user.id) === Number(poll.user_id);
  const hasVoted = Boolean(poll.hasVoted || hasLocalVote);
  const chosenOptionId = poll.chosenOptionId ?? localChosenOptionId;
  const canVote = (user && !hasVoted) || (!user && poll.allowAnonymous && !hasVoted);
  const mustLoginToVote = !user && !poll.allowAnonymous;

  async function handleVoteSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedOptionId) {
      setError("Please select an option before voting.");
      return;
    }

    setSubmittingVote(true);
    try {
      const res = await fetch(`/api/polls/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ option: { id: selectedOptionId } }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Unable to submit vote.");
        setSubmittingVote(false);
        return;
      }

      setHasLocalVote(true);
      setLocalChosenOptionId(selectedOptionId);

      const refreshRes = await fetch(`/api/polls/${id}`, { credentials: "include" });
      const refreshedPoll = await refreshRes.json();
      if (refreshRes.ok) {
        setPoll((currentPoll) => ({
          ...currentPoll,
          ...refreshedPoll,
          title: refreshedPoll.title ?? refreshedPoll.question ?? currentPoll.title,
          description: refreshedPoll.description ?? currentPoll.description,
          allowAnonymous: Boolean(
            refreshedPoll.allow_anonymous ??
              refreshedPoll.allowAnonymous ??
              currentPoll.allowAnonymous
          ),
          creatorName:
            refreshedPoll.creator?.username ??
            refreshedPoll.creator?.name ??
            refreshedPoll.creator_username ??
            refreshedPoll.creatorName ??
            currentPoll.creatorName,
          createdAt: refreshedPoll.created_at ?? refreshedPoll.createdAt ?? currentPoll.createdAt,
          options: normalizeOptions(refreshedPoll.options ?? currentPoll.options),
          votesByOption: Array.isArray(refreshedPoll.votes)
            ? refreshedPoll.votes
            : currentPoll.votesByOption,
          hasVoted: true,
          chosenOptionId:
            refreshedPoll.user_vote_option_id ??
            refreshedPoll.userVoteOptionId ??
            refreshedPoll.votedOptionId ??
            selectedOptionId,
        }));
      }
    } catch {
      setError("Unable to submit vote.");
    } finally {
      setSubmittingVote(false);
    }
  }

  async function handleDeletePoll() {
    setDeletingPoll(true);
    setError("");

    try {
      const res = await fetch(`/api/polls/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Unable to delete poll.");
        setDeletingPoll(false);
        return;
      }

      navigate("/");
    } catch {
      setError("Unable to delete poll.");
    } finally {
      setDeletingPoll(false);
    }
  }

  return (
    <section className="poll-detail-page">
      <header className="poll-detail-header">
        <h2>{poll.title}</h2>
        {poll.description && <p className="poll-detail-description">{poll.description}</p>}

        <p className="poll-detail-meta">
          Created by <strong>{poll.creatorName}</strong> on {poll.createdAt ? new Date(poll.createdAt).toLocaleString() : "Unknown date"}
        </p>

        {currentUserOwnsPoll && (
          <button
            type="button"
            className="btn btn-danger poll-detail-delete"
            onClick={handleDeletePoll}
            disabled={deletingPoll}
          >
            {deletingPoll ? "Deleting..." : "Delete Poll"}
          </button>
        )}
      </header>

      {error && <p className="error-message">{error}</p>}

      {canVote ? (
        <form className="poll-vote-form" onSubmit={handleVoteSubmit}>
          <h3>Cast your vote</h3>
          <div className="poll-vote-options">
            {poll.options.map((option) => (
              <label key={option.id} className="poll-vote-option">
                <input
                  type="radio"
                  name="selectedOption"
                  value={option.id}
                  checked={String(selectedOptionId) === String(option.id)}
                  onChange={() => setSelectedOptionId(option.id)}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={submittingVote}>
            {submittingVote ? "Submitting..." : "Submit Vote"}
          </button>
        </form>
      ) : hasVoted ? (
        <section className="poll-vote-form poll-result-section">
          <h3>Results</h3>
          <p className="poll-result-total">Total votes: {totalVotes}</p>
          <ul>
            {poll.options.map((option) => {
              const votes = getVoteCount(poll.votesByOption, option.id, option.text);
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isChosen =
                chosenOptionId !== null && String(chosenOptionId) === String(option.id);

              return (
                <li key={`result-${option.id}`} className="poll-result-item">
                  <div className="poll-result-header">
                    <strong>{option.text}</strong>
                    <span>
                      {votes} vote{votes === 1 ? "" : "s"} ({percentage}%)
                      {isChosen && " - Your choice"}
                    </span>
                  </div>
                  <div className="poll-result-bar" aria-hidden="true">
                    <div
                      className="poll-result-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="poll-vote-form">
          <h3>Options</h3>
          <ul className="poll-detail-option-list">
            {poll.options.map((option) => (
              <li key={option.id}>{option.text}</li>
            ))}
          </ul>
        </section>
      )}

      {mustLoginToVote && !hasVoted && (
        <p className="info-message poll-detail-login-message">
          You need to log in to vote on this poll. <Link to={`/login?redirect=/polls/${id}`}>Log in</Link>
        </p>
      )}
    </section>
  );
}

export default PollDetail;
    
