import React from 'react'
import { AppRoute } from "@/interfaces";

import DashboardPage from '../pages/dashboard.page';
import Explore from '../pages/explore.page';
import TracePage from '../pages/traces.page';

export const appRoutes: AppRoute[] = [
    {
      path: '/',
      element: <DashboardPage/>,
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
