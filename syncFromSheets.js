const sqlite3 = require('sqlite3').verbose();
const { google } = require('googleapis');

const SPREADSHEET_ID = '1L2sFqDwfjh3-QPEANF6jTu9DKdEpqyvWAorVSLcMOZM';

const db = new sqlite3.Database('./hospital.db');

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});


async function syncUsers() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A2:C', // id, email, role
  });

  const rows = res.data.values || [];

  rows.forEach(([id, email, role]) => {
    db.run(
      `
      INSERT INTO users (id, email, role)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        role = excluded.role
      `,
      [id, email, role],
      err => {
        if (err) console.error('User sync error:', err.message);
      }
    );
  });

  console.log('✅ Users synced from Sheets');
}



async function syncDoctors() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Doctors!A2:C',
  });

  const rows = res.data.values || [];

  rows.forEach(([id, name, specialization]) => {
    db.run(
      `
      INSERT INTO doctors (id, name, specialization)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        specialization = excluded.specialization
      `,
      [id, name, specialization]
    );
  });

  console.log('✅ Doctors synced from Sheets');
}


async function syncPatients() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Patients!A2:D',
  });

  const rows = res.data.values || [];

  rows.forEach(([id, name, age, gender]) => {
    db.run(
      `
      INSERT INTO patients (id, name, age, gender)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        age = excluded.age,
        gender = excluded.gender
      `,
      [id, name, age, gender]
    );
  });

  console.log('✅ Patients synced from Sheets');
}


async function syncAppointments() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Appointments!A2:E',
  });

  const rows = res.data.values || [];

  rows.forEach(([id, patient_id, doctor_id, date, time]) => {
    db.run(
      `
      INSERT INTO appointments (id, patient_id, doctor_id, date, time)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        patient_id = excluded.patient_id,
        doctor_id = excluded.doctor_id,
        date = excluded.date,
        time = excluded.time
      `,
      [id, patient_id, doctor_id, date, time]
    );
  });

  console.log('✅ Appointments synced from Sheets');
}


async function syncAll() {
  await syncDoctors();
  await syncPatients();
  await syncAppointments();
  await syncUsers();
  console.log('🎉 Sheets → App sync complete');
}

syncAll();
