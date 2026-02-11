const Database = require('better-sqlite3');
const db = new Database('hospital.db');

const { google } = require('googleapis');

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

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values }
  });

  console.log(`✅ ${tabName} synced TO Sheets`);
}

async function syncTable(tabName, query, headers) {
  const rows = db.prepare(query).all();
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
      'SELECT id, email, role FROM users',
      ['id', 'email', 'role']
    );

    console.log('🎉 ALL tables synced TO Sheets');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  }
}

syncAll();
