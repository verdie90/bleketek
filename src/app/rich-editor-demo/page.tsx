"use client";

import { useState, useEffect } from "react";
import RichEditor from "@/components/rich-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RichEditorDemo() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initialContent = `
<h1>Selamat Datang di Rich Text Editor</h1>
<p>Ini adalah contoh <strong>rich text editor</strong> yang mirip dengan <em>CKEditor</em>. Editor ini mendukung berbagai fitur formatting seperti:</p>

<h2>Fitur Text Formatting</h2>
<ul>
  <li><strong>Bold text</strong></li>
  <li><em>Italic text</em></li>
  <li><u>Underlined text</u></li>
  <li><s>Strikethrough text</s></li>
  <li><mark>Highlighted text</mark></li>
  <li>Text dengan <sub>subscript</sub> dan <sup>superscript</sup></li>
</ul>

<h2>Fitur Alignment</h2>
<p style="text-align: left">Teks rata kiri (default)</p>
<p style="text-align: center">Teks rata tengah</p>
<p style="text-align: right">Teks rata kanan</p>
<p style="text-align: justify">Teks rata kanan-kiri (justify) - Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

<h2>Lists</h2>
<h3>Unordered List:</h3>
<ul>
  <li>Item pertama</li>
  <li>Item kedua</li>
  <li>Item ketiga</li>
</ul>

<h3>Ordered List:</h3>
<ol>
  <li>Langkah pertama</li>
  <li>Langkah kedua</li>
  <li>Langkah ketiga</li>
</ol>

<h2>Quote dan Code</h2>
<blockquote>
  <p>Ini adalah contoh blockquote. Biasanya digunakan untuk mengutip teks dari sumber lain.</p>
</blockquote>

<p>Anda juga bisa menambahkan <code>inline code</code> atau blok kode:</p>

<pre><code>function helloWorld() {
  console.log("Hello, World!");
}

helloWorld();</code></pre>

<h2>Table Example</h2>
<table>
  <tr>
    <th>Nama</th>
    <th>Umur</th>
    <th>Kota</th>
  </tr>
  <tr>
    <td>John Doe</td>
    <td>25</td>
    <td>Jakarta</td>
  </tr>
  <tr>
    <td>Jane Smith</td>
    <td>30</td>
    <td>Bandung</td>
  </tr>
</table>

<h2>Links dan Images</h2>
<p>Anda dapat menambahkan <a href="https://example.com">link</a> dan gambar ke dalam editor.</p>

<p><em>Gunakan toolbar di atas untuk mengedit konten ini!</em></p>
`;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6">Rich Text Editor Demo</h1>
        <p className="text-gray-600 mb-8">
          Editor WYSIWYG yang mirip dengan CKEditor, dilengkapi dengan berbagai
          fitur formatting
        </p>
      </div>

      {/* Full Featured Rich Editor */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Full Featured Rich Editor
        </h2>
        <p className="text-gray-600 mb-4">
          Editor lengkap dengan toolbar, font controls, line height controls,
          dan download PDF menggunakan html2canvas + jsPDF
        </p>
        <RichEditor
          content={initialContent}
          onChange={(text, html) =>
            console.log("Content changed:", { text, html })
          }
          showToolbar={true}
          showSourceCode={true}
          minHeight="400px"
        />
      </div>

      {/* Simple Rich Editor */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Simple Rich Editor</h2>
        <p className="text-gray-600 mb-4">
          Editor sederhana tanpa tab source code dengan font dan line height
          custom
        </p>
        <RichEditor
          content="<p style='font-family: Times New Roman, serif; font-size: 16px; line-height: 2;'>Editor sederhana untuk editing cepat dengan <strong>Times New Roman</strong> font dan line height 2.0. Gunakan toolbar untuk mengatur font family, ukuran font, dan jarak baris sesuai kebutuhan.</p>"
          onChange={(text, html) =>
            console.log("Simple editor changed:", { text, html })
          }
          showToolbar={true}
          showSourceCode={false}
          minHeight="250px"
        />
      </div>

      {/* Read-only Rich Editor */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Read-only Rich Editor</h2>
        <p className="text-gray-600 mb-4">
          Editor dalam mode read-only untuk menampilkan konten
        </p>
        <RichEditor
          content={`
            <h3>Konten Read-only</h3>
            <p>Ini adalah contoh editor dalam mode <strong>read-only</strong>. 
            Konten tidak dapat diedit, namun tetap ditampilkan dengan formatting yang tepat.</p>
            <ul>
              <li>Toolbar tersembunyi</li>
              <li>Konten tidak dapat diedit</li>
              <li>Cocok untuk preview</li>
            </ul>
          `}
          editable={false}
          showToolbar={false}
          showSourceCode={false}
          minHeight="200px"
        />
      </div>

      {/* Minimal Rich Editor */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Minimal Rich Editor</h2>
        <p className="text-gray-600 mb-4">Editor dengan toolbar minimal</p>
        <div className="border rounded-lg overflow-hidden">
          <RichEditor
            content="<p>Editor dengan toolbar yang tersembunyi. Gunakan keyboard shortcuts untuk formatting.</p>"
            onChange={(text, html) =>
              console.log("Minimal editor changed:", { text, html })
            }
            showToolbar={false}
            showSourceCode={false}
            minHeight="150px"
          />
        </div>
        <div className="text-sm text-gray-600 mt-2">
          <p>
            <strong>Keyboard Shortcuts:</strong>
          </p>
          <ul className="list-disc list-inside">
            <li>Ctrl+B = Bold</li>
            <li>Ctrl+I = Italic</li>
            <li>Ctrl+U = Underline</li>
            <li>Ctrl+Z = Undo</li>
            <li>Ctrl+Y = Redo</li>
          </ul>
          <br />
          <p>
            <strong>Fitur Baru:</strong>
          </p>
          <ul className="list-disc list-inside">
            <li>📝 Font Family Control - Pilih dari berbagai font</li>
            <li>📏 Font Size Control - Atur ukuran font 8-72px</li>
            <li>📐 Line Height Control - Atur jarak baris 0.5-3.0</li>
            <li>
              📄 PDF Download - html2canvas + jsPDF untuk kualitas terbaik
            </li>
            <li>🎨 Real-time Preview - Lihat perubahan langsung</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
