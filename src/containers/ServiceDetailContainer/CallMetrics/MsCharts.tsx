import React from 'react';
import ApexCharts from 'react-apexcharts';
interface MsChartsProps {
  series: [];
  colors?: string[];
}
const MsCharts: React.FC<MsChartsProps> = ({ series, colors }) => {
  const options = {
    chart: {
      id: 'latency',
      foreColor: '#fff',
      height: 250,
      width: '100%',
      type: 'line',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: undefined,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.7,
        stops: [0, 90, 100],
      },
    },
    colors: colors ?? ['#1E90FF', '#FF4E50', '#32CD32'],
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    xaxis: { type: 'datetime' },
    yaxis: {
      labels: {
        formatter: (val: number) => `${(val * 100).toFixed(2)} ms`,
        style: {
          colors: '#fff',
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'top',
      labels: {
        colors: '#fff',
      },
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '14px',
        color: '#fff',
      },
      y: {
        formatter: (val: number, x: any) => {
          console.log(val, x);
          return `${val.toFixed(2)} ms`;
        },
      },
    },
    grid: {
      borderColor: '#555',
      strokeDashArray: 4,
    },
    toolbar: {
      show: false,
    },
  };
  return <ApexCharts options={options} series={series} type="line" height={250} width="100%" />;
};

export default MsCharts;
