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
  Upload,
  Download,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FileSpreadsheet,
  FileText,
  Phone,
  User,
  Calendar,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { useProspects, ProspectsFilter } from "@/hooks/use-prospects";
import { ProspectsFilters, BulkActions } from "@/components/prospects-filters";
import { ImportExcelModal } from "@/components/import-excel-modal";
import { AddEditProspectModal } from "@/components/add-edit-prospect-modal";
import { exportToExcel, exportToPDF, ExportHelper } from "@/lib/export-utils";

export default function TelemarketingProspectsPage() {
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

  // Debug: Log prospects with lastContactDate
  useEffect(() => {
    const prospectsWithLastContact = prospects.filter((p) => p.lastContactDate);

    // Debug: Log prospects with assignedTo
    const prospectsWithAssignment = prospects.filter((p) => p.assignedTo);
  }, [prospects, users]);

  // Helper functions to get labels from database
  const getStatusLabel = (statusName: string) => {
    // Since prospects now store names directly, just return the name
    // But still try to find the status for color/validation
    const status = prospectStatuses.find((s) => s.name === statusName);
    return status ? status.name : statusName;
  };

  const getSourceLabel = (sourceName: string) => {
    // Since prospects now store names directly, just return the name
    // But still try to find the source for color/validation
    const source = prospectSources.find((s) => s.name === sourceName);
    return source ? source.name : sourceName;
  };

  const getStatusColor = (statusName: string) => {
    const status = prospectStatuses.find((s) => s.name === statusName);
    return status ? "default" : "secondary";
  };

  const getAssignedToLabel = (userId: string) => {
    if (!userId) return "Unassigned";

    const user = users.find((u) => u.id === userId);
    if (!user) {
      console.warn("⚠️ User not found for ID:", userId);
      return `Unknown User (${userId})`;
    }

    return user.displayName || user.email || userId;
  };

  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [currentFilter, setCurrentFilter] = useState<ProspectsFilter>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Apply filters to prospects, then sort by lastContactDate descending
  const filteredProspects = useMemo(() => {
    const filtered = filterProspects(currentFilter);
    return filtered.slice().sort((a, b) => {
      const aDate = a.lastContactDate?.toDate?.()
        ? a.lastContactDate.toDate().getTime()
        : 0;
      const bDate = b.lastContactDate?.toDate?.()
        ? b.lastContactDate.toDate().getTime()
        : 0;
      return bDate - aDate;
    });
  }, [prospects, currentFilter, filterProspects]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProspects = filteredProspects.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  const handleFilterChange = (filter: ProspectsFilter) => {
    setCurrentFilter(filter);
    setCurrentPage(1);
    setSelectedProspects([]);
  };

  // Reset to first page when items per page changes
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
    setSelectedProspects([]);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProspects(paginatedProspects.map((p) => p.id!));
    } else {
      setSelectedProspects([]);
    }
  };

  // Handle individual selection
  const handleSelectProspect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProspects([...selectedProspects, id]);
    } else {
      setSelectedProspects(selectedProspects.filter((pid) => pid !== id));
    }
  };

  // Handle bulk operations
  const handleBulkUpdate = async (updateData: any) => {
    const result = await bulkUpdateProspects(selectedProspects, updateData);
    if (result.success) {
      setSelectedProspects([]);
    }
  };

  const handleBulkDelete = async () => {
    const result = await bulkDeleteProspects(selectedProspects);
    if (result.success) {
      setSelectedProspects([]);
    }
  };

  // Handle export
  const handleExportExcel = () => {
    const exportHelper: ExportHelper = {
      getStatusLabel,
      getSourceLabel,
      getAssignedToLabel,
    };
    exportToExcel(filteredProspects, exportHelper);
  };

  const handleExportPDF = () => {
    const exportHelper: ExportHelper = {
      getStatusLabel,
      getSourceLabel,
      getAssignedToLabel,
    };
    exportToPDF(filteredProspects, exportHelper);
  };

  // Handle import
  const handleImport = async (
    data: Array<{ name: string; phoneNumber: string }>,
    options: {
      source: any;
      status: any;
      assignedTo?: string;
      tags: string[];
      skipDuplicates: boolean;
    }
  ) => {
    const result = await importProspects(data, options);
    if (result.success) {
      setIsImportModalOpen(false);
    }
    return result;
  };

  // Handle add/edit prospect
  const handleEditProspect = (prospect: any) => {
    setEditingProspect(prospect);
    setIsAddEditModalOpen(true);
  };

  const handleAddProspect = () => {
    setEditingProspect(null);
    setIsAddEditModalOpen(true);
  };

  const handleSaveProspect = async (data: any) => {
    let result;
    if (editingProspect) {
      // Always update lastContactDate when editing
      result = await updateProspect(editingProspect.id, {
        ...data,
        lastContactDate: Timestamp.now(),
      });
    } else {
      result = await addProspect(data);
    }

    if (result.success) {
      setIsAddEditModalOpen(false);
      setEditingProspect(null);
    }
    return result;
  };

  // Calculate statistics based on filteredProspects (which includes all active filters)
  const stats = useMemo(() => {
    const total = filteredProspects.length;
    // Anggap status respon bisa berupa 'contacted', 'responded', 'respon' (case-insensitive)
    const responded = filteredProspects.filter((p) => {
      const status = (p.status || "").toLowerCase();
      return (
        status.includes("respon") ||
        status === "contacted" ||
        status === "responded"
      );
    }).length;
    const callback = filteredProspects.filter((p) => {
      const status = (p.status || "").toLowerCase();
      return (
        status.includes("callback") ||
        status.includes("janji") ||
        status === "follow_up"
      );
    }).length;
    const notInterested = filteredProspects.filter((p) => {
      const status = (p.status || "").toLowerCase();
      return (
        status.includes("tidak minat") ||
        status.includes("tidak tertarik") ||
        status === "not_interested" ||
        status === "not interested"
      );
    }).length;

    return { total, responded, callback, notInterested };
  }, [filteredProspects]);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading prospects...</div>
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
                  <BreadcrumbPage>Prospects</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Prospects
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Respon</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.responded}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.responded / stats.total) * 100)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Callback</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.callback}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.callback / stats.total) * 100)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tidak Minat
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.notInterested}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.notInterested / stats.total) * 100)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Telemarketing Prospects</CardTitle>
                  <CardDescription>
                    Manage your telemarketing prospects and track their status
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {/* Export buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>

                  {/* Import button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Excel
                  </Button>

                  {/* Add prospect button */}
                  <Button size="sm" onClick={handleAddProspect}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Prospect
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="mb-6">
                <ProspectsFilters
                  currentFilter={currentFilter}
                  onFilterChange={handleFilterChange}
                />
              </div>
              {/* Bulk Actions */}
              {selectedProspects.length > 0 && (
                <div className="mb-4">
                  <BulkActions
                    selectedProspects={selectedProspects}
                    onBulkUpdate={handleBulkUpdate}
                    onBulkDelete={handleBulkDelete}
                  />
                </div>
              )}
              {/* Pagination Info and Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing{" "}
                    {filteredProspects.length === 0 ? 0 : startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredProspects.length)} of{" "}
                    {filteredProspects.length} prospects
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Rows per page:
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Table */}
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
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Next Follow Up</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProspects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          {currentFilter &&
                          Object.keys(currentFilter).length > 0
                            ? "No prospects found matching your filters."
                            : "No prospects found. Add your first prospect to get started."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProspects.map((prospect) => (
                        <TableRow key={prospect.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProspects.includes(prospect.id!)}
                              onCheckedChange={(checked) =>
                                handleSelectProspect(prospect.id!, !!checked)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {prospect.name}
                          </TableCell>
                          <TableCell>
                            {prospect.phone || prospect.phoneNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(prospect.status)}>
                              {getStatusLabel(prospect.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getSourceLabel(prospect.source)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const assignedTo = prospect.assignedTo || "";
                              const label = getAssignedToLabel(assignedTo);

                              if (!assignedTo) {
                                return (
                                  <Badge
                                    variant="secondary"
                                    className="text-muted-foreground"
                                  >
                                    Unassigned
                                  </Badge>
                                );
                              }

                              if (label.startsWith("Unknown User")) {
                                return (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    {label}
                                  </Badge>
                                );
                              }

                              return <Badge variant="outline">{label}</Badge>;
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              if (prospect.lastContactDate) {
                                try {
                                  return format(
                                    prospect.lastContactDate.toDate(),
                                    "MMM dd, yyyy"
                                  );
                                } catch (error) {
                                  return "Invalid Date";
                                }
                              }
                              return "-";
                            })()}
                          </TableCell>
                          <TableCell>
                            {prospect.nextFollowUpDate
                              ? format(
                                  prospect.nextFollowUpDate.toDate(),
                                  "MMM dd, yyyy"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {prospect.tags?.slice(0, 2).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {(prospect.tags?.length || 0) > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(prospect.tags?.length || 0) - 2}
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
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditProspect(prospect)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteProspect(prospect.id!)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
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
                <div className="flex items-center justify-center mt-4">
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

                      {/* First page */}
                      {currentPage > 3 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(1)}
                              className="cursor-pointer"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 4 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}

                      {/* Page numbers around current page */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page >= Math.max(1, currentPage - 2) &&
                            page <= Math.min(totalPages, currentPage + 2)
                          );
                        })
                        .map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={page === currentPage}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                      {/* Last page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(totalPages)}
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
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
              )}
              {/* Pagination could go here */}
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <ImportExcelModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onImport={handleImport}
        />

        <AddEditProspectModal
          open={isAddEditModalOpen}
          onOpenChange={(open) => {
            setIsAddEditModalOpen(open);
            if (!open) setEditingProspect(null);
          }}
          onSave={handleSaveProspect}
          prospect={editingProspect}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
