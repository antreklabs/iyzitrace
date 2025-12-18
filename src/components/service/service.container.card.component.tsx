import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Flex, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import pluginJson from '../../plugin.json';
import { Service } from '../../api/service/interface.service';

const { Text } = Typography;
export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

interface ServiceMetricsCardProps {
  service: Service;
}

interface LatencyData { avg: number; min: number; max: number; count: number }

const ServiceMetricsCard: React.FC<ServiceMetricsCardProps> = ({ service }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<LatencyData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
        try {
          setLoading(true);
          setMetrics({ avg: service.metrics.avgDurationMs, min: service.metrics.minDurationMs, max: service.metrics.maxDurationMs, count: service.metrics.callsCount });

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [service]);

  const makeServiceName = (value: string) => {
    const safe = typeof value === 'string' ? value : String(value ?? '');
    const parts = safe.split('-');
    if (parts.length > 1) {
      return parts.slice(0, -1).join(' -').toUpperCase() + ' ' + parts[parts.length - 1].toUpperCase();
    }
    return safe.toUpperCase();
  };

  const formatLatency = (v?: number) => {
    const value = typeof v === 'number' ? v : 0;
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} s`;
    }
    return `${value.toFixed(2)} ms`;
  };

  return (
    <div>
      <Card
        hoverable
        size="small"
        style={{ borderRadius: 12, marginBottom: 12, background: '#141414', border: '1px solid #2a2a2a', width: '180px' }}
        title={
          <Flex gap={8} align="center">
            <Text strong>{makeServiceName(service.name)}</Text>
          </Flex>
        }
        onClick={() => navigate(`${PLUGIN_BASE_URL}/services/${service.id}`)}
      >
        {loading ? (
          <Flex justify="center"><Spin size="small" /></Flex>
        ) : (
          <Flex gap={16} align="center">
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 8 }}>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>Avg. Lat</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{metrics ? formatLatency(metrics.avg) : '—'}</div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>Min. Lat</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{metrics ? formatLatency(metrics.min) : '—'}</div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>Max. Lat</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{metrics ? formatLatency(metrics.max) : '—'}</div>
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>Count</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{metrics ? metrics.count : '—'}</div>
              </div>
            </div>
          </Flex>
        )}

        <Button style={{ marginTop: 12, width: '100%' }} onClick={(e) => { e.stopPropagation(); navigate(`${PLUGIN_BASE_URL}/services/${service.id}`); }}>
          View full details
        </Button>
      </Card>
    </div>
  );
};

export default ServiceMetricsCard;