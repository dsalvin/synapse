import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@synapse/firebase-admin';
import * as admin from 'firebase-admin';

// GET all boards where the user is a member
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const boardsCollection = db.collection('boards');
        const querySnapshot = await boardsCollection.where('members', 'array-contains', session.user.id).orderBy('createdAt', 'desc').get();

        if (querySnapshot.empty) {
            return NextResponse.json([], { status: 200 });
        }

        const boards = querySnapshot.docs.map(doc => doc.data());
        return NextResponse.json(boards, { status: 200 });

    } catch (error) {
        console.error("Error fetching boards:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}


// POST to find a board, or create it and add the user as the first member
export async function POST(req: Request) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.length < 3) {
        return new NextResponse('Invalid board name', { status: 400 });
    }

    try {
        const boardsCollection = db.collection('boards');
        const existingBoardQuery = await boardsCollection.where('name', '==', name).limit(1).get();

        if (!existingBoardQuery.empty) {
            const boardDoc = existingBoardQuery.docs[0];
            const boardData = boardDoc.data();
            
            if (!boardData.members.includes(userId)) {
                await boardDoc.ref.update({
                    members: admin.firestore.FieldValue.arrayUnion(userId)
                });
            }
            
            // Re-fetch the data to ensure the returned object is up-to-date
            const updatedDoc = await boardDoc.ref.get();
            return NextResponse.json(updatedDoc.data(), { status: 200 });
        }
        
        const newBoardRef = boardsCollection.doc();
        const boardId = newBoardRef.id;
        const boardData = {
            id: boardId,
            name: name,
            ownerId: userId,
            createdAt: new Date().toISOString(),
            members: [userId]
        };

        await newBoardRef.set(boardData);
        return NextResponse.json(boardData, { status: 201 });

    } catch (error) {
        console.error("Error in find-or-create board logic:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}