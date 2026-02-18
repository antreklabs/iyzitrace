import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    RocketOutlined,
    DesktopOutlined,
    ArrowRightOutlined,
    ArrowLeftOutlined,
    AppstoreOutlined,
    DatabaseOutlined,
    LoadingOutlined,
    KeyOutlined,
    LinkOutlined,
    SafetyOutlined,
    UnlockOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { useWizardContext } from './wizard-layout.component';
import '../../assets/styles/pages/wizard/wizard.css';

const PLUGIN_ID = 'iyzitrace-app';

// Datasource URL paths - appended to the platform base URL
// Must match nginx location directives (trailing slash required)
const DATASOURCE_PATHS = {
    prometheus: '/query/v1/metrics/',
    loki: '/query/v1/logs/',
    tempo: '/query/v1/traces/',
};

// Convert browser-facing URL to Docker-internal URL for Grafana datasource proxy
// Grafana runs inside Docker, so 'localhost' or '127.0.0.1' from the browser
// won't work — those resolve to Grafana's own container, not the host machine.
// We convert them to 'host.docker.internal' which Docker routes to the host.
const toDatasourceUrl = (browserUrl: string): string => {
    return browserUrl
        .replace(/localhost(:\d+)?/i, 'host.docker.internal')
        .replace(/127\.0\.0\.1(:\d+)?/i, 'host.docker.internal');
};

// Build datasource configurations dynamically based on platform URL and auth settings
const getDatasourceConfigs = (baseUrl: string, auth: 'open' | 'apikey', apiKey: string) => {
    const normalizedUrl = toDatasourceUrl(baseUrl.replace(/\/$/, ''));
    const hasApiKey = auth === 'apikey' && apiKey.trim();

    // Auth headers for Grafana datasource API (httpHeaderName1 + secureJsonData pattern)
    const authJsonData = hasApiKey ? { httpHeaderName1: 'Authorization' } : {};
    const authSecureJsonFields = hasApiKey
        ? { secureJsonData: { httpHeaderValue1: `Bearer ${apiKey.trim()}` } }
        : {};

    return {
        prometheus: {
            name: 'Prometheus (Observability Platform)',
            type: 'prometheus',
            uid: 'prometheus-platform',
            access: 'proxy',
            orgId: 1,
            url: `${normalizedUrl}${DATASOURCE_PATHS.prometheus}`,
            basicAuth: false,
            isDefault: false,
            version: 1,
            editable: true,
            jsonData: {
                httpMethod: 'GET',
                ...authJsonData,
                promRegistryOverrides: {
                    metrics: {
                        traces_spanmetrics_calls_total: 'iyzitrace_span_metrics_calls_total',
                        traces_spanmetrics_latency_sum: 'iyzitrace_span_metrics_duration_milliseconds_sum',
                        traces_spanmetrics_latency_count: 'iyzitrace_span_metrics_duration_milliseconds_count',
                        traces_spanmetrics_latency_bucket: 'iyzitrace_span_metrics_duration_milliseconds_bucket',
                    },
                },
            },
            ...authSecureJsonFields,
        },
        loki: {
            name: 'Loki (Observability Platform)',
            type: 'loki',
            uid: 'loki-platform',
            access: 'proxy',
            orgId: 1,
            url: `${normalizedUrl}${DATASOURCE_PATHS.loki}`,
            isDefault: false,
            editable: true,
            ...(hasApiKey ? { jsonData: { ...authJsonData } } : {}),
            ...authSecureJsonFields,
        },
        tempo: {
            name: 'Tempo (Observability Platform)',
            type: 'tempo',
            uid: 'tempo-platform',
            access: 'proxy',
            orgId: 1,
            url: `${normalizedUrl}${DATASOURCE_PATHS.tempo}`,
            basicAuth: false,
            isDefault: false,
            version: 1,
            editable: true,
            jsonData: {
                httpMethod: 'GET',
                ...authJsonData,
                serviceMap: {
                    datasourceUid: 'prometheus-platform',
                },
            },
            ...authSecureJsonFields,
        },
    };
};

interface StepStatus {
    checking: boolean;
    success: boolean | null;
    error: string | null;
}

interface DatasourceStatus {
    prometheus: StepStatus;
    loki: StepStatus;
    tempo: StepStatus;
}

