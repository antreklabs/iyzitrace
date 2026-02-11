import React, { useEffect, useState, createContext, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingPlaceholder } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';

const PLUGIN_ID = 'iyzitrace-app';

interface WizardState {
    completed: boolean;
    completedAt?: string;
    skipped?: boolean;
}

interface WizardContextType {
    wizardCompleted: boolean;
    setWizardCompleted: (completed: boolean) => void;
}

export const WizardContext = createContext<WizardContextType>({
    wizardCompleted: false,
    setWizardCompleted: () => { },
});

export const useWizardContext = () => useContext(WizardContext);

/**
 * Wrapper component that checks if the setup wizard has been completed.
 * If not completed, blocks all pages except wizard and hides the menu.
 * Wizard completion state is stored in plugin jsonData.
 */
const WizardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [wizardCompleted, setWizardCompleted] = useState<boolean>(false);

    useEffect(() => {
        const checkWizardStatus = async () => {
            try {
                const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
                const wizardState = settings?.jsonData?.wizardState as WizardState | undefined;
                setWizardCompleted(wizardState?.completed === true);
            } catch (error) {
                // If we can't fetch settings, assume wizard not completed
                setWizardCompleted(false);
            } finally {
                setLoading(false);
            }
        };

        checkWizardStatus();
    }, []);

    // Show loading while checking wizard status
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#111'
            }}>
                <LoadingPlaceholder text="Loading..." />
            </div>
        );
    }

    // Check if current path is wizard
    const isWizardPath = location.pathname.includes('/wizard');

    // If wizard not completed and NOT on wizard page, redirect to wizard
    if (!wizardCompleted && !isWizardPath) {
        return <Navigate to="/a/iyzitrace-app/wizard" replace />;
    }

    // Provide wizard context to children
    return (
        <WizardContext.Provider value={{ wizardCompleted, setWizardCompleted }}>
            {children}
        </WizardContext.Provider>
    );
};

export default WizardLayout;
