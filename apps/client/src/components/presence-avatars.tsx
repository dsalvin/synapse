"use client";

import * as Avatar from '@radix-ui/react-avatar';
import type { PresenceUser } from '@/types/board.d';

export function PresenceAvatars({ users }: { users: PresenceUser[] }) {
    return (
        <div className="flex items-center -space-x-2">
            {users.map(({ id, name, image }) => (
                <Avatar.Root key={id} title={name} className="inline-block h-10 w-10 rounded-full ring-2 ring-white">
                    <Avatar.Image
                        src={image}
                        alt={name}
                        className="h-full w-full rounded-full object-cover"
                    />
                    <Avatar.Fallback
                        delayMs={600}
                        className="flex h-full w-full items-center justify-center rounded-full bg-teal-100 text-teal-800 font-semibold"
                    >
                        {name?.charAt(0).toUpperCase() || '?'}
                    </Avatar.Fallback>
                </Avatar.Root>
            ))}
        </div>
    );
};