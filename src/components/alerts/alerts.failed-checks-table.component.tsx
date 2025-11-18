import React from 'react';
import { Card, Table, Badge, Button, Checkbox } from 'antd';
import { css } from '@emotion/css';
import { type FailedCheck } from '../../api/service/alert.service';

interface AlertsFailedChecksTableProps {
  failedChecks: FailedCheck[];
  filterText: string;
  onAlertClick: (alert: FailedCheck) => void;
}

const getStyles = () => ({
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
});

const getStatusColor = (status: string) => {
  if (!status) return '#16a34a';
  switch (status.toLowerCase()) {
    case 'critical':
      return '#dc2626';
    case 'warning':
      return '#d97706';
    case 'degraded':
      return '#ca8a04';
    default:
      return '#16a34a';
  }
};

const AlertsFailedChecksTable: React.FC<AlertsFailedChecksTableProps> = ({
  failedChecks,
  filterText,
  onAlertClick,
}) => {
  const styles = getStyles();

  const columns = [
    {
      title: 'Last status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Badge 
          color={getStatusColor(status || '')} 
          text={(status || '').toUpperCase()}
          style={{ color: '#fff' }}
        />
      ),
    },
    {
      title: 'Affected resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource: string) => (
        <span style={{ color: '#fff' }}>{resource || '-'}</span>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      render: (summary: string) => (
        <span style={{ color: '#fff' }}>{summary || '-'}</span>
      ),
    },
    {
      title: 'Attributes',
      key: 'attributes',
      width: 100,
      render: (text: any, record: FailedCheck) => (
        <Checkbox defaultChecked />
      ),
    },
    {
      title: 'Check Rule',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (ruleName: string) => (
        <Button type="link" style={{ color: '#7c3aed', padding: 0 }}>
          {ruleName || '-'}
        </Button>
      ),
    },
  ];

  const filteredChecks = failedChecks.filter(check =>
    (check.resource || '').toLowerCase().includes(filterText.toLowerCase()) ||
    (check.summary || '').toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <Card style={{ background: '#1a1a1a', border: '1px solid #404040' }}>
      <div style={{ marginBottom: 16, color: '#fff' }}>
        <strong>Failed checks</strong> Showing {failedChecks.length} failed checks {failedChecks.filter(c => c.status === 'CRITICAL').length} critical
      </div>
      
      <Table
        className={styles.table}
        columns={columns}
        dataSource={filteredChecks}
        pagination={false}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => onAlertClick(record),
          style: { cursor: 'pointer' },
        })}
      />
      
      {failedChecks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
          No more failed checks found within time range.
        </div>
      )}
    </Card>
  );
};

export default AlertsFailedChecksTable;

