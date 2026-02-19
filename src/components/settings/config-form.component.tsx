import React, { useEffect, useState } from 'react';
import { Button, InlineField, Input, SecretInput, Select } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import type { PluginJsonData, PluginSecureJsonData } from '../../interfaces/utils/options';
import DefinitionsTable, { DEFAULT_DEFINITIONS } from './definitions-table.component';
import { KeyOutlined, SaveOutlined, FileTextOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import { configureAllDatasourcesAuth, removeAllDatasourcesAuth } from '../../api/service/observability-auth.service';
import { useSearchParams } from 'react-router-dom';
import '../../assets/styles/components/settings/settings.css';

const PLUGIN_ID = 'iyzitrace-app';

const TAB_ITEMS = [
  { key: 'ai', label: 'AI' },
  { key: 'definitions', label: 'Definitions' },
  { key: 'security', label: 'Security' },
  { key: 'privacy', label: 'Privacy' },
] as const;

type TabKey = typeof TAB_ITEMS[number]['key'];

const ConfigForm: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jsonData, setJsonData] = useState<PluginJsonData>({});
  const [secureJsonData, setSecureJsonData] = useState<PluginSecureJsonData>({});
  const [secureJsonFields, setSecureJsonFields] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Get active tab from URL, default to 'ai'
  const activeTab = (searchParams.get('tab') as TabKey) || 'ai';

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
        }
      } catch (e) {
      }
    })();
  }, []);

  const save = async () => {
    setIsSaving(true);
    try {
      // Build the data to save based on active tab
      let dataToSave: Partial<PluginJsonData> = {};
      let secureDataToSave: Partial<PluginSecureJsonData> = {};

      // First get current settings to preserve other tabs' data
      const currentSettings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
      const currentJsonData = (currentSettings?.jsonData || {}) as PluginJsonData;

      switch (activeTab) {
        case 'security':
          // Only save API key
          secureDataToSave = { apiKey: secureJsonData.apiKey };
          dataToSave = currentJsonData; // Keep all other settings
          break;
        case 'ai':
          // Only save AI config
          dataToSave = {
            ...currentJsonData,
            aiConfig: jsonData.aiConfig,
          };
          break;
        case 'definitions':
          // Only save definitions
          dataToSave = {
            ...currentJsonData,
            definitions: jsonData.definitions,
          };
          break;
        default:
          return; // Privacy tab - no save
      }

      await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
        jsonData: dataToSave,
        secureJsonData: Object.keys(secureDataToSave).length > 0 ? secureDataToSave : undefined,
        enabled: true,
      });

      // Configure or remove observability platform datasource auth (only for security tab)
      if (activeTab === 'security') {
        const apiKeyToSave = secureJsonData.apiKey?.trim();
        if (apiKeyToSave) {
          try {
            await configureAllDatasourcesAuth(apiKeyToSave);
          } catch (err) {
            console.warn('[ConfigForm] Failed to configure datasource auth:', err);
          }
        } else {
          // API key was cleared - remove auth from datasources
          try {
            await removeAllDatasourcesAuth();
          } catch (err) {
            console.warn('[ConfigForm] Failed to remove datasource auth:', err);
          }
        }
        setSecureJsonFields({ ...secureJsonFields, apiKey: !!apiKeyToSave });
      }

      // Refresh settings from server
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

  return (
    <div className="settings-page">
      {renderHeader()}

      <div className="page-container config-container-padded">
        {activeTab === 'security' && (
          <>
            <div className="settings-section">
              <div className="settings-section-header">
                <KeyOutlined className="settings-icon-green" />
                <h3 className="page-heading config-heading-m-0">API Settings</h3>
              </div>
              <div className="settings-section-content">
                {(() => {
                  const pendingKey = !!(secureJsonData?.apiKey && String(secureJsonData.apiKey).trim().length > 0);
                  const serverConfigured = !!secureJsonFields?.apiKey;
                  const hasKey = pendingKey || serverConfigured;
                  const canPaste = !hasKey;
                  return (
                    <InlineField label="API Key" tooltip="Paste your API key from the IyziTrace website. Stored in secure_json_data.">
                      <div className="settings-field-row">
                        <SecretInput
                          width={40}
                          isConfigured={serverConfigured}
                          onReset={() => {
                            setSecureJsonData({ ...(secureJsonData || {}), apiKey: '' });
                            setSecureJsonFields({ ...(secureJsonFields || {}), apiKey: false });
                          }}
                          value={secureJsonData?.apiKey ?? ''}
                          onChange={(e) => setSecureJsonData({ ...(secureJsonData || {}), apiKey: e.currentTarget.value })}
                        />
                        <Button
                          disabled={!canPaste}
                          onClick={async () => {
                            try {
                              const txt = await navigator.clipboard.readText();
                              if (!txt) {
                                alert('Clipboard is empty or not accessible.');
                                return;
                              }
                              setSecureJsonData({ ...(secureJsonData || {}), apiKey: txt.trim() });
                            } catch (e) {
                              alert('Paste failed. Grant clipboard permission and try again.');
                            }
                          }}
                        >
                          Paste
                        </Button>
                      </div>
                    </InlineField>
                  );
                })()}
                <div className="settings-description">
                  Obtain this key from the IyziTrace website and paste it here. It enables authorization for protected APIs so that pages and features respect your permissions. Once saved, the key cannot be viewed or copied again; the input will show "configured" on next load. Paste is enabled only when no key is set; Reset clears the current key and re-enables Paste.
                </div>
              </div>
            </div>
          </>
        )}

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

        {activeTab !== 'privacy' && (
          <div className="settings-save-container">
            <Button onClick={save} icon={<SaveOutlined />}>Save Settings</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigForm;