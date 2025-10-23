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
import { getIngestionStatus, getStepStatuses, type IngestionStatus, type Step } from '../api/iyzitrace';
import {
  BarChartOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  AlertOutlined,
  ClusterOutlined,
  RadarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  DeploymentUnitOutlined,
  BuildOutlined
} from '@ant-design/icons';

const NAV_ITEMS = [
  { key: 'infra', title: 'Infra Overview', icon: BuildOutlined, route: '/landing', description: 'High-level health & topology overview of your entire infrastructure and service ecosystem.' },
  { key: 'map', title: 'Service Map', icon: DeploymentUnitOutlined, route: '/service-map-v4', description: 'Visualize service dependencies and data flow from infrastructure to applications and services.' },
  { key: 'services', title: 'Services', icon: BarChartOutlined, route: '/services-v2', description: 'Monitor service performance metrics including P99 latency, error rates, and throughput.' },
  { key: 'traces', title: 'Traces', icon: FileSearchOutlined, route: '/traces-v2', description: 'Explore distributed traces to find slow spans, bottlenecks, and analyze request flows.' },
  { key: 'logs', title: 'Logs', icon: ProfileOutlined, route: '/logs-v2', description: 'Search and correlate application logs with traces for comprehensive debugging and analysis.' },
  { key: 'views', title: 'Views', icon: ClusterOutlined, route: '/dashboards', description: 'Create and manage saved queries, custom dashboards, and curated views for your team.' },
  { key: 'alerts', title: 'Alerts', icon: AlertOutlined, route: '/alerts', description: 'Set up intelligent alerting rules and notifications for proactive monitoring and incident response.' },
  { key: 'errors', title: 'Exceptions', icon: RadarChartOutlined, route: '/exceptions', description: 'Track and analyze error patterns, exception groups, and failure trends across your services.' },
  { key: 'teams', title: 'Teams', icon: TeamOutlined, route: '/teams', description: 'Manage team members, permissions, and access controls for collaborative observability.' },
  { key: 'settings', title: 'Settings', icon: SettingOutlined, route: '/settings', description: 'Configure data sources, plugin settings, and customize your IyziTrace workspace.' },
];

const STEPS_CONFIG: Omit<Step, 'done'>[] = [
  { key: 'workspace', title: 'Set up your workspace', description: 'Configure your IyziTrace workspace and basic settings.', route: '/settings', skippable: false },
  { key: 'dataSource', title: 'Add your first data source', description: 'Connect Tempo, Loki, or Prometheus to start collecting data.', route: '/settings', skippable: true },
  { key: 'logs', title: 'Send your logs', description: 'Configure log collection from your applications and infrastructure.', route: '/logs', skippable: true },
  { key: 'traces', title: 'Send your traces', description: 'Set up distributed tracing to track requests across services.', route: '/traces', skippable: true },
  { key: 'metrics', title: 'Send your metrics', description: 'Collect application and infrastructure metrics for monitoring.', route: '/services', skippable: true },
  { key: 'alerts', title: 'Setup Alerts', description: 'Create alerting rules to get notified of issues in your system.', route: '/alerts', skippable: true },
  { key: 'savedViews', title: 'Setup Saved Views', description: 'Save frequently used queries and views for your team.', route: '/views', skippable: true },
  { key: 'dashboards', title: 'Setup Dashboards', description: 'Create custom dashboards to visualize your observability data.', route: '/views', skippable: true },
];

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
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    
    display: flex;
    flex-direction: column; /* alt alta */
    justify-content: space-between;
    gap: 8px; /* üst-alt boşluk */
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
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
    /* Badge styling handled by Grafana UI */
  `,
  exploreButton: css`
    /* Button styling handled by Grafana UI */
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
    cursor: pointer;
    position: relative;
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
  ingestionStatus?: IngestionStatus;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, ingestionStatus }) => {
  const navigate = useNavigate();
  const styles = useStyles2(getStyles);
  
  const isIngestionItem = ['logs', 'traces', 'services'].includes(item.key);
  const isActive = isIngestionItem && ingestionStatus?.[item.key as keyof IngestionStatus];
  
  const handleClick = () => {
    navigate(item.route);
  };
  
  const handleExploreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(item.route);
  };
  
  return (
    <Card className={styles.menuCard} onClick={handleClick}>
      {/* First Row: Icon + Title | Explore Button + Status Badge */}
      <div className={styles.cardRow}>
        <div className={styles.cardLeft}>
          <item.icon style={{ fontSize: 20, color: '#8c8c8c' }} />
          <div className={styles.cardTitle}>{item.title}</div>
        </div>
        
        <div className={styles.cardRight}>
          <Button 
            size="sm" 
            variant="secondary"
            disabled={isIngestionItem && !isActive}
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
      
      {/* Second Row: Description */}
      <div className={styles.cardDescription}>{item.description}</div>
    </Card>
  );
};

