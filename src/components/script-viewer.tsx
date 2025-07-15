"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, CheckCircle } from "lucide-react";
import { useTelemarketingScripts } from "@/hooks/use-telemarketing-scripts";

interface ScriptViewerProps {
  currentProspect?: any;
}

export function ScriptViewer({ currentProspect }: ScriptViewerProps) {
  const { scripts, incrementUsage } = useTelemarketingScripts();
  const [selectedScriptId, setSelectedScriptId] = useState<string>("");
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Filter active scripts
  const activeScripts = scripts.filter((script) => script.isActive);

  // Auto-select first script if available
  useEffect(() => {
    if (activeScripts.length > 0 && !selectedScriptId) {
      const firstScript = activeScripts[0];
      setSelectedScriptId(firstScript.id!);
      setSelectedScript(firstScript);
    }
  }, [activeScripts, selectedScriptId]);

  const handleScriptChange = (scriptId: string) => {
    const script = activeScripts.find((s) => s.id === scriptId);
    setSelectedScriptId(scriptId);
    setSelectedScript(script || null);
  };

  const handleUseScript = async () => {
    if (selectedScript) {
      await incrementUsage(selectedScript.id!);
    }
  };

  const handleCopyScript = async () => {
    if (selectedScript) {
      try {
        // Remove HTML tags and copy plain text
        const tempElement = document.createElement("div");
        tempElement.innerHTML = selectedScript.content;
        const plainText =
          tempElement.textContent || tempElement.innerText || "";

        await navigator.clipboard.writeText(plainText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
      }
    }
  };

  // Replace placeholders in script content
  const processScriptContent = (content: string): string => {
    if (!currentProspect) return content;

    let processedContent = content;

    // Replace common placeholders
    processedContent = processedContent.replace(
      /\[NAMA\]/g,
      currentProspect.nama || "[NAMA]"
    );
    processedContent = processedContent.replace(
      /\[PERUSAHAAN\]/g,
      currentProspect.perusahaan || "[PERUSAHAAN]"
    );
    processedContent = processedContent.replace(
      /\[JABATAN\]/g,
      currentProspect.jabatan || "[JABATAN]"
    );

    return processedContent;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Telemarketing Script
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeScripts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active scripts available</p>
          </div>
        ) : (
          <>
            {/* Script Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Script:</label>
              <Select
                value={selectedScriptId}
                onValueChange={handleScriptChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a script" />
                </SelectTrigger>
                <SelectContent>
                  {activeScripts.map((script) => (
                    <SelectItem key={script.id} value={script.id!}>
                      <div className="flex items-center gap-2">
                        <span>{script.title}</span>
                        {script.usageCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Used {script.usageCount}x
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Script */}
            {selectedScript && (
              <>
                {/* Script Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{selectedScript.title}</h3>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyScript}
                        className="text-xs"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUseScript}
                        className="text-xs"
                      >
                        Use Script
                      </Button>
                    </div>
                  </div>

                  {selectedScript.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedScript.description}
                    </p>
                  )}

                  {selectedScript.tags && selectedScript.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedScript.tags.map((tag: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Script Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Script Content:</label>
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-4">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: processScriptContent(selectedScript.content),
                        }}
                      />
                    </div>
                  </ScrollArea>
                </div>

                {/* Prospect Context */}
                {currentProspect && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Prospect Information:
                    </label>
                    <div className="text-sm space-y-1 bg-gray-50 p-3 rounded-md">
                      <div>
                        <strong>Name:</strong> {currentProspect.nama}
                      </div>
                      {currentProspect.perusahaan && (
                        <div>
                          <strong>Company:</strong> {currentProspect.perusahaan}
                        </div>
                      )}
                      {currentProspect.jabatan && (
                        <div>
                          <strong>Position:</strong> {currentProspect.jabatan}
                        </div>
                      )}
                      {currentProspect.email && (
                        <div>
                          <strong>Email:</strong> {currentProspect.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Usage Stats */}
                <div className="text-xs text-muted-foreground text-center">
                  This script has been used {selectedScript.usageCount || 0}{" "}
                  times
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
