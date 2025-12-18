import { Card, Flex, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { Typography } from 'antd';
import pluginJson from '../../plugin.json';

const { Text } = Typography;
export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

interface TraceMetricsCardProps {
  title: string;
  value: number;
  unit: string;
  chartData?: number[];
}

const TraceMetricsCard: React.FC<TraceMetricsCardProps> = ({ title, value, unit, chartData }) => {
  const formatValue = (numValue: number, unitStr: string): string => {
    if (unitStr === 'ms') {
      const absVal = Math.abs(numValue);
      
      if (absVal === 0) return '0 ms';
      if (absVal < 1000) return `${numValue.toFixed(2)} ms`;
      if (absVal < 60000) return `${(numValue / 1000).toFixed(2)} s`;
      if (absVal < 3600000) return `${(numValue / 60000).toFixed(2)} min`;
      if (absVal < 86400000) return `${(numValue / 3600000).toFixed(2)} h`;
      return `${(numValue / 86400000).toFixed(2)} d`;
    }
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(2)} M ${unitStr}`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(2)} K ${unitStr}`;
    } else {
      return `${numValue.toFixed(2)} ${unitStr}`;
    }
  };

  const chartBars = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    
    const maxValue = Math.max(...chartData);
    const minValue = Math.min(...chartData);
    const range = maxValue - minValue;
    
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
          let height: number;
          if (range === 0) {
            height = 100;
          } else {
            height = ((val - minValue) / range) * 100;
            height = Math.max(height, 5);
          }
          
          const formattedValue = formatValue(val, unit);
          
          return (
            <Tooltip
              key={index}
              title={`${title}: ${formattedValue}`}
              placement="top"
            >
              <div
                style={{
                  flex: 1,
                  height: `${height}%`,
                  backgroundColor: colors[index % colors.length],
                  opacity: 0.7,
                  borderRadius: '1px',
                  minHeight: '3px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s, transform 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'scaleY(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                  e.currentTarget.style.transform = 'scaleY(1)';
                }}
              />
            </Tooltip>
          );
        })}
      </div>
    );
  }, [chartData, title, unit]);

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
                {formatValue(parseFloat(String(value)), unit)}
              </Text>
            </div>
          </div>
        </Flex>
        {chartBars}
        {
}
      </Card>
    </div>
  );
};

export default TraceMetricsCard;