interface StepRowProps {
  step: Step;
  onGetStarted: (step: Step) => void;
  onSkip: (step: Step) => void;
}

const StepRow: React.FC<StepRowProps> = ({ step, onGetStarted, onSkip }) => {
  const styles = useStyles2(getStyles);
  const [showHoverInfo, setShowHoverInfo] = useState(false);
  
  const getIconClass = () => {
    if (step.done) return 'done';
    return '';
  };
  
  const getIconName = () => {
    if (step.done) return 'check';
    return '';
  };
  
  return (
    <div 
      className={styles.stepRow}
      onMouseEnter={() => setShowHoverInfo(true)}
      onMouseLeave={() => setShowHoverInfo(false)}
    >
      <div className={`${styles.stepIcon} ${getIconClass()}`}>
        {getIconName() && <Icon name={getIconName() as any} size="sm" />}
      </div>
      
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>
          {step.title}
        </div>
      </div>
      
      {showHoverInfo && !step.done && (
        <div className={styles.hoverInfo}>
          <div className={styles.hoverDescription}>
            {step.description}
          </div>
          <div className={styles.hoverActions}>
            <Button size="sm" onClick={() => onGetStarted(step)}>
              Get Started
            </Button>
            {step.skippable && (
              <a 
                href="#" 
                className={styles.skipLink}
                onClick={(e) => {
                  e.preventDefault();
                  onSkip(step);
                }}
              >
                Skip for now
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const styles = useStyles2(getStyles);
  
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ingestion, stepStatuses] = await Promise.all([
          getIngestionStatus(),
          getStepStatuses(),
        ]);
        
        setIngestionStatus(ingestion);
        
        const stepsWithStatus = STEPS_CONFIG.map(step => ({
          ...step,
          done: stepStatuses[step.key],
        }));
        
        setSteps(stepsWithStatus);
      } catch (err) {
        setError('Failed to load workspace data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleGetStarted = (step: Step) => {
    if (step.route) {
      navigate(step.route);
    }
  };
  
  const handleSkip = (step: Step) => {
    // In a real app, this would call an API to mark the step as skipped
    console.log('Skipped step:', step.key);
  };
  
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
                ingestionStatus={ingestionStatus || undefined}
              />
            ))}
          </div>
        </div>
        
        <div className={styles.rightColumn}>
          <Card className={styles.stepsPanel}>
            {/* Title */}
            <div className={styles.stepsTitle}>
              Build your observability base
            </div>
            
            {/* Stepper */}
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
            
            {/* Step List */}
            <div className={styles.stepsList}>
              {steps.map((step) => (
                <StepRow
                  key={step.key}
                  step={step}
                  onGetStarted={handleGetStarted}
                  onSkip={handleSkip}
                />
              ))}
            </div>
            
            {/* Skip Link - Right Aligned */}
            <div className={styles.laterLink}>
              <a href="#" className={styles.laterLinkText}>
                I'll do this later
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
