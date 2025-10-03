import React from 'react';
import '../../assets/styles/pages/log/log.expanded-row.css';

interface LogExpandedRowProps {
  record: any;
}

const LogExpandedRowComponent: React.FC<LogExpandedRowProps> = ({ record }) => {
  // Extract attributes from record
  const attributes = record.attributes || {};

  // Basic fields with null checks
  const basicFields = [
    { label: 'Log ID', value: record.id },
    { label: 'Timestamp', value: record.timestamp ? new Date(record.timestamp).toLocaleString() : null },
    { label: 'Level', value: record.level || attributes.detected_level },
    { label: 'Service', value: record.service || attributes.service_name },
    { label: 'Service Instance ID', value: attributes.service_instance_id },
    { label: 'Service Namespace', value: attributes.service_namespace },
    { label: 'Service Version', value: attributes.service_version },
    { label: 'Process ID', value: attributes.process_pid },
    { label: 'Host Name', value: attributes.host_name },
    { label: 'Container ID', value: attributes.container_id?.substring(0, 12) }
  ].filter(field => field.value != null);

  // Runtime fields with null checks
  const runtimeFields = [
    { label: 'Runtime Name', value: attributes.process_runtime_name },
    { label: 'Runtime Version', value: attributes.process_runtime_version },
    { label: 'Runtime Description', value: attributes.process_runtime_description },
    { label: 'OS Type', value: attributes.os_type },
    { label: 'OS Description', value: attributes.os_description },
    { label: 'Architecture', value: attributes.host_arch }
  ].filter(field => field.value != null);

  // Telemetry fields with null checks
  const telemetryFields = [
    { label: 'Telemetry SDK', value: attributes.telemetry_sdk_name },
    { label: 'SDK Version', value: attributes.telemetry_sdk_version },
    { label: 'SDK Language', value: attributes.telemetry_sdk_language },
    { label: 'Distro Name', value: attributes.telemetry_distro_name },
    { label: 'Distro Version', value: attributes.telemetry_distro_version }
  ].filter(field => field.value != null);

  return (
    <div className="log-expanded-row-container">
      {/* Message Section */}
      {record.message && (
        <div>
          <h5 className="log-expanded-row-message-title">Message</h5>
          <div className="log-expanded-row-message-content">
            {record.message}
          </div>
        </div>
      )}

      {/* Telemetry Information */}
      {telemetryFields.length > 0 && (
        <div className="log-expanded-row-telemetry-section">
          <h5 className="log-expanded-row-telemetry-title">Telemetry Information</h5>
          <div className="log-expanded-row-telemetry-badges">
            {telemetryFields.map(field => (
              <span key={field.label} className="log-expanded-row-telemetry-badge">
                <strong className="log-expanded-row-telemetry-badge-label">{field.label}:</strong> {field.value}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="log-expanded-row-grid">
        {/* Left Column: Basic Information and Runtime Information */}
        <div className="log-expanded-row-left-column">
          {/* Basic Information */}
          <div>
            <h5 className="log-expanded-row-section-title">Basic Information</h5>
            {basicFields.map(field => (
              <p key={field.label} className="log-expanded-row-field">
                <strong className="log-expanded-row-field-label">{field.label}:</strong>
                {field.label === 'Level' ? (
                  <span className={
                    field.value === 'ERROR' ? 'log-expanded-row-level-error' : 
                    field.value === 'WARN' ? 'log-expanded-row-level-warn' : 
                    field.value === 'INFO' ? 'log-expanded-row-level-info' : 'log-expanded-row-level-debug'
                  }>
                    {field.value}
                  </span>
                ) : (
                  <span className="log-expanded-row-field-value">{field.value}</span>
                )}
              </p>
            ))}
          </div>

          {/* Runtime Information */}
          {runtimeFields.length > 0 && (
          <div className="log-expanded-row-runtime-section">
            <h5 className="log-expanded-row-section-title">Runtime Information</h5>
              {runtimeFields.map(field => (
                <p key={field.label} className="log-expanded-row-field">
                  <strong className="log-expanded-row-field-label">{field.label}:</strong>
                  <span className="log-expanded-row-field-value">{field.value}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Additional Attributes */}
        {Object.keys(attributes).length > 0 && (
          <div className="log-expanded-row-right-column">
            <h5 className="log-expanded-row-section-title">Additional Attributes</h5>
            <div className="log-expanded-row-attributes-container">
              {Object.entries(attributes)
                .filter(([key]) => !basicFields.some(f => f.value === attributes[key]) && 
                                 !runtimeFields.some(f => f.value === attributes[key]) && 
                                 !telemetryFields.some(f => f.value === attributes[key]))
                .map(([key, value], index, array) => (
                  <div key={key} className="log-expanded-row-attribute-item">
                    <div className="log-expanded-row-attribute-key">{key}</div>
                    <div className="log-expanded-row-attribute-value">{value as string}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogExpandedRowComponent;
