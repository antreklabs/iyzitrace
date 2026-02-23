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
        <div className="topology-region-node">
            <div className="topology-region-node__header">
                <div className="topology-region-node__icon-wrap">
                    <CloudOutlined className="topology-region-node__icon" />
                </div>
                <div>
                    <div className="topology-region-node__type-label">Cloud Region</div>
                    <div className="topology-region-node__name" title={String(data.label)}>{String(data.label)}</div>
                </div>
                <div className="topology-region-node__badge">
                    <span className="topology-region-node__badge-text">
                        {String(data.hostCount || 0)} Hosts
                    </span>
                </div>
            </div>

            <div className="topology-region-node__body">
                <div className="topology-region-node__workspace">
                    <span className="topology-region-node__workspace-label">Regional Workspace</span>
                </div>
            </div>
        </div>
    );
});

export const HostNode = memo(({ data }: NodeProps) => {
    const isUnattended = data.label === 'unattended-services';

    return (
        <div className={`topology-host-node ${isUnattended ? 'topology-host-node--unattended' : 'topology-host-node--default'}`}>
            <Handle type="target" position={Position.Top} className="topology-handle" />

            <div className="topology-host-node__header">
                <div className={isUnattended ? 'topology-host-node__icon-wrap--unattended' : 'topology-host-node__icon-wrap--default'}>
                    <DesktopOutlined className={isUnattended ? 'topology-host-node__icon--unattended' : 'topology-host-node__icon--default'} />
                </div>
                <div className="topology-host-node__info">
                    <div className="topology-host-node__type-label">Host</div>
                    <div className="topology-host-node__name" title={String(data.label || '')}>{String(data.label || '')}</div>
                </div>
                {data.status && (
                    <div
                        className="topology-host-node__status-dot"
                        style={{ backgroundColor: STATUS_COLORS[String(data.status)] || '#cbd5e1' }}
                        title={String(data.status || '')}
                    />
                )}
            </div>

            <div className="topology-host-node__body">
                <div className="topology-host-node__stats">
                    <div className="topology-host-node__stat-badge">
                        <ApiOutlined className="topology-host-node__stat-icon" />
                        <span className="topology-host-node__stat-text">{String(data.serviceCount || 0)} Services</span>
                    </div>
                </div>

                <div className="topology-host-node__workspace">
                    <span className="topology-host-node__workspace-label">Instance Workspace</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="topology-handle" />
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
        <div className="topology-dep-node" style={{ borderLeft: `4px solid ${color}` }}>
            <Handle type="target" position={Position.Top} className="topology-dep-node__handle" style={{ backgroundColor: color }} />

            <div className="topology-dep-node__content">
                <div className="topology-dep-node__icon-wrap" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="topology-dep-node__icon" style={{ color }} />
                </div>
                <div className="topology-dep-node__info">
                    <div className="topology-dep-node__type" style={{ color }}>{type}</div>
                    <div className="topology-dep-node__name" title={String(data.label || '')}>{String(data.label || '')}</div>
                </div>
            </div>
        </div>
    );
});

export const ServiceNode = memo(({ data }: NodeProps) => {
    return (
        <div className="topology-service-node">
            <div className="topology-service-node__content">
                <div className="topology-service-node__dot" />
                <span className="topology-service-node__name" title={String(data.label)}>{String(data.label)}</span>
            </div>
            <Handle type="target" position={Position.Top} className="topology-handle--hidden" />
            <Handle type="source" position={Position.Bottom} className="topology-handle--hidden" />
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
