import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
    CloudOutlined,
    DesktopOutlined,
    DatabaseOutlined,
    MessageOutlined,
    ThunderboltOutlined,
    AppstoreOutlined,
    ApiOutlined,
} from '@ant-design/icons';
import { ENTITY_COLORS, EntityType } from '../types/inventory';

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
    active: '#10b981',
    stale: '#f59e0b',
    lost: '#ef4444',
};

export const RegionNode = memo(({ data }: NodeProps) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '16px',
            background: 'rgba(217, 119, 6, 0.1)',
            border: '2px dashed rgba(245, 158, 11, 0.4)',
            minWidth: '400px',
            height: '100%',
            overflow: 'hidden',
        }}>
            <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
            }}>
                <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
                    <CloudOutlined style={{ fontSize: '20px', color: '#fbbf24' }} />
                </div>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245, 158, 11, 0.7)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cloud Region</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(data.label)}>{String(data.label)}</div>
                </div>
                <div style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '9999px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#fcd34d', textTransform: 'uppercase' }}>
                        {String(data.hostCount || 0)} Hosts
                    </span>
                </div>
            </div>

            <div style={{ padding: '16px', flex: 1 }}>
                <div style={{
                    borderRadius: '12px',
                    border: '2px dashed rgba(245, 158, 11, 0.1)',
                    background: 'rgba(245, 158, 11, 0.05)',
                    minHeight: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(245, 158, 11, 0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Regional Workspace</span>
                </div>
            </div>
        </div>
    );
});

export const HostNode = memo(({ data }: NodeProps) => {
    const isUnattended = data.label === 'unattended-services';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            borderRadius: '16px',
            background: 'rgba(17, 17, 17, 0.6)',
            border: `2px dashed ${isUnattended ? 'rgba(217, 119, 6, 1)' : 'rgba(59, 130, 246, 0.4)'}`,
            minWidth: '300px',
            height: '100%',
            overflow: 'hidden',
            transition: 'all 0.2s',
        }}>
            <Handle type="target" position={Position.Top} style={{ width: '12px', height: '12px', background: '#3b82f6', border: '2px solid #0f172a' }} />

            <div style={{
                background: 'rgba(30, 41, 59, 0.8)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
            }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: isUnattended ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}>
                    <DesktopOutlined style={{ fontSize: '20px', color: isUnattended ? '#fbbf24' : '#60a5fa' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Host</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={String(data.label || '')}>{String(data.label || '')}</div>
                </div>
                {data.status && (
                    <div
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: STATUS_COLORS[String(data.status)] || '#cbd5e1',
                            animation: 'pulse 2s infinite',
                        }}
                        title={String(data.status || '')}
                    />
                )}
            </div>

            <div style={{ padding: '16px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.3)' }}>
                        <ApiOutlined style={{ fontSize: '14px', color: '#ec4899' }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{String(data.serviceCount || 0)} Services</span>
                    </div>
                </div>

                <div style={{
                    borderRadius: '8px',
                    border: '2px dashed rgba(30, 41, 59, 0.5)',
                    background: 'rgba(2, 6, 23, 0.2)',
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Instance Workspace</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} style={{ width: '12px', height: '12px', background: '#3b82f6', border: '2px solid #0f172a' }} />
        </div>
    );
});

const getDepIcon = (type: EntityType) => {
    switch (type) {
        case 'db.instance':
        case 'db.database': return DatabaseOutlined;
        case 'cache.instance': return ThunderboltOutlined;
        case 'messaging.system':
        case 'messaging.destination': return MessageOutlined;
        default: return AppstoreOutlined;
    }
};

export const DependencyNode = memo(({ data }: NodeProps) => {
    const type = data.type as EntityType;
    const color = ENTITY_COLORS[type] || '#64748b';
    const Icon = getDepIcon(type);

    return (
        <div style={{
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            background: '#0f172a',
            borderLeft: `4px solid ${color}`,
            minWidth: '200px',
        }}>
            <Handle type="target" position={Position.Top} style={{ width: '8px', height: '8px', backgroundColor: color }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${color}15` }}>
                    <Icon style={{ fontSize: '20px', color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color, opacity: 0.5 }}>{type}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }} title={String(data.label || '')}>{String(data.label || '')}</div>
                </div>
            </div>
        </div>
    );
});

export const ServiceNode = memo(({ data }: NodeProps) => {
    return (
        <div style={{
            padding: '8px 12px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            background: 'rgba(219, 39, 119, 0.1)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            cursor: 'pointer',
            transition: 'background 0.2s',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ec4899' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#fce7f3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }} title={String(data.label)}>{String(data.label)}</span>
            </div>
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        </div>
    );
});

// Node types export for ReactFlow
export const nodeTypes = {
    region: RegionNode,
    host: HostNode,
    dependency: DependencyNode,
    service: ServiceNode,
};
