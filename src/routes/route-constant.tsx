import React from 'react';
import { AppRoute } from '@/interfaces';

const LandingPage = React.lazy(() => import('../pages/landing/landing.page'));
const OverviewPage = React.lazy(() => import('../pages/overview/overview.page'));
const ServiceMapPage = React.lazy(() => import('../pages/service-map/service-map.page'));
const ServicesPage = React.lazy(() => import('../pages/services/services.page'));
const ServiveDetailPage = React.lazy(() => import('../pages/services/service-detail.page'));
const TracesPage = React.lazy(() => import('../pages/traces/traces.page'));
const TraceDetailPage = React.lazy(() => import('../pages/traces/trace-detail.page')); 
const LogsPage = React.lazy(() => import('../pages/logs/logs.page'));
const ViewsPage = React.lazy(() => import('../pages/views/view.page'));
const AiPage = React.lazy(() => import('../pages/ai/ai.page'));
const ExceptionsPage = React.lazy(() => import('../pages/exceptions/exceptions.page'));
const ExceptionDetailPage = React.lazy(() => import('../pages/exceptions/exception-detail.page'));
const TeamsPage = React.lazy(() => import('../pages/teams/teams.page'));
const TeamsManagePage = React.lazy(() => import('../pages/teams/teams-manage.page'));
const SettingsPage = React.lazy(() => import('../pages/settings/settings.page'));

export const appRoutes: AppRoute[] = [
  {
    path: '/',
    element: <LandingPage />,
    name: 'landing',
    title: 'Home',
    showInMenu: true,
  },
  {
    path: '/landing',
    element: <LandingPage />,
    name: 'landing',
    title: 'Home',
    icon: 'home',
    showInMenu: true,
  },
  {
    path: '/overview',
    element: <OverviewPage />,
    name: 'overview',
    title: 'Overview',
    icon: 'building',
    showInMenu: true,
  },
  {
    path: '/service-map',
    element: <ServiceMapPage />,
    name: 'serviceMap',
    title: 'Service Map',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/services',
    element: <ServicesPage />,
    name: 'services',
    title: 'Services',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/services/:serviceName',
    element: <ServiveDetailPage />,
    name: 'serviceDetail',
    title: 'Service Detail',
    icon: 'search',
  },
  {
    path: '/traces',
    element: <TracesPage />,
    name: 'traces',
    title: 'Traces',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/traces/:traceId',
    element: <TraceDetailPage />,
    name: 'tracedetail',
    title: 'Trace Detail',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/logs',
    element: <LogsPage />,
    name: 'logs',
    title: 'Logs',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/views',
    element: <ViewsPage />,
    name: 'views',
    title: 'Views',
    showInMenu: true,
  },
  {
    path: '/ai',
    element: <AiPage />,
    name: 'ai',
    title: 'AI Assistant',
    icon: 'robot',
    showInMenu: true,
  },
  {
    path: '/exceptions',
    element: <ExceptionsPage />,
    name: 'exceptions',
    title: 'Exceptions',
    showInMenu: true,
  },
  {
    path: '/exceptions/:groupId',
    element: <ExceptionDetailPage />,
    name: 'exceptionDetail',
    title: 'Exception Detail',
    showInMenu: false,
  },
  {
    path: '/teams',
    element: <TeamsPage />,
    name: 'teams',
    title: 'Teams',
    showInMenu: true,
  },
  {
    path: '/teams/:teamId/manage',
    element: <TeamsManagePage />,
    name: 'teamsManage',
    title: 'Team Management',
    showInMenu: false,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
    name: 'settings',
    title: 'Settings',
    showInMenu: true,
  },
];

export default appRoutes;