import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

// Fixed onboarding theme color (purple-600 from the gradient)
const ONBOARDING_THEME_COLOR = '#9333EA';

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Fixed theme using onboarding purple color
    const theme = {
        primary: ONBOARDING_THEME_COLOR,
        primaryHex: ONBOARDING_THEME_COLOR,
    };

    useEffect(() => {
        // Apply fixed onboarding color to CSS variables
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', ONBOARDING_THEME_COLOR);
        root.style.setProperty('--theme-primary-rgb', '147, 51, 234'); // RGB for purple-600
    }, []);

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
