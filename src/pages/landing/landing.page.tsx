import React, { useState, useEffect } from 'react';
import {
  Card,
  Icon,
  Badge,
  Button,
  Alert,
  Text,
  useStyles2,
  LoadingPlaceholder,
} from '@grafana/ui';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { getAllSectionStatuses, getSetupStepStatuses } from '../../api/service/landing.service';
import {
  BarChartOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  ClusterOutlined,
  RadarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  DeploymentUnitOutlined,
  BuildOutlined,
  RocketOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

type SectionKey = 'overview' | 'serviceMap' | 'services' | 'traces' | 'logs' | 'views' | 'exceptions' | 'teams' | 'settings' | 'ai';

const NAV_ITEMS: Array<{
  key: SectionKey;
  title: string;
  icon: any;
  route: string;
  description: string;
}> = [
  { key: 'overview', title: 'Overview', icon: BuildOutlined, route: '/a/iyzitrace-app/overview', description: 'High-level health & topology overview of your entire infrastructure and service ecosystem.' },
  { key: 'views', title: 'Views', icon: ClusterOutlined, route: '/a/iyzitrace-app/views', description: 'Create and manage saved queries, custom dashboards, and curated views for your team.' },
  { key: 'serviceMap', title: 'Service Map', icon: DeploymentUnitOutlined, route: '/a/iyzitrace-app/service-map', description: 'Visualize service dependencies and data flow from infrastructure to applications and services.' },
  { key: 'services', title: 'Services', icon: BarChartOutlined, route: '/a/iyzitrace-app/services', description: 'Monitor service performance metrics including P99 latency, error rates, and throughput.' },
  { key: 'traces', title: 'Traces', icon: FileSearchOutlined, route: '/a/iyzitrace-app/traces', description: 'Explore distributed traces to find slow spans, bottlenecks, and analyze request flows.' },
  { key: 'logs', title: 'Logs', icon: ProfileOutlined, route: '/a/iyzitrace-app/logs', description: 'Search and correlate application logs with traces for comprehensive debugging and analysis.' },
  { key: 'exceptions', title: 'Exceptions', icon: RadarChartOutlined, route: '/a/iyzitrace-app/exceptions', description: 'Track and analyze error patterns, exception groups, and failure trends across your services.' },
  { key: 'ai', title: 'AI Assistant', icon: RocketOutlined, route: '/a/iyzitrace-app/ai', description: 'Get intelligent insights and recommendations powered by AI to optimize your observability workflow.' },
  { key: 'teams', title: 'Teams', icon: TeamOutlined, route: '/a/iyzitrace-app/teams', description: 'Manage team members, permissions, and access controls for collaborative observability.' },
  { key: 'settings', title: 'Settings', icon: SettingOutlined, route: '/a/iyzitrace-app/settings', description: 'Configure data sources, plugin settings, and customize your IyziTrace workspace.' },
];

interface SetupStep {
  key: string;
  title: string;
  description: string;
  route: string;
  done: boolean;
}

const STEPS_INFO: Record<string, { description: string; learnMoreUrl: string }> = {
  apiKey: {
    description: 'Configure your IyziTrace API key to enable secure communication between your services and the observability platform.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
  tempo: {
    description: 'Add Tempo datasource to collect and visualize distributed traces from your microservices.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
  loki: {
    description: 'Add Loki datasource to aggregate and query logs from all your applications and infrastructure.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
  prometheus: {
    description: 'Add Prometheus datasource to collect metrics and monitor the health and performance of your services.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
  traces: {
    description: 'Start sending distributed traces to track request flows across your microservices architecture.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
  logs: {
    description: 'Begin collecting logs from your applications to enable powerful search, filtering, and correlation with traces.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
  metrics: {
    description: 'Send metrics data to monitor service performance, resource usage, and system health in real-time.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
  orphanServices: {
    description: 'Map orphan services to their infrastructure hosts to get a complete view of your service topology.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
  ai: {
    description: 'Configure AI Assistant with your API key to get intelligent insights and optimization recommendations.',
    learnMoreUrl: 'https://beta.iyzitrace.com/product',
  },
};

const getStyles = () => ({
  container: css`
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  `,
  header: css`
    margin-bottom: 32px;
  `,
  welcomeText: css`
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
  `,
  description: css`
    color: #8c8c8c;
    margin-bottom: 16px;
  `,
  workspaceInfo: css`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  `,
  statusIndicator: css`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #52c41a;
  `,
  mainContent: css`
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 32px;
    
    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  `,
  leftColumn: css`
    display: flex;
    flex-direction: column;
    gap: 24px;
  `,
  rightColumn: css`
    display: flex;
    flex-direction: column;
  `,
  cardsGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `,
  menuCard: css`
    padding: 20px;
    transition: all 0.2s ease;
    position: relative;
    
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
  `,
  cardRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  `,
  cardLeft: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  cardRight: css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  cardTitle: css`
    font-size: 16px;
    font-weight: 600;
  `,
  cardDescription: css`
    color: #8c8c8c;
    font-size: 14px;
    line-height: 1.4;
  `,
  statusBadge: css`
  `,
  exploreButton: css`
  `,
  stepsPanel: css`
    padding: 24px;
    height: fit-content;
    display: flex;
    flex-direction: column;
  `,
  stepsTitle: css`
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
  stepperSection: css`
    margin-bottom: 24px;
  `,
  progressContainer: css`
    margin-bottom: 24px;
  `,
  progressText: css`
    font-size: 12px;
    color: #8c8c8c;
    margin-bottom: 8px;
  `,
  progressBar: css`
    width: 100%;
    height: 8px;
    background: #2a2a2a;
    border-radius: 4px;
    overflow: hidden;
  `,
  progressFill: css`
    height: 100%;
    background: #1890ff;
    border-radius: 4px;
    transition: width 0.3s ease;
  `,
  stepsList: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,
  stepRow: css`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    position: relative;
  `,
  infoButtonWrapper: css`
    position: relative;
  `,
  infoButton: css`
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #8c8c8c;
    transition: all 0.2s ease;
    
    &:hover {
      color: #1890ff;
      background: rgba(24, 144, 255, 0.1);
    }
  `,
  tooltip: css`
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 12px;
    background: #1f1f1f;
    border: 1px solid #404040;
    border-radius: 8px;
    padding: 16px;
    min-width: 320px;
    max-width: 400px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    
    &::after {
      content: '';
      position: absolute;
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid #404040;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
    }
    
    &::before {
      content: '';
      position: absolute;
      right: -7px;
      top: 50%;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-left: 7px solid #1f1f1f;
      border-top: 7px solid transparent;
      border-bottom: 7px solid transparent;
    }
  `,
  tooltipDescription: css`
    color: #8c8c8c;
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 12px;
  `,
  tooltipActions: css`
    display: flex;
    justify-content: flex-end;
  `,
  stepIcon: css`
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #2a2a2a;
    border: 2px solid #404040;
    
    &.done {
      background: #52c41a;
      border-color: #52c41a;
      color: white;
    }
    
    &.skipped {
      background: #8c8c8c;
      border-color: #8c8c8c;
      color: white;
    }
  `,
  stepContent: css`
    flex: 1;
  `,
  stepTitle: css`
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
  `,
  stepTag: css`
    margin-left: 8px;
  `,
  hoverInfo: css`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #1f1f1f;
    border: 1px solid #404040;
    border-radius: 8px;
    padding: 16px;
    margin-top: 8px;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `,
  hoverDescription: css`
    color: #8c8c8c;
    font-size: 13px;
    margin-bottom: 12px;
  `,
  hoverActions: css`
    display: flex;
    gap: 8px;
  `,
  skipLink: css`
    color: #8c8c8c;
    font-size: 13px;
    text-decoration: none;
    
    &:hover {
      color: #fff;
    }
  `,
  laterLink: css`
    margin-top: auto;
    text-align: right;
    padding-top: 16px;
  `,
  laterLinkText: css`
    color: #8c8c8c;
    font-size: 13px;
    text-decoration: none;
    
    &:hover {
      color: #fff;
    }
  `,
});

interface MenuCardProps {
  item: typeof NAV_ITEMS[0];
  sectionStatuses: Record<SectionKey, boolean>;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, sectionStatuses }) => {
  const navigate = useNavigate();
  const styles = useStyles2(getStyles);
  
  const isActive = sectionStatuses[item.key];
  
  const handleExploreClick = () => {
    navigate(item.route);
  };
  
  return (
    <Card className={styles.menuCard}>
      {
}
      <div className={styles.cardRow}>
        <div className={styles.cardLeft}>
          <item.icon style={{ fontSize: 20, color: '#8c8c8c' }} />
          <div className={styles.cardTitle}>{item.title}</div>
        </div>
        
        <div className={styles.cardRight}>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleExploreClick}
          >
            Explore
          </Button>
          <Badge 
              text={isActive ? 'Active' : 'Inactive'} 
              color={isActive ? 'green' : 'blue'} 
            />
        </div>
      </div>
      
      {
}
      <div className={styles.cardDescription}>{item.description}</div>
    </Card>
  );
};

interface StepRowProps {
  step: SetupStep;
}

const StepRow: React.FC<StepRowProps> = ({ step }) => {
  const styles = useStyles2(getStyles);
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getIconClass = () => {
    if (step.done) return 'done';
    return '';
  };
  
  const getIconName = () => {
    if (step.done) return 'check';
    return '';
  };
  
  const stepInfo = STEPS_INFO[step.key];
  
  const handleGetStarted = () => {
    if (step.route) {
      navigate(step.route);
    }
  };
  
  return (
    <div className={styles.stepRow}>
      <div className={`${styles.stepIcon} ${getIconClass()}`}>
        {getIconName() && <Icon name={getIconName() as any} size="sm" />}
      </div>
      
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          {step.title}
        </div>
      </div>
      
      {!step.done && (
        <div 
          className={styles.infoButtonWrapper}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className={styles.infoButton}>
            <InfoCircleOutlined style={{ fontSize: 16 }} />
          </button>
          
          {showTooltip && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipDescription}>
                {stepInfo?.description}
          </div>
              
              <div className={styles.tooltipActions}>
                <Button 
                  size="sm"
                  variant="primary" 
                  onClick={handleGetStarted}
                >
              Get Started
            </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const styles = useStyles2(getStyles);
  
  const [sectionStatuses, setSectionStatuses] = useState<Record<SectionKey, boolean>>({
    overview: false,
    serviceMap: false,
    services: false,
    traces: false,
    logs: false,
    views: false,
    exceptions: false,
    teams: false,
    settings: false,
    ai: false,
  });
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statuses, stepStatuses] = await Promise.all([
          getAllSectionStatuses(),
          getSetupStepStatuses(),
        ]);
        
        setSectionStatuses(statuses);
        
        const setupSteps: SetupStep[] = [
          { 
            key: 'apiKey', 
            title: 'Set Api Key', 
            description: 'Configure your API key in settings',
            route: '/a/iyzitrace-app/settings',
            done: stepStatuses.apiKey 
          },
          { 
            key: 'tempo', 
            title: 'Add Tempo Datasource', 
            description: 'Add Tempo datasource for traces',
            route: '/connections/datasources',
            done: stepStatuses.tempo 
          },
          { 
            key: 'loki', 
            title: 'Add Loki Datasource', 
            description: 'Add Loki datasource for logs',
            route: '/connections/datasources',
            done: stepStatuses.loki 
          },
          { 
            key: 'prometheus', 
            title: 'Add Prometheus Datasource', 
            description: 'Add Prometheus datasource for metrics',
            route: '/connections/datasources',
            done: stepStatuses.prometheus 
          },
          { 
            key: 'traces', 
            title: 'Send Traces', 
            description: 'Start sending trace data',
            route: '/a/iyzitrace-app/traces',
            done: stepStatuses.traces 
          },
          { 
            key: 'logs', 
            title: 'Send Logs', 
            description: 'Start sending log data',
            route: '/a/iyzitrace-app/logs',
            done: stepStatuses.logs 
          },
          { 
            key: 'metrics', 
            title: 'Send Metrics', 
            description: 'Start sending metrics data',
            route: '/a/iyzitrace-app/services',
            done: stepStatuses.metrics 
          },
          { 
            key: 'orphanServices', 
            title: 'Assign Orphan Services', 
            description: 'Map services to infrastructure',
            route: '/a/iyzitrace-app/overview',
            done: stepStatuses.orphanServices 
          },
          { 
            key: 'ai', 
            title: 'Setup AI Assistant', 
            description: 'Configure AI Assistant',
            route: '/a/iyzitrace-app/settings',
            done: stepStatuses.ai 
          },
        ];
        
        setSteps(setupSteps);
      } catch (err) {
        setError('Failed to load workspace data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleConnectDataSource = () => {
    navigate('/connections/datasources');
  };
  
  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingPlaceholder text="Loading workspace..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <Alert title="Error" severity="error">
          {error}
        </Alert>
      </div>
    );
  }
  
  const completedSteps = steps.filter(step => step.done).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.welcomeText}>
          👋 Hello there, Welcome to your IyziTrace workspace
        </div>
        <div className={styles.description}>
          You're not sending any data yet. IyziTrace works best with your telemetry — start by connecting a data source.
        </div>
        
        <div className={styles.workspaceInfo}>
          <div className={styles.statusIndicator}>
            <Icon name="check" />
            <Text>Your workspace is ready</Text>
          </div>
          <Button onClick={handleConnectDataSource}>
            Connect Data Source
          </Button>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.cardsGrid}>
            {NAV_ITEMS.map((item) => (
              <MenuCard 
                key={item.key} 
                item={item} 
                sectionStatuses={sectionStatuses}
              />
            ))}
          </div>
        </div>
        
        <div className={styles.rightColumn}>
          <Card className={styles.stepsPanel}>
            {
}
            <div className={styles.stepsTitle}>
              Build your observability base
            </div>
            
            {
}
            <div className={styles.stepperSection}>
              <div className={styles.progressText}>
                Step {completedSteps}/{totalSteps}
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            {
}
            <div className={styles.stepsList}>
              {steps.map((step) => (
                <StepRow
                  key={step.key}
                  step={step}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;