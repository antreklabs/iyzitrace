import React, { useEffect, useState } from 'react';
import { Layout, Table, Spin, Empty } from 'antd';
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { useAppSelector } from '../store/hooks';
import { useParams } from 'react-router-dom';
import { createDefaultBaseProps } from '../interfaces/core/base-props.interface';
import BaseContainer from '../components/core/basecontainer/basecontainer';
import GrafanaLikeRangePicker from '../components/core/graphanadatepicker';
import FiltersSider from '../components/core/layout/filters-sider.component';

const { Content } = Layout;

interface BaseContainerProps {
  title: string;
  id?: string | null;
  start?: number;
  end?: number;
  onFetchData: (params?: any) => Promise<any[]>;
  onExpandedRowRender: (record: any) => React.ReactNode;
  columns: any[];
  filterComponent?: React.ReactNode;
}

const BaseContainerComponent: React.FC<BaseContainerProps> = ({
  title,
  id,
  start,
  end,
  onFetchData,
  onExpandedRowRender,
  columns,
  filterComponent
}) => {
  const defaults = createDefaultBaseProps();
  const [range, setRange] = useState<[number, number]>([start ?? defaults.start!, end ?? defaults.end!]);
  const [modelData, setModelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { selectedTempoUid } = useAppSelector((state) => state.tempo);
  const routeParams = useParams<{ id?: string }>();
  const effectiveId = id ?? routeParams?.id ?? null;

  // Tekleştirilmiş fetch fonksiyonu
  const fetchModelData = async (params?: any) => {
    setLoading(true);
    try {
      const data = await onFetchData(params);
      setModelData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setModelData([]);
    } finally {
      setLoading(false);
    }
  };

  // URL'den gelen veya props'tan gelen id ile ilk yükleme
  useEffect(() => {
    if (effectiveId) {
      fetchModelData({ id: effectiveId });
    }
  }, [effectiveId, selectedTempoUid]);

  // Range veya datasource değiştiğinde normal arama
  useEffect(() => {
    if (!effectiveId) {
      fetchModelData();
    }
  }, [range, selectedTempoUid]);

  return (
    <BaseContainer
      title={title}
      headerActions={<GrafanaLikeRangePicker title="Date Range" onChange={(start, end) => setRange([start, end])} />}
    >
      <Layout style={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
        <FiltersSider title="Filters" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
          {filterComponent}
        </FiltersSider>

        <Content style={{ padding: 24 }}>
          {loading ? (
            <Spin tip="Loading data..." />
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
                      style={{ fontSize: 14, marginRight: 8 }}
                    />
                  ) : (
                    <IoIosArrowForward
                      onClick={(e: any) => onExpand(record, e)}
                      style={{ fontSize: 14, marginRight: 8 }}
                    />
                  ),
              }}
              scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
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