interface PlatformComponentStatus {
    name: string;
    status: string;
    latency: string;
    details: {
        version?: string;
        uptime?: string;
        Upsince?: string;
        [key: string]: any;
    };
}

interface PlatformStatusResponse {
    status: string;
    components: PlatformComponentStatus[];
    updated_at: string;
}

type WizardStep = 'platform' | 'datasources' | 'verification';

const SetupWizardPage: React.FC = () => {
    const { setWizardCompleted } = useWizardContext();
    const [currentStep, setCurrentStep] = useState<WizardStep>('platform');
    const [saving, setSaving] = useState(false);
    const [skipping, setSkipping] = useState(false);
    const [platformUrl, setPlatformUrl] = useState('http://localhost');
    const [authType, setAuthType] = useState<'open' | 'apikey'>('open');
    const [platformApiKey, setPlatformApiKey] = useState('');
    const [platformStatus, setPlatformStatus] = useState<StepStatus>({
        checking: false,
        success: null,
        error: null,
    });
    const [datasourceStatus, setDatasourceStatus] = useState<DatasourceStatus>({
        prometheus: { checking: false, success: null, error: null },
        loki: { checking: false, success: null, error: null },
        tempo: { checking: false, success: null, error: null },
    });
    const [provisioning, setProvisioning] = useState(false);
    const [initialCheckDone, setInitialCheckDone] = useState(false);

    // Step 3: Service health check states
    const [statusResponse, setStatusResponse] = useState<PlatformStatusResponse | null>(null);
    const [verificationChecking, setVerificationChecking] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);
    const [verificationStarted, setVerificationStarted] = useState(false);

    // Check datasources when entering Step 2
    useEffect(() => {
        if (currentStep === 'datasources' && !initialCheckDone) {
            checkExistingDatasources();
        }
    }, [currentStep]);


    const checkExistingDatasources = async () => {
        const types: Array<'prometheus' | 'loki' | 'tempo'> = ['prometheus', 'loki', 'tempo'];

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
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (authType === 'apikey') {
                headers['Authorization'] = `Bearer ${platformApiKey.trim()}`;
            }

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers,
                    signal: controller.signal,
                });
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

    // Check if a datasource exists
    const checkDatasourceExists = async (uid: string): Promise<boolean> => {
        try {
            await getBackendSrv().get(`/api/datasources/uid/${uid}`);
            return true;
        } catch {
            return false;
        }
    };

    // Create datasource
    const createDatasource = async (type: 'prometheus' | 'loki' | 'tempo'): Promise<void> => {
        const configs = getDatasourceConfigs(platformUrl, authType, platformApiKey);
        console.log(`[Wizard] Creating ${type} datasource:`, JSON.stringify(configs[type], null, 2));
        console.log(`[Wizard] authType=${authType}, hasApiKey=${!!platformApiKey.trim()}`);
        await getBackendSrv().post('/api/datasources', configs[type]);
        // Small delay to ensure Grafana processes the datasource
        await new Promise(resolve => setTimeout(resolve, 500));
    };

    // Check and provision all datasources
    const checkAndProvisionDatasources = async () => {
        setProvisioning(true);

        // Order matters: Prometheus first (Tempo references it), then Loki, then Tempo
        const types: Array<'prometheus' | 'loki' | 'tempo'> = ['prometheus', 'loki', 'tempo'];

        for (const type of types) {
            setDatasourceStatus(prev => ({
                ...prev,
                [type]: { checking: true, success: null, error: null },
            }));

            try {
                const configs = getDatasourceConfigs(platformUrl, authType, platformApiKey);
                const exists = await checkDatasourceExists(configs[type].uid);

                if (!exists) {
                    // Create the datasource
                    await createDatasource(type);
                }

                // If we got here, datasource exists or was created
                setDatasourceStatus(prev => ({
                    ...prev,
                    [type]: {
                        checking: false,
                        success: true,
                        error: null
                    },
                }));
            } catch (err: any) {
                setDatasourceStatus(prev => ({
                    ...prev,
                    [type]: {
                        checking: false,
                        success: false,
                        error: err.message || `Failed to configure ${type}`
                    },
                }));
            }
        }

        setProvisioning(false);
    };

    const handleContinueToStep2 = async () => {
        // Save platform URL and auth settings to plugin jsonData for later steps
        try {
            const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
            const currentJsonData = settings?.jsonData || {};

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
        }
        setCurrentStep('datasources');
    };

    const handleContinueToVerification = () => {
        setCurrentStep('verification');
    };

    const handleBackToStep1 = () => {
        setCurrentStep('platform');
    };

    const handleBackToStep2 = () => {
        setCurrentStep('datasources');
    };

    // Step 3: Run health checks via platform status API
    const runServiceHealthChecks = async () => {
        setVerificationStarted(true);
        setVerificationChecking(true);
        setVerificationError(null);
        setStatusResponse(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const url = `${platformUrl.replace(/\/$/, '')}/api/v1/platform/system/status`;
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (authType === 'apikey') {
                headers['Authorization'] = `Bearer ${platformApiKey.trim()}`;
            }

            const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                setVerificationError(`Platform returned status ${response.status}.`);
                setVerificationChecking(false);
                return;
            }

            const data: PlatformStatusResponse = await response.json();
            setStatusResponse(data);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setVerificationError('Connection timed out. Platform may not be running.');
            } else {
                setVerificationError('Could not connect to platform. Please verify the URL and ensure the platform is running.');
            }
        } finally {
            setVerificationChecking(false);
        }
    };

    const handleExplorePages = async () => {
        setSaving(true);
        try {
            const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
            const currentJsonData = settings?.jsonData || {};

            await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
                jsonData: {
                    ...currentJsonData,
                    wizardState: {
                        completed: true,
                        completedAt: new Date().toISOString(),
                    },
                },
                enabled: true,
            });

            setWizardCompleted(true);
            window.location.href = '/a/iyzitrace-app/landing';
        } catch (err) {
            console.error('Failed to save wizard state:', err);
            window.location.href = '/a/iyzitrace-app/landing';
        } finally {
            setSaving(false);
        }
    };

    const handleSkipWizard = async () => {
        setSkipping(true);
        try {
            const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
            const currentJsonData = settings?.jsonData || {};

            await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
                jsonData: {
                    ...currentJsonData,
                    wizardState: {
                        completed: true,
                        skipped: true,
                        completedAt: new Date().toISOString(),
                    },
                },
                enabled: true,
            });

            setWizardCompleted(true);
            window.location.href = '/a/iyzitrace-app/landing';
        } catch (err) {
            console.error('Failed to save wizard state:', err);
            window.location.href = '/a/iyzitrace-app/landing';
        } finally {
            setSkipping(false);
        }
    };

    const allDatasourcesReady =
        datasourceStatus.prometheus.success === true &&
        datasourceStatus.loki.success === true &&
        datasourceStatus.tempo.success === true;

    // Step 3: Verification - Service Health Checks
    const allServicesHealthy = statusResponse?.status === 'healthy' &&
        statusResponse.components.every(c => c.status === 'online');
    const someServicesDown = statusResponse !== null &&
        statusResponse.components.some(c => c.status !== 'online');

    if (currentStep === 'verification') {
        return (
            <div className="wizard-container">
                <div className="wizard-content">
                    <div className="wizard-header">
                        <RocketOutlined className="wizard-header-icon" />
                        <h1 className="wizard-title">IyziTrace Setup Wizard</h1>
                        <p className="wizard-subtitle">
                            Set up and run your observability platform in a few steps
                        </p>
                        <Button variant="secondary" size="sm" onClick={handleSkipWizard} disabled={skipping} className="wizard-skip-button">
                            {skipping ? <><Spinner inline size="sm" /> Skipping...</> : 'Skip Setup'}
                        </Button>
                    </div>

                    <div className="wizard-progress">
                        <div className="wizard-progress-step completed">
                            <div className="wizard-step-number"><CheckCircleOutlined /></div>
                            <span>Platform Setup</span>
                        </div>
                        <div className="wizard-progress-line completed" />
                        <div className="wizard-progress-step completed">
                            <div className="wizard-step-number"><CheckCircleOutlined /></div>
                            <span>Data Sources</span>
                        </div>
                        <div className="wizard-progress-line completed" />
                        <div className="wizard-progress-step active">
                            <div className="wizard-step-number">3</div>
                            <span>Verification</span>
                        </div>
                    </div>

                    <div className="wizard-step-card">
                        <div className="wizard-step-header">
                            <CheckCircleOutlined className="wizard-step-icon" />
                            <div>
                                <h2 className="wizard-step-title">Step 3: Service Verification</h2>
                                <p className="wizard-step-description">
                                    Verify all platform services are running correctly
                                </p>
                            </div>
                        </div>

                        <div className="wizard-step-content">
                            <p style={{ marginBottom: 24, color: '#94a3b8' }}>
                                Click the button below to check the health status of all platform services.
                            </p>

                            <div style={{ marginBottom: 24 }}>
                                <Button
                                    variant="primary"
                                    onClick={runServiceHealthChecks}
                                    disabled={verificationChecking}
                                >
                                    {verificationChecking ? (
                                        <><Spinner inline size="sm" /> Checking...</>
                                    ) : verificationStarted ? (
                                        'Re-run Health Check'
                                    ) : (
                                        'Run Health Check'
                                    )}
                                </Button>
                            </div>

                            {verificationChecking && (
                                <div className="wizard-verification-loading">
                                    <LoadingOutlined style={{ fontSize: 24, color: '#3b82f6' }} />
                                    <span style={{ color: '#94a3b8', marginLeft: 12 }}>Fetching platform status...</span>
                                </div>
                            )}

                            {verificationError && (
                                <Alert title="Connection Error" severity="error" style={{ marginTop: 16 }}>
                                    {verificationError}
                                </Alert>
                            )}

                            {statusResponse && (
                                <>
                                    {/* Overall status badge */}
                                    <div className="wizard-platform-status-badge" data-status={statusResponse.status}>
                                        {statusResponse.status === 'healthy' ? (
                                            <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 18 }} />
                                        ) : (
                                            <CloseCircleOutlined style={{ color: '#ef4444', fontSize: 18 }} />
                                        )}
                                        <span>Platform Status: <strong>{statusResponse.status.toUpperCase()}</strong></span>
                                        <span className="wizard-status-updated">Updated: {new Date(statusResponse.updated_at).toLocaleTimeString()}</span>
                                    </div>

                                    {/* Component list */}
                                    <div className="wizard-service-grid">
                                        {statusResponse.components.map((component) => (
                                            <div key={component.name} className={`wizard-service-card ${component.status === 'online' ? 'online' : 'offline'}`}>
                                                <div className="wizard-service-card-header">
                                                    <div className="wizard-service-card-name">
                                                        {component.status === 'online' ? (
                                                            <CheckCircleOutlined style={{ color: '#22c55e' }} />
                                                        ) : (
                                                            <CloseCircleOutlined style={{ color: '#ef4444' }} />
                                                        )}
                                                        <strong>{component.name}</strong>
                                                    </div>
                                                    <span className={`wizard-service-latency ${component.status === 'online' ? 'good' : 'bad'}`}>
                                                        {component.latency}
                                                    </span>
                                                </div>
                                                <div className="wizard-service-card-details">
                                                    {component.details.version && (
                                                        <span>{component.details.version.startsWith('v') ? component.details.version : `v${component.details.version}`}</span>
                                                    )}
                                                    {component.details.uptime && (
                                                        <span>Uptime: {component.details.uptime}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {someServicesDown && (
                                <Alert title="Some services are not responding" severity="warning" style={{ marginTop: 16 }}>
                                    Please ensure all services are running and try again.
                                </Alert>
                            )}

                            {allServicesHealthy && (
                                <Alert title="All Services Healthy!" severity="success" style={{ marginTop: 16 }}>
                                    All {statusResponse!.components.length} services are running correctly. You're ready to explore the platform!
                                </Alert>
                            )}
                        </div>

                        <div className="wizard-step-actions">
                            <Button
                                variant="secondary"
                                onClick={handleBackToStep2}
                            >
                                <ArrowLeftOutlined /> Back
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleExplorePages}
                                disabled={!allServicesHealthy || saving}
                            >
                                {saving ? (
                                    <>
                                        <Spinner inline size="sm" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <AppstoreOutlined style={{ marginRight: 8 }} />
                                        Explore Dashboards
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Data Sources
    if (currentStep === 'datasources') {
        return (
            <div className="wizard-container">
                <div className="wizard-content">
                    <div className="wizard-header">
                        <RocketOutlined className="wizard-header-icon" />
                        <h1 className="wizard-title">IyziTrace Setup Wizard</h1>
                        <p className="wizard-subtitle">
                            Set up and run your observability platform in a few steps
                        </p>
                        <Button variant="secondary" size="sm" onClick={handleSkipWizard} disabled={skipping} className="wizard-skip-button">
                            {skipping ? <><Spinner inline size="sm" /> Skipping...</> : 'Skip Setup'}
                        </Button>
                    </div>

                    {/* Progress */}
                    <div className="wizard-progress">
                        <div className="wizard-progress-step completed">
                            <div className="wizard-step-number"><CheckCircleOutlined /></div>
                            <span>Platform Setup</span>
                        </div>
                        <div className="wizard-progress-line completed" />
                        <div className="wizard-progress-step active">
                            <div className="wizard-step-number">2</div>
                            <span>Data Sources</span>
                        </div>
                        <div className="wizard-progress-line" />
                        <div className="wizard-progress-step">
                            <div className="wizard-step-number">3</div>
                            <span>Verification</span>
                        </div>
                    </div>

                    <div className="wizard-step-card">
                        <div className="wizard-step-header">
                            <DatabaseOutlined className="wizard-step-icon" />
                            <div>
                                <h2 className="wizard-step-title">Step 2: Configure Data Sources</h2>
                                <p className="wizard-step-description">
                                    Connect Grafana to your observability backends
                                </p>
                            </div>
                        </div>

                        <div className="wizard-step-content">
                            <p style={{ marginBottom: 24, color: '#94a3b8' }}>
                                Click the button below to automatically configure Prometheus, Loki, and Tempo
                                data sources in Grafana.
                            </p>

                            <div className="wizard-datasource-list">
                                {(['prometheus', 'loki', 'tempo'] as const).map((type) => {
                                    const status = datasourceStatus[type];
                                    const configs = getDatasourceConfigs(platformUrl, authType, platformApiKey);
                                    const config = configs[type];
                                    return (
                                        <div key={type} className="wizard-datasource-item">
                                            <div className="wizard-datasource-info">
                                                <strong>{config.name}</strong>
                                                <span style={{ color: '#64748b', fontSize: 13 }}>{config.url}</span>
                                            </div>
                                            <div className="wizard-datasource-status">
                                                {status.checking && <LoadingOutlined style={{ color: '#3b82f6' }} />}
                                                {status.success === true && <CheckCircleOutlined style={{ color: '#22c55e' }} />}
                                                {status.success === false && <CloseCircleOutlined style={{ color: '#ef4444' }} />}
                                                {status.success === null && !status.checking && <span style={{ color: '#64748b' }}>—</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: 24 }}>
                                <Button
                                    variant="primary"
                                    onClick={checkAndProvisionDatasources}
                                    disabled={provisioning || allDatasourcesReady}
                                >
                                    {provisioning ? (
                                        <>
                                            <Spinner inline size="sm" /> Configuring...
                                        </>
                                    ) : (
                                        'Configure Data Sources'
                                    )}
                                </Button>
                            </div>

                            {Object.values(datasourceStatus).some(s => s.success === false) && (
                                <Alert
                                    title="Some data sources could not be configured"
                                    severity="warning"
                                    style={{ marginTop: 16 }}
                                >
                                    Make sure the observability platform is running and accessible before click on Configure Data Sources button.
                                </Alert>
                            )}
                        </div>

                        <div className="wizard-step-actions">
                            <Button
                                variant="secondary"
                                onClick={handleBackToStep1}
                            >
                                <ArrowLeftOutlined /> Back
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleContinueToVerification}
                                disabled={!allDatasourcesReady}
                            >
                                Continue <ArrowRightOutlined />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 1: Platform Connection
    return (
        <div className="wizard-container">
            <div className="wizard-content">
                <div className="wizard-header">
                    <RocketOutlined className="wizard-header-icon" />
                    <h1 className="wizard-title">IyziTrace Setup Wizard</h1>
                    <p className="wizard-subtitle">
                        Set up and run your observability platform in a few steps
                    </p>
                    <Button variant="secondary" size="sm" onClick={handleSkipWizard} disabled={skipping} className="wizard-skip-button">
                        {skipping ? <><Spinner inline size="sm" /> Skipping...</> : 'Skip Setup'}
                    </Button>
                </div>

                {/* Progress */}
                <div className="wizard-progress">
                    <div className="wizard-progress-step active">
                        <div className="wizard-step-number">1</div>
                        <span>Platform Setup</span>
                    </div>
                    <div className="wizard-progress-line" />
                    <div className="wizard-progress-step">
                        <div className="wizard-step-number">2</div>
                        <span>Data Sources</span>
                    </div>
                    <div className="wizard-progress-line" />
                    <div className="wizard-progress-step">
                        <div className="wizard-step-number">3</div>
                        <span>Verification</span>
                    </div>
                </div>

                <div className="wizard-step-card">
                    <div className="wizard-step-header">
                        <LinkOutlined className="wizard-step-icon" />
                        <div>
                            <h2 className="wizard-step-title">Step 1: Platform Connection</h2>
                            <p className="wizard-step-description">
                                Connect to your IyziTrace Observability Platform
                            </p>
                        </div>
                    </div>

                    <div className="wizard-step-content">
                        {/* Platform URL */}
                        <div className="wizard-form-group">
                            <label className="wizard-form-label">
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
                                className="wizard-input"
                            />
                            <span className="wizard-form-hint">
                                Enter the base URL of your running IyziTrace Observability Platform
                            </span>
                        </div>

                        {/* Authentication Type */}
                        <div className="wizard-form-group">
                            <label className="wizard-form-label">
                                <SafetyOutlined /> Authentication Type
                            </label>
                            <div className="wizard-auth-toggle">
                                <button
                                    type="button"
                                    className={`wizard-auth-toggle-option ${authType === 'open' ? 'active' : ''}`}
                                    onClick={() => {
                                        setAuthType('open');
                                        setPlatformStatus({ checking: false, success: null, error: null });
                                    }}
                                >
                                    <UnlockOutlined />
                                    <div className="wizard-auth-toggle-text">
                                        <strong>Open Access</strong>
                                        <span>No API Key required</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    className={`wizard-auth-toggle-option ${authType === 'apikey' ? 'active' : ''}`}
                                    onClick={() => {
                                        setAuthType('apikey');
                                        setPlatformStatus({ checking: false, success: null, error: null });
                                    }}
                                >
                                    <LockOutlined />
                                    <div className="wizard-auth-toggle-text">
                                        <strong>API Key Protected</strong>
                                        <span>Requires API Key for access</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* API Key Input (conditional) */}
                        {authType === 'apikey' && (
                            <div className="wizard-form-group wizard-form-group-animated">
                                <label className="wizard-form-label">
                                    <KeyOutlined /> API Key
                                </label>
                                <input
                                    type="password"
                                    value={platformApiKey}
                                    onChange={(e) => {
                                        setPlatformApiKey(e.target.value);
                                        setPlatformStatus({ checking: false, success: null, error: null });
                                    }}
                                    placeholder="Enter your platform API key"
                                    className="wizard-input"
                                />
                            </div>
                        )}

                        {/* Verify Section */}
                        <div className="wizard-check-section">
                            <h3 className="wizard-section-title">Connection Verification</h3>
                            <p>Verify that the platform is running and accessible:</p>

                            <div className="wizard-check-actions">
                                <Button
                                    variant="primary"
                                    onClick={checkPlatformHealth}
                                    disabled={platformStatus.checking || platformStatus.success === true}
                                >
                                    {platformStatus.checking ? (
                                        <>
                                            <Spinner inline size="sm" /> Verifying...
                                        </>
                                    ) : platformStatus.success === true ? (
                                        <>
                                            <CheckCircleOutlined /> Verified
                                        </>
                                    ) : (
                                        'Verify Connection'
                                    )}
                                </Button>

                                {platformStatus.success === true && (
                                    <div className="wizard-check-result success">
                                        <CheckCircleOutlined />
                                        <span>Platform is connected successfully!</span>
                                    </div>
                                )}

                                {platformStatus.success === false && (
                                    <div className="wizard-check-result error">
                                        <CloseCircleOutlined />
                                        <span>{platformStatus.error}</span>
                                    </div>
                                )}
                            </div>

                            {platformStatus.success === false && (
                                <Alert
                                    title="Connection failed"
                                    severity="warning"
                                    className="wizard-alert"
                                >
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

                    <div className="wizard-step-actions">
                        <Button
                            variant="primary"
                            onClick={handleContinueToStep2}
                            disabled={platformStatus.success !== true}
                        >
                            Continue <ArrowRightOutlined />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupWizardPage;
