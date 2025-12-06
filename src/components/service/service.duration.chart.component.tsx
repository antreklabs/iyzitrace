import React, { useMemo } from 'react';
import ApexCharts from 'react-apexcharts';
import { Service } from '../../api/service/interface.service';

interface ServiceDurationChartProps {
  services: Service[];
  metric: string;
}

// Format time values intelligently
const formatTimeValue = (val: number): string => {
  const absVal = Math.abs(val);
  
  if (absVal === 0) return '0 ms';
  if (absVal < 1000) return `${val.toFixed(2)} ms`;
  if (absVal < 60000) return `${(val / 1000).toFixed(2)} s`;
  if (absVal < 3600000) return `${(val / 60000).toFixed(2)} min`;
  if (absVal < 86400000) return `${(val / 3600000).toFixed(2)} h`;
  return `${(val / 86400000).toFixed(2)} d`;
};

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
        formatter: (val: number) => formatTimeValue(val),
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: { borderColor: '#303030', strokeDashArray: 4 },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'top' as const,
      horizontalAlign: 'left' as const,
      floating: false,
      fontSize: '11px',
      fontWeight: 500,
      labels: { colors: '#a1a1aa' },
      markers: { size: 8 },
      itemMargin: { horizontal: 10, vertical: 0 },
      offsetY: 0,
    },
    tooltip: {
      theme: 'dark' as const,
      y: { formatter: (val: number) => formatTimeValue(val) },
    },
  };

  return (
    <div style={{ width: '100%', height: '200px', position: 'relative' }}>
      <style>{`
        .apexcharts-legend {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          white-space: nowrap !important;
          max-width: 100% !important;
          scrollbar-width: thin;
          scrollbar-color: #3f3f46 #18181b;
        }
        .apexcharts-legend::-webkit-scrollbar {
          height: 6px;
        }
        .apexcharts-legend::-webkit-scrollbar-track {
          background: #18181b;
          border-radius: 3px;
        }
        .apexcharts-legend::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 3px;
        }
        .apexcharts-legend::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
        .apexcharts-legend-series {
          display: inline-flex !important;
          flex-shrink: 0 !important;
        }
      `}</style>
      <ApexCharts options={options} series={chartData} type="line" height={200} />
    </div>
  );
};

export default ServiceDurationChart;

