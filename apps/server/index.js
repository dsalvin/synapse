const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocketServer({ port: 8080 });
const boards = new Map();

console.log("WebSocket server started on port 8080");

wss.on('connection', (ws) => {
    let currentBoardId = null;
    const userId = uuidv4();
    ws.userId = userId; // Attach userId to the ws connection object

    ws.on('message', (rawMessage) => {
        try {
            const message = JSON.parse(rawMessage);
            const { type, payload } = message;

            switch (type) {
                case 'JOIN_BOARD':
                    currentBoardId = payload.boardId;
                    if (!boards.has(currentBoardId)) {
                        boards.set(currentBoardId, new Set());
                    }
                    boards.get(currentBoardId).add(ws);
                    console.log(`Client ${userId} joined board ${currentBoardId}`);
                    broadcast(currentBoardId, { type: 'USER_ENTER', payload: { userId } }, ws);
                    break;

                case 'CURSOR_MOVE':
                    // Add userId to the payload before broadcasting
                    broadcast(currentBoardId, { type, payload: { userId, pos: payload.pos } }, ws);
                    break;

                // This is the new case for broadcasting shapes!
                case 'OBJECT_ADD':
                    broadcast(currentBoardId, message, ws);
                    break;

                case 'OBJECT_UPDATE':
                    broadcast(currentBoardId, message, ws);
                    break;
            }
        } catch (error) {
            console.error('Failed to handle message:', error);
        }
    });

    ws.on('close', () => {
        if (currentBoardId && boards.has(currentBoardId)) {
            boards.get(currentBoardId).delete(ws);
            broadcast(currentBoardId, { type: 'USER_LEAVE', payload: { userId: ws.userId } });
            console.log(`Client ${ws.userId} disconnected.`);
        }
    });
});

function broadcast(boardId, message, senderWs) {
    if (!boardId || !boards.has(boardId)) return;

    const boardClients = boards.get(boardId);
    const messageString = JSON.stringify(message);

    boardClients.forEach((client) => {
        if (client !== senderWs && client.readyState === client.OPEN) {
            client.send(messageString);
        }
    });
}