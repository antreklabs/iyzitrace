import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationContextType {
    selectedEntityId: string | null;
    selectEntity: (id: string | null) => void;
    isDrawerOpen: boolean;
    closeDrawer: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const selectEntity = useCallback((id: string | null) => {
        setSelectedEntityId(id);
        if (id) {
            setIsDrawerOpen(true);
        } else {
            setIsDrawerOpen(false);
        }
    }, []);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
        setSelectedEntityId(null);
    }, []);

    return (
        <NavigationContext.Provider
            value={{
                selectedEntityId,
                selectEntity,
                isDrawerOpen,
                closeDrawer,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};

export function useNavigation() {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}
