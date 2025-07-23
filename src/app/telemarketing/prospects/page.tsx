"use client";

import { useState, useMemo, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  MoreHorizontal,
  Plus,
  Upload,
  Search,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  Phone,
  Mail,
  FileText,
  Eye,
  Calendar,
  Tag,
} from "lucide-react";
import { format as formatDate } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { useProspects, ProspectsFilter } from "@/hooks/use-prospects";
import { ProspectsFilters, BulkActions } from "@/components/prospects-filters";
import { ImportExcelModal } from "@/components/import-excel-modal";
import { AddEditProspectModal } from "@/components/add-edit-prospect-modal";
import { exportToExcel, exportToPDF, ExportHelper } from "@/lib/export-utils";
import { TablePageSkeleton } from "@/components/ui/page-skeletons";
import { usePageLoading } from "@/hooks/use-page-loading";

export default function TelemarketingProspectsPage() {
  // ALL HOOKS MUST BE AT THE TOP - NEVER CONDITIONAL
  const isPageLoading = usePageLoading(1000);
  const {
    prospects,
    loading,
    error,
    addProspect,
    updateProspect,
    deleteProspect,
    bulkUpdateProspects,
    bulkDeleteProspects,
    importProspects,
    filterProspects,
    prospectSources,
    prospectStatuses,
    users,
  } = useProspects();

  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [currentFilter, setCurrentFilter] = useState<ProspectsFilter>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // useEffect hooks
  useEffect(() => {
    if (prospects.length > 0) {
      console.log("📊 Total prospects loaded:", prospects.length);
    }
  }, [prospects]);

  // useMemo hooks
  const filteredProspects = useMemo(() => {
    if (!prospects || prospects.length === 0) return [];
    return filterProspects(currentFilter);
  }, [prospects, currentFilter, filterProspects]);

  const paginatedProspects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProspects.slice(startIndex, endIndex);
  }, [filteredProspects, currentPage, itemsPerPage]);

  const stats = useMemo(() => {
    const total = filteredProspects.length;
    const pending = filteredProspects.filter((p) => p.status === "pending").length;
    const contacted = filteredProspects.filter((p) => p.status === "contacted").length;
    const qualified = filteredProspects.filter((p) => p.status === "qualified").length;
    const converted = filteredProspects.filter((p) => p.status === "converted").length;
    const rejected = filteredProspects.filter((p) => p.status === "rejected").length;

    return { total, pending, contacted, qualified, converted, rejected };
  }, [filteredProspects]);

  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);

  // Early return AFTER all hooks
  if (isPageLoading || loading) {
    return <TablePageSkeleton />;
  }

  // Helper functions
  const getStatusLabel = (statusName: string) => {
    const status = prospectStatuses.find((s) => s.name === statusName);
    return status ? status.name : statusName;
  };

  const getSourceLabel = (sourceName: string) => {
    const source = prospectSources.find((s) => s.name === sourceName);
    return source ? source.name : sourceName;
  };

  const getStatusColor = (statusName: string) => {
    const status = prospectStatuses.find((s) => s.name === statusName);
    return status ? "default" : "secondary";
  };

  const getAssignedToLabel = (userId?: string) => {
    if (!userId) return "Unassigned";
    const user = users.find((u) => u.id === userId);
    return user ? user.displayName || user.email : "User tidak ditemukan";
  };

  // Event handlers
  const handleFilterChange = (filter: ProspectsFilter) => {
    setCurrentFilter(filter);
    setCurrentPage(1);
    setSelectedProspects([]);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
    setSelectedProspects([]);
  };

  const handleSelectAll = () => {
    if (selectedProspects.length === paginatedProspects.length) {
      setSelectedProspects([]);
    } else {
      setSelectedProspects(paginatedProspects.map((p) => p.id!));
    }
  };

  const handleSelectProspect = (id: string) => {
    setSelectedProspects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedProspects.length === 0) return;

    try {
      if (action === "delete") {
        await bulkDeleteProspects(selectedProspects);
      } else {
        await bulkUpdateProspects(selectedProspects, data);
      }
      setSelectedProspects([]);
    } catch (error) {
      console.error("Bulk action failed:", error);
    }
  };

  const handleAddProspect = () => {
    setEditingProspect(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditProspect = (prospect: any) => {
    setEditingProspect(prospect);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteProspect = async (id: string) => {
    if (confirm("Yakin ingin menghapus prospect ini?")) {
      await deleteProspect(id);
    }
  };

  const handleExport = (format: "excel" | "pdf") => {
    console.log("Export to", format, "with", filteredProspects.length, "prospects");
    // Export functionality will be implemented later
  };

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
                  <BreadcrumbLink href="#">Telemarketing</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Prospects</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Total prospects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.pending / stats.total) * 100)
                    : 0}
                  % dari total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacted</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.contacted}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.contacted / stats.total) * 100)
                    : 0}
                  % dari total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualified</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.qualified}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.qualified / stats.total) * 100)
                    : 0}
                  % dari total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Converted</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.converted}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.converted / stats.total) * 100)
                    : 0}
                  % dari total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.rejected / stats.total) * 100)
                    : 0}
                  % dari total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between">
            <ProspectsFilters
              onFilterChange={handleFilterChange}
              currentFilter={currentFilter}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    Export to PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddProspect}>
                <Plus className="h-4 w-4 mr-2" />
                Add Prospect
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProspects.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedProspects.length} prospects selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction("delete")}
                  >
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Prospects ({filteredProspects.length})</CardTitle>
              <CardDescription>
                Manage your prospect database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            paginatedProspects.length > 0 &&
                            selectedProspects.length ===
                              paginatedProspects.length &&
                            paginatedProspects.every((p) =>
                              selectedProspects.includes(p.id!)
                            )
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProspects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="text-muted-foreground">
                            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No prospects found</p>
                            <p className="text-sm">
                              Add your first prospect to get started
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProspects.map((prospect) => (
                        <TableRow key={prospect.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProspects.includes(prospect.id!)}
                              onCheckedChange={() =>
                                handleSelectProspect(prospect.id!)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{prospect.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span className="text-sm">{prospect.phoneNumber}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(prospect.status)}>
                              {getStatusLabel(prospect.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{getSourceLabel(prospect.source)}</TableCell>
                          <TableCell>
                            {getAssignedToLabel(prospect.assignedTo)}
                          </TableCell>
                          <TableCell>
                            {prospect.lastContactDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="text-sm">
                                  {formatDate(
                                    prospect.lastContactDate.toDate(),
                                    "dd/MM/yyyy HH:mm"
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Never contacted
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {prospect.tags?.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {prospect.tags && prospect.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{prospect.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => handleEditProspect(prospect)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteProspect(prospect.id!)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={pageSize.toString()}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage(Math.min(totalPages, currentPage + 1))
                            }
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      {/* Modals */}
      <ImportExcelModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={importProspects}
      />      <AddEditProspectModal
        open={isAddEditModalOpen}
        onOpenChange={setIsAddEditModalOpen}
        onSave={editingProspect ?
          (data) => updateProspect(editingProspect.id, data) :
          addProspect
        }
        prospect={editingProspect}
      />
    </SidebarProvider>
  );
}
