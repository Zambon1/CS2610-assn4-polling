import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo.png";

function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/"><img src={logo} alt="My App" className="navbar-logo" /></Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Browse Polls</Link>
        {!isAuthPage &&
          (user ? (
            <>
              <span className="navbar-user">Hi, {user.username}</span>
              <span className="navbar-separator">|</span>
              <Link to="/my-polls" className="navbar-link">
                My Polls</Link>
              <span className="navbar-separator">|</span>
              <Link to="/polls/new" className="navbar-link">
                New Poll
              </Link>
              <button onClick={handleLogout} className="btn btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ))}
      </div>
    </nav>
  );
}

export default Navbar;
