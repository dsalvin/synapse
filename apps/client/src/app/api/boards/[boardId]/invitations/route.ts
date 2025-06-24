import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    const session = await auth();
    const userId = session?.user?.id;
    const boardId = params.boardId;

    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { email } = await req.json();
        if (!email) {
            return new NextResponse('Email is required', { status: 400 });
        }

        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();
        if (!boardDoc.exists || boardDoc.data()?.ownerId !== userId) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const usersRef = db.collection('users');
        const userQuery = await usersRef.where('email', '==', email).limit(1).get();

        if (userQuery.empty) {
            return new NextResponse('User with that email not found in this app. Please ensure they have signed in at least once.', { status: 404 });
        }

        const userToInviteDoc = userQuery.docs[0];
        // --- THIS IS THE FIX ---
        // The user's ID is the document ID, not a field within it.
        const userToInviteId = userToInviteDoc.id;

        await boardRef.update({
            memberIds: admin.firestore.FieldValue.arrayUnion(userToInviteId),
            [`memberRoles.${userToInviteId}`]: 'editor'
        });

        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.error("Error inviting user:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}