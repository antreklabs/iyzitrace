import React, { useMemo } from 'react';
import ApexCharts from 'react-apexcharts';
import { Service } from '../../api/service/interface.service';
import '../../assets/styles/components/service/service.css';

const ServiceRequestChart: React.FC<{ services: Service[] }> = ({ services }) => {
  const chartData = useMemo(() => {
    const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#6B7280', '#EC4899', '#10B981', '#F97316', '#6366F1', '#84CC16', '#EF4444'];

    return services.slice(0, 10).map((service, index) => ({
      name: service.name,
      data: Array.from({ length: 20 }, (_, i) => ({
        x: new Date(Date.now() - (19 - i) * 60000),
        y: service.metrics.callsCount,
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
        formatter: (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toString(),
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
      y: { formatter: (val: number) => `${val} requests` },
    },
  };

  return (
    <div className="chart-container">
      <ApexCharts options={options} series={chartData} type="bar" height={200} />
    </div>
  );
};

export default ServiceRequestChart;