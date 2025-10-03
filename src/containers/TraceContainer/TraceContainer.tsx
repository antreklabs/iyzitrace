import React, { useEffect, useState } from 'react';
import { Layout, Row, Col, Table, Spin, Typography, Empty, Card, Flex } from 'antd';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
import { TempoApi } from '../../providers';
import TraceFilters from './TraceFilters';
import FiltersSider from '../../components/core/layout/filters-sider.component';
import dayjs from 'dayjs';
import { randomBackgroundGradient } from '../../utils';
import { Link } from 'react-router-dom';
import { PLUGIN_BASE_URL } from '../../constants';
import { IoIosArrowForward,IoIosArrowDown } from "react-icons/io";
import { useAppSelector } from '../../store/hooks';

const { Content } = Layout;
const { Text } = Typography;

interface TraceContainerProps {
  traceId?: string | null;
}

const TraceContainer: React.FC<TraceContainerProps> = ({ traceId }) => {
  const [range, setRange] = useState<[number, number]>([Date.now() - 15 * 60 * 1000, Date.now()]);
  const [traceData, setTraceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [statsData, setStatsData] = useState<any[]>([]);
  const { selectedUid } = useAppSelector((state) => state.datasource);

  // traceId prop'u geldiğinde otomatik arama yap
  useEffect(() => {
    if (traceId) {
      fetchSpecificTrace(traceId);
    }
  }, [traceId, selectedUid]);

  const fetchSpecificTrace = async (traceId: string) => {
    setLoading(true);
    try {
      // Belirli bir trace ID'si için arama yap
      const res = await TempoApi.searchTraceQL({
        query: `{traceId="${traceId}"}`,
        start: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000), // Son 24 saat
        end: Math.floor(Date.now() / 1000),
        limit: 1,
      });

      if (res.traces && res.traces.length > 0) {
        const trace = res.traces[0];
        const spans = trace.spanSets?.[0]?.spans ?? [];
        const mappedTrace = {
          ...trace,
          spans: spans,
          duration: trace.durationMs,
          serviceCount: new Set(spans.map((span: any) => span.serviceName)).size,
          spanCount: spans.length,
        };
        setTraceData([mappedTrace]);
      } else {
        setTraceData([]);
      }
    } catch (error) {
      console.error('Error fetching specific trace:', error);
      setTraceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTraces = async () => {
    setLoading(true);
    try {
      const [start, end] = range;
      const res = await TempoApi.searchTraceQL({
        query: '{}',
        start: Math.floor(start / 1000),
        end: Math.floor(end / 1000),
        limit: 100,
      });

      const mapped = res.traces.map((trace: any) => {
        const spans = trace.spanSets?.[0]?.spans ?? [];

        const serviceStatsChildren = Object.entries(trace.serviceStats || {}).map(
          ([serviceName, s]: any, i: number) => ({
            key: `${trace.traceID}-stat-${i}`,
            type: 'serviceStats',
            serviceName,
            spanCount: s.spanCount,
            durationMs: s.sumDurationNanos / 1e6,
          })
        );

        const spanChildren = spans.map((span: any, i: number) => ({
          key: `${trace.traceID}-span-${i}`,
          type: 'span',
          spanID: span.spanID,
          name: span.name,
          serviceName: span.serviceName,
          startTime: dayjs(Number(span.startTimeUnixNano) / 1e6).format('YYYY-MM-DD HH:mm:ss.SSS'),
          durationMs: Number(span.durationNanos) / 1e6,
        }));

        return {
          key: trace.traceID,
          traceID: trace.traceID,
          rootServiceName: trace.rootServiceName,
          rootTraceName: trace.rootTraceName,
          spanCount: trace.spanCount,
          durationMs: trace.durationMs,
          startTimeUnixNano: trace.startTimeUnixNano,
          endTimeUnixNano: trace.startTimeUnixNano + trace.durationMs * 1e6,
          children: [...serviceStatsChildren, ...spanChildren],
        };
      });

      setTraceData(mapped);
      makeStats(mapped);
    } catch (err) {
      console.error('Trace fetch failed:', err);
      setTraceData([]);
    } finally {
      setLoading(false);
    }
  };

  const makeStats = (data: any) => {
    if (!Array.isArray(data) || data.length === 0) {
      setStatsData([]);
      return;
    }

    // Filter out items with invalid durationMs
    const validData = data.filter(item => item && typeof item.durationMs === 'number' && !isNaN(item.durationMs));
    
    if (validData.length === 0) {
      setStatsData([]);
      return;
    }

    const maxLatencyRow = validData.reduce((prev, curr) => (prev.durationMs > curr.durationMs ? prev : curr));
    const minLatencyRow = validData.reduce((prev, curr) => (prev.durationMs < curr.durationMs ? prev : curr));
    const totalLatency = validData.reduce((sum, curr) => sum + (curr.durationMs || 0), 0);
    const totalSpanCount = validData.reduce((sum, curr) => sum + (curr.spanCount || 0), 0);
    const avgLatency = totalLatency / validData.length;

    const statsData = [
      {
        title: 'Max Latency',
        value: (maxLatencyRow?.durationMs || 0).toFixed(2),
        unit: 'ms',
        meta: `${maxLatencyRow?.rootServiceName || 'Unknown'} → ${maxLatencyRow?.rootTraceName || 'Unknown'}`,
      },
      {
        title: 'Min Latency',
        value: (minLatencyRow?.durationMs || 0).toFixed(2),
        unit: 'ms',
        meta: `${minLatencyRow?.rootServiceName || 'Unknown'} → ${minLatencyRow?.rootTraceName || 'Unknown'}`,
      },
      {
        title: 'Avg Latency',
        value: (avgLatency || 0).toFixed(2),
        unit: 'ms',
      },
      {
        title: 'Total Span Count',
        value: totalSpanCount,
        unit: 'spans',
      },
    ];

    setStatsData(statsData);
  };

 
  useEffect(() => {
    fetchTraces();
  }, [range, selectedUid]);

  const columns = [
    {
      title: 'Trace ID',
      dataIndex: 'traceID',
      key: 'traceID',
      width: 200,
      render: (text: string) => <Link to={`${PLUGIN_BASE_URL}/traces/${text}`}>{text}</Link>,
    },
    { title: 'Service', dataIndex: 'rootServiceName', key: 'rootServiceName', width: 200 },
    { title: 'Trace Name', dataIndex: 'rootTraceName', key: 'rootTraceName', width: 200 },
    { title: 'Span Count', dataIndex: 'spanCount', key: 'spanCount', width: 100 },
    { title: 'Duration (ms)', dataIndex: 'durationMs', key: 'durationMs', width: 150 },
    {
      title: 'Start Time',
      dataIndex: 'startTimeUnixNano',
      key: 'startTimeUnixNano',
      width: 200,
      render: (text: string) => <span>{dayjs(text).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: 'End Time',
      dataIndex: 'endTimeUnixNano',
      key: 'endTimeUnixNano',
      width: 200,
      render: (text: string) => <span>{dayjs(text).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: 'Details',
      key: 'expand',
      width: 80,
      render: (_: any, record: any) => {
        const isExpanded = expandedRowKeys.includes(record.key);
        return (
          <div onClick={() => handleExpand(!isExpanded, record)} style={{ cursor: 'pointer' }}>
            {isExpanded ? (
              <IoIosArrowDown style={{ fontSize: 14 }} />
            ) : (
              <IoIosArrowForward style={{ fontSize: 14 }} />
            )}
          </div>
        );
      },
    },
  ];
  const cardStyle = () => {
    return {
      background: randomBackgroundGradient(),
      color: '#fff',
      borderRadius: 10,
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      minHeight: 160,
      maxHeight: 160,
    };
  };

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const handleExpand = (expanded: boolean, record: any) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.key]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.key));
    }
  };

  const renderExpandedContent = (record: any) => {
    const stats = record.children?.filter((c: any) => c.type === 'serviceStats') || [];
    const spans = record.children?.filter((c: any) => c.type === 'span') || [];

    return (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5' }}>
        {stats.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ marginBottom: 8, color: '#1890ff' }}>Service Stats</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              {stats.map((stat: any, index: number) => (
                <div key={index} style={{ 
                  padding: '8px', 
                  backgroundColor: '#fff', 
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }}>
                  <div><strong>Service:</strong> {stat.serviceName}</div>
                  <div><strong>Spans:</strong> {stat.spanCount}</div>
                  <div><strong>Duration:</strong> {stat.durationMs?.toFixed(2) || '0.00'} ms</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {spans.length > 0 && (
          <div>
            <h4 style={{ marginBottom: 8, color: '#1890ff' }}>Spans</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '8px' }}>
              {spans.map((span: any, index: number) => (
                <div key={index} style={{ 
                  padding: '12px', 
                  backgroundColor: '#fff', 
                  borderRadius: '4px',
                  border: '1px solid #d9d9d9'
                }}>
                  <div><strong>ID:</strong> {span.spanID}</div>
                  <div><strong>Name:</strong> {span.name}</div>
                  <div><strong>Service:</strong> {span.serviceName}</div>
                  <div><strong>Start:</strong> {span.startTime}</div>
                  <div><strong>Duration:</strong> {span.durationMs?.toFixed(2) || '0.00'} ms</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseContainer
      title="Traces"
      headerActions={
        <GrafanaLikeRangePicker 
          onChange={(start, end) => setRange([start, end])} 
          onApply={(start, end) => {
            setRange([start, end]);
            // TODO: Fetch data with new range
          }}
          value={range}
          title="Date Range" 
        />
      }
    >
      <Layout style={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
        <FiltersSider title="Filters" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
          <TraceFilters onChange={fetchTraces} collapsed={collapsed} />
        </FiltersSider>

        <Content style={{ padding: 24 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            {statsData.map((stat) => (
              <Col key={stat.title} span={6}>
                <Card
                  hoverable
                  title={
                    <Flex gap={8}>
                      <Text strong>{stat.title}</Text>
                    </Flex>
                  }
                  size="small"
                  style={cardStyle()}
                >
                  {loading ? (
                    <Spin size="small" />
                  ) : (
                    <Flex vertical>
                      <Text style={{ fontSize: 30, fontWeight: 'bolder' }}>
                        {stat.value} {stat.unit}
                      </Text>
                      {stat.meta && (
                        <Text type="secondary" style={{ color: '#000', fontWeight: 900 }}>
                          {stat.meta}
                        </Text>
                      )}
                    </Flex>
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <Spin size="large" />
              <span style={{ marginLeft: '8px' }}>Loading traces...</span>
            </div>
          ) : traceData.length === 0 ? (
            <Empty description="No traces found for selected range." />
          ) : (
            <div>
              <Table
                columns={columns}
                dataSource={traceData}
                scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }}
                size="middle"
                bordered
                rowKey="key"
              />
              
              {/* Render expanded content for each expanded row */}
              {expandedRowKeys.map(key => {
                const record = traceData.find(item => item.key === key);
                if (!record) return null;
                
                return (
                  <div key={`expanded-${key}`} style={{ marginTop: '8px' }}>
                    {renderExpandedContent(record)}
                  </div>
                );
              })}
            </div>
          )}
        </Content>
      </Layout>
    </BaseContainer>
  );
};

export default TraceContainer;
