import React, { JSX, useState } from 'react';
import './ServiceLegend.css';

interface ServiceMeta {
  color: string;
  icon: JSX.Element;
  operationType?: string;
}

interface ServiceLegendPanelProps {
  serviceMetaMap: Record<string, ServiceMeta>;
  onOperationTypeFilter?: (selectedTypes: string[]) => void;
}

const OPERATION_TYPES = [
  { type: 'HTTP', color: 'blue', icon: '🌐' },
  { type: 'MESSAGING', color: 'orange', icon: '💬' },
  { type: 'CACHE', color: 'purple', icon: '⚡' },
  { type: 'DATABASE', color: 'green', icon: '🗄️' },
  { type: 'RPC', color: 'red', icon: '🔄' },
];

const ServiceLegendPanel: React.FC<ServiceLegendPanelProps> = ({ serviceMetaMap, onOperationTypeFilter }) => {
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<string[]>([]);

  const handleOperationTypeToggle = (type: string) => {
    const newSelection = selectedOperationTypes.includes(type)
      ? selectedOperationTypes.filter(t => t !== type)
      : [...selectedOperationTypes, type];
    
    setSelectedOperationTypes(newSelection);
    onOperationTypeFilter?.(newSelection);
  };

  const handleClearAll = () => {
    setSelectedOperationTypes([]);
    onOperationTypeFilter?.([]);
  };

  return (
    <div className="service-legend-panel">
      {/* Operation Type Filters */}
      <div className="operation-type-filters">
        <div className="filter-header">
          <span className="filter-label">Filter by Operation Type:</span>
          {selectedOperationTypes.length > 0 && (
            <button 
              className="clear-all-button"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}
        </div>
        <div className="operation-type-buttons">
          {OPERATION_TYPES.map(({ type, color, icon }) => (
            <button
              key={type}
              className={`operation-type-button ${selectedOperationTypes.includes(type) ? 'selected' : ''}`}
              style={{ 
                borderColor: selectedOperationTypes.includes(type) ? color : '#555',
                backgroundColor: selectedOperationTypes.includes(type) ? `${color}20` : 'transparent'
              }}
              onClick={() => handleOperationTypeToggle(type)}
            >
              <span className="operation-icon">{icon}</span>
              <span className="operation-type-name">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Service Legend */}
      {/* <div className="service-legend-section">
        <span className="filter-label">Services:</span>
        <div className="service-legend-rows">
          {Object.entries(serviceMetaMap).map(([serviceName, meta]) => (
            <div key={serviceName} className="service-legend-row">
              <span className="service-legend-icon">{meta.icon}</span> 
              <span className="service-legend-color" style={{ backgroundColor: meta.color }} />
              <span className="service-legend-name">{serviceName}</span>
            </div>
          ))}
        </div>
      </div>*/}
    </div> 
  );
};

export default ServiceLegendPanel;
