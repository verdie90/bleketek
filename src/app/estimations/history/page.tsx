"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Download,
  Eye,
  Search,
  Calendar,
  Filter,
  Trash2,
  Edit,
  MoreHorizontal,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  addDoc,
  deleteDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

// Interfaces
interface EstimationRecord {
  id: string;
  estimationNumber: string;
  clientName: string;
  phoneNumber: string;
  totalDebt: number;
  serviceFeePct: number;
  serviceFee: number;
  totalPaymentAmount: number;
  paymentType: "lunas" | "cicilan";
  debtDetails: DebtDetail[];
  paymentTerms: PaymentTerm[];
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "pending" | "konversi" | "cancel";
}

interface DebtDetail {
  id: string;
  debtType: string;
  typeId: string;
  bankProvider: string;
  totalDebt: number;
}

interface PaymentTerm {
  id: string;
  amount: number;
  dueDate?: Date;
}

export default function EstimationHistoryPage() {
  const [estimations, setEstimations] = useState<EstimationRecord[]>([]);
  const [filteredEstimations, setFilteredEstimations] = useState<
    EstimationRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstimation, setSelectedEstimation] =
    useState<EstimationRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // New state for advanced features
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<
    "selected" | "status" | "dateRange"
  >("selected");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [editingEstimation, setEditingEstimation] =
    useState<EstimationRecord | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [selectAll, setSelectAll] = useState(false);

  // Fetch estimations from Firestore
  useEffect(() => {
    fetchEstimations();
  }, []);

  // Filter estimations based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredEstimations(estimations);
    } else {
      const filtered = estimations.filter(
        (estimation) =>
          estimation.clientName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          estimation.estimationNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          estimation.phoneNumber.includes(searchTerm)
      );
      setFilteredEstimations(filtered);
    }
  }, [searchTerm, estimations]);

  // Update selectAll status based on selected items
  useEffect(() => {
    const visibleItems = filteredEstimations.filter(
      (est) => filterStatus === "all" || est.status === filterStatus
    );
    const allVisible =
      visibleItems.length > 0 &&
      visibleItems.every((est) => selectedItems.includes(est.id));
    setSelectAll(allVisible);
  }, [selectedItems, filteredEstimations, filterStatus]);

  const fetchEstimations = async () => {
    try {
      setLoading(true);
      const estimationsRef = collection(db, "estimations");
      const q = query(estimationsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const estimationsData: EstimationRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Handle Firestore Timestamp conversion
        const processTimestamp = (timestamp: any) => {
          if (timestamp && typeof timestamp.toDate === "function") {
            return timestamp.toDate();
          }
          if (timestamp && timestamp.seconds) {
            return new Date(timestamp.seconds * 1000);
          }
          return new Date();
        };

        // Process payment terms with date conversion
        const processedPaymentTerms = (data.paymentTerms || []).map(
          (term: any) => ({
            ...term,
            dueDate: term.dueDate ? processTimestamp(term.dueDate) : undefined,
          })
        );

        estimationsData.push({
          id: doc.id,
          estimationNumber: data.estimationNumber || "",
          clientName: data.clientName || "",
          phoneNumber: data.phoneNumber || "",
          totalDebt: data.totalDebt || 0,
          serviceFeePct: data.serviceFeePct || 0,
          serviceFee: data.serviceFee || 0,
          totalPaymentAmount: data.totalPaymentAmount || 0,
          paymentType: data.paymentType || "lunas",
          debtDetails: data.debtDetails || [],
          paymentTerms: processedPaymentTerms,
          createdAt: processTimestamp(data.createdAt),
          updatedAt: processTimestamp(data.updatedAt),
          status: data.status || "draft",
        });
      });

      setEstimations(estimationsData);
      console.log(
        `Loaded ${estimationsData.length} estimations from Firestore`
      );

      // If no data exists, optionally create sample data for testing
      if (estimationsData.length === 0) {
        console.log(
          "No estimations found. You can create sample data from the Create Estimation page."
        );
      }
    } catch (error) {
      console.error("Error fetching estimations:", error);
      toast.error("Gagal memuat data estimasi");
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      const loadingToast = toast.loading("Creating sample data...");

      // Sample estimation data
      const sampleEstimations = [
        {
          estimationNumber: "EST-2025-001",
          clientName: "John Doe",
          phoneNumber: "081234567890",
          marketing: "Jane Smith",
          referralSource: "Website",
          debtDetails: [
            {
              id: "1",
              debtType: "Kartu Kredit",
              typeId: "cc_1",
              bankProvider: "Bank Mandiri",
              totalDebt: 15000000,
            },
            {
              id: "2",
              debtType: "KTA",
              typeId: "kta_1",
              bankProvider: "Bank BCA",
              totalDebt: 25000000,
            },
          ],
          serviceFeePct: 15,
          serviceFeeManual: false,
          paymentType: "cicilan",
          downPayment: 5000000,
          paymentTerms: [
            {
              id: "1",
              amount: 10000000,
              dueDate: Timestamp.fromDate(new Date(2025, 8, 15)), // Sep 15, 2025
            },
            {
              id: "2",
              amount: 10000000,
              dueDate: Timestamp.fromDate(new Date(2025, 9, 15)), // Oct 15, 2025
            },
          ],
          totalDebt: 40000000,
          serviceFee: 6000000,
          totalPaymentAmount: 46000000,
          status: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          estimationNumber: "EST-2025-002",
          clientName: "Sarah Wilson",
          phoneNumber: "085678901234",
          marketing: "Mike Johnson",
          referralSource: "Referral",
          debtDetails: [
            {
              id: "1",
              debtType: "Pinjol",
              typeId: "ol_1",
              bankProvider: "Shopee Paylater",
              totalDebt: 8000000,
            },
          ],
          serviceFeePct: 20,
          serviceFeeManual: false,
          paymentType: "lunas",
          fullPaymentDate: Timestamp.fromDate(new Date(2025, 7, 30)), // Aug 30, 2025
          downPayment: 0,
          paymentTerms: [],
          totalDebt: 8000000,
          serviceFee: 1600000,
          totalPaymentAmount: 9600000,
          status: "draft",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      // Add sample data to Firestore
      for (const estimation of sampleEstimations) {
        await addDoc(collection(db, "estimations"), estimation);
      }

      toast.dismiss(loadingToast);
      toast.success("Sample data created successfully!");

      // Refresh the data
      fetchEstimations();
    } catch (error) {
      console.error("Error creating sample data:", error);
      toast.error("Failed to create sample data");
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      pending: { label: "Pending", variant: "default" as const },
      konversi: { label: "Konversi", variant: "outline" as const },
      cancel: { label: "Cancel", variant: "destructive" as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewDetail = (estimation: EstimationRecord) => {
    setSelectedEstimation(estimation);
    setShowDetailDialog(true);
  };

  // Handle selection functions
  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleItems = filteredEstimations.filter(
      (est) => filterStatus === "all" || est.status === filterStatus
    );

    if (selectAll) {
      // Remove all visible items from selection
      setSelectedItems((prev) =>
        prev.filter((id) => !visibleItems.some((est) => est.id === id))
      );
    } else {
      // Add all visible items to selection
      const newSelections = visibleItems.map((est) => est.id);
      setSelectedItems((prev) => [...new Set([...prev, ...newSelections])]);
    }
  };

  // Delete functions
  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      toast.error("Pilih estimasi yang akan dihapus");
      return;
    }
    setDeleteType("selected");
    setShowDeleteDialog(true);
  };

  const handleDeleteByStatus = (status: string) => {
    setFilterStatus(status);
    setDeleteType("status");
    setShowDeleteDialog(true);
  };

  const handleDeleteByDateRange = () => {
    if (!startDate || !endDate) {
      toast.error("Pilih rentang tanggal");
      return;
    }
    setDeleteType("dateRange");
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const loadingToast = toast.loading("Menghapus estimasi...");
      const batch = writeBatch(db);

      let toDelete: EstimationRecord[] = [];

      switch (deleteType) {
        case "selected":
          toDelete = estimations.filter((est) =>
            selectedItems.includes(est.id)
          );
          break;
        case "status":
          toDelete = estimations.filter((est) => est.status === filterStatus);
          break;
        case "dateRange":
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // End of day
          toDelete = estimations.filter(
            (est) => est.createdAt >= start && est.createdAt <= end
          );
          break;
      }

      toDelete.forEach((estimation) => {
        const docRef = doc(db, "estimations", estimation.id);
        batch.delete(docRef);
      });

      await batch.commit();

      toast.dismiss(loadingToast);
      toast.success(`${toDelete.length} estimasi berhasil dihapus`);

      setShowDeleteDialog(false);
      setSelectedItems([]);
      setSelectAll(false);
      fetchEstimations();
    } catch (error) {
      console.error("Error deleting estimations:", error);
      toast.error("Gagal menghapus estimasi");
    }
  };

  // Edit functions
  const handleEditEstimation = (estimation: EstimationRecord) => {
    setEditingEstimation(estimation);
    setNewStatus(estimation.status);
    setShowEditDialog(true);
  };

  const handleUpdateStatus = async (estimationId: string, status: string) => {
    try {
      const loadingToast = toast.loading("Mengupdate status...");

      const docRef = doc(db, "estimations", estimationId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      });

      toast.dismiss(loadingToast);
      toast.success("Status berhasil diupdate");
      fetchEstimations();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Gagal mengupdate status");
    }
  };

  const saveEditedEstimation = async () => {
    if (!editingEstimation) return;

    try {
      const loadingToast = toast.loading("Menyimpan perubahan...");

      const docRef = doc(db, "estimations", editingEstimation.id);
      await updateDoc(docRef, {
        ...editingEstimation,
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      toast.dismiss(loadingToast);
      toast.success("Estimasi berhasil diupdate");
      setShowEditDialog(false);
      setEditingEstimation(null);
      fetchEstimations();
    } catch (error) {
      console.error("Error updating estimation:", error);
      toast.error("Gagal mengupdate estimasi");
    }
  };

  const handleDownloadPDF = async (estimation: EstimationRecord) => {
    let loadingToast: any;

    try {
      loadingToast = toast.loading("Generating PDF...");

      // Import PDF libraries with fallback
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF();

      // Manual table creation function as fallback
      const createTableManually = (
        headers: string[],
        data: any[][],
        startY: number
      ) => {
        let yPos = startY;
        const pageWidth = doc.internal.pageSize.width;
        const colWidth = (pageWidth - 40) / headers.length;

        // Headers
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        headers.forEach((header, index) => {
          doc.text(header, 20 + index * colWidth, yPos);
        });
        yPos += 10;

        // Data rows
        doc.setFont("helvetica", "normal");
        data.forEach((row) => {
          row.forEach((cell, index) => {
            doc.text(String(cell), 20 + index * colWidth, yPos);
          });
          yPos += 8;
        });

        return yPos + 10;
      };

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("ESTIMASI PENYELESAIAN UTANG", 20, 30);

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Nomor: ${estimation.estimationNumber}`, 20, 45);
      doc.text(
        `Tanggal: ${format(estimation.createdAt, "dd MMMM yyyy", {
          locale: id,
        })}`,
        20,
        55
      );

      // Client Information
      let yPos = 75;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMASI KLIEN", 20, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Nama: ${estimation.clientName}`, 20, yPos);
      yPos += 10;
      doc.text(`No. Telepon: ${estimation.phoneNumber}`, 20, yPos);
      yPos += 20;

      // Debt Details
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RINCIAN UTANG", 20, yPos);
      yPos += 15;

      const debtTableData = estimation.debtDetails.map((debt) => [
        debt.bankProvider,
        debt.debtType,
        formatCurrency(debt.totalDebt),
      ]);

      debtTableData.push(["TOTAL", "", formatCurrency(estimation.totalDebt)]);

      // Use autoTable if available, otherwise fallback to manual table
      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          head: [["Bank/Provider", "Jenis", "Jumlah Utang"]],
          body: debtTableData,
          startY: yPos,
          theme: "grid",
          headStyles: { fillColor: [66, 139, 202] },
          footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
          margin: { left: 20, right: 20 },
          styles: { fontSize: 10 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 20;
      } else {
        yPos = createTableManually(
          ["Bank/Provider", "Jenis", "Jumlah Utang"],
          debtTableData,
          yPos
        );
      }

      // Payment Scheme
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SKEMA PEMBAYARAN", 20, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Biaya Layanan (${estimation.serviceFeePct}%): ${formatCurrency(
          estimation.serviceFee
        )}`,
        20,
        yPos
      );
      yPos += 10;
      doc.text(
        `Tipe Pembayaran: ${
          estimation.paymentType === "lunas" ? "Lunas" : "Termin (Cicilan)"
        }`,
        20,
        yPos
      );
      yPos += 10;

      if (
        estimation.paymentType === "cicilan" &&
        estimation.paymentTerms.length > 0
      ) {
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("JADWAL CICILAN", 20, yPos);
        yPos += 10;

        const termTableData = estimation.paymentTerms.map((term, index) => [
          `Cicilan ke-${index + 1}`,
          term.dueDate
            ? format(term.dueDate, "dd MMM yyyy", { locale: id })
            : "Belum ditentukan",
          formatCurrency(term.amount),
        ]);

        if (typeof doc.autoTable === "function") {
          doc.autoTable({
            head: [["Cicilan", "Tanggal Jatuh Tempo", "Jumlah"]],
            body: termTableData,
            startY: yPos,
            theme: "grid",
            headStyles: { fillColor: [66, 139, 202] },
            margin: { left: 20, right: 20 },
            styles: { fontSize: 10 },
          });
          yPos = (doc as any).lastAutoTable.finalY + 10;
        } else {
          yPos = createTableManually(
            ["Cicilan", "Tanggal Jatuh Tempo", "Jumlah"],
            termTableData,
            yPos
          );
        }
      }

      // Summary
      yPos += 20;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RINGKASAN", 20, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Total Utang: ${formatCurrency(estimation.totalDebt)}`,
        20,
        yPos
      );
      yPos += 10;
      doc.text(
        `Biaya Layanan: ${formatCurrency(estimation.serviceFee)}`,
        20,
        yPos
      );
      yPos += 15;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `TOTAL YANG HARUS DIBAYAR: ${formatCurrency(
          estimation.totalPaymentAmount
        )}`,
        20,
        yPos
      );

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Dokumen ini dihasilkan secara otomatis oleh sistem estimasi penyelesaian utang.",
        20,
        pageHeight - 20
      );

      // Generate filename
      const clientNameSafe = estimation.clientName
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      const fileName = `Estimasi_${clientNameSafe}_${estimation.estimationNumber}.pdf`;

      // Save PDF
      doc.save(fileName);

      toast.dismiss(loadingToast);
      toast.success("PDF berhasil didownload!");
    } catch (error) {
      console.error("Error generating PDF:", error);

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      if (error instanceof Error) {
        toast.error(`Gagal menggenerate PDF: ${error.message}`);
      } else {
        toast.error("Gagal menggenerate PDF. Silakan coba lagi.");
      }
    }
  };

  if (loading) {
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
                    <BreadcrumbLink href="#">Estimations</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>History</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p>Loading estimations...</p>
                </div>
              </CardContent>
            </Card>
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
                  <BreadcrumbLink href="#">Estimations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>History</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Estimasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estimations.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Nilai Utang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    estimations.reduce((sum, est) => sum + est.totalDebt, 0)
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Nilai Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    estimations.reduce(
                      (sum, est) => sum + est.totalPaymentAmount,
                      0
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Estimasi</CardTitle>
              <div className="flex flex-col gap-4">
                {/* Search and basic controls */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari berdasarkan nama klien, nomor estimasi, atau telepon..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" onClick={fetchEstimations}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  {estimations.length === 0 && (
                    <Button variant="outline" onClick={createSampleData}>
                      Create Sample Data
                    </Button>
                  )}
                </div>

                {/* Advanced filters and bulk actions */}
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="status-filter">Filter Status:</Label>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="konversi">Konversi</SelectItem>
                        <SelectItem value="cancel">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label>Tanggal:</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-40"
                    />
                    <span>-</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedItems.length} dipilih
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Terpilih
                      </Button>
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Hapus Berdasarkan</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteByStatus("draft")}
                      >
                        Hapus Status Draft
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteByStatus("cancel")}
                      >
                        Hapus Status Cancel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteByDateRange}>
                        Hapus Berdasarkan Tanggal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>No. Estimasi</TableHead>
                      <TableHead>Nama Klien</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Total Utang</TableHead>
                      <TableHead>Total Pembayaran</TableHead>
                      <TableHead>Tipe Pembayaran</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEstimations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          {searchTerm
                            ? "Tidak ada estimasi yang sesuai dengan pencarian"
                            : "Belum ada data estimasi"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEstimations
                        .filter(
                          (est) =>
                            filterStatus === "all" ||
                            est.status === filterStatus
                        )
                        .map((estimation) => (
                          <TableRow key={estimation.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.includes(estimation.id)}
                                onCheckedChange={() =>
                                  handleSelectItem(estimation.id)
                                }
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {estimation.estimationNumber}
                            </TableCell>
                            <TableCell>{estimation.clientName}</TableCell>
                            <TableCell>{estimation.phoneNumber}</TableCell>
                            <TableCell>
                              {formatCurrency(estimation.totalDebt)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(estimation.totalPaymentAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {estimation.paymentType === "lunas"
                                  ? "Lunas"
                                  : "Cicilan"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div className="cursor-pointer">
                                    {getStatusBadge(estimation.status)}
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuLabel>
                                    Ubah Status
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(estimation.id, "draft")
                                    }
                                  >
                                    Draft
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        estimation.id,
                                        "pending"
                                      )
                                    }
                                  >
                                    Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        estimation.id,
                                        "konversi"
                                      )
                                    }
                                  >
                                    Konversi
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        estimation.id,
                                        "cancel"
                                      )
                                    }
                                  >
                                    Cancel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                            <TableCell>
                              {format(estimation.createdAt, "dd MMM yyyy", {
                                locale: id,
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetail(estimation)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleEditEstimation(estimation)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPDF(estimation)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Estimasi</DialogTitle>
              <DialogDescription>
                {selectedEstimation && (
                  <>
                    Nomor: {selectedEstimation.estimationNumber} | Tanggal:{" "}
                    {format(selectedEstimation.createdAt, "dd MMMM yyyy", {
                      locale: id,
                    })}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedEstimation && (
              <div className="space-y-6">
                {/* Client Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Informasi Klien
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nama Klien</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedEstimation.clientName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">No. Telepon</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedEstimation.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Debt Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detail Utang</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bank/Provider</TableHead>
                          <TableHead>Jenis Utang</TableHead>
                          <TableHead>Jumlah Utang</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEstimation.debtDetails.map((debt) => (
                          <TableRow key={debt.id}>
                            <TableCell>{debt.bankProvider}</TableCell>
                            <TableCell>{debt.debtType}</TableCell>
                            <TableCell>
                              {formatCurrency(debt.totalDebt)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-muted/50">
                          <TableCell colSpan={2}>TOTAL</TableCell>
                          <TableCell>
                            {formatCurrency(selectedEstimation.totalDebt)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Payment Terms */}
                {selectedEstimation.paymentType === "cicilan" &&
                  selectedEstimation.paymentTerms.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Jadwal Cicilan
                      </h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cicilan</TableHead>
                              <TableHead>Tanggal Jatuh Tempo</TableHead>
                              <TableHead>Jumlah</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedEstimation.paymentTerms.map(
                              (term, index) => (
                                <TableRow key={term.id}>
                                  <TableCell>Cicilan ke-{index + 1}</TableCell>
                                  <TableCell>
                                    {term.dueDate
                                      ? format(term.dueDate, "dd MMM yyyy", {
                                          locale: id,
                                        })
                                      : "Belum ditentukan"}
                                  </TableCell>
                                  <TableCell>
                                    {formatCurrency(term.amount)}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                {/* Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Ringkasan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Total Utang</label>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(selectedEstimation.totalDebt)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Biaya Layanan ({selectedEstimation.serviceFeePct}%)
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(selectedEstimation.serviceFee)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Tipe Pembayaran
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {selectedEstimation.paymentType === "lunas"
                          ? "Lunas"
                          : "Cicilan"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Total Pembayaran
                      </label>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(selectedEstimation.totalPaymentAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadPDF(selectedEstimation)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteType === "selected" &&
                  `Apakah Anda yakin ingin menghapus ${selectedItems.length} estimasi yang dipilih?`}
                {deleteType === "status" &&
                  `Apakah Anda yakin ingin menghapus semua estimasi dengan status "${filterStatus}"?`}
                {deleteType === "dateRange" &&
                  `Apakah Anda yakin ingin menghapus semua estimasi dari tanggal ${startDate} sampai ${endDate}?`}
                <br />
                <strong className="text-destructive">
                  Tindakan ini tidak dapat dibatalkan.
                </strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Estimation Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Estimasi</DialogTitle>
              <DialogDescription>
                Edit informasi dasar estimasi dan status
              </DialogDescription>
            </DialogHeader>

            {editingEstimation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName">Nama Klien</Label>
                    <Input
                      id="clientName"
                      value={editingEstimation.clientName}
                      onChange={(e) =>
                        setEditingEstimation({
                          ...editingEstimation,
                          clientName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">No. Telepon</Label>
                    <Input
                      id="phoneNumber"
                      value={editingEstimation.phoneNumber}
                      onChange={(e) =>
                        setEditingEstimation({
                          ...editingEstimation,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="konversi">Konversi</SelectItem>
                      <SelectItem value="cancel">Cancel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Utang</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(editingEstimation.totalDebt)}
                    </p>
                  </div>
                  <div>
                    <Label>Total Pembayaran</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(editingEstimation.totalPaymentAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                  >
                    Batal
                  </Button>
                  <Button onClick={saveEditedEstimation}>
                    Simpan Perubahan
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
