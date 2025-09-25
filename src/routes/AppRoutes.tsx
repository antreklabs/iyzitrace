import React, { JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import  appRoutes  from './route-constant';
import { AppRoute } from '../interfaces';

const renderRoutes = (routes: AppRoute[]): JSX.Element[] => {
    appRoutes.forEach((r:AppRoute) => {
        if (!r.element) {
          console.error(`[❌ ROUTE ERROR] '${r.path}' için element eksik!`);
        }
      });
  return routes.flatMap((route) => {
    const current = <Route key={route.path} path={route.path} element={route.element as any} />;
    const children = route.children ? renderRoutes(route.children) : [];
    return [current, ...children];
  });
};

const AppRoutes = () => (
  <Routes>
    {renderRoutes(appRoutes)}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
