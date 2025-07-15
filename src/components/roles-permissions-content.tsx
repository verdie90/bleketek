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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Shield,
  Users,
  Key,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  Search,
  Filter,
  UserCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Crown,
  Settings,
  MoreHorizontal,
  UserPlus,
  UserMinus,
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
  useRolesPermissions,
  Role,
  Permission,
  UserRole,
} from "@/hooks/use-roles-permissions";

interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  permissions: Permission[];
}

const defaultModules: Module[] = [
  {
    id: "dashboard",
    name: "dashboard",
    displayName: "Dashboard",
    description: "Dashboard dan overview sistem",
    icon: "LayoutDashboard",
    permissions: [],
  },
  {
    id: "telemarketing",
    name: "telemarketing",
    displayName: "Telemarketing",
    description: "Modul telemarketing dan prospek",
    icon: "Phone",
    permissions: [],
  },
  {
    id: "clients",
    name: "clients",
    displayName: "Clients",
    description: "Manajemen data klien",
    icon: "Users",
    permissions: [],
  },
  {
    id: "documents",
    name: "documents",
    displayName: "Documents",
    description: "Manajemen dokumen",
    icon: "FileText",
    permissions: [],
  },
  {
    id: "payments",
    name: "payments",
    displayName: "Payments",
    description: "Manajemen pembayaran",
    icon: "CreditCard",
    permissions: [],
  },
  {
    id: "reports",
    name: "reports",
    displayName: "Reports",
    description: "Laporan dan analitik",
    icon: "BarChart",
    permissions: [],
  },
  {
    id: "settings",
    name: "settings",
    displayName: "Settings",
    description: "Pengaturan sistem",
    icon: "Settings",
    permissions: [],
  },
];

const defaultActions = ["create", "read", "update", "delete", "execute"];

const roleColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
  "#dc2626", // red-600
];

