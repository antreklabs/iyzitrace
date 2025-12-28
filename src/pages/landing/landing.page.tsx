import React, { useState, useEffect } from 'react';
import {
  Card,
  Icon,
  Badge,
  Button,
  Alert,
  Text,
  LoadingPlaceholder,
} from '@grafana/ui';
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
import '../../assets/styles/pages/landing/landing.css';

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

interface MenuCardProps {
  item: typeof NAV_ITEMS[0];
  sectionStatuses: Record<SectionKey, boolean>;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, sectionStatuses }) => {
  const navigate = useNavigate();

  const isActive = sectionStatuses[item.key];

  const handleExploreClick = () => {
    navigate(item.route);
  };

  return (
    <Card className="landing-menu-card">
      {
      }
      <div className="landing-card-row">
        <div className="landing-card-left">
          <item.icon className="landing-card-icon" />
          <div className="landing-card-title">{item.title}</div>
        </div>

        <div className="landing-card-right">
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
      <div className="landing-card-description">{item.description}</div>
    </Card>
  );
};

interface StepRowProps {
  step: SetupStep;
}

const StepRow: React.FC<StepRowProps> = ({ step }) => {
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
    <div className="landing-step-row">
      <div className={`landing-step-icon ${getIconClass()}`}>
        {getIconName() && <Icon name={getIconName() as any} size="sm" />}
      </div>

      <div className="landing-step-content">
        <div className="landing-step-title">
          {step.title}
        </div>
      </div>

      {!step.done && (
        <div
          className="landing-info-button-wrapper"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className="landing-info-button">
            <InfoCircleOutlined className="landing-info-icon" />
          </button>

          {showTooltip && (
            <div className="landing-tooltip">
              <div className="landing-tooltip-description">
                {stepInfo?.description}
              </div>

              <div className="landing-tooltip-actions">
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
      <div className="landing-container">
        <LoadingPlaceholder text="Loading workspace..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-container">
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
    <div className="landing-container">
      <div className="landing-header">
        <div className="landing-welcome-text">
          👋 Hello there, Welcome to your IyziTrace workspace
        </div>
        <div className="landing-description">
          You're not sending any data yet. IyziTrace works best with your telemetry — start by connecting a data source.
        </div>

        <div className="landing-workspace-info">
          <div className="landing-status-indicator">
            <Icon name="check" />
            <Text>Your workspace is ready</Text>
          </div>
          <Button onClick={handleConnectDataSource}>
            Connect Data Source
          </Button>
        </div>
      </div>

      <div className="landing-main-content">
        <div className="landing-left-column">
          <div className="landing-cards-grid">
            {NAV_ITEMS.map((item) => (
              <MenuCard
                key={item.key}
                item={item}
                sectionStatuses={sectionStatuses}
              />
            ))}
          </div>
        </div>

        <div className="landing-right-column">
          <Card className="landing-steps-panel">
            {
            }
            <div className="landing-steps-title">
              Build your observability base
            </div>

            {
            }
            <div className="landing-stepper-section">
              <div className="landing-progress-text">
                Step {completedSteps}/{totalSteps}
              </div>
              <div className="landing-progress-bar">
                <div
                  className="landing-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {
            }
            <div className="landing-steps-list">
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