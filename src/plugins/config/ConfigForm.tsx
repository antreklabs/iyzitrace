import React, { useEffect, useState } from 'react';
import { Button, InlineField, Input, SecretInput, Select } from '@grafana/ui';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import type { PluginJsonData, PluginSecureJsonData } from '../../interfaces/options';
import { ServiceMapTable } from './ServiceMapTable';
import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
import dayjs from 'dayjs';
import { KeyOutlined, DatabaseOutlined, FieldTimeOutlined, DeploymentUnitOutlined, SaveOutlined } from '@ant-design/icons';

// guid helper not needed in paste-only model

const PLUGIN_ID = 'iyzitrace-app';

const TAB_ITEMS = [
  'General',
  'Defaults',
  'Service Map',
  'Security',
  'Privacy',
  'Account preferences'
] as const;

const ConfigForm: React.FC = () => {
  const [jsonData, setJsonData] = useState<PluginJsonData>({});
  const [secureJsonData, setSecureJsonData] = useState<PluginSecureJsonData>({});
  const [secureJsonFields, setSecureJsonFields] = useState<Record<string, boolean>>({});
  const [lokiOpts, setLokiOpts] = useState<Array<{ label: string; value: string }>>([]);
  const [tempoOpts, setTempoOpts] = useState<Array<{ label: string; value: string }>>([]);
  const [absRange, setAbsRange] = useState<[number, number]>([Date.now() - 60 * 60 * 1000, Date.now()]);
  // copyOk removed; paste-only model
  const [activeTab, setActiveTab] = useState<typeof TAB_ITEMS[number]>('General');

  useEffect(() => {
    (async () => {
      try {
        const list = (await (getDataSourceSrv() as any).getList?.()) ?? (await getBackendSrv().get('/api/datasources'));
        const map = (x: any) => ({ label: x.name, value: x.uid });
        setLokiOpts(list.filter((x: any) => x.type === 'loki').map(map));
        setTempoOpts(list.filter((x: any) => x.type === 'tempo').map(map));
        const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
        // eslint-disable-next-line no-console
        console.log('plugin_settings(raw):', settings);
        if (settings) {
          const jd = (settings.jsonData || {}) as PluginJsonData;
          setJsonData(jd);
          setSecureJsonFields(settings.secureJsonFields || {});
          if (jd.defaultAbsoluteRange && Array.isArray(jd.defaultAbsoluteRange)) {
            setAbsRange([Number(jd.defaultAbsoluteRange[0]), Number(jd.defaultAbsoluteRange[1])]);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load config', e);
      }
    })();
  }, []);

  const save = async () => {
    await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
      jsonData,
      secureJsonData,
      enabled: true,
    });
    setSecureJsonFields({ ...secureJsonFields, apiKey: !!secureJsonData.apiKey });
    try {
      const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
      if (settings?.jsonData) {
        setJsonData(settings.jsonData as PluginJsonData);
      }
    } catch {}
  };

  // resetApiKey removed in paste-only model

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
        color: '#9CA3AF'
      }}>
        This section will be configurable soon. Add fields here as your needs grow.
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
                        onReset={() => { setSecureJsonData({ ...(secureJsonData || {}), apiKey: '' });
                        setSecureJsonFields({ ...(secureJsonFields || {}), apiKey: false }); }}
                        value={secureJsonData?.apiKey ?? ''}
                        onChange={(e) => setSecureJsonData({ ...(secureJsonData || {}), apiKey: e.currentTarget.value })}
                      />
                      <Button
                        disabled={!canPaste}
                        onClick={async () => {
                          try {
                            const txt = await navigator.clipboard.readText();
                            if (!txt) {
                              // eslint-disable-next-line no-alert
                              alert('Clipboard is empty or not accessible.');
                              return;
                            }
                            setSecureJsonData({ ...(secureJsonData || {}), apiKey: txt.trim() });
                          } catch (e) {
                            // eslint-disable-next-line no-alert
                            alert('Paste failed. Grant clipboard permission and try again.');
                          }
                        }}
                      >
                        Paste
                      </Button>
                      {/* <Button
                        variant="secondary"
                        disabled={!canReset}
                        onClick={() => {
                          setSecureJsonData({ ...(secureJsonData || {}), apiKey: '' });
                          setSecureJsonFields({ ...(secureJsonFields || {}), apiKey: false });
                        }}
                      >
                        Reset
                      </Button> */}
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

            {(jsonData.defaultTimeRanges && jsonData.defaultTimeRanges.length > 0) && (
              <div className="gf-form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {(jsonData.defaultTimeRanges || []).map((t, idx) => (
                  <span key={idx} className="gf-form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1f1f1f', padding: '2px 8px', borderRadius: 4 }}>
                    {t}
                    <Button size="sm" variant="destructive" onClick={() => {
                      const copy = [...(jsonData.defaultTimeRanges || [])];
                      copy.splice(idx, 1);
                      setJsonData({ ...jsonData, defaultTimeRanges: copy });
                    }}>×</Button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </>
      )}
      {activeTab === 'Service Map' && (
        <>
          
          <div style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <DeploymentUnitOutlined style={{ color: '#a78bfa' }} />
              <h3 className="page-heading" style={{ margin: 0 }}>Service Map Configuration</h3>
            </div>
            <div style={{ marginBottom: 8, color: '#9CA3AF' }}>
              Defines infra/application/service layout used by the Service Map. Useful for curated maps and consistent positions.
            </div>
            <ServiceMapTable value={jsonData.serviceMap ?? []} onChange={(next) => setJsonData((prev) => ({ ...(prev || {}), serviceMap: next }))} />
          </div>
        </>
      )}

      {activeTab !== 'Security' && activeTab !== 'Service Map' && activeTab !== 'Defaults' && renderPlaceholder(activeTab)}

      <div style={{ position: 'sticky', bottom: 0, paddingTop: 8, paddingBottom: 8, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={save} icon={<SaveOutlined />}>Save Settings</Button>
      </div>
    </div>
  );
};

export default ConfigForm;


