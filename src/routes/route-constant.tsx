import React from 'react';
import { AppRoute } from '@/interfaces';

const Dashboard = React.lazy(() => import('../pages/dashboard.page'));
const Services = React.lazy(() => import('../pages/services/services.page'));
const ServiveDetail = React.lazy(() => import('../pages/services/servicedetail.page'));
const TracePage = React.lazy(() => import('../pages/traces/traces.page'));
const TraceDetail = React.lazy(() => import('../pages/traces/tracedetail.page'));
const ServiceMap = React.lazy(() => import('../pages/servicemap.page'));
const ServiceMapPluginAPI = React.lazy(() => import('../pages/servicemap-plugin-api.page'));
const ServiceMapHttpAPI = React.lazy(() => import('../pages/servicemap-http-api.page'));
const LogsPage = React.lazy(() => import('../pages/logs.page'));
const LogsPipelines = React.lazy(() => import('../pages/logs-pipelines/logs-pipelines.page'));

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
    path: '/traces/:traceId',
    element: <TraceDetail />,
    name: 'tracedetail',
    title: 'Trace Detail',
    icon: 'search',
    showInMenu: true,
  },
  {
    path:"/service-map",
    element: <ServiceMap />,
    name: 'serviceMap',
    title: 'Service Map',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/service-map-plugin-api',
    element: <ServiceMapPluginAPI />,
    name: 'serviceMapPluginAPI',
    title: 'Service Map (Plugin API)',
    icon: 'search',
    showInMenu: true,
  },
  {
    path: '/service-map-http-api',
    element: <ServiceMapHttpAPI />,
    name: 'serviceMapHttpAPI',
    title: 'Service Map (HTTP API)',
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
    path: '/logs',
    element: <LogsPage />,
    name: 'logs',
    title: 'Logs',
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
];

export default appRoutes;
