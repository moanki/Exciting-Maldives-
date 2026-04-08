const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const keys = require('./service_account.json');

async function test() {
  const client = new JWT(keys.client_email, null, keys.private_key, ['https://www.googleapis.com/auth/drive.readonly']);
  const drive = google.drive({ version: 'v3', auth: client });
  try {
    const res = await drive.files.list({ q: "'root' in parents" });
    console.log(res.data);
  } catch (e) {
    console.error(e);
  }
}
test();
