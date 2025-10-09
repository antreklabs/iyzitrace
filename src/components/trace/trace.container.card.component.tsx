import { Button, Card, Flex } from 'antd';
import React from 'react';
import { Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import pluginJson from '../../plugin.json';

const { Text } = Typography;
export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

interface TraceMetricsCardProps {
  title: string;
  value: number;
  unit: string;
  meta?: string;
  traceID?: string;
  serviceName?: string;
}

const TraceMetricsCard: React.FC<TraceMetricsCardProps> = ({ title, value, unit, meta, traceID, serviceName }) => {
  const navigate = useNavigate();

  return (
    <div>
      <Card
        hoverable
        size="small"
        style={{ borderRadius: 12, marginBottom: 12, background: '#141414', border: '1px solid #2a2a2a', width: '250px', minHeight: '180px' }}
        title={
          <Flex gap={8} align="center">
            <Text strong>{title}</Text>
          </Flex>
        }
      >
        <Flex gap={16} align="center">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 8 }}>
            <div>
              <Text style={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold', lineHeight: 1 }}>
                {value} {unit}
              </Text>
            </div>
          </div>
        </Flex>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 12 }}>
          {traceID && (
            <Button style={{ width: '100%' }} onClick={(e) => { 
              e.stopPropagation(); 
              navigate(`${PLUGIN_BASE_URL}/traces/${traceID}`); 
            }}>
              View Trace
            </Button>
          )}
          {serviceName && (
            <Button style={{ width: '100%' }} onClick={(e) => { 
              e.stopPropagation(); 
              navigate(`${PLUGIN_BASE_URL}/services/${serviceName}`); 
            }}>
              View {serviceName}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TraceMetricsCard;


