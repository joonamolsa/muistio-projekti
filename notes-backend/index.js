require("dotenv").config();

const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const { findUser } = require("./db");
const { CosmosClient } = require("@azure/cosmos");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Kirjautuminen
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await findUser(username);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Käyttäjää ei löydy" });
    }

    console.log("Tietokannan hash:", user.password);

    const match = await bcrypt.compare(password, user.password);
    console.log("Salasana match:", match);

    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Väärä salasana" });
    }

    res.json({ success: true, user: username });
  } catch (err) {
    console.error("Virhe kirjautumisessa:", err);
    res.status(500).json({ success: false, message: "Palvelinvirhe" });
  }
});

// 📚 Muistiinpanojen tallennus & haku
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const notesContainer = cosmosClient
  .database(process.env.COSMOS_DB)
  .container("notes");

// POST /notes — lisää muistiinpano
app.post("/notes", async (req, res) => {
  const { username, title, content } = req.body;

  if (!username || !title || !content) {
    return res
      .status(400)
      .json({ success: false, message: "Pakolliset kentät puuttuvat" });
  }

  const newNote = {
    username,
    title,
    content,
    createdAt: new Date().toISOString(),
  };

  try {
    const { resource } = await notesContainer.items.create(newNote);
    res.json({ success: true, note: resource });
  } catch (err) {
    console.error("Virhe muistiinpanon luonnissa:", err);
    res.status(500).json({ success: false, message: "Virhe tallennuksessa" });
  }
});

// GET /notes — hae käyttäjän muistiinpanot
app.get("/notes", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res
      .status(400)
      .json({ success: false, message: "Käyttäjänimi puuttuu" });
  }

  try {
    const querySpec = {
      query:
        "SELECT * FROM c WHERE c.username = @username ORDER BY c.createdAt DESC",
      parameters: [{ name: "@username", value: username }],
    };

    const { resources } = await notesContainer.items
      .query(querySpec)
      .fetchAll();
    res.json({ success: true, notes: resources });
  } catch (err) {
    console.error("Virhe haettaessa muistiinpanoja:", err);
    res.status(500).json({ success: false, message: "Virhe haussa" });
  }
});

// PUT /notes/:id — muokkaa muistiinpanoa
app.put("/notes/:id", async (req, res) => {
  const noteId = req.params.id;
  const { username, title, content } = req.body;

  if (!username || !title || !content) {
    return res
      .status(400)
      .json({ success: false, message: "Pakolliset kentät puuttuvat" });
  }

  try {
    const { resource: existingNote } = await notesContainer
      .item(noteId, username)
      .read();

    const updatedNote = {
      ...existingNote,
      title,
      content,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await notesContainer
      .item(noteId, username)
      .replace(updatedNote);
    res.json({ success: true, note: resource });
  } catch (err) {
    console.error("Virhe muokkauksessa:", err);
    res.status(500).json({ success: false, message: "Muokkausvirhe" });
  }
});

// DELETE /notes — hae käyttäjän muistiinpano ja poista
app.delete("/notes/:id", async (req, res) => {
  const noteId = req.params.id;
  const { username } = req.query;

  if (!username) {
    return res
      .status(400)
      .json({ success: false, message: "Partition key (username) puuttuu" });
  }

  try {
    await notesContainer.item(noteId, username).delete();
    res.json({ success: true });
  } catch (err) {
    console.error("Virhe poistossa:", err);
    res.status(500).json({ success: false, message: "Poistovirhe" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend käynnissä portissa ${PORT}`);
});
