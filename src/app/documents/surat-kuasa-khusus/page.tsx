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

// Power of Attorney interface
interface SuratKuasaKhusus {
  id: string;
  // Pemberi Kuasa (Principal)
  pemberiKuasa: {
    namaLengkap: string;
    nik: string;
    tempatLahir: string;
    tanggalLahir: string;
    alamat: string;
    pekerjaan: string;
    noTelepon: string;
    email?: string;
  };
  // Penerima Kuasa (Attorney)
  penerimaKuasa: {
    namaLengkap: string;
    nik: string;
    tempatLahir: string;
    tanggalLahir: string;
    alamat: string;
    pekerjaan: string;
    noTelepon: string;
    email?: string;
  };
  // Document Details
  nomorSurat: string;
  tanggalSurat: string;
  tempatPembuatan: string;
  jenisKuasa: string;
  ruangLingkup: string;
  keterangan: string;
  masaBerlaku: string;
  // Status and metadata
  status: "draft" | "active" | "expired" | "revoked";
  createdAt: any;
  updatedAt: any;
  createdBy?: string;
}

const INITIAL_FORM_DATA: Omit<
  SuratKuasaKhusus,
  "id" | "createdAt" | "updatedAt"
> = {
  pemberiKuasa: {
    namaLengkap: "",
    nik: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    pekerjaan: "",
    noTelepon: "",
    email: "",
  },
  penerimaKuasa: {
    namaLengkap: "",
    nik: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    pekerjaan: "",
    noTelepon: "",
    email: "",
  },
  nomorSurat: "",
  tanggalSurat: "",
  tempatPembuatan: "",
  jenisKuasa: "",
  ruangLingkup: "",
  keterangan: "",
  masaBerlaku: "",
  status: "draft",
};

const JENIS_KUASA_OPTIONS = [
  "Kuasa Hukum Umum",
  "Kuasa Hukum Khusus",
  "Kuasa Negosiasi Hutang",
  "Kuasa Penyelesaian Sengketa",
  "Kuasa Representasi di Pengadilan",
  "Kuasa Administrasi",
  "Kuasa Lainnya",
];

