import React, { useState, useEffect } from 'react';
import { Layout, Spin, Empty } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import BaseContainer from '../components/core/basecontainer/basecontainer.component';
import FiltersSider from '../components/core/layout/filters-sider.component';
import '../assets/styles/base/base.container.css';
import { TableColumn } from '../api/service/table.services';
import { getFilterParams, FilterParamsModel, getDefaultSearchQuery } from '../api/service/query.service';
import AIChatbot from '../components/ai/ai-chatbot.component';

const { Content } = Layout;


export interface FetchedModel {
  data: any[];
  columns: TableColumn;
}

interface BaseContainerProps {
  title?: string;
  id?: string | null;
  onFetchData?: (filterModel: FilterParamsModel) => Promise<FetchedModel>;
  filterComponent?: React.ReactElement;
  initialFilterCollapsed?: boolean;
  refreshTrigger?: number;
  children?: React.ReactNode;
}

const BaseContainerComponent: React.FC<BaseContainerProps> = ({
  title,
  id,
  onFetchData,
  filterComponent,
  initialFilterCollapsed = true,
  refreshTrigger,
  children
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [modelData, setModelData] = useState<any[]>([]);
  const [aiModelData, setAiModelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(initialFilterCollapsed);

  const initializeUrlWithDefaults = () => {
    // Check if URL has any parameters
    const urlParams = new URLSearchParams(location.search);
    const hasParams = Array.from(urlParams.keys()).length > 0;
    
    if (!hasParams) {
      // URL is empty, set all default values
      const newSearch = getDefaultSearchQuery();
      navigate(`${location.pathname}?${newSearch}`, { replace: true });
    }
  };

  const fetchModelData = async () => {
    if (!onFetchData) {
      return;
    }
    
    setLoading(true);
    try {
      const filterModel = getFilterParams();
      const fetchedModel = await onFetchData(filterModel);
      setModelData(fetchedModel.data);
      setAiModelData(fetchedModel.data);
      console.log('modelData', modelData);
      console.log('aiModelData', aiModelData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setModelData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelData();
  }, [location.search, refreshTrigger]);

  useEffect(() => {
    initializeUrlWithDefaults();
  }, []);

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
            </>
          )}
        </Content>
      </Layout>
      <AIChatbot contextData={aiModelData} contextTitle={title} />
    </BaseContainer>
  );
};

export default BaseContainerComponent;

