const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load service account from environment variable
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (err) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", err);
  process.exit(1); // Stop the script if the secret is invalid
}

try {
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (err) {
  console.error("Failed to initialize Firebase Admin SDK:", err);
  process.exit(1);
}

const db = getFirestore();

const scriptsFolder = path.join(__dirname, 'public', 'scripts');
if (!fs.existsSync(scriptsFolder)) fs.mkdirSync(scriptsFolder, { recursive: true });

async function exportScripts() {
  try {
    const snapshot = await db.collection('scripts').get();
    if (snapshot.empty) {
      console.log("No scripts found in Firestore.");
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const filename = `${doc.id}.lua`;
      const filepath = path.join(scriptsFolder, filename);
      fs.writeFileSync(filepath, data.code || '', 'utf8');
      console.log(`Saved: ${filename}`);
    });

    console.log('All scripts exported!');
  } catch (err) {
    console.error("Error exporting scripts:", err);
    process.exit(1); // Fail the workflow if exporting fails
  }
}

exportScripts();
