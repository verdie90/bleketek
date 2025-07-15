"use client";

import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Play,
  Search,
  Filter,
  FileText,
  Clock,
  User,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import {
  useTelemarketingScripts,
  ScriptsFilter,
} from "@/hooks/use-telemarketing-scripts";
import { ScriptEditorModal } from "@/components/script-editor-modal";

export default function TelemarketingScriptsPage() {
  const {
    scripts,
    loading,
    error,
    addScript,
    updateScript,
    deleteScript,
    incrementUsage,
    filterScripts,
    getAllTags,
  } = useTelemarketingScripts();

  const [currentFilter, setCurrentFilter] = useState<ScriptsFilter>({});
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Apply filters to scripts
  const filteredScripts = useMemo(() => {
    const filter = { ...currentFilter };
    if (searchTerm) {
      filter.search = searchTerm;
    }
    return filterScripts(filter);
  }, [scripts, currentFilter, searchTerm, filterScripts]);

  // Get available tags
  const allTags = getAllTags();

  // Handle script operations
  const handleAddScript = () => {
    setEditingScript(null);
    setIsEditorModalOpen(true);
  };

  const handleEditScript = (script: any) => {
    setEditingScript(script);
    setIsEditorModalOpen(true);
  };

  const handleSaveScript = async (data: any) => {
    let result;
    if (editingScript) {
      result = await updateScript(editingScript.id, data);
    } else {
      result = await addScript(data);
    }

    if (result.success) {
      setIsEditorModalOpen(false);
      setEditingScript(null);
    }
    return result;
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (confirm("Are you sure you want to delete this script?")) {
      await deleteScript(scriptId);
    }
  };

  const handleUseScript = async (scriptId: string) => {
    await incrementUsage(scriptId);
    // Here you could implement copying to clipboard or other usage functionality
  };

  const handleDuplicateScript = async (script: any) => {
    const duplicateData = {
      title: `${script.title} (Copy)`,
      description: script.description,
      content: script.content,
      tags: script.tags,
      isActive: true,
    };
    await addScript(duplicateData);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = scripts.length;
    const active = scripts.filter((s) => s.isActive).length;
    const totalUsage = scripts.reduce(
      (sum, script) => sum + (script.usageCount || 0),
      0
    );

    return { total, active, totalUsage };
  }, [scripts]);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading scripts...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/telemarketing">
                    Telemarketing
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Scripts</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Scripts
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Scripts
                </CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.active / stats.total) * 100)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Usage
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsage}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.active > 0
                    ? Math.round(stats.totalUsage / stats.active)
                    : 0}
                  avg per script
                </p>
              </CardContent>
            </Card>
          </div>
          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Telemarketing Scripts</CardTitle>
                  <CardDescription>
                    Manage your telemarketing scripts and templates
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleAddScript}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Script
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search scripts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select
                    value={currentFilter.isActive?.toString() || "all"}
                    onValueChange={(value) =>
                      setCurrentFilter({
                        ...currentFilter,
                        isActive:
                          value === "all" ? undefined : value === "true",
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scripts Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredScripts.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No scripts found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || Object.keys(currentFilter).length > 0
                        ? "No scripts match your current filters."
                        : "Get started by creating your first script."}
                    </p>
                    <Button onClick={handleAddScript}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Script
                    </Button>
                  </div>
                ) : (
                  filteredScripts.map((script) => (
                    <Card key={script.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-2">
                              {script.title}
                            </CardTitle>
                            {script.description && (
                              <CardDescription className="mt-1 line-clamp-2">
                                {script.description}
                              </CardDescription>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleUseScript(script.id!)}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Use Script
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditScript(script)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicateScript(script)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteScript(script.id!)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            variant={script.isActive ? "default" : "secondary"}
                          >
                            {script.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {script.usageCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Used {script.usageCount}x
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {script.tags && script.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {script.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {script.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{script.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground space-y-1">
                            {script.lastUpdated &&
                              script.lastUpdated.toDate && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Updated{" "}
                                  {format(
                                    script.lastUpdated.toDate(),
                                    "MMM dd, yyyy"
                                  )}
                                </div>
                              )}
                            {script.lastUsed && script.lastUsed.toDate && (
                              <div className="flex items-center gap-1">
                                <Play className="h-3 w-3" />
                                Last used{" "}
                                {format(
                                  script.lastUsed.toDate(),
                                  "MMM dd, yyyy"
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>{" "}
          {/* Script Editor Modal */}
          <ScriptEditorModal
            open={isEditorModalOpen}
            onOpenChange={(open) => {
              setIsEditorModalOpen(open);
              if (!open) setEditingScript(null);
            }}
            onSave={handleSaveScript}
            script={editingScript}
            allTags={allTags}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
