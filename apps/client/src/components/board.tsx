"use client";

import dynamic from 'next/dynamic';
import { SessionProvider } from 'next-auth/react';
import { Loader } from 'lucide-react';
import { User } from 'next-auth';

const Whiteboard = dynamic(() => import('@/components/whiteboard'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin" />
      <p className="ml-2 text-lg">Loading Whiteboard...</p>
    </div>
  ),
});

export default function Board({ 
  boardId, 
  user 
}: { 
  boardId: string;
  user: User & { id: string };
}) {
  return (
    <SessionProvider>
      <Whiteboard boardId={boardId} user={user} />
    </SessionProvider>
  );
}