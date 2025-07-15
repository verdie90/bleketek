import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CallLogsFilter } from "@/hooks/use-call-logs";
import { useCallLogs } from "@/hooks/use-call-logs";

interface CallLogsFiltersProps {
  currentFilter: CallLogsFilter;
  onFilterChange: (filter: CallLogsFilter) => void;
}

export function CallLogsFilters({
  currentFilter,
  onFilterChange,
}: CallLogsFiltersProps) {
  const { users, prospects } = useCallLogs();
  const [tempFilter, setTempFilter] = useState<CallLogsFilter>(currentFilter);
  const [isOpen, setIsOpen] = useState(false);

  const handleApplyFilter = () => {
    onFilterChange(tempFilter);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    const emptyFilter: CallLogsFilter = {};
    setTempFilter(emptyFilter);
    onFilterChange(emptyFilter);
    setIsOpen(false);
  };

  const handleTempFilterChange = (key: keyof CallLogsFilter, value: any) => {
    setTempFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isFilterActive = Object.keys(currentFilter).length > 0;
  const activeFilterCount = Object.values(currentFilter).filter(
    (value) => value !== undefined && value !== ""
  ).length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Input
          placeholder="Search by prospect name, phone, notes..."
          value={currentFilter.search || ""}
          onChange={(e) =>
            onFilterChange({ ...currentFilter, search: e.target.value })
          }
          className="max-w-sm"
        />
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center justify-between">
                Filter Call Logs
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agent Filter */}
              <div>
                <Label htmlFor="agent">Agent</Label>
                <Select
                  value={tempFilter.agentId || ""}
                  onValueChange={(value) =>
                    handleTempFilterChange("agentId", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Agents</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prospect Filter */}
              <div>
                <Label htmlFor="prospect">Prospect</Label>
                <Select
                  value={tempFilter.prospectId || ""}
                  onValueChange={(value) =>
                    handleTempFilterChange("prospectId", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select prospect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Prospects</SelectItem>
                    {prospects.slice(0, 50).map((prospect) => (
                      <SelectItem key={prospect.id} value={prospect.id}>
                        {prospect.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={tempFilter.status || ""}
                  onValueChange={(value) =>
                    handleTempFilterChange("status", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !tempFilter.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tempFilter.dateFrom
                        ? format(tempFilter.dateFrom, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tempFilter.dateFrom}
                      onSelect={(date) =>
                        handleTempFilterChange("dateFrom", date)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !tempFilter.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {tempFilter.dateTo
                        ? format(tempFilter.dateTo, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tempFilter.dateTo}
                      onSelect={(date) => handleTempFilterChange("dateTo", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleApplyFilter} className="flex-1">
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilter}
                  className="flex-1"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {isFilterActive && (
        <Button variant="ghost" size="sm" onClick={handleClearFilter}>
          <X className="mr-1 h-4 w-4" />
          Clear All
        </Button>
      )}
    </div>
  );
}
