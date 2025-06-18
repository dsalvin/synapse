"use client";

import * as Avatar from '@radix-ui/react-avatar';

// Define a type for the user object we expect
type PresenceUser = {
    id: string;
    name: string;
    image: string;
};

export function PresenceAvatars({ users }: { users: PresenceUser[] }) {
    return (
        // The container with the z-index fix
        <div className="absolute top-4 right-4 flex items-center -space-x-2 z-20">
            {users.map(({ id, name, image }) => (
                // The original, production-ready Radix UI Avatar component
                <Avatar.Root key={id} className="inline-block h-10 w-10 rounded-full ring-2 ring-white">
                    <Avatar.Image
                        src={image}
                        alt={name}
                        className="h-full w-full rounded-full object-cover"
                    />
                    <Avatar.Fallback
                        delayMs={600}
                        className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-700 font-semibold"
                    >
                        {name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar.Fallback>
                </Avatar.Root>
            ))}
        </div>
    );
};