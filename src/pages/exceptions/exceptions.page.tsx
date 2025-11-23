import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Table,
  message,
  Badge,
  Tag,
} from 'antd';
import {
  SearchOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { ExceptionGroup, getExceptions } from '../../api/service/exception.service';
import pluginJson from '../../plugin.json';
import { getOperationTypeColor } from '../../api/service/services.service';
import { FilterParamsModel } from '../../api/service/query.service';

const { Search } = Input;
const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

const getStyles = () => ({
  container: css`
    padding: 24px;
    background: #0f0f0f;
    min-height: 100vh;
    color: #fff;
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  `,
  breadcrumb: css`
    color: #8c8c8c;
    font-size: 14px;
    margin-bottom: 16px;
  `,
  title: css`
    font-size: 24px;
    font-weight: 600;
    color: #fff;
    margin: 0;
    text-decoration: underline;
    cursor: pointer;
  `,
  timeRangeSelector: css`
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  timeRangeButton: css`
    background: #1f1f1f;
    border: 1px solid #404040;
    color: #fff;
    
    &:hover {
      background: #2a2a2a;
      border-color: #555;
    }
    
    &.active {
      background: #7c3aed;
      border-color: #7c3aed;
    }
  `,
  refreshInfo: css`
    color: #8c8c8c;
    font-size: 12px;
    margin-left: 8px;
  `,
  filterContainer: css`
    margin-bottom: 16px;
  `,
  table: css`
    .ant-table {
      background: #1a1a1a;
      color: #fff;
    }
    
    .ant-table-thead > tr > th {
      background: #2a2a2a;
      border-bottom: 1px solid #404040;
      color: #fff;
    }
    
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid #404040;
      color: #fff;
    }
    
    .ant-table-tbody > tr:hover > td {
      background: #2a2a2a;
    }
  `,
  exceptionTypeLink: css`
    color: #7c3aed;
    cursor: pointer;
    text-decoration: none;
    
    &:hover {
      color: #8b5cf6;
      text-decoration: underline;
    }
  `,
  severityBadge: css`
    &.critical {
      background: #dc2626;
      color: #fff;
    }
    
    &.high {
      background: #ea580c;
      color: #fff;
    }
    
    &.medium {
      background: #d97706;
      color: #fff;
    }
    
    &.low {
      background: #16a34a;
      color: #fff;
    }
  `,
});

const ExceptionsPage: React.FC = () => {
  const styles = getStyles();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [exceptionGroups, setExceptionGroups] = useState<ExceptionGroup[]>([]);

  useEffect(() => {
    fetchExceptionGroups();
  }, []);

  const fetchExceptionGroups = async () => {
    setLoading(true);
    try {
      const data = await await getExceptions(new FilterParamsModel({
        from: String(new Date().getTime() - 1000 * 60 * 60 * 24),
        to: String(new Date().getTime()),
        option_interval: '5h',
      }));
      setExceptionGroups(data);
    } catch (error) {
      console.error('Error fetching exception groups:', error);
      message.error('Failed to fetch exception groups');
    } finally {
      setLoading(false);
    }
  };

  const handleExceptionClick = (exceptionType: string) => {
    navigate(`${PLUGIN_BASE_URL}/exceptions/${exceptionType}`);
  };

  const columns = [
    {
      title: 'Exception Type',
      dataIndex: 'exceptionType',
      key: 'exceptionType',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => a.exceptionType.localeCompare(b.exceptionType),
      render: (text: string, record: ExceptionGroup) => (
        <span
          className={styles.exceptionTypeLink}
          onClick={() => handleExceptionClick(record.exceptionType)}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Exception Message',
      dataIndex: 'exceptionMessage',
      key: 'exceptionMessage',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => a.exceptionMessage.localeCompare(b.exceptionMessage),
      render: (text: string) => (
        <span style={{ color: '#fff' }}>{text}</span>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => a.service.localeCompare(b.service),
      render: (app: string, record: ExceptionGroup) => (
        <span 
          style={{ color: '#1890ff', cursor: 'pointer' }} 
          onClick={() => navigate(`/a/iyzitrace-app/services/${record.service}`)}>
          {record.service}
        </span>
      ),
    },
    {
      title: 'Operation',
      dataIndex: 'operation',
      key: 'operation',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => a.operation.localeCompare(b.operation),
      render: (text: string) => (
        <span style={{ color: '#fff' }}>{text}</span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => a.type.localeCompare(b.type),
      render: (text: string) => (
        <Tag color={getOperationTypeColor(text.toUpperCase())}>{text.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => a.count - b.count,
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#7c3aed' }} />
      ),
    }
  ];

  const filteredGroups = exceptionGroups.filter(group =>
    group.exceptionType.toLowerCase().includes(filterText.toLowerCase()) ||
    group.exceptionMessage.toLowerCase().includes(filterText.toLowerCase()) ||
    group.service.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className={styles.container}>

      {/* Filter */}
      <div className={styles.filterContainer}>
        <Search
          placeholder="Filter exceptions..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          onSearch={setFilterText}
        />
      </div>

      {/* Exceptions Table */}
      <Card style={{ background: '#1a1a1a', border: '1px solid #404040' }}>
        <Table
          className={styles.table}
          columns={columns}
          dataSource={filteredGroups}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            style: { color: '#fff' },
          }}
          rowKey="exceptionType"
          loading={loading}
          scroll={{ x: 1200 }}
        />
        
        {filteredGroups.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
            No exceptions found for the selected time range.
          </div>
        )}
      </Card>
    </div>
  );
};

export default ExceptionsPage;
