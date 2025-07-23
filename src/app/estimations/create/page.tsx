// Tambahan agar TypeScript mengenali autoTable dan lastAutoTable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
"use client";
import type jsPDFType from "jspdf";
declare module "jspdf" {
  interface jsPDF {
    autoTable: (...args: any[]) => void;
    lastAutoTable: { finalY: number };
  }
}

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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Eye,
  Save,
  Download,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

interface ProspectSource {
  id: string;
  name: string;
  isActive: boolean;
}

interface DebtDetail {
  id: string;
  debtType: "credit_card" | "kta" | "online_loan" | "";
  typeId: string;
  name: string;
  totalDebt: number;
  discount: number;
}

interface PaymentTerm {
  id: string;
  amount: number;
  dueDate?: Date;
}

interface EstimationForm {
  clientName: string;
  phoneNumber: string;
  marketing: string;
  referralSource: string;
  debtDetails: DebtDetail[];
  serviceFeePct: number;
  serviceFeeManual: number;
  paymentType: "lunas" | "termin";
  fullPaymentDate?: Date;
  downPayment: number;
  paymentTerms: PaymentTerm[];
}

interface DebtType {
  id: string;
  type: "credit_card" | "kta" | "online_loan";
  name: string;
  discount: number;
}

export default function CreateEstimationPage() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [estimationNumber, setEstimationNumber] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [debtTypes, setDebtTypes] = useState<DebtType[]>([]);
  const [debtTypesLoading, setDebtTypesLoading] = useState(true);
  const [prospectSources, setProspectSources] = useState<ProspectSource[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<EstimationForm>({
    clientName: "",
    phoneNumber: "",
    marketing: "",
    referralSource: "",
    debtDetails: [
      {
        id: "1",
        debtType: "",
        typeId: "",
        name: "",
        totalDebt: 0,
        discount: 0,
      },
    ],
    serviceFeePct: 20,
    serviceFeeManual: 0,
    paymentType: "lunas",
    fullPaymentDate: undefined,
    downPayment: 0,
    paymentTerms: [],
  });

  // Calculate current step based on form completion
  useEffect(() => {
    if (form.clientName && form.phoneNumber) {
      if (
        form.debtDetails.some(
          (debt) => debt.debtType && debt.typeId && debt.totalDebt > 0
        )
      ) {
        if (form.serviceFeePct > 0) {
          setCurrentStep(4); // Ringkasan
        } else {
          setCurrentStep(3); // Skema Pembayaran
        }
      } else {
        setCurrentStep(2); // Detail Utang
      }
    } else {
      setCurrentStep(1); // Informasi Klien
    }
  }, [form]);

  const getStepStatus = (step: number) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "current";
    return "upcoming";
  };

  const getStepStyles = (step: number) => {
    const status = getStepStatus(step);
    if (status === "completed")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "current")
      return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-500 border-gray-200";
  };

  useEffect(() => {
    fetchDebtTypes();
    fetchUsers();
    fetchProspectSources();
    generateEstimationNumber();
  }, []);

  // Page loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const fetchDebtTypes = async () => {
    try {
      setDebtTypesLoading(true);
      console.log("Fetching debt types from Firestore...");

      const [ccSnap, ktaSnap, olSnap] = await Promise.all([
        getDocs(collection(db, "credit_cards")),
        getDocs(collection(db, "kta")),
        getDocs(collection(db, "online_loans")),
      ]);

      console.log("Firestore snapshots received:", {
        creditCards: ccSnap.docs.length,
        kta: ktaSnap.docs.length,
        onlineLoans: olSnap.docs.length,
      });

      const cc = ccSnap.docs
        .filter((doc) => doc.data().isActive !== false)
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "credit_card" as const,
            name: data.bankName || data.name || `Bank ${doc.id}`,
            discount: data.discount || 0,
          };
        });

      const kta = ktaSnap.docs
        .filter((doc) => doc.data().isActive !== false)
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "kta" as const,
            name: data.bankName || data.name || `Bank ${doc.id}`,
            discount: data.discount || 0,
          };
        });

      const ol = olSnap.docs
        .filter((doc) => doc.data().isActive !== false)
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "online_loan" as const,
            name: data.providerName || data.name || `Provider ${doc.id}`,
            discount: data.discount || 0,
          };
        });

      setDebtTypes([...cc, ...kta, ...ol]);
      setDebtTypesLoading(false);
      console.log("Debt types loaded successfully:", [...cc, ...kta, ...ol]);
    } catch (error) {
      console.error("Error fetching debt types:", error);
      toast.error(
        "Gagal memuat data jenis utang. Pastikan koneksi internet dan konfigurasi Firebase sudah benar."
      );
      setDebtTypesLoading(false);
      // Set empty array so the dropdown shows "no data" message instead of loading
      setDebtTypes([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data user");
    }
  };

  const fetchProspectSources = async () => {
    try {
      const sourcesSnapshot = await getDocs(
        collection(db, "telemarketing_prospect_sources")
      );
      const sourcesData = sourcesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((source: any) => source.isActive !== false) as ProspectSource[];
      setProspectSources(sourcesData);
    } catch (error) {
      console.error("Error fetching prospect sources:", error);
      toast.error("Gagal memuat data sumber prospek");
    }
  };

  const generateEstimationNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const estimationNum = `EST-${year}${month}${day}-${hours}${minutes}${seconds}`;
    setEstimationNumber(estimationNum);
  };

  const addDebtDetail = () => {
    const newId = String(form.debtDetails.length + 1);
    setForm({
      ...form,
      debtDetails: [
        ...form.debtDetails,
        {
          id: newId,
          debtType: "",
          typeId: "",
          name: "",
          totalDebt: 0,
          discount: 0,
        },
      ],
    });
  };

  const removeDebtDetail = (id: string) => {
    if (form.debtDetails.length > 1) {
      setForm({
        ...form,
        debtDetails: form.debtDetails.filter((debt) => debt.id !== id),
      });
    }
  };

  const updateDebtDetail = (
    id: string,
    field: keyof DebtDetail,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      debtDetails: prev.debtDetails.map((debt) => {
        if (debt.id !== id) return debt;
        // Reset field dependent jika debtType berubah
        if (field === "debtType") {
          return {
            ...debt,
            debtType: value,
            typeId: "",
            name: "",
            discount: 0,
          };
        }
        // Update name & discount otomatis jika typeId berubah
        if (field === "typeId") {
          const found = debtTypes.find(
            (d) => d.id === value && d.type === debt.debtType
          );
          return {
            ...debt,
            typeId: value,
            name: found?.name || "",
            discount: found?.discount || 0,
          };
        }
        return { ...debt, [field]: value };
      }),
    }));
  };

  const addPaymentTerm = () => {
    if (form.paymentTerms.length < 6) {
      const newId = String(form.paymentTerms.length + 1);
      setForm({
        ...form,
        paymentTerms: [
          ...form.paymentTerms,
          { id: newId, amount: 0, dueDate: undefined },
        ],
      });
    }
  };

  const removePaymentTerm = (id: string) => {
    setForm({
      ...form,
      paymentTerms: form.paymentTerms.filter((term) => term.id !== id),
    });
  };

  const updatePaymentTerm = (
    id: string,
    field: keyof PaymentTerm,
    value: any
  ) => {
    setForm({
      ...form,
      paymentTerms: form.paymentTerms.map((term) =>
        term.id === id ? { ...term, [field]: value } : term
      ),
    });
  };

  const getTotalDebt = () => {
    return form.debtDetails.reduce((total, debt) => total + debt.totalDebt, 0);
  };

  const getServiceFee = () => {
    const totalDebt = getTotalDebt();
    return (totalDebt * form.serviceFeePct) / 100;
  };

  const getTotalPaymentAmount = () => {
    return getServiceFee();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/[^\d]/g, "")) || 0;
  };

  // Auto-calculate payment terms when payment type changes
  useEffect(() => {
    if (form.paymentType === "termin" && form.paymentTerms.length === 0) {
      const newId = String(1);
      setForm((prev) => ({
        ...prev,
        paymentTerms: [{ id: newId, amount: 0, dueDate: undefined }],
      }));
    }
  }, [form.paymentType, form.paymentTerms.length]);

  // Auto-calculate payment term amounts
  useEffect(() => {
    if (form.paymentType === "termin" && form.paymentTerms.length > 0) {
      const totalAmount = getTotalPaymentAmount();
      const remainingAfterDP = totalAmount - form.downPayment;
      const perTermAmount =
        form.paymentTerms.length > 0
          ? remainingAfterDP / form.paymentTerms.length
          : 0;

      // Only update if the amounts are different to prevent infinite loop
      const needsUpdate = form.paymentTerms.some(
        (term) => Math.abs(term.amount - perTermAmount) > 0.01
      );

      if (needsUpdate) {
        setForm((prev) => ({
          ...prev,
          paymentTerms: prev.paymentTerms.map((term) => ({
            ...term,
            amount: perTermAmount,
          })),
        }));
      }
    }
  }, [form.paymentType, form.downPayment, form.serviceFeePct, getTotalDebt()]);

  const handleSaveEstimation = async () => {
    try {
      const estimationData = {
        estimationNumber,
        clientName: form.clientName,
        phoneNumber: form.phoneNumber,
        marketing: form.marketing || null,
        referralSource: form.referralSource,
        debtDetails: form.debtDetails,
        serviceFeePct: form.serviceFeePct,
        serviceFeeManual: form.serviceFeeManual,
        paymentType: form.paymentType,
        fullPaymentDate: form.fullPaymentDate
          ? Timestamp.fromDate(form.fullPaymentDate)
          : null,
        downPayment: form.downPayment,
        paymentTerms: form.paymentTerms.map((term) => ({
          ...term,
          dueDate: term.dueDate ? Timestamp.fromDate(term.dueDate) : null,
        })),
        totalDebt: getTotalDebt(),
        serviceFee: getServiceFee(),
        totalPaymentAmount: getTotalPaymentAmount(),
        status: "draft", // Default status
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, "estimations"), estimationData);
      toast.success("Estimasi berhasil disimpan!");

      // Reset form after save
      generateEstimationNumber();
      setForm({
        clientName: "",
        phoneNumber: "",
        marketing: "",
        referralSource: "",
        debtDetails: [
          {
            id: "1",
            debtType: "",
            typeId: "",
            name: "",
            totalDebt: 0,
            discount: 0,
          },
        ],
        serviceFeePct: 20,
        serviceFeeManual: 0,
        paymentType: "lunas",
        fullPaymentDate: undefined,
        downPayment: 0,
        paymentTerms: [],
      });
      setShowPreview(false);
    } catch (error) {
      console.error("Error saving estimation:", error);
      toast.error("Gagal menyimpan estimasi");
    }
  };

  const handleDownloadPDF = async () => {
    let loadingToast: any;

    try {
      // Validasi data sebelum generate PDF
      if (!form.clientName || !form.phoneNumber) {
        toast.error(
          "Nama klien dan nomor telepon wajib diisi untuk download PDF"
        );
        return;
      }

      if (
        !form.debtDetails.some(
          (debt) => debt.debtType && debt.typeId && debt.totalDebt > 0
        )
      ) {
        toast.error(
          "Minimal harus ada 1 detail utang yang lengkap untuk download PDF"
        );
        return;
      }

      // Show loading toast
      loadingToast = toast.loading("Generating PDF...");

      // Import PDF libraries
      const { default: jsPDF } = await import("jspdf");

      console.log("jsPDF imported successfully");

      // Import autotable - side effect should extend jsPDF
      const autoTableModule = await import("jspdf-autotable");

      console.log("jspdf-autotable module imported:", !!autoTableModule);
      console.log("autoTableModule keys:", Object.keys(autoTableModule));

      // Create document
      const doc = new jsPDF();

      console.log("=== PDF Debug Info ===");
      console.log("jsPDF version:", (jsPDF as any).version || "unknown");
      console.log("doc instanceof jsPDF:", doc instanceof jsPDF);
      console.log("doc.autoTable available:", typeof doc.autoTable);
      console.log(
        "jsPDF.API.autoTable available:",
        typeof (jsPDF as any).API?.autoTable
      );
      console.log(
        "Document methods:",
        Object.getOwnPropertyNames(doc)
          .filter((name) => typeof (doc as any)[name] === "function")
          .slice(0, 10)
      );
      console.log(
        "Document prototype methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(doc))
          .filter(
            (name) =>
              typeof (Object.getPrototypeOf(doc) as any)[name] === "function"
          )
          .slice(0, 10)
      );
      console.log("=======================");

      // If autoTable is not available, create basic table manually
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
      doc.text(`Nomor: ${estimationNumber}`, 20, 45);
      doc.text(
        `Tanggal: ${format(new Date(), "dd MMMM yyyy", { locale: id })}`,
        20,
        55
      );

      // Client Information
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMASI KLIEN", 20, 75);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      let yPos = 85;
      doc.text(`Nama: ${form.clientName}`, 20, yPos);
      yPos += 10;
      doc.text(`No. Telepon: ${form.phoneNumber}`, 20, yPos);
      yPos += 10;

      const marketingName =
        users.find((u) => u.id === form.marketing)?.displayName ||
        users.find((u) => u.id === form.marketing)?.email ||
        "-";
      doc.text(`Marketing: ${marketingName}`, 20, yPos);
      yPos += 10;
      doc.text(`Sumber Prospek: ${form.referralSource || "-"}`, 20, yPos);
      yPos += 20;

      // Debt Details Table
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DETAIL UTANG", 20, yPos);
      yPos += 10;

      const debtTableData = form.debtDetails
        .filter((debt) => debt.debtType && debt.typeId && debt.totalDebt > 0)
        .map((debt) => [
          debt.name || "Tidak diketahui",
          debt.debtType === "credit_card"
            ? "Kartu Kredit"
            : debt.debtType === "kta"
            ? "KTA"
            : debt.debtType === "online_loan"
            ? "Pinjaman Online"
            : "Lainnya",
          formatCurrency(debt.totalDebt),
        ]);

      // Add total row
      debtTableData.push(["TOTAL", "", formatCurrency(getTotalDebt())]);

      // Use autoTable if available, otherwise fallback to manual table
      if (typeof doc.autoTable === "function") {
        console.log("Using autoTable for debt details");
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
        console.log("Using manual table creation for debt details");
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
        `Biaya Layanan (${form.serviceFeePct}%): ${formatCurrency(
          getServiceFee()
        )}`,
        20,
        yPos
      );
      yPos += 10;
      doc.text(
        `Tipe Pembayaran: ${
          form.paymentType === "lunas" ? "Lunas" : "Termin (Cicilan)"
        }`,
        20,
        yPos
      );
      yPos += 10;

      if (form.paymentType === "lunas") {
        doc.text(
          `Tanggal Pelunasan: ${
            form.fullPaymentDate
              ? format(form.fullPaymentDate, "dd MMMM yyyy", { locale: id })
              : "Belum ditentukan"
          }`,
          20,
          yPos
        );
        yPos += 10;
      } else {
        doc.text(`Down Payment: ${formatCurrency(form.downPayment)}`, 20, yPos);
        yPos += 15;

        // Payment Terms Table
        if (form.paymentTerms.length > 0) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("JADWAL CICILAN", 20, yPos);
          yPos += 10;

          const termTableData = form.paymentTerms.map((term, index) => [
            `Cicilan ke-${index + 1}`,
            term.dueDate
              ? format(term.dueDate, "dd MMM yyyy", { locale: id })
              : "Belum ditentukan",
            formatCurrency(term.amount),
          ]);

          // Use autoTable if available, otherwise fallback to manual table
          if (typeof doc.autoTable === "function") {
            console.log("Using autoTable for payment terms");
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
            console.log("Using manual table creation for payment terms");
            yPos = createTableManually(
              ["Cicilan", "Tanggal Jatuh Tempo", "Jumlah"],
              termTableData,
              yPos
            );
          }
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
      doc.text(`Total Utang: ${formatCurrency(getTotalDebt())}`, 20, yPos);
      yPos += 10;
      doc.text(`Biaya Layanan: ${formatCurrency(getServiceFee())}`, 20, yPos);
      yPos += 15;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `TOTAL YANG HARUS DIBAYAR: ${formatCurrency(getTotalPaymentAmount())}`,
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

      // Generate filename with fallback
      const clientNameSafe = (form.clientName || "Client")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      const fileName = `Estimasi_${clientNameSafe}_${estimationNumber}.pdf`;

      // Save PDF
      doc.save(fileName);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("PDF berhasil didownload!");
    } catch (error) {
      console.error("Error generating PDF:", error);

      // Dismiss loading toast first if it exists
      if (loadingToast) {
        try {
          toast.dismiss(loadingToast);
        } catch (dismissError) {
          console.warn("Failed to dismiss toast:", dismissError);
        }
      }

      // Show specific error message
      if (error instanceof Error) {
        if (error.message.includes("autoTable")) {
          toast.error(
            "Error: Plugin PDF tidak tersedia. Silakan refresh halaman dan coba lagi."
          );
        } else {
          toast.error(`Gagal menggenerate PDF: ${error.message}`);
        }
      } else {
        toast.error("Gagal menggenerate PDF. Silakan coba lagi.");
      }
    }
  };

  if (isPageLoading || debtTypesLoading) {
    return <FormPageSkeleton />;
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
                  <BreadcrumbLink href="/estimations">Estimasi</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Buat Estimasi</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {!showPreview ? (
            <div className="max-w-7xl mx-auto w-full">
              <Card className="w-full">
                <CardHeader>
                  <TooltipProvider>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold border ${getStepStyles(
                            1
                          )}`}
                        >
                          {getStepStatus(1) === "completed" ? "✓" : "1"}{" "}
                          Informasi Klien
                        </div>
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold border ${getStepStyles(
                            2
                          )}`}
                        >
                          {getStepStatus(2) === "completed" ? "✓" : "2"} Detail
                          Utang
                        </div>
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold border ${getStepStyles(
                            3
                          )}`}
                        >
                          {getStepStatus(3) === "completed" ? "✓" : "3"} Biaya &
                          Pembayaran
                        </div>
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold border ${getStepStyles(
                            4
                          )}`}
                        >
                          {getStepStatus(4) === "completed" ? "✓" : "4"}{" "}
                          Ringkasan
                        </div>
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Buat Estimasi Penyelesaian Utang
                          <span className="text-sm font-normal text-muted-foreground">
                            - Nomor: {estimationNumber}
                          </span>
                        </CardTitle>
                        <CardDescription>
                          Isi data klien, detail utang, biaya layanan, dan skema
                          pembayaran untuk membuat estimasi penyelesaian utang.
                        </CardDescription>
                      </div>
                    </div>
                  </TooltipProvider>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Client Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Informasi Klien</h3>
                      <span className="text-xs text-red-500 font-medium">
                        (Wajib diisi)
                      </span>
                      {form.clientName && form.phoneNumber && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          ✓ Lengkap
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Masukkan data klien yang akan dibuatkan estimasi.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="clientName"
                          className="flex items-center gap-1"
                        >
                          Nama Klien *
                          {!form.clientName && (
                            <span className="text-red-500">⚠</span>
                          )}
                        </Label>
                        <Input
                          id="clientName"
                          value={form.clientName}
                          onChange={(e) =>
                            setForm({ ...form, clientName: e.target.value })
                          }
                          placeholder="Contoh: Budi Santoso"
                          className={
                            !form.clientName
                              ? "border-red-200 focus:border-red-400"
                              : "border-green-200"
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          Nama lengkap klien sesuai KTP.
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="phoneNumber"
                          className="flex items-center gap-1"
                        >
                          No. Telepon *
                          {!form.phoneNumber && (
                            <span className="text-red-500">⚠</span>
                          )}
                        </Label>
                        <Input
                          id="phoneNumber"
                          value={form.phoneNumber}
                          onChange={(e) =>
                            setForm({ ...form, phoneNumber: e.target.value })
                          }
                          placeholder="Contoh: 081234567890"
                          className={
                            !form.phoneNumber
                              ? "border-red-200 focus:border-red-400"
                              : "border-green-200"
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          Nomor WhatsApp aktif klien.
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marketing">Marketing</Label>
                        <Select
                          value={form.marketing}
                          onValueChange={(value) =>
                            setForm({ ...form, marketing: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih marketing" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.displayName || user.email} (
                                {user.role || "No Role"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">
                          Pilih marketing yang menangani klien ini (opsional).
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referralSource">Sumber Prospek</Label>
                        <Select
                          value={form.referralSource}
                          onValueChange={(value) =>
                            setForm({ ...form, referralSource: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih sumber prospek" />
                          </SelectTrigger>
                          <SelectContent>
                            {prospectSources.map((source) => (
                              <SelectItem key={source.id} value={source.name}>
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground">
                          Dari mana klien mengetahui layanan Anda? (opsional)
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Debt Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            Detail Utang
                          </h3>
                          <span className="text-xs text-red-500 font-medium">
                            (Minimal 1 utang)
                          </span>
                          {form.debtDetails.some(
                            (debt) =>
                              debt.debtType && debt.typeId && debt.totalDebt > 0
                          ) && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              ✓{" "}
                              {
                                form.debtDetails.filter(
                                  (debt) =>
                                    debt.debtType &&
                                    debt.typeId &&
                                    debt.totalDebt > 0
                                ).length
                              }{" "}
                              utang
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Masukkan semua utang yang ingin diselesaikan. Pilih
                          jenis utang, lalu pilih bank/provider.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDebtDetail}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Utang
                      </Button>
                    </div>
                    <div className="space-y-6">
                      {form.debtDetails.map((debt, index) => {
                        const selectedType = debtTypes.find(
                          (d) =>
                            d.id === debt.typeId && d.type === debt.debtType
                        );

                        // Get available options based on selected debt type
                        const availableOptions = debt.debtType
                          ? debtTypes.filter((d) => d.type === debt.debtType)
                          : [];

                        const discount = selectedType?.discount || 0;
                        const keuntungan = debt.totalDebt * (discount / 100);

                        return (
                          <Card key={debt.id}>
                            <CardContent className="pt-6">
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <div className="space-y-2">
                                  <Label>Jenis Utang *</Label>
                                  <span className="text-xs text-muted-foreground">
                                    Pilih tipe utang (Kartu Kredit, KTA, atau
                                    Pinjaman Online).
                                  </span>
                                  <Select
                                    value={
                                      debt.debtType === ""
                                        ? undefined
                                        : debt.debtType
                                    }
                                    onValueChange={(val) => {
                                      if (val) {
                                        updateDebtDetail(
                                          debt.id,
                                          "debtType",
                                          val as
                                            | "credit_card"
                                            | "kta"
                                            | "online_loan"
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih jenis utang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="credit_card">
                                        Kartu Kredit
                                      </SelectItem>
                                      <SelectItem value="kta">
                                        KTA (Kredit Tanpa Agunan)
                                      </SelectItem>
                                      <SelectItem value="online_loan">
                                        Pinjaman Online
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Bank/Provider *</Label>
                                  <span className="text-xs text-muted-foreground">
                                    Pilih bank atau provider sesuai jenis utang.
                                  </span>
                                  <Select
                                    value={
                                      debt.typeId === ""
                                        ? undefined
                                        : debt.typeId
                                    }
                                    onValueChange={(val) => {
                                      if (val) {
                                        updateDebtDetail(
                                          debt.id,
                                          "typeId",
                                          val
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih bank/provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {debtTypesLoading ? (
                                        <SelectItem value="loading" disabled>
                                          Memuat data...
                                        </SelectItem>
                                      ) : availableOptions.length > 0 ? (
                                        availableOptions.map((dt) => (
                                          <SelectItem key={dt.id} value={dt.id}>
                                            {dt.name} - {dt.discount}%
                                          </SelectItem>
                                        ))
                                      ) : debt.debtType ? (
                                        <SelectItem value="no-data" disabled>
                                          Tidak ada data untuk{" "}
                                          {debt.debtType === "credit_card"
                                            ? "kartu kredit"
                                            : debt.debtType === "kta"
                                            ? "KTA"
                                            : "pinjaman online"}
                                        </SelectItem>
                                      ) : (
                                        <SelectItem
                                          value="no-selection"
                                          disabled
                                        >
                                          Pilih jenis utang terlebih dahulu
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Total Utang (Rp) *</Label>
                                  <span className="text-xs text-muted-foreground">
                                    Masukkan jumlah utang pokok (tanpa
                                    bunga/denda).
                                  </span>
                                  <Input
                                    value={
                                      debt.totalDebt > 0
                                        ? formatCurrency(debt.totalDebt)
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const value = parseCurrency(
                                        e.target.value
                                      );
                                      updateDebtDetail(
                                        debt.id,
                                        "totalDebt",
                                        value
                                      );
                                    }}
                                    placeholder="Rp 0"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="flex items-center gap-1">
                                    Diskon (%)
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">
                                          Diskon rata-rata yang bisa didapatkan
                                          dari bank/provider berdasarkan data
                                          historis
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </Label>
                                  <Input
                                    value={`${discount}%`}
                                    disabled
                                    className="bg-gray-50"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="flex items-center gap-1">
                                    Potensi Keuntungan (Rp)
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">
                                          Estimasi penghematan yang bisa didapat
                                          klien dari diskon yang dinegosiasikan
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </Label>
                                  <Input
                                    value={formatCurrency(keuntungan)}
                                    disabled
                                    className="bg-gray-50"
                                  />
                                </div>
                              </div>

                              {form.debtDetails.length > 1 && (
                                <div className="flex justify-end mt-4">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeDebtDetail(debt.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Service Fee */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Biaya Layanan</h3>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Otomatis dihitung
                      </span>
                      {getTotalDebt() > 0 && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          ✓ {formatCurrency(getServiceFee())}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Biaya layanan dihitung dari total utang. Anda bisa
                      mengubah persentase sesuai kebijakan.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="serviceFeePct"
                          className="flex items-center gap-1"
                        >
                          Persentase Biaya Layanan (%)
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Persentase fee yang dikenakan dari total utang
                                klien
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Input
                          id="serviceFeePct"
                          type="number"
                          min="0"
                          max="100"
                          value={form.serviceFeePct}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              serviceFeePct: Math.max(
                                0,
                                Math.min(100, Number(e.target.value))
                              ),
                            })
                          }
                          placeholder="20"
                        />
                        <span className="text-xs text-muted-foreground">
                          Persentase biaya layanan (default 20%).
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label>Biaya Layanan Dihitung (Rp)</Label>
                        <Input
                          value={formatCurrency(getServiceFee())}
                          disabled
                          className="bg-gray-50 font-medium"
                        />
                        <span className="text-xs text-muted-foreground">
                          Total biaya layanan yang harus dibayar klien.
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Payment Scheme */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      Skema Pembayaran
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Pilih tipe pembayaran dan atur jadwal cicilan jika
                      diperlukan.
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tipe Pembayaran</Label>
                        <Select
                          value={form.paymentType}
                          onValueChange={(value: "lunas" | "termin") =>
                            setForm({ ...form, paymentType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lunas">Lunas</SelectItem>
                            <SelectItem value="termin">
                              Termin (Cicilan)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {form.paymentType === "lunas" && (
                        <div className="space-y-2">
                          <Label>Tanggal Pelunasan</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !form.fullPaymentDate &&
                                    "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.fullPaymentDate ? (
                                  format(form.fullPaymentDate, "PPP", {
                                    locale: id,
                                  })
                                ) : (
                                  <span>Pilih tanggal</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={form.fullPaymentDate}
                                onSelect={(date) =>
                                  setForm({ ...form, fullPaymentDate: date })
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {form.paymentType === "termin" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="downPayment">
                              Down Payment (Rp)
                            </Label>
                            <Input
                              id="downPayment"
                              value={
                                form.downPayment > 0
                                  ? formatCurrency(form.downPayment)
                                  : ""
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  downPayment: parseCurrency(e.target.value),
                                })
                              }
                              placeholder="Rp 0"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Jadwal Cicilan</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addPaymentTerm}
                                disabled={form.paymentTerms.length >= 6}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Cicilan
                              </Button>
                            </div>

                            {form.paymentTerms.map((term, index) => (
                              <Card key={term.id}>
                                <CardContent className="pt-6">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                      <Label>Jumlah Cicilan (Rp)</Label>
                                      <Input
                                        value={
                                          term.amount > 0
                                            ? formatCurrency(term.amount)
                                            : ""
                                        }
                                        onChange={(e) =>
                                          updatePaymentTerm(
                                            term.id,
                                            "amount",
                                            parseCurrency(e.target.value)
                                          )
                                        }
                                        placeholder="Rp 0"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Tanggal Jatuh Tempo</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !term.dueDate &&
                                                "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {term.dueDate ? (
                                              format(term.dueDate, "PPP", {
                                                locale: id,
                                              })
                                            ) : (
                                              <span>Pilih tanggal</span>
                                            )}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                          <Calendar
                                            mode="single"
                                            selected={term.dueDate}
                                            onSelect={(date) =>
                                              updatePaymentTerm(
                                                term.id,
                                                "dueDate",
                                                date
                                              )
                                            }
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-4">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => removePaymentTerm(term.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Hapus
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      Ringkasan
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Cek kembali seluruh data sebelum menyimpan estimasi.
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {formatCurrency(getTotalDebt())}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total Utang
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {formatCurrency(getServiceFee())}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Biaya Layanan
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {formatCurrency(getTotalPaymentAmount())}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total Bayar
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t pt-6">
                    <div className="flex gap-4 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        disabled={
                          !form.clientName ||
                          !form.phoneNumber ||
                          !form.debtDetails.some(
                            (debt) =>
                              debt.debtType && debt.typeId && debt.totalDebt > 0
                          )
                        }
                        className="min-w-[120px]"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Pratinjau
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSaveEstimation}
                        disabled={
                          !form.clientName ||
                          !form.phoneNumber ||
                          !form.debtDetails.some(
                            (debt) =>
                              debt.debtType && debt.typeId && debt.totalDebt > 0
                          )
                        }
                        className="min-w-[140px]"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Estimasi
                      </Button>
                    </div>
                    {(!form.clientName ||
                      !form.phoneNumber ||
                      !form.debtDetails.some(
                        (debt) =>
                          debt.debtType && debt.typeId && debt.totalDebt > 0
                      )) && (
                      <p className="text-xs text-red-500 text-right mt-2">
                        Lengkapi data klien dan minimal 1 detail utang untuk
                        melanjutkan
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Preview Section */
            <div className="max-w-7xl mx-auto w-full">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Pratinjau Estimasi</CardTitle>
                  <CardDescription>
                    Nomor Estimasi: {estimationNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Informasi Klien
                    </h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <strong>Nama:</strong> {form.clientName}
                      </div>
                      <div>
                        <strong>No. Telepon:</strong> {form.phoneNumber}
                      </div>
                      <div>
                        <strong>Marketing:</strong>{" "}
                        {users.find((u) => u.id === form.marketing)
                          ?.displayName || "-"}
                      </div>
                      <div>
                        <strong>Sumber Prospek:</strong>{" "}
                        {form.referralSource || "-"}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Debt Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Detail Utang</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bank/Provider</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead className="text-right">
                            Jumlah Utang
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.debtDetails.map((debt) => (
                          <TableRow key={debt.id}>
                            <TableCell className="font-medium">
                              {debt.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {debt.debtType === "credit_card"
                                  ? "Kartu Kredit"
                                  : debt.debtType === "kta"
                                  ? "KTA"
                                  : "Pinjaman Online"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(debt.totalDebt)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={2} className="font-bold">
                            TOTAL
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(getTotalDebt())}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <Separator />

                  {/* Payment Scheme */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Skema Pembayaran
                    </h3>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <strong>Biaya Layanan:</strong>{" "}
                          {formatCurrency(getServiceFee())}
                        </div>
                        <div>
                          <strong>Tipe Pembayaran:</strong>{" "}
                          {form.paymentType === "lunas"
                            ? "Lunas"
                            : "Termin (Cicilan)"}
                        </div>
                      </div>

                      {form.paymentType === "lunas" ? (
                        <div>
                          <strong>Tanggal Pelunasan:</strong>{" "}
                          {form.fullPaymentDate
                            ? format(form.fullPaymentDate, "PPP", {
                                locale: id,
                              })
                            : "-"}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <strong>Down Payment:</strong>{" "}
                            {formatCurrency(form.downPayment)}
                          </div>
                          {form.paymentTerms.length > 0 && (
                            <div>
                              <strong>Jadwal Cicilan:</strong>
                              <Table className="mt-2">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Cicilan</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">
                                      Jumlah
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {form.paymentTerms.map((term, index) => (
                                    <TableRow key={term.id}>
                                      <TableCell>
                                        Cicilan ke-{index + 1}
                                      </TableCell>
                                      <TableCell>
                                        {term.dueDate
                                          ? format(term.dueDate, "PPP", {
                                              locale: id,
                                            })
                                          : "-"}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {formatCurrency(term.amount)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Ringkasan</h3>
                    <div className="space-y-2 text-lg">
                      <div className="flex justify-between">
                        <span>Total Utang:</span>
                        <span>{formatCurrency(getTotalDebt())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Biaya Layanan:</span>
                        <span>{formatCurrency(getServiceFee())}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-xl">
                        <span>TOTAL YANG HARUS DIBAYAR:</span>
                        <span>{formatCurrency(getTotalPaymentAmount())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(false)}
                    >
                      Kembali ke Form
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadPDF}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button type="button" onClick={handleSaveEstimation}>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Estimasi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
