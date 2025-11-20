import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Form, Card, Button, Space, Empty, Modal, Input, message, Row, Col, Tag, Skeleton } from 'antd';
import { PluginPage } from '@grafana/runtime';
import { getPluginSettings, savePluginSettings, PluginSettings } from '../../api/service/settings.service';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { getRegions } from '../../api/service/service-map.service';
import { getServicesTableData } from '../../api/service/services.service';
import { FilterParamsModel } from '../../api/service/query.service';

const { Title, Text } = Typography;

interface PageViewItem {
  id: string;
  title: string;
  description?: string;
  page: string;
  query: string;
  createdAt: string;
}

function ViewsPage() {
  const [widgets, setWidgets] = useState<PageViewItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWidget, setEditingWidget] = useState<PageViewItem | null>(null);
  const [form] = Form.useForm();
  const [queryPairs, setQueryPairs] = useState<Array<{ id: string; key: string; value: string; lockedKey: boolean }>>([]);
  const previewQuery = useMemo(() => new URLSearchParams(queryPairs.filter(p => p.key).map(p => [p.key, p.value] as [string, string])).toString(), [queryPairs]);

  // Plugin settings'den pageViews yükle
  useEffect(() => {
    const load = async () => {
      try {
        const settings: PluginSettings = await getPluginSettings();
        setWidgets((settings.pageViews as PageViewItem[]) || []);
      } catch (error) {
        console.error('Error loading pageViews:', error);
        setWidgets([]);
      }
    };
    load();
  }, []);

  const persist = async (items: PageViewItem[]) => {
    const settings: PluginSettings = await getPluginSettings();
    await savePluginSettings({ ...settings, pageViews: items });
    setWidgets(items);
  };

  const handleEditWidget = (widget: PageViewItem) => {
    setEditingWidget(widget);
    form.setFieldsValue({
      title: widget.title,
      page: widget.page,
      query: widget.query?.replace(/^\?/, ''),
      description: widget.description || ''
    });
    initializePairsFromQuery(widget.query || '');
    setModalVisible(true);
  };

  const handleDeleteWidget = (widgetId: string) => {
    const newWidgets = widgets.filter(w => w.id !== widgetId);
    persist(newWidgets).then(() => message.success('View deleted'));
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      const widgetData: PageViewItem = {
        id: editingWidget?.id || `view-${Date.now()}`,
        title: values.title,
        description: values.description || '',
        page: values.page,
        query: values.query ? (values.query.startsWith('?') ? values.query : `?${values.query}`) : '',
        createdAt: editingWidget?.createdAt || new Date().toISOString()
      };

      let newWidgets;
      if (editingWidget) {
        newWidgets = widgets.map(w => w.id === editingWidget.id ? widgetData : w);
        message.success('View updated');
      } else {
        newWidgets = [...widgets, widgetData];
        message.success('View added');
      }
      persist(newWidgets);
      setModalVisible(false);
      form.resetFields();
    }).catch(errorInfo => {
      // console.log('Validation failed:', errorInfo);
    });
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    form.resetFields();
    setQueryPairs([]);
  };

  const initializePairsFromQuery = (search: string) => {
    const sp = new URLSearchParams(search.startsWith('?') ? search : search ? `?${search}` : '');
    const pairs: Array<{ id: string; key: string; value: string; lockedKey: boolean }> = [];
    sp.forEach((value, key) => {
      pairs.push({ id: `${key}-${Math.random().toString(36).slice(2)}`, key, value, lockedKey: true });
    });
    setQueryPairs(pairs);
    const qs = new URLSearchParams(pairs.map(p => [p.key, p.value] as [string, string])).toString();
    form.setFieldsValue({ query: qs });
  };

  const syncFormQueryFromPairs = (pairs: Array<{ key: string; value: string }>) => {
    const qs = new URLSearchParams(pairs.filter(p => p.key).map(p => [p.key, p.value] as [string, string])).toString();
    form.setFieldsValue({ query: qs });
  };

  const addParamRow = () => {
    const next = [...queryPairs, { id: `new-${Date.now()}`, key: '', value: '', lockedKey: false }];
    setQueryPairs(next);
    syncFormQueryFromPairs(next.map(({ key, value }) => ({ key, value })));
  };

  const removeParamRow = (id: string) => {
    const next = queryPairs.filter(p => p.id !== id);
    setQueryPairs(next);
    syncFormQueryFromPairs(next.map(({ key, value }) => ({ key, value })));
  };

  const updateParamRow = (id: string, field: 'key' | 'value', v: string) => {
    const next = queryPairs.map(p => (p.id === id ? { ...p, [field]: v } : p));
    setQueryPairs(next);
    syncFormQueryFromPairs(next.map(({ key, value }) => ({ key, value })));
  };

  const lockKeyIfNeeded = (id: string) => {
    setQueryPairs(prev => prev.map(p => (p.id === id ? { ...p, lockedKey: true } : p)));
  };

  const buildWidgetUrl = (widget: PageViewItem) => {
    const url = widget.query || '';
    switch (widget.page) {
      case 'logs':
        return `/a/iyzitrace-app/logs${url}`;
      case 'traces':
        return `/a/iyzitrace-app/traces${url}`;
      case 'services':
        return `/a/iyzitrace-app/services${url}`;
      case 'service-map':
        return `/a/iyzitrace-app/service-map${url}`;
      case 'alerts':
        return `/a/iyzitrace-app/alerts${url}`;
      case 'exceptions':
        return `/a/iyzitrace-app/exceptions${url}`;
      default:
        return `/a/iyzitrace-app/${widget.page || ''}${url}`;
    }
  };

  const ViewPreview: React.FC<{ widget: PageViewItem }> = ({ widget }) => {
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [previewData, setPreviewData] = useState<{
      title: string;
      accent: string;
      highlights: Array<{ label: string; value: string }>;
      chips?: string[];
      footer?: string;
    } | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const parseQueryEntries = (query: string): [string, string][] => {
      const sp = new URLSearchParams(query?.startsWith('?') ? query.slice(1) : query || '');
      const entries: [string, string][] = [];
      sp.forEach((value, key) => entries.push([key, value]));
      return entries;
    };

    const buildFilterModel = (query: string) => {
      const params: Record<string, string> = {};
      parseQueryEntries(query).forEach(([key, value]) => {
        params[key] = value;
      });
      return new FilterParamsModel(params);
    };

    useEffect(() => {
      let isMounted = true;
      const loadPreview = async () => {
        setLoadingPreview(true);
        setPreviewError(null);
        try {
          const queryEntries = parseQueryEntries(widget.query || '');
          const filterModel = buildFilterModel(widget.query || '');

          let preview;
          switch (widget.page) {
            case 'service-map': {
              const data = await getRegions(filterModel);
              const regions = data ?? [];
              const infrastructures = regions.flatMap((region: any) => region.infrastructures || []);
              const applications = infrastructures.flatMap((infra: any) => infra.applications || []);
              const services = applications.flatMap((app: any) => app.services || []);
              const operations = services.flatMap((service: any) => service.operations || []);
              preview = {
                title: 'Topology Snapshot',
                accent: '#7c3aed',
                highlights: [
                  { label: 'Regions', value: regions.length.toString() },
                  { label: 'Infrastructures', value: infrastructures.length.toString() },
                  { label: 'Applications', value: applications.length.toString() },
                  { label: 'Services', value: services.length.toString() },
                  { label: 'Operations', value: operations.length.toString() }
                ],
                chips: queryEntries.map(([key, value]) => `${key}=${value}`),
                footer: 'Live data pulled from the service graph'
              };
              break;
            }
            case 'services': {
              const servicesData = await getServicesTableData(filterModel);
              const top = servicesData.slice(0, 3).map(service => ({
                label: service.name,
                value: `${(service.metrics?.callsPerSecond ?? 0).toFixed(1)} ms`
              }));
              preview = {
                title: 'Top Services',
                accent: '#10b981',
                highlights: top.length
                  ? top
                  : [{ label: 'Status', value: 'No service data for this time window' }],
                chips: queryEntries.map(([key, value]) => `${key}=${value}`),
                footer: 'Metrics refreshed in real-time'
              };
              break;
            }
            default: {
              preview = {
                title: 'Stored Filters',
                accent: '#3b82f6',
                highlights: [{ label: 'Target Page', value: widget.page }],
                chips: queryEntries.length
                  ? queryEntries.map(([key, value]) => `${key}=${value}`)
                  : ['No query parameters'],
                footer: 'Click View for the full experience'
              };
            }
          }

          if (isMounted) {
            setPreviewData(preview);
          }
        } catch (error) {
          console.error('Error building view preview:', error);
          if (isMounted) {
            setPreviewError('Preview unavailable');
          }
        } finally {
          if (isMounted) {
            setLoadingPreview(false);
          }
        }
      };

      loadPreview();
      return () => {
        isMounted = false;
      };
    }, [widget.page, widget.query, widget.id]);

    return (
      <div
        style={{
          marginTop: 12,
          border: '1px solid #303030',
          borderRadius: 12,
          background: 'radial-gradient(circle at top, rgba(255,255,255,0.08), rgba(0,0,0,0.2))',
          height: 200,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {loadingPreview ? (
          <Skeleton active title={false} paragraph={{ rows: 4 }} />
        ) : previewError ? (
          <div style={{ color: '#8c8c8c', fontSize: 12, textAlign: 'center', margin: 'auto 0' }}>
            {previewError}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: previewData?.accent, fontWeight: 600 }}>
                {previewData?.title}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date().toLocaleTimeString()}
              </Text>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
              {previewData?.highlights.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{item.label}</Text>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {previewData?.chips?.length ? (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {previewData.chips.map((chip) => (
                  <Tag
                    key={chip}
                    style={{ borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: '#fff' }}
                  >
                    {chip}
                  </Tag>
                ))}
              </div>
            ) : null}
            {previewData?.footer && (
              <Text type="secondary" style={{ marginTop: 'auto', fontSize: 11 }}>
                {previewData.footer}
              </Text>
            )}
          </>
        )}
      </div>
    );
  };

  const renderWidget = (widget: PageViewItem) => {
    const iframeUrl = buildWidgetUrl(widget);
    return (
      <Card
        key={widget.id}
        title={widget.title}
        size="small"
        style={{ marginBottom: '16px' }}
        extra={
          <Space>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                window.location.href = iframeUrl;
              }}
            >
              View
            </Button>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditWidget(widget)}
            >
              Edit
            </Button>
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDeleteWidget(widget.id)}
            >
              Delete
            </Button>
          </Space>
        }
      >
        <div>
          <Text strong>Page: </Text>
          <Text>{widget.page}</Text>
        </div>
        {widget.description && (
          <div>
            <Text strong>Description: </Text>
            <Text code>{widget.description}</Text>
          </div>
        )}
        <div>
          <Text strong>Created: </Text>
          <Text>{new Date(widget.createdAt).toLocaleDateString()}</Text>
        </div>
        <ViewPreview widget={widget} />
      </Card>
    );
  };

  return (
    <PluginPage>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: 0 }}>Views</Title>
            <Text style={{ color: '#8c8c8c' }}>
              Manage your views and quick access to different screens
            </Text>
          </div>
        </div>

        {widgets.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text style={{ color: '#8c8c8c' }}>No views added yet.</Text>
                <p style={{ color: '#595959', fontSize: '12px', marginTop: '8px' }}>
                  Click "Add View" to create your first view, or use "Save as View" from other pages.
                </p>
              </div>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {widgets.map(renderWidget)}
          </div>
        )}

        {/* Add/Edit Widget Modal */}
        <Modal
          title={editingWidget ? 'Edit View' : 'Add View to Dashboard'}
          open={modalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText={editingWidget ? 'Update' : 'Add'}
          cancelText="Cancel"
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              page: 'logs',
              query: '',
              filters: []
            }}
          >
            <Form.Item label="Page" name="page">
              <Input readOnly />
            </Form.Item>
            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: 'Please enter view title' }]}
            >
              <Input placeholder="Enter view title" />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
            >
              <Input.TextArea 
                placeholder="Optional description for this view"
                rows={2}
              />
            </Form.Item>
            <Form.Item label="Query (Optional)" name="query">
              <>
                <Row gutter={8}>
                  <Col span={10}><strong>Key</strong></Col>
                  <Col span={12}><strong>Value</strong></Col>
                  <Col span={2}></Col>
                </Row>
                {queryPairs.map(p => (
                  <Row key={p.id} gutter={8} style={{ marginTop: 6 }}>
                    <Col span={10}>
                      <Input
                        placeholder="key"
                        value={p.key}
                        readOnly={p.lockedKey}
                        style={{ color: '#ffffff' }}
                        onChange={e => updateParamRow(p.id, 'key', e.target.value)}
                        onBlur={() => lockKeyIfNeeded(p.id)}
                      />
                    </Col>
                    <Col span={12}>
                      <Input
                        placeholder="value"
                        value={p.value}
                        onChange={e => updateParamRow(p.id, 'value', e.target.value)}
                      />
                    </Col>
                    <Col span={2}>
                      <Button danger onClick={() => removeParamRow(p.id)}>Del</Button>
                    </Col>
                  </Row>
                ))}
                <Button style={{ marginTop: 8 }} onClick={addParamRow}>Add param</Button>
                <Input.TextArea style={{ marginTop: 8 }} rows={3} readOnly placeholder="Preview (auto-generated)" value={previewQuery} />
              </>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PluginPage>
  );
}

export default ViewsPage;
