import * as admin from 'firebase-admin';

// This logic now ONLY reads from the environment variable, which is more robust.
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Client API Routes: Firebase Admin SDK initialized.");
  }
} catch(error) {
  if (error.code !== 'auth/credential-already-exists') {
    console.error("❌ Client API Routes: Error initializing Firebase Admin SDK. Is FIREBASE_SERVICE_ACCOUNT set in your .env.local?", error.message);
  }
}

export const db = admin.firestore();

export async function getBoardsForUser(userId) {
    if (!userId) { return []; }
    try {
        const boardsCollection = db.collection('boards');
        const query = boardsCollection.where('memberIds', 'array-contains', userId).orderBy('createdAt', 'desc');
        const querySnapshot = await query.get();
        if (querySnapshot.empty) { return []; }
        return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error("Error fetching boards for user:", error);
        return [];
    }
}