import React, { useEffect, useState } from 'react';
import { Layout, Row, Col, Table, Spin, Button, Typography, Empty, Card, Flex } from 'antd';
import BaseContainer from '../../components/core/basecontainer/basecontainer';
import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
import { TempoApi } from '../../providers';
import TraceFilters from './TraceFilters';
import dayjs from 'dayjs';
import { randomBackgroundGradient } from '../../utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PLUGIN_BASE_URL } from '../../constants';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { IoIosArrowForward,IoIosArrowDown } from "react-icons/io";

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const TraceContainer: React.FC = () => {
  const [range, setRange] = useState<[number, number]>([Date.now() - 15 * 60 * 1000, Date.now()]);
  const [traceData, setTraceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [statsData, setStatsData] = useState<any[]>([]);

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
        const stats = trace.serviceStats ?? [];

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

  const makeStats = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      setStatsData([]);
      return;
    }

    const maxLatencyRow = data.reduce((prev, curr) => (prev.durationMs > curr.durationMs ? prev : curr));

    const minLatencyRow = data.reduce((prev, curr) => (prev.durationMs < curr.durationMs ? prev : curr));

    const totalLatency = data.reduce((sum, curr) => sum + curr.durationMs, 0);
    const totalSpanCount = data.reduce((sum, curr) => sum + curr.spanCount, 0);
    const avgLatency = totalLatency / data.length;

    const statsData = [
      {
        title: 'Max Latency',
        value: maxLatencyRow.durationMs.toFixed(2),
        unit: 'ms',
        meta: `${maxLatencyRow.rootServiceName} → ${maxLatencyRow.rootTraceName}`,
      },
      {
        title: 'Min Latency',
        value: minLatencyRow.durationMs.toFixed(2),
        unit: 'ms',
        meta: `${minLatencyRow.rootServiceName} → ${minLatencyRow.rootTraceName}`,
      },
      {
        title: 'Avg Latency',
        value: avgLatency.toFixed(2),
        unit: 'ms',
      },
      {
        title: 'Total Span Count',
        value: totalSpanCount,
        unit: 'spans',
      },
    ];

    setStatsData(statsData);
    console.log('Stats Data:', statsData);
  };

 
  useEffect(() => {
    fetchTraces();
  }, [range]);

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
  ];
  const cardStyle = () => {
    return {
      background: randomBackgroundGradient(),
      color: '#fff',
      borderRadius: 10,
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
      minHeight: 160,
      maxHeight: 160,
    };
  };

  const expandedRowRender = (record: any) => {
    const stats = record.children?.filter((c: any) => c.type === 'serviceStats') || [];
    const spans = record.children?.filter((c: any) => c.type === 'span') || [];

    return (
      <div>
        {stats.length > 0 && (
          <Card style={{ marginBottom: 16 }} title="Service Stats">
            <Table
              columns={[
                { title: 'Service Name', dataIndex: 'serviceName', key: 'serviceName' },
                { title: 'Span Count', dataIndex: 'spanCount', key: 'spanCount' },
                { title: 'Duration (ms)', dataIndex: 'durationMs', key: 'durationMs' },
              ]}
              dataSource={stats}
              pagination={false}
              size="small"
              rowKey="key"
            />
          </Card>
        )}
        {spans.length > 0 && (
          <Card title="Spans">
            <Table
              columns={[
                { title: 'Span ID', dataIndex: 'spanID', key: 'spanID' },
                { title: 'Span Name', dataIndex: 'name', key: 'name' },
                { title: 'Service Name', dataIndex: 'serviceName', key: 'serviceName' },
                { title: 'Start Time', dataIndex: 'startTime', key: 'startTime' },
                { title: 'Duration (ms)', dataIndex: 'durationMs', key: 'durationMs' },
              ]}
              dataSource={spans}
              pagination={false}
              size="small"
              rowKey="key"
            />
          </Card>
        )}
      </div>
    );
  };

  return (
    <BaseContainer
      title="Traces"
      headerActions={<GrafanaLikeRangePicker title="Date Range" onChange={(start, end) => setRange([start, end])} />}
    >
      <Layout style={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
        <Sider width={300} style={{ background: '#1f1f1f', padding: 16 }} collapsedWidth={80} collapsed={collapsed}>
          <Button
            type="primary"
            icon={collapsed ? <i className="fa fa-angle-right" /> : <i className="fa fa-angle-left" />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginBottom: 16, color: '#fff', position: 'absolute', top: 16, right: collapsed ? -15 : 16 }}
          />
          <Title level={5} style={{ color: '#fff' }}>
            Filters
          </Title>
          <TraceFilters onChange={fetchTraces} collapsed={collapsed} />
        </Sider>

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
            <Spin tip="Loading traces..." />
          ) : traceData.length === 0 ? (
            <Empty description="No traces found for selected range." />
          ) : (
            <Table
              columns={columns}
              dataSource={traceData}
              expandable={{
                expandedRowRender,
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <IoIosArrowDown
                      onClick={e => onExpand(record, e)}
                      style={{ fontSize: 14, marginRight: 8 }}
                    />
                  ) : (
                    <IoIosArrowForward
                      onClick={e => onExpand(record, e)}
                      style={{ fontSize: 14, marginRight: 8 }}
                    />
                  ),
              }}
              scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              size="middle"
              bordered
            />
          )}
        </Content>
      </Layout>
    </BaseContainer>
  );
};

export default TraceContainer;
