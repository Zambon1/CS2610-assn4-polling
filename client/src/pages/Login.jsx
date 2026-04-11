import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";

function Login() {
  const { user, setUser, redirectUrl, setRedirectUrl } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectFromQuery = new URLSearchParams(location.search).get("redirect");

  // If the user is already logged in, redirect them
  if (user) {
    navigate(redirectFromQuery || redirectUrl || "/", { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setUser(data.user);

    // Redirect to the page they were trying to access, or home
    const destination = redirectFromQuery || redirectUrl || "/";
    setRedirectUrl("/");
    navigate(destination);
  }

  return (
    <div className="form-page">
      <h2>Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login;
