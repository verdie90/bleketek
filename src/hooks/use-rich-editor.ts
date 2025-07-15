"use client";

import { useState, useCallback, useRef } from "react";

interface UseRichEditorOptions {
  initialContent?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface UseRichEditorReturn {
  content: string;
  htmlContent: string;
  setContent: (content: string) => void;
  updateContent: (text: string, html: string) => void;
  clearContent: () => void;
  copyToClipboard: () => Promise<boolean>;
  downloadAsHtml: (filename?: string) => void;
  downloadAsText: (filename?: string) => void;
  getWordCount: () => number;
  getCharCount: () => number;
  hasUnsavedChanges: boolean;
  save: () => void;
}

export const useRichEditor = (
  options: UseRichEditorOptions = {}
): UseRichEditorReturn => {
  const {
    initialContent = "",
    autoSave = false,
    autoSaveDelay = 1000,
  } = options;

  const [content, setContentState] = useState(initialContent);
  const [htmlContent, setHtmlContentState] = useState("");
  const [savedContent, setSavedContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateContent = useCallback(
    (text: string, html: string) => {
      setContentState(text);
      setHtmlContentState(html);
      setHasUnsavedChanges(text !== savedContent);

      if (autoSave) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
          setSavedContent(text);
          setHasUnsavedChanges(false);
        }, autoSaveDelay);
      }
    },
    [savedContent, autoSave, autoSaveDelay]
  );

  const setContent = useCallback((newContent: string) => {
    setContentState(newContent);
    setSavedContent(newContent);
    setHasUnsavedChanges(false);
  }, []);

  const clearContent = useCallback(() => {
    setContentState("");
    setHtmlContentState("");
    setSavedContent("");
    setHasUnsavedChanges(false);
  }, []);

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      return true;
    } catch (error) {
      return false;
    }
  }, [htmlContent]);

  const downloadAsHtml = useCallback(
    (filename: string = "document.html") => {
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        blockquote {
            border-left: 4px solid #ddd;
            margin: 0;
            padding-left: 1rem;
            color: #666;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
        }
        pre {
            background-color: #f4f4f4;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [htmlContent]
  );

  const downloadAsText = useCallback(
    (filename: string = "document.txt") => {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [content]
  );

  const getWordCount = useCallback((): number => {
    return content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }, [content]);

  const getCharCount = useCallback((): number => {
    return content.length;
  }, [content]);

  const save = useCallback(() => {
    setSavedContent(content);
    setHasUnsavedChanges(false);
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, [content]);

  return {
    content,
    htmlContent,
    setContent,
    updateContent,
    clearContent,
    copyToClipboard,
    downloadAsHtml,
    downloadAsText,
    getWordCount,
    getCharCount,
    hasUnsavedChanges,
    save,
  };
};