export default function SuratKuasaKhususPage() {
  const [documents, setDocuments] = useState<SuratKuasaKhusus[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<
    SuratKuasaKhusus[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<SuratKuasaKhusus | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch documents from Firestore
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "surat_kuasa_khusus"),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const documentsData: SuratKuasaKhusus[] = [];
          querySnapshot.forEach((doc) => {
            documentsData.push({
              id: doc.id,
              ...doc.data(),
            } as SuratKuasaKhusus);
          });
          setDocuments(documentsData);
          setFilteredDocuments(documentsData);
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Gagal memuat data surat kuasa");
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
          doc.pemberiKuasa?.namaLengkap
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
          doc.penerimaKuasa?.namaLengkap
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
          doc.nomorSurat?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
          doc.jenisKuasa?.toLowerCase()?.includes(searchTerm.toLowerCase())
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
    return `SKK/${String(count).padStart(3, "0")}/${month}/${year}`;
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
        await updateDoc(doc(db, "surat_kuasa_khusus", editingId), documentData);
        toast.success("Surat kuasa berhasil diperbarui");
      } else {
        // Create new document
        await addDoc(collection(db, "surat_kuasa_khusus"), {
          ...documentData,
          createdAt: serverTimestamp(),
        });
        toast.success("Surat kuasa berhasil dibuat");
      }

      // Reset form and close modal
      setFormData(INITIAL_FORM_DATA);
      setEditingId(null);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Gagal menyimpan surat kuasa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (document: SuratKuasaKhusus) => {
    setFormData(document);
    setEditingId(document.id);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus surat kuasa ini?")) {
      try {
        await deleteDoc(doc(db, "surat_kuasa_khusus", documentId));
        toast.success("Surat kuasa berhasil dihapus");
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Gagal menghapus surat kuasa");
      }
    }
  };

  const handleViewDetails = (document: SuratKuasaKhusus) => {
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
      case "expired":
        return "destructive";
      case "revoked":
        return "outline";
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
      case "expired":
        return "Kadaluarsa";
      case "revoked":
        return "Dicabut";
      default:
        return status;
    }
  };

  // Generate PDF for the document
  const generatePDF = (document: SuratKuasaKhusus) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("SURAT KUASA KHUSUS", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Nomor: ${document.nomorSurat}`, 105, 30, { align: "center" });

    let yPosition = 50;

    // Pemberi Kuasa Section
    doc.setFontSize(14);
    doc.text("PEMBERI KUASA", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(
      `Nama Lengkap: ${document.pemberiKuasa.namaLengkap}`,
      20,
      yPosition
    );
    yPosition += 7;
    doc.text(`NIK: ${document.pemberiKuasa.nik}`, 20, yPosition);
    yPosition += 7;
    doc.text(
      `Tempat/Tanggal Lahir: ${document.pemberiKuasa.tempatLahir}, ${document.pemberiKuasa.tanggalLahir}`,
      20,
      yPosition
    );
    yPosition += 7;
    doc.text(`Alamat: ${document.pemberiKuasa.alamat}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Pekerjaan: ${document.pemberiKuasa.pekerjaan}`, 20, yPosition);
    yPosition += 7;
    doc.text(`No. Telepon: ${document.pemberiKuasa.noTelepon}`, 20, yPosition);
    yPosition += 15;

    // Penerima Kuasa Section
    doc.setFontSize(14);
    doc.text("PENERIMA KUASA", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(
      `Nama Lengkap: ${document.penerimaKuasa.namaLengkap}`,
      20,
      yPosition
    );
    yPosition += 7;
    doc.text(`NIK: ${document.penerimaKuasa.nik}`, 20, yPosition);
    yPosition += 7;
    doc.text(
      `Tempat/Tanggal Lahir: ${document.penerimaKuasa.tempatLahir}, ${document.penerimaKuasa.tanggalLahir}`,
      20,
      yPosition
    );
    yPosition += 7;
    doc.text(`Alamat: ${document.penerimaKuasa.alamat}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Pekerjaan: ${document.penerimaKuasa.pekerjaan}`, 20, yPosition);
    yPosition += 7;
    doc.text(`No. Telepon: ${document.penerimaKuasa.noTelepon}`, 20, yPosition);
    yPosition += 15;

    // Document Details
    doc.setFontSize(14);
    doc.text("KETERANGAN KUASA", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Jenis Kuasa: ${document.jenisKuasa}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Ruang Lingkup: ${document.ruangLingkup}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Masa Berlaku: ${document.masaBerlaku}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Keterangan: ${document.keterangan}`, 20, yPosition);
    yPosition += 15;

    // Footer
    doc.text(
      `${document.tempatPembuatan}, ${document.tanggalSurat}`,
      20,
      yPosition
    );

    doc.save(
      `surat-kuasa-khusus-${document.nomorSurat.replace(/\//g, "-")}.pdf`
    );
    toast.success("PDF berhasil didownload");
  };

  const updateFormData = (section: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...((prev[section as keyof typeof prev] as Record<string, any>) || {}), // Fallback to empty object
        [field]: value,
      },
    }));
  };

  const updateRootFormData = (field: string, value: string) => {
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
                  <BreadcrumbPage>Surat Kuasa Khusus</BreadcrumbPage>
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
                    Surat Kuasa Khusus
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Kelola dokumen surat kuasa khusus untuk klien
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
                        Buat Surat Kuasa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingId ? "Edit" : "Buat"} Surat Kuasa Khusus
                        </DialogTitle>
                        <DialogDescription>
                          Lengkapi informasi untuk membuat surat kuasa khusus
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
                                    updateRootFormData(
                                      "nomorSurat",
                                      e.target.value
                                    )
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
                                    updateRootFormData(
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
                                    updateRootFormData(
                                      "tempatPembuatan",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Jakarta"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Jenis Kuasa *</Label>
                                <Select
                                  value={formData.jenisKuasa}
                                  onValueChange={(value) =>
                                    updateRootFormData("jenisKuasa", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis kuasa" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {JENIS_KUASA_OPTIONS.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Ruang Lingkup Kuasa *</Label>
                              <Textarea
                                value={formData.ruangLingkup}
                                onChange={(e) =>
                                  updateRootFormData(
                                    "ruangLingkup",
                                    e.target.value
                                  )
                                }
                                placeholder="Jelaskan ruang lingkup kewenangan yang diberikan..."
                                rows={3}
                                required
                              />
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Masa Berlaku *</Label>
                                <Input
                                  value={formData.masaBerlaku}
                                  onChange={(e) =>
                                    updateRootFormData(
                                      "masaBerlaku",
                                      e.target.value
                                    )
                                  }
                                  placeholder="6 bulan / sampai selesai"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                  value={formData.status}
                                  onValueChange={(value) =>
                                    updateRootFormData("status", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">
                                      Aktif
                                    </SelectItem>
                                    <SelectItem value="expired">
                                      Kadaluarsa
                                    </SelectItem>
                                    <SelectItem value="revoked">
                                      Dicabut
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Keterangan Tambahan</Label>
                              <Textarea
                                value={formData.keterangan}
                                onChange={(e) =>
                                  updateRootFormData(
                                    "keterangan",
                                    e.target.value
                                  )
                                }
                                placeholder="Keterangan tambahan jika diperlukan..."
                                rows={2}
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Pemberi Kuasa */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              Data Pemberi Kuasa
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nama Lengkap *</Label>
                                <Input
                                  value={formData.pemberiKuasa.namaLengkap}
                                  onChange={(e) =>
                                    updateFormData(
                                      "pemberiKuasa",
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
                                  value={formData.pemberiKuasa.nik}
                                  onChange={(e) =>
                                    updateFormData(
                                      "pemberiKuasa",
                                      "nik",
                                      e.target.value
                                    )
                                  }
                                  maxLength={16}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tempat Lahir *</Label>
                                <Input
                                  value={formData.pemberiKuasa.tempatLahir}
                                  onChange={(e) =>
                                    updateFormData(
                                      "pemberiKuasa",
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
                                  value={formData.pemberiKuasa.tanggalLahir}
                                  onChange={(e) =>
                                    updateFormData(
                                      "pemberiKuasa",
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
                                  value={formData.pemberiKuasa.pekerjaan}
                                  onChange={(e) =>
                                    updateFormData(
                                      "pemberiKuasa",
                                      "pekerjaan",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>No. Telepon *</Label>
                                <Input
                                  value={formData.pemberiKuasa.noTelepon}
                                  onChange={(e) =>
                                    updateFormData(
                                      "pemberiKuasa",
                                      "noTelepon",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Alamat Lengkap *</Label>
                              <Textarea
                                value={formData.pemberiKuasa.alamat}
                                onChange={(e) =>
                                  updateFormData(
                                    "pemberiKuasa",
                                    "alamat",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                required
                              />
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={formData.pemberiKuasa.email}
                                onChange={(e) =>
                                  updateFormData(
                                    "pemberiKuasa",
                                    "email",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Penerima Kuasa */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Building className="h-5 w-5" />
                              Data Penerima Kuasa
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nama Lengkap *</Label>
                                <Input
                                  value={formData.penerimaKuasa.namaLengkap}
                                  onChange={(e) =>
                                    updateFormData(
                                      "penerimaKuasa",
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
                                  value={formData.penerimaKuasa.nik}
                                  onChange={(e) =>
                                    updateFormData(
                                      "penerimaKuasa",
                                      "nik",
                                      e.target.value
                                    )
                                  }
                                  maxLength={16}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tempat Lahir *</Label>
                                <Input
                                  value={formData.penerimaKuasa.tempatLahir}
                                  onChange={(e) =>
                                    updateFormData(
                                      "penerimaKuasa",
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
                                  value={formData.penerimaKuasa.tanggalLahir}
                                  onChange={(e) =>
                                    updateFormData(
                                      "penerimaKuasa",
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
                                  value={formData.penerimaKuasa.pekerjaan}
                                  onChange={(e) =>
                                    updateFormData(
                                      "penerimaKuasa",
                                      "pekerjaan",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>No. Telepon *</Label>
                                <Input
                                  value={formData.penerimaKuasa.noTelepon}
                                  onChange={(e) =>
                                    updateFormData(
                                      "penerimaKuasa",
                                      "noTelepon",
                                      e.target.value
                                    )
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Alamat Lengkap *</Label>
                              <Textarea
                                value={formData.penerimaKuasa.alamat}
                                onChange={(e) =>
                                  updateFormData(
                                    "penerimaKuasa",
                                    "alamat",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                required
                              />
                            </div>
                            <div className="mt-4 space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={formData.penerimaKuasa.email}
                                onChange={(e) =>
                                  updateFormData(
                                    "penerimaKuasa",
                                    "email",
                                    e.target.value
                                  )
                                }
                              />
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
                  placeholder="Cari berdasarkan nama pemberi/penerima kuasa, nomor surat, atau jenis kuasa..."
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
                <CardTitle>Daftar Surat Kuasa Khusus</CardTitle>
                <CardDescription>
                  Kelola semua dokumen surat kuasa khusus
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
                        : "Belum ada dokumen surat kuasa"}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Nomor Surat</TableHead>
                          <TableHead>Pemberi Kuasa</TableHead>
                          <TableHead>Penerima Kuasa</TableHead>
                          <TableHead>Jenis Kuasa</TableHead>
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
                                  {document.pemberiKuasa?.namaLengkap || "-"}
                                </div>
                                <div className="text-gray-500">
                                  {document.pemberiKuasa?.nik || "-"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {document.penerimaKuasa?.namaLengkap || "-"}
                                </div>
                                <div className="text-gray-500">
                                  {document.penerimaKuasa?.pekerjaan || "-"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {document.jenisKuasa || "-"}
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
              <DialogTitle>Detail Surat Kuasa Khusus</DialogTitle>
              <DialogDescription>
                Informasi lengkap surat kuasa nomor:{" "}
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
                        <div className="text-sm text-gray-500">Jenis Kuasa</div>
                        <div className="font-medium">
                          {selectedDocument.jenisKuasa || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Masa Berlaku
                        </div>
                        <div className="font-medium">
                          {selectedDocument.masaBerlaku || "-"}
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
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">
                        Ruang Lingkup Kuasa
                      </div>
                      <div className="font-medium mt-1">
                        {selectedDocument.ruangLingkup || "-"}
                      </div>
                    </div>
                    {selectedDocument.keterangan && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-500">Keterangan</div>
                        <div className="font-medium mt-1">
                          {selectedDocument.keterangan}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pemberi Kuasa */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Data Pemberi Kuasa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Nama Lengkap
                        </div>
                        <div className="font-medium">
                          {selectedDocument.pemberiKuasa?.namaLengkap || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">NIK</div>
                        <div className="font-medium">
                          {selectedDocument.pemberiKuasa?.nik || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Tempat/Tanggal Lahir
                        </div>
                        <div className="font-medium">
                          {selectedDocument.pemberiKuasa?.tempatLahir || "-"},{" "}
                          {selectedDocument.pemberiKuasa?.tanggalLahir || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Pekerjaan</div>
                        <div className="font-medium">
                          {selectedDocument.pemberiKuasa?.pekerjaan || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">No. Telepon</div>
                        <div className="font-medium">
                          {selectedDocument.pemberiKuasa?.noTelepon || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">
                          {selectedDocument.pemberiKuasa?.email || "-"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">Alamat</div>
                      <div className="font-medium">
                        {selectedDocument.pemberiKuasa?.alamat || "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Penerima Kuasa */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Data Penerima Kuasa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">
                          Nama Lengkap
                        </div>
                        <div className="font-medium">
                          {selectedDocument.penerimaKuasa?.namaLengkap || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">NIK</div>
                        <div className="font-medium">
                          {selectedDocument.penerimaKuasa?.nik || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Tempat/Tanggal Lahir
                        </div>
                        <div className="font-medium">
                          {selectedDocument.penerimaKuasa?.tempatLahir || "-"},{" "}
                          {selectedDocument.penerimaKuasa?.tanggalLahir || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Pekerjaan</div>
                        <div className="font-medium">
                          {selectedDocument.penerimaKuasa?.pekerjaan || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">No. Telepon</div>
                        <div className="font-medium">
                          {selectedDocument.penerimaKuasa?.noTelepon || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">
                          {selectedDocument.penerimaKuasa?.email || "-"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm text-gray-500">Alamat</div>
                      <div className="font-medium">
                        {selectedDocument.penerimaKuasa?.alamat || "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
