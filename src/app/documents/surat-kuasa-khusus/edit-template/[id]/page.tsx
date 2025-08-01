"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Save, ArrowLeft, Copy, Eye } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import RichEditor from "@/components/rich-editor";

interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentDate, setCurrentDate] = useState("1 Agustus 2025");

  const [templateForm, setTemplateForm] = useState({
    name: "",
    content: "",
    description: "",
  });

  // Set current date only on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("id-ID"));
  }, []);

  // Sample variables for preview
  const variables = [
    // Document Variables
    {
      key: "{{nomor_surat}}",
      value: "001/DOCS/CC-KTA/SKK/VIII/2025",
      description: "Nomor surat otomatis",
    },
    {
      key: "{{tanggal_hari_ini}}",
      value: currentDate,
      description: "Tanggal pembuatan surat",
    },
    // Date Variables
    {
      key: "{{hari}}",
      value: "Kamis",
      description: "Nama hari dalam bahasa Indonesia",
    },
    {
      key: "{{tanggal_huruf}}",
      value: "satu",
      description: "Tanggal dalam huruf",
    },
    {
      key: "{{bulan}}",
      value: "Agustus",
      description: "Nama bulan dalam bahasa Indonesia",
    },
    {
      key: "{{tahun_huruf}}",
      value: "dua ribu dua puluh lima",
      description: "Tahun dalam huruf",
    },
    // Personal Variables
    {
      key: "{{nama_klien}}",
      value: "John Doe",
      description: "Nama lengkap klien",
    },
    {
      key: "{{nik_klien}}",
      value: "1234567890123456",
      description: "Nomor Induk Kependudukan",
    },
    {
      key: "{{jenis_kelamin}}",
      value: "Laki-laki",
      description: "Jenis kelamin klien",
    },
    {
      key: "{{pekerjaan}}",
      value: "Karyawan Swasta",
      description: "Pekerjaan klien",
    },
    // Address Variables
    {
      key: "{{alamat}}",
      value: "Jl. Merdeka No. 123",
      description: "Alamat lengkap klien",
    },
    {
      key: "{{rt_rw}}",
      value: "RT 001/RW 002",
      description: "RT/RW klien",
    },
    {
      key: "{{kelurahan}}",
      value: "Kemayoran",
      description: "Kelurahan klien",
    },
    {
      key: "{{kecamatan}}",
      value: "Kemayoran",
      description: "Kecamatan klien",
    },
    {
      key: "{{kota_kabupaten}}",
      value: "Jakarta Pusat",
      description: "Kota/Kabupaten klien",
    },
    {
      key: "{{provinsi}}",
      value: "DKI Jakarta",
      description: "Provinsi klien",
    },
    // Debt Variables
    {
      key: "{{jenis_hutang}}",
      value: "Kartu Kredit",
      description: "Jenis hutang yang ditangani",
    },
    {
      key: "{{bank_provider}}",
      value: "Bank ABC",
      description: "Nama bank atau provider",
    },
    {
      key: "{{nomor_kontrak}}",
      value: "4532****1234",
      description: "Nomor kontrak atau kartu",
    },
    {
      key: "{{outstanding}}",
      value: "15.000.000",
      description: "Jumlah hutang yang belum dibayar",
    },
  ];

  // Process template with variables
  const processTemplate = (content: string) => {
    let processedContent = content;
    variables.forEach((variable) => {
      const regex = new RegExp(
        variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      processedContent = processedContent.replace(regex, variable.value);
    });
    return processedContent;
  };

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) return;

      try {
        setIsLoading(true);
        const templateDoc = await getDoc(
          doc(db, "surat_kuasa_templates", templateId)
        );

        if (templateDoc.exists()) {
          const templateData = templateDoc.data() as Template;
          setTemplateForm({
            name: templateData.name || "",
            content: templateData.content || "",
            description: templateData.description || "",
          });
        } else {
          toast.error("Template tidak ditemukan");
          router.push("/documents/surat-kuasa-khusus");
        }
      } catch (error) {
        console.error("Error loading template:", error);
        toast.error("Gagal memuat template");
        router.push("/documents/surat-kuasa-khusus");
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, router]);

  // Handle save template
  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.name.trim()) {
        toast.error("Nama template harus diisi");
        return;
      }
      if (!templateForm.content.trim()) {
        toast.error("Konten template harus diisi");
        return;
      }

      setIsSaving(true);

      const templateData = {
        name: templateForm.name.trim(),
        content: templateForm.content,
        description: templateForm.description.trim(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(
        doc(db, "surat_kuasa_templates", templateId),
        templateData
      );

      toast.success("Template berhasil diperbarui");
      router.push("/documents/surat-kuasa-khusus");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Gagal memperbarui template");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/documents">Documents</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/documents/surat-kuasa-khusus">
                      Surat Kuasa Khusus
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Edit Template</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="max-w-6xl mx-auto w-full">
              {/* Loading State */}
              <div className="mb-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-2/3"></div>
              </div>

              <Card>
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/documents">Documents</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/documents/surat-kuasa-khusus">
                    Surat Kuasa Khusus
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit Template</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Template
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Edit template surat kuasa khusus yang sudah ada
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Section */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informasi Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="templateName">Nama Template *</Label>
                      <Input
                        id="templateName"
                        value={templateForm.name}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="contoh: Template Surat Kuasa Formal"
                        className="dark:bg-gray-800 dark:border-gray-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="templateDescription">
                        Deskripsi Template
                      </Label>
                      <Textarea
                        id="templateDescription"
                        value={templateForm.description}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Jelaskan kapan template ini sebaiknya digunakan..."
                        className="dark:bg-gray-800 dark:border-gray-700 h-24"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Konten Template</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="dark:border-gray-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? "Sembunyikan" : "Tampilkan"} Preview
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <RichEditor
                        content={templateForm.content}
                        onChange={(text: string, html: string) =>
                          setTemplateForm({ ...templateForm, content: html })
                        }
                        placeholder="Edit konten template surat kuasa khusus Anda di sini..."
                        minHeight="400px"
                        variables={variables}
                        onVariableInsert={(variable) => {
                          toast.success(`Variabel ${variable} ditambahkan`);
                        }}
                        showSourceCode={false}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>💡</span>
                        <span>
                          Gunakan toolbar untuk formatting atau klik tombol
                          "Variabel" untuk menambahkan data dinamis
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Variables Reference */}
                <Card>
                  <CardHeader>
                    <CardTitle>Panduan Variabel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Variabel berikut akan diganti otomatis dengan data klien
                      saat dokumen dibuat:
                    </p>
                    <div className="space-y-2">
                      {variables.map((variable, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer group"
                          onClick={() => {
                            navigator.clipboard.writeText(variable.key);
                            toast.success(
                              `${variable.key} disalin ke clipboard`
                            );
                          }}
                          title="Klik untuk menyalin"
                        >
                          <div className="flex-1 min-w-0">
                            <code className="text-xs text-blue-600 dark:text-blue-400 font-mono block truncate">
                              {variable.key}
                            </code>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {variable.description}
                            </p>
                          </div>
                          <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-3 h-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Section */}
                {showPreview && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700 max-h-96 overflow-y-auto">
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert dark:text-gray-200"
                          dangerouslySetInnerHTML={{
                            __html: processTemplate(templateForm.content || ""),
                          }}
                        />
                      </div>
                      <div className="mt-3 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        ✅ Preview menampilkan template dengan data contoh
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button variant="outline" onClick={() => router.back()}>
                Batal
              </Button>

              <Button
                onClick={handleSaveTemplate}
                disabled={
                  !templateForm.name.trim() ||
                  !templateForm.content.trim() ||
                  isSaving
                }
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
