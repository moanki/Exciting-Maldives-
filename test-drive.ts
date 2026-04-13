
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function testDrive() {
  console.log('--- Google Drive Connection Test ---');
  
  const serviceAccountPath = path.join(process.cwd(), 'service_account.json');
  let credentials: any = null;

  if (fs.existsSync(serviceAccountPath)) {
    console.log('Found service_account.json');
    credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log('Found GOOGLE_SERVICE_ACCOUNT_JSON environment variable');
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else {
    console.error('Error: No service account credentials found.');
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient as any });

    console.log('Auth successful. Attempting to list files...');
    
    // Test listing files in a known folder if provided, or just general list
    const response = await drive.files.list({
      pageSize: 5,
      fields: 'files(id, name)',
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      console.log('Successfully listed files:');
      files.forEach(file => {
        console.log(`- ${file.name} (${file.id})`);
      });
      console.log('\n--- TEST PASSED ---');
    } else {
      console.log('No files found, but the API call was successful.');
      console.log('\n--- TEST PASSED ---');
    }
  } catch (error: any) {
    console.error('--- TEST FAILED ---');
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testDrive();
