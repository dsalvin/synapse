const { WebSocketServer } = require('ws');
const { URLSearchParams } = require('url');
const { db } = require('@synapse/firebase-admin'); 

const wss = new WebSocketServer({ port: 8080 });
const boards = new Map();
const boardPresence = new Map(); // New: To track user details per board

console.log("WebSocket server started on port 8080");

wss.on('connection', async (ws, req) => {
    try {
        const params = new URLSearchParams(req.url.slice(1));
        const boardId = params.get('boardId');
        const userId = params.get('userId');
        const name = params.get('name');
        const image = params.get('image');

        if (!boardId || !userId || !name || !image) {
            console.error('Connection rejected: Missing required user or board info');
            ws.terminate();
            return;
        }

        ws.userId = userId;
        ws.boardId = boardId;

        // --- Presence Logic: Add user and broadcast update ---
        if (!boardPresence.has(boardId)) {
            boardPresence.set(boardId, new Map());
        }
        const currentUserDetails = { id: userId, name, image };
        boardPresence.get(boardId).set(userId, currentUserDetails);

        if (!boards.has(boardId)) {
            boards.set(boardId, new Set());
        }
        boards.get(boardId).add(ws);
        console.log(`Client ${userId} (${name}) joined board ${boardId}`);

        // Broadcast the updated presence list to everyone on the board
        broadcastPresence(boardId);
        
        // --- Firestore: Load existing shapes for the new user ---
        try {
            const shapesCollection = db.collection('boards').doc(boardId).collection('shapes');
            const snapshot = await shapesCollection.get();
            if (!snapshot.empty) {
                const existingShapes = snapshot.docs.map(doc => doc.data());
                ws.send(JSON.stringify({ type: 'LOAD_BOARD', payload: existingShapes }));
            }
        } catch (error) {
            console.error(`Error loading board ${boardId}:`, error);
        }
        
        ws.on('message', async (rawMessage) => {
            try {
                const message = JSON.parse(rawMessage);
                const { type, payload } = message;
                
                broadcast(boardId, message, ws);

                const shapesCollection = db.collection('boards').doc(boardId).collection('shapes');
                switch (type) {
                    case 'OBJECT_ADD':
                        if (Array.isArray(payload)) {
                            const batch = db.batch();
                            payload.forEach(shape => {
                                const docRef = shapesCollection.doc(shape.id);
                                batch.set(docRef, shape);
                            });
                            await batch.commit();
                        }
                        break;
                    case 'OBJECT_UPDATE':
                        if (payload && payload.id) {
                            const { id, ...dataToUpdate } = payload;
                            await shapesCollection.doc(id).update(dataToUpdate);
                        }
                        break;
                }
            } catch (error) {
                console.error('Failed to handle message or update Firestore:', error);
            }
        });

        ws.on('close', () => {
            // --- Presence Logic: Remove user and broadcast update ---
            if (boardPresence.has(boardId) && boardPresence.get(boardId).has(ws.userId)) {
                boardPresence.get(boardId).delete(ws.userId);
                broadcastPresence(boardId);
            }

            if (boards.has(boardId)) {
                boards.get(boardId).delete(ws);
                console.log(`Client ${ws.userId} disconnected from board ${boardId}.`);
            }
        });

    } catch (error) {
        console.error('Failed to establish connection:', error);
        ws.terminate();
    }
});

function broadcast(boardId, message, senderWs) {
    if (!boardId || !boards.has(boardId)) return;
    const boardClients = boards.get(boardId);
    const messageString = JSON.stringify(message);

    boardClients.forEach((client) => {
        if (client.readyState === client.OPEN && client !== senderWs) {
            client.send(messageString);
        }
    });
}

// New function to broadcast presence updates to all clients on a board
function broadcastPresence(boardId) {
    if (!boards.has(boardId) || !boardPresence.has(boardId)) return;

    const clients = boards.get(boardId);
    const users = Array.from(boardPresence.get(boardId).values());
    const presenceMessage = JSON.stringify({
        type: 'PRESENCE_UPDATE',
        payload: { users }
    });

    clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(presenceMessage);
        }
    });
}