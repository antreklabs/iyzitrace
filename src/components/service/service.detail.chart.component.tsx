import React, { useEffect, useRef } from 'react';
import ApexCharts from 'react-apexcharts';

interface MsChartsProps {
  series: [];
  colors?: string[];
  chartId?: string;
}

const formatTimeValue = (val: number): string => {
  const absVal = Math.abs(val);

  if (absVal === 0) return '0 ms';
  if (absVal < 1000) return `${val.toFixed(2)} ms`;
  if (absVal < 60000) return `${(val / 1000).toFixed(2)} s`;
  if (absVal < 3600000) return `${(val / 60000).toFixed(2)} min`;
  if (absVal < 86400000) return `${(val / 3600000).toFixed(2)} h`;
  return `${(val / 86400000).toFixed(2)} d`;
};

const MsCharts: React.FC<MsChartsProps> = ({ series, colors, chartId = 'default' }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overrideTouchEvents = () => {
      if (chartRef.current) {
        const chartElements = chartRef.current.querySelectorAll('.apexcharts-canvas, .apexcharts-svg, .apexcharts-zoomable');
        chartElements.forEach((element) => {
          const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
          touchEvents.forEach(eventType => {
            element.addEventListener(eventType, (e) => {
              e.preventDefault();
            }, { passive: true, capture: true });
          });
        });
      }
    };

    const forceResize = () => {
      if (chartRef.current) {
        const chartElement = chartRef.current.querySelector('.apexcharts-canvas');
        if (chartElement) {
          window.dispatchEvent(new Event('resize'));
          setTimeout(() => {
            const apexChart = (chartElement as any).__apexChart;
            if (apexChart && apexChart.resize) {
              apexChart.resize();
            }
          }, 50);
        }
      }
    };

    const timer1 = setTimeout(overrideTouchEvents, 100);
    const timer2 = setTimeout(forceResize, 200);
    const timer3 = setTimeout(forceResize, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [series]);
  const options = {
    chart: {
      id: chartId,
      foreColor: '#a1a1aa',
      height: 250,
      width: '100%',
      type: 'line',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
      parentHeightOffset: 0,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      background: 'transparent',
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: false,
      },
      events: {
        mounted: (chartContext: any, config: any) => {
          const chartElement = chartContext.w.globals.dom.baseEl;
          if (chartElement) {
            const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
            touchEvents.forEach(eventType => {
              chartElement.addEventListener(eventType, (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
              }, { passive: true, capture: true });
            });
            chartContext.w.globals.zoomEnabled = false;
            chartContext.w.globals.panEnabled = false;
          }
        }
      },
      zoom: {
        enabled: false
      },
      pan: {
        enabled: false
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: undefined as any,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    colors: colors ?? [
      '#3b82f6',
      '#ef4444',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#f97316',
    ],
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    markers: {
      size: 0,
      strokeColors: '#fff',
      strokeWidth: 2,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      shape: "circle",
      radius: 2,
      offsetX: 0,
      offsetY: 0,
      hover: {
        size: 6,
        sizeOffset: 3
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#71717a',
          fontSize: '11px',
          fontWeight: 500,
        },
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM \'yy',
          day: 'dd MMM',
          hour: 'HH:mm'
        }
      },
      axisBorder: {
        show: true,
        color: '#27272a',
      },
      axisTicks: {
        show: true,
        color: '#27272a',
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatTimeValue(val),
        style: {
          colors: '#71717a',
          fontSize: '11px',
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: true,
        color: '#27272a',
      },
      axisTicks: {
        show: true,
        color: '#27272a',
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: true,
      showForSingleSeries: false,
      showForNullSeries: true,
      showForZeroSeries: true,
      position: 'top',
      horizontalAlign: 'left',
      floating: false,
      fontSize: '11px',
      fontWeight: 500,
      offsetX: 0,
      offsetY: 0,
      formatter: function (seriesName: string) {
        return seriesName;
      },
      labels: {
        colors: '#a1a1aa',
        useSeriesColors: false
      },
      markers: {
        width: 8,
        height: 8,
        strokeWidth: 0,
        strokeColor: '#fff',
        radius: 8,
        offsetX: 0,
        offsetY: 0
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0
      },
      onItemClick: {
        toggleDataSeries: true
      },
      onItemHover: {
        highlightDataSeries: true
      },
    },
    tooltip: {
      theme: 'dark',
      enabled: true,
      shared: true,
      intersect: false,
      followCursor: true,
      style: {
        fontSize: '12px',
        fontFamily: 'inherit',
      },
      x: {
        show: true,
        format: 'dd MMM HH:mm:ss',
      },
      y: {
        formatter: (val: number) => formatTimeValue(val),
      },
      marker: {
        show: true,
      },
      fixed: {
        enabled: false,
        position: 'topRight',
        offsetX: 0,
        offsetY: 0,
      },
    },
    grid: {
      show: true,
      borderColor: '#27272a',
      strokeDashArray: 3,
      position: 'back',
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      },
    },
    toolbar: {
      show: false,
    },
  };
  return (
    <div
      ref={chartRef}
      className="service-detail-chart-wrapper"
    >
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
      <ApexCharts
        options={options as any}
        series={series}
        type="line"
        height={250}
        width="100%"
        className="service-detail-chart-inner"
      />
    </div>
  );
};

export default MsCharts;