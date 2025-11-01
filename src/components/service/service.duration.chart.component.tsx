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
    
    return services.slice(0, 6).map((service, index) => ({
      name: service.name,
      data: Array.from({ length: 20 }, (_, i) => {
          const yValue = (() => {
            if(metric === 'p99') return service.metrics.p99DurationMs;
            if(metric === 'p95') return service.metrics.p95DurationMs;
            if(metric === 'p90') return service.metrics.p90DurationMs;
            if(metric === 'p75') return service.metrics.p75DurationMs;
            if(metric === 'p50') return service.metrics.p50DurationMs;
            if(metric === 'Avg') return service.metrics.avgDurationMs;
            return 0;
          })();
          
          return {
            x: new Date(Date.now() - (19 - i) * 60000),
            y: yValue
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

export default ServiceDurationChart;

