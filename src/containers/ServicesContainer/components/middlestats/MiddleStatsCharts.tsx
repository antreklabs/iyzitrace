import React, { useEffect, useState } from 'react';
import ApexCharts from 'react-apexcharts';
import { prometheusApi } from '../../../../providers';
import { buildQuery, QueryKeys } from '../../../../providers/api/prometheus/prometheus.registry';
import { MiddleStatsProps } from '../../../../interfaces';
import { Card } from 'antd';

const MiddleStatsCharts: React.FC<MiddleStatsProps> = ({ serviceNames, start, end }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getMetrics = async () => {
    const ctx = { serviceName: '', windowSeconds: Math.floor((end - start) / 1000), rateInterval: '5m' };

    const [p50, p90, p95] = await Promise.all([
      prometheusApi.runTraceQLQuery(await buildQuery(QueryKeys.p50LatencyGlobal, ctx)),
      prometheusApi.runTraceQLQuery(await buildQuery(QueryKeys.p90LatencyGlobal, ctx)),
      prometheusApi.runTraceQLQuery(await buildQuery(QueryKeys.p95LatencyGlobal, ctx)),
    ]);

    const data: Record<string, any> = {};

    const mapData = (arr: any[], label: string) => {
      arr.forEach((item) => {
        const name = item.metric?.service || 'unknown';
        if (!data[name]) {
          data[name] = { service: name };
        }
        data[name][label] = parseFloat(item.value[1]) * 1000;
      });
    };

    mapData(p50, 'p50');
    mapData(p90, 'p90');
    mapData(p95, 'p95');

    setChartData(Object.values(data));
    setLoading(false);
  };

  useEffect(() => {
    getMetrics();
  }, [serviceNames, start, end]);

  const services = chartData.map((d) => d.service);

  const options = {
    chart: {
      type: "line" as "line",
      height: 400,
      toolbar: { show: false },
      foreColor: '#fff',
    },
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: "vertical", 
        shadeIntensity: 0.5,
        gradientToColors: undefined as any, // 
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.7,
        stops: [0, 90, 100],
      },
    },
    colors: ['#1E90FF', '#FF4E50', '#32CD32'], 
    markers: {
      size: 4,
      colors: ['#fff'],
      strokeColors: ['#1E90FF', '#FF4E50', '#32CD32'],
      strokeWidth: 2,
    },
    xaxis: {
      categories: services,
      labels: {
        style: {
          colors: '#fff',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${val.toFixed(2)} ms`,
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
        formatter: (val: number) => `${val.toFixed(2)} ms`,
      },
    },
    grid: {
      borderColor: '#555',
      strokeDashArray: 4,
    },
  };
  

  const series = [
    {
      name: 'P50',
      data: chartData.map((d) => d.p50 || 0),
    },
    {
      name: 'P90',
      data: chartData.map((d) => d.p90 || 0),
    },
    {
      name: 'P95',
      data: chartData.map((d) => d.p95 || 0),
    },
  ];

  if (loading) {
    return <div>Loading chart...</div>;
  }

  return(
  <Card title="Latency Percentiles">
      <ApexCharts options={options as any} series={series} type="line" height={400} />
  </Card> 

  )

};

export default MiddleStatsCharts;
