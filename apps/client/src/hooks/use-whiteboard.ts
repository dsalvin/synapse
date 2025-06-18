import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { User } from 'next-auth';

// Define a type for the presence payload
type PresencePayload = {
  users: { id: string; name: string; image: string; }[];
};

export function useWhiteboard(
  boardId: string,
  user: User | undefined,
  onBoardLoad: (shapes: any[]) => void,
  onObjectsAdd: (obj: any[]) => void,
  onObjectUpdate: (obj: any) => void,
  onPresenceUpdate: (payload: PresencePayload) => void
) {
  const ws = useRef<WebSocket | null>(null);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number }>>({});
  
  useEffect(() => {
    // --- START: DEBUGGING LOGIC ---
    console.log("useWhiteboard hook triggered. Checking user object...");
    console.log("User object received:", user);
    
    // This guard clause is the most likely point of failure.
    if (!user || !user.id || !user.name || !user.image) {
      console.error("❌ WebSocket connection aborted. User object is missing required properties.", {
        hasUser: !!user,
        hasId: !!user?.id,
        hasName: !!user?.name,
        hasImage: !!user?.image,
      });
      return; // Abort connection
    }
    console.log("✅ User object is valid. Proceeding to connect to WebSocket.");
    // --- END: DEBUGGING LOGIC ---

    const name = encodeURIComponent(user.name);
    const image = encodeURIComponent(user.image);
    
    const socketUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL!}?boardId=${boardId}&userId=${user.id}&name=${name}&image=${image}`;
    const socket = new WebSocket(socketUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket connected successfully!');
    };

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
      }
    };

    socket.onclose = () => {
        console.log('❌ WebSocket disconnected');
    }

    socket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
    }

    return () => {
        if (socket.readyState === 1) {
            socket.close(1000, "Component unmounting");
        }
    }
  }, [boardId, user, onBoardLoad, onObjectsAdd, onObjectUpdate, onPresenceUpdate]);

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