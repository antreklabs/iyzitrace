import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SWRProvider } from '@agent-manager/lib/swr-provider';
import { ApiProvider } from '@agent-manager/providers/ApiProvider';
import { ThemeProvider } from '@agent-manager/components/ThemeProvider';
import Layout from '@agent-manager/layout';
import '@agent-manager/styles/agent-manager.css';

// Lazy load pages
const AgentsPage = React.lazy(() => import('@agent-manager/pages/Agents'));
const GroupsPage = React.lazy(() => import('@agent-manager/pages/Groups'));
const ConfigsPage = React.lazy(() => import('@agent-manager/pages/Configs'));
const TopologyPage = React.lazy(() => import('@agent-manager/pages/Topology'));

const AgentManagerRoutes: React.FC = () => {
    return (
        <div className="agent-manager-root dark">
            <ThemeProvider defaultTheme="dark">
                <SWRProvider>
                    <ApiProvider>
                        <React.Suspense fallback={
                            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                                Loading...
                            </div>
                        }>
                            <Routes>
                                <Route element={<Layout />}>
                                    <Route index element={<Navigate to="agents" replace />} />
                                    <Route path="agents" element={<AgentsPage />} />
                                    <Route path="groups" element={<GroupsPage />} />
                                    <Route path="configs" element={<ConfigsPage />} />
                                    <Route path="configs/new" element={<ConfigsPage mode="create" />} />
                                    <Route path="configs/:configId/edit" element={<ConfigsPage mode="edit" />} />
                                    <Route path="topology" element={<TopologyPage />} />
                                </Route>
                            </Routes>
                        </React.Suspense>
                    </ApiProvider>
                </SWRProvider>
            </ThemeProvider>
        </div>
    );
};

export default AgentManagerRoutes;
