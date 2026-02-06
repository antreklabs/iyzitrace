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

    const sectionStyle: React.CSSProperties = {
        marginBottom: '20px',
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: 600,
        color: '#94a3b8',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    return (
        <div style={{ padding: '20px', color: '#f1f5f9' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <EntityBadge type={entity.type} />
                    <StatusBadge status={entity.status} />
                </div>
                <Title level={4} style={{ color: '#f1f5f9', margin: 0 }}>{entity.name}</Title>
                <Text style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{entity.id}</Text>
            </div>

            {/* Signal Sources Summary */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                    <ThunderboltOutlined />
                    Discovered From
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                    {Object.entries(signalCounts).map(([signalType, count]) => {
                        const info = SIGNAL_TYPE_INFO[signalType] || { label: signalType, color: '#64748b', bgColor: '#334155' };
                        return (
                            <div
                                key={signalType}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: `${info.color}15`,
                                    border: `1px solid ${info.color}40`,
                                }}
                            >
                                <div style={{ fontSize: '24px', fontWeight: 700, color: info.color }}>{count}</div>
                                <div style={{ fontSize: '12px', fontWeight: 500, color: info.color }}>{info.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Instances */}
            {entity.instance_count > 0 && (
                <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>
                        <AppstoreOutlined />
                        Instances
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div style={{ padding: '12px', borderRadius: '8px', background: '#22c55e15', border: '1px solid #22c55e40' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>{entity.active_count}</div>
                            <div style={{ fontSize: '12px', color: '#22c55e' }}>Active</div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '8px', background: '#f59e0b15', border: '1px solid #f59e0b40' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{entity.instance_count - entity.active_count}</div>
                            <div style={{ fontSize: '12px', color: '#f59e0b' }}>Stale/Stopped</div>
                        </div>
                        <div style={{ padding: '12px', borderRadius: '8px', background: '#64748b15', border: '1px solid #64748b40' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#94a3b8' }}>{entity.instance_count}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Relations */}
            {entity.attrs['host.id'] && entity.type !== 'host' && (
                <div style={sectionStyle}>
                    <div style={sectionTitleStyle}>
                        <BranchesOutlined />
                        Relations
                    </div>
                    <button
                        onClick={() => selectEntity(entity.attrs['host.id'])}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            background: '#3b82f615',
                            border: '1px solid #3b82f640',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#60a5fa',
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Runs On Host</div>
                            <div style={{ fontSize: '14px', fontWeight: 500 }}>{entity.attrs['host.name'] || entity.attrs['host.id']}</div>
                        </div>
                    </button>
                </div>
            )}

            {/* Timestamps */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                    <ClockCircleOutlined />
                    Timestamps
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', background: '#334155' }}>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>First Seen</div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9' }}>
                            {new Date(entity.first_seen).toLocaleString()}
                        </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: '#334155' }}>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Last Seen</div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#f1f5f9' }}>
                            {new Date(entity.last_seen).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Attributes */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                    <FileTextOutlined />
                    Attributes
                </div>
                <div style={{ background: '#334155', borderRadius: '8px', padding: '12px' }}>
                    {Object.entries(entity.attrs || {}).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #475569' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{key}</span>
                            <span style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 500 }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Evidence */}
            <div style={sectionStyle}>
                <div style={{ ...sectionTitleStyle, justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BranchesOutlined />
                        Source Evidence ({entity.evidence?.length || 0})
                    </span>
                    {entity.evidence?.length > 5 && (
                        <button
                            onClick={() => setShowAllEvidence(!showAllEvidence)}
                            style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: `${info.color}15` }}>
                                <span style={{ color: info.color, fontWeight: 500 }}>{info.label}</span>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>({items.length})</span>
                            </div>
                            <div style={{ padding: '8px 12px' }}>
                                {displayItems.map((evidence, idx) => (
                                    <div key={idx} style={{ padding: '8px 0', borderBottom: idx < displayItems.length - 1 ? '1px solid #475569' : 'none' }}>
                                        <div style={{ marginBottom: '4px' }}>
                                            <Tag color={info.color} style={{ fontSize: '10px' }}>{evidence.attribute_key}</Tag>
                                            <span style={{ color: '#94a3b8' }}> = </span>
                                            <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{evidence.attribute_value}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
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
