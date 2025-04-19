const { ipcMain } = require("electron");
const path = require("path");
const { setPassphrase } = require("./encryption");
const db = require("./database");

// Handle setting the passphrase once on startup
// Renderer should call: await window.api.setPassphrase(userInput);
// Must happen before any list‑notebooks / list‑notes / load‑note or etc
ipcMain.handle("set-passphrase", async (_event, passphrase) => {
  try {
    setPassphrase(passphrase);
    return { success: true };
  } catch (err) {
    console.error("Error setting passphrase:", err);
    return { success: false, message: err.message };
  }
});

// -----------------------------------------------------------

// List all notebooks
ipcMain.handle("list-notebooks", () => {
  return db.getNotebooks();
});

// Create new notebook, returns new notebook's id
ipcMain.handle("create-notebook", (_event, notebookName) => {
  return db.createNotebook(notebookName);
});

// Update order of notebooks
ipcMain.on("update-notebooks-order", (_event, orderArray) => {
  db.updateNotebooksOrder(orderArray);
});

// -----------------------------------------------------------

// List notes for given notebook
ipcMain.handle("list-notes", (_event, notebookId) => {
  return db.getNotes(notebookId);
});

// Create new note, returns new note's id
ipcMain.handle("create-note", (_event, notebookId, noteTitle) => {
  return db.createNote(notebookId, noteTitle);
});

// Load note by ID
ipcMain.handle("load-note", (_event, noteId) => {
  return db.getNote(noteId);
});

// Save/update note
ipcMain.on("save-note", (_event, noteId, content, lastEdited) => {
  db.updateNote(noteId, content, lastEdited);
});

// Delete note
ipcMain.on("delete-note", (_event, noteId) => {
  db.deleteNote(noteId);
});

// Update order of notes within notebook
ipcMain.on("update-notes-order", (_event, notebookId, orderArray) => {
  db.updateNotesOrder(notebookId, orderArray);
});

// Move note into another notebook
ipcMain.on("move-note", (_event, noteId, targetNotebookId) => {
  db.moveNote(noteId, targetNotebookId);
});

// Update note’s title
ipcMain.on("update-note-name", (_event, noteId, newTitle) => {
  if (typeof db.updateNoteTitle === "function") {
    db.updateNoteTitle(noteId, newTitle);
  } else {
    console.warn("updateNoteTitle is not implemented in database.js");
  }
});
