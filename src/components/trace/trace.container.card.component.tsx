import { Card, Flex } from 'antd';
import React, { useMemo } from 'react';
import { Typography } from 'antd';
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
  chartData?: number[];
}

const TraceMetricsCard: React.FC<TraceMetricsCardProps> = ({ title, value, unit, meta, traceID, serviceName, chartData }) => {
  const chartBars = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    
    const maxValue = Math.max(...chartData);
    const minValue = Math.min(...chartData);
    const range = maxValue - minValue || 1;
    
    const colors = [
      '#52c41a', '#13c2c2', '#2f54eb', '#fa8c16', '#eb2f96', '#a0d911', '#36cfc9', '#597ef7', '#ffa940', '#f759ab',
      '#95de64', '#5cdbd3', '#85a5ff', '#ffbb96', '#ff85c0', '#73d13d', '#69c0ff', '#d3f261', '#ffd666', '#ff7875'
    ];
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'end', 
        height: '100px', 
        gap: '1px',
        marginTop: '8px',
        padding: '4px 0'
      }}>
        {chartData.slice(0,50).map((val, index) => {
          const height = range > 0 ? ((val - minValue) / range) * 100 : 50; // Eğer range 0 ise %50 yükseklik
          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${Math.max(height, 2)}%`,
                backgroundColor: colors[index % colors.length],
                opacity: 0.7,
                borderRadius: '1px',
                minHeight: '2px'
              }}
            />
          );
        })}
      </div>
    );
  }, [chartData]);

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
                {(() => {
                  const numValue = parseFloat(String(value));
                  if (numValue >= 1000000) {
                    return `${(numValue / 1000000).toFixed(2)} M ${unit}`;
                  } else if (numValue >= 1000) {
                    return `${(numValue / 1000).toFixed(2)} K ${unit}`;
                  } else {
                    return `${numValue.toFixed(2)} ${unit}`;
                  }
                })()}
              </Text>
            </div>
          </div>
        </Flex>
        {chartBars}
        {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 12 }}>
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
        </div> */}
      </Card>
    </div>
  );
};

export default TraceMetricsCard;


