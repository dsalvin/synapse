import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { User } from 'next-auth';
import type { Shape, PresenceUser } from '@/types/board.d';

export function useWhiteboard(
  boardId: string,
  user: User | undefined,
  onBoardLoad: (shapes: Shape[]) => void,
  onObjectsAdd: (obj: Shape[]) => void,
  onObjectUpdate: (obj: Partial<Shape> & { id: string }) => void,
  onObjectsDelete: (ids: string[]) => void,
  onPresenceUpdate: (payload: { users: PresenceUser[] }) => void
) {
  const ws = useRef<WebSocket | null>(null);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number }>>({});
  
  useEffect(() => {
    if (!user || !user.id || !user.name || !user.image) return;

    const name = encodeURIComponent(user.name);
    const image = encodeURIComponent(user.image);
    
    const socketUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL!}?boardId=${boardId}&userId=${user.id}&name=${name}&image=${image}`;
    const socket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = () => console.log('✅ WebSocket connected');

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'LOAD_BOARD':
          onBoardLoad(message.payload);
          break;
        case 'PRESENCE_UPDATE':
          onPresenceUpdate(message.payload);
          break;
        case 'CURSOR_MOVE':
          setCursors(prev => ({ ...prev, [message.payload.userId]: message.payload.pos }));
          break;
        case 'OBJECT_ADD':
          onObjectsAdd(message.payload);
          break;
        case 'OBJECT_UPDATE':
          onObjectUpdate(message.payload);
          break;
        case 'OBJECT_DELETE':
          onObjectsDelete(message.payload);
          break;
      }
    };

    socket.onclose = () => console.log('❌ WebSocket disconnected');
    socket.onerror = (error) => console.error('WebSocket error:', error);

    return () => { if (socket.readyState === 1) socket.close(1000, "Component unmounting"); }
  }, [boardId, user, onBoardLoad, onObjectsAdd, onObjectUpdate, onObjectsDelete, onPresenceUpdate]);

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

  return { cursors, sendCursorPosition, sendObject };
}