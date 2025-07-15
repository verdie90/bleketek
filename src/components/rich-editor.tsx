"use client";

import React, { useCallback } from "react";
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
}) => {
  const isClient = useIsClient();

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
    [content, editable, onChange, minHeight]
  );

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

  const copyToClipboard = useCallback(async () => {
    if (!editor) return;

    const html = editor.getHTML();
    try {
      await navigator.clipboard.writeText(html);
      console.log("HTML copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
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
    <div className="border-b p-2 flex flex-wrap gap-1 items-center">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Formatting */}
      <Button
        variant={editor.isActive("bold") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive("italic") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive("underline") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive("strike") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive("highlight") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Subscript/Superscript */}
      <Button
        variant={editor.isActive("subscript") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        <SubscriptIcon className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive("superscript") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <SuperscriptIcon className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Alignment */}
      <Button
        variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="w-4 h-4" />
      </Button>
      <Button
        variant={
          editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"
        }
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <AlignJustify className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists */}
      <Button
        variant={editor.isActive("bulletList") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive("orderedList") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Quote and Code */}
      <Button
        variant={editor.isActive("blockquote") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive("code") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="w-4 h-4" />
      </Button>
      <Button
        variant={editor.isActive("codeBlock") ? "default" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Link, Image, Table */}
      <Button variant="ghost" size="sm" onClick={setLink}>
        <LinkIcon className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={addImage}>
        <ImageIcon className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={addTable}>
        <TableIcon className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Actions */}
      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
        <Copy className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={downloadAsHtml}>
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );

  const editorContent = (
    <div className="border rounded-lg overflow-hidden bg-background">
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
            padding: "16px",
            cursor: "text",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        />
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
