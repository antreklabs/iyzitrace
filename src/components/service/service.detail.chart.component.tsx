import React, { useEffect, useRef } from 'react';
import ApexCharts from 'react-apexcharts';
interface MsChartsProps {
  series: [];
  colors?: string[];
  chartId?: string;
}
const MsCharts: React.FC<MsChartsProps> = ({ series, colors, chartId = 'default' }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Override ApexCharts touch event handling to make them passive
    const overrideTouchEvents = () => {
      if (chartRef.current) {
        const chartElements = chartRef.current.querySelectorAll('.apexcharts-canvas, .apexcharts-svg, .apexcharts-zoomable');
        chartElements.forEach((element) => {
          // Remove existing event listeners and add passive ones
          const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
          touchEvents.forEach(eventType => {
            element.addEventListener(eventType, (e) => {
              // Prevent default to avoid scroll blocking
              e.preventDefault();
            }, { passive: true, capture: true });
          });
        });
      }
    };

    // Force chart resize after initial render
    const forceResize = () => {
      if (chartRef.current) {
        const chartElement = chartRef.current.querySelector('.apexcharts-canvas');
        if (chartElement) {
          // Trigger resize event
          window.dispatchEvent(new Event('resize'));
          // Force ApexCharts to recalculate dimensions
          setTimeout(() => {
            const apexChart = (chartElement as any).__apexChart;
            if (apexChart && apexChart.resize) {
              apexChart.resize();
            }
          }, 50);
        }
      }
    };

    // Run after chart is rendered with multiple attempts
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
      foreColor: '#fff',
      height: 250,
      width: '100%',
      type: 'line',
      animations: {
        enabled: false,
      },
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
      parentHeightOffset: 0,
      fontFamily: 'inherit',
      background: 'transparent',
      toolbar: {
        show: false,
      },
      sparkline: {
        enabled: false,
      },
      events: {
        mounted: (chartContext: any, config: any) => {
          // Disable touch events completely to prevent warnings
          const chartElement = chartContext.w.globals.dom.baseEl;
          if (chartElement) {
            // Remove all touch event listeners
            const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
            touchEvents.forEach(eventType => {
              chartElement.addEventListener(eventType, (e: Event) => {
                e.stopPropagation();
                e.preventDefault();
              }, { passive: true, capture: true });
            });
            
            // Disable zoom and pan
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
        shadeIntensity: 0.5,
        gradientToColors: undefined as any,
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
          // console.log(val, x);
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
  return (
    <div 
      ref={chartRef}
      style={{ 
        width: '100%', 
        height: '250px', 
        minHeight: '250px',
        maxHeight: '250px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <ApexCharts 
        options={options as any} 
        series={series} 
        type="line" 
        height={250} 
        width="100%"
        style={{ 
          width: '100% !important', 
          height: '250px !important',
          minHeight: '250px !important',
          maxHeight: '250px !important'
        }}
      />
    </div>
  );
};

export default MsCharts;
