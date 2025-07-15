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
import { toast } from "sonner";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Phone,
  Users,
  Activity,
  Target,
  Clock,
  Shield,
  Volume2,
  Calendar,
  Hash,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  List,
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
  useTelemarketingSettings,
  ProspectSource,
  ProspectStatus,
  PhoneSettings,
} from "@/hooks/use-telemarketing-settings";
import { Checkbox } from "@/components/ui/checkbox";

export default function TelemarketingSettings() {
  const {
    prospectSources,
    prospectStatuses,
    phoneSettings,
    activities,
    loading,
    error,
    createProspectSource,
    updateProspectSource,
    deleteProspectSource,
    createProspectStatus,
    updateProspectStatus,
    deleteProspectStatus,
    createOrUpdatePhoneSettings,
    initializeDefaultData,
    getActiveProspectSources,
    getActiveProspectStatuses,
    getRecentActivities,
  } = useTelemarketingSettings();

  // State management
  const [activeTab, setActiveTab] = useState("sources");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);

  // Form states
  const [editingSource, setEditingSource] = useState<ProspectSource | null>(
    null
  );
  const [editingStatus, setEditingStatus] = useState<ProspectStatus | null>(
    null
  );

  const [sourceForm, setSourceForm] = useState({
    name: "",
    description: "",
    isActive: true,
    color: "#3b82f6",
    priority: 1,
  });

  const [statusForm, setStatusForm] = useState({
    name: "",
    isActive: true,
    color: "#3b82f6",
    priority: 1,
    isDefault: false,
    nextActions: [] as string[],
  });

  const [phoneForm, setPhoneForm] = useState({
    callDurationMin: 2,
    callDurationMax: 30,
    dailyCallLimit: 100,
    weeklyCallLimit: 500,
    monthlyCallLimit: 2000,
    workingHours: {
      start: "09:00",
      end: "17:00",
      timezone: "Asia/Jakarta",
    },
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    autoDialEnabled: false,
    recordCallsEnabled: true,
    voicemailDetection: true,
    callBackDelay: 15,
    maxCallAttempts: 3,
    blacklistedNumbers: [] as string[],
    allowedAreaCodes: ["021", "022", "024", "031", "061"],
    callerIdSettings: {
      displayName: "Your Company",
      phoneNumber: "+6221-1234567",
      enabled: true,
    },
    // New settings
    callDelaySeconds: 3,
    autoNextCall: true,
    defaultStatusFilter: "Baru",
    defaultSourceFilter: "Database",
  });

  const [newAction, setNewAction] = useState("");
  const [newBlacklistedNumber, setNewBlacklistedNumber] = useState("");
  const [newAreaCode, setNewAreaCode] = useState("");

  // Reset forms
  const resetSourceForm = () => {
    setSourceForm({
      name: "",
      description: "",
      isActive: true,
      color: "#3b82f6",
      priority: prospectSources.length + 1,
    });
    setEditingSource(null);
  };

  const resetStatusForm = () => {
    setStatusForm({
      name: "",
      isActive: true,
      color: "#3b82f6",
      priority: prospectStatuses.length + 1,
      isDefault: false,
      nextActions: [],
    });
    setEditingStatus(null);
  };

  // Initialize phone form from settings
  React.useEffect(() => {
    if (phoneSettings) {
      setPhoneForm({
        callDurationMin: phoneSettings.callDurationMin,
        callDurationMax: phoneSettings.callDurationMax,
        dailyCallLimit: phoneSettings.dailyCallLimit,
        weeklyCallLimit: phoneSettings.weeklyCallLimit,
        monthlyCallLimit: phoneSettings.monthlyCallLimit,
        workingHours: phoneSettings.workingHours,
        workingDays: phoneSettings.workingDays,
        autoDialEnabled: phoneSettings.autoDialEnabled,
        recordCallsEnabled: phoneSettings.recordCallsEnabled,
        voicemailDetection: phoneSettings.voicemailDetection,
        callBackDelay: phoneSettings.callBackDelay,
        maxCallAttempts: phoneSettings.maxCallAttempts,
        blacklistedNumbers: phoneSettings.blacklistedNumbers,
        allowedAreaCodes: phoneSettings.allowedAreaCodes,
        callerIdSettings: phoneSettings.callerIdSettings,
        // New settings
        callDelaySeconds: phoneSettings.callDelaySeconds || 3,
        autoNextCall: phoneSettings.autoNextCall !== undefined ? phoneSettings.autoNextCall : true,
        defaultStatusFilter: phoneSettings.defaultStatusFilter || "Baru",
        defaultSourceFilter: phoneSettings.defaultSourceFilter || "Database",
      });
    }
  }, [phoneSettings]);

  // Handle create/update source
  const handleSaveSource = async () => {
    try {
      if (!sourceForm.name.trim()) {
        toast.error("Source name is required");
        return;
      }

      if (editingSource?.id) {
        const result = await updateProspectSource(editingSource.id, {
          ...sourceForm,
          createdBy: "current-user", // Replace with actual user
        });

        if (result.success) {
          toast.success("Prospect source updated successfully");
          setSourceDialogOpen(false);
          resetSourceForm();
        } else {
          toast.error(result.error || "Failed to update prospect source");
        }
      } else {
        const result = await createProspectSource({
          ...sourceForm,
          createdBy: "current-user", // Replace with actual user
        });

        if (result.success) {
          toast.success("Prospect source created successfully");
          setSourceDialogOpen(false);
          resetSourceForm();
        } else {
          toast.error(result.error || "Failed to create prospect source");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving prospect source");
    }
  };

  // Handle create/update status
  const handleSaveStatus = async () => {
    try {
      if (!statusForm.name.trim()) {
        toast.error("Status name is required");
        return;
      }

      if (editingStatus?.id) {
        const result = await updateProspectStatus(editingStatus.id, {
          ...statusForm,
          createdBy: "current-user", // Replace with actual user
        });

        if (result.success) {
          toast.success("Prospect status updated successfully");
          setStatusDialogOpen(false);
          resetStatusForm();
        } else {
          toast.error(result.error || "Failed to update prospect status");
        }
      } else {
        const result = await createProspectStatus({
          ...statusForm,
          createdBy: "current-user", // Replace with actual user
        });

        if (result.success) {
          toast.success("Prospect status created successfully");
          setStatusDialogOpen(false);
          resetStatusForm();
        } else {
          toast.error(result.error || "Failed to create prospect status");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving prospect status");
    }
  };

  // Handle save phone settings
  const handleSavePhoneSettings = async () => {
    try {
      const result = await createOrUpdatePhoneSettings({
        ...phoneForm,
        createdBy: "current-user", // Replace with actual user
      });

      if (result.success) {
        toast.success("Phone settings saved successfully");
        setPhoneDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to save phone settings");
      }
    } catch (error) {
      toast.error("An error occurred while saving phone settings");
    }
  };

  // Handle delete source
  const handleDeleteSource = async (id: string) => {
    try {
      const result = await deleteProspectSource(id);

      if (result.success) {
        toast.success("Prospect source deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete prospect source");
      }
    } catch (error) {
      toast.error("An error occurred while deleting prospect source");
    }
  };

  // Handle delete status
  const handleDeleteStatus = async (id: string) => {
    try {
      const result = await deleteProspectStatus(id);

      if (result.success) {
        toast.success("Prospect status deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete prospect status");
      }
    } catch (error) {
      toast.error("An error occurred while deleting prospect status");
    }
  };

  // Edit handlers
  const handleEditSource = (source: ProspectSource) => {
    setEditingSource(source);
    setSourceForm({
      name: source.name,
      description: source.description,
      isActive: source.isActive,
      color: source.color,
      priority: source.priority,
    });
    setSourceDialogOpen(true);
  };

  const handleEditStatus = (status: ProspectStatus) => {
    setEditingStatus(status);
    setStatusForm({
      name: status.name,
      isActive: status.isActive,
      color: status.color,
      priority: status.priority,
      isDefault: status.isDefault,
      nextActions: status.nextActions,
    });
    setStatusDialogOpen(true);
  };

  // Initialize data
  const handleInitializeData = async () => {
    try {
      const result = await initializeDefaultData();
      if (result.success) {
        toast.success("Default data initialized successfully");
      } else {
        toast.error(result.error || "Failed to initialize default data");
      }
    } catch (error) {
      toast.error("An error occurred while initializing data");
    }
  };

  // Working days handler
  const handleWorkingDayChange = (day: string, checked: boolean) => {
    setPhoneForm((prev) => ({
      ...prev,
      workingDays: checked
        ? [...prev.workingDays, day]
        : prev.workingDays.filter((d) => d !== day),
    }));
  };

  // Add action to status
  const addActionToStatus = () => {
    if (newAction.trim()) {
      setStatusForm((prev) => ({
        ...prev,
        nextActions: [...prev.nextActions, newAction.trim()],
      }));
      setNewAction("");
    }
  };

  // Remove action from status
  const removeActionFromStatus = (index: number) => {
    setStatusForm((prev) => ({
      ...prev,
      nextActions: prev.nextActions.filter((_, i) => i !== index),
    }));
  };

  // Add blacklisted number
  const addBlacklistedNumber = () => {
    if (newBlacklistedNumber.trim()) {
      setPhoneForm((prev) => ({
        ...prev,
        blacklistedNumbers: [
          ...prev.blacklistedNumbers,
          newBlacklistedNumber.trim(),
        ],
      }));
      setNewBlacklistedNumber("");
    }
  };

  // Remove blacklisted number
  const removeBlacklistedNumber = (index: number) => {
    setPhoneForm((prev) => ({
      ...prev,
      blacklistedNumbers: prev.blacklistedNumbers.filter((_, i) => i !== index),
    }));
  };

  // Add area code
  const addAreaCode = () => {
    if (newAreaCode.trim()) {
      setPhoneForm((prev) => ({
        ...prev,
        allowedAreaCodes: [...prev.allowedAreaCodes, newAreaCode.trim()],
      }));
      setNewAreaCode("");
    }
  };

  // Remove area code
  const removeAreaCode = (index: number) => {
    setPhoneForm((prev) => ({
      ...prev,
      allowedAreaCodes: prev.allowedAreaCodes.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading telemarketing settings...</span>
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
            Telemarketing Settings
          </h2>
          <p className="text-muted-foreground">
            Configure prospect sources, statuses, and phone settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleInitializeData} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Initialize Defaults
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prospect Sources
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getActiveProspectSources().length}
            </div>
            <p className="text-xs text-muted-foreground">Active sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prospect Statuses
            </CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getActiveProspectStatuses().length}
            </div>
            <p className="text-xs text-muted-foreground">Active statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Phone Settings
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {phoneSettings ? "✓" : "✗"}
            </div>
            <p className="text-xs text-muted-foreground">
              {phoneSettings ? "Configured" : "Not configured"}
            </p>
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

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="sources">Prospect Sources</TabsTrigger>
          <TabsTrigger value="statuses">Prospect Statuses</TabsTrigger>
          <TabsTrigger value="phone">Phone Settings</TabsTrigger>
          <TabsTrigger value="activities">Activity Log</TabsTrigger>
        </TabsList>

        {/* Prospect Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetSourceForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSource
                      ? "Edit Prospect Source"
                      : "Create Prospect Source"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure a new source for prospect acquisition
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sourceName">Source Name *</Label>
                    <Input
                      id="sourceName"
                      value={sourceForm.name}
                      onChange={(e) =>
                        setSourceForm({ ...sourceForm, name: e.target.value })
                      }
                      placeholder="Website Form, Social Media, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="sourceDescription">Description</Label>
                    <Textarea
                      id="sourceDescription"
                      value={sourceForm.description}
                      onChange={(e) =>
                        setSourceForm({
                          ...sourceForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe this prospect source"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sourceColor">Color</Label>
                      <Input
                        id="sourceColor"
                        type="color"
                        value={sourceForm.color}
                        onChange={(e) =>
                          setSourceForm({
                            ...sourceForm,
                            color: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="sourcePriority">Priority</Label>
                      <Input
                        id="sourcePriority"
                        type="number"
                        min="1"
                        value={sourceForm.priority}
                        onChange={(e) =>
                          setSourceForm({
                            ...sourceForm,
                            priority: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={sourceForm.isActive}
                      onCheckedChange={(checked) =>
                        setSourceForm({ ...sourceForm, isActive: checked })
                      }
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSourceDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSource}>
                    {editingSource ? "Update" : "Create"} Source
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
                    <TableHead>Source</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospectSources
                    .filter(
                      (source) =>
                        source.name
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        source.description
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .map((source) => (
                      <TableRow key={source.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: source.color }}
                            ></div>
                            <span className="font-medium">{source.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {source.description}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{source.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={source.isActive ? "default" : "secondary"}
                          >
                            {source.isActive ? "Active" : "Inactive"}
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
                                onClick={() => handleEditSource(source)}
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
                                      Delete Prospect Source
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      {source.name}"? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() =>
                                        handleDeleteSource(source.id || "")
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

        {/* Prospect Statuses Tab */}
        <TabsContent value="statuses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search statuses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetStatusForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Status
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingStatus
                      ? "Edit Prospect Status"
                      : "Create Prospect Status"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure a new status for prospect tracking
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="statusName">Status Name *</Label>
                      <Input
                        id="statusName"
                        value={statusForm.name}
                        onChange={(e) =>
                          setStatusForm({ ...statusForm, name: e.target.value })
                        }
                        placeholder="New Lead, Contacted, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="statusColor">Color</Label>
                      <Input
                        id="statusColor"
                        type="color"
                        value={statusForm.color}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            color: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="statusPriority">Priority</Label>
                      <Input
                        id="statusPriority"
                        type="number"
                        min="1"
                        value={statusForm.priority}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            priority: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Next Actions</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        value={newAction}
                        onChange={(e) => setNewAction(e.target.value)}
                        placeholder="Add action"
                        onKeyPress={(e) =>
                          e.key === "Enter" && addActionToStatus()
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addActionToStatus}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {statusForm.nextActions.map((action, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {action}
                          <button
                            type="button"
                            onClick={() => removeActionFromStatus(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={statusForm.isActive}
                        onCheckedChange={(checked) =>
                          setStatusForm({ ...statusForm, isActive: checked })
                        }
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={statusForm.isDefault}
                        onCheckedChange={(checked) =>
                          setStatusForm({ ...statusForm, isDefault: checked })
                        }
                      />
                      <Label>Default Status</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setStatusDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveStatus}>
                    {editingStatus ? "Update" : "Create"} Status
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
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospectStatuses
                    .filter((status) =>
                      status.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((status) => (
                      <TableRow key={status.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color }}
                            ></div>
                            <span className="font-medium">{status.name}</span>
                            {status.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{status.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status.isActive ? "default" : "secondary"}
                          >
                            {status.isActive ? "Active" : "Inactive"}
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
                                onClick={() => handleEditStatus(status)}
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
                                      Delete Prospect Status
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      {status.name}"? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() =>
                                        handleDeleteStatus(status.id || "")
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

        {/* Phone Settings Tab */}
        <TabsContent value="phone" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                Phone System Configuration
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure call limits, working hours, and phone system settings
              </p>
            </div>
            <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Phone Settings Configuration</DialogTitle>
                  <DialogDescription>
                    Configure phone system settings for telemarketing operations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Call Limits */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Call Limits</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="dailyLimit">Daily Call Limit</Label>
                        <Input
                          id="dailyLimit"
                          type="number"
                          min="1"
                          value={phoneForm.dailyCallLimit}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              dailyCallLimit: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="weeklyLimit">Weekly Call Limit</Label>
                        <Input
                          id="weeklyLimit"
                          type="number"
                          min="1"
                          value={phoneForm.weeklyCallLimit}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              weeklyCallLimit: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="monthlyLimit">Monthly Call Limit</Label>
                        <Input
                          id="monthlyLimit"
                          type="number"
                          min="1"
                          value={phoneForm.monthlyCallLimit}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              monthlyCallLimit: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Call Duration */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Call Duration (minutes)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minDuration">Minimum Duration</Label>
                        <Input
                          id="minDuration"
                          type="number"
                          min="1"
                          value={phoneForm.callDurationMin}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              callDurationMin: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxDuration">Maximum Duration</Label>
                        <Input
                          id="maxDuration"
                          type="number"
                          min="1"
                          value={phoneForm.callDurationMax}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              callDurationMax: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Working Hours</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={phoneForm.workingHours.start}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              workingHours: {
                                ...phoneForm.workingHours,
                                start: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={phoneForm.workingHours.end}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              workingHours: {
                                ...phoneForm.workingHours,
                                end: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={phoneForm.workingHours.timezone}
                          onValueChange={(value) =>
                            setPhoneForm({
                              ...phoneForm,
                              workingHours: {
                                ...phoneForm.workingHours,
                                timezone: value,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Jakarta">
                              Asia/Jakarta (WIB)
                            </SelectItem>
                            <SelectItem value="Asia/Makassar">
                              Asia/Makassar (WITA)
                            </SelectItem>
                            <SelectItem value="Asia/Jayapura">
                              Asia/Jayapura (WIT)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Working Days */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Working Days</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            checked={phoneForm.workingDays.includes(day)}
                            onCheckedChange={(checked) =>
                              handleWorkingDayChange(day, !!checked)
                            }
                          />
                          <Label className="text-sm">{day}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call Settings */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Call Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="callBackDelay">
                          Call Back Delay (minutes)
                        </Label>
                        <Input
                          id="callBackDelay"
                          type="number"
                          min="1"
                          value={phoneForm.callBackDelay}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              callBackDelay: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxAttempts">Max Call Attempts</Label>
                        <Input
                          id="maxAttempts"
                          type="number"
                          min="1"
                          max="10"
                          value={phoneForm.maxCallAttempts}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              maxCallAttempts: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={phoneForm.autoDialEnabled}
                          onCheckedChange={(checked) =>
                            setPhoneForm({
                              ...phoneForm,
                              autoDialEnabled: checked,
                            })
                          }
                        />
                        <Label>Auto Dial</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={phoneForm.autoNextCall}
                          onCheckedChange={(checked) =>
                            setPhoneForm({
                              ...phoneForm,
                              autoNextCall: checked,
                            })
                          }
                        />
                        <Label>Auto Next Call</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={phoneForm.recordCallsEnabled}
                          onCheckedChange={(checked) =>
                            setPhoneForm({
                              ...phoneForm,
                              recordCallsEnabled: checked,
                            })
                          }
                        />
                        <Label>Record Calls</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={phoneForm.voicemailDetection}
                          onCheckedChange={(checked) =>
                            setPhoneForm({
                              ...phoneForm,
                              voicemailDetection: checked,
                            })
                          }
                        />
                        <Label>Voicemail Detection</Label>
                      </div>
                    </div>
                  </div>

                  {/* Call Automation Settings */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Call Automation & Filters
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="callDelaySeconds">Call Delay (seconds)</Label>
                        <Input
                          id="callDelaySeconds"
                          type="number"
                          min="0"
                          max="60"
                          value={phoneForm.callDelaySeconds}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              callDelaySeconds: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Jeda waktu antar call otomatis
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="defaultStatusFilter">Default Status Filter</Label>
                        <Select
                          value={phoneForm.defaultStatusFilter}
                          onValueChange={(value) =>
                            setPhoneForm({
                              ...phoneForm,
                              defaultStatusFilter: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select default status" />
                          </SelectTrigger>
                          <SelectContent>
                            {prospectStatuses.map((status) => (
                              <SelectItem key={status.id} value={status.name}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: status.color }}
                                  />
                                  <span>{status.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 mt-4">
                      <div>
                        <Label htmlFor="defaultSourceFilter">Default Source Filter</Label>
                        <Select
                          value={phoneForm.defaultSourceFilter}
                          onValueChange={(value) =>
                            setPhoneForm({
                              ...phoneForm,
                              defaultSourceFilter: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select default source" />
                          </SelectTrigger>
                          <SelectContent>
                            {prospectSources.map((source) => (
                              <SelectItem key={source.id} value={source.name}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: source.color }}
                                  />
                                  <span>{source.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Caller ID Settings */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Caller ID Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="callerDisplayName">Display Name</Label>
                        <Input
                          id="callerDisplayName"
                          value={phoneForm.callerIdSettings.displayName}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              callerIdSettings: {
                                ...phoneForm.callerIdSettings,
                                displayName: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="callerPhoneNumber">Phone Number</Label>
                        <Input
                          id="callerPhoneNumber"
                          value={phoneForm.callerIdSettings.phoneNumber}
                          onChange={(e) =>
                            setPhoneForm({
                              ...phoneForm,
                              callerIdSettings: {
                                ...phoneForm.callerIdSettings,
                                phoneNumber: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={phoneForm.callerIdSettings.enabled}
                        onCheckedChange={(checked) =>
                          setPhoneForm({
                            ...phoneForm,
                            callerIdSettings: {
                              ...phoneForm.callerIdSettings,
                              enabled: checked,
                            },
                          })
                        }
                      />
                      <Label>Enable Caller ID</Label>
                    </div>
                  </div>

                  {/* Blacklisted Numbers */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Blacklisted Numbers
                    </h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <Input
                        value={newBlacklistedNumber}
                        onChange={(e) =>
                          setNewBlacklistedNumber(e.target.value)
                        }
                        placeholder="Add blacklisted number"
                        onKeyPress={(e) =>
                          e.key === "Enter" && addBlacklistedNumber()
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addBlacklistedNumber}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phoneForm.blacklistedNumbers.map((number, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {number}
                          <button
                            type="button"
                            onClick={() => removeBlacklistedNumber(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Allowed Area Codes */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Allowed Area Codes
                    </h4>
                    <div className="flex items-center space-x-2 mb-2">
                      <Input
                        value={newAreaCode}
                        onChange={(e) => setNewAreaCode(e.target.value)}
                        placeholder="Add area code"
                        onKeyPress={(e) => e.key === "Enter" && addAreaCode()}
                      />
                      <Button type="button" size="sm" onClick={addAreaCode}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phoneForm.allowedAreaCodes.map((code, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {code}
                          <button
                            type="button"
                            onClick={() => removeAreaCode(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPhoneDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSavePhoneSettings}>
                    Save Settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {phoneSettings ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Call Limits & Duration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Daily Limit:</span>
                    <Badge variant="outline">
                      {phoneSettings.dailyCallLimit} calls
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Weekly Limit:</span>
                    <Badge variant="outline">
                      {phoneSettings.weeklyCallLimit} calls
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Limit:</span>
                    <Badge variant="outline">
                      {phoneSettings.monthlyCallLimit} calls
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Call Duration:</span>
                    <Badge variant="outline">
                      {phoneSettings.callDurationMin}-
                      {phoneSettings.callDurationMax} min
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Working Schedule</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Working Hours:</span>
                    <Badge variant="outline">
                      {phoneSettings.workingHours.start} -{" "}
                      {phoneSettings.workingHours.end}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Timezone:</span>
                    <Badge variant="outline">
                      {phoneSettings.workingHours.timezone}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm">Working Days:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {phoneSettings.workingDays.map((day) => (
                        <Badge
                          key={day}
                          variant="secondary"
                          className="text-xs"
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Call Features</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Auto Dial:</span>
                    {phoneSettings.autoDialEnabled ? (
                      <Badge className="bg-green-500">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Call Recording:</span>
                    {phoneSettings.recordCallsEnabled ? (
                      <Badge className="bg-green-500">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Voicemail Detection:</span>
                    {phoneSettings.voicemailDetection ? (
                      <Badge className="bg-green-500">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max Attempts:</span>
                    <Badge variant="outline">
                      {phoneSettings.maxCallAttempts}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security & Restrictions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm">Blacklisted Numbers:</span>
                    <Badge variant="outline" className="ml-2">
                      {phoneSettings.blacklistedNumbers.length} numbers
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm">Allowed Area Codes:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {phoneSettings.allowedAreaCodes
                        .slice(0, 5)
                        .map((code) => (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="text-xs"
                          >
                            {code}
                          </Badge>
                        ))}
                      {phoneSettings.allowedAreaCodes.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{phoneSettings.allowedAreaCodes.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Caller ID:</span>
                    {phoneSettings.callerIdSettings.enabled ? (
                      <Badge className="bg-green-500">Enabled</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Phone Settings Configured
                </h3>
                <p className="text-muted-foreground mb-4">
                  Configure phone system settings to start telemarketing
                  operations
                </p>
                <Button onClick={() => setPhoneDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Now
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Track changes and activities in telemarketing settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRecentActivities().map((activity) => (
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
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.type.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {activity.action}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
