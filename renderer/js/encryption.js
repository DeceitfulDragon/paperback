const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

// Database and salt
const DATA_DIR = path.join(app.getPath("userData"), "paperback-data");
const SALT_FILE = path.join(DATA_DIR, "salt.bin");

// Crazy crypto stuff
const ALGORITHM = "aes-256-gcm";
const KEY_LEN = 32; // 256 bits
const IV_LEN = 12; // 96‑bit IV for GCM, seems to be strongly recommended
const ITERATIONS = 200_000; // PBKDF2 rounds
const DIGEST = "sha512";

// Key will be stored here after setPassphrase()
let _key = null;

// Check if data folder & salt file exist, return the salt buffer
function _loadOrCreateSalt() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SALT_FILE)) {
    // generate a new random salt once
    fs.writeFileSync(SALT_FILE, crypto.randomBytes(16));
  }
  return fs.readFileSync(SALT_FILE);
}

// Called exactly once on startup—after passphrase is entered
// PBKDF2‑derives a strong key and caches it in memory (_key)
function setPassphrase(passphrase) {
  const salt = _loadOrCreateSalt();
  _key = crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LEN, DIGEST);
}

// Encryption
function encrypt(text) {
  if (!_key)
    throw new Error("encryption key not set; call setPassphrase() first!!!");
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGORITHM, _key, iv);
  const ct = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store iv + tag + ciphertex
  return Buffer.concat([iv, tag, ct]).toString("hex");
}

// Decryption
function decrypt(encryptedHex) {
  if (!_key)
    throw new Error("encryption key not set; call setPassphrase() first!!!");
  const data = Buffer.from(encryptedHex, "hex");
  const iv = data.slice(0, IV_LEN);
  const tag = data.slice(IV_LEN, IV_LEN + 16);
  const ct = data.slice(IV_LEN + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, _key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString("utf8");
}

module.exports = { setPassphrase, encrypt, decrypt };
