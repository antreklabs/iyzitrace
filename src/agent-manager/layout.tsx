import React from 'react';
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Server, Network, Users, FileCode, BarChart3 } from "lucide-react";

import { cn } from "@agent-manager/lib/utils";

const navItems = [
  { name: "Agents", path: "agents", icon: Server },
  { name: "Topology", path: "topology", icon: Network },
  { name: "Groups", path: "groups", icon: Users },
  { name: "Configs", path: "configs", icon: FileCode },
  { name: "Telemetry", path: "telemetry", icon: BarChart3 },
];

export default function Layout() {
  const location = useLocation();

  // Get current path segment
  const currentPath = location.pathname.split('/').pop() || 'agents';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <span className="text-sm font-semibold text-muted-foreground mr-4">Agent Manager</span>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path ||
              (currentPath === 'agent-manager' && item.path === 'agents');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
