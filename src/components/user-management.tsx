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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Users,
  MoreHorizontal,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { useUsers, CreateUserData } from "@/hooks/use-users";
import { User } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

export default function UserManagement() {
  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    searchUsers,
    initializeDefaultAdmin,
  } = useUsers();

  const { roles, getActiveRoles } = useRoles();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [userForm, setUserForm] = useState<CreateUserData>({
    username: "",
    email: "",
    displayName: "",
    password: "",
    role: "",
    isActive: true,
    department: "",
    phone: "",
  });

  // Reset form
  const resetUserForm = () => {
    setUserForm({
      username: "",
      email: "",
      displayName: "",
      password: "",
      role: "",
      isActive: true,
      department: "",
      phone: "",
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  // Handle create/update user
  const handleSaveUser = async () => {
    try {
      if (!userForm.username.trim()) {
        toast.error("Username harus diisi");
        return;
      }

      if (!userForm.email.trim()) {
        toast.error("Email harus diisi");
        return;
      }

      if (!userForm.displayName.trim()) {
        toast.error("Nama lengkap harus diisi");
        return;
      }

      if (!userForm.role) {
        toast.error("Role harus dipilih");
        return;
      }

      if (!editingUser && (!userForm.password || !userForm.password.trim())) {
        toast.error("Password harus diisi untuk user baru");
        return;
      }

      if (editingUser?.id) {
        // Update user (exclude password if empty)
        const updateData = { ...userForm };
        if (!updateData.password || !updateData.password.trim()) {
          const { password, ...dataWithoutPassword } = updateData;
          const result = await updateUser(editingUser.id, dataWithoutPassword);

          if (result.success) {
            toast.success("User berhasil diupdate");
            setUserDialogOpen(false);
            resetUserForm();
          } else {
            toast.error(result.error || "Gagal mengupdate user");
          }
        } else {
          const result = await updateUser(editingUser.id, updateData);

          if (result.success) {
            toast.success("User berhasil diupdate");
            setUserDialogOpen(false);
            resetUserForm();
          } else {
            toast.error(result.error || "Gagal mengupdate user");
          }
        }
      } else {
        // Create new user
        const result = await createUser(userForm);

        if (result.success) {
          toast.success("User berhasil dibuat");
          setUserDialogOpen(false);
          resetUserForm();
        } else {
          toast.error(result.error || "Gagal membuat user");
        }
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan user");
    }
  };

  // Handle delete user
  const handleDeleteUser = async (id: string) => {
    try {
      const result = await deleteUser(id);

      if (result.success) {
        toast.success("User berhasil dihapus");
      } else {
        toast.error(result.error || "Gagal menghapus user");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus user");
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleUserStatus(id, !currentStatus);

      if (result.success) {
        toast.success(
          `User ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`
        );
      } else {
        toast.error(result.error || "Gagal mengubah status user");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengubah status user");
    }
  };

  // Edit user handler
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      password: "", // Don't show existing password
      role: user.role,
      isActive: user.isActive,
      department: user.department || "",
      phone: user.phone || "",
    });
    setUserDialogOpen(true);
  };

  // Initialize default admin
  const handleInitializeAdmin = async () => {
    try {
      const result = await initializeDefaultAdmin();
      if (result.success) {
        toast.success("Default admin user berhasil dibuat");
      } else {
        toast.error(result.error || "Gagal membuat default admin");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  // Filter users based on search
  const filteredUsers = searchUsers(searchTerm);
  const activeRoles = getActiveRoles();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
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
            Kelola users dan akses mereka ke sistem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleInitializeAdmin}>
            <UserPlus className="h-4 w-4 mr-2" />
            Init Admin
          </Button>
          <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetUserForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Edit User" : "Tambah User Baru"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "Update informasi user yang dipilih."
                    : "Buat user baru dengan informasi yang diperlukan."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({ ...userForm, username: e.target.value })
                    }
                    placeholder="Masukkan username"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    placeholder="Masukkan email"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="displayName">Nama Lengkap</Label>
                  <Input
                    id="displayName"
                    value={userForm.displayName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, displayName: e.target.value })
                    }
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">
                    Password{" "}
                    {editingUser && "(Kosongkan jika tidak ingin mengubah)"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                      placeholder={
                        editingUser ? "Password baru" : "Masukkan password"
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 px-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={userForm.role}
                    onValueChange={(value) =>
                      setUserForm({ ...userForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={userForm.department}
                    onChange={(e) =>
                      setUserForm({ ...userForm, department: e.target.value })
                    }
                    placeholder="Masukkan department"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={userForm.phone}
                    onChange={(e) =>
                      setUserForm({ ...userForm, phone: e.target.value })
                    }
                    placeholder="Masukkan nomor telepon"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={userForm.isActive}
                    onCheckedChange={(checked) =>
                      setUserForm({ ...userForm, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">User Aktif</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUserDialogOpen(false);
                    resetUserForm();
                  }}
                >
                  Batal
                </Button>
                <Button onClick={handleSaveUser}>
                  {editingUser ? "Update" : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="Cari users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Kelola semua users yang terdaftar dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.department || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleToggleStatus(user.id!, user.isActive)
                          }
                        >
                          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
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
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus user "
                                {user.displayName}"? Tindakan ini tidak dapat
                                dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteUser(user.id!)}
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada users
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "Tidak ada users yang sesuai dengan pencarian."
                  : "Belum ada users yang terdaftar."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setUserDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah User Pertama
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
