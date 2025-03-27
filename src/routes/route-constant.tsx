import React from 'react'
import { AppRoute } from "@/interfaces";




const Dashboard = React.lazy(() => import('../pages/dashboard.page'));
const Explore = React.lazy(() => import('../pages/explore.page'));
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
      path: 'explore',
      element: <Explore />,
      name: 'explore',
      title: 'Explore',
      icon: 'search',
      showInMenu: true,
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
