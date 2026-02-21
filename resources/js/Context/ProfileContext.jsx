import React, { createContext, useContext, useState, useCallback } from 'react';
import ProfileDrawer from '@/Components/Marketplace/ProfileDrawer';

const ProfileContext = createContext();

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
