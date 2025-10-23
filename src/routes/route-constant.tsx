import React from 'react';
import { AppRoute } from '@/interfaces';

const Dashboard = React.lazy(() => import('../pages/dashboard.page'));
const Landing = React.lazy(() => import('../pages/landing.page'));
const LandingPage = React.lazy(() => import('../pages/landing-page'));
const Services = React.lazy(() => import('../pages/services/services.old.page'));
const ServicesV2 = React.lazy(() => import('../pages/services/services.page'));
const ServiveDetail = React.lazy(() => import('../pages/services/servicedetail.page'));
const TracePage = React.lazy(() => import('../pages/traces/traces.old.page'));
const TracesV2 = React.lazy(() => import('../pages/traces/traces.page'));
const TraceDetail = React.lazy(() => import('../pages/traces/tracedetail.page'));
const ServiceMap = React.lazy(() => import( '../pages/service-map/service-map.page'));
const ServiceMapV2 = React.lazy(() => import( '../pages/service-map/service-map-v2.page'));
const ServiceMap3D = React.lazy(() => import('../pages/service-map-3d.page'));
const ServiceMapV4 = React.lazy(() => import('../pages/service-map-v4.page'));
const Map3D = React.lazy(() => import('../pages/map/map-3d.page'));
const LogsPage = React.lazy(() => import('../pages/logs.page'));
const LogsPipelines = React.lazy(() => import('../pages/logs-pipelines/logs-pipelines.page'));
const LogsV2Page = React.lazy(() => import('../pages/logs/logs.page'));
const ComingSoon = React.lazy(() => import('../pages/coming-soon.page'));
const SettingsPage = React.lazy(() => import('../pages/settings.page'));
const TeamsPage = React.lazy(() => import('../pages/teams/teams.page'));
const TeamsManagePage = React.lazy(() => import('../pages/teams/teams-manage.page'));
const AlertsPage = React.lazy(() => import('../pages/alerts/alerts.page'));

export const appRoutes: AppRoute[] = [
  {
    path: '/services/:serviceName',
    element: <ServiveDetail />,
    name: 'serviceDetail',
    title: 'Service Detail',
    icon: 'search',
  },
  {
    path: '/services',
    element: <Services />,
    name: 'services',
    title: 'Services',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/services-v2',
    element: <ServicesV2 />,
    name: 'servicesV2',
    title: 'Services',
    icon: 'search',
    showInMenu: true,
  },

  {
    path: '/traces/:traceId',
    element: <TraceDetail />,
    name: 'tracedetail',
    title: 'Trace Detail',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/service-map',
    element: <ServiceMap />,
    name: 'serviceMap',
    title: 'Service Map',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/service-map-v2',
    element: <ServiceMapV2 />,
    name: 'serviceMapV2',
    title: 'Service Map v2',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/service-map-3d',
    element: <ServiceMap3D />,
    name: 'serviceMap3D',
    title: '3D Service Map',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/service-map-v4',
    element: <ServiceMapV4 />,
    name: 'serviceMapV4',
    title: 'Service Map v4',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/map-3d',
    element: <Map3D />,
    name: 'map3D',
    title: 'Map 3D',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/traces',
    element: <TracePage />,
    name: 'traces',
    title: 'Traces',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/traces-v2',
    element: <TracesV2 />,
    name: 'tracesV2',
    title: 'Traces v2',
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
    path: '/logs-v2',
    element: <LogsV2Page />,
    name: 'logsV2',
    title: 'Logs v2',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/logs-pipelines',
    element: <LogsPipelines />,
    name: 'logsPipelines',
    title: 'Logs Pipelines',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/landing',
    element: <Landing />,
    name: 'landing',
    title: 'Infra Overview',
    icon: 'building',
    showInMenu: true,
  },
  {
    path: '/landing-page',
    element: <LandingPage />,
    name: 'landingPage',
    title: 'Home',
    icon: 'home',
    showInMenu: true,
  },
  {
    path: '/',
    element: <Dashboard />,
    name: 'dashboard',
    title: 'Dashboard',
    showInMenu: true,
  },
  {
    path: '/dashboards',
    element: <Dashboard />,
    name: 'dashboards',
    title: 'Dashboards',
    showInMenu: true,
  },
  {
    path: '/exceptions',
    element: <ComingSoon title="Exceptions – Coming Soon" />,
    name: 'exceptions',
    title: 'Exceptions',
    showInMenu: true,
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
    path: '/alerts',
    element: <AlertsPage />,
    name: 'alerts',
    title: 'Alerts',
    showInMenu: true,
  },
  {
    path: '/team',
    element: <ComingSoon title="Team – Coming Soon" />,
    name: 'team',
    title: 'Team',
    showInMenu: true,
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
