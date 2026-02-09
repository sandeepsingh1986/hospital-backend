const authJwt = require('./middleware/authJwt');
require('dotenv').config();

const express = require('express');
const path = require('path');   // ✅ ADD THIS LINE
const session = require('express-session');
const db = require('./database');

const app = express();



const cors = require('cors'); // allow Flutter to call API

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));


app.use(cors()); // important for mobile app

// ✅ SESSION MIDDLEWARE — MUST BE HERE
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  })
);

// static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('Backend is live 🚀');
});



app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE email=? AND password=?`,
    [email, password],
    (err, user) => {
      if (!user) return res.status(401).send('Invalid credentials');

      req.session.user = {
        id: user.id,
        role: user.role
      };

      res.redirect('/dashboard');
    }
  );
});

// ---------------- LOGIN ----------------
app.post('/api/mobile/login', (req, res) => {
  const { email, password } = req.body;
  db.get(
    `SELECT * FROM users WHERE email=? AND password=?`,
    [email, password],
    (err, user) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      res.json({
        success: true,
        user: { id: user.id, name: user.name, role: user.role }
      });
    }
  );
});

// ---------------- PATIENTS ----------------
app.get('/api/mobile/patients', (req, res) => {
  db.all(`SELECT * FROM patients`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err });
    res.json({ success: true, patients: rows });
  });
});

app.post('/api/mobile/patients', (req, res) => {
  const { name, age, gender } = req.body;
  db.run(`INSERT INTO patients (name, age, gender) VALUES (?, ?, ?)`,
    [name, age, gender],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ---------------- DOCTORS ----------------
app.get('/api/mobile/doctors', (req, res) => {
  db.all(`SELECT * FROM doctors`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err });
    res.json({ success: true, doctors: rows });
  });
});

app.post('/api/mobile/doctors', (req, res) => {
  const { name, specialization } = req.body;
  db.run(`INSERT INTO doctors (name, specialization) VALUES (?, ?)`,
    [name, specialization],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// ---------------- APPOINTMENTS ----------------
app.get('/api/mobile/appointments', (req, res) => {
  db.all(`
    SELECT a.id, p.name AS patient, d.name AS doctor, a.date, a.time
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.date DESC, a.time DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err });
    res.json({ success: true, appointments: rows });
  });
});

app.post('/api/mobile/appointments', (req, res) => {
  const { patient_id, doctor_id, date, time } = req.body;
  if (!patient_id || !doctor_id || !date || !time)
    return res.status(400).json({ success: false, message: 'Missing fields' });

  db.run(`INSERT INTO appointments (patient_id, doctor_id, date, time) VALUES (?, ?, ?, ?)`,
    [patient_id, doctor_id, date, time],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: err });
      res.json({ success: true, id: this.lastID });
    }
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

