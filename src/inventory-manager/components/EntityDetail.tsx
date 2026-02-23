import React, { useState } from 'react';
import { Collapse, Tag, Descriptions, Card, Typography } from 'antd';
import {
    ClockCircleOutlined,
    FileTextOutlined,
    ThunderboltOutlined,
    BranchesOutlined,
    AppstoreOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import { EntityBadge, StatusBadge } from './EntityIcon';
import { useNavigation } from './NavigationContext';
import type { Entity, Evidence, InstanceInfo } from '../types/inventory';
import { SIGNAL_TYPE_INFO, STATUS_INFO } from '../types/inventory';

const { Text, Title } = Typography;

interface EntityDetailProps {
    entity: Entity;
    onClose: () => void;
}

export const EntityDetail: React.FC<EntityDetailProps> = ({ entity, onClose }) => {
    const [showAllEvidence, setShowAllEvidence] = useState(false);
    const { selectEntity } = useNavigation();

    // Group evidence by signal type
    const evidenceBySignal = groupEvidenceBySignal(entity.evidence || []);
    const signalCounts = getSignalCounts(entity.evidence || []);

    return (
        <div className="entity-detail">
            {/* Header */}
            <div className="entity-detail__header">
                <div className="entity-detail__header-badges">
                    <EntityBadge type={entity.type} />
                    <StatusBadge status={entity.status} />
                </div>
                <Title level={4} className="entity-detail__title">{entity.name}</Title>
                <Text className="entity-detail__id">{entity.id}</Text>
            </div>

            {/* Signal Sources Summary */}
            <div className="entity-detail__section">
                <div className="entity-detail__section-title">
                    <ThunderboltOutlined />
                    Discovered From
                </div>
                <div className="entity-detail__signal-grid">
                    {Object.entries(signalCounts).map(([signalType, count]) => {
                        const info = SIGNAL_TYPE_INFO[signalType] || { label: signalType, color: '#64748b', bgColor: '#334155' };
                        return (
                            <div
                                key={signalType}
                                className="entity-detail__signal-card"
                                style={{
                                    background: `${info.color}15`,
                                    border: `1px solid ${info.color}40`,
                                }}
                            >
                                <div className="entity-detail__signal-count" style={{ color: info.color }}>{count}</div>
                                <div className="entity-detail__signal-label" style={{ color: info.color }}>{info.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Instances */}
            {entity.instance_count > 0 && (
                <div className="entity-detail__section">
                    <div className="entity-detail__section-title">
                        <AppstoreOutlined />
                        Instances
                    </div>
                    <div className="entity-detail__instances-grid">
                        <div className="entity-detail__instance-card--active">
                            <div className="entity-detail__instance-count--active">{entity.active_count}</div>
                            <div className="entity-detail__instance-label--active">Active</div>
                        </div>
                        <div className="entity-detail__instance-card--stale">
                            <div className="entity-detail__instance-count--stale">{entity.instance_count - entity.active_count}</div>
                            <div className="entity-detail__instance-label--stale">Stale/Stopped</div>
                        </div>
                        <div className="entity-detail__instance-card--total">
                            <div className="entity-detail__instance-count--total">{entity.instance_count}</div>
                            <div className="entity-detail__instance-label--total">Total</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Relations */}
            {entity.attrs['host.id'] && entity.type !== 'host' && (
                <div className="entity-detail__section">
                    <div className="entity-detail__section-title">
                        <BranchesOutlined />
                        Relations
                    </div>
                    <button
                        onClick={() => selectEntity(entity.attrs['host.id'])}
                        className="entity-detail__relation-btn"
                    >
                        <div>
                            <div className="entity-detail__relation-label">Runs On Host</div>
                            <div className="entity-detail__relation-value">{entity.attrs['host.name'] || entity.attrs['host.id']}</div>
                        </div>
                    </button>
                </div>
            )}

            {/* Timestamps */}
            <div className="entity-detail__section">
                <div className="entity-detail__section-title">
                    <ClockCircleOutlined />
                    Timestamps
                </div>
                <div className="entity-detail__timestamp-grid">
                    <div className="entity-detail__timestamp-card">
                        <div className="entity-detail__timestamp-label">First Seen</div>
                        <div className="entity-detail__timestamp-value">
                            {new Date(entity.first_seen).toLocaleString()}
                        </div>
                    </div>
                    <div className="entity-detail__timestamp-card">
                        <div className="entity-detail__timestamp-label">Last Seen</div>
                        <div className="entity-detail__timestamp-value">
                            {new Date(entity.last_seen).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Attributes */}
            <div className="entity-detail__section">
                <div className="entity-detail__section-title">
                    <FileTextOutlined />
                    Attributes
                </div>
                <div className="entity-detail__attrs-container">
                    {Object.entries(entity.attrs || {}).map(([key, value]) => (
                        <div key={key} className="entity-detail__attr-row">
                            <span className="entity-detail__attr-key">{key}</span>
                            <span className="entity-detail__attr-value">{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Evidence */}
            <div className="entity-detail__section">
                <div className="entity-detail__section-title--between">
                    <span className="entity-detail__evidence-section-title">
                        <BranchesOutlined />
                        Source Evidence ({entity.evidence?.length || 0})
                    </span>
                    {entity.evidence?.length > 5 && (
                        <button
                            onClick={() => setShowAllEvidence(!showAllEvidence)}
                            className="entity-detail__evidence-toggle"
                        >
                            {showAllEvidence ? 'Show less' : 'Show all'}
                        </button>
                    )}
                </div>
                {Object.entries(evidenceBySignal).map(([signalType, items]) => {
                    const info = SIGNAL_TYPE_INFO[signalType] || { label: signalType, color: '#64748b' };
                    const displayItems = showAllEvidence ? items : items.slice(0, 3);
                    return (
                        <div key={signalType} style={{ marginBottom: '8px', border: `1px solid ${info.color}40`, borderRadius: '8px' }}>
                            <div className="entity-detail__evidence-header" style={{ background: `${info.color}15` }}>
                                <span className="entity-detail__evidence-header-label" style={{ color: info.color }}>{info.label}</span>
                                <span className="entity-detail__evidence-header-count">({items.length})</span>
                            </div>
                            <div className="entity-detail__evidence-body">
                                {displayItems.map((evidence, idx) => (
                                    <div key={idx} className={idx < displayItems.length - 1 ? 'entity-detail__evidence-item--bordered' : 'entity-detail__evidence-item'}>
                                        <div className="entity-detail__evidence-detail">
                                            <Tag color={info.color} className="am-tag-xs">{evidence.attribute_key}</Tag>
                                            <span className="entity-detail__evidence-separator"> = </span>
                                            <span className="entity-detail__evidence-value">{evidence.attribute_value}</span>
                                        </div>
                                        <div className="entity-detail__evidence-timestamp">
                                            {new Date(evidence.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

function groupEvidenceBySignal(evidence: Evidence[]): Record<string, Evidence[]> {
    const groups: Record<string, Evidence[]> = {};
    for (const e of evidence) {
        const key = e.signal_type;
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
    }
    return groups;
}

function getSignalCounts(evidence: Evidence[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const e of evidence) {
        counts[e.signal_type] = (counts[e.signal_type] || 0) + 1;
    }
    return counts;
}

export default EntityDetail;
