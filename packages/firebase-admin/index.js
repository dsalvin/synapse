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

async function getBoardsForUser(userId) {
  if (!userId) {
      return [];
  }
  try {
      const boardsCollection = db.collection('boards');
      const query = boardsCollection.where('memberIds', 'array-contains', userId).orderBy('createdAt', 'desc');
      const querySnapshot = await query.get();
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

module.exports = { db, getBoardsForUser };