import React, { useMemo } from 'react';
import ApexCharts from 'react-apexcharts';
import { Service } from '../../api/service/interface.service';

const ServiceErrorChart: React.FC<{ services: Service[] }> = ({ services }) => {
  const chartData = useMemo(() => {
    const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#6B7280', '#EC4899', '#10B981'];
    
    return services.slice(0, 6).map((service, index) => ({
      name: service.name,
      data: Array.from({ length: 20 }, (_, i) => ({
        x: new Date(Date.now() - (19 - i) * 60000),
        y: service.status?.metrics?.errorPercentage ?? 0,
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
      y: { formatter: (val: number) => `${val.toFixed(2)}%` },
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

export default ServiceErrorChart;