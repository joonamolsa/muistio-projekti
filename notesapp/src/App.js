import React, { useState } from "react";
import NotesPage from "./NotesPage";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLoggedInUser(data.user);
        setMessage("");
      } else {
        setMessage("Väärä käyttäjätunnus tai salasana.");
      }
    } catch (error) {
      console.error("Virhe kirjautumisessa:", error);
      setMessage("Virhe palvelimessa.");
    }
  };

  if (loggedInUser) {
    return (
      <NotesPage
        username={loggedInUser}
        onLogout={() => setLoggedInUser(null)}
      />
    );
  }

  return (
    <div className="login-page">
      <div className="login-wrapper">
        <div className="image-container">
          <img src="/MainImage.png" alt="Main" />
        </div>
        <div className="form-container">
          <h2>Kirjaudu sisään</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Käyttäjänimi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Salasana"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Kirjaudu</button>
          </form>
          {message && <p className="error-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
