import React from 'react';
import { Outlet, Link, useLocation } from "react-router-dom";
import { Server, Network, Users, FileCode } from "lucide-react";

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Tab Navigation - Same style as Inventory Manager */}
      <header style={{
        background: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '18px',
            fontWeight: 700,
            color: '#f1f5f9',
          }}>
            <Server style={{ width: '24px', height: '24px' }} />
            <span>Agent Manager</span>
          </div>

          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path ||
                (currentPath === 'agent-manager' && item.path === 'agents');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: isActive ? '#3b82f6' : 'transparent',
                    color: isActive ? 'white' : '#888888',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#2a2a2a';
                      e.currentTarget.style.color = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#888888';
                    }
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px' }} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <div style={{ flex: 1, overflow: 'auto', background: '#111111' }}>
        <Outlet />
      </div>
    </div>
  );
}
