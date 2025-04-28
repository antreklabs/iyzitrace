import React from 'react'
import { AppRoute } from "@/interfaces";




const Dashboard = React.lazy(() => import('../pages/dashboard.page'));
const Services = React.lazy(() => import('../pages/services/services.page'));
const ServiveDetail = React.lazy(() => import('../pages/services/servicedetail.page'));
const TracePage = React.lazy(() => import('../pages/traces/traces.page'));
const TraceDetail = React.lazy(() => import('../pages/traces/tracedetail.page'));

export const appRoutes: AppRoute[] = [
    {
      path: '/',
      element: <Dashboard/>,
      name: 'dashboard',
      title: 'Dashboard',
      showInMenu: true,
    },
    {
      path: '/services',
      element: <Services />,
      name: 'services',
      title: 'services',
      icon: 'search',
      showInMenu: true,
    },
    {
      path: '/services/:serviceName',
      element: <ServiveDetail />,
      name: 'serviceDetail',
      title: 'Service Detail',
      icon: 'search',
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
      path: '/traces/:traceId',
      element: <TraceDetail />,
      name: 'tracedetail',
      title: 'Trace Detail',
      icon: 'search',
      showInMenu: true,
    },
  ];

export default appRoutes;
