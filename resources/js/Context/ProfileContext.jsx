import React, { createContext, useContext, useState, useCallback } from 'react';
import ProfileDrawer from '@/components/Marketplace/ProfileDrawer';

const CONTEXT_KEY = Symbol.for('app.profileContext');
if (!window[CONTEXT_KEY]) {
    window[CONTEXT_KEY] = createContext(null);
}
const ProfileContext = window[CONTEXT_KEY];

export const ProfileProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState(null);

    const openProfile = useCallback((id) => {
        setUserId(id);
        setIsOpen(true);
    }, []);

    const closeProfile = useCallback(() => {
        setIsOpen(false);
        setUserId(null);
    }, []);

    return (
        <ProfileContext.Provider value={{ isOpen, userId, openProfile, closeProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
