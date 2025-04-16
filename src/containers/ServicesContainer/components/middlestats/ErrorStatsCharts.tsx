import React, { useEffect, useState } from "react";
import { Card } from "antd";
import ApexCharts from "react-apexcharts";
import { prometheusApi } from "../../../../providers";
import { MiddleStatsProps } from "../../../../interfaces";

const ErrorStatsCharts: React.FC<MiddleStatsProps> = ({ serviceNames, start, end }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const getMetrics = async () => {
    setLoading(true);

    const endUnix = Math.floor(Date.now() / 1000);
    const startUnix = endUnix - 60 * 60; // Son 1 saat
    const step = "60s";

    const query = `floor(sum by(service) (increase(traces_spanmetrics_calls_total[1m])))`;

    try {
      const result = await prometheusApi.runTraceQlQueryRange(query, startUnix, endUnix, step);
      const newSeries: Record<string, { name: string; data: number[] }> = {};
      let timeLabels: string[] = [];

      result.forEach((serie: any) => {
        const serviceName = serie.metric?.service || "unknown";
        if (!newSeries[serviceName]) {
          newSeries[serviceName] = { name: serviceName, data: [] };
        }

        serie.values.forEach(([timestamp, value]: [string, string], index: number) => {
          const ts = new Date(parseInt(timestamp, 10) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (timeLabels.length < serie.values.length) {
            timeLabels.push(ts);
          }
          newSeries[serviceName].data.push(Math.floor(parseFloat(value)));
        });
      });

      setChartData(Object.values(newSeries));
      setTimestamps(timeLabels);
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMetrics();
  }, [start, end, serviceNames]);

  const options = {
    chart: {
      type: "line",
      height: 600,
      toolbar: { show: false },
      foreColor: "#fff",
      animations: {
        easing: "easeinout",
        speed: 600,
      },
    },
    fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: "vertical", 
          shadeIntensity: 0.5,
          gradientToColors: undefined, // 
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.7,
          stops: [0, 50, 100],
        },
      },
    stroke: {
        width: 2,
        curve: "smooth",
    },
    xaxis: {
      categories: timestamps,
      title: { text: "Time", style: { color: "#fff" } },
    },
    yaxis: {
      title: { text: "Service Call Count", style: { color: "#fff" } },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val: number) => `${val} calls`,
      },
    },
    legend: {
      position: "top",
      labels: { colors: "#fff" },
    },
    colors: ["#FF4E50", "#1E90FF", "#32CD32", "#FFD700", "#8A2BE2", "#FF69B4"],
  };

  return (
    <Card title="Service Call Stats (last 60m)" loading={loading}>
      <ApexCharts options={options} series={chartData} type="line" height={400} />
    </Card>
  );
};

export default ErrorStatsCharts;
