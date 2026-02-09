const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./hospital.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  )
`);

// Seed default users (run once safely)
db.run(
  `INSERT OR IGNORE INTO users (email, password, role) VALUES
  ('admin@hospital.com', 'admin123', 'admin'),
  ('doctor@hospital.com', 'doctor123', 'doctor'),
  ('patient@hospital.com', 'patient123', 'patient')`
);

  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      age INTEGER,
      gender TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      specialization TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      doctor_id INTEGER,
      date TEXT,
      time TEXT
    )
  `);
});

module.exports = db;

