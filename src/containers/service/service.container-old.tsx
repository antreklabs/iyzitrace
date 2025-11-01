import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Select } from 'antd';
import ApexCharts from 'react-apexcharts';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import ServiceFilter from '../../components/service/service.filter';
// import ServiceExpandedRowComponent from '../../components/service/service.container.expanded-row.component';
// import ServiceMetricsCard from '../../components/service/service.container.card.component';
import { tempoReadApi } from '../../providers/api/tempo/tempo.api.read';
import { ServiceItem } from '../../interfaces/pages/service/service.response.interface';
import { prometheusApi } from '../../providers/api/prometheus/prometheus.api';
import { buildQuery, QueryKeys } from '../../providers/api/prometheus/prometheus.registry';
import { TableColumn } from '../../api/service/table.services';
import { FilterParamsModel } from '../../api/service/query.service';

const ServiceContainerOld: React.FC = () => {
  const [services, setServices] = useState<string[]>([]);
  const [durationMetric, setDurationMetric] = useState<string>('Avg');
  const navigate = useNavigate();

  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const values = await tempoReadApi.getLabelValues('service.name');
    const raw: any[] = Array.isArray(values) ? values : [];
    let serviceNames: string[] = raw.map((s: any) =>
      typeof s === 'string' ? s : (s?.text ?? s?.value ?? String(s))
    );
    setServices(serviceNames);

    const startMs = 0;
    const endMs = 0;
    const fixedStart = Math.floor(startMs / 1000);
    const fixedEnd = Math.floor(endMs / 1000);
    const maxPoints = 1;
    const step = Math.max(Math.ceil((fixedEnd - fixedStart) / maxPoints), 60);

    const response: ServiceItem[] = [];
    
    for (const name of serviceNames) {
      const ctx: any = { serviceName: name, windowSeconds: step };
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
          // console.log('countValue', countValue);
          let avgLatencyValue = avgRes[0].values[0][1];
          let minLatencyValue = minRes[0].values[0][1];
          let maxLatencyValue = maxRes[0].values[0][1];
            

          const count = parseInt(countValue.toString(), 10);
          const avgLatency = parseFloat(avgLatencyValue.toString());
          const minLatency = parseFloat(minLatencyValue.toString());
          const maxLatency = parseFloat(maxLatencyValue.toString());

          response.push({ id: name, service: name, 
            avgLatency, 
            minLatency, 
            maxLatency, 
            count
          });
        }
        else{
          response.push({ id: name, service: name, 
            avgLatency: 0, 
            minLatency: 0, 
            maxLatency: 0, 
            count: 0
          });
        }
    }

    return { data: response, columns: columns };
  };

  // const expandedRowRender = (record: any) => {
  //   const start = 0;
  //   const end = 0;
  //   return <ServiceExpandedRowComponent record={record} start={start} end={end} />;
  // };

  const columns: TableColumn = {
    RootColumns: [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 220,
      sorter: (a: ServiceItem, b: ServiceItem) => a.service.localeCompare(b.service),
      render: (service: string) => (
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(`/a/iyzitrace-app/services/${service}`)}>
          {service}
        </span>
      ),
    },
    { title: 'Avg. Latency', dataIndex: 'avgLatency', key: 'avgLatency', width: 140, sorter: (a: any, b: any) => (a.avgLatency ?? 0) - (b.avgLatency ?? 0), render: (v: number) => `${(v ?? 0).toFixed(2)} ms` },
    { title: 'Min. Latency', dataIndex: 'minLatency', key: 'minLatency', width: 140, sorter: (a: any, b: any) => (a.minLatency ?? 0) - (b.minLatency ?? 0), render: (v: number) => `${(v ?? 0).toFixed(2)} ms` },
    { title: 'Max. Latency', dataIndex: 'maxLatency', key: 'maxLatency', width: 140, sorter: (a: any, b: any) => (a.maxLatency ?? 0) - (b.maxLatency ?? 0), render: (v: number) => `${(v ?? 0).toFixed(2)} ms` },
    { title: 'Count', dataIndex: 'count', key: 'count', width: 100, sorter: (a: any, b: any) => (a.count ?? 0) - (b.count ?? 0) },
  ]
};

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <BaseContainerComponent
      title="Services"
      initialFilterCollapsed={true}
      onFetchData={fetchModelData}
      filterComponent={<ServiceFilter onChange={fetchModelData} columns={columns.RootColumns} />}
    >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => scrollBy(-400)}
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
          >
            ◀
          </button>
          <div
            ref={scrollerRef}
            style={{ overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', padding: '0 36px' }}
          >
            {/* <div style={{ display: 'inline-flex', gap: 16 }}>
            {services.map((service) => {
                const start = 0;
                const end = 0;
                return (
                  <div key={service}>
                    <ServiceMetricsCard name={service} start={start} end={end} />
                  </div>
                );
              })}
            </div> */}
          </div>
          <button
            onClick={() => scrollBy(400)}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
          >
            ▶
          </button>
        </div>
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            {/* Requests Chart */}
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Requests</span>
                  </div>
                }
                style={{ height: '300px' }}
                styles={{ body: { height: '250px', padding: '16px' } }}
              >
                <RequestsChart services={services} />
              </Card>
            </Col>

            {/* Errors Chart */}
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Errors</span>
                  </div>
                }
                style={{ height: '300px' }}
                styles={{ body: { height: '250px', padding: '16px' } }}
              >
                <ErrorsChart services={services} />
              </Card>
            </Col>

            {/* Duration Chart */}
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Duration</span>
                      <Select
                        value={durationMetric}
                        onChange={setDurationMetric}
                        style={{ width: '80px' }}
                        dropdownStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #303030' }}
                        options={[
                          { value: 'p99', label: 'p99' },
                          { value: 'p95', label: 'p95' },
                          { value: 'p90', label: 'p90' },
                          { value: 'p75', label: 'p75' },
                          { value: 'p50', label: 'p50' },
                          { value: 'Avg', label: 'Avg' },
                        ]}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      
                    </div>
                  </div>
                }
                style={{ height: '300px' }}
                styles={{ body: { height: '250px', padding: '16px' } }}
              >
                <DurationChart services={services} metric={durationMetric} />
              </Card>
            </Col>
          </Row>
        </div>
    </BaseContainerComponent>
  );
};

