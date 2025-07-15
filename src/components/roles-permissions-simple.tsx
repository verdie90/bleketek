"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Shield,
  Users,
  Activity,
  MoreHorizontal,
  Check,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useRoles,
  Role,
  RolePermission,
  PermissionConfig,
} from "@/hooks/use-roles";

export default function RolesPermissionsSimple() {
  const {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    initializeDefaultRoles,
    getActiveRoles,
    getAvailablePermissions,
    getPermissionsByCategory,
    hasPermission,
  } = useRoles();

  // State management
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [] as PermissionConfig[],
    isActive: true,
  });

  // Reset form
  const resetRoleForm = () => {
    setRoleForm({
      name: "",
      description: "",
      permissions: [],
      isActive: true,
    });
    setEditingRole(null);
  };

  // Handle create/update role
  const handleSaveRole = async () => {
    try {
      if (!roleForm.name.trim()) {
        toast.error("Role name is required");
        return;
      }

      if (editingRole?.id) {
        const result = await updateRole(editingRole.id, {
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
          isActive: roleForm.isActive,
        });

        if (result.success) {
          toast.success("Role updated successfully");
          setRoleDialogOpen(false);
          resetRoleForm();
        } else {
          toast.error(result.error || "Failed to update role");
        }
      } else {
        const result = await createRole({
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissions,
          isActive: roleForm.isActive,
          createdBy: "current-user", // Replace with actual user
        });

        if (result.success) {
          toast.success("Role created successfully");
          setRoleDialogOpen(false);
          resetRoleForm();
        } else {
          toast.error(result.error || "Failed to create role");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving role");
    }
  };

  // Handle delete role
  const handleDeleteRole = async (id: string) => {
    try {
      const result = await deleteRole(id);

      if (result.success) {
        toast.success("Role deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete role");
      }
    } catch (error) {
      toast.error("An error occurred while deleting role");
    }
  };

  // Edit role handler
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isActive: role.isActive,
    });
    setRoleDialogOpen(true);
  };

  // Handle permission changes
  const handlePermissionChange = (
    permission: RolePermission,
    checked: boolean
  ) => {
    if (checked) {
      // Add permission with default settings
      const newPermission: PermissionConfig = {
        permissionId: permission.id,
        actions: { ...permission.actions },
        scope: permission.scope === "both" ? "global" : permission.scope,
      };

      setRoleForm((prev) => ({
        ...prev,
        permissions: [...prev.permissions, newPermission],
      }));
    } else {
      // Remove permission
      setRoleForm((prev) => ({
        ...prev,
        permissions: prev.permissions.filter(
          (p) => p.permissionId !== permission.id
        ),
      }));
    }
  };

  // Handle action change for a permission
  const handleActionChange = (
    permissionId: string,
    action: "create" | "read" | "update" | "delete" | "download" | "import",
    checked: boolean
  ) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) =>
        p.permissionId === permissionId
          ? { ...p, actions: { ...p.actions, [action]: checked } }
          : p
      ),
    }));
  };

  // Handle scope change for a permission
  const handleScopeChange = (permissionId: string, scope: "global" | "own") => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.map((p) =>
        p.permissionId === permissionId ? { ...p, scope } : p
      ),
    }));
  };

  // Check if permission is selected
  const isPermissionSelected = (permissionId: string) => {
    return roleForm.permissions.some((p) => p.permissionId === permissionId);
  };

  // Get permission config
  const getPermissionConfig = (
    permissionId: string
  ): PermissionConfig | undefined => {
    return roleForm.permissions.find((p) => p.permissionId === permissionId);
  };

  // Initialize default roles
  const handleInitializeRoles = async () => {
    try {
      const result = await initializeDefaultRoles();
      if (result.success) {
        toast.success("Default roles initialized successfully");
      } else {
        toast.error(result.error || "Failed to initialize default roles");
      }
    } catch (error) {
      toast.error("An error occurred while initializing roles");
    }
  };

  // Filter roles
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group permissions by category
  const permissionCategories = getPermissionsByCategory();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading roles and permissions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Roles & Permissions
          </h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions (Simplified Version)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleInitializeRoles} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Initialize Defaults
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">All system roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveRoles().length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getAvailablePermissions().length}
            </div>
            <p className="text-xs text-muted-foreground">
              Available permissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetRoleForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRole ? "Edit Role" : "Create New Role"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure role with specific permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="roleName">Role Name *</Label>
                      <Input
                        id="roleName"
                        value={roleForm.name}
                        onChange={(e) =>
                          setRoleForm({ ...roleForm, name: e.target.value })
                        }
                        placeholder="Manager, Agent, etc."
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        checked={roleForm.isActive}
                        onCheckedChange={(checked) =>
                          setRoleForm({ ...roleForm, isActive: checked })
                        }
                      />
                      <Label>Active Role</Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="roleDescription">Description</Label>
                    <Textarea
                      id="roleDescription"
                      value={roleForm.description}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe this role and its responsibilities"
                    />
                  </div>

                  {/* Permissions Section */}
                  <div>
                    <Label className="text-base font-medium">Permissions</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select permissions for this role
                    </p>
                    <div className="space-y-6">
                      {Object.entries(permissionCategories).map(
                        ([category, permissions]) => (
                          <div key={category}>
                            <h4 className="font-medium text-sm mb-3">
                              {category}
                            </h4>
                            <div className="space-y-4">
                              {permissions.map((permission) => {
                                const isSelected = isPermissionSelected(
                                  permission.id
                                );
                                const config = getPermissionConfig(
                                  permission.id
                                );

                                return (
                                  <div
                                    key={permission.id}
                                    className="border rounded-lg p-4 space-y-3"
                                  >
                                    <div className="flex items-start space-x-2">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) =>
                                          handlePermissionChange(
                                            permission,
                                            !!checked
                                          )
                                        }
                                      />
                                      <div className="flex-1">
                                        <label className="text-sm font-medium">
                                          {permission.name}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                          {permission.description}
                                        </p>
                                      </div>
                                    </div>

                                    {isSelected && (
                                      <div className="ml-6 space-y-3">
                                        {/* CRUD Actions */}
                                        <div className="space-y-2">
                                          <label className="text-xs font-medium text-muted-foreground">
                                            Actions
                                          </label>
                                          <div className="flex gap-4">
                                            {Object.entries(
                                              permission.actions
                                            ).map(([action, available]) =>
                                              available ? (
                                                <div
                                                  key={action}
                                                  className="flex items-center space-x-1"
                                                >
                                                  <Checkbox
                                                    id={`${permission.id}-${action}`}
                                                    checked={
                                                      config?.actions[
                                                        action as keyof typeof config.actions
                                                      ] || false
                                                    }
                                                    onCheckedChange={(
                                                      checked
                                                    ) =>
                                                      handleActionChange(
                                                        permission.id,
                                                        action as any,
                                                        !!checked
                                                      )
                                                    }
                                                  />
                                                  <label
                                                    htmlFor={`${permission.id}-${action}`}
                                                    className="text-xs capitalize"
                                                  >
                                                    {action}
                                                  </label>
                                                </div>
                                              ) : null
                                            )}
                                          </div>
                                        </div>

                                        {/* Scope Selection */}
                                        {permission.scope === "both" && (
                                          <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">
                                              Data Scope
                                            </label>
                                            <Select
                                              value={config?.scope || "global"}
                                              onValueChange={(value) =>
                                                handleScopeChange(
                                                  permission.id,
                                                  value as "global" | "own"
                                                )
                                              }
                                            >
                                              <SelectTrigger className="w-40">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="global">
                                                  Global Access
                                                </SelectItem>
                                                <SelectItem value="own">
                                                  Own Data Only
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRoleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRole}>
                    {editingRole ? "Update" : "Create"} Role
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="font-medium">{role.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {role.description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions
                            .slice(0, 3)
                            .map((permissionConfig) => {
                              const permission = getAvailablePermissions().find(
                                (p) => p.id === permissionConfig.permissionId
                              );
                              return permission ? (
                                <Badge
                                  key={permissionConfig.permissionId}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {permission.name}
                                  {permissionConfig.scope === "own" && (
                                    <span className="ml-1 text-xs opacity-70">
                                      (Own)
                                    </span>
                                  )}
                                </Badge>
                              ) : null;
                            })}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={role.isActive ? "default" : "secondary"}
                        >
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Role
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{role.name}
                                    "? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() =>
                                      handleDeleteRole(role.id || "")
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Permissions</CardTitle>
              <CardDescription>
                System permissions grouped by category (Simplified Version)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(permissionCategories).map(
                  ([category, permissions]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-lg mb-3">{category}</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {permissions.map((permission) => (
                          <Card key={permission.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {permission.name}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {permission.description}
                                </p>
                                <Badge variant="outline" className="mt-2">
                                  {permission.id}
                                </Badge>
                              </div>
                              <div className="text-green-600">
                                <Check className="h-5 w-5" />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
