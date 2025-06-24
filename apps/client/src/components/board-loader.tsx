"use client";

import dynamic from 'next/dynamic';
import { User } from 'next-auth';

// The dynamic import with ssr: false is now correctly placed inside a Client Component.
// We also use the robust named import syntax.
const Whiteboard = dynamic(
  () => import('@/components/whiteboard').then((mod) => mod.Whiteboard), 
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <p className="text-2xl font-semibold text-gray-700">Loading Whiteboard...</p>
      </div>
    ),
  }
);

interface BoardLoaderProps {
    boardId: string;
    user: User & { id: string };
}

export const BoardLoader = ({ boardId, user }: BoardLoaderProps) => {
    // This component simply receives the data and renders the lazy-loaded whiteboard.
    return <Whiteboard boardId={boardId} user={user} />;
};