import React, { JSX } from 'react';
import './ServiceLegend.css';

interface ServiceMeta {
  color: string;
  icon: JSX.Element;
}

interface ServiceLegendPanelProps {
  serviceMetaMap: Record<string, ServiceMeta>;
}

const ServiceLegendPanel: React.FC<ServiceLegendPanelProps> = ({ serviceMetaMap }) => {
  return (
    <div className="service-legend-panel">
      {Object.entries(serviceMetaMap).map(([serviceName, meta]) => (
        <div key={serviceName} className="service-legend-row">
          <span className="service-legend-icon">{meta.icon}</span>
          <span className="service-legend-color" style={{ backgroundColor: meta.color }} />
          <span className="service-legend-name">{serviceName}</span>
        </div>
      ))}
    </div>
  );
};

export default ServiceLegendPanel;
