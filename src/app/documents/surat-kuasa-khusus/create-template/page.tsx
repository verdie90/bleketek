"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Eye,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import RichEditor from "@/components/rich-editor";

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [templateForm, setTemplateForm] = useState({
    name: "",
    content: "",
    description: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState("1 Agustus 2025");

  // Set current date only on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("id-ID"));
  }, []);

  // Sample variables for preview
  const variables = [
    // Document variables
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

    // Date variables
    {
      key: "{{hari}}",
      value: "Kamis",
      description: "Hari dalam bahasa Indonesia",
    },
    {
      key: "{{tanggal_huruf}}",
      value: "satu",
      description: "Tanggal dalam kata-kata",
    },
    {
      key: "{{bulan}}",
      value: "Agustus",
      description: "Bulan dalam bahasa Indonesia",
    },
    {
      key: "{{tahun_huruf}}",
      value: "dua ribu dua puluh lima",
      description: "Tahun dalam kata-kata",
    },

    // Client personal data
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
      description: "Pekerjaan atau jabatan klien",
    },

    // Client address data
    {
      key: "{{alamat}}",
      value: "Jl. Merdeka No. 123",
      description: "Alamat lengkap klien",
    },
    {
      key: "{{rt_rw}}",
      value: "001/002",
      description: "RT/RW tempat tinggal",
    },
    {
      key: "{{kelurahan}}",
      value: "Suka Maju",
      description: "Kelurahan/Desa",
    },
    {
      key: "{{kecamatan}}",
      value: "Tanah Abang",
      description: "Kecamatan",
    },
    {
      key: "{{kota_kabupaten}}",
      value: "Jakarta Pusat",
      description: "Kota/Kabupaten",
    },
    {
      key: "{{provinsi}}",
      value: "DKI Jakarta",
      description: "Provinsi",
    },

    // Debt data
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

  // Template presets
  const getTemplatePresets = (): TemplatePreset[] => [
    {
      id: "formal",
      name: "Template Formal",
      description: "Template resmi dengan format standar hukum",
      icon: "📋",
      content: `<div style="text-align: center; margin-bottom: 30px;">
        <h2>SURAT KUASA KHUSUS</h2>
        <p>Nomor: {{nomor_surat}}</p>
      </div>
      
      <p>Yang bertanda tangan di bawah ini:</p>
      <table style="width: 100%; margin: 20px 0;">
        <tr><td style="width: 150px;">Nama</td><td>: {{nama_klien}}</td></tr>
        <tr><td>NIK</td><td>: {{nik_klien}}</td></tr>
        <tr><td>Jenis Kelamin</td><td>: {{jenis_kelamin}}</td></tr>
        <tr><td>Pekerjaan</td><td>: {{pekerjaan}}</td></tr>
        <tr><td>Alamat</td><td>: {{alamat}}</td></tr>
        <tr><td>RT/RW</td><td>: {{rt_rw}}</td></tr>
        <tr><td>Kelurahan</td><td>: {{kelurahan}}</td></tr>
        <tr><td>Kecamatan</td><td>: {{kecamatan}}</td></tr>
        <tr><td>Kota/Kabupaten</td><td>: {{kota_kabupaten}}</td></tr>
        <tr><td>Provinsi</td><td>: {{provinsi}}</td></tr>
      </table>
      
      <p>Selanjutnya disebut sebagai <strong>"PEMBERI KUASA"</strong></p>
      
      <p>Dengan ini memberikan kuasa kepada:</p>
      <table style="width: 100%; margin: 20px 0;">
        <tr><td style="width: 150px;">Nama</td><td>: [Nama Penerima Kuasa]</td></tr>
        <tr><td>Jabatan</td><td>: [Jabatan]</td></tr>
        <tr><td>Alamat</td><td>: [Alamat Kantor Hukum]</td></tr>
      </table>
      
      <p>Selanjutnya disebut sebagai <strong>"PENERIMA KUASA"</strong></p>
      
      <p><strong>UNTUK:</strong></p>
      <p>Menangani, menyelesaikan, dan melakukan segala tindakan hukum yang diperlukan berkaitan dengan hutang/kewajiban sebagai berikut:</p>
      
      <table style="width: 100%; margin: 20px 0; border: 1px solid #ccc;">
        <tr style="background: #f5f5f5;"><td style="padding: 8px; border: 1px solid #ccc;"><strong>Jenis Hutang</strong></td><td style="padding: 8px; border: 1px solid #ccc;">{{jenis_hutang}}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ccc;"><strong>Bank/Provider</strong></td><td style="padding: 8px; border: 1px solid #ccc;">{{bank_provider}}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ccc;"><strong>Nomor Kontrak</strong></td><td style="padding: 8px; border: 1px solid #ccc;">{{nomor_kontrak}}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ccc;"><strong>Outstanding</strong></td><td style="padding: 8px; border: 1px solid #ccc;">Rp {{outstanding}}</td></tr>
      </table>
      
      <p>Surat kuasa ini berlaku hingga penyelesaian seluruh kewajiban hutang tersebut di atas.</p>
      
      <p>Demikian surat kuasa ini dibuat dengan sebenarnya dan dapat dipergunakan sebagaimana mestinya.</p>
      
      <div style="margin-top: 50px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 50%; text-align: center;"></td>
            <td style="width: 50%; text-align: center;">
              <p>{{kota_kabupaten}}, {{hari}}, {{tanggal_huruf}} {{bulan}} {{tahun_huruf}}</p>
              <p><strong>PEMBERI KUASA</strong></p>
              <br><br><br>
              <p><strong>{{nama_klien}}</strong></p>
            </td>
          </tr>
        </table>
      </div>`,
    },
    {
      id: "simple",
      name: "Template Sederhana",
      description: "Template singkat dan mudah dipahami",
      icon: "📝",
      content: `<div style="text-align: center; margin-bottom: 30px;">
        <h2>SURAT KUASA KHUSUS</h2>
        <p>Nomor: {{nomor_surat}}</p>
      </div>
      
      <p>Saya yang bertanda tangan di bawah ini:</p>
      <p><strong>Nama:</strong> {{nama_klien}}</p>
      <p><strong>NIK:</strong> {{nik_klien}}</p>
      
      <p>Dengan ini memberikan kuasa kepada pihak hukum untuk menangani hutang saya:</p>
      
      <ul style="margin: 20px 0; padding-left: 30px;">
        <li><strong>Jenis Hutang:</strong> {{jenis_hutang}}</li>
        <li><strong>Bank/Provider:</strong> {{bank_provider}}</li>
        <li><strong>Nomor Kartu/Kontrak:</strong> {{nomor_kontrak}}</li>
        <li><strong>Outstanding:</strong> Rp {{outstanding}}</li>
      </ul>
      
      <p>Kuasa ini diberikan untuk melakukan segala tindakan yang diperlukan dalam penyelesaian hutang tersebut.</p>
      
      <p>Demikian surat kuasa ini dibuat dengan sebenarnya.</p>
      
      <div style="margin-top: 30px; text-align: right;">
        <p>{{tanggal_hari_ini}}</p>
        <br><br>
        <p><strong>{{nama_klien}}</strong></p>
      </div>`,
    },
    {
      id: "detailed",
      name: "Template Detail",
      description: "Template lengkap dengan klausul detail",
      icon: "📊",
      content: `<div style="text-align: center; margin-bottom: 30px;">
        <h2>SURAT KUASA KHUSUS</h2>
        <p>Nomor: {{nomor_surat}}</p>
      </div>
      
      <p><strong>PEMBERI KUASA:</strong></p>
      <table style="width: 100%; margin: 20px 0;">
        <tr><td style="width: 200px;">Nama Lengkap</td><td>: {{nama_klien}}</td></tr>
        <tr><td>Nomor Identitas (NIK)</td><td>: {{nik_klien}}</td></tr>
        <tr><td>Alamat</td><td>: [Alamat lengkap sesuai KTP]</td></tr>
        <tr><td>Pekerjaan</td><td>: [Pekerjaan]</td></tr>
      </table>
      
      <p><strong>PENERIMA KUASA:</strong></p>
      <table style="width: 100%; margin: 20px 0;">
        <tr><td style="width: 200px;">Nama/Perusahaan</td><td>: [Nama Penerima Kuasa]</td></tr>
        <tr><td>Alamat</td><td>: [Alamat Kantor]</td></tr>
        <tr><td>Telepon</td><td>: [Nomor Telepon]</td></tr>
      </table>
      
      <p><strong>OBJEK KUASA:</strong></p>
      <p>Menangani penyelesaian hutang/kewajiban dengan detail sebagai berikut:</p>
      
      <table style="width: 100%; margin: 20px 0; border: 1px solid #000;">
        <tr style="background: #f0f0f0;">
          <td style="padding: 10px; border: 1px solid #000; font-weight: bold;">Keterangan</td>
          <td style="padding: 10px; border: 1px solid #000; font-weight: bold;">Detail</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000;">Jenis Hutang</td>
          <td style="padding: 10px; border: 1px solid #000;">{{jenis_hutang}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000;">Bank/Provider</td>
          <td style="padding: 10px; border: 1px solid #000;">{{bank_provider}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000;">Nomor Kontrak/Kartu</td>
          <td style="padding: 10px; border: 1px solid #000;">{{nomor_kontrak}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000;">Jumlah Outstanding</td>
          <td style="padding: 10px; border: 1px solid #000;">Rp {{outstanding}}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000;">Tanggal Kuasa</td>
          <td style="padding: 10px; border: 1px solid #000;">{{tanggal_hari_ini}}</td>
        </tr>
      </table>
      
      <p><strong>RUANG LINGKUP KUASA:</strong></p>
      <ol style="margin: 20px 0; padding-left: 30px;">
        <li>Melakukan negosiasi dengan pihak kreditur</li>
        <li>Menandatangani perjanjian restrukturisasi hutang</li>
        <li>Melakukan pembayaran atas nama pemberi kuasa</li>
        <li>Mewakili dalam proses hukum yang berkaitan</li>
        <li>Melakukan tindakan lain yang diperlukan untuk penyelesaian hutang</li>
      </ol>
      
      <p><strong>MASA BERLAKU:</strong></p>
      <p>Surat kuasa ini berlaku sejak tanggal ditandatangani hingga penyelesaian seluruh kewajiban hutang tersebut di atas atau dicabut secara tertulis oleh pemberi kuasa.</p>
      
      <p>Demikian surat kuasa ini dibuat dalam keadaan sehat jasmani dan rohani, tanpa ada paksaan dari pihak manapun.</p>
      
      <div style="margin-top: 50px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <p><strong>SAKSI</strong></p>
              <br><br><br>
              <p>(_________________)</p>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <p>{{tanggal_hari_ini}}</p>
              <p><strong>PEMBERI KUASA</strong></p>
              <br><br><br>
              <p><strong>{{nama_klien}}</strong></p>
            </td>
          </tr>
        </table>
      </div>`,
    },
    {
      id: "blank",
      name: "Template Kosong",
      description: "Mulai dari kosong dan buat template sendiri",
      icon: "✏️",
      content: `<div style="text-align: center; margin-bottom: 30px;">
        <h2>SURAT KUASA KHUSUS</h2>
        <p>Nomor: {{nomor_surat}}</p>
      </div>
      
      <p>Yang bertanda tangan di bawah ini:</p>
      <p><strong>Nama:</strong> {{nama_klien}}</p>
      <p><strong>NIK:</strong> {{nik_klien}}</p>
      
      <p>[Tulis konten template Anda di sini...]</p>
      
      <p>Hutang yang ditangani:</p>
      <p><strong>Jenis Hutang:</strong> {{jenis_hutang}}</p>
      <p><strong>Bank/Provider:</strong> {{bank_provider}}</p>
      <p><strong>Nomor Kartu/Kontrak:</strong> {{nomor_kontrak}}</p>
      <p><strong>Outstanding:</strong> Rp {{outstanding}}</p>
      
      <p>Tanggal: {{tanggal_hari_ini}}</p>`,
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

  // Handle creating template
  const handleCreateTemplate = async () => {
    try {
      if (!templateForm.name.trim()) {
        toast.error("Nama template harus diisi");
        return;
      }
      if (!templateForm.content.trim()) {
        toast.error("Konten template harus diisi");
        return;
      }

      setIsLoading(true);

      const templateData = {
        name: templateForm.name.trim(),
        content: templateForm.content,
        description: templateForm.description.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "surat_kuasa_templates"), templateData);

      toast.success("Template berhasil dibuat");
      router.push("/documents/surat-kuasa-khusus");
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Gagal membuat template");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1 && selectedPresetId) {
      const preset = getTemplatePresets().find(
        (p) => p.id === selectedPresetId
      );
      if (preset) {
        setTemplateForm((prev) => ({
          ...prev,
          content: preset.content,
          name: preset.name,
          description: preset.description,
        }));
      }
      setCurrentStep(2);
    } else if (currentStep === 2 && templateForm.name.trim()) {
      setCurrentStep(3);
    } else if (currentStep === 1) {
      toast.error("Pilih template dasar terlebih dahulu");
    } else if (currentStep === 2) {
      toast.error("Nama template harus diisi");
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 dark:text-gray-200">
                Pilih Template Dasar
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Pilih template yang sesuai dengan kebutuhan Anda atau mulai dari
                kosong
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="templatePreset">Template Dasar</Label>
                <Select
                  value={selectedPresetId}
                  onValueChange={setSelectedPresetId}
                >
                  <SelectTrigger className="w-full dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue placeholder="Pilih template dasar..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {getTemplatePresets().map((preset) => (
                      <SelectItem
                        key={preset.id}
                        value={preset.id}
                        className="dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{preset.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {preset.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPresetId && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-blue-500">✨</div>
                    <h4 className="font-medium text-blue-700 dark:text-blue-300">
                      Template Dipilih:{" "}
                      {
                        getTemplatePresets().find(
                          (p) => p.id === selectedPresetId
                        )?.name
                      }
                    </h4>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    {
                      getTemplatePresets().find(
                        (p) => p.id === selectedPresetId
                      )?.description
                    }
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {
                      getTemplatePresets().find(
                        (p) => p.id === selectedPresetId
                      )?.content.length
                    }{" "}
                    karakter • Anda dapat menyesuaikan template ini di langkah
                    berikutnya
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 dark:text-gray-200">
                Informasi Template
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Berikan nama dan deskripsi untuk template Anda
              </p>
            </div>

            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gunakan nama yang deskriptif dan mudah diingat
                  </p>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Deskripsi membantu Anda dan tim memilih template yang tepat
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <h4 className="font-medium mb-3 dark:text-gray-200">
                    Template yang Dipilih
                  </h4>
                  {selectedPresetId && (
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {
                          getTemplatePresets().find(
                            (p) => p.id === selectedPresetId
                          )?.icon
                        }
                      </div>
                      <div>
                        <p className="font-medium dark:text-gray-200">
                          {
                            getTemplatePresets().find(
                              (p) => p.id === selectedPresetId
                            )?.name
                          }
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {
                            getTemplatePresets().find(
                              (p) => p.id === selectedPresetId
                            )?.description
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <div className="text-amber-500 mt-0.5">💡</div>
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Tips:</strong> Nama template yang baik menjelaskan
                      tujuan dan gaya (contoh: "Formal untuk Bank", "Sederhana
                      untuk PINJOL"). Deskripsi membantu tim memahami kapan
                      menggunakan template ini.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold dark:text-gray-200">
                  Sesuaikan Konten Template
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Sesuaikan konten template dan lihat preview real-time
                </p>
              </div>
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

            <div
              className={`grid gap-6 ${
                showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {/* Editor Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Konten Template *</Label>
                  <div className="space-y-3">
                    <RichEditor
                      content={templateForm.content}
                      onChange={(text: string, html: string) =>
                        setTemplateForm({ ...templateForm, content: html })
                      }
                      placeholder="Mulai menulis template surat kuasa khusus Anda di sini..."
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
                </div>

                {/* Available Variables Reference */}
                <div className="space-y-2">
                  <Label>Panduan Variabel</Label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Variabel berikut akan diganti otomatis dengan data klien
                      saat dokumen dibuat:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {variables.map((variable, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer group"
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
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              Contoh: {variable.value}
                            </p>
                          </div>
                          <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      💡 <strong>Tips:</strong> Anda juga bisa menggunakan
                      tombol "Variabel" di toolbar editor untuk menambahkan
                      variabel langsung ke teks.
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {showPreview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Preview Template</Label>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Update otomatis saat Anda mengetik
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700 min-h-[500px] max-h-[600px] overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert dark:text-gray-200"
                      dangerouslySetInnerHTML={{
                        __html: processTemplate(templateForm.content || ""),
                      }}
                    />
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-2">
                      <div className="text-green-500 mt-0.5">✅</div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        <strong>Preview:</strong> Variabel di atas sudah diganti
                        dengan data contoh. Template ini siap digunakan untuk
                        membuat dokumen.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
                  <BreadcrumbPage>Buat Template Baru</BreadcrumbPage>
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
                  Buat Template Baru
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Buat template surat kuasa khusus untuk digunakan berulang kali
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

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-16 h-0.5 mx-2 ${
                          step < currentStep
                            ? "bg-blue-500"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Titles */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div
                className={`${
                  currentStep === 1
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <div className="font-medium">Pilih Template</div>
                <div className="text-sm">Pilih template dasar</div>
              </div>
              <div
                className={`${
                  currentStep === 2
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <div className="font-medium">Info Template</div>
                <div className="text-sm">Nama dan deskripsi</div>
              </div>
              <div
                className={`${
                  currentStep === 3
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <div className="font-medium">Edit Konten</div>
                <div className="text-sm">Sesuaikan template</div>
              </div>
            </div>

            {/* Main Content */}
            <Card className="mb-8">
              <CardContent className="p-8">{renderStepContent()}</CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  Batal
                </Button>

                {currentStep < 3 ? (
                  <Button
                    onClick={handleNextStep}
                    disabled={
                      (currentStep === 1 && !selectedPresetId) ||
                      (currentStep === 2 && !templateForm.name.trim())
                    }
                    className="flex items-center gap-2"
                  >
                    Lanjutkan
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={
                      !templateForm.name.trim() ||
                      !templateForm.content.trim() ||
                      isLoading
                    }
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? "Menyimpan..." : "Buat Template"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
