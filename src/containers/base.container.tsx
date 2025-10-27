import React, { useState, useEffect } from 'react';
import { Layout, Table, Spin, Empty } from 'antd';
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";
import { useLocation } from 'react-router-dom';
import BaseContainer from '../components/core/basecontainer/basecontainer.component';
import FiltersSider from '../components/core/layout/filters-sider.component';
import '../assets/styles/base/base.container.css';

const { Content } = Layout;

// URL parametrelerini düzenli yapıya dönüştüren model sınıfı
export class FilterParamsModel {
  timeRange: {
    from: string;
    to: string;
    readonly datetime: {
      from: string;
      to: string;
    };
    readonly rangeText: string;
  };
  
  duration: {
    min: string;
    max: string;
  };
  
  fields: Array<{
    name: string;
    value: string[];
  }>;
  
  labels: Array<{
    name: string;
    value: string[];
  }>;
  
  operation: {
    name: string;
    operator: string;
  };
  
  service: {
    name: string;
    operator: string;
  };
  
  tag: {
    key: string;
    operator: string;
    value: string;
  };
  
  type: {
    name: string;
    operator: string;
  };
  
  status: {
    name: string;
    operator: string;
  };
  
  options: {
    interval: string;
    limit: string;
    orderBy: string;
    orderDirection: string;
  };

  constructor(params: Record<string, string>) {
    // Time Range
    const from = params.from || '';
    const to = params.to || '';
    const fromTimestamp = parseInt(from);
    const toTimestamp = parseInt(to);
    
    this.timeRange = {
      from,
      to,
      get datetime() {
        return {
          from: fromTimestamp ? new Date(fromTimestamp).toISOString() : '',
          to: toTimestamp ? new Date(toTimestamp).toISOString() : ''
        };
      },
      get rangeText() {
        if (!fromTimestamp || !toTimestamp) return '';
        const diffMs = toTimestamp - fromTimestamp;
        const diffMins = Math.round(diffMs / (1000 * 60));
        return `Last ${diffMins} Min`;
      }
    };

    // Duration
    this.duration = {
      min: params.durationMin || '',
      max: params.durationMax || ''
    };

    // Fields - dynamic field filters
    this.fields = [];
    Object.keys(params).forEach(key => {
      if (key.startsWith('field_') && key.endsWith('_name')) {
        const id = key.replace('field_', '').replace('_name', '');
        const valueKey = `field_${id}_value`;
        const fieldValue = params[valueKey];
        
        this.fields.push({
          name: params[key],
          value: fieldValue ? fieldValue.split(',').map(v => v.trim()) : []
        });
      }
    });

    // Labels - dynamic label filters
    this.labels = [];
    Object.keys(params).forEach(key => {
      if (key.startsWith('label_') && key.endsWith('_name')) {
        const id = key.replace('label_', '').replace('_name', '');
        const valueKey = `label_${id}_value`;
        const labelValue = params[valueKey];
        
        this.labels.push({
          name: params[key],
          value: labelValue ? labelValue.split(',').map(v => v.trim()) : []
        });
      }
    });

    // Operation
    this.operation = {
      name: params.operationName || '',
      operator: params.operationNameOperator || '='
    };

    // Service
    this.service = {
      name: params.serviceName || '',
      operator: params.serviceNameOperator || '='
    };

    // Tag
    this.tag = {
      key: params.tagKey || '',
      operator: params.tagOperator || '=',
      value: params.tagValue || ''
    };

    // Type
    this.type = {
      name: params.type || '',
      operator: params.typeOperator || '='
    };

    // Status
    this.status = {
      name: params.status || '',
      operator: params.statusOperator || '='
    };

    // Options
    this.options = {
      interval: params.option_interval || '1000',
      limit: params.option_limit || '100',
      orderBy: params.option_orderBy || '',
      orderDirection: params.option_orderDirection || 'desc'
    };
  }
}

interface BaseContainerProps {
  title?: string;
  id?: string | null;
  onFetchData?: (filterModel: FilterParamsModel) => Promise<any[]>;
  onExpandedRowRender?: (record: any) => React.ReactNode;
  columns?: any[];
  filterComponent?: React.ReactElement;
  initialFilterCollapsed?: boolean;
  children?: React.ReactNode;
}

const BaseContainerComponent: React.FC<BaseContainerProps> = ({
  title,
  id,
  onFetchData,
  onExpandedRowRender,
  columns,
  filterComponent,
  initialFilterCollapsed = true,
  children
}) => {
  const location = useLocation();
  const [modelData, setModelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(initialFilterCollapsed);

  const fetchModelData = async () => {
    // console.log('fetchModelData called, onFetchData:', !!onFetchData);
    if (!onFetchData) {
      // console.log('onFetchData is null, returning early');
      return;
    }
    
    setLoading(true);
    try {
      // console.log('Fetching data...');
      const urlParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlParams.entries());
      const filterModel = new FilterParamsModel(params);
      // console.log('FilterModel created:', filterModel);

      const data = await onFetchData(filterModel);
      // console.log('Data received:', data);
      setModelData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setModelData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // console.log('useEffect triggered, location.search:', location.search);
    fetchModelData();
  }, [location.search]);

  return (
    <BaseContainer title={title}>
      <Layout className="base-container-layout">
        {filterComponent && (
          <>  
            <FiltersSider title="Filters" collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
              {filterComponent && React.cloneElement(filterComponent as React.ReactElement<any>)}
            </FiltersSider>
          </>
        )}

        <Content className="base-container-content">
          {loading ? (
            <div className="base-container-loading">
              <Spin tip="Loading data..." size="large">
                <div className="base-container-loading-spinner" />
              </Spin>
            </div>
          ) : onFetchData !== undefined && onFetchData.length > 0 && modelData.length === 0 ? (
            <Empty description="No data found for selected range." />
          ) : (
            <>
              
              {children}
              
              {columns && columns.length > 0 && (
              <Table
                rowKey={(record: any) => record.id ?? record.key ?? record.text ?? record.name ?? JSON.stringify(record)}
                dataSource={modelData}
                columns={columns}
                expandable={onExpandedRowRender ? {
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
                } : {
                  expandedRowRender: onExpandedRowRender,
                  expandIcon: () => null,
                }}
                scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  onShowSizeChange: (current, size) => {
                    fetchModelData();
                  }
                }}
                size="middle"
                bordered
              />
              )}
            </>
          )}
        </Content>
      </Layout>
    </BaseContainer>
  );
};

export default BaseContainerComponent;

