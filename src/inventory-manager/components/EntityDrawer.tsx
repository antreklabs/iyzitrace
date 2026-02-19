import React from 'react';
import { Drawer, Spin } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useNavigation } from './NavigationContext';
import { useEntity } from '../hooks/useInventory';
import EntityDetail from './EntityDetail';
import ErrorMessage from './ErrorMessage';

export const EntityDrawer: React.FC = () => {
    const { selectedEntityId, isDrawerOpen, closeDrawer } = useNavigation();
    const { entity, loading, error } = useEntity(selectedEntityId);

    return (
        <Drawer
            title="Entity Inspector"
            placement="right"
            width={640}
            onClose={closeDrawer}
            open={isDrawerOpen}
            closeIcon={<CloseOutlined />}
            styles={{
                header: {
                    background: '#0f172a',
                    borderBottom: '1px solid #334155',
                    color: '#f1f5f9',
                },
                body: {
                    background: '#1e293b',
                    padding: 0,
                },
            }}
        >
            {loading ? (
                <div className="loading-spinner">
                    <Spin size="large" />
                </div>
            ) : error ? (
                <div className="inv-drawer-padding">
                    <ErrorMessage message={error.message} />
                </div>
            ) : entity ? (
                <EntityDetail entity={entity} onClose={closeDrawer} />
            ) : (
                <div className="loading-spinner">
                    <p>No entity selected</p>
                </div>
            )}
        </Drawer>
    );
};

export default EntityDrawer;
