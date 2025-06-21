"use client";

import { useState } from 'react';
import type { Board } from '@/types/board.d';
import { ShareDialog } from './share-dialog';
import { Users } from 'lucide-react';

interface ShareButtonProps {
    board: Board | null;
    onBoardUpdate: () => void; // Add callback prop
}

export const ShareButton = ({ board, onBoardUpdate }: ShareButtonProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    if (!board) { return null; }

    return (
        <>
            <button onClick={() => setIsDialogOpen(true)} className="bg-teal-500 text-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2 hover:bg-teal-600 h-10" title="Share board">
                <Users size={20} />
                <span className='hidden md:inline font-medium text-sm'>Share</span>
            </button>
            <ShareDialog 
                board={board}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onBoardUpdate={onBoardUpdate}
            />
        </>
    );
};