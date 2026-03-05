import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Form, Card, Button, Space, Empty, Modal, Input, message, Row, Col, Skeleton } from 'antd';
import { getPluginSettings, savePluginSettings, PluginSettings } from '../../api/service/settings.service';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined } from '@ant-design/icons';
import '../../assets/styles/pages/views/views.css';
import { getRegions } from '../../api/service/service-map.service';
import { getServicesTableData } from '../../api/service/services.service';
import { getTracesTableData } from '../../api/service/traces.service';
import { getLogsTableData } from '../../api/service/logs.service';
import { getExceptions } from '../../api/service/exception.service';
import { getFailedChecks } from '../../api/service/alert.service';
import { FilterParamsModel } from '../../api/service/query.service';

const { Text } = Typography;

interface PageViewItem {
    id: string;
    title: string;
    description?: string;
    page: string;
    query: string;
    createdAt: string;
}

const formatDuration = (ms: number): string => {
    if (ms >= 1000) {
        return `${(ms / 1000).toFixed(2)} s`;
    }
    return `${ms.toFixed(2)} ms`;
};

const ViewsPanel: React.FC = () => {
    const [widgets, setWidgets] = useState<PageViewItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingWidget, setEditingWidget] = useState<PageViewItem | null>(null);
    const [form] = Form.useForm();
    const [queryPairs, setQueryPairs] = useState<Array<{ id: string; key: string; value: string; lockedKey: boolean }>>([]);
    const previewQuery = useMemo(() => new URLSearchParams(queryPairs.filter(p => p.key).map(p => [p.key, p.value] as [string, string])).toString(), [queryPairs]);

    useEffect(() => {
        const load = async () => {
            try {
                const settings: PluginSettings = await getPluginSettings();
                let loadedWidgets = (settings.pageViews as PageViewItem[]) || [];

                const idCounts = new Map<string, number>();
                let needsFix = false;

                loadedWidgets.forEach(w => {
                    const count = idCounts.get(w.id) || 0;
                    idCounts.set(w.id, count + 1);
                    if (count > 0) {
                        needsFix = true;
                    }
                });

                if (needsFix) {
                    loadedWidgets = loadedWidgets.map((w, index) => {
                        const newId = `view-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
                        return { ...w, id: newId };
                    });

                    await savePluginSettings({ ...settings, pageViews: loadedWidgets });
                }

                setWidgets(loadedWidgets);
            } catch (error) {
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

    const handleDeleteWidget = (widget: PageViewItem) => {
        Modal.confirm({
            title: 'Delete View',
            content: `Are you sure you want to delete "${widget.title}"?`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => {
                const newWidgets = widgets.filter(w => w.id !== widget.id);
                persist(newWidgets).then(() => {
                    message.success('View deleted');
                });
            }
        });
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
        }).catch(() => {
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
        const separator = url.includes('?') ? '&' : '?';
        const urlWithViewId = `${url}${separator}viewId=${widget.id}`;

        switch (widget.page) {
            case 'logs':
                return `/a/antreklabs-iyzitrace-app/logs${urlWithViewId}`;
            case 'traces':
                return `/a/antreklabs-iyzitrace-app/traces${urlWithViewId}`;
            case 'services':
                return `/a/antreklabs-iyzitrace-app/services${urlWithViewId}`;
            case 'service-map':
                return `/a/antreklabs-iyzitrace-app/service-map${urlWithViewId}`;
            case 'alerts':
                return `/a/antreklabs-iyzitrace-app/alerts${urlWithViewId}`;
            case 'exceptions':
                return `/a/antreklabs-iyzitrace-app/exceptions${urlWithViewId}`;
            default:
                return `/a/antreklabs-iyzitrace-app/${widget.page || ''}${urlWithViewId}`;
        }
    };

    const ViewPreview: React.FC<{ widget: PageViewItem }> = React.memo(({ widget }) => {
        const [isInitialLoad, setIsInitialLoad] = useState(true);
        const [highlights, setHighlights] = useState<Array<{ label: string; value: string }>>([]);
        const [previewError, setPreviewError] = useState<string | null>(null);
        const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
        const [isLive, setIsLive] = useState(true);

        const metadata = useMemo(() => {
            const meta: Record<string, { title: string; accent: string; footer: string }> = {
                'service-map': {
                    title: 'Topology Snapshot',
                    accent: '#7c3aed',
                    footer: 'Metrics refreshed in real-time'
                },
                'services': {
                    title: 'Top Services',
                    accent: '#10b981',
                    footer: 'Metrics refreshed in real-time'
                },
                'traces': {
                    title: 'Trace Metrics',
                    accent: '#f59e0b',
                    footer: 'Metrics refreshed in real-time'
                },
                'logs': {
                    title: 'Log Statistics',
                    accent: '#8b5cf6',
                    footer: 'Metrics refreshed in real-time'
                },
                'exceptions': {
                    title: 'Exception Summary',
                    accent: '#ef4444',
                    footer: 'Metrics refreshed in real-time'
                },
                'overview': {
                    title: 'Overview Dashboard',
                    accent: '#06b6d4',
                    footer: 'Metrics refreshed in real-time'
                },
                'alerts': {
                    title: 'Alert Summary',
                    accent: '#f97316',
                    footer: 'Metrics refreshed in real-time'
                }
            };

            return meta[widget.page] || {
                title: 'Stored Filters',
                accent: '#3b82f6',
                footer: 'Click View for the full experience'
            };
        }, [widget.page]);

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
            let intervalId: NodeJS.Timeout;

            const loadPreview = async () => {
                if (!isMounted) return;

                setPreviewError(null);
                try {
                    const filterModel = buildFilterModel(widget.query || '');

                    let newHighlights: Array<{ label: string; value: string }> = [];
                    switch (widget.page) {
                        case 'service-map': {
                            const data = await getRegions(filterModel);
                            const regions = data ?? [];
                            const infrastructures = regions.flatMap((region: any) => region.infrastructures || []);
                            const applications = infrastructures.flatMap((infra: any) => infra.applications || []);
                            const serviceCount = infrastructures.flatMap((infra: any) => infra.services || []).length;

                            newHighlights = [
                                { label: 'Regions', value: regions.length.toString() },
                                { label: 'Infrastructures', value: infrastructures.length.toString() },
                                { label: 'Applications', value: applications.length.toString() },
                                { label: 'Services', value: serviceCount.toString() }
                            ];
                            break;
                        }
                        case 'services': {
                            const servicesData = await getServicesTableData(filterModel);
                            const sortedServices = servicesData
                                .filter(s => s.metrics?.avgDurationMs)
                                .sort((a, b) => (b.metrics?.avgDurationMs ?? 0) - (a.metrics?.avgDurationMs ?? 0))
                                .slice(0, 3);

                            newHighlights = sortedServices.length
                                ? sortedServices.map(service => ({
                                    label: service.name,
                                    value: formatDuration(service.metrics?.avgDurationMs ?? 0)
                                }))
                                : [{ label: 'No data', value: '-' }];
                            break;
                        }
                        case 'traces': {
                            const tracesData = await getTracesTableData(filterModel);

                            if (tracesData.length > 0) {
                                const durations = tracesData.map(t => t.durationMs || 0).filter(d => d > 0);
                                const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
                                const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
                                const totalSpans = tracesData.reduce((sum, t) => sum + (t.spanCount || 0), 0);

                                newHighlights = [
                                    { label: 'Total Traces', value: tracesData.length.toString() },
                                    { label: 'Avg Latency', value: formatDuration(avgDuration) },
                                    { label: 'Max Latency', value: formatDuration(maxDuration) },
                                    { label: 'Total Spans', value: totalSpans.toString() }
                                ].slice(0, 4);
                            } else {
                                newHighlights = [{ label: 'No data', value: '-' }];
                            }
                            break;
                        }
                        case 'logs': {
                            const logsData = await getLogsTableData(filterModel);

                            if (logsData.length > 0) {
                                const levels = logsData.reduce((acc: any, log: any) => {
                                    const level = log.level || 'unknown';
                                    acc[level] = (acc[level] || 0) + 1;
                                    return acc;
                                }, {});

                                const sortedLevels = Object.entries(levels)
                                    .sort(([, a]: any, [, b]: any) => b - a)
                                    .slice(0, 3);

                                newHighlights = [
                                    { label: 'Total Logs', value: logsData.length.toString() },
                                    ...sortedLevels.map(([level, count]: any) => ({
                                        label: level,
                                        value: count.toString()
                                    }))
                                ].slice(0, 4);
                            } else {
                                newHighlights = [{ label: 'No data', value: '-' }];
                            }
                            break;
                        }
                        case 'exceptions': {
                            const exceptionsData = await getExceptions(filterModel);

                            if (exceptionsData.length > 0) {
                                const totalExceptions = exceptionsData.reduce((sum, ex) => sum + (ex.count || 0), 0);
                                const topExceptions = exceptionsData
                                    .sort((a, b) => (b.count || 0) - (a.count || 0))
                                    .slice(0, 3);

                                newHighlights = [
                                    { label: 'Total Count', value: totalExceptions.toString() },
                                    ...topExceptions.map(ex => ({
                                        label: ex.exceptionType || 'Unknown',
                                        value: (ex.count || 0).toString()
                                    }))
                                ].slice(0, 4);
                            } else {
                                newHighlights = [{ label: 'No data', value: '-' }];
                            }
                            break;
                        }
                        case 'overview': {
                            const [regionsData, servicesData, tracesData] = await Promise.all([
                                getRegions(filterModel),
                                getServicesTableData(filterModel),
                                getTracesTableData(filterModel)
                            ]);

                            const regions = regionsData ?? [];
                            const infrastructures = regions.flatMap((r: any) => r.infrastructures || []);
                            const healthyServices = servicesData.filter(s => s.status?.value === 'healthy').length;
                            const totalTraces = tracesData.length;

                            newHighlights = [
                                { label: 'Regions', value: regions.length.toString() },
                                { label: 'Infrastructures', value: infrastructures.length.toString() },
                                { label: 'Healthy Services', value: `${healthyServices}/${servicesData.length}` },
                                { label: 'Traces', value: totalTraces.toString() }
                            ];
                            break;
                        }
                        case 'alerts': {
                            try {
                                const alertsData = await getFailedChecks();
                                const activeAlerts = Array.isArray(alertsData) ? alertsData : [];
                                const criticalAlerts = activeAlerts.filter((a: any) => a.labels?.severity === 'critical').length;
                                const warningAlerts = activeAlerts.filter((a: any) => a.labels?.severity === 'warning').length;
                                const totalAlerts = activeAlerts.length;

                                newHighlights = [
                                    { label: 'Total Alerts', value: totalAlerts.toString() },
                                    { label: 'Critical', value: criticalAlerts.toString() },
                                    { label: 'Warning', value: warningAlerts.toString() },
                                    { label: 'Other', value: (totalAlerts - criticalAlerts - warningAlerts).toString() }
                                ].slice(0, 4);
                            } catch (error) {
                                newHighlights = [{ label: 'Status', value: 'Unable to fetch alerts' }];
                            }
                            break;
                        }
                        default: {
                            newHighlights = [{ label: 'Target Page', value: widget.page }];
                        }
                    }

                    if (isMounted) {
                        setHighlights(newHighlights);
                        setLastUpdate(new Date());
                    }
                } catch (error) {
                    if (isMounted) {
                        setPreviewError('Preview unavailable');
                    }
                } finally {
                    if (isMounted) {
                        setIsInitialLoad(false);
                    }
                }
            };

            loadPreview();

            if (isLive) {
                intervalId = setInterval(() => {
                    if (isMounted) {
                        loadPreview();
                    }
                }, 5000);
            }

            return () => {
                isMounted = false;
                if (intervalId) {
                    clearInterval(intervalId);
                }
            };
        }, [widget.page, widget.query, widget.id, isLive]);

        return (
            <div
                className="view-preview-wrapper"
            >
                {isInitialLoad ? (
                    <Skeleton active title={false} paragraph={{ rows: 3 }} />
                ) : previewError ? (
                    <div className="view-preview-error">
                        {previewError}
                    </div>
                ) : (
                    <>
                        <div className="view-preview-header">
                            <Text className="view-preview-title" style={{ color: metadata.accent }}>
                                {metadata.title}
                            </Text>
                            <Space size={8}>
                                <Text type="secondary" className="view-text-xs">
                                    {lastUpdate.toLocaleTimeString()}
                                </Text>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={isLive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                    onClick={() => setIsLive(!isLive)}
                                    className={`view-live-button ${isLive ? 'active' : 'inactive'}`}
                                >
                                    {isLive ? 'Live' : 'Paused'}
                                </Button>
                                {!isLive && (
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<StopOutlined />}
                                        onClick={() => setIsLive(true)}
                                        className="view-stop-button"
                                    />
                                )}
                            </Space>
                        </div>
                        <div className="view-preview-grid">
                            {highlights.slice(0, 4).map((item, index) => (
                                <div
                                    key={`${item.label}-${index}`}
                                    className="view-preview-item"
                                >
                                    <Text className="view-preview-label">
                                        {item.label}
                                    </Text>
                                    <div className="view-preview-value">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Text type="secondary" className="view-preview-footer">
                            {metadata.footer}
                        </Text>
                    </>
                )}
            </div>
        );
    });

    const renderWidget = (widget: PageViewItem) => {
        const iframeUrl = buildWidgetUrl(widget);
        return (
            <Card
                key={widget.id}
                title={widget.title}
                size="small"
                className="view-widget-card"
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
                            onClick={() => handleDeleteWidget(widget)}
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
        <div>
            {widgets.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <div>
                            <Text className="views-description">No views added yet.</Text>
                            <p className="views-empty-description">
                                Use "Save as View" from other pages to create views.
                            </p>
                        </div>
                    }
                />
            ) : (
                <div className="views-grid">
                    {widgets.map(renderWidget)}
                </div>
            )}

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
                                <Row key={p.id} gutter={8} className="view-mt-6">
                                    <Col span={10}>
                                        <Input
                                            placeholder="key"
                                            value={p.key}
                                            readOnly={p.lockedKey}
                                            className="view-input-white"
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
                            <Button className="view-mt-8" onClick={addParamRow}>Add param</Button>
                            <Input.TextArea className="view-mt-8" rows={3} readOnly placeholder="Preview (auto-generated)" value={previewQuery} />
                        </>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ViewsPanel;
