import React, { useEffect, useState } from 'react';
import { Layout, Table, Spin, Empty } from 'antd';
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { useAppSelector } from '../store/hooks';
import { useParams, useLocation } from 'react-router-dom';
import BaseContainer from '../components/core/basecontainer/basecontainer';
import GrafanaLikeRangePicker from '../components/core/graphanadatepicker';
import FiltersSider from '../components/core/layout/filters-sider.component';
import { getPageState, updatePageState, getDefaultPageState, savePageState, PageState } from '../utils/localstorage.util';
import '../assets/styles/base/base.container.css';

const { Content } = Layout;

interface BaseContainerProps {
  title: string;
  id?: string | null;
  onFetchData: (pageState?: PageState | null) => Promise<any[]>;
  onExpandedRowRender: (record: any) => React.ReactNode;
  columns: any[];
  filterComponent?: React.ReactElement;
  datasourceType?: 'tempo' | 'loki';
}

const BaseContainerComponent: React.FC<BaseContainerProps> = ({
  title,
  id,
  onFetchData,
  onExpandedRowRender,
  columns,
  filterComponent,
  datasourceType = 'tempo'
}) => {
  const location = useLocation();
  const pageName = location.pathname.split('/').filter(Boolean).join('_') || 'home';
  const defaultState = getDefaultPageState();
  const savedState = getPageState(pageName);

  // Initialize states with saved values or defaults
  const [range, setRange] = useState<[number, number]>(savedState?.range || defaultState.range);
  const [filters, setFilters] = useState<any>(savedState?.filters || defaultState.filters);
  const [modelData, setModelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pageSize, setPageSize] = useState(savedState?.pageSize || defaultState.pageSize);
  
  const { selectedUid } = useAppSelector((state) => state.datasource);
  const routeParams = useParams<{ id?: string }>();
  const effectiveId = id ?? routeParams?.id ?? null;

  // Save state changes to localStorage
  const saveState = (updates: Partial<PageState>) => {
    updatePageState(pageName, updates);
  };

  // Filter handler
  const handleFilterChange = (filterValues: any) => {
    // eslint-disable-next-line no-console
    setFilters(filterValues);
    saveState({ filters: filterValues });
    fetchModelData();
  };

  // Tekleştirilmiş fetch fonksiyonu
  const fetchModelData = async () => {
    // eslint-disable-next-line no-console
    setLoading(true);
    try {
      const currentPageState = getPageState(pageName);
      const data = await onFetchData(currentPageState);
      setModelData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setModelData([]);
    } finally {
      setLoading(false);
    }
  };

  // selectedUid değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (selectedUid) {
      saveState({ selectedDataSourceUid: selectedUid });
    }
  }, [selectedUid]);

  // İlk yükleme ve datasource/filter değişikliklerinde veri çek
  useEffect(() => {
    if (selectedUid) {
      fetchModelData();
    }
  }, [effectiveId, selectedUid, filters]);

  return (
    <BaseContainer
      title={title}
      datasourceType={datasourceType}
      headerActions={
        <GrafanaLikeRangePicker 
          title="Date Range" 
          value={range}
          onChange={(start, end) => {
            const newRange: [number, number] = [start, end];
            setRange(newRange);
          }}
          onApply={(start, end) => {
            const newRange: [number, number] = [start, end];
            setRange(newRange);
            saveState({ range: newRange });
            fetchModelData();
          }}
        />
      }
    >
      <Layout className="base-container-layout">
        <FiltersSider title="Filters" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
          {React.cloneElement(filterComponent as React.ReactElement<any>, { 
            onChange: handleFilterChange,
            data: modelData 
          })}
        </FiltersSider>

        <Content className="base-container-content">
          {loading ? (
            <div className="base-container-loading">
              <Spin tip="Loading data..." size="large">
                <div className="base-container-loading-spinner" />
              </Spin>
            </div>
          ) : modelData.length === 0 ? (
            <Empty description="No data found for selected range." />
          ) : (
            <Table
              dataSource={modelData}
              columns={columns}
              expandable={{
                expandedRowRender: onExpandedRowRender,
                expandIcon: ({ expanded, onExpand, record }) =>
                  expanded ? (
                    <IoIosArrowDown
                      onClick={(e: any) => onExpand(record, e)}
                      className="base-container-icon"
                    />
                  ) : (
                    <IoIosArrowForward
                      onClick={(e: any) => onExpand(record, e)}
                      className="base-container-icon"
                    />
                  ),
              }}
              scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
              pagination={{
                pageSize: pageSize,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                onShowSizeChange: (current, size) => {
                  setPageSize(size);
                  saveState({ pageSize: size });
                  fetchModelData();
                }
              }}
              size="middle"
              bordered
            />
          )}
        </Content>
      </Layout>
    </BaseContainer>
  );
};

export default BaseContainerComponent;

// Export the 4 page state management functions for use in child containers
export { getPageState, updatePageState, getDefaultPageState, savePageState };
export type { PageState };
