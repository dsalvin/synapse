const { WebSocketServer } = require('ws');
const { URLSearchParams } = require('url');
const { db } = require('@synapse/firebase-admin');

const wss = new WebSocketServer({ port: 8080 });
const boards = new Map();
const boardPresence = new Map();

console.log("WebSocket server started on port 8080");

wss.on('connection', async (ws, req) => {
    try {
        const params = new URLSearchParams(req.url.slice(1));
        const boardId = params.get('boardId');
        const userId = params.get('userId');
        const name = params.get('name');
        const image = params.get('image');

        if (!boardId || !userId || !name || !image) {
            ws.terminate(); return;
        }

        ws.userId = userId;
        ws.boardId = boardId;

        if (!boardPresence.has(boardId)) { boardPresence.set(boardId, new Map()); }
        boardPresence.get(boardId).set(userId, { id: userId, name, image });
        if (!boards.has(boardId)) { boards.set(boardId, new Set()); }
        boards.get(boardId).add(ws);
        console.log(`Client ${userId} (${name}) joined board ${boardId}`);

        broadcastPresence(boardId);
        
        try {
            const shapesSnapshot = await db.collection('boards').doc(boardId).collection('shapes').get();
            if (!shapesSnapshot.empty) {
                const existingShapes = shapesSnapshot.docs.map(doc => doc.data());
                ws.send(JSON.stringify({ type: 'LOAD_BOARD', payload: existingShapes }));
            }
        } catch (error) { console.error(`Error loading board ${boardId}:`, error); }
        
        ws.on('message', async (rawMessage) => {
            try {
                const message = JSON.parse(rawMessage);
                const { type, payload } = message;
                
                const modifyingActions = ['OBJECT_ADD', 'OBJECT_UPDATE', 'OBJECT_DELETE'];
                if (modifyingActions.includes(type)) {
                    const boardDoc = await db.collection('boards').doc(ws.boardId).get();
                    if (boardDoc.exists) {
                        const userRole = boardDoc.data()?.memberRoles?.[ws.userId];
                        if (userRole !== 'owner' && userRole !== 'editor') {
                            console.log(`PERMISSION DENIED: User ${ws.userId} (viewer) attempted action ${type}.`);
                            return;
                        }
                    }
                }
                
                broadcast(boardId, message, ws);

                const shapesCollection = db.collection('boards').doc(boardId).collection('shapes');
                switch (type) {
                    case 'OBJECT_ADD':
                        if (Array.isArray(payload)) { const batch = db.batch(); payload.forEach(shape => batch.set(shapesCollection.doc(shape.id), shape)); await batch.commit(); }
                        break;
                    case 'OBJECT_UPDATE':
                        if (payload && payload.id) { const { id, ...dataToUpdate } = payload; await shapesCollection.doc(id).update(dataToUpdate); }
                        break;
                    case 'OBJECT_DELETE':
                        if (Array.isArray(payload)) { const batch = db.batch(); payload.forEach(shapeId => batch.delete(shapesCollection.doc(shapeId))); await batch.commit(); }
                        break;
                }
            } catch (error) { console.error('Failed to handle message or update Firestore:', error); }
        });

        ws.on('close', () => {
            if (boardPresence.has(boardId) && boardPresence.get(boardId).has(ws.userId)) {
                boardPresence.get(boardId).delete(ws.userId);
                broadcastPresence(boardId);
            }
            if (boards.has(boardId)) { boards.get(boardId).delete(ws); }
            console.log(`Client ${ws.userId} disconnected from board ${boardId}.`);
        });

    } catch (error) { console.error('Failed to establish connection:', error); ws.terminate(); }
});

function broadcast(boardId, message, senderWs) { if (!boardId || !boards.has(boardId)) return; const boardClients = boards.get(boardId); const messageString = JSON.stringify(message); boardClients.forEach((client) => { if (client.readyState === client.OPEN && client !== senderWs) { client.send(messageString); } }); }
function broadcastPresence(boardId) { if (!boards.has(boardId) || !boardPresence.has(boardId)) return; const clients = boards.get(boardId); const users = Array.from(boardPresence.get(boardId).values()); const presenceMessage = JSON.stringify({ type: 'PRESENCE_UPDATE', payload: { users } }); clients.forEach(client => { if (client.readyState === client.OPEN) { client.send(presenceMessage); } }); }