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
  Save,
} from "lucide-react";
import {
  collection,
  addDoc,
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

// Legal Service Agreement interface
interface PerjanjianJasaHukum {
  id: string;
  nomorPerjanjian: string;
  tanggalPerjanjian: string;
  tempatPembuatan: string;
  pihakPertama: {
    nama: string;
    alamat: string;
    noTelepon: string;
    email?: string;
  };
  pihakKedua: {
    nama: string;
    alamat: string;
    noTelepon: string;
    email?: string;
  };
  objekPerjanjian: string;
  ruangLingkup: string;
  honorarium: string;
  jangkaWaktu: string;
  ketentuanLain: string;
  status: "draft" | "active" | "completed" | "cancelled";
  createdAt: any;
  updatedAt: any;
  createdBy?: string;
}

const INITIAL_FORM_DATA: Omit<
  PerjanjianJasaHukum,
  "id" | "createdAt" | "updatedAt"
> = {
  nomorPerjanjian: "",
  tanggalPerjanjian: "",
  tempatPembuatan: "",
  pihakPertama: {
    nama: "",
    alamat: "",
    noTelepon: "",
    email: "",
  },
  pihakKedua: {
    nama: "",
    alamat: "",
    noTelepon: "",
    email: "",
  },
  objekPerjanjian: "",
  ruangLingkup: "",
  honorarium: "",
  jangkaWaktu: "",
  ketentuanLain: "",
  status: "draft",
};

export default function PerjanjianJasaHukumPage() {
  const [documents, setDocuments] = useState<PerjanjianJasaHukum[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<
    PerjanjianJasaHukum[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<PerjanjianJasaHukum | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "perjanjian_jasa_hukum"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: PerjanjianJasaHukum[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as PerjanjianJasaHukum);
      });
      setDocuments(docs);
      setFilteredDocuments(docs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(
        (doc) =>
          doc.pihakPertama.nama
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          doc.pihakKedua.nama
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          doc.nomorPerjanjian
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          doc.objekPerjanjian.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  const generateDocumentNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = documents.length + 1;
    return `PJH/${String(count).padStart(3, "0")}/${month}/${year}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const documentData = {
        ...formData,
        nomorPerjanjian: formData.nomorPerjanjian || generateDocumentNumber(),
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(
          doc(db, "perjanjian_jasa_hukum", editingId),
          documentData
        );
        toast.success("Perjanjian berhasil diperbarui");
      } else {
        await addDoc(collection(db, "perjanjian_jasa_hukum"), {
          ...documentData,
          createdAt: serverTimestamp(),
        });
        toast.success("Perjanjian berhasil dibuat");
      }
      setFormData(INITIAL_FORM_DATA);
      setEditingId(null);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Gagal menyimpan perjanjian");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (document: PerjanjianJasaHukum) => {
    setFormData(document);
    setEditingId(document.id);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus perjanjian ini?")) {
      try {
        await deleteDoc(doc(db, "perjanjian_jasa_hukum", documentId));
        toast.success("Perjanjian berhasil dihapus");
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Gagal menghapus perjanjian");
      }
    }
  };

  const handleViewDetails = (document: PerjanjianJasaHukum) => {
    setSelectedDocument(document);
    setIsDetailModalOpen(true);
  };

  const updateFormData = (section: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] || {}),
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
      case "completed":
        return "success";
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
      case "completed":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  // PDF generation (simple)
  const generatePDF = (document: PerjanjianJasaHukum) => {
    const docPDF = new jsPDF();
    docPDF.setFontSize(16);
    docPDF.text("PERJANJIAN JASA HUKUM", 105, 20, { align: "center" });
    docPDF.setFontSize(12);
    docPDF.text(`Nomor: ${document.nomorPerjanjian}`, 105, 30, {
      align: "center",
    });
    let y = 45;
    docPDF.setFontSize(11);
    docPDF.text(`Tanggal: ${document.tanggalPerjanjian}`, 20, y);
    y += 8;
    docPDF.text(`Tempat: ${document.tempatPembuatan}`, 20, y);
    y += 12;
    docPDF.text("PIHAK PERTAMA:", 20, y);
    y += 7;
    docPDF.text(`Nama: ${document.pihakPertama.nama}`, 20, y);
    y += 7;
    docPDF.text(`Alamat: ${document.pihakPertama.alamat}`, 20, y);
    y += 7;
    docPDF.text(`No. Telepon: ${document.pihakPertama.noTelepon}`, 20, y);
    y += 7;
    if (document.pihakPertama.email) {
      docPDF.text(`Email: ${document.pihakPertama.email}`, 20, y);
      y += 7;
    }
    y += 5;
    docPDF.text("PIHAK KEDUA:", 20, y);
    y += 7;
    docPDF.text(`Nama: ${document.pihakKedua.nama}`, 20, y);
    y += 7;
    docPDF.text(`Alamat: ${document.pihakKedua.alamat}`, 20, y);
    y += 7;
    docPDF.text(`No. Telepon: ${document.pihakKedua.noTelepon}`, 20, y);
    y += 7;
    if (document.pihakKedua.email) {
      docPDF.text(`Email: ${document.pihakKedua.email}`, 20, y);
      y += 7;
    }
    y += 5;
    docPDF.text("OBJEK PERJANJIAN:", 20, y);
    y += 7;
    docPDF.text(document.objekPerjanjian, 20, y);
    y += 10;
    docPDF.text("RUANG LINGKUP:", 20, y);
    y += 7;
    docPDF.text(document.ruangLingkup, 20, y);
    y += 10;
    docPDF.text("HONORARIUM:", 20, y);
    y += 7;
    docPDF.text(document.honorarium, 20, y);
    y += 10;
    docPDF.text("JANGKA WAKTU:", 20, y);
    y += 7;
    docPDF.text(document.jangkaWaktu, 20, y);
    y += 10;
    docPDF.text("KETENTUAN LAIN-LAIN:", 20, y);
    y += 7;
    docPDF.text(document.ketentuanLain, 20, y);
    y += 15;
    docPDF.text("PIHAK PERTAMA", 20, y);
    docPDF.text("PIHAK KEDUA", 120, y);
    y += 20;
    docPDF.text(document.pihakPertama.nama, 20, y);
    docPDF.text(document.pihakKedua.nama, 120, y);
    docPDF.save(
      `perjanjian-jasa-hukum-${document.nomorPerjanjian.replace(
        /\//g,
        "-"
      )}.pdf`
    );
    toast.success("PDF berhasil didownload");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
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
                  <BreadcrumbPage>Perjanjian Jasa Hukum</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {/* ...existing code for search, statistics, table, modals, and forms, following the same pattern as other document pages... */}
      </SidebarInset>
    </SidebarProvider>
  );
}
