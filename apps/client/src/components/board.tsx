"use client";

import dynamic from 'next/dynamic';
import { SessionProvider } from 'next-auth/react';
import { Loader } from 'lucide-react';

// Dynamically import the Whiteboard component with SSR turned off
const Whiteboard = dynamic(() => import('@/components/whiteboard'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin" />
      <p className="ml-2 text-lg">Loading Whiteboard...</p>
    </div>
  ),
});

// This component provides the session context required by our hooks
// and then renders the whiteboard.
export default function Board({ boardId }: { boardId: string }) {
  return (
    <SessionProvider>
      <Whiteboard boardId={boardId} />
    </SessionProvider>
  );
}
