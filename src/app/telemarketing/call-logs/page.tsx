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
  Dialog,
  DialogContent,
  DialogDescription,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileSpreadsheet,
  FileText,
  Phone,
  User,
  Calendar as CalendarIcon,
  Clock,
  MoreHorizontal,
  Eye,
  Download,
  Filter,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCallLogs, CallLogsFilter } from "@/hooks/use-call-logs";
import { CallLogsFilters } from "@/components/call-logs-filters";
import { exportCallLogsToExcel, exportCallLogsToPDF } from "@/lib/export-utils";

export default function CallLogsPage() {
  const {
    callLogs,
    loading,
    error,
    filterCallLogs,
    deleteCallLog,
    users,
    prospects,
  } = useCallLogs();

  const [selectedCallLogs, setSelectedCallLogs] = useState<string[]>([]);
  const [currentFilter, setCurrentFilter] = useState<CallLogsFilter>({});
  const [selectedCallLog, setSelectedCallLog] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Delete by date range states
  const [isDeleteRangeModalOpen, setIsDeleteRangeModalOpen] = useState(false);
  const [deleteFromDate, setDeleteFromDate] = useState<Date | undefined>();
  const [deleteToDate, setDeleteToDate] = useState<Date | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Apply filters to call logs
  const filteredCallLogs = useMemo(() => {
    return filterCallLogs(currentFilter);
  }, [callLogs, currentFilter, filterCallLogs]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCallLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCallLogs = filteredCallLogs.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  const handleFilterChange = (filter: CallLogsFilter) => {
    setCurrentFilter(filter);
    setCurrentPage(1);
    setSelectedCallLogs([]);
  };

  // Reset to first page when items per page changes
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
    setSelectedCallLogs([]);
  };

  // Helper functions
  const getUserLabel = (callLog: any) => {
    const userId = callLog.agentId || callLog.userId;
    if (!userId) return "Unknown User";
    const user = users.find((u: any) => u.id === userId);
    return user ? user.displayName : userId;
  };

  const getProspectLabel = (callLog: any) => {
    // First try to use prospectName from callLog
    if (callLog.prospectName) {
      return callLog.prospectName;
    }
    // Fallback to finding prospect by ID
    const prospect = prospects.find((p: any) => p.id === callLog.prospectId);
    return prospect ? prospect.name : "Unknown Prospect";
  };

  const getPhoneNumber = (callLog: any) => {
    return callLog.phoneNumber || callLog.prospectPhone || callLog.maskedPhone || "-";
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "missed":
        return "destructive";
      case "busy":
        return "secondary";
      case "no_answer":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getCallStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "missed":
        return "Missed";
      case "busy":
        return "Busy";
      case "no_answer":
        return "No Answer";
      default:
        return status;
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Handle export
  const handleExportExcel = () => {
    exportCallLogsToExcel(filteredCallLogs, {
      getAgentLabel: (userId) => getUserLabel({ agentId: userId, userId }),
      getProspectLabel: (prospectId) => getProspectLabel({ prospectId }),
    }, "call-logs");
  };

  const handleExportPDF = () => {
    exportCallLogsToPDF(filteredCallLogs, {
      getAgentLabel: (userId) => getUserLabel({ agentId: userId, userId }),
      getProspectLabel: (prospectId) => getProspectLabel({ prospectId }),
    }, "call-logs");
  };

  const handleViewDetails = (callLog: any) => {
    setSelectedCallLog(callLog);
    setIsDetailModalOpen(true);
  };

  // Handle delete by date range
  const handleDeleteByDateRange = async () => {
    if (!deleteFromDate || !deleteToDate) {
      alert("Please select both start and end dates");
      return;
    }

    if (deleteFromDate > deleteToDate) {
      alert("Start date cannot be after end date");
      return;
    }

    setIsDeleting(true);

    try {
      // Filter call logs within the date range
      const logsToDelete = callLogs.filter((log: any) => {
        if (!log.createdAt) return false;
        
        const logDate = log.createdAt.toDate();
        const startOfDay = new Date(deleteFromDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(deleteToDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        return logDate >= startOfDay && logDate <= endOfDay;
      });

      if (logsToDelete.length === 0) {
        alert("No call logs found in the selected date range");
        setIsDeleting(false);
        return;
      }

      // Confirm deletion
      const confirmMessage = `Are you sure you want to delete ${logsToDelete.length} call logs from ${format(deleteFromDate, "MMM dd, yyyy")} to ${format(deleteToDate, "MMM dd, yyyy")}? This action cannot be undone.`;
      
      if (!confirm(confirmMessage)) {
        setIsDeleting(false);
        return;
      }

      // Delete all logs in the date range
      let successCount = 0;
      let errorCount = 0;

      for (const log of logsToDelete) {
        if (log.id) {
          const result = await deleteCallLog(log.id);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to delete call log ${log.id}:`, result.error);
          }
        }
      }

      // Show result
      if (successCount > 0) {
        alert(`Successfully deleted ${successCount} call logs${errorCount > 0 ? `. Failed to delete ${errorCount} logs.` : '.'}`);
      } else {
        alert("Failed to delete any call logs. Please try again.");
      }

      // Reset form
      setDeleteFromDate(undefined);
      setDeleteToDate(undefined);
      setIsDeleteRangeModalOpen(false);

    } catch (error) {
      console.error("Error deleting call logs:", error);
      alert("An error occurred while deleting call logs. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCallLogsInDateRange = () => {
    if (!deleteFromDate || !deleteToDate) return 0;
    
    return callLogs.filter((log: any) => {
      if (!log.createdAt) return false;
      
      const logDate = log.createdAt.toDate();
      const startOfDay = new Date(deleteFromDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(deleteToDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      return logDate >= startOfDay && logDate <= endOfDay;
    }).length;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredCallLogs.length;
    const completed = filteredCallLogs.filter((log: any) => log.status === "completed").length;
    const missed = filteredCallLogs.filter((log: any) => log.status === "missed").length;
    const totalDuration = filteredCallLogs.reduce((sum: number, log: any) => sum + (log.duration || 0), 0);
    const avgDuration = completed > 0 ? Math.round(totalDuration / completed) : 0;

    return { total, completed, missed, totalDuration, avgDuration };
  }, [filteredCallLogs]);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-lg">Loading call logs...</div>
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
                  <BreadcrumbPage>Call Logs</BreadcrumbPage>
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
                  Total Calls
                </CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0}
                  % success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Missed Calls
                </CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.missed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0
                    ? Math.round((stats.missed / stats.total) * 100)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
                <p className="text-xs text-muted-foreground">
                  Total: {formatDuration(stats.totalDuration)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Call Logs</CardTitle>
                  <CardDescription>
                    View and manage all telemarketing call logs
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {/* Delete by date range button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteRangeModalOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete by Date Range
                  </Button>

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
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="mb-6">
                <CallLogsFilters
                  currentFilter={currentFilter}
                  onFilterChange={handleFilterChange}
                />
              </div>

              {/* Pagination Info and Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing{" "}
                    {filteredCallLogs.length === 0 ? 0 : startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredCallLogs.length)} of{" "}
                    {filteredCallLogs.length} call logs
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
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Prospect</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Disposition</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCallLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          {currentFilter &&
                          Object.keys(currentFilter).length > 0
                            ? "No call logs found matching your filters."
                            : "No call logs found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCallLogs.map((callLog: any) => (
                        <TableRow key={callLog.id}>
                          <TableCell>
                            {callLog.createdAt
                              ? format(
                                  callLog.createdAt.toDate(),
                                  "MMM dd, yyyy HH:mm"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {getUserLabel(callLog)}
                          </TableCell>
                          <TableCell>
                            {getProspectLabel(callLog)}
                          </TableCell>
                          <TableCell>{getPhoneNumber(callLog)}</TableCell>
                          <TableCell>
                            <Badge variant={getCallStatusColor(callLog.status)}>
                              {getCallStatusLabel(callLog.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDuration(callLog.duration || 0)}
                          </TableCell>
                          <TableCell>
                            {callLog.disposition ? (
                              <Badge variant="outline" className="text-xs">
                                {callLog.disposition}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {callLog.notes || "-"}
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
                                  onClick={() => handleViewDetails(callLog)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
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
            </CardContent>
          </Card>
        </div>

        {/* Call Log Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Call Log Details</DialogTitle>
              <DialogDescription>
                Detailed information about this call
              </DialogDescription>
            </DialogHeader>
            
            {selectedCallLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date & Time</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedCallLog.createdAt
                        ? format(
                            selectedCallLog.createdAt.toDate(),
                            "MMM dd, yyyy HH:mm:ss"
                          )
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Agent</label>
                    <p className="text-sm text-muted-foreground">
                      {getUserLabel(selectedCallLog)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Prospect</label>
                    <p className="text-sm text-muted-foreground">
                      {getProspectLabel(selectedCallLog)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <p className="text-sm text-muted-foreground">
                      {getPhoneNumber(selectedCallLog)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <p className="text-sm text-muted-foreground">
                      <Badge variant={getCallStatusColor(selectedCallLog.status)}>
                        {getCallStatusLabel(selectedCallLog.status)}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration</label>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(selectedCallLog.duration || 0)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      {selectedCallLog.notes || "No notes available"}
                    </p>
                  </div>
                </div>

                {selectedCallLog.disposition && (
                  <div>
                    <label className="text-sm font-medium">Disposition</label>
                    <p className="text-sm text-muted-foreground">
                      {selectedCallLog.disposition}
                    </p>
                  </div>
                )}

                {selectedCallLog.recordingUrl && (
                  <div>
                    <label className="text-sm font-medium">Recording</label>
                    <div className="mt-1">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download Recording
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete by Date Range Modal */}
        <Dialog open={isDeleteRangeModalOpen} onOpenChange={setIsDeleteRangeModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete Call Logs by Date Range
              </DialogTitle>
              <DialogDescription>
                Select a date range to delete all call logs within that period. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deleteFromDate">From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deleteFromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deleteFromDate
                          ? format(deleteFromDate, "MMM dd, yyyy")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deleteFromDate}
                        onSelect={setDeleteFromDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="deleteToDate">To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deleteToDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deleteToDate
                          ? format(deleteToDate, "MMM dd, yyyy")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deleteToDate}
                        onSelect={setDeleteToDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {deleteFromDate && deleteToDate && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <strong>{getCallLogsInDateRange()}</strong> call logs will be deleted from{" "}
                    <strong>{format(deleteFromDate, "MMM dd, yyyy")}</strong> to{" "}
                    <strong>{format(deleteToDate, "MMM dd, yyyy")}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteRangeModalOpen(false);
                    setDeleteFromDate(undefined);
                    setDeleteToDate(undefined);
                  }}
                  className="flex-1"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteByDateRange}
                  className="flex-1"
                  disabled={!deleteFromDate || !deleteToDate || isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
