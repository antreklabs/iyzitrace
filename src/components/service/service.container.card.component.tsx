import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Flex, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { prometheusApi } from '../../providers';
import { buildQuery, QueryKeys } from '../../providers/api/prometheus/prometheus.registry';
import pluginJson from '../../plugin.json';

const { Text } = Typography;
export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

interface ServiceMetricsCardProps {
  name: string;
  start?: number | undefined;
  end?: number | undefined;
}

interface LatencyData { avg: number; min: number; max: number; count: number }

const ServiceMetricsCard: React.FC<ServiceMetricsCardProps> = ({ name, start, end }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<LatencyData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
        try {
          setLoading(true);

          const startMs = start;
          const endMs = end;
          const fixedStart = Math.floor(startMs / 1000);
          const fixedEnd = Math.floor(endMs / 1000);
          const maxPoints = 1;
          const step = Math.max(Math.ceil((fixedEnd - fixedStart) / maxPoints), 60);
          
          const ctx: any = { serviceName: name };
          const [countRes, avgRes, minRes, maxRes] = await Promise.all([
            prometheusApi.runTraceQlQueryRange(await buildQuery(QueryKeys.totalTraceCount, ctx), fixedStart, fixedEnd, step + 's'),
            prometheusApi.runTraceQlQueryRange(await buildQuery(QueryKeys.avgLatency, ctx), fixedStart, fixedEnd, step + 's'),
            prometheusApi.runTraceQlQueryRange(await buildQuery(QueryKeys.minLatency, ctx), fixedStart, fixedEnd, step + 's'),
            prometheusApi.runTraceQlQueryRange(await buildQuery(QueryKeys.maxLatency, ctx), fixedStart, fixedEnd, step + 's'),
          ]);

          if(countRes.length > 0 && avgRes.length > 0 && minRes.length > 0 && maxRes.length > 0
            && countRes[0].values.length > 0 && avgRes[0].values.length > 0 && minRes[0].values.length > 0 && maxRes[0].values.length > 0
          ){
            let countValue = countRes[0].values[0][1];
            console.log('countValue', countValue);
            let avgLatencyValue = avgRes[0].values[0][1];
            let minLatencyValue = minRes[0].values[0][1];
            let maxLatencyValue = maxRes[0].values[0][1];
              
  
            const count = parseInt(countValue.toString(), 10);
            const avgLatency = parseFloat(avgLatencyValue.toString());
            const minLatency = parseFloat(minLatencyValue.toString());
            const maxLatency = parseFloat(maxLatencyValue.toString());
  
            
            setMetrics({ avg: avgLatency, min: minLatency, max: maxLatency, count });
          }
          else{
            setMetrics({ avg: 0, min: 0, max: 0, count: 0 });
          }

      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [name, start, end]);

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
            <Text strong>{makeServiceName(name)}</Text>
          </Flex>
        }
        onClick={() => navigate(`${PLUGIN_BASE_URL}/services/${name}`)}
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

        <Button style={{ marginTop: 12, width: '100%' }} onClick={(e) => { e.stopPropagation(); navigate(`${PLUGIN_BASE_URL}/services/${name}`); }}>
          View full details
        </Button>
      </Card>
    </div>
  );
};

export default ServiceMetricsCard;


