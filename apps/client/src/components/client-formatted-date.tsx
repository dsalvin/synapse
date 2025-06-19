"use client";

import { useState, useEffect } from 'react';

interface ClientFormattedDateProps {
    dateString: string;
}

export const ClientFormattedDate = ({ dateString }: ClientFormattedDateProps) => {
    const [formattedDate, setFormattedDate] = useState('');

    // The useEffect hook only runs on the client-side, after the component has mounted.
    useEffect(() => {
        // We format the date here, ensuring it only happens in the browser environment.
        setFormattedDate(new Date(dateString).toLocaleDateString());
    }, [dateString]);

    // During the server render and the initial client render, this will return null,
    // preventing a hydration mismatch. The date will appear after hydration.
    if (!formattedDate) {
        return null;
    }

    return (
        <span className="text-sm text-gray-500">
            {formattedDate}
        </span>
    );
};