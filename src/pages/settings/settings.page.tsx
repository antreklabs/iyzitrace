import React, { useEffect, useState } from 'react';
import { PluginConfigPageProps, AppPluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, LoadingPlaceholder, Alert } from '@grafana/ui';
import { RocketOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';
import ConfigForm from '../../components/settings/config-form.component';

const PLUGIN_ID = 'antreklabs-iyzitrace-app';

interface WizardState {
  completed: boolean;
  completedAt?: string;
  skipped?: boolean;
}

interface PluginConfigProps extends PluginConfigPageProps<AppPluginMeta<{}>> { }

const SettingsPage: React.FC<PluginConfigProps> = (props) => {
  const [loading, setLoading] = useState(true);
  const [wizardCompleted, setWizardCompleted] = useState<boolean | null>(null);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    checkWizardStatus();
  }, []);

  const checkWizardStatus = async () => {
    try {
      const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
      const wizardState = settings?.jsonData?.wizardState as WizardState | undefined;
      setWizardCompleted(wizardState?.completed === true);
    } catch (error) {
      setWizardCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAndStartWizard = async () => {
    setEnabling(true);
    try {
      // Enable the plugin
      await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
        enabled: true,
        pinned: true,
      });

      // Redirect to wizard
      window.location.href = `/a/${PLUGIN_ID}/wizard`;
    } catch (error) {
      console.error('Failed to enable plugin:', error);
      setEnabling(false);
    }
  };

  const handleGoToWizard = () => {
    window.location.href = `/a/${PLUGIN_ID}/wizard`;
  };

  const handleGoToApp = () => {
    window.location.href = `/a/${PLUGIN_ID}/landing`;
  };

  if (loading) {
    return (
      <div className="u-loading-center">
        <LoadingPlaceholder text="Loading configuration..." />
      </div>
    );
  }

  // If wizard not completed, show welcome screen
  if (wizardCompleted === false) {
    return (
      <div style={styles.welcomeContainer}>
        <img
          src="/public/plugins/antreklabs-iyzitrace-app/img/logo.png"
          alt="IyziTrace"
          style={styles.logo}
        />
        <div style={styles.welcomeCard}>
          <h1 style={styles.welcomeTitle}>Welcome to IyziTrace!</h1>
          <p style={styles.welcomeDescription}>
            You're ready to set up your OpenTelemetry-native observability platform.
            The setup wizard will guide you step by step.
          </p>

          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <CheckCircleOutlined style={styles.featureIcon} />
              <span>Platform setup (Docker Desktop)</span>
            </div>
            <div style={styles.featureItem}>
              <CheckCircleOutlined style={styles.featureIcon} />
              <span>Data sources configuration</span>
            </div>
            <div style={styles.featureItem}>
              <CheckCircleOutlined style={styles.featureIcon} />
              <span>API Key and settings</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleEnableAndStartWizard}
            disabled={enabling}
            style={styles.startButton}
          >
            {enabling ? 'Enabling...' : 'Start Setup'}
          </Button>
        </div>
      </div>
    );
  }

  // Wizard completed - show settings with option to go to app
  return (
    <div>
      <Alert
        title="IyziTrace setup completed"
        severity="success"
        className="u-mb-24"
      >
        <div className="u-flex-center-gap16">
          <span>You can start using the plugin.</span>
          <Button variant="primary" size="sm" onClick={handleGoToApp}>
            Open IyziTrace
          </Button>
          <Button variant="secondary" size="sm" onClick={handleGoToWizard}>
            Setup Wizard
          </Button>
        </div>
      </Alert>
      <ConfigForm />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  welcomeContainer: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    position: 'relative' as const,
  },
  logo: {
    position: 'absolute' as const,
    top: 20,
    left: 20,
    height: 48,
    width: 'auto',
  },
  welcomeCard: {
    maxWidth: 600,
    textAlign: 'center' as const,
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(71, 85, 105, 0.4)',
    borderRadius: 16,
    padding: 48,
  },
  welcomeIcon: {
    fontSize: 64,
    color: '#3b82f6',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '0 0 16px 0',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 1.6,
    margin: '0 0 32px 0',
  },
  featureList: {
    textAlign: 'left' as const,
    marginBottom: 32,
    padding: '0 24px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#cbd5e1',
  },
  featureIcon: {
    color: '#22c55e',
    fontSize: 18,
  },
  startButton: {
    fontSize: 16,
    padding: '12px 32px',
  },
};

export default SettingsPage;