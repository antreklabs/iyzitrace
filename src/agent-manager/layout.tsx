import React from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";
import { Server, Network, Users, FileCode } from "lucide-react";
import '../assets/styles/containers/trace-detail/trace-detail.styles';

const navItems = [
  { name: "Agents", path: "agents", icon: Server },
  { name: "Topology", path: "topology", icon: Network },
  { name: "Groups", path: "groups", icon: Users },
  { name: "Configs", path: "configs", icon: FileCode },
];

export default function Layout() {
  const location = useLocation();

  // Get current path segment
  const currentPath = location.pathname.split('/').pop() || 'agents';

  return (
    <div className="am-layout">
      {/* Tab Navigation - Same style as Inventory Manager */}
      <header className="am-layout-header">
        <div className="am-layout-header-inner">
          <div className="am-layout-brand">
            <Server className="am-layout-brand-icon" />
            <span>Agent Manager</span>
          </div>

          <nav className="am-layout-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path ||
                (currentPath === 'agent-manager' && item.path === 'agents');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`am-layout-nav-link ${isActive ? 'am-layout-nav-link--active' : 'am-layout-nav-link--inactive'}`}
                >
                  <Icon className="am-layout-nav-icon" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <div className="am-layout-content">
        <Outlet />
      </div>
    </div>
  );
}
