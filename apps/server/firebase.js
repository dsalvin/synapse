const admin = require('firebase-admin');

// This logic also now ONLY reads from the environment variable.
// You will need to make this variable available to the server process.
try {
  // We check for the variable directly. If it's missing, we throw an error.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not found.');
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ WebSocket Server: Firebase Admin SDK initialized.");
  }
} catch (error) {
    if (error.code !== 'auth/credential-already-exists') {
        console.error("❌ WebSocket Server: Error initializing Firebase Admin SDK:", error);
        process.exit(1); 
    }
}

const db = admin.firestore();
module.exports = { db };