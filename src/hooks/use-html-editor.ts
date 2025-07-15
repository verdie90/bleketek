"use client";

import { useState, useCallback, useRef } from "react";

interface UseHtmlEditorOptions {
  initialCode?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface UseHtmlEditorReturn {
  code: string;
  setCode: (code: string) => void;
  updateCode: (code: string) => void;
  clearCode: () => void;
  copyToClipboard: () => Promise<boolean>;
  downloadAsFile: (filename?: string) => void;
  getWordCount: () => number;
  getLineCount: () => number;
  hasUnsavedChanges: boolean;
  save: () => void;
}

export const useHtmlEditor = (
  options: UseHtmlEditorOptions = {}
): UseHtmlEditorReturn => {
  const { initialCode = "", autoSave = false, autoSaveDelay = 1000 } = options;

  const [code, setCodeState] = useState(initialCode);
  const [savedCode, setSavedCode] = useState(initialCode);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateCode = useCallback(
    (newCode: string) => {
      setCodeState(newCode);
      setHasUnsavedChanges(newCode !== savedCode);

      if (autoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
          setSavedCode(newCode);
          setHasUnsavedChanges(false);
        }, autoSaveDelay);
      }
    },
    [savedCode, autoSave, autoSaveDelay]
  );

  const setCode = useCallback((newCode: string) => {
    setCodeState(newCode);
    setSavedCode(newCode);
    setHasUnsavedChanges(false);
  }, []);

  const clearCode = useCallback(() => {
    setCodeState("");
    setSavedCode("");
    setHasUnsavedChanges(false);
  }, []);

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(code);
      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  }, [code]);

  const downloadAsFile = useCallback(
    (filename: string = "document.html") => {
      const blob = new Blob([code], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [code]
  );

  const getWordCount = useCallback((): number => {
    return code
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }, [code]);

  const getLineCount = useCallback((): number => {
    return code.split("\n").length;
  }, [code]);

  const save = useCallback(() => {
    setSavedCode(code);
    setHasUnsavedChanges(false);
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, [code]);

  return {
    code,
    setCode,
    updateCode,
    clearCode,
    copyToClipboard,
    downloadAsFile,
    getWordCount,
    getLineCount,
    hasUnsavedChanges,
    save,
  };
};
