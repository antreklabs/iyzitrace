import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Table,
  message,
  Badge,
} from 'antd';
import {
  SearchOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { api, type ExceptionGroup } from '../../api/exceptions';
import pluginJson from '../../plugin.json';

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
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchExceptionGroups();
  }, []);

  const fetchExceptionGroups = async () => {
    setLoading(true);
    try {
      const data = await api.getExceptionGroups();
      setExceptionGroups(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching exception groups:', error);
      message.error('Failed to fetch exception groups');
    } finally {
      setLoading(false);
    }
  };

  const handleExceptionClick = (groupId: string) => {
    navigate(`${PLUGIN_BASE_URL}/exceptions/${groupId}`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#d97706';
      case 'low':
        return '#16a34a';
      default:
        return '#8c8c8c';
    }
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
          onClick={() => handleExceptionClick(record.id)}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Error Message',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => a.errorMessage.localeCompare(b.errorMessage),
      render: (text: string) => (
        <span style={{ color: '#fff' }}>{text}</span>
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
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime(),
      render: (date: string) => (
        <span style={{ color: '#8c8c8c' }}>{date}</span>
      ),
    },
    {
      title: 'First Seen',
      dataIndex: 'firstSeen',
      key: 'firstSeen',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime(),
      render: (date: string) => (
        <span style={{ color: '#8c8c8c' }}>{date}</span>
      ),
    },
    {
      title: 'Application',
      dataIndex: 'application',
      key: 'application',
      sorter: (a: ExceptionGroup, b: ExceptionGroup) => a.application.localeCompare(b.application),
      render: (app: string, record: ExceptionGroup) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fff' }}>{app}</span>
        </div>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Badge text={severity.toUpperCase()} style={{ backgroundColor: getSeverityColor(severity), color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4 }} />
      ),
    },
  ];

  const filteredGroups = exceptionGroups.filter(group =>
    group.exceptionType.toLowerCase().includes(filterText.toLowerCase()) ||
    group.errorMessage.toLowerCase().includes(filterText.toLowerCase()) ||
    group.application.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className={styles.container}>

      {/* Last refresh info */}
      <div style={{ marginBottom: 16, color: '#8c8c8c', fontSize: 12 }}>
        Last refresh - {Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000)} sec ago
      </div>

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
          rowKey="id"
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
