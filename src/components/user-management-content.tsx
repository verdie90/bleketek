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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Shield,
  Activity,
  Eye,
  UserCheck,
  UserX,
  Settings,
  Download,
  Upload,
  MoreHorizontal,
  Calendar,
  Phone,
  MapPin,
  Building,
  Briefcase,
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
  useUserManagement,
  User,
  UserActivity,
} from "@/hooks/use-user-management";
import { useRoles } from "@/hooks/use-roles";
import RoleInitializer from "./role-initializer";
import SystemInitializer from "./system-initializer";

export default function UserManagementContent() {
  // User Management Hook
  const {
    users,
    userActivities,
    loading,
    error,
    createUser,
    updateUser,
    deleteUserAccount,
    toggleUserStatus,
    sendPasswordReset,
    getActiveUsersCount,
    getRecentActivities,
    searchUsers,
    loadUsers,
  } = useUserManagement();

  // Roles Hook
  const { roles, loading: rolesLoading, getActiveRoles } = useRoles();

  // State management
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    displayName: "",
    phoneNumber: "",
    role: "User",
    position: "",
    isActive: true,
    password: "",
    notes: "",
  });

  // Reset form
  const resetUserForm = () => {
    setUserForm({
      email: "",
      firstName: "",
      lastName: "",
      displayName: "",
      phoneNumber: "",
      role: "User",
      position: "",
      isActive: true,
      password: "",
      notes: "",
    });
    setEditingUser(null);
  };

  // Handle create user
  const handleCreateUser = async () => {
    try {
      if (
        !userForm.email ||
        !userForm.password ||
        !userForm.firstName ||
        !userForm.lastName
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const result = await createUser(
        {
          email: userForm.email,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          displayName:
            userForm.displayName ||
            `${userForm.firstName} ${userForm.lastName}`,
          phoneNumber: userForm.phoneNumber,
          role: userForm.role,
          position: userForm.position,
          isActive: userForm.isActive,
          isEmailVerified: false,
          createdBy: "current-user", // Replace with actual user
          notes: userForm.notes,
        },
        userForm.password
      );

      if (result.success) {
        toast.success("User created successfully");
        setUserDialogOpen(false);
        resetUserForm();
      } else {
        // Check for Firebase auth errors
        if (result.error?.includes("auth/operation-not-allowed")) {
          toast.error("Firebase Authentication not enabled", {
            description: "Click here to setup Firebase",
            action: {
              label: "Setup Firebase",
              onClick: () => window.open("/firebase-setup", "_blank"),
            },
          });
        } else {
          toast.error(result.error || "Failed to create user");
        }
      }
    } catch (error) {
      toast.error("An error occurred while creating user");
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editingUser?.id) return;

    try {
      const result = await updateUser(editingUser.id, {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        displayName: userForm.displayName,
        phoneNumber: userForm.phoneNumber,
        role: userForm.role,
        position: userForm.position,
        isActive: userForm.isActive,
        notes: userForm.notes,
      });

      if (result.success) {
        toast.success("User updated successfully");
        setUserDialogOpen(false);
        resetUserForm();
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("An error occurred while updating user");
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      const result = await deleteUserAccount(userId);

      if (result.success) {
        toast.success("User deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred while deleting user");
    }
  };

  // Handle toggle user status
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const result = await toggleUserStatus(userId);

      if (result.success) {
        toast.success("User status updated successfully");
      } else {
        toast.error(result.error || "Failed to update user status");
      }
    } catch (error) {
      toast.error("An error occurred while updating user status");
    }
  };

  // Handle send password reset
  const handleSendPasswordReset = async (email: string) => {
    try {
      const result = await sendPasswordReset(email);

      if (result.success) {
        toast.success("Password reset email sent successfully");
      } else {
        toast.error(result.error || "Failed to send password reset email");
      }
    } catch (error) {
      toast.error("An error occurred while sending password reset email");
    }
  };

  // Edit user handler
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber || "",
      role: user.role,
      position: user.position,
      isActive: user.isActive,
      password: "",
      notes: user.notes || "",
    });
    setUserDialogOpen(true);
  };

  // View user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserDetailsDialogOpen(true);
  };

  // Filter users
  const filteredUsers = React.useMemo(() => {
    let filtered = searchTerm ? searchUsers(searchTerm) : users;

    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((user) =>
        filterStatus === "active" ? user.isActive : !user.isActive
      );
    }

    return filtered;
  }, [users, searchTerm, filterRole, filterStatus, searchUsers]);

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading user management...</span>
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
            <Button onClick={loadUsers} variant="outline" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show system initializer if no roles and no users exist
  if (getActiveRoles().length === 0 && users.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Setup required: Initialize the system with roles and sample users
          </p>
        </div>
        <SystemInitializer />
      </div>
    );
  }

  // Show role initializer if no roles exist but users might exist
  if (getActiveRoles().length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Setup required: Initialize the role system first
          </p>
        </div>
        <RoleInitializer />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions in your system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetUserForm}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit User" : "Create New User"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update user information and settings"
                    : "Create a new user account with role and permissions"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={userForm.firstName}
                      onChange={(e) =>
                        setUserForm({ ...userForm, firstName: e.target.value })
                      }
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={userForm.lastName}
                      onChange={(e) =>
                        setUserForm({ ...userForm, lastName: e.target.value })
                      }
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={userForm.displayName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, displayName: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    placeholder="john.doe@example.com"
                    disabled={!!editingUser}
                  />
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                      placeholder="Enter secure password"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={userForm.phoneNumber}
                    onChange={(e) =>
                      setUserForm({ ...userForm, phoneNumber: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(value) =>
                        setUserForm({ ...userForm, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getActiveRoles().map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={userForm.position}
                    onChange={(e) =>
                      setUserForm({ ...userForm, position: e.target.value })
                    }
                    placeholder="Senior Developer, Manager, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={userForm.notes}
                    onChange={(e) =>
                      setUserForm({ ...userForm, notes: e.target.value })
                    }
                    placeholder="Additional notes about this user"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={userForm.isActive}
                    onCheckedChange={(checked) =>
                      setUserForm({ ...userForm, isActive: checked })
                    }
                  />
                  <Label>Active User</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingUser ? handleUpdateUser : handleCreateUser}
                >
                  {editingUser ? "Update User" : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveUsersCount()}</div>
            <p className="text-xs text-muted-foreground">
              Currently active accounts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveRoles().length}</div>
            <p className="text-xs text-muted-foreground">Available roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getRecentActivities(10).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 10 activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {getActiveRoles().map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.name}
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

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activities">Activity Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role & Position</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={user.avatar}
                              alt={user.displayName}
                            />
                            <AvatarFallback>
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.displayName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">{user.role}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {user.position}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.phoneNumber && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{user.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "secondary"}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {user.isEmailVerified && (
                          <Badge variant="outline" className="ml-1">
                            Verified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? (
                          <div className="text-sm">
                            {user.lastLoginAt.toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Never
                          </span>
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
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleSendPasswordReset(user.email)
                              }
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleUserStatus(user.id || "")
                              }
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
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
                                    Delete User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{" "}
                                    {user.displayName}? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() =>
                                      handleDeleteUser(user.id || "")
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

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Log</CardTitle>
              <CardDescription>
                Track user actions and system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRecentActivities(20).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-4 border-b pb-4"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{activity.userEmail}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.description}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {activity.action}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getActiveRoles().map((role) => {
                    const count = users.filter(
                      (u) => u.role === role.name
                    ).length;
                    const percentage =
                      users.length > 0 ? (count / users.length) * 100 : 0;
                    return (
                      <div
                        key={role.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{role.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Roles and their permission counts
                  </div>
                  {getActiveRoles().map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{role.name}</span>
                      <Badge variant="outline">
                        {role.permissions.length} permissions
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog
        open={userDetailsDialogOpen}
        onOpenChange={setUserDetailsDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={selectedUser.avatar}
                    alt={selectedUser.displayName}
                  />
                  <AvatarFallback className="text-lg">
                    {selectedUser.firstName.charAt(0)}
                    {selectedUser.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedUser.displayName}
                  </h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{selectedUser.role}</Badge>
                    <Badge
                      variant={selectedUser.isActive ? "default" : "secondary"}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Position</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.position}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.phoneNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email Verified</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.isEmailVerified ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.lastLoginAt
                      ? selectedUser.lastLoginAt.toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {selectedUser.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedUser.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
