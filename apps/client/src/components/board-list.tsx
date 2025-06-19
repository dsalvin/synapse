"use client";

import Link from 'next/link';
import type { Board } from '@/types/board.d';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClientFormattedDate } from './client-formatted-date';

interface BoardListProps {
    boards: Board[];
}

export const BoardList = ({ boards }: BoardListProps) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const router = useRouter();
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const handleRenameClick = (board: Board) => {
        setEditingId(board.id);
        setEditingName(board.name);
    };

    const handleRenameSubmit = async (boardId: string) => {
        if (!editingName.trim()) return;

        try {
            const response = await fetch(`/api/boards/${boardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingName.trim() }),
            });
            if (!response.ok) throw new Error('Failed to rename board.');
            
            setEditingId(null);
            router.refresh();

        } catch (error) {
            console.error(error);
            alert('An error occurred while renaming the board.');
        }
    };

    const handleDelete = async (boardId: string, boardName: string) => {
        if (!window.confirm(`Are you sure you want to delete the board "${boardName}"? This action cannot be undone.`)) return;
        setDeletingId(boardId);
        try {
            const response = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete board.');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('An error occurred while deleting the board.');
        } finally {
            setDeletingId(null);
        }
    };

    if (boards.length === 0) {
        return (
            <div className="text-center text-gray-500 mt-8">
                <p>You haven't created any boards yet.</p>
                <p>Use the form above to create your first one!</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Boards</h2>
            <ul className="space-y-3">
                {boards.map((board) => (
                    <li 
                        key={board.id} 
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center group"
                    >
                        {editingId === board.id ? (
                            <input
                                ref={editInputRef}
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleRenameSubmit(board.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(board.id)}
                                className="flex-grow font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md px-2 py-1"
                            />
                        ) : (
                            <Link href={`/board/${board.id}`} className="flex-grow">
                                <span className="font-medium text-blue-600 hover:underline">{board.name}</span>
                            </Link>
                        )}
                        <div className="flex items-center space-x-2 pl-4">
                            <ClientFormattedDate dateString={board.createdAt} />
                            <button
                                onClick={() => handleRenameClick(board)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Rename
                            </button>
                            <button
                                onClick={() => handleDelete(board.id, board.name)}
                                disabled={deletingId === board.id}
                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
                            >
                                {deletingId === board.id ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};