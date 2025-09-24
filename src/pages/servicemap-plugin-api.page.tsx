import React from 'react';
import ServiceMapPluginAPI from '../containers/ServiceMap/ServiceMapPluginAPI';

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
const ServiceMapPluginAPIPage: React.FC = () => {
  return <ServiceMapPluginAPI />;
};

export default ServiceMapPluginAPIPage;
