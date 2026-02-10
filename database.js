const Database = require('better-sqlite3');

// Create / open DB
const db = new Database('hospital.db');

console.log('Connected to SQLite database');

// ---- USERS ----
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  )
`).run();

// Seed users (safe)
db.prepare(`
  INSERT OR IGNORE INTO users (email, password, role) VALUES
  ('admin@hospital.com', 'admin123', 'admin'),
  ('doctor@hospital.com', 'doctor123', 'doctor'),
  ('patient@hospital.com', 'patient123', 'patient')
`).run();

// ---- PATIENTS ----
db.prepare(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    age INTEGER,
    gender TEXT
  )
`).run();

// ---- DOCTORS ----
db.prepare(`
  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    specialization TEXT
  )
`).run();

// ---- APPOINTMENTS ----
db.prepare(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_id INTEGER,
    date TEXT,
    time TEXT
  )
`).run();

// ---- COMPATIBILITY LAYER (so app.js does NOT change) ----
module.exports = {
  get(sql, params, cb) {
    try {
      const row = db.prepare(sql).get(params);
      cb(null, row);
    } catch (err) {
      cb(err);
    }
  },

  all(sql, params, cb) {
    try {
      const rows = db.prepare(sql).all(params);
      cb(null, rows);
    } catch (err) {
      cb(err);
    }
  },

  run(sql, params, cb) {
    try {
      const info = db.prepare(sql).run(params);
      cb && cb.call({ lastID: info.lastInsertRowid }, null);
    } catch (err) {
      cb && cb(err);
    }
  }
};
