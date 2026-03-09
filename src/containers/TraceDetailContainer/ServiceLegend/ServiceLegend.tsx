import React, { JSX, useState } from 'react';
import '../../../assets/styles/containers/trace-detail/service-legend.styles';

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

  const getButtonClassName = (type: string, color: string): string => {
    const isSelected = selectedOperationTypes.includes(type);
    if (!isSelected) {
      return 'operation-type-button';
    }
    return `operation-type-button selected selected-${color}`;
  };

  return (
    <div className="service-legend-panel">
      {
      }
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
              className={getButtonClassName(type, color)}
              onClick={() => handleOperationTypeToggle(type)}
            >
              <span className="operation-icon">{icon}</span>
              <span className="operation-type-name">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {
      }
      {
      }
    </div>
  );
};

export default ServiceLegendPanel;