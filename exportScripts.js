const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load service account from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const scriptsFolder = path.join(__dirname, 'public', 'scripts');
if (!fs.existsSync(scriptsFolder)) fs.mkdirSync(scriptsFolder, { recursive: true });

async function exportScripts() {
  const snapshot = await db.collection('scripts').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const filename = `${doc.id}.lua`;
    const filepath = path.join(scriptsFolder, filename);
    fs.writeFileSync(filepath, data.code || '', 'utf8');
    console.log(`Saved: ${filename}`);
  });
  console.log('All scripts exported!');
}

exportScripts().catch(console.error);
