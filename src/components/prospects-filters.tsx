"use client";

import { useState } from "react";
import { CalendarIcon, Filter, Download, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Prospect, ProspectsFilter } from "@/hooks/use-prospects";
import { useTelemarketingSettings } from "@/hooks/use-telemarketing-settings";
import { useUserManagement } from "@/hooks/use-user-management-db";

interface ProspectsFiltersProps {
  onFilterChange: (filter: ProspectsFilter) => void;
  currentFilter: ProspectsFilter;
}

interface BulkActionsProps {
  selectedProspects: string[];
  onBulkUpdate: (updateData: Partial<Prospect>) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  disabled?: boolean;
}

export function ProspectsFilters({
  onFilterChange,
  currentFilter,
}: ProspectsFiltersProps) {
  const { getActiveProspectSources, getActiveProspectStatuses } =
    useTelemarketingSettings();
  const { users } = useUserManagement();

  // Get database options
  const statusOptions = getActiveProspectStatuses().map((status) => ({
    value: status.id!,
    label: status.name,
  }));

  const sourceOptions = getActiveProspectSources().map((source) => ({
    value: source.id!,
    label: source.name,
  }));

  const assignedToOptions = users
    .filter((user) => user.isActive)
    .map((user) => ({
      value: user.id!,
      label: user.displayName,
    }));
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: currentFilter.dateRange?.start,
    end: currentFilter.dateRange?.end,
  });

  const handleStatusChange = (value: string, checked: boolean) => {
    const currentStatus = currentFilter.status || [];
    const newStatus = checked
      ? [...currentStatus, value]
      : currentStatus.filter((s) => s !== value);

    onFilterChange({ ...currentFilter, status: newStatus });
  };

  const handleSourceChange = (value: string, checked: boolean) => {
    const currentSource = currentFilter.source || [];
    const newSource = checked
      ? [...currentSource, value]
      : currentSource.filter((s) => s !== value);

    onFilterChange({ ...currentFilter, source: newSource });
  };

  const handleAssignedToChange = (value: string, checked: boolean) => {
    const currentAssignedTo = currentFilter.assignedTo || [];
    const newAssignedTo = checked
      ? [...currentAssignedTo, value]
      : currentAssignedTo.filter((a) => a !== value);

    onFilterChange({ ...currentFilter, assignedTo: newAssignedTo });
  };

  const handleDateRangeChange = () => {
    if (dateRange.start && dateRange.end) {
      onFilterChange({
        ...currentFilter,
        dateRange: { start: dateRange.start, end: dateRange.end },
      });
    }
  };

  const clearFilters = () => {
    setDateRange({ start: undefined, end: undefined });
    onFilterChange({});
  };

  const activeFiltersCount = [
    currentFilter.status?.length || 0,
    currentFilter.source?.length || 0,
    currentFilter.assignedTo?.length || 0,
    currentFilter.dateRange ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Prospects</DialogTitle>
          <DialogDescription>
            Apply filters to narrow down the prospects list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, phone, or tags..."
              value={currentFilter.searchTerm || ""}
              onChange={(e) =>
                onFilterChange({ ...currentFilter, searchTerm: e.target.value })
              }
            />
          </div>

          {/* Status Filter */}
          <div>
            <Label className="text-base font-medium">Status</Label>
            <div className="space-y-2 mt-2">
              {statusOptions.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={
                      currentFilter.status?.includes(status.value) || false
                    }
                    onCheckedChange={(checked) =>
                      handleStatusChange(status.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`status-${status.value}`}>
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <Label className="text-base font-medium">Source</Label>
            <div className="space-y-2 mt-2">
              {sourceOptions.map((source) => (
                <div key={source.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${source.value}`}
                    checked={
                      currentFilter.source?.includes(source.value) || false
                    }
                    onCheckedChange={(checked) =>
                      handleSourceChange(source.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`source-${source.value}`}>
                    {source.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <Label className="text-base font-medium">Assigned To</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="assigned-unassigned"
                  checked={currentFilter.assignedTo?.includes("") || false}
                  onCheckedChange={(checked) =>
                    handleAssignedToChange("", checked as boolean)
                  }
                />
                <Label htmlFor="assigned-unassigned">Unassigned</Label>
              </div>
              {assignedToOptions.map((user) => (
                <div key={user.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`assigned-${user.value}`}
                    checked={
                      currentFilter.assignedTo?.includes(user.value) || false
                    }
                    onCheckedChange={(checked) =>
                      handleAssignedToChange(user.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`assigned-${user.value}`}>{user.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-base font-medium">Date Range</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.start
                      ? format(dateRange.start, "PP")
                      : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.start}
                    onSelect={(date) =>
                      setDateRange({ ...dateRange, start: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.end ? format(dateRange.end, "PP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.end}
                    onSelect={(date) =>
                      setDateRange({ ...dateRange, end: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {dateRange.start && dateRange.end && (
              <Button
                size="sm"
                onClick={handleDateRangeChange}
                className="mt-2 w-full"
              >
                Apply Date Range
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={clearFilters}>
            Clear All
          </Button>
          <Button onClick={() => setIsOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkActions({
  selectedProspects,
  onBulkUpdate,
  onBulkDelete,
  disabled,
}: BulkActionsProps) {
  const { getActiveProspectSources, getActiveProspectStatuses } =
    useTelemarketingSettings();
  const { users } = useUserManagement();

  // Get database options
  const statusOptions = getActiveProspectStatuses().map((status) => ({
    value: status.id!,
    label: status.name,
  }));

  const sourceOptions = getActiveProspectSources().map((source) => ({
    value: source.id!,
    label: source.name,
  }));

  const assignedToOptions = users
    .filter((user) => user.isActive)
    .map((user) => ({
      value: user.id!,
      label: user.displayName,
    }));
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [updateField, setUpdateField] = useState<
    "status" | "source" | "assignedTo"
  >("status");
  const [updateValue, setUpdateValue] = useState("");

  const handleBulkUpdate = async () => {
    if (!updateValue) return;

    const updateData: Partial<Prospect> = {};
    if (updateField === "status") {
      // Convert ID to name
      const selectedStatus = statusOptions.find((s) => s.value === updateValue);
      updateData.status = selectedStatus ? selectedStatus.label : updateValue;
    } else if (updateField === "source") {
      // Convert ID to name
      const selectedSource = sourceOptions.find((s) => s.value === updateValue);
      updateData.source = selectedSource ? selectedSource.label : updateValue;
    } else if (updateField === "assignedTo") {
      updateData.assignedTo = updateValue;
    }

    await onBulkUpdate(updateData);
    setIsUpdateOpen(false);
    setUpdateValue("");
  };

  const handleBulkDelete = async () => {
    await onBulkDelete();
    setIsDeleteOpen(false);
  };

  if (selectedProspects.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedProspects.length} selected
      </span>

      <Separator orientation="vertical" className="h-4" />

      {/* Bulk Update */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <Edit className="h-4 w-4 mr-1" />
            Update
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Prospects</DialogTitle>
            <DialogDescription>
              Update {selectedProspects.length} selected prospects
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="updateField">Field to Update</Label>
              <Select
                value={updateField}
                onValueChange={(value) =>
                  setUpdateField(value as typeof updateField)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="assignedTo">Assigned To</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="updateValue">New Value</Label>
              {updateField === "status" && (
                <Select value={updateValue} onValueChange={setUpdateValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {updateField === "source" && (
                <Select value={updateValue} onValueChange={setUpdateValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {updateField === "assignedTo" && (
                <Select value={updateValue} onValueChange={setUpdateValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {assignedToOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} disabled={!updateValue}>
              Update {selectedProspects.length} Prospects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={disabled}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prospects</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedProspects.length}{" "}
              selected prospects? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedProspects.length} Prospects
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
