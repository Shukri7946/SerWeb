const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (err) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", err);
  process.exit(1);
}

try {
  initializeApp({ credential: cert(serviceAccount) });
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
      console.log("No scripts found in Firestore. Nothing to export.");
      process.exit(0);
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const filename = `${doc.id}.lua`;
      const filepath = path.join(scriptsFolder, filename);

      const oldContent = fs.existsSync(filepath) ? fs.readFileSync(filepath, 'utf8') : '';
      if (oldContent !== (data.code || '')) {
        fs.writeFileSync(filepath, data.code || '', 'utf8');
        console.log(`Updated: ${filename}`);
      } else {
        console.log(`No changes: ${filename}`);
      }
    });

    console.log('All scripts exported!');
  } catch (err) {
    console.error("Error exporting scripts:", err);
    process.exit(1);
  }
}

// Only run once in GitHub Actions
exportScripts();
