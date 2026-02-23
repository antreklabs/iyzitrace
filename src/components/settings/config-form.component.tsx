import React, { useEffect, useState } from 'react';
import { Button, InlineField, Input, Select, Spinner, Alert } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import type { PluginJsonData, PluginSecureJsonData } from '../../interfaces/utils/options';
import DefinitionsTable, { DEFAULT_DEFINITIONS } from './definitions-table.component';
import {
  KeyOutlined,
  SaveOutlined,
  FileTextOutlined,
  RobotOutlined,
  SettingOutlined,
  LinkOutlined,
  SafetyOutlined,
  UnlockOutlined,
  LockOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

import { useSearchParams } from 'react-router-dom';
import {
  getDatasourceConfigs,
  INITIAL_DATASOURCE_STATUS,
  type StepStatus,
  type DatasourceStatus,
  type DatasourceType,
} from '../../utils/platform-setup.utils';
import '../../assets/styles/components/settings/settings.css';

const PLUGIN_ID = 'iyzitrace-app';

const TAB_ITEMS = [
  { key: 'platform', label: 'Platform' },
  { key: 'datasources', label: 'Data Sources' },
  { key: 'ai', label: 'AI' },
  { key: 'definitions', label: 'Definitions' },

  { key: 'privacy', label: 'Privacy' },
] as const;

type TabKey = typeof TAB_ITEMS[number]['key'];

const ConfigForm: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jsonData, setJsonData] = useState<PluginJsonData>({});
  const [secureJsonData, setSecureJsonData] = useState<PluginSecureJsonData>({});
  const [secureJsonFields, setSecureJsonFields] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Platform tab state
  const [platformUrl, setPlatformUrl] = useState('http://localhost');
  const [authType, setAuthType] = useState<'open' | 'apikey'>('open');
  const [platformApiKey, setPlatformApiKey] = useState('');
  const [platformStatus, setPlatformStatus] = useState<StepStatus>({
    checking: false,
    success: null,
    error: null,
  });

  // Data Sources tab state
  const [datasourceStatus, setDatasourceStatus] = useState<DatasourceStatus>(INITIAL_DATASOURCE_STATUS);
  const [provisioning, setProvisioning] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Get active tab from URL, default to 'platform'
  const activeTab = (searchParams.get('tab') as TabKey) || 'platform';

  const setActiveTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    (async () => {
      try {
        const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
        if (settings) {
          const jd = (settings.jsonData || {}) as PluginJsonData;
          if (!jd.definitions) {
            jd.definitions = DEFAULT_DEFINITIONS;
          }
          setJsonData(jd);
          setSecureJsonFields(settings.secureJsonFields || {});

          // Load saved platform settings
          if (jd.platformUrl) {
            setPlatformUrl(jd.platformUrl);
          }
          if (jd.authType) {
            setAuthType(jd.authType);
          }
        }
      } catch (e) {
      }
    })();
  }, []);

  // Auto-check datasources when entering datasources tab
  useEffect(() => {
    if (activeTab === 'datasources' && !initialCheckDone) {
      checkExistingDatasources();
    }
  }, [activeTab]);

  // — Platform tab helpers —

  const checkPlatformHealth = async () => {
    if (!platformUrl.trim()) {
      setPlatformStatus({ checking: false, success: false, error: 'Please enter a Platform URL.' });
      return;
    }
    if (authType === 'apikey' && !platformApiKey.trim()) {
      setPlatformStatus({ checking: false, success: false, error: 'Please enter an API Key.' });
      return;
    }

    setPlatformStatus({ checking: true, success: null, error: null });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const url = `${platformUrl.replace(/\/$/, '')}/api/v1/platform/system/status`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authType === 'apikey') {
        headers['Authorization'] = `Bearer ${platformApiKey.trim()}`;
      }

      try {
        const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          setPlatformStatus({ checking: false, success: true, error: null });
        } else if (response.status === 401) {
          setPlatformStatus({
            checking: false,
            success: false,
            error: 'Authentication failed. Please check your API Key or switch to Open Access.',
          });
        } else {
          setPlatformStatus({
            checking: false,
            success: false,
            error: `Platform returned status ${response.status}. Please check the URL.`,
          });
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          setPlatformStatus({
            checking: false,
            success: false,
            error: 'Connection timed out. Platform may not be running.',
          });
        } else {
          setPlatformStatus({
            checking: false,
            success: false,
            error: 'Could not connect to platform. Please verify the URL and ensure the platform is running.',
          });
        }
      }
    } catch (err: any) {
      setPlatformStatus({
        checking: false,
        success: false,
        error: err.message || 'An unexpected error occurred.',
      });
    }
  };

  const savePlatformSettings = async () => {
    setIsSaving(true);
    try {
      const currentSettings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
      const currentJsonData = (currentSettings?.jsonData || {}) as PluginJsonData;

      await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
        jsonData: {
          ...currentJsonData,
          platformUrl: platformUrl.replace(/\/$/, ''),
          authType,
        },
        enabled: true,
      });
    } catch (err) {
      console.error('Failed to save platform settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // — Data Sources tab helpers —

  const checkDatasourceExists = async (uid: string): Promise<boolean> => {
    try {
      await getBackendSrv().get(`/api/datasources/uid/${uid}`);
      return true;
    } catch {
      return false;
    }
  };

  const createDatasource = async (type: DatasourceType): Promise<void> => {
    const configs = getDatasourceConfigs(platformUrl, authType, platformApiKey);
    await getBackendSrv().post('/api/datasources', configs[type]);
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const checkExistingDatasources = async () => {
    const types: DatasourceType[] = ['prometheus', 'loki', 'tempo'];

    for (const type of types) {
      setDatasourceStatus(prev => ({
        ...prev,
        [type]: { checking: true, success: null, error: null },
      }));
    }

    for (const type of types) {
      try {
        const configs = getDatasourceConfigs(platformUrl, authType, platformApiKey);
        const exists = await checkDatasourceExists(configs[type].uid);
        setDatasourceStatus(prev => ({
          ...prev,
          [type]: { checking: false, success: exists, error: null },
        }));
      } catch {
        setDatasourceStatus(prev => ({
          ...prev,
          [type]: { checking: false, success: false, error: null },
        }));
      }
    }

    setInitialCheckDone(true);
  };

  const checkAndProvisionDatasources = async () => {
    setProvisioning(true);
    const types: DatasourceType[] = ['prometheus', 'loki', 'tempo'];

    for (const type of types) {
      setDatasourceStatus(prev => ({
        ...prev,
        [type]: { checking: true, success: null, error: null },
      }));

      try {
        const configs = getDatasourceConfigs(platformUrl, authType, platformApiKey);
        const exists = await checkDatasourceExists(configs[type].uid);

        if (!exists) {
          await createDatasource(type);
        }

        setDatasourceStatus(prev => ({
          ...prev,
          [type]: { checking: false, success: true, error: null },
        }));
      } catch (err: any) {
        setDatasourceStatus(prev => ({
          ...prev,
          [type]: {
            checking: false,
            success: false,
            error: err.message || `Failed to configure ${type}`,
          },
        }));
      }
    }

    setProvisioning(false);
  };

  // — General save —

  const save = async () => {
    setIsSaving(true);
    try {
      let dataToSave: Partial<PluginJsonData> = {};
      let secureDataToSave: Partial<PluginSecureJsonData> = {};

      const currentSettings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
      const currentJsonData = (currentSettings?.jsonData || {}) as PluginJsonData;

      switch (activeTab) {
        case 'platform':
          dataToSave = {
            ...currentJsonData,
            platformUrl: platformUrl.replace(/\/$/, ''),
            authType,
          };
          break;

        case 'ai':
          dataToSave = {
            ...currentJsonData,
            aiConfig: jsonData.aiConfig,
          };
          break;
        case 'definitions':
          dataToSave = {
            ...currentJsonData,
            definitions: jsonData.definitions,
          };
          break;
        default:
          return;
      }

      await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
        jsonData: dataToSave,
        secureJsonData: Object.keys(secureDataToSave).length > 0 ? secureDataToSave : undefined,
        enabled: true,
      });



      try {
        const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
        if (settings?.jsonData) {
          setJsonData(settings.jsonData as PluginJsonData);
        }
      } catch { }
    } finally {
      setIsSaving(false);
    }
  };

  // — Render helpers —

  const allDatasourcesReady =
    datasourceStatus.prometheus.success === true &&
    datasourceStatus.loki.success === true &&
    datasourceStatus.tempo.success === true;

  const renderHeader = () => (
    <header className="settings-header">
      <div className="settings-header__inner">
        <div className="settings-header__title">
          <SettingOutlined className="settings-header__title-icon" />
          <span>Settings</span>
        </div>

        <nav className="settings-header__nav">
          {TAB_ITEMS.map((item) => {
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`settings-header__tab ${isActive ? 'settings-header__tab--active' : 'settings-header__tab--inactive'}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );

  const renderPlatformTab = () => (
    <>
      <div className="settings-section">
        <div className="settings-section-header">
          <LinkOutlined className="settings-icon-blue" />
          <h3 className="page-heading config-heading-m-0">Platform Connection</h3>
        </div>
        <div className="settings-description-sm">
          Connect to your IyziTrace Observability Platform. Configure the base URL and authentication settings.
        </div>
        <div className="settings-section-content-lg">
          {/* Platform URL */}
          <div className="settings-platform-field">
            <label className="settings-platform-label">
              <LinkOutlined /> Platform URL
            </label>
            <input
              type="text"
              value={platformUrl}
              onChange={(e) => {
                setPlatformUrl(e.target.value);
                setPlatformStatus({ checking: false, success: null, error: null });
              }}
              placeholder="http://localhost"
              className="settings-platform-input"
            />
            <span className="settings-description-mt">
              Enter the base URL of your running IyziTrace Observability Platform
            </span>
          </div>

          {/* Authentication Type */}
          <div className="settings-platform-field">
            <label className="settings-platform-label">
              <SafetyOutlined /> Authentication Type
            </label>
            <div className="settings-auth-toggle">
              <button
                type="button"
                className={`settings-auth-toggle-option ${authType === 'open' ? 'active' : ''}`}
                onClick={() => {
                  setAuthType('open');
                  setPlatformStatus({ checking: false, success: null, error: null });
                }}
              >
                <UnlockOutlined />
                <div className="settings-auth-toggle-text">
                  <strong>Open Access</strong>
                  <span>No API Key required</span>
                </div>
              </button>
              <button
                type="button"
                className={`settings-auth-toggle-option ${authType === 'apikey' ? 'active' : ''}`}
                onClick={() => {
                  setAuthType('apikey');
                  setPlatformStatus({ checking: false, success: null, error: null });
                }}
              >
                <LockOutlined />
                <div className="settings-auth-toggle-text">
                  <strong>API Key Protected</strong>
                  <span>Requires API Key for access</span>
                </div>
              </button>
            </div>
          </div>

          {/* API Key Input (conditional) */}
          {authType === 'apikey' && (
            <div className="settings-platform-field settings-field-animated">
              <label className="settings-platform-label">
                <KeyOutlined /> Platform API Key
              </label>
              <input
                type="password"
                value={platformApiKey}
                onChange={(e) => {
                  setPlatformApiKey(e.target.value);
                  setPlatformStatus({ checking: false, success: null, error: null });
                }}
                placeholder="Enter your platform API key"
                className="settings-platform-input"
              />
            </div>
          )}

          {/* Verify Connection */}
          <div className="settings-verify-section">
            <h4 className="settings-verify-title">Connection Verification</h4>
            <p className="settings-description">Verify that the platform is running and accessible:</p>

            <div className="settings-verify-actions">
              <Button
                variant="primary"
                onClick={checkPlatformHealth}
                disabled={platformStatus.checking || platformStatus.success === true}
              >
                {platformStatus.checking ? (
                  <><Spinner inline size="sm" /> Verifying...</>
                ) : platformStatus.success === true ? (
                  <><CheckCircleOutlined /> Verified</>
                ) : (
                  'Verify Connection'
                )}
              </Button>

              {platformStatus.success === true && (
                <div className="settings-verify-result success">
                  <CheckCircleOutlined />
                  <span>Platform is connected successfully!</span>
                </div>
              )}

              {platformStatus.success === false && (
                <div className="settings-verify-result error">
                  <CloseCircleOutlined />
                  <span>{platformStatus.error}</span>
                </div>
              )}
            </div>

            {platformStatus.success === false && (
              <Alert title="Connection failed" severity="warning" className="settings-alert-mt">
                <ul>
                  <li>Make sure the platform is running and accessible</li>
                  <li>Verify the Platform URL is correct</li>
                  {authType === 'apikey' && <li>Check that your API Key is valid</li>}
                  <li>Ensure there are no firewall or network issues</li>
                </ul>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const renderDatasourcesTab = () => (
    <>
      <div className="settings-section">
        <div className="settings-section-header">
          <DatabaseOutlined className="settings-icon-blue" />
          <h3 className="page-heading config-heading-m-0">Configure Data Sources</h3>
        </div>
        <div className="settings-description-sm">
          Connect Grafana to your observability backends. Click the button below to automatically configure
          Prometheus, Loki, and Tempo data sources.
        </div>
        <div className="settings-section-content-lg">
          <div className="settings-datasource-list">
            {(['prometheus', 'loki', 'tempo'] as const).map((type) => {
              const status = datasourceStatus[type];
              const configs = getDatasourceConfigs(platformUrl, authType, platformApiKey);
              const config = configs[type];
              return (
                <div key={type} className="settings-datasource-item">
                  <div className="settings-datasource-info">
                    <strong>{config.name}</strong>
                    <span className="settings-datasource-url">{config.url}</span>
                  </div>
                  <div className="settings-datasource-status">
                    {status.checking && <LoadingOutlined className="settings-icon-spin" />}
                    {status.success === true && <CheckCircleOutlined className="settings-icon-check" />}
                    {status.success === false && <CloseCircleOutlined className="settings-icon-error" />}
                    {status.success === null && !status.checking && <span className="settings-status-dash">—</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="settings-datasource-actions">
            <Button
              variant="primary"
              onClick={checkAndProvisionDatasources}
              disabled={provisioning || allDatasourcesReady}
            >
              {provisioning ? (
                <><Spinner inline size="sm" /> Configuring...</>
              ) : allDatasourcesReady ? (
                <><CheckCircleOutlined /> All Configured</>
              ) : (
                'Configure Data Sources'
              )}
            </Button>
          </div>

          {Object.values(datasourceStatus).some(s => s.success === false) && (
            <Alert
              title="Some data sources could not be configured"
              severity="warning"
              className="settings-alert-mt"
            >
              Make sure the observability platform is running and accessible before clicking on Configure Data Sources button.
            </Alert>
          )}

          {allDatasourcesReady && (
            <Alert
              title="All Data Sources Configured!"
              severity="success"
              className="settings-alert-mt"
            >
              Prometheus, Loki, and Tempo are all set up and ready to use.
            </Alert>
          )}
        </div>
      </div>
    </>
  );

  const renderPlaceholder = (title: string) => (
    <div className="settings-placeholder-wrapper">
      <h3 className="page-heading config-heading-mb-8">{title}</h3>
      <div className="settings-placeholder-content">
        <div className="settings-placeholder-info">
          <div className="settings-placeholder-intro">
            Below you can find important legal documents and policies regarding your use of IyziTrace. Please review these documents to understand your rights, responsibilities, and how your data is handled and protected.
          </div>
          <ul className="settings-link-list">
            <li className="settings-link-item">
              <a href="https://beta.iyzitrace.com/legal/terms" target="_blank" rel="noopener noreferrer" className="settings-link">
                Terms and Conditions
              </a>
              <div className="settings-link-description">
                The main contract for using IyziTrace. Outlines your rights, obligations, and the rules for using our services.
              </div>
            </li>
            <li className="settings-link-item">
              <a href="https://beta.iyzitrace.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="settings-link">
                Privacy Policy
              </a>
              <div className="settings-link-description">
                Explains how we collect, use, store, and protect your personal data when you use IyziTrace.
              </div>
            </li>
            <li className="settings-link-item">
              <a href="https://beta.iyzitrace.com/legal/dpa" target="_blank" rel="noopener noreferrer" className="settings-link">
                Data Processing Agreement (DPA)
              </a>
              <div className="settings-link-description">
                Details our commitments and your rights regarding data processing, especially for GDPR compliance.
              </div>
            </li>
            <li className="settings-link-item">
              <a href="https://beta.iyzitrace.com/legal/vulnerability-disclosure" target="_blank" rel="noopener noreferrer" className="settings-link">
                Vulnerability Disclosure
              </a>
              <div className="settings-link-description">
                Learn how to report security vulnerabilities and help us keep IyziTrace safe for everyone.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const showSaveButton = activeTab === 'ai' || activeTab === 'definitions';

  return (
    <div className="settings-page">
      {renderHeader()}

      <div className="page-container config-container-padded">
        {activeTab === 'platform' && renderPlatformTab()}

        {activeTab === 'datasources' && renderDatasourcesTab()}



        {activeTab === 'ai' && (
          <>
            <div className="settings-section">
              <div className="settings-section-header">
                <RobotOutlined className="settings-icon-purple" />
                <h3 className="page-heading config-heading-m-0">AI Assistant Configuration</h3>
              </div>
              <div className="settings-description-sm">
                Configure the AI assistant settings. The API key will be stored securely and used for AI-powered insights.
              </div>
              <div className="settings-section-content-lg">
                <div>
                  <InlineField label="API Key" tooltip="OpenRouter API key for AI services">
                    <Input
                      width={40}
                      value={jsonData.aiConfig?.apiKey ?? ''}
                      onChange={(e) => setJsonData({
                        ...jsonData,
                        aiConfig: {
                          ...jsonData.aiConfig,
                          apiKey: e.currentTarget.value
                        }
                      })}
                      placeholder="sk-or-v1-..."
                    />
                  </InlineField>
                  <div className="settings-description-mt">
                    Your OpenRouter API key. Get one from https://openrouter.ai
                  </div>
                </div>
                <div>
                  <InlineField label="Model" tooltip="AI model to use for responses">
                    <Select
                      width={40}
                      options={[
                        { label: 'DeepSeek Chat (Recommended)', value: 'deepseek/deepseek-chat' },
                        { label: 'GPT-4o', value: 'openai/gpt-4o' },
                        { label: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' },
                        { label: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
                        { label: 'Claude 3 Haiku', value: 'anthropic/claude-3-haiku' },
                        { label: 'Gemini Pro 1.5', value: 'google/gemini-pro-1.5' },
                        { label: 'Llama 3.1 405B', value: 'meta-llama/llama-3.1-405b-instruct' },
                      ]}
                      value={jsonData.aiConfig?.model || 'deepseek/deepseek-chat'}
                      onChange={(v) => setJsonData({
                        ...jsonData,
                        aiConfig: {
                          ...jsonData.aiConfig,
                          model: v?.value
                        }
                      })}
                    />
                  </InlineField>
                  <div className="settings-description-mt">
                    Choose the AI model. DeepSeek Chat offers the best balance of quality and cost.
                  </div>
                </div>
                <div>
                  <InlineField label="Temperature" tooltip="Controls randomness (0.0-2.0). Lower is more focused, higher is more creative.">
                    <Input
                      width={20}
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={jsonData.aiConfig?.temperature ?? 0.7}
                      onChange={(e) => setJsonData({
                        ...jsonData,
                        aiConfig: {
                          ...jsonData.aiConfig,
                          temperature: parseFloat(e.currentTarget.value)
                        }
                      })}
                    />
                  </InlineField>
                  <div className="settings-description-mt">
                    Controls response creativity. 0.0 = focused and deterministic, 2.0 = creative and varied. Recommended: 0.7
                  </div>
                </div>
                <div>
                  <InlineField label="Max Tokens" tooltip="Maximum number of tokens in AI responses">
                    <Input
                      width={20}
                      type="number"
                      min={50}
                      max={4000}
                      step={50}
                      value={jsonData.aiConfig?.maxTokens ?? 150}
                      onChange={(e) => setJsonData({
                        ...jsonData,
                        aiConfig: {
                          ...jsonData.aiConfig,
                          maxTokens: parseInt(e.currentTarget.value)
                        }
                      })}
                    />
                  </InlineField>
                  <div className="settings-description-mt">
                    Maximum length of AI responses. Higher values allow longer answers but cost more. Recommended: 150-500
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'definitions' && (
          <>
            <div className="settings-section">
              <div className="settings-section-header">
                <FileTextOutlined className="settings-icon-blue" />
                <h3 className="page-heading config-heading-m-0">Metric and Label Definitions</h3>
              </div>
              <div className="settings-description-sm">
                Configure label names and metric names used in Prometheus queries. These values are used throughout the application for querying service metrics.
              </div>
              <DefinitionsTable
                value={jsonData.definitions || DEFAULT_DEFINITIONS}
                onChange={(next) => setJsonData((prev) => ({ ...(prev || {}), definitions: next }))}
              />
            </div>
          </>
        )}

        {activeTab === 'privacy' && renderPlaceholder('Privacy')}

        {showSaveButton && (
          <div className="settings-save-container">
            <Button onClick={save} icon={<SaveOutlined />}>Save Settings</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigForm;