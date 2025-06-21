import { NextResponse } from 'next/server';
import { db } from '@synapse/firebase-admin';

export async function POST(req: Request) {
    try {
        const { userIds }: { userIds: string[] } = await req.json();

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json([]);
        }

        const usersRef = db.collection('users');
        
        // Correctly fetch multiple documents by their known IDs
        const userPromises = userIds.map(id => usersRef.doc(id).get());
        const userDocs = await Promise.all(userPromises);

        const users = userDocs.map(doc => {
            if (!doc.exists) {
                // If a user document somehow isn't found, we have a fallback.
                // The ID is taken from the document reference itself.
                return { id: doc.id, name: 'Unknown User', image: null, email: null };
            }
            const data = doc.data();
            // --- THIS IS THE FIX ---
            // We get the ID from `doc.id`, not from inside the data.
            return {
                id: doc.id,
                name: data?.name,
                image: data?.image,
                email: data?.email
            };
        });

        return NextResponse.json(users);

    } catch (error) {
        console.error("Error fetching users:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}