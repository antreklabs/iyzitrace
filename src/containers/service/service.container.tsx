import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BaseContainerComponent, { PageState, getPageState } from '../base.container';
import ServiceFilter from './service.filter';
import ServiceExpandedRowComponent from '../../components/service/service.container.expanded-row.component';
import ServiceMetricsCard from '../../components/service/service.container.card.component';
import { tempoReadApi } from '../../providers/api/tempo/tempo.api.read';
import { ServiceItem } from '../../interfaces/pages/service/service.response.interface';
import { prometheusApi } from '../../providers/api/prometheus/prometheus.api';
import { buildQuery, QueryKeys } from '../../providers/api/prometheus/prometheus.registry';
// import { dateTime } from '@grafana/data';

const ServiceContainer: React.FC = () => {
  const [services, setServices] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join('_') || 'home';
  const currentPageState = getPageState(pageName);

  const servicePredicates: Record<string, (left: string, right: string) => boolean> = {
    '=': (a, b) => a === b,
    '!=': (a, b) => a !== b,
    'contains': (a, b) => a.toLowerCase().includes(b.toLowerCase()),
    'startsWith': (a, b) => a.toLowerCase().startsWith(b.toLowerCase()),
    'endsWith': (a, b) => a.toLowerCase().endsWith(b.toLowerCase()),
    'regex': (a, b) => {
      try { return new RegExp(b, 'i').test(a); } catch { return false; }
    },
    'in': (a, b) => b.split(',').map(x => x.trim().toLowerCase()).includes(a.toLowerCase()),
  };
  
  function filterServices(
    serviceNames: string[],
    selectedService?: string,
    selectedServiceNameOperator: keyof typeof servicePredicates = 'contains'
  ) {
    if (!selectedService) return serviceNames;
    const predicate = servicePredicates[selectedServiceNameOperator] ?? servicePredicates.contains;
    return serviceNames.filter(s => predicate(s, selectedService));
  }

  const fetchModelData = async (pageState?: PageState | null) => {
    const values = await tempoReadApi.getLabelValues('service.name');
    const raw: any[] = Array.isArray(values) ? values : [];
    let serviceNames: string[] = raw.map((s: any) =>
      typeof s === 'string' ? s : (s?.text ?? s?.value ?? String(s))
    );
    const selectedService = pageState?.filters?.filters?.serviceName;
    const selectedServiceNameOperator = pageState?.filters?.filters?.serviceNameOperator || '=';
    if (selectedService) {
      serviceNames = filterServices(serviceNames, selectedService, selectedServiceNameOperator);
    }
    setServices(serviceNames);

    // Also fetch metrics for the main table
    const startMs = pageState?.range?.[0];
    // console.log('startMs', dateTime(startMs));
    const endMs = pageState?.range?.[1];
    // console.log('endMs', dateTime(endMs));
    const fixedStart = Math.floor(startMs / 1000);
    const fixedEnd = Math.floor(endMs / 1000);
    const maxPoints = 1;
    const step = Math.max(Math.ceil((fixedEnd - fixedStart) / maxPoints), 60);

    const response: ServiceItem[] = [];
    
    for (const name of serviceNames) {
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

    return response;
  };

  const expandedRowRender = (record: any) => {
    return <ServiceExpandedRowComponent record={record} start={currentPageState?.range?.[0]} end={currentPageState?.range?.[1]} />;
  };

  const columns = [
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
  ];

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
      onExpandedRowRender={expandedRowRender}
      columns={columns}
      filterComponent={<ServiceFilter onChange={fetchModelData} collapsed={true} columns={columns} />}
      datasourceType="tempo">
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
            <div style={{ display: 'inline-flex', gap: 16 }}>
              {services.map((service) => (
                <div key={service}>
                  <ServiceMetricsCard name={service} start={currentPageState?.range?.[0]} end={currentPageState?.range?.[1]} />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => scrollBy(400)}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
          >
            ▶
          </button>
        </div>
    </BaseContainerComponent>
  );
};

export default ServiceContainer;