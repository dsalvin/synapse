"use client";

import type { Board, BoardRole, PresenceUser } from '@/types/board.d';
import * as Avatar from '@radix-ui/react-avatar';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ShareDialogProps {
    board: Board;
    isOpen: boolean;
    onClose: () => void;
    onBoardUpdate: () => void; // Callback to tell the parent to refetch data
}

type Member = Partial<PresenceUser> & { role: BoardRole; id: string; };

export const ShareDialog = ({ board, isOpen, onClose, onBoardUpdate }: ShareDialogProps) => {
    const { data: session } = useSession();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteStatus, setInviteStatus] = useState('');
    
    const isOwner = board.ownerId === session?.user?.id;

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setInviteStatus('');
            const fetchMembers = async () => {
                try {
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userIds: board.memberIds })
                    });
                    const users: PresenceUser[] = await response.json();
                    const populatedMembers = board.memberIds.map(id => {
                        const user = users.find(u => u.id === id);
                        return { ...user, id, role: board.memberRoles[id] };
                    });
                    setMembers(populatedMembers as Member[]);
                } catch (error) {
                    console.error("Failed to fetch member details", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMembers();
        }
    }, [isOpen, board.memberIds, board.memberRoles]);

    const handleRoleChange = async (userId: string, role: BoardRole) => {
        setUpdatingRoleId(userId);
        try {
            await fetch(`/api/boards/${board.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberToUpdate: { userId, role } })
            });
            onBoardUpdate(); // Trigger the parent component to refetch data
        } catch (error) {
            console.error("Failed to update role:", error);
            alert("Failed to update role.");
        } finally {
            setUpdatingRoleId(null);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteStatus('Inviting...');
        try {
            const response = await fetch(`/api/boards/${board.id}/invitations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail }),
            });
            if (!response.ok) { const errorText = await response.text(); throw new Error(errorText || 'Failed to send invite.'); }
            setInviteStatus('User invited successfully!');
            setInviteEmail('');
            onBoardUpdate();
        } catch (error: any) {
            setInviteStatus(error.message);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800">Share "{board.name}"</h2>
                {isOwner && (
                    <form onSubmit={handleInvite} className="mt-4 flex gap-2">
                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" className="flex-grow px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700">Invite</button>
                    </form>
                )}
                {inviteStatus && <p className="text-sm text-center mt-2 text-gray-600">{inviteStatus}</p>}
                <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Members</h3>
                    {isLoading ? <p>Loading...</p> : (
                        <ul className="space-y-3 max-h-60 overflow-y-auto">
                            {members.map(member => (
                                <li key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar.Root className="inline-block h-10 w-10 rounded-full"><Avatar.Image src={member.image} alt={member.name} className="h-full w-full rounded-full object-cover" /><Avatar.Fallback delayMs={600} className="flex h-full w-full items-center justify-center rounded-full bg-teal-100 text-teal-800 font-semibold">{member.name?.charAt(0).toUpperCase() || '?'}</Avatar.Fallback></Avatar.Root>
                                        <div><p className="font-medium text-gray-900">{member.name}</p></div>
                                    </div>
                                    {member.role === 'owner' ? (<span className="text-sm font-medium text-gray-500">Owner</span>) : (
                                        <select value={member.role} onChange={(e) => handleRoleChange(member.id!, e.target.value as BoardRole)} disabled={!isOwner || updatingRoleId === member.id} className="text-sm font-medium text-gray-600 capitalize border border-gray-300 rounded-md p-1 disabled:opacity-50" >
                                            <option value="editor">Editor</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Done</button>
                </div>
            </div>
        </div>
    );
};