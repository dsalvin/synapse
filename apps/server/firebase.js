const admin = require('firebase-admin');

// This will look for the serviceAccountKey.json file in the same directory.
const serviceAccount = require('./serviceAccountKey.json');

// Initialize the Firebase Admin SDK, but only if it hasn't been initialized already.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error);
    // Exit the process if Firebase fails to initialize, as it's a critical dependency.
    process.exit(1); 
  }
}

const db = admin.firestore();

module.exports = { db };