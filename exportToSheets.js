const sqlite3 = require('sqlite3').verbose();
const { google } = require('googleapis');

const SPREADSHEET_ID = '1L2sFqDwfjh3-QPEANF6jTu9DKdEpqyvWAorVSLcMOZM';

const db = new sqlite3.Database('./hospital.db');

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function exportTable(tableName, sheetName) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  db.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
    if (err) {
      console.error(`DB error (${tableName})`, err);
      return;
    }

    if (rows.length === 0) {
      console.log(`${tableName} is empty`);
      return;
    }

    const headers = Object.keys(rows[0]);
    const values = [
      headers,
      ...rows.map(row => headers.map(h => row[h]))
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    console.log(`✅ ${tableName} exported to ${sheetName}`);
  });
}

async function run() {
  await exportTable('users', 'Users');
  await exportTable('patients', 'Patients');
  await exportTable('doctors', 'Doctors');
  await exportTable('appointments', 'Appointments');
}

run();