// Chart Components
const RequestsChart: React.FC<{ services: string[] }> = ({ services }) => {
  const chartData = useMemo(() => {
    const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#6B7280', '#EC4899', '#10B981', '#F97316', '#6366F1', '#84CC16', '#EF4444'];
    
    return services.slice(0, 10).map((service, index) => ({
      name: service,
      data: Array.from({ length: 20 }, (_, i) => ({
        x: new Date(Date.now() - (19 - i) * 60000), // Last 20 minutes
        y: Math.floor(Math.random() * 2000) + 100, // Random requests between 100-2100
      })),
      color: colors[index % colors.length],
    }));
  }, [services]);

  const options = {
    chart: {
      type: 'bar' as const,
      height: 200,
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: false },
      stacked: true,
    },
    colors: chartData.map(d => d.color),
    fill: {
      type: 'solid',
      opacity: 1,
    },
    stroke: { width: 2, curve: 'smooth' as const },
    xaxis: { 
      type: 'datetime' as const,
      labels: { style: { colors: '#8c8c8c' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { 
        style: { colors: '#8c8c8c' },
        formatter: (val: number) => val >= 1000 ? `${(val/1000).toFixed(1)}K` : val.toString(),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { borderColor: '#303030', strokeDashArray: 4 },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom' as const,
      labels: { colors: '#8c8c8c' },
      markers: { size: 8 },
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    tooltip: {
      theme: 'dark' as const,
      y: { formatter: (val: number) => `${val} requests` },
    },
  };

  return <ApexCharts options={options} series={chartData} type="bar" height={200} />;
};

const ErrorsChart: React.FC<{ services: string[] }> = ({ services }) => {
  const chartData = useMemo(() => {
    const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#6B7280', '#EC4899', '#10B981'];
    
    return services.slice(0, 6).map((service, index) => ({
      name: service,
      data: Array.from({ length: 20 }, (_, i) => ({
        x: new Date(Date.now() - (19 - i) * 60000),
        y: Math.random() * Math.random() * 100, // Random error percentage 0-100%
      })),
      color: colors[index % colors.length],
    }));
  }, [services]);

  const options = {
    chart: {
      type: 'line' as const,
      height: 200,
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: chartData.map(d => d.color),
    stroke: { width: 1, curve: 'smooth' as const },
    markers: { size: 0, strokeWidth: 2, hover: { size: 6 } },
    xaxis: { 
      type: 'datetime' as const,
      labels: { style: { colors: '#8c8c8c' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { 
        style: { colors: '#8c8c8c' },
        formatter: (val: number) => `${val.toFixed(0)}%`,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { borderColor: '#303030', strokeDashArray: 4 },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom' as const,
      labels: { colors: '#8c8c8c' },
      markers: { size: 8 },
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    tooltip: {
      theme: 'dark' as const,
      y: { formatter: (val: number) => `${val.toFixed(2)}%` },
    },
  };

  return <ApexCharts options={options} series={chartData} type="line" height={200} />;
};

const DurationChart: React.FC<{ services: string[]; metric: string }> = ({ services, metric }) => {
  const chartData = useMemo(() => {
    const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#6B7280', '#EC4899', '#10B981'];
    
    return services.slice(0, 6).map((service, index) => ({
      name: service,
      data: Array.from({ length: 20 }, (_, i) => {
        if(i % 3 === 0){
          return {
            x: new Date(Date.now() - (19 - i) * 60000),
            y: Math.random() * Math.random() * Math.random(),
          };
        }
        return {
          x: new Date(Date.now() - (19 - i) * 60000),
          y: Math.random() * Math.random(),
        };
      }),
      color: colors[index % colors.length],
    }));
  }, [services, metric]);

  const options = {
    chart: {
      type: 'line' as const,
      height: 200,
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: false },
    },
    colors: chartData.map(d => d.color),
    stroke: { width: 1, curve: 'smooth' as const },
    markers: { size: 0, strokeWidth: 0, hover: { size: 6 } },
    xaxis: { 
      type: 'datetime' as const,
      labels: { style: { colors: '#8c8c8c' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { 
        style: { colors: '#8c8c8c' },
        formatter: (val: number) => `${val.toFixed(0)} ms`,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { borderColor: '#303030', strokeDashArray: 4 },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom' as const,
      labels: { colors: '#8c8c8c' },
      markers: { size: 8 },
      itemMargin: { horizontal: 8, vertical: 4 },
    },
    tooltip: {
      theme: 'dark' as const,
      y: { formatter: (val: number) => `${val.toFixed(2)} ms` },
    },
  };

  return <ApexCharts options={options} series={chartData} type="line" height={200} />;
};

export default ServiceContainerOld;