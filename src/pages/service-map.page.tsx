import React from 'react';
import ServiceMap from '../containers/ServiceMap/ServiceMap';

/**
 * Service Map Plugin API Page
 * 
 * This page demonstrates service mapping using Grafana's Plugin API approach.
 * 
 * Expected Limitations:
 * - jsonData may be undefined in plugin context
 * - query method may not be available  
 * - Limited datasource instance access
 * - Permission restrictions
 * 
 * Use this page to understand Plugin API limitations compared to HTTP API approach.
 */
const ServiceMapPage: React.FC = () => {
  return <ServiceMap />;
};

export default ServiceMapPage;
