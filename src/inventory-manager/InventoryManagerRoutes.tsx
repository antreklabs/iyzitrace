import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    PartitionOutlined,
    ApartmentOutlined,
    TableOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { NavigationProvider } from './components/NavigationContext';
import EntityDrawer from './components/EntityDrawer';
import '../assets/styles/pages/inventory-manager/inventory-manager.css';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TreeView = React.lazy(() => import('./pages/TreeView'));
const TableView = React.lazy(() => import('./pages/TableView'));

const navItems = [
    { path: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
    { path: 'tree', label: 'Tree View', icon: <ApartmentOutlined /> },
    { path: 'table', label: 'Table View', icon: <TableOutlined /> },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const currentPath = location.pathname.split('/').pop();

    return (
        <div className="inventory-manager-root">
            {/* Header */}
            <header className="inventory-header">
                <div className="inventory-header-content">
                    <div className="inventory-logo">
                        <PartitionOutlined className="inv-route-icon" />
                        <span>Inventory</span>
                    </div>

                    <nav className="inventory-nav">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`inventory-nav-item ${currentPath === item.path ? 'active' : ''}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="inventory-main">
                {children}
            </main>

            {/* Entity Drawer */}
            <EntityDrawer />
        </div>
    );
};

const InventoryManagerRoutes: React.FC = () => {
    return (
        <NavigationProvider>
            <React.Suspense fallback={
                <div className="inventory-loading">
                    <div className="inventory-loading-spinner" />
                    <p>Loading...</p>
                </div>
            }>
                <Layout>
                    <Routes>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="tree" element={<TreeView />} />
                        <Route path="table" element={<TableView />} />
                    </Routes>
                </Layout>
            </React.Suspense>
        </NavigationProvider>
    );
};

export default InventoryManagerRoutes;
