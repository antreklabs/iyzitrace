import React, { useRef, useState } from 'react';
import BaseFilter from '../base.filter';
import BaseContainerComponent, { FetchedModel } from '../base.container';
import BaseTable from '../base.table';
import { FilterParamsModel } from '../../api/service/query.service';
import { ColumnItem, getTableColumns, TableColumn } from '../../api/service/table.services';
import { getTracesTableData } from '../../api/service/traces.service';
import { Trace } from '../../api/service/interface.service';
import { useNavigate } from 'react-router-dom';
import TraceMetricsCard from '../../components/trace/trace.container.card.component';
import { columns as columnUtils } from '../../api/service/table.services';

const TraceContainer: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Trace[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn>();
  const [statsData, setStatsData] = useState<any[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  
  const fetchModelData = async (filterModel: FilterParamsModel): Promise<FetchedModel> => {
    const data = await getTracesTableData(filterModel);
    setData(data);
    const builtColumns = buildColumns(data);
    setTableColumns(builtColumns);
    makeStats(data);

    return { data: data, columns: tableColumns };
  };

  const buildColumns = (data: Trace[]): TableColumn => {
    const cols = getTableColumns(data);

    const traceIdColumn = cols.RootColumns.find((col: ColumnItem) => col.key === 'traceId');
    if (traceIdColumn) {
      traceIdColumn.render = (value: string) => {
        return (
          <span style={{ color: '#1890ff', cursor: 'pointer', fontFamily: 'monospace' }} 
            onClick={() => navigate(`/a/iyzitrace-app/traces/${value}`)}>
            {value}
        </span>);
      };
    }

    const serviceNameColumn = cols.RootColumns.find((col: ColumnItem) => col.key === 'serviceName');
    if (serviceNameColumn) {
      serviceNameColumn.render = (value: string) => {
        return (
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => navigate(`/a/iyzitrace-app/services/${value}`)}>
          {value}
        </span>);
      };
    }

    const visibleColumns: TableColumn = {
      RootColumns: columnUtils.hideColumns(cols.RootColumns, ['StartTimeUnixNano', 'SpanCount', 'SpanSet', 'SpanSets', 'ServiceStats'])
    };

    return visibleColumns;
  };

  const makeStats = (data: any) => {
    if (!Array.isArray(data) || data.length === 0) {
      setStatsData([]);
      return;
    }

    // Filter out items with invalid durationMs
    const validData = data.filter(item => item && typeof item.durationMs === 'number' && !isNaN(item.durationMs));
    
    if (validData.length === 0) {
      setStatsData([]);
      return;
    }

    const maxLatencyRow = validData.reduce((prev, curr) => (prev.durationMs > curr.durationMs ? prev : curr));
    const minLatencyRow = validData.reduce((prev, curr) => (prev.durationMs < curr.durationMs ? prev : curr));
    const totalLatency = validData.reduce((sum, curr) => sum + (curr.durationMs || 0), 0);
    const totalSpanCount = validData.reduce((sum, curr) => sum + (curr.spanCount || 0), 0);
    const avgLatency = totalLatency / validData.length;

    // Generate chart data for each metric (ordered by startTime)
    const ordered = validData
      .slice()
      .sort((a, b) => Number(a.startTimeUnixNano) - Number(b.startTimeUnixNano));
    
    // Group data into max 50 buckets by time
    const groupSize = Math.max(1, Math.ceil(ordered.length / 50));
    const grouped = [];
    for (let i = 0; i < ordered.length; i += groupSize) {
      const group = ordered.slice(i, i + groupSize);
      grouped.push(group);
    }
    
    // Aggregate span count data (sum)
    const spanCountChartData = grouped.map(group => 
      group.reduce((sum, item) => sum + (item.spanCount || 0), 0)
    );
    
    // Aggregate latency data (min, max, avg)
    const latencyMinChartData = grouped.map(group => 
      Math.min(...group.map(item => item.durationMs || 0))
    );
    const latencyMaxChartData = grouped.map(group => 
      Math.max(...group.map(item => item.durationMs || 0))
    );
    const latencyAvgChartData = grouped.map(group => {
      const sum = group.reduce((sum, item) => sum + (item.durationMs || 0), 0);
      return sum / group.length;
    });

    const statsData = [
      {
        title: 'Max Latency',
        value: (maxLatencyRow?.durationMs || 0).toFixed(2),
        unit: 'ms',
        chartData: latencyMaxChartData,
      },
      {
        title: 'Min Latency',
        value: (minLatencyRow?.durationMs || 0).toFixed(2),
        unit: 'ms',
        chartData: latencyMinChartData,
      },
      {
        title: 'Avg Latency',
        value: (avgLatency || 0).toFixed(2),
        unit: 'ms',
        chartData: latencyAvgChartData,
      },
      {
        title: 'Total Span Count',
        value: totalSpanCount,
        unit: 'spans',
        chartData: spanCountChartData,
      },
    ];

    setStatsData(statsData);
  };

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <BaseContainerComponent
      title="Traces"
      initialFilterCollapsed={true}
      onFetchData={fetchModelData}
      filterComponent={
        <BaseFilter 
          hasServiceFilter={true}
          hasOperationsFilter={false}
          hasStatusesFilter={false}
          hasDurationFilter={false}
          hasTagsFilter={true}
          hasOptionsFilter={true}
          hasLabelsFilter={false}
          hasFieldsFilter={true}
          hasTypesFilter={false}
          hasLevelsFilter={false}
          columns={tableColumns?.RootColumns ?? []}
          data={data}
        />
      }
    >
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => scrollBy(-400)}
          style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
        >
          ◀
        </button>
        <div
          ref={scrollerRef}
          style={{ overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap', padding: '0 36px' }}
        >
          <div style={{ display: 'inline-flex', gap: 16 }}>
            {statsData.map((stat) => (
              <div key={stat.title}>
                <TraceMetricsCard 
                  title={stat.title} 
                  value={stat.value} 
                  unit={stat.unit} 
                  chartData={stat.chartData} 
                />
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => scrollBy(400)}
          style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1, background: '#1f1f1f', border: '1px solid #303030', color: '#d9d9d9', borderRadius: 6, padding: '4px 8px' }}
        >
          ▶
        </button>
      </div>
      {tableColumns && tableColumns.RootColumns && tableColumns.RootColumns.length > 0 && (
        <BaseTable
        data={data}
        columns={tableColumns}
        title="Traces"
        showSearch={true}
        searchPlaceholder="Search..."
        />
      )}
    </BaseContainerComponent>
  );
};

export default TraceContainer;