"use client"; // This makes the page itself a Client Component.

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// We can now safely put the dynamic import here because this is a Client Component.
const Whiteboard = dynamic(() => import('@/components/whiteboard'), {
  ssr: false, // This is now allowed and correct.
  loading: () => <div className="w-full h-screen flex items-center justify-center">
    <p className="text-2xl font-semibold">Loading Whiteboard...</p>
  </div>,
});

export default function BoardPage() {
  // `useParams` is the official hook for accessing dynamic route
  // parameters from a Client Component.
  const params = useParams();

  // The hook gives us the raw parameter, which could be a string or string[]
  // We ensure it's a single string.
  const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId;

  // Before the router is fully ready, params might be empty.
  // We render a loading state until we have the boardId.
  if (!boardId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-2xl font-semibold">Loading...</p>
      </div>
    );
  }

  return (
      <Whiteboard boardId={boardId} />
  );
}