export default function RolesPermissionsContent() {
  const {
    roles,
    permissions,
    userRoles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
    assignUserRole,
    updateUserRole,
    revokeUserRole,
    deleteUserRole,
    updateRolePermissions,
    getRoleById,
    getPermissionById,
    getPermissionsByRole,
    getUserRolesByUser,
    getUserRolesByRole,
    getActiveUserCount,
    loadData,
  } = useRolesPermissions();

  // State management
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dialog states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false);
  const [matrixDialogOpen, setMatrixDialogOpen] = useState(false);

  // Form states
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );
  const [editingUserRole, setEditingUserRole] = useState<UserRole | null>(null);

  // Form data
  const [roleForm, setRoleForm] = useState({
    name: "",
    displayName: "",
    description: "",
    color: roleColors[0],
    priority: 1,
    isActive: true,
    isSystemRole: false,
    permissions: [] as string[],
  });

  const [permissionForm, setPermissionForm] = useState({
    name: "",
    displayName: "",
    description: "",
    module: "dashboard",
    action: "read" as "create" | "read" | "update" | "delete" | "execute",
    resource: "",
    isSystemPermission: false,
  });

  const [userRoleForm, setUserRoleForm] = useState({
    userId: "",
    userEmail: "",
    userName: "",
    roleId: "",
    expiresAt: "",
    notes: "",
  });

  // Reset forms
  const resetRoleForm = () => {
    setRoleForm({
      name: "",
      displayName: "",
      description: "",
      color: roleColors[0],
      priority: 1,
      isActive: true,
      isSystemRole: false,
      permissions: [],
    });
    setEditingRole(null);
  };

  const resetPermissionForm = () => {
    setPermissionForm({
      name: "",
      displayName: "",
      description: "",
      module: "dashboard",
      action: "read",
      resource: "",
      isSystemPermission: false,
    });
    setEditingPermission(null);
  };

  const resetUserRoleForm = () => {
    setUserRoleForm({
      userId: "",
      userEmail: "",
      userName: "",
      roleId: "",
      expiresAt: "",
      notes: "",
    });
    setEditingUserRole(null);
  };

  // Handle role operations
  const handleCreateRole = async () => {
    try {
      const result = await createRole({
        ...roleForm,
        createdBy: "current-user", // Replace with actual user
      });

      if (result.success) {
        toast.success("Role berhasil dibuat");
        setRoleDialogOpen(false);
        resetRoleForm();
      } else {
        toast.error(result.error || "Gagal membuat role");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat membuat role");
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole?.id) return;

    try {
      const result = await updateRole(editingRole.id, roleForm);

      if (result.success) {
        toast.success("Role berhasil diperbarui");
        setRoleDialogOpen(false);
        resetRoleForm();
      } else {
        toast.error(result.error || "Gagal memperbarui role");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memperbarui role");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const result = await deleteRole(roleId);

      if (result.success) {
        toast.success("Role berhasil dihapus");
      } else {
        toast.error(result.error || "Gagal menghapus role");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus role");
    }
  };

  // Handle permission operations
  const handleCreatePermission = async () => {
    try {
      const result = await createPermission(permissionForm);

      if (result.success) {
        toast.success("Permission berhasil dibuat");
        setPermissionDialogOpen(false);
        resetPermissionForm();
      } else {
        toast.error(result.error || "Gagal membuat permission");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat membuat permission");
    }
  };

  const handleUpdatePermission = async () => {
    if (!editingPermission?.id) return;

    try {
      const result = await updatePermission(
        editingPermission.id,
        permissionForm
      );

      if (result.success) {
        toast.success("Permission berhasil diperbarui");
        setPermissionDialogOpen(false);
        resetPermissionForm();
      } else {
        toast.error(result.error || "Gagal memperbarui permission");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memperbarui permission");
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const result = await deletePermission(permissionId);

      if (result.success) {
        toast.success("Permission berhasil dihapus");
      } else {
        toast.error(result.error || "Gagal menghapus permission");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus permission");
    }
  };

  // Handle user role operations
  const handleAssignUserRole = async () => {
    try {
      const role = getRoleById(userRoleForm.roleId);
      if (!role) {
        toast.error("Role tidak ditemukan");
        return;
      }

      const result = await assignUserRole({
        userId: userRoleForm.userId,
        userEmail: userRoleForm.userEmail,
        userName: userRoleForm.userName,
        roleId: userRoleForm.roleId,
        roleName: role.displayName,
        assignedBy: "current-user", // Replace with actual user
        isActive: true,
        notes: userRoleForm.notes,
        ...(userRoleForm.expiresAt && {
          expiresAt: new Date(userRoleForm.expiresAt),
        }),
      });

      if (result.success) {
        toast.success("User role berhasil ditetapkan");
        setUserRoleDialogOpen(false);
        resetUserRoleForm();
      } else {
        toast.error(result.error || "Gagal menetapkan user role");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menetapkan user role");
    }
  };

  const handleRevokeUserRole = async (userRoleId: string) => {
    try {
      const result = await revokeUserRole(userRoleId);

      if (result.success) {
        toast.success("User role berhasil dicabut");
      } else {
        toast.error(result.error || "Gagal mencabut user role");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mencabut user role");
    }
  };

  // Edit handlers
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      color: role.color,
      priority: role.priority,
      isActive: role.isActive,
      isSystemRole: role.isSystemRole,
      permissions: role.permissions,
    });
    setRoleDialogOpen(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setPermissionForm({
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description,
      module: permission.module,
      action: permission.action,
      resource: permission.resource,
      isSystemPermission: permission.isSystemPermission,
    });
    setPermissionDialogOpen(true);
  };

  // Filter data
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && role.isActive) ||
      (filterStatus === "inactive" && !role.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule =
      filterModule === "all" || permission.module === filterModule;
    return matchesSearch && matchesModule;
  });

  const filteredUserRoles = userRoles.filter((userRole) => {
    const matchesSearch =
      userRole.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userRole.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userRole.roleName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && userRole.isActive) ||
      (filterStatus === "inactive" && !userRole.isActive);
    return matchesSearch && matchesStatus;
  });

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
            <Button onClick={loadData} variant="outline" className="mt-4">
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
            Kelola roles, permissions, dan akses pengguna dalam sistem
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter((r) => r.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Permissions
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground">
              {defaultModules.length} modules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRoles.filter((ur) => ur.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                new Set(
                  userRoles.filter((ur) => ur.isActive).map((ur) => ur.userId)
                ).size
              }{" "}
              unique users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Roles</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter((r) => r.isSystemRole).length}
            </div>
            <p className="text-xs text-muted-foreground">Protected roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {defaultModules.map((module) => (
              <SelectItem key={module.id} value={module.name}>
                {module.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="user-roles">User Assignments</TabsTrigger>
          <TabsTrigger value="matrix">Role-Permission Matrix</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Roles Management</h3>
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetRoleForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRole ? "Edit Role" : "Create New Role"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRole
                      ? "Update role information and permissions"
                      : "Create a new role with specific permissions"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input
                        id="role-name"
                        value={roleForm.name}
                        onChange={(e) =>
                          setRoleForm({ ...roleForm, name: e.target.value })
                        }
                        placeholder="admin, user, manager"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role-display-name">Display Name</Label>
                      <Input
                        id="role-display-name"
                        value={roleForm.displayName}
                        onChange={(e) =>
                          setRoleForm({
                            ...roleForm,
                            displayName: e.target.value,
                          })
                        }
                        placeholder="Administrator, User, Manager"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role-description">Description</Label>
                    <Textarea
                      id="role-description"
                      value={roleForm.description}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the role purpose and responsibilities"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role-color">Color</Label>
                      <Select
                        value={roleForm.color}
                        onValueChange={(value) =>
                          setRoleForm({ ...roleForm, color: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleColors.map((color) => (
                            <SelectItem key={color} value={color}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span>{color}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="role-priority">Priority</Label>
                      <Input
                        id="role-priority"
                        type="number"
                        value={roleForm.priority}
                        onChange={(e) =>
                          setRoleForm({
                            ...roleForm,
                            priority: parseInt(e.target.value) || 1,
                          })
                        }
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={roleForm.isActive}
                        onCheckedChange={(checked) =>
                          setRoleForm({ ...roleForm, isActive: checked })
                        }
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={roleForm.isSystemRole}
                        onCheckedChange={(checked) =>
                          setRoleForm({ ...roleForm, isSystemRole: checked })
                        }
                      />
                      <Label>System Role</Label>
                    </div>
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-4">
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={roleForm.permissions.includes(
                                permission.id || ""
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setRoleForm({
                                    ...roleForm,
                                    permissions: [
                                      ...roleForm.permissions,
                                      permission.id || "",
                                    ],
                                  });
                                } else {
                                  setRoleForm({
                                    ...roleForm,
                                    permissions: roleForm.permissions.filter(
                                      (p) => p !== permission.id
                                    ),
                                  });
                                }
                              }}
                            />
                            <Label className="text-sm">
                              {permission.displayName}
                              <span className="text-muted-foreground ml-1">
                                ({permission.module}.{permission.action})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
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
                  <Button
                    onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  >
                    {editingRole ? "Update Role" : "Create Role"}
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
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <div>
                            <div className="font-medium">
                              {role.displayName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {role.name}
                            </div>
                          </div>
                          {role.isSystemRole && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {role.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {role.permissions.includes("*")
                            ? "All"
                            : role.permissions.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getActiveUserCount(role.id || "")}
                        </Badge>
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteRole(role.id || "")}
                              disabled={role.isSystemRole}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Permissions Management</h3>
            <Dialog
              open={permissionDialogOpen}
              onOpenChange={setPermissionDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={resetPermissionForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Permission
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPermission
                      ? "Edit Permission"
                      : "Create New Permission"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPermission
                      ? "Update permission information"
                      : "Create a new permission for a specific module and action"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="permission-name">Permission Name</Label>
                      <Input
                        id="permission-name"
                        value={permissionForm.name}
                        onChange={(e) =>
                          setPermissionForm({
                            ...permissionForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="dashboard.read, users.create"
                      />
                    </div>
                    <div>
                      <Label htmlFor="permission-display-name">
                        Display Name
                      </Label>
                      <Input
                        id="permission-display-name"
                        value={permissionForm.displayName}
                        onChange={(e) =>
                          setPermissionForm({
                            ...permissionForm,
                            displayName: e.target.value,
                          })
                        }
                        placeholder="Read Dashboard, Create Users"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="permission-description">Description</Label>
                    <Textarea
                      id="permission-description"
                      value={permissionForm.description}
                      onChange={(e) =>
                        setPermissionForm({
                          ...permissionForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what this permission allows"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="permission-module">Module</Label>
                      <Select
                        value={permissionForm.module}
                        onValueChange={(value) =>
                          setPermissionForm({
                            ...permissionForm,
                            module: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultModules.map((module) => (
                            <SelectItem key={module.id} value={module.name}>
                              {module.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="permission-action">Action</Label>
                      <Select
                        value={permissionForm.action}
                        onValueChange={(value) =>
                          setPermissionForm({
                            ...permissionForm,
                            action: value as any,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultActions.map((action) => (
                            <SelectItem key={action} value={action}>
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="permission-resource">Resource</Label>
                    <Input
                      id="permission-resource"
                      value={permissionForm.resource}
                      onChange={(e) =>
                        setPermissionForm({
                          ...permissionForm,
                          resource: e.target.value,
                        })
                      }
                      placeholder="users, documents, reports"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={permissionForm.isSystemPermission}
                      onCheckedChange={(checked) =>
                        setPermissionForm({
                          ...permissionForm,
                          isSystemPermission: checked,
                        })
                      }
                    />
                    <Label>System Permission</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPermissionDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={
                      editingPermission
                        ? handleUpdatePermission
                        : handleCreatePermission
                    }
                  >
                    {editingPermission
                      ? "Update Permission"
                      : "Create Permission"}
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
                    <TableHead>Permission</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {permission.displayName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {permission.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {defaultModules.find(
                            (m) => m.name === permission.module
                          )?.displayName || permission.module}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            permission.action === "read"
                              ? "default"
                              : permission.action === "create"
                              ? "default"
                              : permission.action === "update"
                              ? "default"
                              : permission.action === "delete"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {permission.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{permission.resource}</TableCell>
                      <TableCell>
                        {permission.isSystemPermission && (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            System
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditPermission(permission)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeletePermission(permission.id || "")
                              }
                              disabled={permission.isSystemPermission}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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

        {/* User Roles Tab */}
        <TabsContent value="user-roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Role Assignments</h3>
            <Dialog
              open={userRoleDialogOpen}
              onOpenChange={setUserRoleDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={resetUserRoleForm}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Role to User</DialogTitle>
                  <DialogDescription>
                    Assign a role to a user with optional expiration date
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="user-id">User ID</Label>
                    <Input
                      id="user-id"
                      value={userRoleForm.userId}
                      onChange={(e) =>
                        setUserRoleForm({
                          ...userRoleForm,
                          userId: e.target.value,
                        })
                      }
                      placeholder="user123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-email">User Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userRoleForm.userEmail}
                      onChange={(e) =>
                        setUserRoleForm({
                          ...userRoleForm,
                          userEmail: e.target.value,
                        })
                      }
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-name">User Name</Label>
                    <Input
                      id="user-name"
                      value={userRoleForm.userName}
                      onChange={(e) =>
                        setUserRoleForm({
                          ...userRoleForm,
                          userName: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-select">Role</Label>
                    <Select
                      value={userRoleForm.roleId}
                      onValueChange={(value) =>
                        setUserRoleForm({ ...userRoleForm, roleId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          .filter((r) => r.isActive)
                          .map((role) => (
                            <SelectItem key={role.id} value={role.id || ""}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: role.color }}
                                />
                                <span>{role.displayName}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expires-at">Expires At (Optional)</Label>
                    <Input
                      id="expires-at"
                      type="datetime-local"
                      value={userRoleForm.expiresAt}
                      onChange={(e) =>
                        setUserRoleForm({
                          ...userRoleForm,
                          expiresAt: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={userRoleForm.notes}
                      onChange={(e) =>
                        setUserRoleForm({
                          ...userRoleForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Additional notes about this assignment"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setUserRoleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAssignUserRole}>Assign Role</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUserRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{userRole.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            {userRole.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                getRoleById(userRole.roleId)?.color ||
                                "#64748b",
                            }}
                          />
                          <span>{userRole.roleName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{userRole.assignedBy}</TableCell>
                      <TableCell>
                        {userRole.assignedAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {userRole.expiresAt ? (
                          <span
                            className={
                              userRole.expiresAt < new Date()
                                ? "text-red-600"
                                : ""
                            }
                          >
                            {userRole.expiresAt.toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={userRole.isActive ? "default" : "secondary"}
                        >
                          {userRole.isActive ? "Active" : "Revoked"}
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {userRole.isActive ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRevokeUserRole(userRole.id || "")
                                }
                                className="text-red-600"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Revoke
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateUserRole(userRole.id || "", {
                                    isActive: true,
                                  })
                                }
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteUserRole(userRole.id || "")}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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

        {/* Role-Permission Matrix Tab */}
        <TabsContent value="matrix" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Role-Permission Matrix</h3>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Matrix
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">
                        Role / Permission
                      </TableHead>
                      {permissions.map((permission) => (
                        <TableHead
                          key={permission.id}
                          className="text-center min-w-[120px]"
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-xs">
                              {permission.displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {permission.module}.{permission.action}
                            </div>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            <div>
                              <div className="font-medium">
                                {role.displayName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {getActiveUserCount(role.id || "")} users
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        {permissions.map((permission) => {
                          const hasPermission =
                            role.permissions.includes("*") ||
                            role.permissions.includes(permission.id || "");
                          return (
                            <TableCell
                              key={permission.id}
                              className="text-center"
                            >
                              <Checkbox
                                checked={hasPermission}
                                onCheckedChange={(checked) => {
                                  let newPermissions = [...role.permissions];

                                  if (checked) {
                                    if (
                                      !newPermissions.includes(
                                        permission.id || ""
                                      )
                                    ) {
                                      newPermissions.push(permission.id || "");
                                    }
                                  } else {
                                    newPermissions = newPermissions.filter(
                                      (p) => p !== permission.id
                                    );
                                  }

                                  updateRolePermissions(
                                    role.id || "",
                                    newPermissions
                                  );
                                }}
                                disabled={
                                  role.permissions.includes("*") ||
                                  role.isSystemRole
                                }
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  💡 Tip: System roles with all permissions (*) cannot be
                  modified through this matrix.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
