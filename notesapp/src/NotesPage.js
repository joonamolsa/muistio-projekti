import React, { useState, useEffect } from "react";
import "./NotesPage.css";

function NotesPage({ username, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/notes?username=${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotes(data.notes);
        } else {
          setMessage("Virhe haettaessa muistiinpanoja");
        }
      })
      .catch((err) => {
        console.error("Virhe:", err);
        setMessage("Virhe palvelimessa");
      });
  }, [username]);

  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!title || !content) {
      setMessage("Otsikko ja sisältö ovat pakollisia.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, title, content }),
      });

      const data = await res.json();
      if (data.success) {
        setNotes([data.note, ...notes]);
        setTitle("");
        setContent("");
        setMessage("Muistiinpano lisätty!");
      } else {
        setMessage("Muistiinpanon lisäys epäonnistui.");
      }
    } catch (err) {
      console.error("Virhe lisättäessä:", err);
      setMessage("Virhe palvelimessa.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/notes/${id}?username=${username}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (data.success) {
        setNotes(notes.filter((note) => note.id !== id));
        setMessage("Muistiinpano poistettu.");
      } else {
        setMessage("Poisto epäonnistui.");
      }
    } catch (err) {
      console.error("Virhe poistossa:", err);
      setMessage("Virhe palvelimessa.");
    }
  };

  const handleEdit = (note) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!title || !content) {
      setMessage("Otsikko ja sisältö ovat pakollisia.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/notes/${editingNoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, title, content }),
      });

      const data = await res.json();
      if (data.success) {
        setNotes(
          notes.map((note) => (note.id === editingNoteId ? data.note : note))
        );
        setTitle("");
        setContent("");
        setEditingNoteId(null);
        setMessage("Muistiinpano päivitetty!");
      } else {
        setMessage("Päivitys epäonnistui.");
      }
    } catch (err) {
      console.error("Virhe päivityksessä:", err);
      setMessage("Virhe palvelimessa.");
    }
  };

  const handleLogout = () => {
    onLogout(); // Ilmoita App.js:lle että kirjautuminen on päättynyt
  };

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h2>Käyttäjä: {username}</h2>
        <button className="logout-button" onClick={handleLogout}>
          Kirjaudu ulos
        </button>
      </div>

      <form
        onSubmit={editingNoteId ? handleUpdate : handleAddNote}
        className="notes-form"
      >
        <input
          type="text"
          placeholder="Otsikko"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Sisältö"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit">
          {editingNoteId ? "Päivitä muistiinpano" : "Lisää muistiinpano"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <div className="notes-grid">
        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <h4>{note.title}</h4>
            <div
              dangerouslySetInnerHTML={{
                __html: note.content.replace(/\n/g, "<br />"),
              }}
            />
            <button onClick={() => handleEdit(note)}>Muokkaa</button>
            <button onClick={() => handleDelete(note.id)}>Poista</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotesPage;
