import React from 'react';
import { useProfile } from '@/Context/ProfileContext';
import { cn } from '@/lib/utils';

/**
 * UserProfileLink - A wrapper component to trigger the global profile drawer
 * 
 * @param {string|number} userId - The ID of the user whose profile to show
 * @param {React.ReactNode} children - The content (Avatar, Name, etc.)
 * @param {string} className - Additional classes
 */
const UserProfileLink = ({ userId, children, className }) => {
    const { openProfile } = useProfile();

    const handleClick = (e) => {
        if (!userId) return;

        e.preventDefault();
        e.stopPropagation();
        openProfile(userId);
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center",
                className
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e);
                }
            }}
        >
            {children}
        </div>
    );
};

export default UserProfileLink;
