const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Shared Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error);
    process.exit(1); 
  }
}

const db = admin.firestore();

// CORRECTED FUNCTION
async function getBoardsForUser(userId) {
    if (!userId) {
        return [];
    }

    try {
        const boardsCollection = db.collection('boards');
        
        // This is the correct query that finds all boards where the user is a member
        const querySnapshot = await boardsCollection
            .where('members', 'array-contains', userId)
            .orderBy('createdAt', 'desc')
            .get();

        if (querySnapshot.empty) {
            return [];
        }

        const boards = querySnapshot.docs.map(doc => doc.data());
        return boards;

    } catch (error) {
        console.error("Error fetching boards for user:", error);
        return [];
    }
}

module.exports = { db, getBoardsForUser }; // Export the correctly named function