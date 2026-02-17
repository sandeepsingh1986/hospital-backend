require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// ---------------- DATABASE ----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ DB Connection Error:", err));


// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.static(path.join(__dirname, 'public')));

// ---------------- BASIC ROUTES ----------------
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

// ----- code sql -----------
app.get('/create-admin', async (req, res) => {
  await pool.query(`
    INSERT INTO users (name, email, password, role)
    VALUES ('Admin', 'admin@test.com', '123456', 'admin')
  `);
  res.send("Admin created");
});



// ---------------- WEB LOGIN ----------------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND password=$2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).send('Invalid credentials');
    }

    const user = result.rows[0];

    req.session.user = {
      id: user.id,
      role: user.role
    };

    res.redirect('/dashboard');

  } catch (err) {
    res.status(500).send('Database error');
  }
});

// ---------------- MOBILE LOGIN ----------------
app.post('/api/mobile/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND password=$2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- PATIENTS ----------------
app.get('/api/mobile/patients', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM patients ORDER BY id DESC");
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
app.get('/api/mobile/doctors', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM doctors ORDER BY id DESC");
    res.json({ success: true, doctors: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/mobile/doctors', async (req, res) => {
  const { name, specialization } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO doctors (name, specialization) VALUES ($1, $2) RETURNING id",
      [name, specialization]
    );

    res.json({ success: true, id: result.rows[0].id });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- APPOINTMENTS ----------------
app.get('/api/mobile/appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id,
             p.name AS patient,
             d.name AS doctor,
             a.date,
             a.time
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.date DESC, a.time DESC
    `);

    res.json({ success: true, appointments: result.rows });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/mobile/appointments', async (req, res) => {
  const { patient_id, doctor_id, date, time } = req.body;

  if (!patient_id || !doctor_id || !date || !time) {
    return res.status(400).json({
      success: false,
      message: 'Missing fields'
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO appointments (patient_id, doctor_id, date, time) VALUES ($1, $2, $3, $4) RETURNING id",
      [patient_id, doctor_id, date, time]
    );

    res.json({ success: true, id: result.rows[0].id });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- TEST ROUTE ----------------
app.get('/api/test', (req, res) => {
  res.json({
    status: "OK",
    message: "Backend connected successfully"
  });
});

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
