const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Call this before any other DB call
  setPassphrase: (pw) => ipcRenderer.invoke('set-passphrase', pw),

  // Notebooks
  listNotebooks: () => ipcRenderer.invoke('list-notebooks'),
  createNotebook: (name) => ipcRenderer.invoke('create-notebook', name),
  updateNotebooksOrder: (order) => ipcRenderer.send('update-notebooks-order', order),

  // Notes
  listNotes: (nbId) => ipcRenderer.invoke('list-notes', nbId),
  createNote: (nbId, title) => ipcRenderer.invoke('create-note', nbId, title),
  loadNote: (id) => ipcRenderer.invoke('load-note', id),
  saveNote: (id, text, lastEdited) => ipcRenderer.send('save-note', id, text, lastEdited),
  deleteNote: (id) => ipcRenderer.send('delete-note', id),
  updateNotesOrder: (nbId, order) => ipcRenderer.send('update-notes-order', nbId, order),
  moveNote: (noteId, targetNbId) => ipcRenderer.send('move-note', noteId, targetNbId),
  updateNoteName: (noteId, newTitle) => ipcRenderer.send('update-note-name', noteId, newTitle),
});
