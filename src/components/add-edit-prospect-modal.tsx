"use client";

import { useState, useEffect } from "react";
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

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    phoneNumber: "",
    status: statusOptions[0]?.value || "new",
    source: sourceOptions[0]?.value || "manual",
    assignedTo: "",
    tags: [] as string[],
    notes: "",
  });
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens/closes or prospect changes
  useEffect(() => {
    if (open) {
      if (prospect) {
        // Find IDs from names for form controls
        const statusId =
          statusOptions.find((s) => s.label === prospect.status)?.value ||
          prospect.status;
        const sourceId =
          sourceOptions.find((s) => s.label === prospect.source)?.value ||
          prospect.source;

        setFormData({
          name: prospect.name,
          phone: prospect.phone || prospect.phoneNumber,
          phoneNumber: prospect.phoneNumber || prospect.phone,
          status: statusId,
          source: sourceId,
          assignedTo: prospect.assignedTo || "",
          tags: [...prospect.tags],
          notes: prospect.notes || "",
        });
      } else {
        setFormData({
          name: "",
          phone: "",
          phoneNumber: "",
          status: statusOptions[0]?.value || "new",
          source: sourceOptions[0]?.value || "manual",
          assignedTo: "",
          tags: [],
          notes: "",
        });
      }
    }
    setNewTag("");
  }, [open, prospect, statusOptions, sourceOptions]);

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

      const prospectData = {
        ...formData,
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
      console.error("Save error:", error);
      alert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      phone: "",
      phoneNumber: "",
      status: statusOptions[0]?.value || "new",
      source: sourceOptions[0]?.value || "manual",
      assignedTo: "",
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
                value={formData.status}
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
                value={formData.source}
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
              value={formData.assignedTo}
              onValueChange={(value) =>
                setFormData({ ...formData, assignedTo: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user (optional)" />
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
