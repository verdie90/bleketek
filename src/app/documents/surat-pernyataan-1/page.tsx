"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  FileText,
  Calendar,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Printer,
  Save,
  Copy,
  AlertCircle,
} from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Statement Document 1 interface
interface SuratPernyataan1 {
  id: string;
  // Document Details
  nomorSurat: string;
  tanggalSurat: string;
  tempatPembuatan: string;
  // Declarant Information
  namaLengkap: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  pekerjaan: string;
  noTelepon: string;
  email?: string;
  // Statement Content
  jenisPernyataan: string;
  judulPernyataan: string;
  isiPernyataan: string;
  dasarHukum: string;
  tujuanPernyataan: string;
  konsekuensi: string;
  // Additional Information
  saksi1Nama?: string;
  saksi1Alamat?: string;
  saksi2Nama?: string;
  saksi2Alamat?: string;
  materai: boolean;
  keterangan?: string;
  // Status and metadata
  status: "draft" | "active" | "archived" | "cancelled";
  createdAt: any;
  updatedAt: any;
  createdBy?: string;
}

const INITIAL_FORM_DATA: Omit<
  SuratPernyataan1,
  "id" | "createdAt" | "updatedAt"
> = {
  nomorSurat: "",
  tanggalSurat: "",
  tempatPembuatan: "",
  namaLengkap: "",
  nik: "",
  tempatLahir: "",
  tanggalLahir: "",
  alamat: "",
  pekerjaan: "",
  noTelepon: "",
  email: "",
  jenisPernyataan: "",
  judulPernyataan: "",
  isiPernyataan: "",
  dasarHukum: "",
  tujuanPernyataan: "",
  konsekuensi: "",
  saksi1Nama: "",
  saksi1Alamat: "",
  saksi2Nama: "",
  saksi2Alamat: "",
  materai: false,
  keterangan: "",
  status: "draft",
};

const JENIS_PERNYATAAN_OPTIONS = [
  "Pernyataan Kebenaran Data",
  "Pernyataan Tanggung Jawab",
  "Pernyataan Tidak Keberatan",
  "Pernyataan Kesanggupan",
  "Pernyataan Kepemilikan",
  "Pernyataan Keaslian Dokumen",
  "Pernyataan Ketidak-berpihakan",
  "Pernyataan Lainnya",
];

