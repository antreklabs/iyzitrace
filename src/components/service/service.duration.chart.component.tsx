import React, { useMemo } from 'react';
import ApexCharts from 'react-apexcharts';
import { Service } from '../../api/service/interface.service';

interface ServiceDurationChartProps {
  services: Service[];
  metric: string;
}

const ServiceDurationChart: React.FC<ServiceDurationChartProps> = ({ services, metric }) => {
  const chartData = useMemo(() => {
    const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#6B7280', '#EC4899', '#10B981'];
    
    const metricNameMap: Record<string, string> = {
      p99: 'P99',
      p95: 'P95',
      p90: 'P90',
      p75: 'P75',
      p50: 'P50',
    };
    
    const series = services.slice(0, 6).map((service, index) => {
      const metricName = metricNameMap[metric] ?? 'P99';
    
      const latencyItem = service.rangeMetrics.latency
        ?.find(l => l.name === metricName);
    
      const data = latencyItem
        ? latencyItem.data.map(p => ({
            x: new Date(p.x),  // backend’den gelen zamanı kullan
            y: p.y,
          }))
        : [];
    
      return {
        name: service.name,
        data,
        color: colors[index % colors.length],
      };
    });

    return series;
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

export default ServiceDurationChart;

