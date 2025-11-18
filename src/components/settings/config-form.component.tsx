import React, { useEffect, useState, useMemo } from 'react';
import { Button, InlineField, Input, SecretInput, Select } from '@grafana/ui';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import type { PluginJsonData, PluginSecureJsonData } from '../../interfaces/options';
import DefinitionsTable, { DEFAULT_DEFINITIONS } from './definitions-table.component';
import GrafanaLikeRangePicker from '../core/graphanadatepicker';
import dayjs from 'dayjs';
import { KeyOutlined, DatabaseOutlined, FieldTimeOutlined, DeploymentUnitOutlined, SaveOutlined, FileTextOutlined, EditOutlined, CheckOutlined, CloseOutlined, AlignLeftOutlined } from '@ant-design/icons';
import { Table, Input as AntInput, Button as AntButton } from 'antd';
import { getPluginSettings, savePluginSettings } from '../../api/service/settings.service';

// guid helper not needed in paste-only model

const PLUGIN_ID = 'iyzitrace-app';

const TAB_ITEMS = [
  'General',
  'Defaults',
  'Service Map',
  'Definitions',
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
  const [prometheusOpts, setPrometheusOpts] = useState<Array<{ label: string; value: string }>>([]);
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
        setPrometheusOpts(list.filter((x: any) => x.type === 'prometheus').map(map));
        const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
        // eslint-disable-next-line no-console
        // console.log('plugin_settings(raw):', settings);
        if (settings) {
          const jd = (settings.jsonData || {}) as PluginJsonData;
          // If definitions don't exist, use defaults
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
      {activeTab === 'Service Map' && (
        <>
          <ServiceMapPageViewsSection />
        </>
      )}
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

      {activeTab !== 'Security' && activeTab !== 'Service Map' && activeTab !== 'Defaults' && activeTab !== 'Definitions' && renderPlaceholder(activeTab)}

      <div style={{ position: 'sticky', bottom: 0, paddingTop: 8, paddingBottom: 8, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={save} icon={<SaveOutlined />}>Save Settings</Button>
      </div>
    </div>
  );
};

const ServiceMapPageViewsSection: React.FC = () => {
  const [pageViews, setPageViews] = useState<Array<{ id: string; title: string; data?: { items?: any[] } }>>([]);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [editingKey, setEditingKey] = useState<string>('');
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadPageViews = async () => {
      try {
        const settings = await getPluginSettings();
        const serviceMapViews = (settings.pageViews || []).filter((view: any) => view.page === 'service-map');
        setPageViews(serviceMapViews);
        if (serviceMapViews.length > 0) {
          setSelectedViewId((prev) => prev || serviceMapViews[0].id);
        }
      } catch (error) {
        console.error('Error loading pageViews:', error);
      }
    };
    loadPageViews();
  }, []);

  const selectedView = pageViews.find(v => v.id === selectedViewId);
  const items = selectedView?.data?.items || [];

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return items;
    const lowerSearch = searchText.toLowerCase();
    return items.filter((item: any) => {
      const id = String(item.id || '').toLowerCase();
      const type = String(item.type || '').toLowerCase();
      return id.includes(lowerSearch) || type.includes(lowerSearch);
    });
  }, [items, searchText]);

  const isEditing = (record: any) => record.id === editingKey;

  const edit = (record: any) => {
    setEditingKey(record.id);
    setEditingValues({
      position: record.position || { x: 0, y: 0 },
      groupPosition: record.groupPosition || { x: 0, y: 0 },
      groupSize: record.groupSize || { width: 100, height: 100 },
    });
  };

  const cancel = () => {
    setEditingKey('');
    setEditingValues({});
  };

  const save = async (record: any) => {
    try {
      const updatedItems = items.map((item: any) => {
        if (item.id === record.id) {
          return {
            ...item,
            position: editingValues.position,
            groupPosition: editingValues.groupPosition,
            groupSize: editingValues.groupSize,
          };
        }
        return item;
      });

      const updatedPageViews = pageViews.map((view) => {
        if (view.id === selectedViewId) {
          return {
            ...view,
            data: {
              ...view.data,
              items: updatedItems,
            },
          };
        }
        return view;
      });

      setPageViews(updatedPageViews);
      setEditingKey('');

      // Save to plugin settings
      const settings = await getPluginSettings();
      const allPageViews = (settings.pageViews || []).map((view: any) => {
        if (view.page === 'service-map' && view.id === selectedViewId) {
          return {
            ...view,
            data: {
              ...view.data,
              items: updatedItems,
            },
          };
        }
        return view;
      });

      await savePluginSettings({ ...settings, pageViews: allPageViews });
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const updateEditingValue = (field: string, subField: string, value: number) => {
    setEditingValues((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value,
      },
    }));
  };

  const autoAlignItems = async () => {
    if (!selectedViewId || items.length === 0) return;

    // Group items by type
    const regions = items.filter((item: any) => item.type === 'region');
    const infrastructures = items.filter((item: any) => item.type === 'infrastructure');
    const applications = items.filter((item: any) => item.type === 'application');

    const itemsPerRow = 3;
    const itemWidth = 180;
    const itemHeight = 100;
    const padding = 20;
    let currentY = 0;

    const updatedItems: any[] = [];

    // Process regions
    regions.forEach((region: any) => {
      // Find infrastructures for this region
      // Replace "infra|" with "region|" in infrastructure ID and check if it starts with region ID
      const regionInfras = infrastructures.filter((infra: any) => {
        if (!infra.id) return false;
        // Replace "infra|" with "region|" in infrastructure ID
        const replacedId = infra.id.replace(/^infra\|/, 'region|');
        return replacedId.startsWith(region.id);
      });

      const infraCount = regionInfras.length;
      let regionGroupWidth: number;
      let regionGroupHeight: number;

      if (infraCount === 0) {
        regionGroupWidth = 200;
        regionGroupHeight = 300;
      } else if (infraCount === 1) {
        regionGroupWidth = 200;
        regionGroupHeight = 300;
      } else if (infraCount === 2) {
        regionGroupWidth = 400;
        regionGroupHeight = 300;
      } else if (infraCount === 3) {
        regionGroupWidth = 600;
        regionGroupHeight = 300;
      } else {
        regionGroupWidth = 600;
        regionGroupHeight = Math.ceil(infraCount / 3) * 300;
      }

      const regionX = 0;
      const regionY = currentY;

      // Update region
      updatedItems.push({
        ...region,
        position: { x: regionX, y: regionY },
        groupPosition: { x: regionX, y: regionY },
        groupSize: { width: regionGroupWidth, height: regionGroupHeight },
      });

      // Process infrastructures for this region
      // Infrastructure positions are relative to region's groupPosition
      regionInfras.forEach((infra: any, infraIndex: number) => {
        // Find applications for this infrastructure
        // Replace "app|" with "infra|" in application ID and check if it starts with infrastructure ID
        const infraApps = applications.filter((app: any) => {
          if (!app.id) return false;
          // Replace "app|" with "infra|" in application ID
          const replacedId = app.id.replace(/^app\|/, 'infra|');
          return replacedId.startsWith(infra.id);
        });

        const appCount = infraApps.length;
        let infraGroupWidth: number;
        let infraGroupHeight: number;

        if (appCount === 0) {
          infraGroupWidth = 200;
          infraGroupHeight = 300;
        } else if (appCount === 1) {
          infraGroupWidth = 200;
          infraGroupHeight = 300;
        } else if (appCount === 2) {
          infraGroupWidth = 400;
          infraGroupHeight = 300;
        } else if (appCount === 3) {
          infraGroupWidth = 600;
          infraGroupHeight = 300;
        } else {
          infraGroupWidth = 600;
          infraGroupHeight = Math.ceil(appCount / 3) * 300;
        }

        const row = Math.floor(infraIndex / itemsPerRow);
        const col = infraIndex % itemsPerRow;
        // Infrastructure position is relative to region (starting from 0,0 within the region)
        const infraX = col * (itemWidth + padding);
        const infraY = row * (itemHeight + padding);
        // Infrastructure's absolute position (region position + relative position)
        const infraAbsoluteX = regionX + infraX;
        const infraAbsoluteY = regionY + infraY;

        // Update infrastructure
        updatedItems.push({
          ...infra,
          position: { x: infraX, y: infraY },
          groupPosition: { x: infraAbsoluteX, y: infraAbsoluteY },
          groupSize: { width: infraGroupWidth, height: infraGroupHeight },
        });

        // Process applications for this infrastructure
        // Application positions are relative to infrastructure's position
        infraApps.forEach((app: any, appIndex: number) => {
          const appRow = Math.floor(appIndex / itemsPerRow);
          const appCol = appIndex % itemsPerRow;
          // Application position is relative to infrastructure (starting from 0,0 within the infrastructure)
          const appX = appCol * (itemWidth + padding);
          const appY = appRow * (itemHeight + padding);
          // Application's absolute position (infrastructure absolute position + relative position)
          const appAbsoluteX = infraAbsoluteX + appX;
          const appAbsoluteY = infraAbsoluteY + appY;

          updatedItems.push({
            ...app,
            position: { x: appX, y: appY },
            groupPosition: { x: appAbsoluteX, y: appAbsoluteY },
            groupSize: { width: 100, height: 100 },
          });
        });
      });

      currentY += regionGroupHeight + padding * 2;
    });

    // Add any remaining items that weren't processed (orphaned items)
    const processedIds = new Set(updatedItems.map((item: any) => item.id));
    const remainingItems = items.filter((item: any) => !processedIds.has(item.id));
    remainingItems.forEach((item: any) => {
      updatedItems.push({
        ...item,
        position: item.position || { x: 0, y: currentY },
        groupPosition: item.groupPosition || { x: 0, y: currentY },
        groupSize: item.groupSize || { width: 200, height: 300 },
      });
      currentY += 350;
    });

    const updatedPageViews = pageViews.map((view) => {
      if (view.id === selectedViewId) {
        return {
          ...view,
          data: {
            ...view.data,
            items: updatedItems,
          },
        };
      }
      return view;
    });

    setPageViews(updatedPageViews);

    // Save to plugin settings
    try {
      const settings = await getPluginSettings();
      const allPageViews = (settings.pageViews || []).map((view: any) => {
        if (view.page === 'service-map' && view.id === selectedViewId) {
          return {
            ...view,
            data: {
              ...view.data,
              items: updatedItems,
            },
          };
        }
        return view;
      });

      await savePluginSettings({ ...settings, pageViews: allPageViews });
    } catch (error) {
      console.error('Error saving auto-aligned items:', error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '25%',
      sorter: (a: any, b: any) => {
        const aId = String(a.id || '').toLowerCase();
        const bId = String(b.id || '').toLowerCase();
        return aId.localeCompare(bId);
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '15%',
      sorter: (a: any, b: any) => {
        const aType = String(a.type || '').toLowerCase();
        const bType = String(b.type || '').toLowerCase();
        return aType.localeCompare(bType);
      },
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: '20%',
      render: (_: any, record: any) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <AntInput
                type="number"
                size="small"
                style={{ width: 60 }}
                value={editingValues.position?.x}
                onChange={(e) => updateEditingValue('position', 'x', Number(e.target.value))}
                placeholder="x"
              />
              <span>,</span>
              <AntInput
                type="number"
                size="small"
                style={{ width: 60 }}
                value={editingValues.position?.y}
                onChange={(e) => updateEditingValue('position', 'y', Number(e.target.value))}
                placeholder="y"
              />
            </div>
          );
        }
        return record.position ? `(${record.position.x}, ${record.position.y})` : '-';
      },
    },
    {
      title: 'Group Position',
      dataIndex: 'groupPosition',
      key: 'groupPosition',
      width: '20%',
      render: (_: any, record: any) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <AntInput
                type="number"
                size="small"
                style={{ width: 60 }}
                value={editingValues.groupPosition?.x}
                onChange={(e) => updateEditingValue('groupPosition', 'x', Number(e.target.value))}
                placeholder="x"
              />
              <span>,</span>
              <AntInput
                type="number"
                size="small"
                style={{ width: 60 }}
                value={editingValues.groupPosition?.y}
                onChange={(e) => updateEditingValue('groupPosition', 'y', Number(e.target.value))}
                placeholder="y"
              />
            </div>
          );
        }
        return record.groupPosition ? `(${record.groupPosition.x}, ${record.groupPosition.y})` : '-';
      },
    },
    {
      title: 'Group Size',
      dataIndex: 'groupSize',
      key: 'groupSize',
      width: '20%',
      render: (_: any, record: any) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <AntInput
                type="number"
                size="small"
                style={{ width: 60 }}
                value={editingValues.groupSize?.width}
                onChange={(e) => updateEditingValue('groupSize', 'width', Number(e.target.value))}
                placeholder="w"
              />
              <span>,</span>
              <AntInput
                type="number"
                size="small"
                style={{ width: 60 }}
                value={editingValues.groupSize?.height}
                onChange={(e) => updateEditingValue('groupSize', 'height', Number(e.target.value))}
                placeholder="h"
              />
            </div>
          );
        }
        return record.groupSize ? `(${record.groupSize.width}, ${record.groupSize.height})` : '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_: any, record: any) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <div style={{ display: 'flex', gap: 4 }}>
              <AntButton
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => save(record)}
              />
              <AntButton
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={cancel}
              />
            </div>
          );
        }
        return (
          <AntButton
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => edit(record)}
          />
        );
      },
    },
  ];

  const viewOptions = pageViews.map(view => ({
    label: view.title || view.id,
    value: view.id,
  }));

  return (
    <div style={{
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DeploymentUnitOutlined style={{ color: '#a78bfa' }} />
          <h3 className="page-heading" style={{ margin: 0 }}>Service Map Page Views</h3>
        </div>
        {selectedView && items.length > 0 && (
          <AntButton
            type="primary"
            icon={<AlignLeftOutlined />}
            onClick={autoAlignItems}
          >
            Auto Align Items
          </AntButton>
        )}
      </div>
      <div style={{ marginBottom: 12, color: '#9CA3AF' }}>
        Select a page view to view and search its items by ID and type.
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <InlineField label="Page View">
            <Select
              options={viewOptions}
              value={selectedViewId ? viewOptions.find(o => o.value === selectedViewId) : null}
              onChange={(v) => setSelectedViewId(v?.value || null)}
              width={40}
              placeholder="Select a page view"
            />
          </InlineField>
        </div>
        <div style={{ flex: 1 }}>
          <InlineField label="Search (ID/Type)">
            <AntInput
              placeholder="Search by ID or type..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </InlineField>
        </div>
      </div>

      {selectedView && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8, color: '#9CA3AF' }}>
            Showing {filteredItems.length} of {items.length} items
          </div>
          <Table
            dataSource={filteredItems}
            columns={columns}
            rowKey={(record: any, index: number) => record.id || `row-${index}`}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} items`,
              pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{ y: 400 }}
            size="small"
            style={{
              background: 'rgba(0,0,0,0.2)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ConfigForm;


