import React from 'react';
import {
    CloudOutlined,
    DesktopOutlined,
    ContainerOutlined,
    ThunderboltOutlined,
    ClusterOutlined,
    HddOutlined,
    FolderOutlined,
    DeploymentUnitOutlined,
    CopyOutlined,
    DatabaseOutlined,
    SyncOutlined,
    AppstoreOutlined,
    ApiOutlined,
    TableOutlined,
    MessageOutlined,
    SendOutlined,
    UploadOutlined,
    DownloadOutlined,
    MobileOutlined,
    AppleOutlined,
    AndroidOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import type { EntityType, EntityStatus } from '../types/inventory';
import { ENTITY_COLORS, STATUS_INFO } from '../types/inventory';

interface EntityIconProps {
    type: EntityType;
    size?: number;
    className?: string;
}

const iconMap: Record<string, React.ComponentType<any>> = {
    'cloud.region': CloudOutlined,
    'host': DesktopOutlined,
    'container': ContainerOutlined,
    'process': ThunderboltOutlined,
    'k8s.cluster': ClusterOutlined,
    'k8s.node': HddOutlined,
    'k8s.namespace': FolderOutlined,
    'k8s.deployment': DeploymentUnitOutlined,
    'k8s.replicaset': CopyOutlined,
    'k8s.statefulset': DatabaseOutlined,
    'k8s.daemonset': SyncOutlined,
    'k8s.pod': AppstoreOutlined,
    'service': ApiOutlined,
    'db.instance': DatabaseOutlined,
    'db.database': TableOutlined,
    'cache.instance': ThunderboltOutlined,
    'messaging.system': MessageOutlined,
    'messaging.destination': SendOutlined,
    'messaging.producer': UploadOutlined,
    'messaging.consumer': DownloadOutlined,
    'mobile.app': MobileOutlined,
    'mobile.app.ios': AppleOutlined,
    'mobile.app.android': AndroidOutlined,
};

export const EntityIcon: React.FC<EntityIconProps> = ({ type, size = 16, className = '' }) => {
    const Icon = iconMap[type] || QuestionCircleOutlined;
    const color = ENTITY_COLORS[type] || '#64748b';

    return (
        <Icon
            style={{ fontSize: size, color }}
            className={className}
        />
    );
};

export const EntityBadge: React.FC<{ type: EntityType }> = ({ type }) => {
    const color = ENTITY_COLORS[type] || '#64748b';

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: `${color}15`,
                color: color,
            }}
        >
            <EntityIcon type={type} size={12} />
            {type}
        </span>
    );
};

export const StatusBadge: React.FC<{ status: EntityStatus }> = ({ status }) => {
    const info = STATUS_INFO[status] || STATUS_INFO.active;
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '12px',
                border: `1px solid ${info.color}30`,
                backgroundColor: `${info.bgColor}15`,
                color: info.color,
                textTransform: 'uppercase',
            }}
        >
            {info.label}
        </span>
    );
};

export default EntityIcon;
