import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

async function testFileAccess() {
  try {
    const serviceAccountPath = path.join(process.cwd(), "service_account.json");
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient as any });

    const fileId = '1waXqp2hMR_omNUfFRmbnlFwF98fqYZ7L'; // This is a folder ID, let's see if we can get it
    console.log("Testing access to:", fileId);
    
    const response = await drive.files.get({
      fileId,
      fields: "id,name,mimeType",
      supportsAllDrives: true,
    });
    console.log("Access success:", response.data.name);
  } catch (err: any) {
    console.error("Access failed:", err.message);
    if (err.response) {
      console.error("Response data:", JSON.stringify(err.response.data, null, 2));
    }
  }
}

testFileAccess();
