import React, { useState, useEffect, useCallback } from 'react';
import { PluginPage } from '@grafana/runtime';
import { Layout, Typography, Button, Modal, Form, Input, Select, Space, Dropdown, App, Tabs } from 'antd';
import { PlusOutlined, UpOutlined, DownOutlined, LeftOutlined, RightOutlined, SaveOutlined, MoreOutlined, CopyOutlined, DeleteOutlined, ClearOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { LogEntry, LogQuery } from '../interfaces/logs.interface';
import { LogPipeline } from '../interfaces/pipeline.interface';
import { lokiReadApi } from '../providers/api/loki.api.read';
import { pipelineApi } from '../providers/api/pipeline.api';
import LogFilters from '../components/Logs/LogFilters';
import LogQueryBuilder from '../components/Logs/LogQueryBuilder';
import LogResults from '../components/Logs/LogResults';

// LocalStorage utility functions
const getLogSettings = () => {
  try {
    const settings = localStorage.getItem('logSettings');
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Error loading log settings:', error);
    return null;
  }
};

const { Content, Sider } = Layout;
const { Text } = Typography;
const { Option } = Select;

interface SavedView {
  id: string;
  name: string;
  query: string;
  filters: any[];
  timeRange: {
    start: number;
    end: number;
  };
  createdAt: string;
}

function LogsContent() {
  const { modal, message } = App.useApp();
  const [searchParams] = useSearchParams();
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]); // Tüm logları sakla (Quick Filter için)
  const [loading, setLoading] = useState(false);
  const [queryCollapsed, setQueryCollapsed] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [addToDashboardVisible, setAddToDashboardVisible] = useState(false);
  const [saveViewVisible, setSaveViewVisible] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [selectedView, setSelectedView] = useState<string>('');
  const [pipelines, setPipelines] = useState<LogPipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [form] = Form.useForm();
  const [saveViewForm] = Form.useForm();
  
  // Load saved settings from localStorage
  const savedSettings = getLogSettings();
  
  const [query, setQuery] = useState<LogQuery>({
    query: '', // Boş query string - sadece log content'inde arama için
    filters: [],
    timeRange: {
      // Varsayılan: Son 6 saat
      start: new Date(Date.now() - 6 * 60 * 60 * 1000).getTime(),
      end: Date.now()
    },
    limit: savedSettings?.limit || 100,
    orderBy: savedSettings?.orderBy || 'timestamp',
    orderDirection: savedSettings?.orderDirection || 'desc'
  });

  const handleSearch = useCallback(async (searchQuery?: LogQuery) => {
    const queryToUse = searchQuery || query;
    setLoading(true);
    try {
      // Loki query oluştur
      let lokiQuery = '{job=~".+"}'; // Tüm logları çek
      
      // Base query
      lokiQuery = `{job=~".+"}`;
      
      // Query string'i parse et ve uygun şekilde ekle
      if (queryToUse.query) {
        const queryText = queryToUse.query.trim();
        
        // Eğer query "key = value" formatındaysa, label filtreleme olarak ekle
        const labelMatch = queryText.match(/^(\w+)\s*=\s*"([^"]+)"$/);
        if (labelMatch) {
          const [, key, value] = labelMatch;
          lokiQuery = lokiQuery.replace('}', `, ${key}="${value}"}`);
        } else {
          // Normal text arama için |= operatörü kullan
          lokiQuery += ` |= "${queryText}"`;
        }
      }
      
      // Filtreleri ekle (label filtreleme)
      if (queryToUse.filters && Array.isArray(queryToUse.filters)) {
        queryToUse.filters.forEach(filter => {
        switch (filter.operator) {
          case 'equals':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}="${filter.value}"}`);
            break;
          case 'contains':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}=~".*${filter.value}.*"}`);
            break;
          case 'regex':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}=~"${filter.value}"}`);
            break;
          case 'exists':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}!=""}`);
            break;
          case 'not_exists':
            lokiQuery = lokiQuery.replace('}', `, ${filter.key}=""}`);
            break;
        }
        });
      }
      
      // Debug için sorguyu logla
      console.log('Loki query:', lokiQuery);
      
      // Loki'den veri çek
      const result = await lokiReadApi.queryLogs({
        query: lokiQuery,
        start: new Date(queryToUse.timeRange.start).toISOString(),
        end: new Date(queryToUse.timeRange.end).toISOString(),
        limit: queryToUse.limit,
        direction: queryToUse.orderDirection === 'desc' ? 'backward' : 'forward',
        orderBy: queryToUse.orderBy,
        orderDirection: queryToUse.orderDirection
      });
      
      setFilteredLogs(result.logs);
      
      // Her aramada tüm logları sakla (Quick Filter için)
      setAllLogs(result.logs);
    } catch (error) {
      console.error('Loki query error:', error);
      // Hata durumunda boş array set et
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  }, [query]); // query dependency'si eklendi

  // URL parametrelerini oku ve query state'ini güncelle
  useEffect(() => {
    const urlQuery = searchParams.get('query');
    const urlFilters = searchParams.get('filters');
    const urlStart = searchParams.get('start');
    const urlEnd = searchParams.get('end');

    if (urlQuery || urlFilters || urlStart || urlEnd) {
      const newQuery: LogQuery = {
        ...query,
        query: urlQuery || query.query,
        filters: urlFilters ? JSON.parse(urlFilters) : query.filters,
        timeRange: {
          start: urlStart ? new Date(urlStart).getTime() : query.timeRange.start,
          end: urlEnd ? new Date(urlEnd).getTime() : query.timeRange.end
        }
      };
      setQuery(newQuery);
    }
  }, [searchParams]);

  // Saved views'ları localStorage'dan yükle
  useEffect(() => {
    const savedViewsData = localStorage.getItem('savedLogViews');
    if (savedViewsData) {
      try {
        setSavedViews(JSON.parse(savedViewsData));
      } catch (error) {
        console.error('Error loading saved views:', error);
      }
    }
  }, []);

  // Pipeline'ları yükle
  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    try {
      const data = await pipelineApi.getPipelines();
      setPipelines(data);
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    }
  };

  useEffect(() => {
    // İlk yüklemede tüm logları çek
    handleSearch();
  }, [handleSearch]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'DEBUG': return 'blue';
      case 'INFO': return 'green';
      case 'WARN': return 'orange';
      case 'ERROR': return 'red';
      case 'FATAL': return 'purple';
      default: return 'default';
    }
  };

  const handleAddToDashboard = () => {
    // Filter'ları string formatında hazırla
    const filtersText = query.filters && query.filters.length > 0 
      ? query.filters.map(f => `${f.key} ${f.operator} "${f.value}"`).join(', ')
      : 'No filters';
    
    // Mevcut query ve filter bilgilerini form'a set et
    form.setFieldsValue({
      title: `Logs - ${query.query || 'All Logs'}`,
      type: 'logs',
      query: query.query,
      filters: filtersText,
      timeRange: query.timeRange
    });
    setAddToDashboardVisible(true);
  };

  const handleDashboardModalOk = () => {
    form.validateFields().then(values => {
      // Mevcut dashboard widget'larını al
      const existingWidgets = JSON.parse(localStorage.getItem('dashboardWidgets') || '[]');
      
      // Yeni widget oluştur
      const newWidget = {
        id: `widget-${Date.now()}`,
        title: values.title,
        type: 'logs',
        query: values.query || '',
        filters: query.filters || [], // Orijinal filter array'ini kullan
        timeRange: values.timeRange || query.timeRange,
        createdAt: new Date().toISOString()
      };

      // Widget'ı ekle
      const updatedWidgets = [...existingWidgets, newWidget];
      localStorage.setItem('dashboardWidgets', JSON.stringify(updatedWidgets));
      
      message.success('Logs view added to dashboard successfully!');
      setAddToDashboardVisible(false);
      form.resetFields();
    }).catch(errorInfo => {
      console.log('Validation failed:', errorInfo);
      // Validation hatalarını göster
      if (errorInfo.errorFields && errorInfo.errorFields.length > 0) {
        const firstError = errorInfo.errorFields[0];
        if (firstError.errors && firstError.errors.length > 0) {
          message.error(firstError.errors[0]);
        }
      }
    });
  };

  const handleDashboardModalCancel = () => {
    setAddToDashboardVisible(false);
    form.resetFields();
  };

  const handleSaveView = () => {
    saveViewForm.setFieldsValue({
      name: `View - ${query.query || 'All Logs'}`
    });
    setSaveViewVisible(true);
  };

  const handleSaveViewOk = () => {
    saveViewForm.validateFields().then(values => {
      const newView: SavedView = {
        id: `view-${Date.now()}`,
        name: values.name,
        query: query.query || '',
        filters: query.filters || [],
        timeRange: query.timeRange,
        createdAt: new Date().toISOString()
      };

      const updatedViews = [...savedViews, newView];
      setSavedViews(updatedViews);
      localStorage.setItem('savedLogViews', JSON.stringify(updatedViews));
      
      // Kaydedilen view'ı seçili hale getir
      setSelectedView(newView.id);
      
      message.success('View saved successfully!');
      setSaveViewVisible(false);
      saveViewForm.resetFields();
    }).catch(errorInfo => {
      console.log('Validation failed:', errorInfo);
      // Validation hatalarını göster
      if (errorInfo.errorFields && errorInfo.errorFields.length > 0) {
        const firstError = errorInfo.errorFields[0];
        if (firstError.errors && firstError.errors.length > 0) {
          message.error(firstError.errors[0]);
        }
      }
    });
  };

  const handleSaveViewCancel = () => {
    setSaveViewVisible(false);
    saveViewForm.resetFields();
  };

  const handleViewSelect = (viewId: string) => {
    if (viewId === '') {
      setSelectedView('');
      return;
    }
    
    const selectedView = savedViews.find(v => v.id === viewId);
    if (selectedView) {
      setQuery({
        ...query,
        query: selectedView.query,
        filters: selectedView.filters,
        timeRange: selectedView.timeRange
      });
      setSelectedView(viewId);
    }
  };

  const handleUpdateView = () => {
    if (!selectedView) return;
    
    const updatedViews = savedViews.map(view => 
      view.id === selectedView 
        ? {
            ...view,
            query: query.query,
            filters: query.filters,
            timeRange: query.timeRange
          }
        : view
    );
    
    setSavedViews(updatedViews);
    localStorage.setItem('savedLogViews', JSON.stringify(updatedViews));
    message.success('View updated successfully!');
  };

  const handleDeleteView = () => {
    if (!selectedView) return;
    
    modal.confirm({
      title: 'Delete View',
      content: 'Are you sure you want to delete this view? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        const updatedViews = savedViews.filter(view => view.id !== selectedView);
        setSavedViews(updatedViews);
        localStorage.setItem('savedLogViews', JSON.stringify(updatedViews));
        setSelectedView('');
        
        // Clear selection gibi ekranı yenile (mevcut zaman aralığını ve ayarları koru)
        const clearedQuery: LogQuery = {
          query: '',
          filters: [],
          timeRange: query.timeRange,
          limit: query.limit,
          orderBy: query.orderBy,
          orderDirection: query.orderDirection
        };
        setQuery(clearedQuery);
        handleSearch(clearedQuery);
        
        message.success('View deleted successfully!');
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedView('');
    const clearedQuery: LogQuery = {
      query: '',
      filters: [],
      // Mevcut zaman aralığını ve ayarları koru
      timeRange: query.timeRange,
      limit: query.limit,
      orderBy: query.orderBy,
      orderDirection: query.orderDirection
    };
    setQuery(clearedQuery);
    // Temizlenmiş query ile arama yap
    handleSearch(clearedQuery);
    message.info('Selection cleared');
  };

  const handleSaveAs = () => {
    saveViewForm.setFieldsValue({
      name: `Copy of ${savedViews.find(v => v.id === selectedView)?.name || 'View'}`
    });
    setSaveViewVisible(true);
  };

  const executePipeline = async () => {
    if (!selectedPipeline) {
      message.warning('Please select a pipeline');
      return;
    }
    
    if (filteredLogs.length === 0) {
      message.warning('No logs to process');
      return;
    }
    
    try {
      setLoading(true);
      const execution = await pipelineApi.executePipeline(selectedPipeline, filteredLogs);
      
      if (execution.status === 'completed') {
        message.success(`Pipeline executed successfully. Processed ${execution.processedLogs} logs.`);
        // Pipeline sonrası veriyi tazele
        await handleSearch();
      } else {
        message.error(`Pipeline execution failed: ${execution.errorMessage}`);
      }
    } catch (error) {
      message.error('Failed to execute pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PluginPage>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Tabs
              activeKey="logs"
              onChange={(key) => window.location.href = key === 'logs' ? '/a/iyzitrace-app/logs' : '/a/iyzitrace-app/logs-pipelines'}
              items={[
                { key: 'logs', label: 'Explorer' },
                { key: 'pipelines', label: 'Pipelines' }
              ]}
            />
            {/* <div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>Logs</Title>
              <Text style={{ color: '#8c8c8c' }}>
                View and manage your application logs
              </Text>
            </div> */}
          </div>
           <Space>
             <Select
               placeholder="Select a view"
               value={selectedView}
               onChange={handleViewSelect}
               style={{ width: 200 }}
               allowClear
             >
               {savedViews.map(view => (
                 <Option key={view.id} value={view.id}>
                   {view.name}
                 </Option>
               ))}
             </Select>
             
             {selectedView ? (
               <Dropdown
                 menu={{
                   items: [
                     {
                       key: 'update',
                       label: 'Update',
                       icon: <SaveOutlined />,
                       onClick: handleUpdateView
                     },
                     {
                       key: 'saveAs',
                       label: 'Save As',
                       icon: <CopyOutlined />,
                       onClick: handleSaveAs
                     },
                     {
                       key: 'clear',
                       label: 'Clear Selection',
                       icon: <ClearOutlined />,
                       onClick: handleClearSelection
                     },
                     {
                       type: 'divider'
                     },
                     {
                       key: 'delete',
                       label: 'Delete',
                       icon: <DeleteOutlined />,
                       danger: true,
                       onClick: handleDeleteView
                     }
                   ]
                 }}
                 trigger={['click']}
               >
                 <Button 
                  type="primary" 
                  icon={<MoreOutlined />}>
                   Actions
                 </Button>
               </Dropdown>
             ) : (
               <Button
                 type="primary" 
                 icon={<SaveOutlined />}
                 onClick={handleSaveView}
               >
                 Save View
               </Button>
             )}
             
             <Select
               placeholder="Select Pipeline"
               value={selectedPipeline}
               onChange={setSelectedPipeline}
               style={{ width: 200 }}
               allowClear
             >
               {pipelines.map(pipeline => (
                 <Option key={pipeline.id} value={pipeline.id}>
                   {pipeline.name}
                 </Option>
               ))}
             </Select>
             
             <Button 
               type="primary" 
               icon={<PlayCircleOutlined />}
               onClick={executePipeline}
               disabled={!selectedPipeline || loading}
             >
               Execute Pipeline
             </Button>
             
             <Button
               type="primary"
               icon={<PlusOutlined />}
               onClick={handleAddToDashboard}
             >
               Add to Dashboard
             </Button>
           </Space>
        </div>

        <Layout>
          {/* Üst kısım - Query Builder */}
          {!queryCollapsed && (
            <Content style={{ 
              background: '#0a0a0a', 
              borderBottom: '1px solid #262626',
              position: 'relative'
            }}>
              {/* Query Collapse Button */}
              <Button
                type="text"
                icon={<UpOutlined />}
                onClick={() => setQueryCollapsed(true)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                  color: '#8c8c8c',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid #262626'
                }}
                size="small"
              >
                Hide Query
              </Button>
              
              <div style={{ padding: '16px' }}>
                <LogQueryBuilder 
                  query={query}
                  logs={filteredLogs}
                  onQueryChange={setQuery}
                  onSearch={handleSearch}
                />
              </div>
            </Content>
          )}

          {/* Query Show Button - sadece query gizliyken göster */}
          {queryCollapsed && (
            <div style={{ 
              background: '#0a0a0a', 
              borderBottom: '1px solid #262626',
              padding: '8px 16px',
              textAlign: 'center'
            }}>
              <Button
                type="text"
                icon={<DownOutlined />}
                onClick={() => setQueryCollapsed(false)}
                style={{
                  color: '#8c8c8c',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid #262626'
                }}
                size="small"
              >
                Show Query
              </Button>
            </div>
          )}

          <Layout>
            {/* Sol taraf - Filters */}
            {!filtersCollapsed && (
              <Sider 
                width={300}
                style={{ 
                  background: '#0a0a0a', 
                  borderRight: '1px solid #262626',
                  position: 'relative'
                }}
              >
                {/* Filters Collapse Button */}
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={() => setFiltersCollapsed(true)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 10,
                    color: '#8c8c8c',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid #262626'
                  }}
                  size="small"
                >
                  Hide Filters
                </Button>
                
                <div style={{ padding: '16px', overflow: 'auto', height: '100%' }}>
                  <LogFilters 
                    filters={query.filters}
                    logs={allLogs.length > 0 ? allLogs : filteredLogs}
                    onFiltersChange={(filters) => setQuery({...query, filters})}
                    onSearch={handleSearch}
                  />
                </div>
              </Sider>
            )}

            {/* Sağ taraf - Results */}
            <Content style={{ 
              background: '#0a0a0a', 
              padding: '16px', 
              overflow: 'auto',
              position: 'relative'
            }}>
              {/* Filters Show Button - sadece filters gizliyken göster */}
              {filtersCollapsed && (
                <Button
                  type="text"
                  icon={<RightOutlined />}
                  onClick={() => setFiltersCollapsed(false)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    zIndex: 10,
                    color: '#8c8c8c',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid #262626'
                  }}
                  size="small"
                >
                  Show Filters
                </Button>
              )}
              
              <LogResults 
                logs={filteredLogs}
                loading={loading}
                getLevelColor={getLevelColor}
              />
            </Content>
          </Layout>
        </Layout>

        {/* Add to Dashboard Modal */}
        <Modal
          title="Add Logs View to Dashboard"
          open={addToDashboardVisible}
          onOk={handleDashboardModalOk}
          onCancel={handleDashboardModalCancel}
          okText="Add to Dashboard"
          cancelText="Cancel"
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              title: `Logs - ${query.query || 'All Logs'}`,
              type: 'logs',
              query: query.query,
              filters: query.filters,
              timeRange: query.timeRange
            }}
          >
            <Form.Item
              label="Widget Title"
              name="title"
              rules={[{ required: true, message: 'Please enter widget title' }]}
            >
              <Input placeholder="Enter widget title" />
            </Form.Item>

            <Form.Item
              label="Current Query"
              name="query"
            >
              <Input.TextArea 
                placeholder="Current query will be saved with this widget"
                rows={2}
                readOnly
              />
            </Form.Item>

            <Form.Item
              label="Active Filters"
              name="filters"
            >
              <Input.TextArea 
                placeholder={`${query.filters.length} filters active`}
                rows={2}
                readOnly
              />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <Input.TextArea 
                placeholder="Optional description for this widget"
                rows={2}
              />
            </Form.Item>
          </Form>
         </Modal>

         {/* Save View Modal */}
         <Modal
           title="Save Log View"
           open={saveViewVisible}
           onOk={handleSaveViewOk}
           onCancel={handleSaveViewCancel}
           okText="Save View"
           cancelText="Cancel"
         >
           <Form
             form={saveViewForm}
             layout="vertical"
             initialValues={{
               name: `View - ${query.query || 'All Logs'}`
             }}
           >
             <Form.Item
               label="View Name"
               name="name"
               rules={[{ required: true, message: 'Please enter view name' }]}
             >
               <Input placeholder="Enter view name" />
             </Form.Item>

             <div style={{ 
               background: '#1f1f1f', 
               padding: '12px', 
               borderRadius: '6px',
               marginBottom: '16px'
             }}>
               <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Current settings will be saved:</Text>
               <div style={{ marginTop: '8px' }}>
                 <Text style={{ color: 'white', fontSize: '12px' }}>
                   Query: {query.query || 'All logs'}
                 </Text>
                 <br />
                 <Text style={{ color: 'white', fontSize: '12px' }}>
                   Filters: {query.filters.length} active
                 </Text>
                 <br />
                 <Text style={{ color: 'white', fontSize: '12px' }}>
                   Time Range: {new Date(query.timeRange.start).toLocaleString()} - {new Date(query.timeRange.end).toLocaleString()}
                 </Text>
               </div>
             </div>
           </Form>
         </Modal>
      </div>
    </PluginPage>
  );
}

function Logs() {
  return (
    <App>
      <LogsContent />
    </App>
  );
}

export default Logs;
