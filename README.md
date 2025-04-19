# Paperback

A simple, desktop note‑taking app with encryption. All notebooks and notes are stored locally and encrypted with a passphrase you supply on startup.
This is a project started to learn electron (and a bit more about encryption.)

## Features

- **Organization**  
  Create multiple notebooks, each containing any number of notes. Drag notes and notebooks around to your liking!

- **Automatic saving**  
  Notes are saved automatically as you type.

- **AES‑256 encryption**  
  Your data is encrypted on disk using a key derived from your passphrase via PBKDF2.

- **Portable data folder**  
  Copy your user data folder (containing the encrypted database and salt) to another computer and open with the same passphrase.



Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg