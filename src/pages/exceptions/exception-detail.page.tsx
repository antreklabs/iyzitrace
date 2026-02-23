import React, { useState, useEffect } from 'react';
import {
  Button,
  message,
  Table,
} from 'antd';
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  LinkOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { useNavigate, useParams } from 'react-router-dom';
import pluginJson from '../../plugin.json';
import { getExceptionsByType } from '../../api/service/exception.service';
import { FilterParamsModel } from '../../api/service/query.service';

const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export interface ExceptionDetail {
  id: string;
  eventId: string;
  exceptionType: string;
  errorMessage: string;
  timestamp: string;
  stacktrace: string;
  keyValuePairs: Record<string, any>;
  application: string;
  serviceName?: string;
  traceId?: string;
  spanId?: string;
  logId?: string;
}

export interface ExceptionNavigation {
  hasOlder: boolean;
  hasNewer: boolean;
  currentIndex: number;
  totalCount: number;
}

const getStyles = () => ({
  container: css`
    padding: 24px;
    background: var(--bg-primary);
    min-height: 100vh;
    color: var(--text-primary);
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
  `,
  breadcrumb: css`
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 16px;
  `,
  backButton: css`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    margin-bottom: 16px;
    
    &:hover {
      background: var(--bg-hover);
      border-color: var(--border-strong);
    }
  `,
  exceptionInfo: css`
    flex: 1;
  `,
  exceptionType: css`
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  `,
  errorMessage: css`
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 16px;
    word-break: break-all;
  `,
  eventInfo: css`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  `,
  eventId: css`
    color: var(--text-muted);
    font-family: monospace;
    font-size: 12px;
  `,
  timestamp: css`
    color: var(--text-muted);
    font-size: 14px;
  `,
  navigationButtons: css`
    display: flex;
    gap: 8px;
  `,
  navButton: css`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    
    &:hover {
      background: var(--bg-hover);
      border-color: var(--border-strong);
    }
    
    &:disabled {
      background: var(--bg-tertiary);
      border-color: var(--border-color);
      color: var(--text-muted);
      cursor: not-allowed;
    }
  `,
  actionCardsContainer: css`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  `,
  actionCard: css`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  `,
  actionCardText: css`
    color: var(--text-muted);
    margin-bottom: 12px;
    font-size: 14px;
  `,
  serviceButton: css`
    background: #16a34a;
    border-color: #16a34a;
    color: #fff;
    
    &:hover {
      background: #22c55e;
      border-color: #22c55e;
    }
  `,
  traceButton: css`
    background: #7c3aed;
    border-color: #7c3aed;
    color: #fff;
    
    &:hover {
      background: #8b5cf6;
      border-color: #8b5cf6;
    }
  `,
  spanButton: css`
    background: #ea580c;
    border-color: #ea580c;
    color: #fff;
    
    &:hover {
      background: #f97316;
      border-color: #f97316;
    }
  `,
  stacktraceCard: css`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    margin-bottom: 24px;
  `,
  stacktraceHeader: css`
    background: var(--bg-tertiary);
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    color: var(--text-primary);
  `,
  stacktraceContent: css`
    padding: 16px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-secondary);
    background: var(--bg-primary);
    white-space: pre-wrap;
    overflow-x: auto;
  `,
  keyValueCard: css`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
  `,
  keyValueHeader: css`
    background: var(--bg-tertiary);
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    color: var(--text-primary);
  `,
  keyValueContent: css`
    padding: 16px;
  `,
  keyValueTable: css`
    .ant-table {
      background: transparent;
      color: var(--text-primary);
    }
    
    .ant-table-thead > tr > th {
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
    }
    
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid var(--border-color);
      color: var(--text-primary);
    }
    
    .ant-table-tbody > tr:hover > td {
      background: var(--bg-hover);
    }
  `,
  linkButton: css`
    color: #7c3aed;
    cursor: pointer;
    text-decoration: none;
    
    &:hover {
      color: #8b5cf6;
      text-decoration: underline;
    }
  `,
  monospaceValue: css`
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
  `,
});

