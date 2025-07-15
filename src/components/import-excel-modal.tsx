"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, X, Plus } from "lucide-react";
import { Prospect } from "@/hooks/use-prospects";
import { useTelemarketingSettings } from "@/hooks/use-telemarketing-settings";
import { useUserManagement } from "@/hooks/use-user-management-db";

interface ImportExcelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    data: Array<{ name: string; phoneNumber: string }>,
    options: {
      source: string;
      status: string;
      assignedTo?: string;
      tags: string[];
      skipDuplicates: boolean;
    }
  ) => Promise<{
    success: boolean;
    imported?: number;
    skipped?: number;
    error?: string;
  }>;
}

interface ImportData {
  name: string;
  phoneNumber: string;
}

export function ImportExcelModal({
  open,
  onOpenChange,
  onImport,
}: ImportExcelModalProps) {
  const { getActiveProspectSources, getActiveProspectStatuses } =
    useTelemarketingSettings();
  const { users } = useUserManagement();

  // Get database options
  const sourceOptions = getActiveProspectSources().map((source) => ({
    value: source.id!,
    label: source.name,
  }));

  const statusOptions = getActiveProspectStatuses().map((status) => ({
    value: status.id!,
    label: status.name,
  }));

  const assignedToOptions = users
    .filter((user) => user.isActive)
    .map((user) => ({
      value: user.id!,
      label: user.displayName,
    }));

  const [importData, setImportData] = useState<ImportData[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Import settings
  const [source, setSource] = useState<string>(sourceOptions[0]?.value || "");
  const [status, setStatus] = useState<string>(statusOptions[0]?.value || "");
  const [assignedTo, setAssignedTo] = useState("unassigned");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Process the data (assuming first row is header)
        const rows = jsonData.slice(1) as string[][];
        const processed: ImportData[] = rows
          .filter((row) => row.length >= 2 && row[0] && row[1])
          .map((row) => ({
            name: String(row[0]).trim(),
            phoneNumber: String(row[1]).trim(),
          }));

        setImportData(processed);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        alert("Error reading Excel file. Please check the format.");
      }
    };

    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleImport = async () => {
    if (importData.length === 0) return;

    setImporting(true);
    setImportProgress(0);

    try {
      // Convert IDs to names before passing to import function
      const selectedSource = sourceOptions.find((s) => s.value === source);
      const selectedStatus = statusOptions.find((s) => s.value === status);

      const result = await onImport(importData, {
        source: selectedSource ? selectedSource.label : source, // Pass name, not ID
        status: selectedStatus ? selectedStatus.label : status, // Pass name, not ID
        assignedTo: assignedTo === "unassigned" ? undefined : assignedTo,
        tags,
        skipDuplicates,
      });

      if (result.success) {
        alert(
          `Import completed! Imported: ${result.imported || 0}, Skipped: ${
            result.skipped || 0
          }`
        );
        handleClose();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Import failed. Please try again.");
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleClose = () => {
    setImportData([]);
    setFileName("");
    setImporting(false);
    setImportProgress(0);
    setSource(sourceOptions[0]?.value || "");
    setStatus(statusOptions[0]?.value || "");
    setAssignedTo("unassigned");
    setTags([]);
    setNewTag("");
    setSkipDuplicates(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Prospects from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with prospect data. File should have Name in
            column A and Phone Number in column B.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <Label className="text-base font-medium">Upload File</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {fileName ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    <span className="font-medium">{fileName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {importData.length} prospects found
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag & drop an Excel file here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports .xlsx, .xls, and .csv files
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Import Settings */}
          {importData.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Import Settings</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assignedToOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipDuplicates"
                  checked={skipDuplicates}
                  onCheckedChange={(checked) =>
                    setSkipDuplicates(checked as boolean)
                  }
                />
                <Label htmlFor="skipDuplicates">
                  Skip duplicate phone numbers
                </Label>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="space-y-2">
              <Label>Importing prospects...</Label>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          {/* Preview Data */}
          {importData.length > 0 && !importing && (
            <div>
              <Label className="text-base font-medium">
                Preview Data ({importData.length} prospects)
              </Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Phone Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 10).map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{item.name}</td>
                          <td className="px-3 py-2">{item.phoneNumber}</td>
                        </tr>
                      ))}
                      {importData.length > 10 && (
                        <tr className="border-t">
                          <td
                            colSpan={2}
                            className="px-3 py-2 text-center text-muted-foreground"
                          >
                            ... and {importData.length - 10} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importData.length === 0 || importing}
          >
            {importing
              ? "Importing..."
              : `Import ${importData.length} Prospects`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
