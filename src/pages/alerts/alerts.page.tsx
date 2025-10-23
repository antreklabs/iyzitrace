import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Table,
  Modal,
  Checkbox,
  message,
  Badge,
  Tabs,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  SettingOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { api, type AlertRule, type FailedCheck, type TimeRange } from '../../api/alerts';

const { Search } = Input;
const { TabPane } = Tabs;

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
  title: css`
    font-size: 24px;
    font-weight: 600;
    color: #fff;
    margin: 0;
  `,
  manageButton: css`
    background: #7c3aed;
    border-color: #7c3aed;
    color: #fff;
    
    &:hover {
      background: #8b5cf6;
      border-color: #8b5cf6;
    }
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
  timelineContainer: css`
    background: #1a1a1a;
    border: 1px solid #404040;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
  `,
  timelineTitle: css`
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    margin-bottom: 12px;
  `,
  timeline: css`
    display: flex;
    gap: 2px;
    margin-bottom: 8px;
  `,
  timeBox: css`
    height: 32px;
    min-width: 20px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.1);
      z-index: 1;
    }
    
    &.critical {
      background: #dc2626;
    }
    
    &.warning {
      background: #d97706;
    }
    
    &.degraded {
      background: #ca8a04;
    }
    
    &.healthy {
      background: #16a34a;
    }
    
    &.no-data {
      background: #404040;
    }
  `,
  timeLabels: css`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #8c8c8c;
    margin-top: 4px;
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
  detailPanel: css`
    position: fixed;
    top: 0;
    right: 0;
    width: 500px;
    height: 100vh;
    background: #1a1a1a;
    border-left: 1px solid #404040;
    z-index: 1000;
    overflow-y: auto;
  `,
  detailHeader: css`
    padding: 16px;
    border-bottom: 1px solid #404040;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  detailTitle: css`
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    margin: 0;
  `,
  detailContent: css`
    padding: 16px;
  `,
  metricGraph: css`
    background: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  `,
  ruleInfo: css`
    background: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  `,
  resourceInfo: css`
    background: #2a2a2a;
    border: 1px solid #404040;
    border-radius: 8px;
    padding: 16px;
  `,
  modal: css`
    .ant-modal-content {
      background: #1a1a1a;
      color: #fff;
    }
    
    .ant-modal-header {
      background: #2a2a2a;
      border-bottom: 1px solid #404040;
    }
    
    .ant-modal-title {
      color: #fff;
    }
    
    .ant-modal-body {
      background: #1a1a1a;
    }
  `,
});

const AlertsPage: React.FC = () => {
  const styles = getStyles();
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [filterText, setFilterText] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<FailedCheck | null>(null);
  const [manageRulesModalVisible, setManageRulesModalVisible] = useState(false);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [failedChecks, setFailedChecks] = useState<FailedCheck[]>([]);
  const [timelineData, setTimelineData] = useState<Array<{
    time: string;
    status: 'critical' | 'warning' | 'degraded' | 'healthy' | 'no-data';
    count: number;
  }>>([]);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const [rules, checks, timeline] = await Promise.all([
        api.getAlertRules(),
        api.getFailedChecks(timeRange),
        api.getTimelineData(timeRange),
      ]);
      
      setAlertRules(rules);
      setFailedChecks(checks);
      setTimelineData(timeline);
    } catch (error) {
      console.error('Error fetching alerts data:', error);
      message.error('Failed to fetch alerts data');
    }
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleAlertClick = (alert: FailedCheck) => {
    setSelectedAlert(alert);
  };

  const handleCloseDetailPanel = () => {
    setSelectedAlert(null);
  };

  const handleManageRules = () => {
    setManageRulesModalVisible(true);
  };

  const handleRuleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      await api.updateAlertRule(ruleId, { enabled });
      await fetchData();
      message.success(`Alert rule ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating alert rule:', error);
      message.error('Failed to update alert rule');
    }
  };

  const getStatusColor = (status: string) => {
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

  const getTimelineBoxClass = (status: string) => {
    switch (status) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'warning';
      case 'degraded':
        return 'degraded';
      case 'healthy':
        return 'healthy';
      default:
        return 'no-data';
    }
  };

  const columns = [
    {
      title: 'Last status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Badge 
          color={getStatusColor(status)} 
          text={status.toUpperCase()}
          style={{ color: '#fff' }}
        />
      ),
    },
    {
      title: 'Affected resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource: string) => (
        <span style={{ color: '#fff' }}>{resource}</span>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      render: (summary: string) => (
        <span style={{ color: '#fff' }}>{summary}</span>
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
          {ruleName}
        </Button>
      ),
    },
  ];

  const timeRanges = [
    { key: '1h', label: 'Last 1 hour' },
    { key: '6h', label: 'Last 6 hours' },
    { key: '1d', label: 'Last 1 day' },
    { key: '7d', label: 'Last 7 days' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Failed checks</h1>
        <Button
          className={styles.manageButton}
          icon={<SettingOutlined />}
          onClick={handleManageRules}
        >
          Manage Alert Rules
        </Button>
      </div>

      {/* Time Range Selector */}
      <div className={styles.timeRangeSelector}>
        <span style={{ color: '#8c8c8c' }}>Time range:</span>
        {timeRanges.map(range => (
          <Button
            key={range.key}
            className={`${styles.timeRangeButton} ${timeRange === range.key ? 'active' : ''}`}
            onClick={() => handleTimeRangeChange(range.key as TimeRange)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className={styles.timelineContainer}>
        <div className={styles.timelineTitle}>
          Aggregated failed checks
        </div>
        <div className={styles.timeline}>
          {timelineData.map((item, index) => (
            <Tooltip
              key={index}
              title={`${item.time}: ${item.count} alerts (${item.status})`}
            >
              <div
                className={`${styles.timeBox} ${getTimelineBoxClass(item.status)}`}
                style={{ flex: 1 }}
              />
            </Tooltip>
          ))}
        </div>
        <div className={styles.timeLabels}>
          {timelineData.length > 0 && (
            <>
              <span>{timelineData[0].time}</span>
              <span>{timelineData[Math.floor(timelineData.length / 2)].time}</span>
              <span>{timelineData[timelineData.length - 1].time}</span>
            </>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filterContainer}>
        <Search
          placeholder="Filter failed checks..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          onSearch={setFilterText}
        />
      </div>

      {/* Failed Checks Table */}
      <Card style={{ background: '#1a1a1a', border: '1px solid #404040' }}>
        <div style={{ marginBottom: 16, color: '#fff' }}>
          <strong>Failed checks</strong> Showing {failedChecks.length} failed checks {failedChecks.filter(c => c.status === 'CRITICAL').length} critical
        </div>
        
        <Table
          className={styles.table}
          columns={columns}
          dataSource={failedChecks.filter(check =>
            check.resource.toLowerCase().includes(filterText.toLowerCase()) ||
            check.summary.toLowerCase().includes(filterText.toLowerCase())
          )}
          pagination={false}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => handleAlertClick(record),
            style: { cursor: 'pointer' },
          })}
        />
        
        {failedChecks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
            No more failed checks found within time range.
          </div>
        )}
      </Card>

      {/* Detail Panel */}
      {selectedAlert && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <div>
              <h3 className={styles.detailTitle}>Failed check</h3>
              <div style={{ color: '#8c8c8c', fontSize: 14 }}>
                {selectedAlert.resource}
              </div>
              <Badge 
                color={getStatusColor(selectedAlert.status)} 
                text={selectedAlert.status}
                style={{ marginTop: 8 }}
              />
            </div>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleCloseDetailPanel}
              style={{ color: '#8c8c8c' }}
            />
          </div>
          
          <div className={styles.detailContent}>
            <Tabs defaultActiveKey="overview">
              <TabPane tab="Overview" key="overview">
                {/* Timeline Graph */}
                <div className={styles.metricGraph}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ color: '#fff', margin: 0 }}>Timeline</h4>
                    <Button type="primary" size="small">
                      View failed check
                    </Button>
                  </div>
                  <div style={{ 
                    height: 200, 
                    background: '#1a1a1a', 
                    border: '1px solid #404040', 
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8c8c8c'
                  }}>
                    Metric timeline graph would be here
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: '#fff', marginBottom: 8 }}>Description</h4>
                  <p style={{ color: '#8c8c8c', margin: 0 }}>
                    {selectedAlert.summary}
                  </p>
                </div>

                {/* Rule */}
                <div className={styles.ruleInfo}>
                  <h4 style={{ color: '#fff', marginBottom: 12 }}>Rule</h4>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: '#fff' }}>Name:</strong>{' '}
                    <Button type="link" style={{ color: '#7c3aed', padding: 0 }}>
                      {selectedAlert.ruleName}
                    </Button>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: '#fff' }}>Evaluate every:</strong>{' '}
                    <span style={{ color: '#8c8c8c' }}>5m</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: '#fff' }}>Metric:</strong>{' '}
                    <span style={{ color: '#8c8c8c' }}>app.ads.ad_requests aggregated as None grouped by Nothing</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: '#fff' }}>Thresholds:</strong>{' '}
                    <span style={{ color: '#8c8c8c' }}>when over the last 5m the value of the metric is above 1 / 2</span>
                  </div>
                  <div>
                    <strong style={{ color: '#fff' }}>Grace periods:</strong>{' '}
                    <span style={{ color: '#8c8c8c' }}>For 5m, Keep firing for 0s (default)</span>
                  </div>
                </div>
              </TabPane>
              
              <TabPane tab="Attributes" key="attributes">
                <div style={{ color: '#8c8c8c' }}>
                  Alert attributes would be displayed here
                </div>
              </TabPane>
              
              <TabPane tab="Affected resource" key="resource">
                <div className={styles.resourceInfo}>
                  <h4 style={{ color: '#fff', marginBottom: 12 }}>
                    Affected resource <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <strong style={{ color: '#fff' }}>Service:</strong>{' '}
                      <span style={{ color: '#8c8c8c' }}>opentelemetry-demo</span>
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>Namespace:</strong>{' '}
                      <span style={{ color: '#8c8c8c' }}>ad</span>
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>Name:</strong>{' '}
                      <span style={{ color: '#8c8c8c' }}>-</span>
                    </div>
                    <div>
                      <strong style={{ color: '#fff' }}>Version:</strong>{' '}
                      <span style={{ color: '#8c8c8c' }}>2.1.2</span>
                    </div>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </div>
        </div>
      )}

      {/* Manage Alert Rules Modal */}
      <Modal
        title="Manage Alert Rules"
        open={manageRulesModalVisible}
        onCancel={() => setManageRulesModalVisible(false)}
        footer={null}
        className={styles.modal}
        width={800}
      >
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          {alertRules.map(rule => (
            <div key={rule.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 0',
              borderBottom: '1px solid #404040'
            }}>
              <Checkbox
                checked={rule.enabled}
                onChange={(e) => handleRuleToggle(rule.id, e.target.checked)}
              />
              <div style={{ marginLeft: 12, flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 500 }}>{rule.name}</div>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>{rule.description}</div>
                <div style={{ color: '#8c8c8c', fontSize: 11, fontFamily: 'monospace' }}>
                  {rule.expression}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge 
                  color={rule.thresholds.critical ? '#dc2626' : '#8c8c8c'} 
                  text={`Critical: ${rule.thresholds.critical || 'N/A'}`}
                />
                <Badge 
                  color={rule.thresholds.warning ? '#d97706' : '#8c8c8c'} 
                  text={`Warning: ${rule.thresholds.warning || 'N/A'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AlertsPage;
