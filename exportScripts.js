const fs = require('fs').promises;
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load service account from environment variable
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (err) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", err);
  process.exit(1);
}

// Initialize Firebase Admin SDK
try {
  initializeApp({ credential: cert(serviceAccount) });
} catch (err) {
  console.error("Failed to initialize Firebase Admin SDK:", err);
  process.exit(1);
}

const db = getFirestore();
const scriptsFolder = path.join(__dirname, 'public', 'scripts');

// Ensure folder exists
async function ensureFolder(folder) {
  try {
    await fs.mkdir(folder, { recursive: true });
  } catch (err) {
    console.error(`Failed to create folder ${folder}:`, err);
    process.exit(1);
  }
}

async function exportScripts() {
  await ensureFolder(scriptsFolder);

  try {
    const snapshot = await db.collection('scripts').get();
    if (snapshot.empty) return;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const code = (data.code || '').trim();
      if (!code) continue; // Skip empty code

      const filename = `${doc.id}.lua`;
      const filepath = path.join(scriptsFolder, filename);

      // Write the file (overwrite if exists)
      await fs.writeFile(filepath, code, 'utf8');
    }

    console.log("Export complete!");
  } catch (err) {
    console.error("Error exporting scripts:", err);
    process.exit(1);
  }
}

// Run the export
exportScripts();
