"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateBoardForm() {
  const [boardName, setBoardName] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (boardName.trim()) {
      // Sanitize board name to be URL-friendly
      const boardId = boardName.trim().toLowerCase().replace(/\s+/g, '-');
      router.push(`/board/${boardId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={boardName}
        onChange={(e) => setBoardName(e.target.value)}
        placeholder="Enter a board name to create or join"
        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <button
        type="submit"
        className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
      >
        Go to Board
      </button>
    </form>
  );
}