"use client"; // This is the most important change.

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the Whiteboard component to ensure it only runs on the client
const Whiteboard = dynamic(() => import('@/components/whiteboard'), {
  ssr: false, // Disable server-side rendering for this component
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <p className="text-2xl font-semibold text-gray-700">Loading Whiteboard...</p>
    </div>
  ),
});

export default function BoardPage() {
  // `useParams` is the standard hook for accessing dynamic route
  // parameters from a Client Component.
  const params = useParams();

  // The hook gives us the raw parameter, which could be a string or string[].
  // We ensure it's a single string.
  const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId as string;

  // Before the router is fully ready on the client, params might be empty.
  // We render a loading state until we have the boardId.
  if (!boardId) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <p className="text-2xl font-semibold text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
      <Whiteboard boardId={boardId} />
  );
}