import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

function CreatePoll() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanedOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (cleanedOptions.length < 2) {
      setError("Please provide at least two options.");
      return;
    }

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        options: cleanedOptions,
        allowAnonymous,
      }),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    navigate(`/polls/${data.id}`);
  }

  function handleOptionChange(index, value) {
    setOptions((currentOptions) =>
      currentOptions.map((option, i) => (i === index ? value : option))
    );
  }

  function handleAddOption() {
    setOptions((currentOptions) => [...currentOptions, ""]);
  }

  return (
    <div className="form-page create-poll-page">
      <h2>Create New Poll</h2>
      {error && <p className="error-message">{error}</p>}
      <form className="create-poll-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            className="create-poll-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-group">
          <h3>Options</h3>
          {options.map((option, index) => (
            <div key={index} className="create-poll-option-row">
              <label htmlFor={`option-${index}`}>Option {index + 1}</label>
              <input
                id={`option-${index}`}
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                required={index < 2}
              />
            </div>
          ))}
          <button type="button" className="btn btn-secondary add-option-button" onClick={handleAddOption}>
            <span aria-hidden="true">+</span>
            <span>Add Option</span>
          </button>
        </div>
        <div className="form-group create-poll-checkbox-group">
            <label className="create-poll-checkbox-label" htmlFor="allowAnonymous">Allow Anonymous Votes</label>
            <div className="create-poll-checkbox-wrap">
            <input
                id="allowAnonymous"
                type="checkbox"
                checked={allowAnonymous}
                onChange={(e) => setAllowAnonymous(e.target.checked)}
            />
            </div>
        </div>
        <button type="submit" className="btn btn-primary create-poll-submit">Submit</button>
      </form>
    </div>
  );
}

export default CreatePoll;