import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner, Icon } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    CopyOutlined,
    RocketOutlined,
    DesktopOutlined,
    CodeOutlined,
    ArrowRightOutlined,
    AppstoreOutlined,
    DatabaseOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { useWizardContext } from './wizard-layout.component';
import '../../assets/styles/pages/wizard/wizard.css';

const PLUGIN_ID = 'iyzitrace-app';

// Datasource configurations - must match provisioning/datasources/*.yml
const DATASOURCE_CONFIGS = {
    prometheus: {
        name: 'Prometheus (Observability Platform)',
        type: 'prometheus',
        uid: 'prometheus-platform',
        access: 'proxy',
        orgId: 1,
        url: 'http://host.docker.internal/query/v1/metrics',
        basicAuth: false,
        isDefault: false,
        version: 1,
        editable: true,
        jsonData: {
            httpMethod: 'GET',
            promRegistryOverrides: {
                metrics: {
                    traces_spanmetrics_calls_total: 'iyzitrace_span_metrics_calls_total',
                    traces_spanmetrics_latency_sum: 'iyzitrace_span_metrics_duration_milliseconds_sum',
                    traces_spanmetrics_latency_count: 'iyzitrace_span_metrics_duration_milliseconds_count',
                    traces_spanmetrics_latency_bucket: 'iyzitrace_span_metrics_duration_milliseconds_bucket',
                },
            },
        },
    },
    loki: {
        name: 'Loki (Observability Platform)',
        type: 'loki',
        uid: 'loki-platform',
        access: 'proxy',
        orgId: 1,
        url: 'http://host.docker.internal/query/v1/logs',
        isDefault: false,
        editable: true,
    },
    tempo: {
        name: 'Tempo (Observability Platform)',
        type: 'tempo',
        uid: 'tempo-platform',
        access: 'proxy',
        orgId: 1,
        url: 'http://host.docker.internal/query/v1/traces',
        basicAuth: false,
        isDefault: false,
        version: 1,
        editable: true,
        jsonData: {
            httpMethod: 'GET',
            serviceMap: {
                datasourceUid: 'prometheus-platform',
            },
        },
    },
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

type WizardStep = 'platform' | 'datasources' | 'apikey' | 'verification';

const SetupWizardPage: React.FC = () => {
    const { setWizardCompleted } = useWizardContext();
    const [currentStep, setCurrentStep] = useState<WizardStep>('platform');
    const [copied, setCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [skipping, setSkipping] = useState(false);
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
    const [apiKey, setApiKey] = useState('');
    const [apiKeySaved, setApiKeySaved] = useState(false);
    const [savingApiKey, setSavingApiKey] = useState(false);
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);

    // Step 4: Service health check states
    const [serviceHealth, setServiceHealth] = useState<{
        prometheus: StepStatus;
        loki: StepStatus;
        tempo: StepStatus;
    }>({
        prometheus: { checking: false, success: null, error: null },
        loki: { checking: false, success: null, error: null },
        tempo: { checking: false, success: null, error: null },
    });
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
                const config = DATASOURCE_CONFIGS[type];
                const exists = await checkDatasourceExists(config.uid);
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

    const dockerCommand = `docker compose -f /path/to/iyzitrace-observability-platform/docker-compose.yml up --force-recreate --detach`;

    const handleCopyCommand = async () => {
        try {
            await navigator.clipboard.writeText(dockerCommand);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const checkPlatformHealth = async () => {
        setPlatformStatus({ checking: true, success: null, error: null });

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                await fetch('http://localhost:8082/health', {
                    mode: 'no-cors',
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                setPlatformStatus({ checking: false, success: true, error: null });
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
                        error: 'Could not connect to platform. Make sure Docker Desktop is running.',
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
        const config = DATASOURCE_CONFIGS[type];
        await getBackendSrv().post('/api/datasources', config);
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
                const config = DATASOURCE_CONFIGS[type];
                const exists = await checkDatasourceExists(config.uid);

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

    const handleContinueToStep2 = () => {
        setCurrentStep('datasources');
    };

    const handleContinueToStep3 = () => {
        setCurrentStep('apikey');
    };

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            setApiKeyError('Please enter an API key');
            return;
        }

        setSavingApiKey(true);
        setApiKeyError(null);

        try {
            const settings = await getBackendSrv().get(`/api/plugins/${PLUGIN_ID}/settings`);
            const currentJsonData = settings?.jsonData || {};
            const currentSecureJsonData = settings?.secureJsonData || {};

            await getBackendSrv().post(`/api/plugins/${PLUGIN_ID}/settings`, {
                jsonData: currentJsonData,
                secureJsonData: {
                    ...currentSecureJsonData,
                    apiKey: apiKey.trim(),
                },
                enabled: true,
            });

            setApiKeySaved(true);
        } catch (err: any) {
            setApiKeyError(err.message || 'Failed to save API key');
        } finally {
            setSavingApiKey(false);
        }
    };

    const handlePasteApiKey = async () => {
        try {
            const txt = await navigator.clipboard.readText();
            if (!txt) {
                setApiKeyError('Clipboard is empty or not accessible.');
                return;
            }
            setApiKey(txt.trim());
            setApiKeyError(null);
        } catch (e) {
            setApiKeyError('Paste failed. Grant clipboard permission and try again.');
        }
    };

    // Step 4: Run health checks for all services
    const runServiceHealthChecks = async () => {
        setVerificationStarted(true);

        const services = [
            { key: 'prometheus', name: 'Prometheus', endpoint: '/api/datasources/proxy/uid/prometheus-platform/api/v1/status/buildinfo' },
            { key: 'loki', name: 'Loki', endpoint: '/api/datasources/proxy/uid/loki-platform/loki/api/v1/status/buildinfo' },
            { key: 'tempo', name: 'Tempo', endpoint: '/api/datasources/proxy/uid/tempo-platform/api/status/buildinfo' },
        ] as const;

        for (const service of services) {
            setServiceHealth(prev => ({
                ...prev,
                [service.key]: { checking: true, success: null, error: null },
            }));

            try {
                // Use getBackendSrv for all services - proxies through Grafana backend
                await getBackendSrv().get(service.endpoint);

                setServiceHealth(prev => ({
                    ...prev,
                    [service.key]: { checking: false, success: true, error: null },
                }));
            } catch (err: any) {
                setServiceHealth(prev => ({
                    ...prev,
                    [service.key]: { checking: false, success: false, error: err.message || 'Failed' },
                }));
            }

            // Small delay between checks
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    };

    const handleContinueToVerification = () => {
        setCurrentStep('verification');
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

    // Step 3: API Key Configuration
    if (currentStep === 'apikey') {
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
                        <div className="wizard-progress-line completed"></div>
                        <div className="wizard-progress-step completed">
                            <div className="wizard-step-number"><CheckCircleOutlined /></div>
                            <span>Data Sources</span>
                        </div>
                        <div className="wizard-progress-line completed"></div>
                        <div className="wizard-progress-step active">
                            <div className="wizard-step-number">3</div>
                            <span>API Key</span>
                        </div>
                        <div className="wizard-progress-line" />
                        <div className="wizard-progress-step">
                            <div className="wizard-step-number">4</div>
                            <span>Verification</span>
                        </div>
                    </div>

                    <div className="wizard-step-card">
                        <div className="wizard-step-header">
                            <DatabaseOutlined className="wizard-step-icon" />
                            <div>
                                <h2 className="wizard-step-title">Step 3: Configure API Key</h2>
                                <p className="wizard-step-description">
                                    Connect Grafana to your observability platform securely
                                </p>
                            </div>
                        </div>

                        <div className="wizard-step-content">
                            <div className="wizard-prerequisites">
                                <h3 className="wizard-section-title">
                                    <DesktopOutlined /> Instructions
                                </h3>
                                <ol style={{ color: '#94a3b8', marginLeft: 16, lineHeight: 2 }}>
                                    <li>
                                        Open the{' '}
                                        <a
                                            href="http://localhost/dashboard"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#3b82f6' }}
                                        >
                                            Observability Dashboard
                                        </a>
                                        {' '}in a new tab
                                    </li>
                                    <li>Login with your credentials (or create a new account)</li>
                                    <li>Enable <strong>Global Security</strong> toggle</li>
                                    <li>Click <strong>Generate New Key</strong> button in API Keys section</li>
                                    <li>Copy the generated API key and paste it below</li>
                                </ol>
                            </div>

                            <div className="wizard-command-section" style={{ marginTop: 24 }}>
                                <h3 className="wizard-section-title">
                                    <CodeOutlined /> API Key
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => {
                                            setApiKey(e.target.value);
                                            setApiKeyError(null);
                                        }}
                                        placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(71, 85, 105, 0.5)',
                                            background: 'rgba(15, 23, 42, 0.8)',
                                            color: '#e2e8f0',
                                            fontSize: 14,
                                        }}
                                    />
                                    <Button variant="secondary" onClick={handlePasteApiKey}>
                                        Paste
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleSaveApiKey}
                                        disabled={savingApiKey || apiKeySaved}
                                    >
                                        {savingApiKey ? (
                                            <>
                                                <Spinner inline size="sm" /> Saving...
                                            </>
                                        ) : apiKeySaved ? (
                                            <>
                                                <CheckCircleOutlined /> Saved
                                            </>
                                        ) : (
                                            'Save API Key'
                                        )}
                                    </Button>
                                </div>

                                {apiKeyError && (
                                    <Alert title="Error" severity="error" style={{ marginTop: 16 }}>
                                        {apiKeyError}
                                    </Alert>
                                )}

                                {apiKeySaved && (
                                    <Alert title="Success" severity="success" style={{ marginTop: 16 }}>
                                        API key saved successfully! You can now continue to explore the platform.
                                    </Alert>
                                )}
                            </div>
                        </div>

                        <div className="wizard-step-actions">
                            <Button
                                variant="primary"
                                onClick={handleContinueToVerification}
                                disabled={!apiKeySaved}
                            >
                                Continue <ArrowRightOutlined />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 4: Verification - Service Health Checks
    const allServicesHealthy =
        serviceHealth.prometheus.success === true &&
        serviceHealth.loki.success === true &&
        serviceHealth.tempo.success === true;

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
                        <div className="wizard-progress-step completed">
                            <div className="wizard-step-number"><CheckCircleOutlined /></div>
                            <span>API Key</span>
                        </div>
                        <div className="wizard-progress-line completed" />
                        <div className="wizard-progress-step active">
                            <div className="wizard-step-number">4</div>
                            <span>Verification</span>
                        </div>
                    </div>

                    <div className="wizard-step-card">
                        <div className="wizard-step-header">
                            <CheckCircleOutlined className="wizard-step-icon" />
                            <div>
                                <h2 className="wizard-step-title">Step 4: Service Verification</h2>
                                <p className="wizard-step-description">
                                    Verify all services are running correctly
                                </p>
                            </div>
                        </div>

                        <div className="wizard-step-content">
                            <p style={{ marginBottom: 24, color: '#94a3b8' }}>
                                Click the button below to verify all services are running and healthy.
                            </p>

                            <div className="wizard-datasource-list">
                                {[
                                    { key: 'prometheus', name: 'Prometheus', desc: 'Metrics Backend' },
                                    { key: 'loki', name: 'Loki', desc: 'Logs Backend' },
                                    { key: 'tempo', name: 'Tempo', desc: 'Traces Backend' },
                                ].map((service) => {
                                    const status = serviceHealth[service.key as keyof typeof serviceHealth];
                                    return (
                                        <div key={service.key} className="wizard-datasource-item">
                                            <div className="wizard-datasource-info">
                                                <strong>{service.name}</strong>
                                                <span style={{ color: '#64748b', fontSize: 13 }}>{service.desc}</span>
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
                                    variant="secondary"
                                    onClick={runServiceHealthChecks}
                                    disabled={verificationStarted && !allServicesHealthy && Object.values(serviceHealth).some(s => s.checking)}
                                >
                                    {Object.values(serviceHealth).some(s => s.checking) ? (
                                        <>
                                            <Spinner inline size="sm" /> Checking...
                                        </>
                                    ) : (
                                        'Run Health Check'
                                    )}
                                </Button>
                            </div>

                            {verificationStarted && !allServicesHealthy && !Object.values(serviceHealth).some(s => s.checking) && (
                                <Alert title="Some services are not responding" severity="warning" style={{ marginTop: 16 }}>
                                    Please ensure all services are running and try again.
                                </Alert>
                            )}

                            {allServicesHealthy && (
                                <Alert title="All Services Healthy!" severity="success" style={{ marginTop: 16 }}>
                                    All services are running correctly. You're ready to explore the platform!
                                </Alert>
                            )}
                        </div>

                        <div className="wizard-step-actions">
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
                            <span>API Key</span>
                        </div>
                        <div className="wizard-progress-line" />
                        <div className="wizard-progress-step">
                            <div className="wizard-step-number">4</div>
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
                                    const config = DATASOURCE_CONFIGS[type];
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
                                variant="primary"
                                onClick={handleContinueToStep3}
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

    // Step 1: Platform Setup
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
                        <span>API Key</span>
                    </div>
                    <div className="wizard-progress-line" />
                    <div className="wizard-progress-step">
                        <div className="wizard-step-number">4</div>
                        <span>Verification</span>
                    </div>
                </div>

                <div className="wizard-step-card">
                    <div className="wizard-step-header">
                        <DesktopOutlined className="wizard-step-icon" />
                        <div>
                            <h2 className="wizard-step-title">Step 1: Observability Platform Setup</h2>
                            <p className="wizard-step-description">
                                Run IyziTrace Observability Platform on Docker Desktop
                            </p>
                        </div>
                    </div>

                    <div className="wizard-step-content">
                        <div className="wizard-prerequisite">
                            <h3 className="wizard-section-title">
                                <Icon name="docker" /> Prerequisite
                            </h3>
                            <p>
                                Before continuing, make sure{' '}
                                <a
                                    href="https://www.docker.com/products/docker-desktop/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Docker Desktop
                                </a>
                                {' '}is installed and running.
                            </p>
                        </div>

                        <div className="wizard-command-section">
                            <h3 className="wizard-section-title">
                                <CodeOutlined /> Terminal Command
                            </h3>
                            <p className="wizard-command-description">
                                Run the following command in your terminal to start the platform:
                            </p>
                            <div className="wizard-command-box">
                                <code className="wizard-command-text">{dockerCommand}</code>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleCopyCommand}
                                    className="wizard-copy-button"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircleOutlined /> Copied
                                        </>
                                    ) : (
                                        <>
                                            <CopyOutlined /> Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="wizard-command-note">
                                <strong>Note:</strong> This command may take a few minutes on first run.
                                Wait for all containers to be downloaded and started.
                            </p>
                        </div>

                        <div className="wizard-check-section">
                            <h3 className="wizard-section-title">Platform Check</h3>
                            <p>Verify that the platform is running successfully:</p>

                            <div className="wizard-check-actions">
                                <Button
                                    variant="primary"
                                    onClick={checkPlatformHealth}
                                    disabled={platformStatus.checking || platformStatus.success === true}
                                >
                                    {platformStatus.checking ? (
                                        <>
                                            <Spinner inline size="sm" /> Checking...
                                        </>
                                    ) : (
                                        'Verify'
                                    )}
                                </Button>

                                {platformStatus.success === true && (
                                    <div className="wizard-check-result success">
                                        <CheckCircleOutlined />
                                        <span>Platform is running successfully!</span>
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
                                    title="Platform not found"
                                    severity="warning"
                                    className="wizard-alert"
                                >
                                    <ul>
                                        <li>Make sure Docker Desktop is running</li>
                                        <li>Make sure you ran the command above</li>
                                        <li>Wait a few minutes for containers to start</li>
                                        <li>
                                            Check the <code>observability-platform</code> container
                                            group in Docker Desktop
                                        </li>
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
