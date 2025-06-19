import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@synapse/firebase-admin';

// Helper function to delete a collection and its subcollections
async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        resolve(true);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}

// PATCH a specific board to rename it
export async function PATCH(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    const session = await auth();
    const boardId = params.boardId;

    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.length < 3) {
        return new NextResponse('Invalid board name', { status: 400 });
    }

    try {
        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
            return new NextResponse('Board not found', { status: 404 });
        }

        if (boardDoc.data()?.ownerId !== session.user.id) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        await boardRef.update({ name });

        return NextResponse.json({ id: boardId, name }, { status: 200 });

    } catch (error) {
        console.error(`Error updating board ${boardId}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// DELETE a specific board
export async function DELETE(
    req: Request,
    { params }: { params: { boardId: string } }
) {
    const session = await auth();
    const boardId = params.boardId;

    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!boardId) {
        return new NextResponse('Board ID is missing', { status: 400 });
    }

    try {
        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
            return new NextResponse('Board not found', { status: 404 });
        }

        const boardData = boardDoc.data();

        if (boardData?.ownerId !== session.user.id) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const shapesPath = `boards/${boardId}/shapes`;
        await deleteCollection(shapesPath, 50);

        await boardRef.delete();

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error(`Error deleting board ${boardId}:`, error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}