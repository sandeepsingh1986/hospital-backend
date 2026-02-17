require('dotenv').config();
const { Pool } = require('pg');
const { google } = require('googleapis');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = '1L2sFqDwfjh3-QPEANF6jTu9DKdEpqyvWAorVSLcMOZM';

async function writeSheet(tabName, headers, rows) {
  const sheets = google.sheets({ version: 'v4', auth });

  const values = [
    headers,
    ...rows.map(row => headers.map(h => row[h] ?? ''))
  ];

  // Clear sheet first
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: tabName,
  });

  // Write fresh data
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values }
  });

  console.log(`✅ ${tabName} synced TO Sheets`);
}

async function syncTable(tabName, query, headers) {
  const result = await pool.query(query);
  const rows = result.rows;
  await writeSheet(tabName, headers, rows);
}



async function syncAll() {
  try {
    await syncTable(
      'Doctors',
      'SELECT id, name, specialization FROM doctors',
      ['id', 'name', 'specialization']
    );

    await syncTable(
      'Patients',
      'SELECT id, name, age, gender FROM patients',
      ['id', 'name', 'age', 'gender']
    );

    await syncTable(
      'Appointments',
      'SELECT id, patient_id, doctor_id, date, time FROM appointments',
      ['id', 'patient_id', 'doctor_id', 'date', 'time']
    );

    await syncTable(
      'Users',
      'SELECT id, email, password, role FROM users',
      ['id', 'email', 'password', 'role']
    );

    console.log('🎉 ALL tables synced TO Sheets');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  }
}

syncAll();