export default function SuratPernyataan1Page() {
  const [documents, setDocuments] = useState<SuratPernyataan1[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<
    SuratPernyataan1[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<SuratPernyataan1 | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch documents from Firestore
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "surat_pernyataan_1"),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const documentsData: SuratPernyataan1[] = [];
          querySnapshot.forEach((doc) => {
            documentsData.push({
              id: doc.id,
              ...doc.data(),
            } as SuratPernyataan1);
          });
          setDocuments(documentsData);
          setFilteredDocuments(documentsData);
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Gagal memuat data surat pernyataan");
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Filter documents based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(
        (doc) =>
          doc.namaLengkap?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
          doc.nomorSurat?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
          doc.jenisPernyataan
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
          doc.judulPernyataan?.toLowerCase()?.includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  // Generate document number
  const generateDocumentNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = documents.length + 1;
    return `SP1/${String(count).padStart(3, "0")}/${month}/${year}`;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const documentData = {
        ...formData,
        nomorSurat: formData.nomorSurat || generateDocumentNumber(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        // Update existing document
        await updateDoc(doc(db, "surat_pernyataan_1", editingId), documentData);
        toast.success("Surat pernyataan berhasil diperbarui");
      } else {
        // Create new document
        await addDoc(collection(db, "surat_pernyataan_1"), {
          ...documentData,
          createdAt: serverTimestamp(),
        });
        toast.success("Surat pernyataan berhasil dibuat");
      }

      // Reset form and close modal
      setFormData(INITIAL_FORM_DATA);
      setEditingId(null);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Gagal menyimpan surat pernyataan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (document: SuratPernyataan1) => {
    setFormData(document);
    setEditingId(document.id);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (
      window.confirm("Apakah Anda yakin ingin menghapus surat pernyataan ini?")
    ) {
      try {
        await deleteDoc(doc(db, "surat_pernyataan_1", documentId));
        toast.success("Surat pernyataan berhasil dihapus");
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Gagal menghapus surat pernyataan");
      }
    }
  };

  const handleViewDetails = (document: SuratPernyataan1) => {
    setSelectedDocument(document);
    setIsDetailModalOpen(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "archived":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "draft":
        return "Draft";
      case "archived":
        return "Diarsipkan";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  // Generate PDF for the document
  const generatePDF = (document: SuratPernyataan1) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("SURAT PERNYATAAN", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Nomor: ${document.nomorSurat}`, 105, 30, { align: "center" });

    let yPosition = 50;

    // Title
    if (document.judulPernyataan) {
      doc.setFontSize(14);
      doc.text(document.judulPernyataan.toUpperCase(), 105, yPosition, {
        align: "center",
      });
      yPosition += 15;
    }

    // Personal Information
    doc.setFontSize(12);
    doc.text("Yang bertanda tangan di bawah ini:", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Nama Lengkap: ${document.namaLengkap}`, 20, yPosition);
    yPosition += 7;
    doc.text(`NIK: ${document.nik}`, 20, yPosition);
    yPosition += 7;
    doc.text(
      `Tempat/Tanggal Lahir: ${document.tempatLahir}, ${document.tanggalLahir}`,
      20,
      yPosition
    );
    yPosition += 7;
    doc.text(`Alamat: ${document.alamat}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Pekerjaan: ${document.pekerjaan}`, 20, yPosition);
    yPosition += 7;
    doc.text(`No. Telepon: ${document.noTelepon}`, 20, yPosition);
    yPosition += 15;

    // Statement Content
    doc.setFontSize(12);
    doc.text("Dengan ini menyatakan bahwa:", 20, yPosition);
    yPosition += 10;

    // Split long text into multiple lines
    const isiLines = doc.splitTextToSize(document.isiPernyataan, 170);
    doc.setFontSize(10);
    isiLines.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Purpose and consequences
    if (document.tujuanPernyataan) {
      doc.setFontSize(11);
      doc.text("Tujuan pernyataan ini adalah:", 20, yPosition);
      yPosition += 7;
      const tujuanLines = doc.splitTextToSize(document.tujuanPernyataan, 170);
      doc.setFontSize(10);
      tujuanLines.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    if (document.konsekuensi) {
      doc.setFontSize(11);
      doc.text(
        "Saya memahami konsekuensi hukum dari pernyataan ini:",
        20,
        yPosition
      );
      yPosition += 7;
      const konsekuensiLines = doc.splitTextToSize(document.konsekuensi, 170);
      doc.setFontSize(10);
      konsekuensiLines.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Legal basis
    if (document.dasarHukum) {
      doc.setFontSize(11);
      doc.text("Dasar hukum:", 20, yPosition);
      yPosition += 7;
      const dasarLines = doc.splitTextToSize(document.dasarHukum, 170);
      doc.setFontSize(10);
      dasarLines.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Statement validity
    doc.setFontSize(10);
    doc.text(
      "Demikian surat pernyataan ini saya buat dengan sebenar-benarnya",
      20,
      yPosition
    );
    yPosition += 7;
    doc.text("dan dapat dipertanggungjawabkan secara hukum.", 20, yPosition);
    yPosition += 15;

    // Signature area
    doc.text(
      `${document.tempatPembuatan}, ${document.tanggalSurat}`,
      20,
      yPosition
    );
    yPosition += 7;
    doc.text("Yang membuat pernyataan,", 20, yPosition);
    yPosition += 25;

    if (document.materai) {
      doc.text("(Materai Rp 10.000)", 20, yPosition);
      yPosition += 15;
    }

    doc.text(document.namaLengkap, 20, yPosition);

    // Witnesses if available
    if (document.saksi1Nama || document.saksi2Nama) {
      yPosition += 20;
      doc.setFontSize(11);
      doc.text("Saksi-saksi:", 20, yPosition);
      yPosition += 10;

      if (document.saksi1Nama) {
        doc.setFontSize(10);
        doc.text(`1. ${document.saksi1Nama}`, 25, yPosition);
        yPosition += 6;
        if (document.saksi1Alamat) {
          doc.text(`   ${document.saksi1Alamat}`, 25, yPosition);
          yPosition += 6;
        }
        yPosition += 5;
      }

      if (document.saksi2Nama) {
        doc.setFontSize(10);
        doc.text(`2. ${document.saksi2Nama}`, 25, yPosition);
        yPosition += 6;
        if (document.saksi2Alamat) {
          doc.text(`   ${document.saksi2Alamat}`, 25, yPosition);
        }
      }
    }

    doc.save(
      `surat-pernyataan-1-${document.nomorSurat.replace(/\//g, "-")}.pdf`
    );
    toast.success("PDF berhasil didownload");
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
                <BreadcrumbItem>
                  <BreadcrumbPage>Surat Pernyataan 1</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Surat Pernyataan 1
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Kelola dokumen surat pernyataan umum untuk klien
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setFormData(INITIAL_FORM_DATA);
                          setEditingId(null);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Buat Surat Pernyataan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingId ? "Edit" : "Buat"} Surat Pernyataan 1
                        </DialogTitle>
                        <DialogDescription>
                          Lengkapi informasi untuk membuat surat pernyataan
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* Document Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Informasi Dokumen
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nomor Surat</Label>
                                <Input
                                  value={formData.nomorSurat}
                                  onChange={(e) =>
                                    updateFormData("nomorSurat", e.target.value)
                                  }
                                  placeholder="Otomatis jika kosong"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tanggal Surat *</Label>
                                <Input
                                  type="date"
                                  value={formData.tanggalSurat}
                                  onChange={(e) =>
                                    updateFormData(
                                      "tanggalSurat",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tempat Pembuatan *</Label>
                                <Input
                                  value={formData.tempatPembuatan}
                                  onChange={(e) =>
                                    updateFormData(
                                      "tempatPembuatan",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Jakarta"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Jenis Pernyataan *</Label>
                                <Select
                                  value={formData.jenisPernyataan}
                                  onValueChange={(value) =>
                                    updateFormData("jenisPernyataan", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis pernyataan" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {JENIS_PERNYATAAN_OPTIONS.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Judul Pernyataan *</Label>
                              <Input
                                value={formData.judulPernyataan}
                                onChange={(e) =>
                                  updateFormData(
                                    "judulPernyataan",
                                    e.target.value
                                  )
                                }
                                placeholder="Judul atau subjek pernyataan"
                                required
                              />
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                  updateFormData("status", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="active">Aktif</SelectItem>
                                  <SelectItem value="archived">
                                    Diarsipkan
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    Dibatalkan
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Personal Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              Data Pembuat Pernyataan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nama Lengkap *</Label>
                                <Input
                                  value={formData.namaLengkap}
                                  onChange={(e) =>
                                    updateFormData(
                                      "namaLengkap",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>NIK *</Label>
                                <Input
                                  value={formData.nik}
                                  onChange={(e) =>
                                    updateFormData("nik", e.target.value)
                                  }
                                  maxLength={16}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tempat Lahir *</Label>
                                <Input
                                  value={formData.tempatLahir}
                                  onChange={(e) =>
                                    updateFormData(
                                      "tempatLahir",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tanggal Lahir *</Label>
                                <Input
                                  type="date"
                                  value={formData.tanggalLahir}
                                  onChange={(e) =>
                                    updateFormData(
                                      "tanggalLahir",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Pekerjaan *</Label>
                                <Input
                                  value={formData.pekerjaan}
                                  onChange={(e) =>
                                    updateFormData("pekerjaan", e.target.value)
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>No. Telepon *</Label>
                                <Input
                                  value={formData.noTelepon}
                                  onChange={(e) =>
                                    updateFormData("noTelepon", e.target.value)
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Alamat Lengkap *</Label>
                              <Textarea
                                value={formData.alamat}
                                onChange={(e) =>
                                  updateFormData("alamat", e.target.value)
                                }
                                rows={2}
                                required
                              />
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                  updateFormData("email", e.target.value)
                                }
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Statement Content */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5" />
                              Isi Pernyataan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Isi Pernyataan *</Label>
                                <Textarea
                                  value={formData.isiPernyataan}
                                  onChange={(e) =>
                                    updateFormData(
                                      "isiPernyataan",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Tulis isi pernyataan yang akan dibuat..."
                                  rows={6}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tujuan Pernyataan</Label>
                                <Textarea
                                  value={formData.tujuanPernyataan}
                                  onChange={(e) =>
                                    updateFormData(
                                      "tujuanPernyataan",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Jelaskan tujuan dari pernyataan ini..."
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Dasar Hukum</Label>
                                <Textarea
                                  value={formData.dasarHukum}
                                  onChange={(e) =>
                                    updateFormData("dasarHukum", e.target.value)
                                  }
                                  placeholder="Sebutkan dasar hukum yang mendukung pernyataan ini..."
                                  rows={3}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Konsekuensi Hukum</Label>
                                <Textarea
                                  value={formData.konsekuensi}
                                  onChange={(e) =>
                                    updateFormData(
                                      "konsekuensi",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Jelaskan konsekuensi hukum dari pernyataan ini..."
                                  rows={3}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Witnesses & Additional Info */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Building className="h-5 w-5" />
                              Saksi dan Informasi Tambahan
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Nama Saksi 1</Label>
                                  <Input
                                    value={formData.saksi1Nama}
                                    onChange={(e) =>
                                      updateFormData(
                                        "saksi1Nama",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Nama lengkap saksi pertama"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Alamat Saksi 1</Label>
                                  <Input
                                    value={formData.saksi1Alamat}
                                    onChange={(e) =>
                                      updateFormData(
                                        "saksi1Alamat",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Alamat saksi pertama"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Nama Saksi 2</Label>
                                  <Input
                                    value={formData.saksi2Nama}
                                    onChange={(e) =>
                                      updateFormData(
                                        "saksi2Nama",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Nama lengkap saksi kedua"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Alamat Saksi 2</Label>
                                  <Input
                                    value={formData.saksi2Alamat}
                                    onChange={(e) =>
                                      updateFormData(
                                        "saksi2Alamat",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Alamat saksi kedua"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="materai"
                                  checked={formData.materai}
                                  onChange={(e) =>
                                    updateFormData("materai", e.target.checked)
                                  }
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="materai">
                                  Menggunakan materai Rp 10.000
                                </Label>
                              </div>
                              <div className="space-y-2">
                                <Label>Keterangan Tambahan</Label>
                                <Textarea
                                  value={formData.keterangan}
                                  onChange={(e) =>
                                    updateFormData("keterangan", e.target.value)
                                  }
                                  placeholder="Keterangan tambahan jika diperlukan..."
                                  rows={2}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsCreateModalOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting
                              ? "Menyimpan..."
                              : editingId
                              ? "Update"
                              : "Simpan"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Search */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Pencarian Dokumen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Cari berdasarkan nama, nomor surat, jenis atau judul pernyataan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold">{documents.length}</div>
                    <div className="ml-auto text-muted-foreground">
                      Total Surat
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold">
                      {
                        documents.filter((doc) => doc.status === "active")
                          .length
                      }
                    </div>
                    <div className="ml-auto text-muted-foreground">
                      Surat Aktif
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold">
                      {documents.filter((doc) => doc.status === "draft").length}
                    </div>
                    <div className="ml-auto text-muted-foreground">Draft</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold">
                      {filteredDocuments.length}
                    </div>
                    <div className="ml-auto text-muted-foreground">
                      Hasil Pencarian
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Surat Pernyataan 1</CardTitle>
                <CardDescription>
                  Kelola semua dokumen surat pernyataan tipe 1
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">Memuat data dokumen...</div>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">
                      {searchTerm
                        ? "Tidak ada dokumen yang sesuai dengan pencarian"
                        : "Belum ada dokumen surat pernyataan"}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Nomor Surat</TableHead>
                          <TableHead>Nama Pembuat</TableHead>
                          <TableHead>Judul Pernyataan</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocuments.map((document, index) => (
                          <TableRow key={document.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {document.nomorSurat || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {document.namaLengkap || "-"}
                                </div>
                                <div className="text-gray-500">
                                  {document.nik || "-"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm max-w-48 truncate">
                                {document.judulPernyataan || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {document.jenisPernyataan || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {formatDate(document.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(document.status)}
                              >
                                {getStatusLabel(document.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(document)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(document)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generatePDF(document)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(document.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Document Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Surat Pernyataan 1</DialogTitle>
              <DialogDescription>
                Informasi lengkap surat pernyataan nomor:{" "}
                {selectedDocument?.nomorSurat}
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-6">
                {/* Document Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informasi Dokumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Nomor Surat</div>
                        <div className="font-medium">
                          {selectedDocument.nomorSurat || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Tanggal Surat
                        </div>
                        <div className="font-medium">
                          {selectedDocument.tanggalSurat || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Tempat Pembuatan
                        </div>
                        <div className="font-medium">
                          {selectedDocument.tempatPembuatan || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Jenis Pernyataan
                        </div>
                        <div className="font-medium">
                          {selectedDocument.jenisPernyataan || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <Badge
                          variant={getStatusBadgeVariant(
                            selectedDocument.status
                          )}
                        >
                          {getStatusLabel(selectedDocument.status)}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Materai</div>
                        <div className="font-medium">
                          {selectedDocument.materai ? "Ya" : "Tidak"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">
                        Judul Pernyataan
                      </div>
                      <div className="font-medium mt-1">
                        {selectedDocument.judulPernyataan || "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Data Pembuat Pernyataan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Nama Lengkap
                        </div>
                        <div className="font-medium">
                          {selectedDocument.namaLengkap || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">NIK</div>
                        <div className="font-medium">
                          {selectedDocument.nik || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Tempat/Tanggal Lahir
                        </div>
                        <div className="font-medium">
                          {selectedDocument.tempatLahir || "-"},{" "}
                          {selectedDocument.tanggalLahir || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Pekerjaan</div>
                        <div className="font-medium">
                          {selectedDocument.pekerjaan || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">No. Telepon</div>
                        <div className="font-medium">
                          {selectedDocument.noTelepon || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">
                          {selectedDocument.email || "-"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">Alamat</div>
                      <div className="font-medium">
                        {selectedDocument.alamat || "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statement Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Isi Pernyataan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Isi Pernyataan
                        </div>
                        <div className="font-medium mt-1 whitespace-pre-wrap">
                          {selectedDocument.isiPernyataan || "-"}
                        </div>
                      </div>
                      {selectedDocument.tujuanPernyataan && (
                        <div>
                          <div className="text-sm text-gray-500">
                            Tujuan Pernyataan
                          </div>
                          <div className="font-medium mt-1 whitespace-pre-wrap">
                            {selectedDocument.tujuanPernyataan}
                          </div>
                        </div>
                      )}
                      {selectedDocument.dasarHukum && (
                        <div>
                          <div className="text-sm text-gray-500">
                            Dasar Hukum
                          </div>
                          <div className="font-medium mt-1 whitespace-pre-wrap">
                            {selectedDocument.dasarHukum}
                          </div>
                        </div>
                      )}
                      {selectedDocument.konsekuensi && (
                        <div>
                          <div className="text-sm text-gray-500">
                            Konsekuensi Hukum
                          </div>
                          <div className="font-medium mt-1 whitespace-pre-wrap">
                            {selectedDocument.konsekuensi}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Witnesses */}
                {(selectedDocument.saksi1Nama ||
                  selectedDocument.saksi2Nama) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Data Saksi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedDocument.saksi1Nama && (
                          <div>
                            <div className="text-sm text-gray-500">Saksi 1</div>
                            <div className="font-medium">
                              {selectedDocument.saksi1Nama}
                            </div>
                            {selectedDocument.saksi1Alamat && (
                              <div className="text-sm text-gray-500 mt-1">
                                {selectedDocument.saksi1Alamat}
                              </div>
                            )}
                          </div>
                        )}
                        {selectedDocument.saksi2Nama && (
                          <div>
                            <div className="text-sm text-gray-500">Saksi 2</div>
                            <div className="font-medium">
                              {selectedDocument.saksi2Nama}
                            </div>
                            {selectedDocument.saksi2Alamat && (
                              <div className="text-sm text-gray-500 mt-1">
                                {selectedDocument.saksi2Alamat}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => generatePDF(selectedDocument)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleEdit(selectedDocument);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
