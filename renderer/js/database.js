const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const { app } = require("electron");

const { setPassphrase, encrypt, decrypt } = require("./encryption");

// Single folder under userData for everything
const DATA_DIR = path.join(app.getPath("userData"), "paperback-data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "paperback.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Create tables if needed
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS notebooks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    notebook_id INTEGER NOT NULL,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  TEXT,
    last_edited TEXT,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY(notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE
  )
`
).run();

// NOTEBOOK APIS
function getNotebooks() {
  const rows = db
    .prepare(
      `
    SELECT id, name, order_index
      FROM notebooks
      ORDER BY order_index
  `
    )
    .all();

  return rows.map((r) => ({
    id: r.id,
    name: decrypt(r.name),
    order_index: r.order_index,
  }));
}

function createNotebook(name) {
  const enc = encrypt(name);
  const stmt = db.prepare(`
    INSERT INTO notebooks (name, order_index)
    VALUES (?, ?)
  `);
  const result = stmt.run(enc, Date.now());
  return result.lastInsertRowid;
}

function updateNotebooksOrder(orderArray) {
  const update = db.prepare(`
    UPDATE notebooks SET order_index = ? WHERE id = ?
  `);
  const txn = db.transaction((arr) => {
    arr.forEach((id, idx) => update.run(idx, id));
  });
  txn(orderArray);
}

// NOTE APIS
function getNotes(notebookId) {
  const rows = db
    .prepare(
      `
    SELECT id, title, content, created_at, last_edited, order_index
      FROM notes
      WHERE notebook_id = ?
      ORDER BY order_index
  `
    )
    .all(notebookId);

  return rows.map((r) => ({
    id: r.id,
    title: decrypt(r.title),
    content: decrypt(r.content), // json string of {text, created_at, last_edited}
    created_at: r.created_at,
    last_edited: r.last_edited,
    order_index: r.order_index,
  }));
}

function createNote(notebookId, title) {
  const encryptedTitle = encrypt(title);
  const initialObj = { text: "", created_at: "", last_edited: "" };
  const encryptedContent = encrypt(JSON.stringify(initialObj));
  const now = new Date().toLocaleString();

  const stmt = db.prepare(`
    INSERT INTO notes
      (notebook_id, title, content, created_at, last_edited, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(notebookId, encryptedTitle, encryptedContent, now, now, Date.now());
  return result.lastInsertRowid;
}

function updateNote(noteId, content, lastEdited) {
  // content should be json string: { text, created_at, last_edited }
  const enc = encrypt(content);
  db.prepare(
    `
    UPDATE notes
       SET content     = ?,
           last_edited = ?
     WHERE id = ?
  `
  ).run(enc, lastEdited, noteId);
}

function deleteNote(noteId) {
  db.prepare(`DELETE FROM notes WHERE id = ?`).run(noteId);
}

function updateNotesOrder(notebookId, orderArray) {
  const update = db.prepare(`
    UPDATE notes SET order_index = ? WHERE id = ?
  `);
  const txn = db.transaction((arr) => {
    arr.forEach((id, idx) => update.run(idx, id));
  });
  txn(orderArray);
}

function moveNote(noteId, targetNotebookId) {
  db.prepare(
    `
    UPDATE notes SET notebook_id = ? WHERE id = ?
  `
  ).run(targetNotebookId, noteId);
}

function getNote(noteId) {
  const r = db
    .prepare(
      `
    SELECT id, title, content, created_at, last_edited, order_index
      FROM notes
      WHERE id = ?
  `
    )
    .get(noteId);

  if (!r) return null;
  return {
    id: r.id,
    title: decrypt(r.title),
    content: decrypt(r.content),
    created_at: r.created_at,
    last_edited: r.last_edited,
    order_index: r.order_index,
  };
}

module.exports = {
  getNotebooks,
  createNotebook,
  updateNotebooksOrder,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  updateNotesOrder,
  moveNote,
  getNote,
};