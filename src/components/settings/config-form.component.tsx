import React, { useEffect, useState } from 'react';
import { Button, InlineField, Input, SecretInput, Select } from '@grafana/ui';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import type { PluginJsonData, PluginSecureJsonData } from '../../interfaces/utils/options';
import DefinitionsTable, { DEFAULT_DEFINITIONS } from './definitions-table.component';
import GrafanaLikeRangePicker from '../core/graphanadatepicker';
import dayjs from 'dayjs';
import { KeyOutlined, DatabaseOutlined, FieldTimeOutlined, SaveOutlined, FileTextOutlined, RobotOutlined } from '@ant-design/icons';
import { configureAllDatasourcesAuth, removeAllDatasourcesAuth } from '../../api/service/observability-auth.service';
import '../../assets/styles/components/settings/settings.css';

const PLUGIN_ID = 'iyzitrace-app';

const TAB_ITEMS = [
  'Defaults',
  'AI',
  'Definitions',
  'Security',
  'Privacy',
] as const;

const ConfigForm: React.FC = () => {
  const [jsonData, setJsonData] = useState<PluginJsonData>({});
  const [secureJsonData, setSecureJsonData] = useState<PluginSecureJsonData>({});
  const [secureJsonFields, setSecureJsonFields] = useState<Record<string, boolean>>({});
  const [lokiOpts, setLokiOpts] = useState<Array<{ label: string; value: string }>>([]);
  const [tempoOpts, setTempoOpts] = useState<Array<{ label: string; value: string }>>([]);
  const [prometheusOpts, setPrometheusOpts] = useState<Array<{ label: string; value: string }>>([]);
  const [absRange, setAbsRange] = useState<[number, number]>([Date.now() - 60 * 60 * 1000, Date.now()]);
  const [activeTab, setActiveTab] = useState<typeof TAB_ITEMS[number]>('Defaults');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = (await (getDataSourceSrv() as any).getList?.()) ?? (await getBackendSrv().get('/api/datasources'));
        const map = (x: any) => ({ label: x.name, value: x.uid });
        setLokiOpts(list.filter((x: any) => x.type === 'loki').map(map));
        setTempoOpts(list.filter((x: any) => x.type === 'tempo').map(map));
        setPrometheusOpts(list.filter((x: any) => x.type === 'prometheus').map(map));
        const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
        if (settings) {
          const jd = (settings.jsonData || {}) as PluginJsonData;
          if (!jd.definitions) {
            jd.definitions = DEFAULT_DEFINITIONS;
          }
          setJsonData(jd);
          setSecureJsonFields(settings.secureJsonFields || {});
          if (jd.defaultAbsoluteRange && Array.isArray(jd.defaultAbsoluteRange)) {
            setAbsRange([Number(jd.defaultAbsoluteRange[0]), Number(jd.defaultAbsoluteRange[1])]);
          }
        }
      } catch (e) {
      }
    })();
  }, []);

  const save = async () => {
    setIsSaving(true);
    try {
      // Get the API key before saving (it will be cleared from secureJsonData after save)
      const apiKeyToSave = secureJsonData.apiKey?.trim();

      await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
        jsonData,
        secureJsonData,
        enabled: true,
      });

      // Configure or remove observability platform datasource auth
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

  const renderTabBar = () => (
    <div style={{
      display: 'flex',
      gap: 8,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 16,
      paddingBottom: 4,
      overflowX: 'auto'
    }}>
      {TAB_ITEMS.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: '#E5E7EB',
            border: '1px solid rgba(255,255,255,0.12)',
            borderBottomColor: activeTab === tab ? '#34d399' : 'rgba(255,255,255,0.12)',
            padding: '6px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  const renderPlaceholder = (title: string) => (
    <div style={{ padding: '16px 4px' }}>
      <h3 className="page-heading" style={{ marginBottom: 8 }}>{title}</h3>
      <div style={{
        padding: 16,
        border: '1px dashed rgba(255,255,255,0.15)',
        borderRadius: 8,
        color: '#9CA3AF',
        marginBottom: 16
      }}>
        <div style={{
          fontSize: 13,
          color: '#9CA3AF',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          padding: '18px 20px',
          marginTop: 8,
          lineHeight: 1.7,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ margin: '8px 0 12px 0', color: '#a3a3a3', fontSize: 13 }}>
            Below you can find important legal documents and policies regarding your use of IyziTrace. Please review these documents to understand your rights, responsibilities, and how your data is handled and protected.
          </div>
          <ul style={{ margin: '0 0 0 18px', padding: 0, listStyle: 'disc' }}>
            <li style={{ marginBottom: 8 }}>
              <a href="https://beta.iyzitrace.com/legal/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#34d399', fontWeight: 500 }}>
                Terms and Conditions
              </a>
              <div style={{ fontSize: 12, color: '#bdbdbd', marginTop: 2 }}>
                The main contract for using IyziTrace. Outlines your rights, obligations, and the rules for using our services.
              </div>
            </li>
            <li style={{ marginBottom: 8 }}>
              <a href="https://beta.iyzitrace.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#34d399', fontWeight: 500 }}>
                Privacy Policy
              </a>
              <div style={{ fontSize: 12, color: '#bdbdbd', marginTop: 2 }}>
                Explains how we collect, use, store, and protect your personal data when you use IyziTrace.
              </div>
            </li>
            <li style={{ marginBottom: 8 }}>
              <a href="https://beta.iyzitrace.com/legal/dpa" target="_blank" rel="noopener noreferrer" style={{ color: '#34d399', fontWeight: 500 }}>
                Data Processing Agreement (DPA)
              </a>
              <div style={{ fontSize: 12, color: '#bdbdbd', marginTop: 2 }}>
                Details our commitments and your rights regarding data processing, especially for GDPR compliance.
              </div>
            </li>
            <li style={{ marginBottom: 0 }}>
              <a href="https://beta.iyzitrace.com/legal/vulnerability-disclosure" target="_blank" rel="noopener noreferrer" style={{ color: '#34d399', fontWeight: 500 }}>
                Vulnerability Disclosure
              </a>
              <div style={{ fontSize: 12, color: '#bdbdbd', marginTop: 2 }}>
                Learn how to report security vulnerabilities and help us keep IyziTrace safe for everyone.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {renderTabBar()}

      {activeTab === 'Security' && (
        <>
          <div style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <KeyOutlined style={{ color: '#34d399' }} />
              <h3 className="page-heading" style={{ margin: 0 }}>API Settings</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(() => {
                const pendingKey = !!(secureJsonData?.apiKey && String(secureJsonData.apiKey).trim().length > 0);
                const serverConfigured = !!secureJsonFields?.apiKey;
                const hasKey = pendingKey || serverConfigured;
                const canPaste = !hasKey;
                return (
                  <InlineField label="API Key" tooltip="Paste your API key from the IyziTrace website. Stored in secure_json_data.">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                      {
                      }
                    </div>
                  </InlineField>
                );
              })()}
              <div style={{ color: '#9CA3AF' }}>
                Obtain this key from the IyziTrace website and paste it here. It enables authorization for protected APIs so that pages and features respect your permissions. Once saved, the key cannot be viewed or copied again; the input will show "configured" on next load. Paste is enabled only when no key is set; Reset clears the current key and re-enables Paste.
              </div>
            </div>
          </div>

        </>
      )}
      {activeTab === 'Defaults' && (
        <>

          <div style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <DatabaseOutlined style={{ color: '#60a5fa' }} />
              <h3 className="page-heading" style={{ margin: 0 }}>Default Datasources</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <InlineField label="Default Loki">
                  <Select
                    options={lokiOpts}
                    value={lokiOpts.find((o) => o.value === jsonData.defaultLokiUid) ?? null}
                    onChange={(v) => setJsonData({ ...jsonData, defaultLokiUid: v?.value })}
                    width={40}
                    placeholder="Select Loki datasource"
                  />
                </InlineField>
                <div style={{ color: '#9CA3AF', marginTop: 6 }}>
                  Loki is used for log queries and exceptions; selecting a default saves you clicks across pages.
                </div>
              </div>
              <div>
                <InlineField label="Default Tempo">
                  <Select
                    options={tempoOpts}
                    value={tempoOpts.find((o) => o.value === jsonData.defaultTempoUid) ?? null}
                    onChange={(v) => setJsonData({ ...jsonData, defaultTempoUid: v?.value })}
                    width={40}
                    placeholder="Select Tempo datasource"
                  />
                </InlineField>
                <div style={{ color: '#9CA3AF', marginTop: 6 }}>
                  Tempo powers distributed traces and dependencies; the default is used in trace and map views.
                </div>
              </div>
              <div>
                <InlineField label="Default Prometheus">
                  <Select
                    options={prometheusOpts}
                    value={prometheusOpts.find((o) => o.value === jsonData.defaultPrometheusUid) ?? null}
                    onChange={(v) => setJsonData({ ...jsonData, defaultPrometheusUid: v?.value })}
                    width={40}
                    placeholder="Select Prometheus datasource"
                  />
                </InlineField>
                <div style={{ color: '#9CA3AF', marginTop: 6 }}>
                  Prometheus is used for metrics queries and alerts; the default is used in metrics and alert views.
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FieldTimeOutlined style={{ color: '#f59e0b' }} />
              <h3 className="page-heading" style={{ margin: 0 }}>Default Time Range</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InlineField label="Absolute Time Range">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GrafanaLikeRangePicker
                    value={absRange}
                    onChange={(s, e) => setAbsRange([s, e])}
                    onApply={(s, e) => {
                      setAbsRange([s, e]);
                      setJsonData({ ...jsonData, defaultAbsoluteRange: [s, e] });
                    }}
                    title="Absolute time range"
                  />
                  <Input readOnly width={60} value={`${dayjs(absRange[0]).format('YYYY-MM-DD HH:mm:ss')} → ${dayjs(absRange[1]).format('YYYY-MM-DD HH:mm:ss')}`} />
                </div>
              </InlineField>
              <div style={{ color: '#9CA3AF' }}>
                Sets the default absolute range when pages first load. Prevents empty data if a zero-width window is detected.
              </div>
            </div>
          </div>

        </>
      )}
      {activeTab === 'AI' && (
        <>
          <div style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <RobotOutlined style={{ color: '#a78bfa' }} />
              <h3 className="page-heading" style={{ margin: 0 }}>AI Assistant Configuration</h3>
            </div>
            <div style={{ marginBottom: 8, color: '#9CA3AF' }}>
              Configure the AI assistant settings. The API key will be stored securely and used for AI-powered insights.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                <div style={{ color: '#9CA3AF', marginTop: 6 }}>
                  Your OpenRouter API key. Get one from https:
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
                <div style={{ color: '#9CA3AF', marginTop: 6 }}>
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
                <div style={{ color: '#9CA3AF', marginTop: 6 }}>
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
                <div style={{ color: '#9CA3AF', marginTop: 6 }}>
                  Maximum length of AI responses. Higher values allow longer answers but cost more. Recommended: 150-500
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {
      }
      {activeTab === 'Definitions' && (
        <>
          <div style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FileTextOutlined style={{ color: '#60a5fa' }} />
              <h3 className="page-heading" style={{ margin: 0 }}>Metric and Label Definitions</h3>
            </div>
            <div style={{ marginBottom: 8, color: '#9CA3AF' }}>
              Configure label names and metric names used in Prometheus queries. These values are used throughout the application for querying service metrics.
            </div>
            <DefinitionsTable
              value={jsonData.definitions || DEFAULT_DEFINITIONS}
              onChange={(next) => setJsonData((prev) => ({ ...(prev || {}), definitions: next }))}
            />
          </div>
        </>
      )}

      {activeTab !== 'Security' && activeTab !== 'AI' && activeTab !== 'Defaults' && activeTab !== 'Definitions' && renderPlaceholder(activeTab)}

      <div style={{ position: 'sticky', bottom: 0, paddingTop: 8, paddingBottom: 8, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={save} icon={<SaveOutlined />}>Save Settings</Button>
      </div>
    </div>
  );
};

export default ConfigForm;