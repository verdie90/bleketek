"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Prospect } from "@/hooks/use-prospects";
import { useTelemarketingSettings } from "@/hooks/use-telemarketing-settings";
import { useUserManagement } from "@/hooks/use-user-management-db";

interface AddEditProspectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect?: Prospect | null;
  onSave: (
    prospectData: Omit<Prospect, "id" | "createdAt" | "lastUpdated">
  ) => Promise<{ success: boolean; error?: string }>;
}

export function AddEditProspectModal({
  open,
  onOpenChange,
  prospect,
  onSave,
}: AddEditProspectModalProps) {
  const { getActiveProspectSources, getActiveProspectStatuses } =
    useTelemarketingSettings();
  const { users } = useUserManagement();

  // Get database options - memoized to prevent infinite loops
  const sourceOptions = useMemo(
    () =>
      getActiveProspectSources()
        .filter((source) => source.id && source.id.trim() !== "")
        .map((source) => ({
          value: source.id!,
          label: source.name,
        })),
    [getActiveProspectSources]
  );

  const statusOptions = useMemo(
    () =>
      getActiveProspectStatuses()
        .filter((status) => status.id && status.id.trim() !== "")
        .map((status) => ({
          value: status.id!,
          label: status.name,
        })),
    [getActiveProspectStatuses]
  );

  const assignedToOptions = useMemo(() => {
    const activeUsers = users.filter(
      (user) => user.isActive && user.id && user.id.trim() !== ""
    );
    console.log("👥 Active users for assignment options:", activeUsers);

    return activeUsers.map((user) => ({
      value: user.id!,
      label: user.displayName || user.email || user.id!,
    }));
  }, [users]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    phoneNumber: "",
    status: "temp-default", // Will be updated in useEffect
    source: "temp-default", // Will be updated in useEffect
    assignedTo: "unassigned",
    tags: [] as string[],
    notes: "",
  });
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens/closes or prospect changes
  useEffect(() => {
    if (open) {
      // Get safe default values
      const defaultStatus =
        statusOptions.find((s) => s.value && s.value.trim() !== "")?.value ||
        "temp-default";
      const defaultSource =
        sourceOptions.find((s) => s.value && s.value.trim() !== "")?.value ||
        "temp-default";

      if (prospect) {
        console.log("📝 Editing prospect:", {
          name: prospect.name,
          assignedTo: prospect.assignedTo,
          assignedToType: typeof prospect.assignedTo,
        });
        console.log("👥 Available assignment options:", assignedToOptions);

        // Find IDs from names for form controls
        const statusId =
          statusOptions.find((s) => s.label === prospect.status)?.value ||
          defaultStatus;
        const sourceId =
          sourceOptions.find((s) => s.label === prospect.source)?.value ||
          defaultSource;

        // For assignedTo, check if the user still exists in the active users list
        let assignedToValue = prospect.assignedTo || "unassigned";
        console.log("🔍 Processing assignedTo:", {
          original: prospect.assignedTo,
          processed: assignedToValue,
        });

        if (assignedToValue && assignedToValue !== "unassigned") {
          const userExists = assignedToOptions.find(
            (u) => u.value === assignedToValue
          );
          console.log("👤 User lookup result:", {
            searchId: assignedToValue,
            found: userExists,
            options: assignedToOptions.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          });

          if (!userExists) {
            console.warn(
              "⚠️ Assigned user not found in active users:",
              assignedToValue
            );
            assignedToValue = "unassigned"; // Reset to unassigned if user doesn't exist
          }
        }

        setFormData({
          name: prospect.name,
          phone: prospect.phone || prospect.phoneNumber,
          phoneNumber: prospect.phoneNumber || prospect.phone,
          status: statusId,
          source: sourceId,
          assignedTo: assignedToValue,
          tags: [...prospect.tags],
          notes: prospect.notes || "",
        });

        console.log("📋 Form data set:", {
          assignedTo: assignedToValue,
          statusId,
          sourceId,
        });
      } else {
        setFormData({
          name: "",
          phone: "",
          phoneNumber: "",
          status: defaultStatus,
          source: defaultSource,
          assignedTo: "unassigned",
          tags: [],
          notes: "",
        });
      }
    }
    setNewTag("");
  }, [open, prospect, statusOptions, sourceOptions, assignedToOptions]);

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim() || !formData.phoneNumber.trim()) {
      alert("Name and phone number are required");
      return;
    }

    setSaving(true);
    try {
      // Convert IDs to names before saving
      const selectedStatus = statusOptions.find(
        (s) => s.value === formData.status
      );
      const selectedSource = sourceOptions.find(
        (s) => s.value === formData.source
      );

      // Convert 'unassigned' to empty string for backend compatibility
      const assignedToValue =
        formData.assignedTo === "unassigned" ? "" : formData.assignedTo;

      console.log("💾 Saving prospect data:", {
        formAssignedTo: formData.assignedTo,
        finalAssignedTo: assignedToValue,
        selectedStatus: selectedStatus,
        selectedSource: selectedSource,
      });

      const prospectData = {
        ...formData,
        assignedTo: assignedToValue,
        phone: formData.phoneNumber, // Ensure both phone and phoneNumber are set
        status: selectedStatus ? selectedStatus.label : formData.status, // Save name, not ID
        source: selectedSource ? selectedSource.label : formData.source, // Save name, not ID
      };

      const result = await onSave(prospectData as any);
      if (result.success) {
        handleClose();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Get safe default values
    const defaultStatus =
      statusOptions.find((s) => s.value && s.value.trim() !== "")?.value ||
      "temp-default";
    const defaultSource =
      sourceOptions.find((s) => s.value && s.value.trim() !== "")?.value ||
      "temp-default";

    setFormData({
      name: "",
      phone: "",
      phoneNumber: "",
      status: defaultStatus,
      source: defaultSource,
      assignedTo: "unassigned",
      tags: [],
      notes: "",
    });
    setNewTag("");
    setSaving(false);
    onOpenChange(false);
  };

  const isEdit = !!prospect;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Prospect" : "Add New Prospect"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the prospect information"
              : "Enter the details for the new prospect"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter prospect name"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="Enter phone number"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={
                  statusOptions.some((o) => o.value === formData.status)
                    ? formData.status
                    : statusOptions[0]?.value || ""
                }
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as Prospect["status"],
                  })
                }
              >
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

            <div>
              <Label htmlFor="source">Source</Label>
              <Select
                value={
                  sourceOptions.some((o) => o.value === formData.source)
                    ? formData.source
                    : sourceOptions[0]?.value || ""
                }
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    source: value as Prospect["source"],
                  })
                }
              >
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
          </div>

          <div>
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Select
              value={
                assignedToOptions.some(
                  (o) => o.value === formData.assignedTo
                ) || formData.assignedTo === "unassigned"
                  ? formData.assignedTo
                  : "unassigned"
              }
              onValueChange={(value) =>
                setFormData({ ...formData, assignedTo: value })
              }
            >
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
              {formData.tags.map((tag) => (
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

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update Prospect" : "Add Prospect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
