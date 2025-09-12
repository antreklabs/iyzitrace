// src/components/ServiceCard.tsx
import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Flex } from 'antd';
import { prometheusApi } from '../../../providers';
import { createGradient, randomBackgroundGradient } from '../../../utils';
import { ServiceIcon } from '../../../components/core/serviceicons';
import { useNavigate } from 'react-router-dom';
import pluginJson from '../../../plugin.json';
const { Text } = Typography;
export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;
interface ServiceCardProps {
  name: string;
  start: number;
  end: number;
  colors?: string[]
}

const ServiceCard: React.FC<ServiceCardProps> = ({ name, start, end,colors }) => {
  const [latency, setLatency] = useState<{avg: number, min: number, max: number, count: number} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const cardStyle = {
    background: colors?createGradient(colors[0],colors[1]) :randomBackgroundGradient(),
    color: '#fff',
    borderRadius: 10,
    padding: '16px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  };

  useEffect(() => {
    const fetchLatency = async () => {
      try {
        setLoading(true);
        const totalTraceQuery = `sum(rate(traces_spanmetrics_calls_total{service="${name}"}[5m])) * 300`;

        const avgLatencyQuery = `sum(rate(traces_spanmetrics_latency_sum{service="${name}"}[5m])) / sum(rate(traces_spanmetrics_latency_count{service="${name}"}[5m]))`;
        const minLatencyQuery = `min(rate(traces_spanmetrics_latency_bucket{service="${name}"}[5m]))`;
        const maxLatencyQuery = `histogram_quantile(0.99, sum(rate(traces_spanmetrics_latency_bucket{service="${name}"}[5m])) by (le))`;

        const [totalTraceResponse, avgLatencyResponse, minLatencyResponse, maxLatencyResponse] = await Promise.all([
          prometheusApi.runTraceQLQuery(totalTraceQuery),
          prometheusApi.runTraceQLQuery(avgLatencyQuery),
          prometheusApi.runTraceQLQuery(minLatencyQuery),
          prometheusApi.runTraceQLQuery(maxLatencyQuery),
        ]);
        const totalTraceValue = totalTraceResponse[0]?.value[1] || 0;
        const avgLatencyValue = avgLatencyResponse[0]?.value[1] || 0;
        const minLatencyValue = minLatencyResponse[0]?.value[1] || 0;
        const maxLatencyValue = maxLatencyResponse[0]?.value[1] || 0;

        const value = {
          avg: parseFloat(avgLatencyValue),
          min: parseFloat(minLatencyValue),
          max: parseFloat(maxLatencyValue),
          count: parseInt(totalTraceValue, 10),
        };

        console.log('Latency values:', value);

        setLatency(value);
      } catch (err) {
        setLatency(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLatency();
  }, [name, start, end]);

  const makeServiceName = (name: string) => {
    const parts = name.split('-');
    if (parts.length > 1) {
      return parts.slice(0, -1).join(' -').toUpperCase() + ' ' + parts[parts.length - 1].toUpperCase();
    }
    return name.toUpperCase();
  };
  const handleServiceClick = (path: string) => {
    navigate(`${PLUGIN_BASE_URL}${path}`);
  };


  return (
    <Card
      hoverable
      title={
        <Flex gap={8}>
          <ServiceIcon name={name} size={30} />
          <Text strong>{makeServiceName(name)}</Text>
        </Flex>
      }
      size="small"
      style={cardStyle}
      onClick={()=>{
        handleServiceClick(`/services/${name}`);
      }}
    >
      {loading ? (
        <Spin size="small" />
      ) : (
        <Flex vertical>
          <Text style={{color:"#000",fontWeight:"bolder" }}>Avg. Lat: {latency != null && latency.avg ? `${latency.avg.toFixed(2)} ms` : '—'}</Text>
          <Text style={{ marginLeft: '8px',color:"#000",fontWeight:"bolder" }}>
            Min. Lat: {latency != null && latency.min ? `${latency.min.toFixed(2)} ms` : '—'}
          </Text>
          <Text style={{ marginLeft: '8px',color:"#000",fontWeight:"bolder"}}>
            Max. Lat : {latency != null && latency.max ? `${latency.max.toFixed(2)} ms` : '—'}
          </Text>
          <Text style={{ marginLeft: '8px',color:"#000",fontWeight:"bolder" }}>Count: {latency != null && latency.max ? `${latency.count}` : '—'}</Text>
        </Flex>
      )}
    </Card>
  );
};

export default ServiceCard;
