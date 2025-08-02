"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { useIsClient } from "@/hooks/use-is-client";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Type,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Eye,
  Copy,
  Download,
  Heading,
  Variable,
  ChevronDown,
  Palette,
  Plus,
  FileText,
} from "lucide-react";

interface RichEditorProps {
  content?: string;
  onChange?: (content: string, html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  showToolbar?: boolean;
  showSourceCode?: boolean;
  minHeight?: string;
  variables?: Array<{ key: string; value: string; description?: string }>;
  onVariableInsert?: (variable: string) => void;
}

const RichEditor: React.FC<RichEditorProps> = ({
  content = "",
  onChange,
  placeholder = "Mulai mengetik...",
  editable = true,
  className = "",
  showToolbar = true,
  showSourceCode = true,
  minHeight = "300px",
  variables = [],
  onVariableInsert,
}) => {
  const isClient = useIsClient();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Underline,
        Subscript,
        Superscript,
        Highlight.configure({
          multicolor: true,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
        }),
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        Placeholder.configure({
          placeholder,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content,
      editable,
      immediatelyRender: false,
      autofocus: editable,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm max-w-none focus:outline-none min-h-full border-0 bg-transparent",
          style: `min-height: ${minHeight}; padding: 16px; line-height: 1.6;`,
          spellcheck: "false",
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const text = editor.getText();
        onChange?.(text, html);
      },
    },
    [editable, minHeight] // Remove content from dependency array
  );

  // Handle content updates without recreating the editor
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();

