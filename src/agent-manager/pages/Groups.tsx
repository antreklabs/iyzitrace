import React from "react";
import { Plus, RefreshCw, Server, Trash2, Users, Pencil } from "lucide-react";
import { useState } from 'react';
import useSWR from "swr";

import { getGroups, createGroup, updateGroup, deleteGroup } from "@agent-manager/api/groups";
import type { Group, CreateGroupRequest, UpdateGroupRequest } from "@agent-manager/api/groups";
import { GroupDetailsDrawer } from "@agent-manager/components/GroupDetailsDrawer";
import { PageTable } from "@agent-manager/components/shared/PageTable";
import { Button } from "@agent-manager/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@agent-manager/components/ui/dialog";
import { Input } from "@agent-manager/components/ui/input";
import { Label } from "@agent-manager/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@agent-manager/components/ui/sheet";
import { TableCell } from "@agent-manager/components/ui/table";

export default function GroupsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateGroupRequest>({
    name: "",
    labels: {},
  });
  const [editForm, setEditForm] = useState<UpdateGroupRequest>({
    name: "",
    labels: {},
  });

  const {
    data: groupsData,
    error: groupsError,
    mutate: mutateGroups,
  } = useSWR("groups", getGroups, { refreshInterval: 30000 });

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutateGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    try {
      await createGroup(createForm);
      setCreateDrawerOpen(false);
      setCreateForm({ name: "", labels: {} });
      await mutateGroups();
    } catch (error) {
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    try {
      await updateGroup(selectedGroup.id, editForm);
      setEditDrawerOpen(false);
      setEditForm({ name: "", labels: {} });
      setSelectedGroup(null);
      await mutateGroups();
    } catch (error) {
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    try {
      await deleteGroup(selectedGroup.id);
      setDeleteDialogOpen(false);
      setSelectedGroup(null);
      await mutateGroups();
    } catch (error) {
    }
  };

  const handleGroupClick = (groupId: string) => {
    setSelectedGroupId(groupId);
    setGroupDrawerOpen(true);
  };

  const handleEditClick = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setEditForm({
      name: group.name,
      labels: group.labels,
      otlp_http_endpoint: group.otlp_http_endpoint || "",
      otlp_grpc_endpoint: group.otlp_grpc_endpoint || "",
    });
    setEditDrawerOpen(true);
  };

  const handleDeleteClick = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setDeleteDialogOpen(true);
  };

  if (groupsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Groups
          </h1>
          <p className="text-muted-foreground">{groupsError.message}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const groups = groupsData?.groups || [];

  return (
    <>
      <PageTable
        pageTitle="Groups"
        pageDescription="Organize agents into groups for easier management"
        pageActions={[
          {
            label: "Refresh",
            icon: RefreshCw,
            onClick: handleRefresh,
            disabled: refreshing,
            variant: "ghost" as const,
          },
          {
            label: "Create Group",
            icon: Plus,
            onClick: () => setCreateDrawerOpen(true),
            variant: "default" as const,
          },
        ]}
        cardTitle={`Groups (${groups.length})`}
        cardDescription="All agent groups and their details"
        columns={[
          { header: "Name", key: "name" },
          { header: "Agents", key: "agents" },
          { header: "Config", key: "config" },
          { header: "Created", key: "created" },
          { header: "Updated", key: "updated" },
          { header: "Labels", key: "labels" },
          { header: "Actions", key: "actions" },
        ]}
        data={groups}
        getRowKey={(group: Group) => group.id}
        onRowClick={(group: Group) => handleGroupClick(group.id)}
        renderRow={(group: Group) => (
          <>
            <TableCell className="font-medium">{group.name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span>{group.agent_count}</span>
              </div>
            </TableCell>
            <TableCell>
              {group.config_name ? (
                <span className="text-sm font-mono text-muted-foreground">
                  {group.config_name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No config</span>
              )}
            </TableCell>
            <TableCell>
              {new Date(group.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {new Date(group.updated_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {Object.entries(group.labels).map(([key, value]) => (
                  <span
                    key={key}
                    className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                  >
                    {key}={value}
                  </span>
                ))}
                {Object.keys(group.labels).length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No labels
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleEditClick(group, e)}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteClick(group, e)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </>
        )}
        emptyState={{
          icon: Users,
          title: "No Groups Found",
          description: "Create your first group to organize your agents.",
          action: {
            label: "Create Group",
            onClick: () => setCreateDrawerOpen(true),
          },
        }}
      />

      {/* Create Group Drawer */}
      <Sheet open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create New Group</SheetTitle>
            <SheetDescription>
              Create a new group to organize your agents.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label htmlFor="create-name">Group Name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Enter group name"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">OTLP Forwarding (Optional)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Configure where agents in this group should send their own telemetry (metrics, logs, traces).
                This overrides the global server configuration.
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="create-otlp-http">OTLP HTTP Endpoint</Label>
                  <Input
                    id="create-otlp-http"
                    value={createForm.otlp_http_endpoint || ""}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, otlp_http_endpoint: e.target.value })
                    }
                    placeholder="e.g. gateway:4318"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Base URL (host:port). Lawrence appends /v1/metrics etc.
                  </p>
                </div>

                <div>
                  <Label htmlFor="create-otlp-grpc">OTLP gRPC Endpoint</Label>
                  <Input
                    id="create-otlp-grpc"
                    value={createForm.otlp_grpc_endpoint || ""}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, otlp_grpc_endpoint: e.target.value })
                    }
                    placeholder="e.g. gateway:4317"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Used if HTTP endpoint is not specified.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setCreateDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!createForm.name}>
              Create Group
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Group Drawer */}
      <Sheet open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Group</SheetTitle>
            <SheetDescription>
              Update group details and configuration.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Enter group name"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">OTLP Forwarding (Optional)</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Configure where agents in this group should send their own telemetry.
                Leave empty to use global configuration.
              </p>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-otlp-http">OTLP HTTP Endpoint</Label>
                  <Input
                    id="edit-otlp-http"
                    value={editForm.otlp_http_endpoint || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, otlp_http_endpoint: e.target.value })
                    }
                    placeholder="e.g. gateway:4318"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Base URL (host:port).
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-otlp-grpc">OTLP gRPC Endpoint</Label>
                  <Input
                    id="edit-otlp-grpc"
                    value={editForm.otlp_grpc_endpoint || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, otlp_grpc_endpoint: e.target.value })
                    }
                    placeholder="e.g. gateway:4317"
                  />
                </div>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup} disabled={!editForm.name}>
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the group "{selectedGroup?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GroupDetailsDrawer
        groupId={selectedGroupId}
        open={groupDrawerOpen}
        onOpenChange={setGroupDrawerOpen}
      />
    </>
  );
}
