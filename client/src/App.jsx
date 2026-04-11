import { Routes, Route } from "react-router";
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatePoll from "./pages/CreatePoll";
import PollDetail from "./pages/PollDetail";
import MyPolls from "./pages/MyPolls";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/polls/new" element={<CreatePoll />} />
          <Route path="/polls/:id" element={<PollDetail />} />
          <Route path="/my-polls" element={<MyPolls />} />
        </Routes> 
      </main>
    </>
  );
}

export default App;
