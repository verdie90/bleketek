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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import RichEditor from "@/components/rich-editor";

interface ScriptEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
  script?: any;
  allTags: string[];
}

export function ScriptEditorModal({
  open,
  onOpenChange,
  onSave,
  script,
  allTags,
}: ScriptEditorModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens/closes or script changes
  useEffect(() => {
    if (open) {
      if (script) {
        setTitle(script.title || "");
        setDescription(script.description || "");
        setContent(script.content || "");
        setTags(script.tags || []);
        setIsActive(script.isActive ?? true);
      } else {
        setTitle("");
        setDescription("");
        setContent("");
        setTags([]);
        setNewTag("");
        setIsActive(true);
      }
    }
  }, [open, script]);
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!content.trim()) {
      alert("Please enter script content");
      return;
    }

    setSaving(true);

    try {
      const result = await onSave({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        tags,
        isActive,
      });

      if (result.success) {
        handleClose();
      } else {
        alert(result.error || "Failed to save script");
      }
    } catch (error) {
      alert("Failed to save script");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setTags([]);
    setNewTag("");
    setIsActive(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{script ? "Edit Script" : "Add New Script"}</DialogTitle>
          <DialogDescription>
            Create or edit a telemarketing script with rich text formatting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter script title"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter script description (optional)"
              rows={2}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !tags.includes(value)) {
                      setTags([...tags, value]);
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select existing tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTags
                      .filter((tag) => !tags.includes(tag))
                      .map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground py-2">or</span>
                <div className="flex gap-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag"
                    className="w-32"
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    size="sm"
                    disabled={!newTag.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
          </div>

          {/* Rich Text Content */}
          <div className="flex-1">
            <Label>Script Content *</Label>
            <div className="mt-1">
              <RichEditor
                content={content}
                onChange={(content, html) => setContent(html)}
                placeholder="Mulai mengetik script telemarketing Anda di sini..."
                minHeight="400px"
                showSourceCode={false}
                showToolbar={true}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-6">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Script"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
