const authJwt = require('./middleware/authJwt');
require('dotenv').config();


const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


const express = require('express');
const path = require('path');   // ✅ ADD THIS LINE
const session = require('express-session');


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
app.get('/api/mobile/patients', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM patients");
    res.json({ success: true, patients: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.post('/api/mobile/patients', async (req, res) => {
  const { name, age, gender } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO patients (name, age, gender) VALUES ($1, $2, $3) RETURNING id",
      [name, age, gender]
    );

    res.json({ success: true, id: result.rows[0].id });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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


app.get('/api/test', (req, res) => {
  res.json({
    status: "OK",
    message: "Backend connected successfully"
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // TEMP test credentials
  if (email === "admin@test.com" && password === "123456") {
    return res.json({
      success: true,
      message: "Login successful"
    });
  }

  res.status(401).json({
    success: false,
    message: "Invalid email or password"
  });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




pool.connect()
  .then(() => console.log("✅ Connected to Railway DB"))
  .catch(err => console.error("❌ DB Connection Error:", err));

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Exists" : "Missing");


pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB connection error:", err);
  } else {
    console.log("DB connected:", res.rows[0]);
  }
});
