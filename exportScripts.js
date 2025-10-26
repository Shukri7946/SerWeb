const fs = require('fs').promises;
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Parse Firebase service account from environment
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
        console.log(`Folder ensured: ${folder}`);
    } catch (err) {
        console.error(`Failed to create folder ${folder}:`, err);
        process.exit(1);
    }
}

// Export all scripts from Firestore
async function exportScripts() {
    await ensureFolder(scriptsFolder);

    try {
        const snapshot = await db.collection('scripts').get();

        if (snapshot.empty) {
            console.log("No scripts found in Firestore.");
            return;
        }

        const writePromises = snapshot.docs.map(async doc => {
            const data = doc.data();
            const code = (data.code || '').trim();

            console.log(`Processing document: ${doc.id}`);

            if (!code) {
                console.log(`Skipping ${doc.id} because code is empty`);
                return;
            }

            const filename = `${doc.id}.lua`;
            const filepath = path.join(scriptsFolder, filename);

            try {
                await fs.writeFile(filepath, code, 'utf8');
                console.log(`Wrote file: ${filename}`);
            } catch (err) {
                console.error(`Failed to write file ${filename}:`, err);
            }
        });

        await Promise.all(writePromises);
        console.log("All scripts exported successfully!");
    } catch (err) {
        console.error("Error exporting scripts:", err);
        process.exit(1);
    }
}

exportScripts();
