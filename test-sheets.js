const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function test() {
  const client = await auth.getClient();
  console.log('Google Sheets connected successfully ✅');
}

test();

