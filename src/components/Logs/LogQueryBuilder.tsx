import React from 'react';
import { Card, Input, Select, Button, Space, Typography, DatePicker, Modal, Form, InputNumber } from 'antd';
import { SearchOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import { LogQuery, LogEntry } from '../../interfaces/logs.interface';
import dayjs from 'dayjs';

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

const saveLogSettings = (settings: any) => {
  try {
    localStorage.setItem('logSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving log settings:', error);
  }
};

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface LogQueryBuilderProps {
  query: LogQuery;
  logs: LogEntry[];
  onQueryChange: (query: LogQuery) => void;
  onSearch: () => void;
}

const LogQueryBuilder: React.FC<LogQueryBuilderProps> = ({ 
  query, 
  logs,
  onQueryChange, 
  onSearch 
}) => {
  const handleTimeRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      onQueryChange({
        ...query,
        timeRange: {
          start: dates[0].valueOf(),
          end: dates[1].valueOf()
        }
      });
    }
  };

  const handleQueryChange = (value: string) => {
    onQueryChange({
      ...query,
      query: value
    });
  };

  const handleLimitChange = (value: number) => {
    onQueryChange({
      ...query,
      limit: value
    });
  };

  const handleOrderByChange = (value: string) => {
    onQueryChange({
      ...query,
      orderBy: value as any
    });
  };

  const handleOrderDirectionChange = (value: string) => {
    onQueryChange({
      ...query,
      orderDirection: value as any
    });
  };

  const handleExport = () => {
    if (logs.length === 0) {
      console.warn('No logs to export');
      return;
    }
    
    // Export functionality - CSV format with actual log data
    const csvContent = generateCSV(query, logs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const [form] = Form.useForm();

  const handleSettings = () => {
    // Load saved settings from localStorage
    const savedSettings = getLogSettings();
    
    // Use saved settings if available, otherwise use current query values
    const formValues = savedSettings ? {
      limit: savedSettings.limit || query.limit,
      orderBy: savedSettings.orderBy || query.orderBy,
      orderDirection: savedSettings.orderDirection || query.orderDirection
    } : {
      limit: query.limit,
      orderBy: query.orderBy,
      orderDirection: query.orderDirection
    };
    
    form.setFieldsValue(formValues);
    setSettingsVisible(true);
  };

  const handleSettingsOk = () => {
    form.validateFields().then(values => {
      // Save settings to localStorage
      const settings = {
        limit: values.limit,
        orderBy: values.orderBy,
        orderDirection: values.orderDirection
      };
      saveLogSettings(settings);
      
      // Apply settings
      onQueryChange({
        ...query,
        limit: values.limit,
        orderBy: values.orderBy,
        orderDirection: values.orderDirection
      });
      setSettingsVisible(false);
    }).catch(errorInfo => {
      console.log('Validation failed:', errorInfo);
    });
  };

  const handleSettingsCancel = () => {
    setSettingsVisible(false);
  };

  const generateCSV = (query: LogQuery, logs: LogEntry[]) => {
    // Generate CSV header
    const headers = ['Timestamp', 'Level', 'Service', 'Message', 'TraceID', 'Environment', 'Namespace', 'Pod', 'Hostname'];
    const csvRows: string[] = [];
    
    csvRows.push(headers.join(','));
    
    // Add actual log data
    logs.forEach(log => {
      const row = [
        `"${dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')}"`,
        `"${log.level}"`,
        `"${log.service}"`,
        `"${log.message.replace(/"/g, '""')}"`, // Escape quotes in message
        `"${log.traceId || ''}"`,
        `"${log.environment || ''}"`,
        `"${log.namespace || ''}"`,
        `"${log.pod || ''}"`,
        `"${log.hostname || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  return (
    <Card 
      style={{ 
        background: '#1f1f1f', 
        border: '1px solid #262626',
        marginBottom: '16px'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Query Input */}
        <div>
          <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Query</Text>
          <Input
            placeholder="Search in logs or use label filters (e.g., level = 'ERROR' or service = 'backend')"
            value={query.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onPressEnter={onSearch}
            style={{ 
              marginTop: '4px',
              background: '#0a0a0a',
              border: '1px solid #262626',
              color: 'white'
            }}
            suffix={
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={onSearch}
                size="small"
              >
                Search
              </Button>
            }
          />
        </div>

        {/* Controls Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {/* Time Range */}
            <div>
              <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Time Range</Text>
              <RangePicker
                value={[
                  dayjs(query.timeRange.start),
                  dayjs(query.timeRange.end)
                ]}
                onChange={handleTimeRangeChange}
                style={{ 
                  marginTop: '4px',
                  background: '#0a0a0a',
                  border: '1px solid #262626'
                }}
                size="small"
              />
            </div>

            {/* Limit */}
            <div>
              <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Limit</Text>
              <Select
                value={query.limit}
                onChange={handleLimitChange}
                style={{ 
                  width: 100,
                  marginTop: '4px'
                }}
                size="small"
              >
                <Option value={50}>50</Option>
                <Option value={100}>100</Option>
                <Option value={500}>500</Option>
                <Option value={1000}>1000</Option>
              </Select>
            </div>

            {/* Order By */}
            <div>
              <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Order By</Text>
              <Select
                value={query.orderBy}
                onChange={handleOrderByChange}
                style={{ 
                  width: 120,
                  marginTop: '4px'
                }}
                size="small"
              >
                <Option value="timestamp">Timestamp</Option>
                <Option value="level">Level</Option>
                <Option value="service">Service</Option>
              </Select>
            </div>

            {/* Order Direction */}
            <div>
              <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Direction</Text>
              <Select
                value={query.orderDirection}
                onChange={handleOrderDirectionChange}
                style={{ 
                  width: 100,
                  marginTop: '4px'
                }}
                size="small"
              >
                <Option value="desc">Desc</Option>
                <Option value="asc">Asc</Option>
              </Select>
            </div>
          </Space>

          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              size="small"
              style={{ background: '#262626', border: '1px solid #262626', color: 'white' }}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button 
              icon={<SettingOutlined />} 
              size="small"
              style={{ background: '#262626', border: '1px solid #262626', color: 'white' }}
              onClick={handleSettings}
            >
              Settings
            </Button>
          </Space>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>Quick Actions:</Text>
            <Button 
              size="small" 
              type="link"
              style={{ color: '#1890ff' }}
              onClick={() => handleQueryChange('level = "ERROR"')}
            >
              Show Errors
            </Button>
            <Button 
              size="small" 
              type="link"
              style={{ color: '#1890ff' }}
              onClick={() => handleQueryChange('service = "frontend"')}
            >
              Frontend Logs
            </Button>
            <Button 
              size="small" 
              type="link"
              style={{ color: '#1890ff' }}
              onClick={() => handleQueryChange('http.status_code >= 400')}
            >
              HTTP Errors
            </Button>
          </Space>

          <Text style={{ color: '#8c8c8c', fontSize: '12px' }}>
            {query.filters.length} filters active
          </Text>
        </div>
      </Space>

      {/* Settings Modal */}
      <Modal
        title="Log Settings"
        open={settingsVisible}
        onOk={handleSettingsOk}
        onCancel={handleSettingsCancel}
        okText="Apply"
        cancelText="Cancel"
        style={{ color: 'white' }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            limit: query.limit,
            orderBy: query.orderBy,
            orderDirection: query.orderDirection
          }}
        >
          <Form.Item
            label="Default Limit"
            name="limit"
            rules={[{ required: true, message: 'Please enter a limit' }]}
          >
            <InputNumber
              min={1}
              max={10000}
              style={{ width: '100%' }}
              placeholder="Number of logs to fetch"
            />
          </Form.Item>

          <Form.Item
            label="Default Order By"
            name="orderBy"
            rules={[{ required: true, message: 'Please select order by' }]}
          >
            <Select placeholder="Select order by field">
              <Option value="timestamp">Timestamp</Option>
              <Option value="level">Level</Option>
              <Option value="service">Service</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Default Direction"
            name="orderDirection"
            rules={[{ required: true, message: 'Please select direction' }]}
          >
            <Select placeholder="Select direction">
              <Option value="desc">Descending (Newest First)</Option>
              <Option value="asc">Ascending (Oldest First)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default LogQueryBuilder;
