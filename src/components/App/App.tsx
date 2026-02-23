import React, { useEffect } from 'react';
import { AppRootProps } from '@grafana/data';
import { getThemeToken } from '../../utils/index';
import MainLayout from 'components/core/layout/layout.component';
import { ConfigProvider, App as AntdApp } from 'antd';
import AppRoutes from '../../routes/app-routes';
import WizardLayout, { useWizardContext, WizardContext } from '../../pages/wizard/wizard-layout.component';
import '../../assets/styles/global.css';
import { Provider } from 'react-redux';
import store, { persistor } from '../../store/store';
import { AliveScope } from 'react-activation';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

/**
 * Inner component that conditionally renders MainLayout based on wizard status
 */
const AppContent: React.FC = () => {
  const { wizardCompleted } = useWizardContext();

  // If wizard not completed, render routes without MainLayout (no menu)
  if (!wizardCompleted) {
    return <AppRoutes />;
  }

  // Wizard completed - show full layout with menu
  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
};

/**
 * Themed wrapper that applies dynamic Ant Design theme based on ThemeContext
 */
const ThemedApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark } = useTheme();
  const themeConfig = getThemeToken(isDark);

  return (
    <ConfigProvider theme={themeConfig}>
      <AntdApp>
        {children}
      </AntdApp>
    </ConfigProvider>
  );
};

function App(props: AppRootProps) {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

  }, []);
  return (
    <React.StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <ThemedApp>
              <AliveScope>
                <WizardLayout>
                  <AppContent />
                </WizardLayout>
              </AliveScope>
            </ThemedApp>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}

export default App;