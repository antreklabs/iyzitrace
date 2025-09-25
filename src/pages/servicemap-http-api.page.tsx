import React from 'react';
import ServiceMapHttpAPI from '../containers/ServiceMap/ServiceMapHttpAPI';

/**
 * Service Map HTTP API Page
 * 
 * This page demonstrates service mapping using direct HTTP API approach.
 * 
 * Advantages over Plugin API:
 * - Direct access to datasource configs via /api/datasources
 * - Bypasses plugin API limitations
 * - Can access jsonData configurations
 * - Uses getBackendSrv().datasourceRequest() for queries
 * - More reliable for production applications
 * 
 * Use this page to see how HTTP API approach overcomes Plugin API limitations.
 */
const ServiceMapHttpAPIPage: React.FC = () => {
  return <ServiceMapHttpAPI />;
};

export default ServiceMapHttpAPIPage;
