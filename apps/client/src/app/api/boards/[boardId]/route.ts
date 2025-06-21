import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@synapse/firebase-admin';
import { BoardRole } from '@/types/board.d';
import * as admin from 'firebase-admin';

// GET a single board by its ID
export async function GET(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    const session = await auth();
    const userId = session?.user?.id;
    const boardId = params.boardId;

    if (!userId) { return new NextResponse('Unauthorized', { status: 401 }); }
    if (!boardId) { return new NextResponse('Board ID is missing', { status: 400 }); }

    try {
        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();
        if (!boardDoc.exists) { return new NextResponse('Board not found', { status: 404 }); }
        
        const boardData = boardDoc.data();
        if (!boardData?.memberIds?.includes(userId)) { return new NextResponse('Forbidden', { status: 403 }); }

        return NextResponse.json(boardData, { status: 200 });
    } catch (error) {
        console.error(`Error fetching board ${boardId}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// PATCH a specific board to rename it or update a member's role
export async function PATCH(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    const session = await auth();
    const userId = session?.user?.id;
    const boardId = params.boardId;

    if (!userId) { return new NextResponse('Unauthorized', { status: 401 }); }

    try {
        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();
        if (!boardDoc.exists) { return new NextResponse('Board not found', { status: 404 }); }

        const boardData = boardDoc.data();
        if (boardData?.ownerId !== userId) {
            return new NextResponse('Forbidden: Only the owner can modify board settings', { status: 403 });
        }
        
        const { name, memberToUpdate } = await req.json();

        if (name) {
            if (typeof name !== 'string' || name.length < 3) { return new NextResponse('Invalid board name', { status: 400 }); }
            await boardRef.update({ name });
            return NextResponse.json({ id: boardId, name }, { status: 200 });
        }

        if (memberToUpdate && memberToUpdate.userId && memberToUpdate.role) {
            const { userId: memberId, role }: { userId: string, role: BoardRole } = memberToUpdate;
            if(boardData?.ownerId === memberId) { return new NextResponse("Cannot change the owner's role", { status: 400 }); }
            await boardRef.update({ [`memberRoles.${memberId}`]: role });
            const updatedDoc = await boardRef.get();
            return NextResponse.json(updatedDoc.data(), { status: 200 });
        }

        return new NextResponse('Invalid request body', { status: 400 });
    } catch (error) {
        console.error(`Error updating board ${boardId}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Helper function to delete a collection recursively
async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);
    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}
async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();
    if (snapshot.size === 0) { resolve(true); return; }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => { batch.delete(doc.ref); });
    await batch.commit();
    process.nextTick(() => { deleteQueryBatch(query, resolve); });
}

// DELETE a specific board
export async function DELETE(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    const session = await auth();
    const userId = session?.user?.id;
    const boardId = params.boardId;

    if (!userId) { return new NextResponse('Unauthorized', { status: 401 }); }
    if (!boardId) { return new NextResponse('Board ID is missing', { status: 400 }); }

    try {
        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();
        if (!boardDoc.exists) { return new NextResponse('Board not found', { status: 404 }); }

        const boardData = boardDoc.data();
        if (boardData?.ownerId !== userId) { return new NextResponse('Forbidden', { status: 403 }); }

        const shapesPath = `boards/${boardId}/shapes`;
        await deleteCollection(shapesPath, 50);
        await boardRef.delete();
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error(`Error deleting board ${boardId}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}