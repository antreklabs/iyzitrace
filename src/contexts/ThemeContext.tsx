import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'iyzitrace-theme';

const ThemeContext = createContext<ThemeContextType>({
    isDark: true,
    toggleTheme: () => { },
});

/** Read saved theme from localStorage, fallback to Grafana's body class */
const getInitialTheme = (): boolean => {
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light') return false;
        if (saved === 'dark') return true;
    } catch { }
    // Fallback: read Grafana's current theme from body class
    return !document.body.classList.contains('theme-light');
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

    // Sync data-theme attribute on <html> and persist to localStorage
    useEffect(() => {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch { }
    }, [isDark]);

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => !prev);
    }, []);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
