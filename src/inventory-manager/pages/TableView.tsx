import React, { useState, useMemo } from 'react';
import { Table, Input, Select, Tag, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useEntities } from '../hooks/useInventory';
import { useNavigation } from '../components/NavigationContext';
import { EntityIcon, StatusBadge } from '../components/EntityIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import type { Entity, EntityType } from '../types/inventory';
import { ENTITY_COLORS, ENTITY_CATEGORIES } from '../types/inventory';

const allEntityTypes = Object.values(ENTITY_CATEGORIES).flat();

const TableView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialType = searchParams.get('type') as EntityType | null;

    const [searchValue, setSearchValue] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(initialType ? [initialType] : []);

    const { data, loading, error, refresh } = useEntities({ limit: 5000 });
    const { selectEntity } = useNavigation();

    // Filter entities
    const filteredEntities = useMemo(() => {
        if (!data?.entities) return [];

        let result = data.entities;

        if (selectedTypes.length > 0) {
            result = result.filter(e => selectedTypes.includes(e.type));
        }

        if (searchValue) {
            const search = searchValue.toLowerCase();
            result = result.filter(e =>
                e.name.toLowerCase().includes(search) ||
                e.id.toLowerCase().includes(search) ||
                e.type.toLowerCase().includes(search)
            );
        }

        return result;
    }, [data, selectedTypes, searchValue]);

    const columns: ColumnsType<Entity> = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 180,
            render: (type: EntityType) => (
                <Space>
                    <EntityIcon type={type} size={16} />
                    <Tag color={ENTITY_COLORS[type]}>{type}</Tag>
                </Space>
            ),
            filters: allEntityTypes.map(t => ({ text: t, value: t })),
            onFilter: (value, record) => record.type === value,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (name: string, record: Entity) => (
                <a
                    onClick={() => selectEntity(record.id)}
                    style={{ color: '#60a5fa', cursor: 'pointer' }}
                >
                    {name}
                </a>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => <StatusBadge status={status} />,
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Stale', value: 'stale' },
                { text: 'Stopped', value: 'stopped' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Instances',
            key: 'instances',
            width: 100,
            render: (_, record) => (
                <span style={{ color: '#94a3b8' }}>
                    {record.active_count}/{record.instance_count}
                </span>
            ),
            sorter: (a, b) => a.instance_count - b.instance_count,
        },
        {
            title: 'Last Seen',
            dataIndex: 'last_seen',
            key: 'last_seen',
            width: 180,
            render: (value: string) => (
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                    {new Date(value).toLocaleString()}
                </span>
            ),
            sorter: (a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime(),
            defaultSortOrder: 'descend',
        },
    ];

    if (loading) {
        return <LoadingSpinner tip="Loading entities..." />;
    }

    if (error) {
        return <ErrorMessage message={error.message} onRetry={refresh} />;
    }

    return (
        <div style={{ padding: '24px', background: '#111111', minHeight: 'calc(100vh - 64px)' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>All Entities</h1>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
                    {filteredEntities.length} of {data?.total || 0} entities
                </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <Input
                    placeholder="Search by name or ID..."
                    prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    style={{
                        maxWidth: '400px',
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                    }}
                />
                <Select
                    mode="multiple"
                    placeholder="Filter by type..."
                    value={selectedTypes}
                    onChange={setSelectedTypes}
                    style={{ minWidth: '300px' }}
                    options={allEntityTypes.map(t => ({ label: t, value: t }))}
                    allowClear
                />
            </div>

            {/* Table */}
            <div style={{
                background: '#1a1a1a',
                borderRadius: '12px',
                border: '1px solid #2a2a2a',
                overflow: 'hidden',
            }}>
                <Table
                    columns={columns}
                    dataSource={filteredEntities}
                    rowKey="id"
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    }}
                    size="middle"
                    style={{ background: 'transparent' }}
                />
            </div>
        </div>
    );
};

export default TableView;
