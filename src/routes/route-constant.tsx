import React from 'react'
import { AppRoute } from "@/interfaces";




const Dashboard = React.lazy(() => import('../pages/dashboard.page'));
const Services = React.lazy(() => import('../pages/services/services.page'));
const ServiveDetail = React.lazy(() => import('../pages/services/servicedetail.page'));
const TracePage = React.lazy(() => import('../pages/traces.page'));

export const appRoutes: AppRoute[] = [
    {
      path: '/',
      element: <Dashboard/>,
      name: 'dashboard',
      title: 'Dashboard',
      showInMenu: true,
    },
    {
      path: 'services',
      element: <Services />,
      name: 'services',
      title: 'services',
      icon: 'search',
      showInMenu: true,
    },
    {
      path: 'services/:serviceName',
      element: <ServiveDetail />,
      name: 'serviceDetail',
      title: 'Service Detail',
      icon: 'search',
    },
    {
      path: 'trace',
      element: <TracePage />,
      name: 'trace',
      title: 'Trace',
      icon: 'search',
      showInMenu: true,
    },
  ];

export default appRoutes;
