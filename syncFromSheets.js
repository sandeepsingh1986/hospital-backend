const Database = require('better-sqlite3');
const db = new Database('hospital.db');

const { google } = require('googleapis');

const SPREADSHEET_ID = '1L2sFqDwfjh3-QPEANF6jTu9DKdEpqyvWAorVSLcMOZM';

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

/* ---------- USERS ---------- */
async function syncUsers() {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A2:C',
  });

  const rows = res.data.values || [];

  const stmt = db.prepare(`
    INSERT INTO users (id, email, role)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      role = excluded.role
  `);

  const trx = db.transaction(data => {
    for (const [id, email, role] of data) {
      stmt.run(id, email, role);
    }
  });

  trx(rows);
  console.log('✅ Users synced from Sheets');
}

/* ---------- DOCTORS ---------- */
async function syncDoctors() {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Doctors!A2:C',
  });

  const rows = res.data.values || [];

  const stmt = db.prepare(`
    INSERT INTO doctors (id, name, specialization)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      specialization = excluded.specialization
  `);

  const trx = db.transaction(data => {
    for (const [id, name, specialization] of data) {
      stmt.run(id, name, specialization);
    }
  });

  trx(rows);
  console.log('✅ Doctors synced from Sheets');
}

/* ---------- PATIENTS ---------- */
async function syncPatients() {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Patients!A2:D',
  });

  const rows = res.data.values || [];

  const stmt = db.prepare(`
    INSERT INTO patients (id, name, age, gender)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      age = excluded.age,
      gender = excluded.gender
  `);

  const trx = db.transaction(data => {
    for (const [id, name, age, gender] of data) {
      stmt.run(id, name, age, gender);
    }
  });

  trx(rows);
  console.log('✅ Patients synced from Sheets');
}

/* ---------- APPOINTMENTS ---------- */
async function syncAppointments() {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Appointments!A2:E',
  });

  const rows = res.data.values || [];

  const stmt = db.prepare(`
    INSERT INTO appointments (id, patient_id, doctor_id, date, time)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      patient_id = excluded.patient_id,
      doctor_id = excluded.doctor_id,
      date = excluded.date,
      time = excluded.time
  `);

  const trx = db.transaction(data => {
    for (const [id, patient_id, doctor_id, date, time] of data) {
      stmt.run(id, patient_id, doctor_id, date, time);
    }
  });

  trx(rows);
  console.log('✅ Appointments synced from Sheets');
}

/* ---------- RUN ALL ---------- */
async function syncAll() {
  try {
    await syncDoctors();
    await syncPatients();
    await syncAppointments();
    await syncUsers();
    console.log('🎉 Sheets → App sync complete');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  }
}

syncAll();
