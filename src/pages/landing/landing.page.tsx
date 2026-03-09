import React, { useState, useEffect } from 'react';
import {
  Card,
  Badge,
  Button,
  Alert,
  LoadingPlaceholder,
} from '@grafana/ui';
import { useNavigate } from 'react-router-dom';
import { getAllSectionStatuses, ensureAllDefaultViews } from '../../api/service/landing.service';
import ViewsPanel from '../../components/views/views-panel.component';
import {
  BarChartOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  RadarChartOutlined,
  TeamOutlined,
  DeploymentUnitOutlined,
  BuildOutlined,
  RocketOutlined,
  ControlOutlined,
  AppstoreOutlined,
  DownOutlined,
  RightOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import '../../assets/styles/pages/landing/landing.styles';

const LANDING_DISMISSED_KEY = 'iyzitrace-landing-dismissed';

type SectionKey = 'overview' | 'serviceMap' | 'services' | 'traces' | 'logs' | 'views' | 'exceptions' | 'teams' | 'ai' | 'agentManager' | 'inventoryManager';

const NAV_ITEMS: Array<{
  key: SectionKey;
  title: string;
  icon: any;
  route: string;
  description: string;
}> = [
    { key: 'overview', title: 'Overview', icon: BuildOutlined, route: '/a/antreklabs-iyzitrace-app/overview', description: 'High-level health & topology overview of your entire infrastructure and service ecosystem.' },
    { key: 'serviceMap', title: 'Service Map', icon: DeploymentUnitOutlined, route: '/a/antreklabs-iyzitrace-app/service-map', description: 'Visualize service dependencies and data flow from infrastructure to applications and services.' },
    { key: 'services', title: 'Services', icon: BarChartOutlined, route: '/a/antreklabs-iyzitrace-app/services', description: 'Monitor service performance metrics including P99 latency, error rates, and throughput.' },
    { key: 'traces', title: 'Traces', icon: FileSearchOutlined, route: '/a/antreklabs-iyzitrace-app/traces', description: 'Explore distributed traces to find slow spans, bottlenecks, and analyze request flows.' },
    { key: 'logs', title: 'Logs', icon: ProfileOutlined, route: '/a/antreklabs-iyzitrace-app/logs', description: 'Search and correlate application logs with traces for comprehensive debugging and analysis.' },
    { key: 'exceptions', title: 'Exceptions', icon: RadarChartOutlined, route: '/a/antreklabs-iyzitrace-app/exceptions', description: 'Track and analyze error patterns, exception groups, and failure trends across your services.' },
    { key: 'ai', title: 'AI Assistant', icon: RocketOutlined, route: '/a/antreklabs-iyzitrace-app/ai', description: 'Get intelligent insights and recommendations powered by AI to optimize your observability workflow.' },
    { key: 'teams', title: 'Teams', icon: TeamOutlined, route: '/a/antreklabs-iyzitrace-app/teams', description: 'Manage team members, permissions, and access controls for collaborative observability.' },
    { key: 'agentManager', title: 'Agents', icon: ControlOutlined, route: '/a/antreklabs-iyzitrace-app/agent-manager', description: 'Manage and monitor your OpenTelemetry collector agents, configurations, and groups.' },
    { key: 'inventoryManager', title: 'Inventories', icon: AppstoreOutlined, route: '/a/antreklabs-iyzitrace-app/inventory-manager', description: 'View and manage your infrastructure inventory, entities, and their relationships.' },
  ];

interface MenuCardProps {
  item: typeof NAV_ITEMS[0];
  sectionStatuses: Record<SectionKey, boolean>;
  expanded: boolean;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, sectionStatuses, expanded }) => {
  const navigate = useNavigate();
  const isActive = sectionStatuses[item.key];

  return (
    <Card className={`landing-menu-card ${!expanded ? 'landing-menu-card-collapsed' : ''}`}>
      <div className="landing-card-row">
        <div className="landing-card-left">
          <item.icon className="landing-card-icon" />
          <div className="landing-card-title">{item.title}</div>
        </div>

        <div className="landing-card-right">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(item.route)}
          >
            Explore
          </Button>
          <Badge
            text={isActive ? 'Active' : 'Inactive'}
            color={isActive ? 'green' : 'blue'}
          />
        </div>
      </div>

      {expanded && (
        <div className="landing-card-description">{item.description}</div>
      )}
    </Card>
  );
};

const LandingPage: React.FC = () => {
  const [sectionStatuses, setSectionStatuses] = useState<Record<SectionKey, boolean>>({
    overview: false, serviceMap: false, services: false, traces: false,
    logs: false, views: false, exceptions: false, teams: false,
    ai: false, agentManager: false, inventoryManager: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dismissed = welcome header permanently hidden, cards collapsed by default
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(LANDING_DISMISSED_KEY) === 'true'; } catch { return false; }
  });
  const [expanded, setExpanded] = useState(!dismissed);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await ensureAllDefaultViews();
        const statuses = await getAllSectionStatuses();
        setSectionStatuses(statuses);
      } catch (err) {
        setError('Failed to load workspace data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDismiss = () => {
    try { localStorage.setItem(LANDING_DISMISSED_KEY, 'true'); } catch { }
    setDismissed(true);
    setExpanded(false);
  };

  const toggleExpanded = () => {
    setExpanded(prev => !prev);
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
        <Alert title="Error" severity="error">{error}</Alert>
      </div>
    );
  }

  const activeCount = Object.values(sectionStatuses).filter(Boolean).length;
  const totalCount = Object.values(sectionStatuses).length;

  return (
    <div className="landing-container">
      {/* Welcome header — only shown if not dismissed */}
      {!dismissed && (
        <div className="landing-header">
          <div className="landing-welcome-text">
            👋 Hello there, Welcome to your IyziTrace workspace
          </div>
          <div className="landing-description">
            This is your observability status dashboard. Each module below shows whether it is receiving data.
            <strong> Active</strong> modules are ready with data, while <strong> Inactive</strong> ones are not receiving data yet.
          </div>

          <div className="landing-workspace-info">
            <div className="landing-status-summary">
              <span className="landing-status-active">{activeCount}</span>
              <span className="landing-status-label"> / {totalCount} modules active</span>
            </div>
          </div>

          <button className="landing-dismiss-btn" onClick={handleDismiss}>
            <EyeInvisibleOutlined className="wizard-mr-8" />
            Don't show active status
          </button>
        </div>
      )}

      {/* Collapsed toolbar — shown when dismissed (header hidden) */}
      {dismissed && (
        <div className="landing-collapsed-toolbar">
          <button className="landing-toggle-btn" onClick={toggleExpanded}>
            {expanded ? <DownOutlined /> : <RightOutlined />}
            <span className="landing-toggle-label">
              Module Status
            </span>
            <span className="landing-toggle-count">
              {activeCount}/{totalCount} active
            </span>
          </button>
        </div>
      )}

      {/* Cards grid — always shown, but cards render expanded/collapsed */}
      <div className={`landing-cards-grid ${!expanded ? 'landing-cards-grid-collapsed' : ''}`}>
        {NAV_ITEMS.map((item) => (
          <MenuCard
            key={item.key}
            item={item}
            sectionStatuses={sectionStatuses}
            expanded={expanded}
          />
        ))}
      </div>

      {/* Views section — embedded below module cards */}
      <div className="landing-views-section">
        <div className="landing-views-header">
          <h3 className="landing-views-title">Views</h3>
          <span className="landing-views-subtitle">Manage your views and quick access to different screens</span>
        </div>
        <ViewsPanel />
      </div>
    </div>
  );
};

export default LandingPage;