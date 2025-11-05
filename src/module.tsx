import React, { Suspense, lazy } from 'react';
import { AppPlugin, type AppRootProps, type PluginConfigPageProps, type AppPluginMeta } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';
import SettingsPage from './pages/settings/settings.page';

const LazyApp = lazy(() => import('./components/App/App'));
// (no app-config page here)

const App = (props: AppRootProps) => (
  <Suspense fallback={<LoadingPlaceholder text="" />}>
    <LazyApp {...props} />
  </Suspense>
);

// removed old AppConfig usage

export const plugin = new AppPlugin<{}>()
  .setRootPage(App)
  .addConfigPage({
    title: 'Configuration',
    icon: 'cog',
    body: (props: PluginConfigPageProps<AppPluginMeta<{}>>) => <SettingsPage {...(props as any)} />,
    id: 'configuration',
  });
