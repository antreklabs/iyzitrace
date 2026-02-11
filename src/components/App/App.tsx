import React, { useEffect } from 'react';
import { AppRootProps } from '@grafana/data';
import { themetoken } from '../../utils/index';
import MainLayout from 'components/core/layout/layout.component';
import { ConfigProvider, App as AntdApp } from 'antd';
import AppRoutes from '../../routes/app-routes';
import WizardLayout, { useWizardContext, WizardContext } from '../../pages/wizard/wizard-layout.component';
import '../../assets/styles/global.css';
import { Provider } from 'react-redux';
import store, { persistor } from '../../store/store';
import { AliveScope } from 'react-activation';
import { PersistGate } from 'redux-persist/integration/react';

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
          <ConfigProvider theme={themetoken}>
            <AntdApp>
              <AliveScope>
                <WizardLayout>
                  <AppContent />
                </WizardLayout>
              </AliveScope>
            </AntdApp>
          </ConfigProvider>
        </PersistGate>
      </Provider>
    </React.StrictMode>
  );
}

export default App;