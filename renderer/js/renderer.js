import { createApp } from "vue";
import draggable from "vuedraggable/src/vuedraggable.js";

createApp({
  components: { draggable },
  data() {
    return {
      isUnlocked: false,
      notebooks: [], // { id, name, order_index, notes:[], expanded, showNewNote, newNote }
      selectedNotebook: null, // the notebook object
      selectedNote: null, // the note object
      showNewNotebook: false,
      showDeleteModal: false,
      saveTimeout: null,
      loadingNote: false,
      text: "",
      originalText: "",
      createdAt: "",
      lastEdited: "",
      newNotebook: "",
      showPassphraseModal: true,
      passphrase: "",
    };
  },
  methods: {
    // Called when user clicks unlock in passphrase modal
    async unlockApp() {
      if (!this.passphrase.trim()) {
        return alert("Please enter a passphrase.");
      }

      // Attempt to derive the key
      const { success, message } = await window.api.setPassphrase(
        this.passphrase
      );
      if (!success) {
        alert(`Passphrase rejected: ${message}`);
        this.passphrase = "";
        return;
      }

      // Verify by loading notebooks
      try {
        await this.loadNotebooks();
      } catch (err) {
        console.error("[ DECRYPTION FAILED ]", err);
        alert("Passphrase didn't unlock your data. Try again.");
        this.passphrase = "";
        return;
      }
      this.isUnlocked = true;
    },

    // Load notebooks + their notes
    async loadNotebooks() {
      const notebooks = await window.api.listNotebooks();
      for (const nb of notebooks) {
        nb.notes = await window.api.listNotes(nb.id);
        nb.expanded = false;
        nb.showNewNote = false;
        nb.newNote = "";
      }
      this.notebooks = notebooks;
      //console.log("Loaded notebooks:", this.notebooks);
    },

    toggleNewNotebook() {
      this.showNewNotebook = !this.showNewNotebook;
      if (!this.showNewNotebook) this.newNotebook = "";
    },
    async addNotebook() {
      if (!this.isUnlocked) {
        alert("Unlock first");
        return;
      }

      if (!this.newNotebook.trim()) return;
      await window.api.createNotebook(this.newNotebook.trim());
      this.newNotebook = "";
      this.showNewNotebook = false;
      await this.loadNotebooks();
    },
    toggleNotebook(i) {
      this.notebooks[i].expanded = !this.notebooks[i].expanded;
    },
    toggleNewNote(i) {
      const nb = this.notebooks[i];
      nb.showNewNote = !nb.showNewNote;
      if (!nb.showNewNote) nb.newNote = "";
    },
    async addNote(nb) {
      if (!this.isUnlocked) {
        alert("Unlock first");
        return;
      }

      if (!nb.newNote.trim()) return;
      const newId = await window.api.createNote(nb.id, nb.newNote.trim());
      //console.log(`Created note ${newId} in notebook ${nb.id}`);
      nb.notes = await window.api.listNotes(nb.id);
      nb.newNote = "";
      nb.showNewNote = false;
    },

    async selectNote(nb, note) {
      this.loadingNote = true;
      this.selectedNotebook = nb;
      this.selectedNote = note;
      const result = await window.api.loadNote(note.id);
      //console.log("Loaded note data:", result);

      let noteData = { text: "", created_at: "", last_edited: "" };
      if (typeof result === "string") {
        try {
          noteData = JSON.parse(result);
        } catch (e) {
          console.error("Error parsing note data:", e);
        }
      } else {
        noteData = result;
      }

      this.text = noteData.text || "";
      this.originalText = this.text;
      this.createdAt = noteData.created_at || "";
      this.lastEdited = noteData.last_edited || "";
      this.loadingNote = false;
    },

    saveNote() {
      if (!this.selectedNote) return;
      if (!this.createdAt) this.createdAt = new Date().toLocaleString();
      this.lastEdited = new Date().toLocaleString();

      const payload = JSON.stringify({
        text: this.text,
        created_at: this.createdAt,
        last_edited: this.lastEdited,
      });

      //console.log(`Saving note ${this.selectedNote.id}:`, payload);
      window.api.saveNote(this.selectedNote.id, payload, this.lastEdited);
    },

    async updateNotebooksOrder() {
      const order = this.notebooks.map((nb) => String(nb.id));
      await window.api.updateNotebooksOrder(order);
      //console.log("Updated notebook order:", order);
    },
    async updateNotesOrder(nb) {
      const order = nb.notes.map((n) => String(n.id));
      await window.api.updateNotesOrder(nb.id, order);
      //console.log(`Updated notes order for notebook ${nb.id}:`, order);
    },

    async onNotesAdd(evt, targetNb) {
      const noteId = evt.item?.dataset.noteId;
      const srcNotebookId = evt.from?.dataset.notebook;
      const dstNotebookId = evt.to?.dataset.notebook;
      //console.log("onNotesAdd:", { srcNotebookId, dstNotebookId, noteId });
      if (srcNotebookId && dstNotebookId && srcNotebookId !== dstNotebookId) {
        await this.moveNote(
          { id: noteId, notebook_id: srcNotebookId },
          dstNotebookId
        );
      }
      await this.updateNotesOrder(targetNb);
    },
    async onNotesRemove(evt, srcNb) {
      //console.log("onNotesRemove:", evt);
      await this.updateNotesOrder(srcNb);
    },

    openDeleteModal() {
      //console.log("Opening delete modal");
      this.showDeleteModal = true;
    },
    async confirmDelete() {
      if (!this.selectedNote) return;
      //console.log("Deleting note", this.selectedNote.id);
      await window.api.deleteNote(this.selectedNote.id);
      this.selectedNotebook.notes = await window.api.listNotes(
        this.selectedNotebook.id
      );
      this.selectedNote = null;
      this.text = this.createdAt = this.lastEdited = "";
      this.showDeleteModal = false;
    },
    cancelDelete() {
      this.showDeleteModal = false;
    },

    async updateNoteName(nb, oldNote, newName) {
      if (!newName.trim() || newName === oldNote.title) return;
      await window.api.updateNoteName(oldNote.id, newName);
      nb.notes = await window.api.listNotes(nb.id);
      if (this.selectedNote?.id === oldNote.id) {
        this.selectedNote.title = newName;
      }
    },

    async moveNote(note, targetNbId) {
      //console.log(`Moving note ${note.id} → notebook ${targetNbId}`);
      await window.api.moveNote(note.id, targetNbId);
      const src = this.notebooks.find((x) => x.id == note.notebook_id);
      const dst = this.notebooks.find((x) => x.id == targetNbId);
      if (src) src.notes = await window.api.listNotes(src.id);
      if (dst) dst.notes = await window.api.listNotes(dst.id);
      if (this.selectedNote?.id === note.id) {
        this.selectedNotebook = dst;
      }
    },

    cloneNote(note) {
      return { ...note };
    },
  },

  // Autosave
  watch: {
    text(newText) {
      if (this.loadingNote || !this.selectedNote) return;
      if (newText.trim() !== this.originalText.trim()) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
          this.saveNote();
          this.originalText = this.text;
        }, 300);
      }
    },
  },

  mounted() {},
}).mount("#app");
