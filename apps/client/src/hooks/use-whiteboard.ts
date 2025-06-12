import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

// --- UPDATED: Hook now accepts two callbacks ---
export function useWhiteboard(boardId: string, onObjectsAdd: (obj: any[]) => void, onObjectUpdate: (obj: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number }>>({});
  const [presence, setPresence] = useState({});

  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL!);
    ws.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      socket.send(JSON.stringify({ type: 'JOIN_BOARD', payload: { boardId } }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'CURSOR_MOVE':
          setCursors(prev => ({ ...prev, [message.payload.userId]: message.payload.pos }));
          break;
        case 'USER_LEAVE':
          setCursors(prev => {
              const newCursors = { ...prev };
              delete newCursors[message.payload.userId];
              return newCursors;
          });
          break;
        case 'OBJECT_ADD':
          onObjectsAdd(message.payload); // Expecting an array
          break;
        // --- NEW: Case for handling updates ---
        case 'OBJECT_UPDATE':
          onObjectUpdate(message.payload);
          break;
      }
    };

    return () => socket.close(1000, "Component unmounting");
  }, [boardId, onObjectsAdd, onObjectUpdate]);

  const sendCursorPosition = useDebouncedCallback((pos: {x: number, y: number}) => {
     if (pos && ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'CURSOR_MOVE', payload: { pos } }));
     }
  }, 50);

  const sendObject = (obj: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(obj));
    }
  };

  return { cursors, sendCursorPosition, sendObject, presence };
}