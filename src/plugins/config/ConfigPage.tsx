import React, { useEffect, useState } from 'react';
import { AppPluginMeta, PluginConfigPageProps } from '@grafana/data';
import { Button, InlineField, InlineFieldRow, Input, SecretInput, Select } from '@grafana/ui';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import type { PluginJsonData, PluginSecureJsonData } from '../../interfaces/options';
import { ServiceMapTable } from './ServiceMapTable';
import GrafanaLikeRangePicker from '../../components/core/graphanadatepicker';
import dayjs from 'dayjs';

type Options = {
  jsonData: PluginJsonData;
  secureJsonData?: PluginSecureJsonData;
  secureJsonFields?: Record<string, boolean>;
};

const newGuid = () =>
  (crypto as any)?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const ConfigPage: React.FC<PluginConfigPageProps<AppPluginMeta<Options>>> = (props) => {
  const pluginMeta = (props.plugin as unknown) as AppPluginMeta<Options>;
  const [jsonData, setJsonData] = useState<PluginJsonData>(((pluginMeta as any).jsonData as PluginJsonData) ?? {});
  const [secureJsonData, setSecureJsonData] = useState<PluginSecureJsonData>({});
  const [secureJsonFields, setSecureJsonFields] = useState<Record<string, boolean>>(((pluginMeta as any).secureJsonFields ?? {}) as Record<string, boolean>);
  const [lokiOpts, setLokiOpts] = useState<Array<{ label: string; value: string }>>([]);
  const [tempoOpts, setTempoOpts] = useState<Array<{ label: string; value: string }>>([]);
  const [absRange, setAbsRange] = useState<[number, number]>(jsonData.defaultAbsoluteRange ?? [Date.now() - 60 * 60 * 1000, Date.now()]);
  const [copyOk, setCopyOk] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const list = (await (getDataSourceSrv() as any).getList?.()) ?? (await getBackendSrv().get('/api/datasources'));
        const map = (x: any) => ({ label: x.name, value: x.uid });
        setLokiOpts(list.filter((x: any) => x.type === 'loki').map(map));
        setTempoOpts(list.filter((x: any) => x.type === 'tempo').map(map));
        // hydrate settings from server to ensure we show persisted values
        const pluginId = (pluginMeta as any)?.id || 'iyzitrace-app';
        const settings = await getBackendSrv().get(`/api/plugins/${pluginId}/settings`);
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
        console.error('Failed to load datasources', e);
      }
    })();
  }, []);

  const save = async () => {
    const pluginId = (pluginMeta as any)?.id || 'iyzitrace-app';
    await getBackendSrv().post(`/api/plugins/${pluginId}/settings`, {
      jsonData,
      secureJsonData,
      enabled: true,
    });
    setSecureJsonFields({ ...secureJsonFields, apiKey: !!secureJsonData.apiKey });
    try {
      const settings = await getBackendSrv().get(`/api/plugins/${pluginId}/settings`);
      if (settings?.jsonData) {
        setJsonData(settings.jsonData as PluginJsonData);
      }
    } catch {}
  };

  const resetApiKey = () => {
    const key = newGuid();
    setSecureJsonData({ ...(secureJsonData || {}), apiKey: key });
  };

  return (
    <div className="page-container">
      <h3 className="page-heading">API Settings</h3>
      <InlineFieldRow>
        <InlineField label="API Key" tooltip="Stored in secure_json_data">
          <SecretInput
            width={40}
            isConfigured={!!secureJsonFields?.apiKey}
            value={secureJsonData?.apiKey ?? ''}
            onReset={() => setSecureJsonData({ ...(secureJsonData || {}), apiKey: '' })}
            onChange={(e) => setSecureJsonData({ ...(secureJsonData || {}), apiKey: e.currentTarget.value })}
          />
        </InlineField>
        <Button className="ml-2" variant="secondary" onClick={resetApiKey}>
          Reset (GUID)
        </Button>
        <Button
          className="ml-2"
          onClick={async () => {
            const val = secureJsonData?.apiKey;
            if (val && typeof navigator !== 'undefined' && navigator.clipboard) {
              try {
                await navigator.clipboard.writeText(val);
                setCopyOk(true);
                setTimeout(() => setCopyOk(false), 2000);
              } catch (e) {
                // eslint-disable-next-line no-alert
                alert('Copy failed.');
              }
            } else {
              // eslint-disable-next-line no-alert
              alert('API key is not available to copy. Please type or Reset (GUID) first.');
            }
          }}
          variant={copyOk ? 'primary' : 'secondary'}
        >
          {copyOk ? 'Copied' : 'Copy'}
        </Button>
      </InlineFieldRow>

      <h3 className="page-heading">Default Datasources</h3>
      <InlineFieldRow>
        <InlineField label="Default Loki">
          <Select
            options={lokiOpts}
            value={lokiOpts.find((o) => o.value === jsonData.defaultLokiUid) ?? null}
            onChange={(v) => setJsonData({ ...jsonData, defaultLokiUid: v?.value })}
            width={40}
            placeholder="Select Loki datasource"
          />
        </InlineField>
        <InlineField label="Default Tempo">
          <Select
            options={tempoOpts}
            value={tempoOpts.find((o) => o.value === jsonData.defaultTempoUid) ?? null}
            onChange={(v) => setJsonData({ ...jsonData, defaultTempoUid: v?.value })}
            width={40}
            placeholder="Select Tempo datasource"
          />
        </InlineField>
      </InlineFieldRow>

      <h3 className="page-heading">Default Time Range</h3>
      <InlineFieldRow>
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
      </InlineFieldRow>

      {(jsonData.defaultTimeRanges && jsonData.defaultTimeRanges.length > 0) && (
        <div className="gf-form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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

      <h3 className="page-heading">Service Map Configuration</h3>
      <ServiceMapTable value={jsonData.serviceMap ?? []} onChange={(next) => setJsonData((prev) => ({ ...(prev || {}), serviceMap: next }))} />

      <div className="gf-form-group">
        <Button onClick={save}>Save Settings</Button>
      </div>
    </div>
  );
};

export default ConfigPage;