const ExceptionDetailPage: React.FC = () => {
  const styles = getStyles();
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const [loading, setLoading] = useState(false);
  const [exception, setException] = useState<ExceptionDetail | null>(null);
  const [navigation, setNavigation] = useState<ExceptionNavigation | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allExceptions, setAllExceptions] = useState<any[]>([]);

  useEffect(() => {
    if (groupId) {
      fetchExceptionDetail(0);
    }
  }, [groupId]);

  const base64ToHex = (base64: string): string => {
    try {
      const raw = atob(base64);
      let hex = '';
      for (let i = 0; i < raw.length; i++) {
        const hexByte = raw.charCodeAt(i).toString(16).padStart(2, '0');
        hex += hexByte;
      }
      return hex;
    } catch (e) {
      return base64;
    }
  };

  const fetchExceptionDetail = async (index: number) => {
    if (!groupId) return;

    setLoading(true);
    try {
      if (allExceptions.length > 0) {
        const currentException = allExceptions[index];
        setException(currentException);
        setNavigation({
          hasOlder: index > 0,
          hasNewer: index < allExceptions.length - 1,
          currentIndex: index,
          totalCount: allExceptions.length,
        });
        setCurrentIndex(index);
        setLoading(false);
        return;
      }

      const traceData = await getExceptionsByType(groupId, new FilterParamsModel({
        from: String(new Date().getTime() - 1000 * 60 * 60 * 24),
        to: String(new Date().getTime()),
        option_interval: '5h',
      }));

      const exceptions: any[] = [];

      traceData.forEach((trace: any) => {
        trace.batches?.forEach((batch: any) => {
          const resourceAttrs = batch.resource?.attributes || [];
          const serviceName = resourceAttrs.find((attr: any) => attr.key === 'service.name')?.value?.stringValue || 'Unknown';
          const hostName = resourceAttrs.find((attr: any) => attr.key === 'host.name')?.value?.stringValue || 'Unknown';

          batch.scopeSpans?.forEach((scopeSpan: any) => {
            scopeSpan.spans?.forEach((span: any) => {
              const spanAttrs = span.attributes || [];

              span.events?.forEach((event: any, eventIdx: number) => {
                if (event.name === 'exception') {
                  const eventAttrs = event.attributes || [];
                  const exceptionType = eventAttrs.find((attr: any) => attr.key === 'exception.type')?.value?.stringValue || 'Unknown';
                  const exceptionMessage = eventAttrs.find((attr: any) => attr.key === 'exception.message')?.value?.stringValue || '';
                  const exceptionStacktrace = eventAttrs.find((attr: any) => attr.key === 'exception.stacktrace')?.value?.stringValue || '';
                  const exceptionEscaped = eventAttrs.find((attr: any) => attr.key === 'exception.escaped')?.value?.stringValue || 'false';

                  const traceIdHex = base64ToHex(span.traceId || '');
                  const spanIdBase64 = span.spanId || '';

                  const keyValuePairs: any = {
                    serviceName,
                    'host.name': hostName,
                    traceID: traceIdHex,
                    spanID: spanIdBase64,
                    exceptionEscaped,
                  };

                  spanAttrs.forEach((attr: any) => {
                    const value = attr.value?.stringValue || attr.value?.intValue || attr.value?.boolValue || '';
                    keyValuePairs[attr.key] = String(value);
                  });

                  resourceAttrs.forEach((attr: any) => {
                    const value = attr.value?.stringValue || attr.value?.intValue || attr.value?.boolValue || '';
                    keyValuePairs[`resource.${attr.key}`] = String(value);
                  });

                  const timestampNanos = event.timeUnixNano || span.startTimeUnixNano;
                  const timestamp = new Date(Number(timestampNanos) / 1000000).toLocaleString();

                  exceptions.push({
                    exceptionType,
                    errorMessage: exceptionMessage,
                    stacktrace: exceptionStacktrace,
                    timestamp,
                    eventId: `${traceIdHex.substring(0, 16)}${eventIdx}`,
                    serviceName,
                    application: serviceName,
                    traceId: traceIdHex,
                    spanId: spanIdBase64,
                    keyValuePairs,
                  });
                }
              });
            });
          });
        });
      });

      if (exceptions.length === 0) {
        message.error('No exceptions found');
        return;
      }

      setAllExceptions(exceptions);

      const currentException = exceptions[Math.min(index, exceptions.length - 1)];
      setException(currentException);

      setNavigation({
        hasOlder: index > 0,
        hasNewer: index < exceptions.length - 1,
        currentIndex: index,
        totalCount: exceptions.length,
      });

      setCurrentIndex(index);
    } catch (error) {
      message.error('Failed to fetch exception details');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (direction: 'older' | 'newer') => {
    if (!navigation) return;

    const newIndex = direction === 'older' ? currentIndex - 1 : currentIndex + 1;
    fetchExceptionDetail(newIndex);
  };

  const handleBack = () => {
    navigate(`${PLUGIN_BASE_URL}/exceptions`);
  };

  const handleLinkClick = (type: 'service' | 'trace' | 'span' | 'logs', value: string) => {
    switch (type) {
      case 'service':
        navigate(`${PLUGIN_BASE_URL}/services/${value}`);
        break;
      case 'trace':
        navigate(`${PLUGIN_BASE_URL}/traces/${value}`);
        break;
      case 'span':
        navigate(`${PLUGIN_BASE_URL}/traces/${exception?.traceId}?spanId=${value}`);
        break;
      case 'logs':
        navigate(`${PLUGIN_BASE_URL}/logs?query=${encodeURIComponent(value)}`);
        break;
    }
  };

  const getKeyValueColumns = () => [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (text: string) => (
        <span className="u-text-white-fw500">{text}</span>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: any, record: { key: string }) => {
        const key = record.key.toLowerCase();

        if (key.includes('servicename') && typeof value === 'string') {
          return (
            <Button
              type="link"
              className={styles.linkButton}
              onClick={() => handleLinkClick('service', value)}
              icon={<LinkOutlined />}
            >
              {value}
            </Button>
          );
        }

        if ((key.includes('trace') || key.includes('traceid')) && typeof value === 'string') {
          return (
            <Button
              type="link"
              className={styles.linkButton}
              onClick={() => handleLinkClick('trace', value)}
              icon={<LinkOutlined />}
            >
              <span className={styles.monospaceValue}>{value}</span>
            </Button>
          );
        }

        if ((key.includes('span') || key.includes('spanid')) && typeof value === 'string') {
          return (
            <Button
              type="link"
              className={styles.linkButton}
              onClick={() => handleLinkClick('span', value)}
              icon={<LinkOutlined />}
            >
              <span className={styles.monospaceValue}>{value}</span>
            </Button>
          );
        }

        if (key.includes('log') && typeof value === 'string') {
          return (
            <Button
              type="link"
              className={styles.linkButton}
              onClick={() => handleLinkClick('logs', value)}
              icon={<LinkOutlined />}
            >
              {value}
            </Button>
          );
        }

        if (typeof value === 'string' && (value.length > 50 || value.includes('http'))) {
          return <span className={styles.monospaceValue}>{value}</span>;
        }

        return <span className="u-text-muted">{String(value)}</span>;
      },
    },
  ];

  if (loading && !exception) {
    return (
      <div className={styles.container}>
        <div className="u-text-center-muted">
          Loading exception details...
        </div>
      </div>
    );
  }

  if (!exception) {
    return (
      <div className={styles.container}>
        <div className="u-text-center-muted">
          Exception not found
        </div>
      </div>
    );
  }

  const keyValueData = Object.entries(exception.keyValuePairs).map(([key, value]) => ({
    key,
    value,
  }));

  return (
    <div className={styles.container}>
      {
      }
      <Button
        className={styles.backButton}
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
      >
        Back to Exceptions
      </Button>

      {
      }
      <div className={styles.header}>
        <div className={styles.exceptionInfo}>
          <h1 className={styles.exceptionType}>{exception.exceptionType}</h1>
          <div className={styles.errorMessage}>{exception.errorMessage}</div>

          <div className={styles.eventInfo}>
            <span className={styles.eventId}>Event {exception.eventId}</span>
            <span className={styles.timestamp}>{exception.timestamp}</span>
          </div>
        </div>

        <div className={styles.navigationButtons}>
          <Button
            className={styles.navButton}
            icon={<LeftOutlined />}
            disabled={!navigation?.hasOlder}
            onClick={() => handleNavigate('older')}
          >
            Previous Exception
          </Button>
          <Button
            className={styles.navButton}
            icon={<RightOutlined />}
            disabled={!navigation?.hasNewer}
            onClick={() => handleNavigate('newer')}
          >
            Next Exception
          </Button>
        </div>
      </div>

      {
      }
      <div className={styles.actionCardsContainer}>
        {
        }
        <div className={styles.actionCard}>
          <div className={styles.actionCardText}>
            View service details and performance metrics for this error
          </div>
          <Button
            className={styles.serviceButton}
            icon={<CodeOutlined />}
            onClick={() => handleLinkClick('service', exception.serviceName || exception.application)}
            disabled={!exception.serviceName && !exception.application}
          >
            View Service Details
          </Button>
        </div>

        {
        }
        <div className={styles.actionCard}>
          <div className={styles.actionCardText}>
            See what happened before and after this error in a trace graph
          </div>
          <Button
            className={styles.traceButton}
            icon={<CodeOutlined />}
            onClick={() => handleLinkClick('trace', exception.traceId || '')}
            disabled={!exception.traceId}
          >
            See the error in trace graph
          </Button>
        </div>

        {
        }
        <div className={styles.actionCard}>
          <div className={styles.actionCardText}>
            View specific span details and execution context
          </div>
          <Button
            className={styles.spanButton}
            icon={<CodeOutlined />}
            onClick={() => handleLinkClick('span', exception.spanId || '')}
            disabled={!exception.spanId}
          >
            View Span Details
          </Button>
        </div>
      </div>

      {
      }
      <div className={styles.keyValueCard}>
        <div className={styles.keyValueHeader}>Key-Value Pairs</div>
        <div className={styles.keyValueContent}>
          <Table
            className={styles.keyValueTable}
            columns={getKeyValueColumns()}
            dataSource={keyValueData}
            pagination={false}
            rowKey="key"
            size="small"
          />
        </div>
      </div>

      {
      }
      <div className={styles.stacktraceCard}>
        <div className={styles.stacktraceHeader}>Stacktrace</div>
        <div className={styles.stacktraceContent}>
          {exception.stacktrace}
        </div>
      </div>
    </div>
  );
};

export default ExceptionDetailPage;