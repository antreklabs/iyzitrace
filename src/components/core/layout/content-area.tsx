import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { KeepAlive } from 'react-activation';
import { appRoutes } from '../../../routes';

const ContentArea = () => {
  const location = useLocation();
  const currentRoute = appRoutes.find((r) => location.pathname.startsWith(r.path));

  if (!currentRoute) {return <div>Not Found</div>;}

  const Element = currentRoute.element;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KeepAlive id={location.pathname}>{Element}</KeepAlive>
    </Suspense>
  );
};

export default ContentArea;