      // Only update content if it's different and not empty
      // This prevents infinite loops and preserves user edits
      if (content !== currentContent && content.trim() !== "") {
        // Use a timeout to avoid conflicts with ongoing editing
        const timeoutId = setTimeout(() => {
          if (editor && !editor.isFocused) {
            // Only update if editor is not focused (user is not actively editing)
            editor.commands.setContent(content, { emitUpdate: false });
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [editor, content]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("URL Gambar");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const insertVariable = useCallback(
    (variableKey: string) => {
      if (!editor) return;

      editor.chain().focus().insertContent(variableKey).run();
      onVariableInsert?.(variableKey);
    },
    [editor, onVariableInsert]
  );

  const insertHeading = useCallback(
    (level: number) => {
      if (!editor) return;

      editor
        .chain()
        .focus()
        .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
        .run();
    },
    [editor]
  );

  const setHighlightColor = useCallback(
    (color: string) => {
      if (!editor) return;

      editor.chain().focus().toggleHighlight({ color }).run();
    },
    [editor]
  );

  const copyToClipboard = useCallback(async () => {
    if (!editor) return;

    const html = editor.getHTML();
    try {
      await navigator.clipboard.writeText(html);
    } catch (err) {}
  }, [editor]);

  const downloadAsHtml = useCallback(() => {
    if (!editor) return;

    const html = editor.getHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editor]);

  const downloadAsPdf = useCallback(async () => {
    if (!editor || isDownloadingPdf) return;

    try {
      setIsDownloadingPdf(true);

      // Import html2pdf dynamically
      const html2pdf = (await import("html2pdf.js")).default;

      // Create a temporary container for PDF generation
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "794px"; // A4 width in pixels at 96 DPI
      tempContainer.style.padding = "40px";
      tempContainer.style.fontFamily = "Times New Roman, serif";
      tempContainer.style.fontSize = "14px";
      tempContainer.style.lineHeight = "1.6";
      tempContainer.style.color = "#000";
      tempContainer.style.backgroundColor = "#fff";

      // Add editor content to container
      tempContainer.innerHTML = editor.getHTML();

      // Append to body temporarily
      document.body.appendChild(tempContainer);

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[T:]/g, "-");
      const fileName = `rich-editor-document-${timestamp}.pdf`;

      // Configure PDF options
      const options = {
        margin: [15, 15, 15, 15], // top, right, bottom, left in mm
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compressPDF: true,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      // Generate and download PDF
      await html2pdf().set(options).from(tempContainer).save();

      // Clean up
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [editor, isDownloadingPdf]);

  // Show loading skeleton while client-side hydration
  if (!isClient || !editor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Rich Text Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {showToolbar && (
              <div className="border-b p-2">
                <div className="flex gap-1 items-center">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <Skeleton key={i} className="w-8 h-8 rounded" />
                  ))}
                </div>
              </div>
            )}
            <div className="p-4">
              <Skeleton className="w-full" style={{ height: minHeight }} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const toolbarContent = showToolbar && (
    <TooltipProvider>
      <div className="border-b p-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="h-8 w-8 p-0"
                >
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="h-8 w-8 p-0"
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Heading className="w-4 h-4 mr-1" />
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Heading Styles</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Heading Styles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={
                  editor.isActive("paragraph")
                    ? "bg-gray-100 dark:bg-gray-700"
                    : ""
                }
              >
                Normal Text
              </DropdownMenuItem>
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => insertHeading(level)}
                  className={
                    editor.isActive("heading", { level })
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }
                >
                  <span
                    className={`font-bold ${
                      level <= 2
                        ? "text-lg"
                        : level <= 4
                        ? "text-base"
                        : "text-sm"
                    }`}
                  >
                    Heading {level}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("bold") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className="h-8 w-8 p-0"
                >
                  <Bold className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold (Ctrl+B)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("italic") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className="h-8 w-8 p-0"
                >
                  <Italic className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic (Ctrl+I)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("underline") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className="h-8 w-8 p-0"
                >
                  <UnderlineIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline (Ctrl+U)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("strike") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className="h-8 w-8 p-0"
                >
                  <Strikethrough className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Strikethrough</TooltipContent>
            </Tooltip>

            {/* Highlight with color options */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={
                        editor.isActive("highlight") ? "default" : "ghost"
                      }
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Highlighter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Highlight Text</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Highlight Colors</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                >
                  <div className="w-4 h-4 bg-yellow-200 rounded mr-2"></div>
                  Yellow (Default)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHighlightColor("#fca5a5")}>
                  <div className="w-4 h-4 bg-red-300 rounded mr-2"></div>
                  Red
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHighlightColor("#86efac")}>
                  <div className="w-4 h-4 bg-green-300 rounded mr-2"></div>
                  Green
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHighlightColor("#93c5fd")}>
                  <div className="w-4 h-4 bg-blue-300 rounded mr-2"></div>
                  Blue
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                >
                  Remove Highlight
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Subscript/Superscript */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("subscript") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleSubscript().run()}
                  className="h-8 w-8 p-0"
                >
                  <SubscriptIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Subscript</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("superscript") ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleSuperscript().run()
                  }
                  className="h-8 w-8 p-0"
                >
                  <SuperscriptIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Superscript</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    editor.isActive({ textAlign: "left" }) ? "default" : "ghost"
                  }
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className="h-8 w-8 p-0"
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    editor.isActive({ textAlign: "center" })
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className="h-8 w-8 p-0"
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    editor.isActive({ textAlign: "right" })
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  className="h-8 w-8 p-0"
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    editor.isActive({ textAlign: "justify" })
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("justify").run()
                  }
                  className="h-8 w-8 p-0"
                >
                  <AlignJustify className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Justify</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("bulletList") ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("orderedList") ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  className="h-8 w-8 p-0"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Numbered List</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Quote and Code */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("blockquote") ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                  className="h-8 w-8 p-0"
                >
                  <Quote className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quote Block</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("code") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className="h-8 w-8 p-0"
                >
                  <Code className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Inline Code</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={editor.isActive("codeBlock") ? "default" : "ghost"}
                  size="sm"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className="h-8 w-8 p-0"
                >
                  <Code2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code Block</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Insert Elements */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={setLink}
                  className="h-8 w-8 p-0"
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Link</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addImage}
                  className="h-8 w-8 p-0"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addTable}
                  className="h-8 w-8 p-0"
                >
                  <TableIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Table</TooltipContent>
            </Tooltip>
          </div>

          {/* Variables Dropdown */}
          {variables.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Variable className="w-4 h-4 mr-1" />
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Insert Variables</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Available Variables</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {variables.map((variable, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => insertVariable(variable.key)}
                      className="flex flex-col items-start gap-1 py-2"
                    >
                      <code className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                        {variable.key}
                      </code>
                      {variable.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {variable.description}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Preview: {variable.value}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy HTML</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadAsHtml}
                  className="h-8 w-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as HTML</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadAsPdf}
                  disabled={isDownloadingPdf}
                  className="h-8 w-8 p-0"
                >
                  {isDownloadingPdf ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDownloadingPdf ? "Generating PDF..." : "Download as PDF"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );

  const editorContent = (
    <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
      {toolbarContent}
      <div
        className="relative bg-background cursor-text"
        style={{ minHeight }}
        onClick={() => {
          if (editor) {
            editor.commands.focus();
          }
        }}
        data-tiptap-editor
      >
        <EditorContent
          editor={editor}
          className={`prose prose-sm max-w-none outline-none ${className}`}
          style={{
            minHeight,
            padding: "20px",
            cursor: "text",
            fontSize: "14px",
            lineHeight: "1.7",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        />
        {/* Floating help text */}
        {editor && editor.isEmpty && (
          <div className="absolute top-6 left-6 text-gray-400 dark:text-gray-500 pointer-events-none text-sm">
            💡 Tips: Gunakan toolbar di atas untuk formatting, atau ketik "/"
            untuk quick commands
          </div>
        )}
      </div>
    </div>
  );

  if (!showSourceCode) {
    return editorContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          Rich Text Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="source" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Source Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4">
            {editorContent}
          </TabsContent>

          <TabsContent value="source" className="mt-4">
            <div
              className="border rounded-lg p-4 bg-gray-50 font-mono text-sm overflow-auto"
              style={{ minHeight }}
            >
              <pre>{editor.getHTML()}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RichEditor;
