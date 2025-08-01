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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  User,
  MapPin,
  CreditCard,
  Briefcase,
  FileText,
  Download,
  Plus,
  Trash2,
  X,
  Edit,
  Eye,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Copy,
} from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePageLoading } from "@/hooks/use-page-loading";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";
import { useTheme } from "@/contexts/theme-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useIsClient } from "@/hooks/use-is-client";
import RichEditor from "@/components/rich-editor";
import ClientOnly from "@/components/client-only";

interface Client {
  id: string;
  personalData: {
    namaLengkap: string;
    nik: string;
    jenisKelamin?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    statusPerkawinan?: string;
    namaIbuKandung?: string;
  };
  contactData?: {
    noTelepon?: string;
    email?: string;
    provinsi?: string;
    kotaKabupaten?: string;
    kecamatan?: string;
    kelurahanDesa?: string;
    rtRw?: string;
    alamat?: string;
    domisiliSesuaiKtp?: boolean;
    alamatDomisili?: string;
  };
  jobData?: {
    jenisPekerjaan?: string;
    namaPerusahaan?: string;
    jabatan?: string;
    alamatKantor?: string;
    noTelpKantor?: string;
    namaKontakDarurat?: string;
    hubunganKontakDarurat?: string;
  };
  debtData: {
    debts: Array<{
      id: string;
      jenisHutang: string;
      bankProvider: string;
      nomorKartuKontrak: string;
      outstanding: string;
    }>;
  };
}

interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

const STEPS = [
  { id: 1, title: "Pilih Klien" },
  { id: 2, title: "Pilih Hutang" },
  { id: 3, title: "Pengaturan Dokumen" },
  { id: 4, title: "Template & Variabel" },
];

export default function SuratKuasaKhususPage() {
  const isClient = useIsClient();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDebtId, setSelectedDebtId] = useState<string>("");
  const [documentDate, setDocumentDate] = useState({
    hari: "",
    tanggal: "",
    bulan: "",
    tahun: "",
    tanggalHuruf: "",
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [editorContent, setEditorContent] = useState<string>("");
  const [customLetter, setCustomLetter] = useState<string>("CC-KTA");
  const [documentNumber, setDocumentNumber] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  // State for step 6 actions
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Template CRUD functionality
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);
  const [selectedTemplateForView, setSelectedTemplateForView] =
    useState<Template | null>(null);
  const [isTemplateViewDialogOpen, setIsTemplateViewDialogOpen] =
    useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState<string>("");
  const [templateViewMode, setTemplateViewMode] = useState<"grid" | "list">(
    "grid"
  );

  // Client search functionality
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");
  const [showClientDropdown, setShowClientDropdown] = useState<boolean>(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClientIndex, setSelectedClientIndex] = useState<number>(-1);

  // Document History Management
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historySearchTerm, setHistorySearchTerm] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"date" | "client" | "document">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDocumentForView, setSelectedDocumentForView] =
    useState<any>(null);
  const [isDocumentViewDialogOpen, setIsDocumentViewDialogOpen] =
    useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);

  // Additional states for history management
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [totalPages, setTotalPages] = useState(1);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Document Preview functionality
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Utility function to convert month to Roman numerals
  const toRomanNumeral = (month: number): string => {
    const romanNumerals = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    return romanNumerals[month - 1] || "I";
  };

  // Utility function to convert day to Indonesian
  const getDayInIndonesian = (date: Date): string => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    return days[date.getDay()];
  };

  // Utility function to convert month to Indonesian
  const getMonthInIndonesian = (month: number): string => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return months[month - 1] || "Januari";
  };

  // Utility function to convert number to Indonesian words
  const numberToWords = (num: number): string => {
    const ones = [
      "",
      "satu",
      "dua",
      "tiga",
      "empat",
      "lima",
      "enam",
      "tujuh",
      "delapan",
      "sembilan",
      "sepuluh",
      "sebelas",
      "dua belas",
      "tiga belas",
      "empat belas",
      "lima belas",
      "enam belas",
      "tujuh belas",
      "delapan belas",
      "sembilan belas",
    ];

    const tens = [
      "",
      "",
      "dua puluh",
      "tiga puluh",
      "empat puluh",
      "lima puluh",
      "enam puluh",
      "tujuh puluh",
      "delapan puluh",
      "sembilan puluh",
    ];

    const thousands = ["", "ribu", "juta", "miliar"];

    if (num === 0) return "nol";
    if (num < 20) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one ? " " + ones[one] : "");
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      const hundredWord = hundred === 1 ? "seratus" : ones[hundred] + " ratus";
      return hundredWord + (remainder ? " " + numberToWords(remainder) : "");
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      const thousandWord =
        thousand === 1 ? "seribu" : numberToWords(thousand) + " ribu";
      return thousandWord + (remainder ? " " + numberToWords(remainder) : "");
    }

    // For larger numbers, use a simplified approach
    return num.toString();
  };

  // Generate document number
  const generateDocumentNumber = async (): Promise<string> => {
    try {
      // Get current date
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const romanMonth = toRomanNumeral(month);

      // Get next sequence number from Firestore
      const snapshot = await getDocs(collection(db, "generated_documents"));
      const currentYearDocs = snapshot.docs.filter((doc) => {
        const data = doc.data();
        const docDate = data.createdAt?.toDate() || new Date();
        return (
          docDate.getFullYear() === year && data.type === "surat_kuasa_khusus"
        );
      });

      const nextSequence = currentYearDocs.length + 1;
      const paddedSequence = nextSequence.toString().padStart(3, "0");

      // Format: no_surat/DOCS/huruf_kustom/SKK/bulan_romawi/tahun
      return `${paddedSequence}/DOCS/${customLetter}/SKK/${romanMonth}/${year}`;
    } catch (error) {
      console.error("Error generating document number:", error);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const romanMonth = toRomanNumeral(month);
      return `001/DOCS/${customLetter}/SKK/${romanMonth}/${year}`;
    }
  };

  // Auto-generate document number when component mounts or custom letter changes
  useEffect(() => {
    const updateDocumentNumber = async () => {
      const newNumber = await generateDocumentNumber();
      setDocumentNumber(newNumber);
    };
    updateDocumentNumber();
  }, [customLetter]);

  // Fetch clients from Firestore
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const snapshot = await getDocs(collection(db, "clients"));
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Client)
        );
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Gagal memuat data klien");
      } finally {
        setClientsLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Fetch templates from Firestore
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const snapshot = await getDocs(collection(db, "surat_kuasa_templates"));
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Template)
        );
        setTemplates(data);

        // Add default template if none exists
        if (data.length === 0) {
          const defaultTemplate = {
            name: "Template Default",
            description:
              "Template default untuk surat kuasa khusus dengan data lengkap",
            content: `<div style="text-align: center; margin-bottom: 30px;">
            <h3><strong><u>SURAT KUASA KHUSUS</u></strong></h3>
            <p><strong>NO. {{nomor_surat}}</strong></p>
            </div>
            
            <p>Yang bertanda tangan dibawah ini:</p>
            <p><strong>{{nama_klien}}</strong>, NIK: <strong>{{nik_klien}}</strong>, Pekerjaan: <strong>{{pekerjaan}}</strong>, Alamat: {{alamat}}, {{rt_rw}}, {{kelurahan}}, {{kecamatan}}, {{kota_kabupaten}}, {{provinsi}}. Selanjutnya disebut sebagai <strong>PEMBERI KUASA</strong>.</p>
            
            <p>Memilih domisili Hukum di kantor kuasanya yang akan disebut dibawah ini, baik sendiri-sendiri maupun bersama-sama, dengan ini memberikan kuasa penuh kepada:</p>
            
            <ol>
              <li><p><strong>ALI ASGAR TUHULELE, S.H. ( Advokat )</strong></p></li>
              <li><p><strong>DJAYANTI (Senior Partner)</strong></p></li>
            </ol>
            
            <p>Advokat dan Senior Partner yang berkantor di ARSY GEMILANG Law Office, Beralamat di Komplek Sawangan Permai, Jl. Permata 8 No.27, Pasir Putih, Sawangan, Kota Depok, Jawa Barat 16519, selanjutnya disebut <strong>PENERIMA KUASA</strong>.</p>
            
            <p style="text-align: center;">-------------------------------------------------K H U S U S----------------------------------------------</p>
            
            <p><em>Bertindak untuk dan atas nama Pemberi Kuasa guna mengurus permasalahan </em><strong><em>{{jenis_hutang}}</em></strong><em> atas nama </em><strong>{{nama_klien}}</strong><em> dengan NO: </em><strong><em>{{nomor_kontrak}}</em></strong><em> yang diterbitkan oleh Bank: </em><strong><em>{{bank_provider}}</em></strong><em>, dalam kedudukannya sebagai nasabah pada Bank dimaksud.</em></p>
            
            <p>Untuk itu penerima kuasa diberi Hak untuk Mendampingi dan atau mewakili pemberi kuasa Untuk menghadap Pejabat dan atau instansi terkait, Mengajukan <em>Reschedule</em>, Mengajukan <em>Discount</em> Pelunasan, membuat somasi, Menjawab Somasi, mengadakan perdamaian, menerima dan atau melakukan pembayaran, Serta melakukan segala tindakan Hukum lain yang dianggap Perlu dan berguna Bagi kepentingan hukum pemberi Kuasa baik didalam maupun diluar peradilan.</p>
            
            <p>Surat Kuasa ini di berikan dengan <em>Honorarium, Hak Retensi, Hak Substitusi</em> baik sebagian atau seluruhnya.</p>
            
            <div style="margin-top: 40px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  <tr>
                    <td style="text-align: left; padding: 10px; vertical-align: top;">{{kota_kabupaten}}, {{hari}}, {{tanggal_huruf}} {{bulan}} {{tahun_huruf}}</td>
                    <td style="width: 50%;"></td>
                  </tr>
                  <tr>
                    <td style="text-align: center; padding: 20px 10px; vertical-align: top; width: 50%;">
                      <p><strong>Penerima Kuasa</strong></p>
                    </td>
                    <td style="text-align: center; padding: 20px 10px; vertical-align: top; width: 50%;">
                      <p><strong>Pemberi Kuasa</strong></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="height: 80px; padding: 10px; vertical-align: bottom; text-align: center;">
                      <p style="margin: 0;"><strong>(ALI ASGAR TUHULELE, S.H.)</strong></p>
                    </td>
                    <td style="height: 80px; padding: 10px; vertical-align: bottom; text-align: center;">
                      <p style="margin: 0;"><strong>({{nama_klien}})</strong></p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const docRef = await addDoc(
            collection(db, "surat_kuasa_templates"),
            defaultTemplate
          );
          setTemplates([{ id: docRef.id, ...defaultTemplate }]);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Gagal memuat template");
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch document history from Firestore
  useEffect(() => {
    const fetchDocumentHistory = async () => {
      try {
        console.log("Fetching document history...");
        setHistoryLoading(true);

        // Base query - fetch all documents first for client-side filtering
        const q = query(
          collection(db, "generated_documents"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        console.log("Raw documents fetched:", snapshot.size);

        let allDocuments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        })) as any[];

        console.log("All documents:", allDocuments);

        // Filter by type (optional - remove if you want all document types)
        allDocuments = allDocuments.filter(
          (doc) => doc.type === "surat_kuasa_khusus" || !doc.type
        );

        // Apply date range filter
        if (dateRange.from) {
          allDocuments = allDocuments.filter(
            (doc) => doc.createdAt >= dateRange.from!
          );
        }

        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          allDocuments = allDocuments.filter((doc) => doc.createdAt <= toDate);
        }

        // Apply search filter
        if (searchTerm) {
          allDocuments = allDocuments.filter(
            (doc) =>
              doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              doc.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              doc.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Apply sorting
        allDocuments.sort((a, b) => {
          const aValue = sortBy === "date" ? a.createdAt : a.title || "";
          const bValue = sortBy === "date" ? b.createdAt : b.title || "";

          if (sortOrder === "asc") {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        console.log("Filtered and sorted documents:", allDocuments.length);

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedDocs = allDocuments.slice(startIndex, endIndex);

        setDocumentHistory(paginatedDocs);
        setHistory(allDocuments); // Store all documents for reference
        setTotalPages(Math.ceil(allDocuments.length / itemsPerPage));

        console.log("Final paginated documents:", paginatedDocs);
      } catch (error) {
        console.error("Error fetching document history:", error);
        toast.error("Gagal memuat riwayat dokumen");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchDocumentHistory();
  }, [dateRange, searchTerm, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Set overall loading state
  useEffect(() => {
    setIsLoading(clientsLoading || templatesLoading);
  }, [clientsLoading, templatesLoading]);

  // Get selected client data
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedDebt = selectedClient?.debtData.debts.find(
    (d) => d.id === selectedDebtId
  );

  // Filter clients based on search term
  useEffect(() => {
    if (!clientSearchTerm.trim()) {
      setFilteredClients(clients);
      setSelectedClientIndex(-1);
      return;
    }

    const filtered = clients.filter((client) => {
      const searchLower = clientSearchTerm.toLowerCase();
      const namaMatch = client.personalData.namaLengkap
        .toLowerCase()
        .includes(searchLower);
      const nikMatch = client.personalData.nik
        .toLowerCase()
        .includes(searchLower);
      return namaMatch || nikMatch;
    });

    setFilteredClients(filtered);
    setSelectedClientIndex(-1);
  }, [clients, clientSearchTerm]);

  // Update client search term when client is selected
  useEffect(() => {
    if (selectedClientId && selectedClient) {
      setClientSearchTerm(
        `${selectedClient.personalData.namaLengkap} (${selectedClient.personalData.nik})`
      );
      setShowClientDropdown(false);
      toast.success(`Klien ${selectedClient.personalData.namaLengkap} dipilih`);
    }
  }, [selectedClientId, selectedClient]);

  // Show success message when debt is selected
  useEffect(() => {
    if (selectedDebtId && selectedClient) {
      const debt = selectedClient.debtData.debts.find(
        (d) => d.id === selectedDebtId
      );
      if (debt) {
        toast.success(
          `Hutang ${debt.jenisHutang} - ${debt.bankProvider} dipilih`
        );
      }
    }
  }, [selectedDebtId, selectedClient]);

  // Show success message when document number is generated
  useEffect(() => {
    if (documentNumber) {
      toast.success(`Nomor dokumen ${documentNumber} berhasil dibuat`);
    }
  }, [documentNumber]);

  // Keyboard shortcuts untuk navigasi
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Jangan handle jika sedang mengetik di input field
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (event.target as HTMLElement)?.tagName
        )
      ) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            if (step > 1) setStep(step - 1);
            break;
          case "ArrowRight":
            event.preventDefault();
            const canNext =
              step < STEPS.length &&
              (() => {
                switch (step + 1) {
                  case 2:
                    return !!selectedClientId;
                  case 3:
                    return !!selectedClientId && !!selectedDebtId;
                  case 4:
                    return (
                      !!selectedClientId && !!selectedDebtId && !!documentNumber
                    );
                  case 5:
                    return (
                      !!selectedClientId &&
                      !!selectedDebtId &&
                      !!documentNumber &&
                      !!selectedTemplateId
                    );
                  case 6:
                    return (
                      !!selectedClientId &&
                      !!selectedDebtId &&
                      !!documentNumber &&
                      !!selectedTemplateId
                    );
                  default:
                    return true;
                }
              })();
            if (canNext) setStep(step + 1);
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    step,
    selectedClientId,
    selectedDebtId,
    documentNumber,
    selectedTemplateId,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target && !target.closest(".client-search-container")) {
        setShowClientDropdown(false);
      }
    };

    if (showClientDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showClientDropdown]);

  // Handle keyboard navigation in dropdown
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showClientDropdown || filteredClients.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedClientIndex((prev) =>
            prev < filteredClients.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedClientIndex((prev) =>
            prev > 0 ? prev - 1 : filteredClients.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (
            selectedClientIndex >= 0 &&
            selectedClientIndex < filteredClients.length
          ) {
            const selectedClient = filteredClients[selectedClientIndex];
            setSelectedClientId(selectedClient.id);
            setClientSearchTerm(
              `${selectedClient.personalData.namaLengkap} (${selectedClient.personalData.nik})`
            );
            setShowClientDropdown(false);
            setSelectedClientIndex(-1);
          }
          break;
        case "Escape":
          event.preventDefault();
          setShowClientDropdown(false);
          setSelectedClientIndex(-1);
          break;
      }
    };

    if (showClientDropdown) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showClientDropdown, filteredClients, selectedClientIndex]);

  // Template CRUD Functions

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteDoc(doc(db, "surat_kuasa_templates", templateId));

      // Remove from local state
      setTemplates((prev) =>
        prev.filter((template) => template.id !== templateId)
      );

      // Clear selection if deleted template was selected
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId("");
        setEditorContent("");
      }

      toast.success("Template berhasil dihapus");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Gagal menghapus template");
    }
  };

  const handleEditTemplate = (template: Template) => {
    // Navigate to edit template page
    window.location.href = `/documents/surat-kuasa-khusus/edit-template/${template.id}`;
  };

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplateForView(template);
    setIsTemplateViewDialogOpen(true);
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const duplicatedTemplate = {
        name: `${template.name} (Copy)`,
        content: template.content,
        description: `Copy of ${template.description || template.name}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "surat_kuasa_templates"),
        duplicatedTemplate
      );

      // Add to local state
      const newTemplate = { id: docRef.id, ...duplicatedTemplate };
      setTemplates((prev) => [...prev, newTemplate]);

      toast.success("Template berhasil diduplikasi");
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Gagal menduplikasi template");
    }
  };

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setEditorContent("");
    setShowTemplateManagement(false);
    toast.success(`Template "${template.name}" dipilih`);
  };

  // Document History Management Functions
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDoc(doc(db, "generated_documents", documentId));
      setDocumentHistory((prev) => prev.filter((doc) => doc.id !== documentId));
      setHistory((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Dokumen berhasil dihapus");
      setIsDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Gagal menghapus dokumen");
    }
  };

  const handleDuplicateDocument = async (document: any) => {
    try {
      const duplicatedDoc = {
        ...document,
        title: `${document.title} (Copy)`,
        createdAt: serverTimestamp(),
      };
      delete duplicatedDoc.id; // Remove the original ID

      await addDoc(collection(db, "generated_documents"), duplicatedDoc);
      toast.success("Dokumen berhasil diduplikasi");
    } catch (error) {
      console.error("Error duplicating document:", error);
      toast.error("Gagal menduplikasi dokumen");
    }
  };

  const handleDownloadDocument = (document: any) => {
    try {
      const blob = new Blob([document.content || ""], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${document.title || "document"}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Dokumen berhasil diunduh");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Gagal mengunduh dokumen");
    }
  };

  const handlePreviewDocument = (document: any) => {
    setPreviewDocument(document);
    setShowPreviewModal(true);
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocumentForView(document);
    setIsDocumentViewDialogOpen(true);
  };

  // Document Preview functionality
  const handlePreviewDocumentFromEditor = () => {
    if (!selectedClient || !selectedDebt) {
      toast.error("Pilih klien dan hutang terlebih dahulu");
      return;
    }

    if (!editorContent && !selectedTemplateId) {
      toast.error("Tidak ada konten untuk di-preview");
      return;
    }

    try {
      setIsPreviewing(true);

      // Get content from editor or selected template
      const rawContent =
        editorContent ||
        templates.find((t) => t.id === selectedTemplateId)?.content ||
        "";

      if (!rawContent.trim()) {
        toast.error("Konten kosong");
        return;
      }

      // Process template with variables
      const processedContent = processTemplate(rawContent);
      setPreviewContent(processedContent);
      setShowDocumentPreview(true);

      toast.success("Preview dokumen berhasil dibuat");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Gagal membuat preview dokumen");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSaveAndDownloadPDFFromPreview = async () => {
    if (!selectedClient || !selectedDebt || !previewContent) {
      toast.error("Data tidak lengkap atau preview belum dibuat");
      return;
    }

    try {
      setIsDownloading(true);
      setIsGenerating(true);

      // First save to database
      toast.info("Menyimpan dokumen...");

      // Generate fresh document number for final document
      const finalDocumentNumber = await generateDocumentNumber();

      const documentData = {
        documentNumber: finalDocumentNumber,
        clientId: selectedClientId,
        clientName: selectedClient.personalData.namaLengkap,
        debtId: selectedDebtId,
        templateId: selectedTemplateId,
        customLetter: customLetter,
        content: previewContent,
        variables: getAvailableVariables(),
        createdAt: serverTimestamp(),
        type: "surat_kuasa_khusus",
      };

      const docRef = await addDoc(
        collection(db, "generated_documents"),
        documentData
      );

      toast.success("Dokumen berhasil disimpan");

      // Update history
      setHistory((prev) => [...prev, { id: docRef.id, ...documentData }]);

      // Then generate PDF using jsPDF
      toast.info("Membuat PDF...");

      // Create a temporary element for better content rendering
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = previewContent;
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.fontSize = "12px";
      tempDiv.style.lineHeight = "1.6";
      tempDiv.style.color = "#000";
      tempDiv.style.maxWidth = "800px";
      tempDiv.style.margin = "0 auto";

      // Append temporarily to get computed styles
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      document.body.appendChild(tempDiv);

      // Import jsPDF dynamically
      const jsPDF = (await import("jspdf")).default;

      // Create PDF using jsPDF
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      // Add content to PDF
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SURAT KUASA KHUSUS", pageWidth / 2, margin + 10, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Nomor: ${finalDocumentNumber}`, pageWidth / 2, margin + 20, {
        align: "center",
      });

      let yPosition = margin + 35;

      // Process HTML content to plain text with basic formatting preservation
      const htmlElements = tempDiv.querySelectorAll("*");
      const textContent: Array<{
        text: string;
        isBold: boolean;
        isItalic: boolean;
        isCenter: boolean;
      }> = [];

      function extractTextWithFormatting(element: Element) {
        const style = window.getComputedStyle(element);
        const isBold =
          style.fontWeight === "bold" ||
          style.fontWeight >= "600" ||
          element.tagName === "STRONG" ||
          element.tagName === "B";
        const isItalic =
          style.fontStyle === "italic" ||
          element.tagName === "EM" ||
          element.tagName === "I";
        const isCenter =
          style.textAlign === "center" || element.tagName === "CENTER";

        if (
          element.tagName === "P" ||
          element.tagName === "DIV" ||
          element.tagName === "H1" ||
          element.tagName === "H2" ||
          element.tagName === "H3"
        ) {
          const text = element.textContent?.trim() || "";
          if (text) {
            textContent.push({ text, isBold, isItalic, isCenter });
          }
        }
      }

      // If no specific elements found, use the full text content
      if (htmlElements.length === 0) {
        const fullText = tempDiv.textContent || "";
        const lines = fullText.split("\n").filter((line) => line.trim());
        lines.forEach((line) => {
          textContent.push({
            text: line.trim(),
            isBold: false,
            isItalic: false,
            isCenter: false,
          });
        });
      } else {
        htmlElements.forEach(extractTextWithFormatting);
      }

      // If still no content, fall back to raw text
      if (textContent.length === 0) {
        const rawText =
          tempDiv.textContent ||
          previewContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
        const lines = rawText.split(".").filter((line) => line.trim());
        lines.forEach((line) => {
          const cleanLine = line.trim();
          if (cleanLine) {
            textContent.push({
              text: cleanLine + ".",
              isBold: false,
              isItalic: false,
              isCenter: false,
            });
          }
        });
      }

      // Add content to PDF
      doc.setFontSize(11);

      textContent.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }

        // Set font style
        if (item.isBold && item.isItalic) {
          doc.setFont("helvetica", "bolditalic");
        } else if (item.isBold) {
          doc.setFont("helvetica", "bold");
        } else if (item.isItalic) {
          doc.setFont("helvetica", "italic");
        } else {
          doc.setFont("helvetica", "normal");
        }

        // Split long text to fit page width
        const splitText = doc.splitTextToSize(item.text, contentWidth);
        const textHeight = splitText.length * 6; // Approximate line height

        // Check if we need a new page for this text block
        if (yPosition + textHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Add text to PDF
        if (item.isCenter) {
          doc.text(splitText, pageWidth / 2, yPosition, { align: "center" });
        } else {
          doc.text(splitText, margin, yPosition);
        }

        yPosition += textHeight + 3; // Add some spacing between paragraphs
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Generate filename
      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[T:]/g, "-");
      const clientName = selectedClient.personalData.namaLengkap
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase();
      const fileName = `surat-kuasa-${clientName}-${timestamp}.pdf`;

      // Save PDF
      doc.save(fileName);

      toast.success(
        `Dokumen berhasil disimpan dan PDF didownload: ${fileName}`
      );

      // Close preview modal
      setShowDocumentPreview(false);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tidak diketahui";
      toast.error(`Gagal menyimpan atau membuat PDF: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
      setIsGenerating(false);
    }
  };

  const handleDownloadPDFFromPreviewOnly = async () => {
    if (!selectedClient || !selectedDebt || !previewContent) {
      toast.error("Data tidak lengkap atau preview belum dibuat");
      return;
    }

    try {
      setIsDownloading(true);
      toast.info("Membuat PDF...");

      // Create a temporary element for better content rendering
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = previewContent;
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.fontSize = "12px";
      tempDiv.style.lineHeight = "1.6";
      tempDiv.style.color = "#000";
      tempDiv.style.maxWidth = "800px";
      tempDiv.style.margin = "0 auto";

      // Append temporarily to get computed styles
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      document.body.appendChild(tempDiv);

      // Import jsPDF dynamically
      const jsPDF = (await import("jspdf")).default;

      // Create PDF using jsPDF
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      // Add content to PDF (same logic as above)
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SURAT KUASA KHUSUS", pageWidth / 2, margin + 10, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Nomor: ${documentNumber}`, pageWidth / 2, margin + 20, {
        align: "center",
      });

      let yPosition = margin + 35;

      // Process HTML content to plain text with basic formatting preservation
      const htmlElements = tempDiv.querySelectorAll("*");
      const textContent: Array<{
        text: string;
        isBold: boolean;
        isItalic: boolean;
        isCenter: boolean;
      }> = [];

      function extractTextWithFormatting(element: Element) {
        const style = window.getComputedStyle(element);
        const isBold =
          style.fontWeight === "bold" ||
          style.fontWeight >= "600" ||
          element.tagName === "STRONG" ||
          element.tagName === "B";
        const isItalic =
          style.fontStyle === "italic" ||
          element.tagName === "EM" ||
          element.tagName === "I";
        const isCenter =
          style.textAlign === "center" || element.tagName === "CENTER";

        if (
          element.tagName === "P" ||
          element.tagName === "DIV" ||
          element.tagName === "H1" ||
          element.tagName === "H2" ||
          element.tagName === "H3"
        ) {
          const text = element.textContent?.trim() || "";
          if (text) {
            textContent.push({ text, isBold, isItalic, isCenter });
          }
        }
      }

      // If no specific elements found, use the full text content
      if (htmlElements.length === 0) {
        const fullText = tempDiv.textContent || "";
        const lines = fullText.split("\n").filter((line) => line.trim());
        lines.forEach((line) => {
          textContent.push({
            text: line.trim(),
            isBold: false,
            isItalic: false,
            isCenter: false,
          });
        });
      } else {
        htmlElements.forEach(extractTextWithFormatting);
      }

      // If still no content, fall back to raw text
      if (textContent.length === 0) {
        const rawText =
          tempDiv.textContent ||
          previewContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
        const lines = rawText.split(".").filter((line) => line.trim());
        lines.forEach((line) => {
          const cleanLine = line.trim();
          if (cleanLine) {
            textContent.push({
              text: cleanLine + ".",
              isBold: false,
              isItalic: false,
              isCenter: false,
            });
          }
        });
      }

      // Add content to PDF
      doc.setFontSize(11);

      textContent.forEach((item, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }

        // Set font style
        if (item.isBold && item.isItalic) {
          doc.setFont("helvetica", "bolditalic");
        } else if (item.isBold) {
          doc.setFont("helvetica", "bold");
        } else if (item.isItalic) {
          doc.setFont("helvetica", "italic");
        } else {
          doc.setFont("helvetica", "normal");
        }

        // Split long text to fit page width
        const splitText = doc.splitTextToSize(item.text, contentWidth);
        const textHeight = splitText.length * 6; // Approximate line height

        // Check if we need a new page for this text block
        if (yPosition + textHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Add text to PDF
        if (item.isCenter) {
          doc.text(splitText, pageWidth / 2, yPosition, { align: "center" });
        } else {
          doc.text(splitText, margin, yPosition);
        }

        yPosition += textHeight + 3; // Add some spacing between paragraphs
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Generate filename
      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[T:]/g, "-");
      const clientName = selectedClient.personalData.namaLengkap
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase();
      const fileName = `surat-kuasa-preview-${clientName}-${timestamp}.pdf`;

      // Save PDF
      doc.save(fileName);

      toast.success(`PDF berhasil didownload: ${fileName}`);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tidak diketahui";
      toast.error(`Gagal membuat PDF: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // PDF Download for existing documents using html2pdf.js for better HTML formatting preservation
  const handleDownloadExistingPDF = async (document: any) => {
    try {
      setIsDownloading(true);
      toast.info("Membuat PDF...");

      if (!document.content || !document.content.trim()) {
        throw new Error("Konten dokumen kosong");
      }

      // Create a temporary container for PDF generation
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "794px"; // A4 width in pixels at 96 DPI
      tempContainer.style.padding = "40px";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      tempContainer.style.fontSize = "14px";
      tempContainer.style.lineHeight = "1.6";
      tempContainer.style.color = "#000";
      tempContainer.style.backgroundColor = "#fff";

      // Add document content to container
      tempContainer.innerHTML = document.content;

      // Append to body temporarily
      document.body.appendChild(tempContainer);

      // Generate filename
      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[T:]/g, "-");
      const clientName = (document.clientName || "unknown")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase();
      const fileName = `surat-kuasa-${clientName}-${timestamp}.pdf`;

      // Import html2pdf dynamically
      const html2pdf = (await import("html2pdf.js")).default;

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

      toast.success(`PDF berhasil didownload: ${fileName}`);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tidak diketahui";
      toast.error(`Gagal membuat PDF: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadExcelFromEditor = async () => {
    if (!selectedClient || !selectedDebt) {
      toast.error("Pilih klien dan hutang terlebih dahulu");
      return;
    }

    try {
      setIsDownloading(true);
      toast.info("Membuat dokumen Excel...");

      // Create Excel-like data structure
      const excelData = [
        ["SURAT KUASA KHUSUS"],
        [`Nomor: ${documentNumber}`],
        [""],
        ["INFORMASI KLIEN"],
        ["Nama", selectedClient.personalData.namaLengkap],
        ["NIK", selectedClient.personalData.nik],
        [
          "Jenis Kelamin",
          selectedClient.personalData.jenisKelamin || "Tidak diketahui",
        ],
        [
          "Pekerjaan",
          selectedClient.jobData?.jenisPekerjaan ||
            selectedClient.jobData?.jabatan ||
            "Tidak diketahui",
        ],
        ["Alamat", selectedClient.contactData?.alamat || "Tidak diketahui"],
        ["RT/RW", selectedClient.contactData?.rtRw || "000/000"],
        [
          "Kelurahan",
          selectedClient.contactData?.kelurahanDesa || "Tidak diketahui",
        ],
        [
          "Kecamatan",
          selectedClient.contactData?.kecamatan || "Tidak diketahui",
        ],
        [
          "Kota/Kabupaten",
          selectedClient.contactData?.kotaKabupaten || "Tidak diketahui",
        ],
        ["Provinsi", selectedClient.contactData?.provinsi || "Tidak diketahui"],
        [""],
        ["INFORMASI HUTANG"],
        ["Jenis Hutang", selectedDebt.jenisHutang],
        ["Bank/Provider", selectedDebt.bankProvider],
        ["Nomor Kartu/Kontrak", selectedDebt.nomorKartuKontrak],
        ["Outstanding", `Rp ${selectedDebt.outstanding}`],
        [""],
        ["TANGGAL DOKUMEN"],
        ["Tanggal Dibuat", new Date().toLocaleDateString("id-ID")],
        ["Nomor Dokumen", documentNumber],
      ];

      // Convert to CSV format
      const csvContent = excelData
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const timestamp = new Date()
        .toISOString()
        .slice(0, 16)
        .replace(/[T:]/g, "-");
      const clientName = selectedClient.personalData.namaLengkap
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toLowerCase();
      const fileName = `surat-kuasa-${clientName}-${timestamp}.csv`;

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`File Excel berhasil didownload: ${fileName}`);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tidak diketahui";
      toast.error(`Gagal membuat file Excel: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Filter and sort document history
  const getFilteredAndSortedHistory = () => {
    let filtered = documentHistory;

    // Apply date filter
    if (historyFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (historyFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter((doc) => {
        const docDate = new Date(doc.createdAt);
        return docDate >= filterDate;
      });
    }

    // Apply search filter
    if (historySearchTerm.trim()) {
      const searchLower = historySearchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.clientName.toLowerCase().includes(searchLower) ||
          doc.documentNumber.toLowerCase().includes(searchLower) ||
          (doc.content || "").toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "client":
          aValue = a.clientName;
          bValue = b.clientName;
          break;
        case "document":
          aValue = a.documentNumber;
          bValue = b.documentNumber;
          break;
        case "date":
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  // Pagination
  const filteredHistory = getFilteredAndSortedHistory();
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter templates based on search term
  const filteredTemplates = templates.filter((template) => {
    if (!templateSearchTerm.trim()) return true;
    const searchLower = templateSearchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(searchLower) ||
      (template.description || "").toLowerCase().includes(searchLower)
    );
  });

  // Get available variables
  const getAvailableVariables = () => {
    if (!selectedClient || !selectedDebt) return [];

    const now = new Date();
    const day = getDayInIndonesian(now);
    const date = now.getDate();
    const dateInWords = numberToWords(date);
    const month = getMonthInIndonesian(now.getMonth() + 1);
    const year = now.getFullYear();
    const yearInWords = numberToWords(year);

    // Helper function to parse RT/RW
    const parseRtRw = (rtRw?: string) => {
      if (!rtRw) return { rt: "000", rw: "000" };
      const parts = rtRw.split("/");
      return {
        rt: parts[0]?.padStart(3, "0") || "000",
        rw: parts[1]?.padStart(3, "0") || "000",
      };
    };

    const { rt, rw } = parseRtRw(selectedClient.contactData?.rtRw);

    return [
      // Document variables
      { key: "{{nomor_surat}}", value: documentNumber },
      { key: "{{tanggal_hari_ini}}", value: now.toLocaleDateString("id-ID") },

      // Date variables
      { key: "{{hari}}", value: day },
      { key: "{{tanggal_huruf}}", value: dateInWords },
      { key: "{{bulan}}", value: month },
      { key: "{{tahun_huruf}}", value: yearInWords },

      // Client personal data
      { key: "{{nama_klien}}", value: selectedClient.personalData.namaLengkap },
      { key: "{{nik_klien}}", value: selectedClient.personalData.nik },
      {
        key: "{{jenis_kelamin}}",
        value: selectedClient.personalData.jenisKelamin || "Tidak diketahui",
      },
      {
        key: "{{pekerjaan}}",
        value:
          selectedClient.jobData?.jenisPekerjaan ||
          selectedClient.jobData?.jabatan ||
          "Tidak diketahui",
      },

      // Client address data (from contactData)
      {
        key: "{{alamat}}",
        value: selectedClient.contactData?.alamat || "Tidak diketahui",
      },
      {
        key: "{{rt_rw}}",
        value: `${rt}/${rw}`,
      },
      {
        key: "{{kelurahan}}",
        value: selectedClient.contactData?.kelurahanDesa || "Tidak diketahui",
      },
      {
        key: "{{kecamatan}}",
        value: selectedClient.contactData?.kecamatan || "Tidak diketahui",
      },
      {
        key: "{{kota_kabupaten}}",
        value: selectedClient.contactData?.kotaKabupaten || "Tidak diketahui",
      },
      {
        key: "{{provinsi}}",
        value: selectedClient.contactData?.provinsi || "Tidak diketahui",
      },

      // Debt data
      { key: "{{jenis_hutang}}", value: selectedDebt.jenisHutang },
      { key: "{{bank_provider}}", value: selectedDebt.bankProvider },
      { key: "{{nomor_kontrak}}", value: selectedDebt.nomorKartuKontrak },
      { key: "{{outstanding}}", value: selectedDebt.outstanding },
    ];
  };

  // Replace variables in template
  const processTemplate = (content: string) => {
    let processedContent = content;
    const variables = getAvailableVariables();

    variables.forEach((variable) => {
      const regex = new RegExp(
        variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      processedContent = processedContent.replace(regex, variable.value);
    });

    return processedContent;
  };

  // Step 1: Pilih Klien dengan tips
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="client">Pilih Klien</Label>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {clients.length} klien tersedia
        </div>
      </div>

      {/* Tips untuk Step 1 */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 text-blue-500 mt-0.5">💡</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tips:</strong> Ketik nama lengkap atau NIK klien untuk
            mencari dengan cepat. Gunakan tanda panah ↑↓ untuk navigasi dan
            Enter untuk memilih.
          </div>
        </div>
      </div>

      {clientsLoading ? (
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/2"></div>
          </div>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Belum ada data klien
          </p>
          <Button
            size="sm"
            onClick={() => window.open("/clients/data", "_blank")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Klien Baru
          </Button>
        </div>
      ) : (
        <>
          <div className="relative client-search-container">
            <Input
              value={clientSearchTerm}
              onChange={(e) => {
                setClientSearchTerm(e.target.value);
                setShowClientDropdown(true);
                if (!e.target.value.trim()) {
                  setSelectedClientId("");
                }
              }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Ketik nama klien atau NIK untuk mencari..."
              className="w-full pr-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
            {clientSearchTerm && (
              <button
                type="button"
                onClick={() => {
                  setClientSearchTerm("");
                  setSelectedClientId("");
                  setShowClientDropdown(false);
                  setSelectedClientIndex(-1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Gunakan ↑↓ untuk navigasi, Enter untuk memilih, Esc untuk menutup
            </p>

            {showClientDropdown && filteredClients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.map((client, index) => (
                  <div
                    key={client.id}
                    onMouseEnter={() => setSelectedClientIndex(index)}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setClientSearchTerm(
                        `${client.personalData.namaLengkap} (${client.personalData.nik})`
                      );
                      setShowClientDropdown(false);
                      setSelectedClientIndex(-1);
                    }}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                      index === selectedClientIndex
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-200">
                      {client.personalData.namaLengkap}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      NIK: {client.personalData.nik}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showClientDropdown &&
              clientSearchTerm.trim() &&
              filteredClients.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                  <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                    Klien tidak ditemukan
                  </div>
                </div>
              )}
          </div>

          {selectedClient && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <h4 className="font-medium dark:text-gray-200">Klien Dipilih:</h4>
              <p className="dark:text-gray-300">
                {selectedClient.personalData.namaLengkap}
              </p>
              <p className="dark:text-gray-300">
                NIK: {selectedClient.personalData.nik}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Step 2: Pilih Hutang dengan tips
  const renderStep2 = () => {
    if (!selectedClient) {
      return (
        <div className="text-center py-8">
          <User className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-500 dark:text-red-400 mb-2">
            Pilih klien terlebih dahulu
          </p>
          <Button variant="outline" onClick={() => setStep(1)}>
            Kembali ke Step 1
          </Button>
        </div>
      );
    }

    const debts = selectedClient.debtData?.debts || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="debt">Pilih Hutang</Label>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {debts.length} hutang tersedia
          </div>
        </div>

        {/* Tips untuk Step 2 */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 text-blue-500 mt-0.5">💡</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tips:</strong> Pilih hutang yang akan dijadikan dasar
              untuk pembuatan surat kuasa. Data hutang ini akan otomatis
              dimasukkan ke dalam dokumen.
            </div>
          </div>
        </div>

        {debts.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Klien ini belum memiliki data hutang
            </p>
            <Button
              size="sm"
              onClick={() =>
                window.open(`/clients/data?edit=${selectedClient.id}`, "_blank")
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Data Hutang
            </Button>
          </div>
        ) : (
          <Select value={selectedDebtId} onValueChange={setSelectedDebtId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih hutang" />
            </SelectTrigger>
            <SelectContent>
              {debts.map((debt) => (
                <SelectItem key={debt.id} value={debt.id}>
                  {debt.jenisHutang} - {debt.bankProvider} (Rp{" "}
                  {debt.outstanding})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedDebt && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <h4 className="font-medium dark:text-gray-200">Hutang Dipilih:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
              <p className="dark:text-gray-300">
                <strong>Jenis:</strong> {selectedDebt.jenisHutang}
              </p>
              <p className="dark:text-gray-300">
                <strong>Bank/Provider:</strong> {selectedDebt.bankProvider}
              </p>
              <p className="dark:text-gray-300">
                <strong>Nomor:</strong> {selectedDebt.nomorKartuKontrak}
              </p>
              <p className="dark:text-gray-300">
                <strong>Outstanding:</strong> Rp {selectedDebt.outstanding}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 3: Pengaturan Dokumen dengan tips
  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium dark:text-gray-200">
          Pengaturan Nomor Surat
        </h3>

        {/* Tips untuk Step 3 */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 text-blue-500 mt-0.5">💡</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tips:</strong> Nomor surat akan dibuat otomatis dengan
              format standar. Anda dapat mengubah huruf kustom sesuai dengan
              jenis dokumen yang akan dibuat.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customLetter">Huruf Kustom</Label>
              <Select value={customLetter} onValueChange={setCustomLetter}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectValue placeholder="Pilih huruf kustom" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem
                    value="CC-KTA"
                    className="dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    CC-KTA (Credit Card - Kredit Tanpa Agunan)
                  </SelectItem>
                  <SelectItem
                    value="PINJOL"
                    className="dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    PINJOL (Pinjaman Online)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih jenis huruf kustom sesuai dengan tipe dokumen
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <h4 className="font-medium mb-3 dark:text-gray-200">
                Preview Nomor Surat
              </h4>
              <div className="space-y-2">
                <p className="font-mono text-lg dark:text-gray-300 break-all">
                  {documentNumber}
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="font-medium">
                    Format: no_surat/DOCS/huruf_kustom/SKK/bulan_romawi/tahun
                  </p>
                  <div className="space-y-0.5 pl-2">
                    <p>• no_surat: Nomor urut otomatis</p>
                    <p>• DOCS: Kode dokumen</p>
                    <p>• {customLetter}: Huruf kustom Anda</p>
                    <p>• SKK: Surat Kuasa Khusus</p>
                    <p>• Bulan dalam angka Romawi</p>
                    <p>• Tahun sekarang</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status indicator untuk document number generation */}
        {documentNumber && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 text-green-500">✅</div>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Nomor dokumen berhasil dibuat! Siap melanjutkan ke pemilihan
                template.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 4: Pilih Template & Variabel (previously step 3)
  const renderStep4 = () => {
    if (!selectedClient || !selectedDebt) {
      return (
        <p className="text-red-500 dark:text-red-400">
          Pilih klien dan hutang terlebih dahulu
        </p>
      );
    }

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    const variables = getAvailableVariables();

    return (
      <div className="space-y-6">
        {/* Template Management Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium dark:text-gray-200">
            Template & Variabel
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplateManagement(!showTemplateManagement)}
              className="dark:border-gray-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showTemplateManagement ? "Sembunyikan" : "Kelola Template"}
            </Button>
            <Button
              onClick={() =>
                (window.location.href =
                  "/documents/surat-kuasa-khusus/create-template")
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Template
            </Button>
          </div>
        </div>

        {/* Template Management Section */}
        {showTemplateManagement && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-gray-200">
                    Kelola Template
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Kelola semua template surat kuasa khusus dengan mudah
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Search Template */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cari template..."
                      value={templateSearchTerm}
                      onChange={(e) => setTemplateSearchTerm(e.target.value)}
                      className="pl-10 w-64 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex border rounded-lg dark:border-gray-600">
                    <Button
                      variant={
                        templateViewMode === "grid" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setTemplateViewMode("grid")}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={
                        templateViewMode === "list" ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setTemplateViewMode("list")}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div
                  className={`grid gap-4 ${
                    templateViewMode === "grid"
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1"
                  }`}
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
                    ></div>
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
                    {templateSearchTerm
                      ? "Template tidak ditemukan"
                      : "Belum ada template"}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {templateSearchTerm
                      ? `Tidak ada template yang cocok dengan "${templateSearchTerm}"`
                      : "Mulai dengan membuat template pertama Anda"}
                  </p>
                  {!templateSearchTerm && (
                    <Button
                      onClick={() =>
                        (window.location.href =
                          "/documents/surat-kuasa-khusus/create-template")
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Template Pertama
                    </Button>
                  )}
                </div>
              ) : templateViewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="relative group hover:shadow-md transition-shadow dark:bg-gray-700 dark:border-gray-600"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-medium truncate dark:text-gray-200">
                              {template.name}
                            </CardTitle>
                            {template.description && (
                              <CardDescription className="text-sm mt-1 line-clamp-2 dark:text-gray-400">
                                {template.description}
                              </CardDescription>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="dark:bg-gray-800 dark:border-gray-700"
                            >
                              <DropdownMenuItem
                                onClick={() => handleViewTemplate(template)}
                                className="dark:hover:bg-gray-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUseTemplate(template)}
                                className="dark:hover:bg-gray-700"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Gunakan Template
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditTemplate(template)}
                                className="dark:hover:bg-gray-700"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Template
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDuplicateTemplate(template)
                                }
                                className="dark:hover:bg-gray-700"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplikasi
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="dark:text-gray-200">
                                      Hapus Template
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="dark:text-gray-400">
                                      Apakah Anda yakin ingin menghapus template
                                      "{template.name}"? Tindakan ini tidak
                                      dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                      Batal
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteTemplate(template.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* Template Content Preview */}
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-600">
                          <div
                            className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3"
                            dangerouslySetInnerHTML={{
                              __html:
                                template.content.substring(0, 150) +
                                (template.content.length > 150 ? "..." : ""),
                            }}
                          />
                        </div>

                        {/* Template Info */}
                        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex justify-between">
                            <span>Dibuat:</span>
                            <span>
                              {template.createdAt
                                ? template.createdAt.seconds
                                  ? new Date(
                                      template.createdAt.seconds * 1000
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : new Date(
                                      template.createdAt
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Diperbarui:</span>
                            <span>
                              {template.updatedAt
                                ? template.updatedAt.seconds
                                  ? new Date(
                                      template.updatedAt.seconds * 1000
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : new Date(
                                      template.updatedAt
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                : "-"}
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                            className="flex-1"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Gunakan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTemplate(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* List View */
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="dark:text-gray-300">
                        Template
                      </TableHead>
                      <TableHead className="dark:text-gray-300">
                        Deskripsi
                      </TableHead>
                      <TableHead className="dark:text-gray-300">
                        Dibuat
                      </TableHead>
                      <TableHead className="dark:text-gray-300">
                        Diperbarui
                      </TableHead>
                      <TableHead className="dark:text-gray-300">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id} className="group">
                        <TableCell className="font-medium dark:text-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {template.content.length} karakter
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-gray-300 max-w-xs">
                          <div className="truncate">
                            {template.description || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-gray-300">
                          {template.createdAt
                            ? template.createdAt.seconds
                              ? new Date(
                                  template.createdAt.seconds * 1000
                                ).toLocaleDateString("id-ID")
                              : new Date(template.createdAt).toLocaleDateString(
                                  "id-ID"
                                )
                            : "-"}
                        </TableCell>
                        <TableCell className="dark:text-gray-300">
                          {template.updatedAt
                            ? template.updatedAt.seconds
                              ? new Date(
                                  template.updatedAt.seconds * 1000
                                ).toLocaleDateString("id-ID")
                              : new Date(template.updatedAt).toLocaleDateString(
                                  "id-ID"
                                )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              onClick={() => handleUseTemplate(template)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Gunakan
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="dark:bg-gray-800 dark:border-gray-700"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleViewTemplate(template)}
                                  className="dark:hover:bg-gray-700"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditTemplate(template)}
                                  className="dark:hover:bg-gray-700"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDuplicateTemplate(template)
                                  }
                                  className="dark:hover:bg-gray-700"
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplikasi
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Hapus
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="dark:text-gray-200">
                                        Hapus Template
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="dark:text-gray-400">
                                        Apakah Anda yakin ingin menghapus
                                        template "{template.name}"? Tindakan ini
                                        tidak dapat dibatalkan.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                        Batal
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteTemplate(template.id)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Template Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="template">Pilih Template</Label>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {templates.length} template tersedia
            </div>
          </div>

          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
                ></div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Belum ada template
              </p>
              <Button
                size="sm"
                onClick={() =>
                  (window.location.href =
                    "/documents/surat-kuasa-khusus/create-template")
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Template Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplateId === template.id
                      ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
                      : "hover:border-gray-400 dark:hover:border-gray-500"
                  } dark:bg-gray-800 dark:border-gray-700`}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setEditorContent("");
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-medium dark:text-gray-200 flex items-center">
                          {selectedTemplateId === template.id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                          )}
                          {template.name}
                        </CardTitle>
                        {template.description && (
                          <CardDescription className="text-sm mt-1 dark:text-gray-400">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTemplate(template);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {template.content.length} karakter •
                      {template.updatedAt
                        ? ` Diperbarui ${
                            template.updatedAt.seconds
                              ? new Date(
                                  template.updatedAt.seconds * 1000
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : new Date(template.updatedAt).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )
                          }`
                        : ""}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {template.content
                        .replace(/<[^>]*>/g, "")
                        .substring(0, 80)}
                      ...
                    </div>
                    {selectedTemplateId === template.id && (
                      <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
                        <div className="w-1 h-1 bg-blue-500 rounded-full mr-2"></div>
                        Template terpilih
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Fallback dropdown for compatibility */}
          <Select
            value={selectedTemplateId}
            onValueChange={setSelectedTemplateId}
          >
            <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 md:hidden">
              <SelectValue placeholder="Pilih template (mode mobile)" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              {templates.map((template) => (
                <SelectItem
                  key={template.id}
                  value={template.id}
                  className="dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Variables Section */}
        {selectedClient && selectedDebt && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium dark:text-gray-200">
                Variabel yang Tersedia
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {variables.length} variabel
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {variables.map((variable, index) => (
                <Card
                  key={index}
                  className="group cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  onClick={() => {
                    navigator.clipboard.writeText(variable.key);
                    toast.success(
                      `Variabel "${variable.key}" disalin ke clipboard`
                    );
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <code className="text-sm font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          {variable.key}
                        </code>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 truncate">
                          {variable.value}
                        </p>
                      </div>
                      <Copy className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 text-blue-500 mt-0.5">💡</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tips:</strong> Klik pada variabel mana saja untuk
                  menyalin ke clipboard. Variabel akan otomatis diganti dengan
                  data aktual saat dokumen dibuat.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Editor */}
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Edit Template</Label>
              <div className="flex gap-2">
                <Button
                  onClick={handlePreviewDocumentFromEditor}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={isPreviewing || !selectedClient || !selectedDebt}
                >
                  <Eye className="h-4 w-4" />
                  {isPreviewing ? "Membuat Preview..." : "Preview Dokumen"}
                </Button>
              </div>
            </div>

            {/* Info Message */}
            {(!selectedClient || !selectedDebt) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 text-amber-500 mt-0.5">⚠️</div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Perhatian:</strong> Pilih klien dan hutang terlebih
                    dahulu untuk dapat memproses template dengan data yang
                    lengkap.
                  </div>
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4 dark:border-gray-700">
              <RichEditor
                content={editorContent || selectedTemplate.content}
                onChange={setEditorContent}
              />
            </div>

            {/* Progress Indicator untuk Download dari Editor */}
            {isDownloading && (
              <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Sedang memproses dokumen dari editor...
                  </p>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Konten editor sedang diproses menjadi format yang dipilih
                </p>
              </div>
            )}

            {/* Progress Indicator untuk Preview */}
            {isPreviewing && (
              <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    Sedang membuat preview dokumen...
                  </p>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Memproses template dengan data klien dan variabel
                </p>
              </div>
            )}
          </div>
        )}

        {/* Template View Dialog */}
        <Dialog
          open={isTemplateViewDialogOpen}
          onOpenChange={setIsTemplateViewDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-200">
                {selectedTemplateForView?.name}
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                {selectedTemplateForView?.description || "Preview template"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700 max-h-96 overflow-y-auto">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert dark:text-gray-200"
                  dangerouslySetInnerHTML={{
                    __html: selectedTemplateForView?.content || "",
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTemplateViewDialogOpen(false)}
              >
                Tutup
              </Button>
              {selectedTemplateForView && (
                <Button
                  onClick={() => {
                    setSelectedTemplateId(selectedTemplateForView.id);
                    setEditorContent("");
                    setIsTemplateViewDialogOpen(false);
                    toast.success("Template dipilih");
                  }}
                >
                  Gunakan Template
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Stepper dengan progress
  const renderStepper = () => {
    const progressPercentage = ((step - 1) / (STEPS.length - 1)) * 100;

    return (
      <div className="mb-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            <div className="flex items-center gap-4">
              <span>
                Langkah {step} dari {STEPS.length}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                Ctrl + ← → untuk navigasi cepat
              </span>
            </div>
            <span>{Math.round(progressPercentage)}% selesai</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Buttons */}
        <div className="flex gap-2 overflow-x-auto">
          {STEPS.map((s) => (
            <Button
              key={s.id}
              variant={
                step === s.id
                  ? "default"
                  : step > s.id
                  ? "secondary"
                  : "outline"
              }
              onClick={() => setStep(s.id)}
              className="flex-shrink-0 relative"
              disabled={s.id > step + 1} // Hanya bisa ke step berikutnya atau sebelumnya
            >
              {step > s.id && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-2 h-2 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              {s.id}. {s.title}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Navigation buttons dengan validasi
  const renderNavigation = () => {
    // Validasi untuk setiap step
    const canProceedToStep = (targetStep: number) => {
      switch (targetStep) {
        case 2: // Untuk ke step 2, harus ada client
          return !!selectedClientId;
        case 3: // Untuk ke step 3, harus ada client dan debt
          return !!selectedClientId && !!selectedDebtId;
        case 4: // Untuk ke step 4, harus ada client, debt, dan document number
          return !!selectedClientId && !!selectedDebtId && !!documentNumber;
        default:
          return true;
      }
    };

    const getNextStepMessage = () => {
      if (step === 1 && !selectedClientId) return "Pilih klien terlebih dahulu";
      if (step === 2 && !selectedDebtId) return "Pilih hutang terlebih dahulu";
      if (step === 3 && !documentNumber)
        return "Nomor dokumen belum ter-generate";
      return "";
    };

    const canNext = step < STEPS.length && canProceedToStep(step + 1);
    const nextMessage = getNextStepMessage();

    return (
      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </Button>

        <div className="flex items-center gap-2">
          {nextMessage && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {nextMessage}
            </p>
          )}
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="flex items-center gap-2"
          >
            Selanjutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Document History Component
  const renderDocumentHistory = () => {
    return (
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-gray-200">
                Riwayat Dokumen
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Kelola dan lihat semua dokumen surat kuasa khusus yang telah
                dibuat
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <FileText className="h-4 w-4" />
              {filteredHistory.length} dokumen
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Cari berdasarkan nama klien, nomor dokumen..."
                value={historySearchTerm}
                onChange={(e) => {
                  setHistorySearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={historyFilter}
                onValueChange={(value: any) => {
                  setHistoryFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-32 dark:bg-gray-800 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="today">Hari ini</SelectItem>
                  <SelectItem value="week">7 hari</SelectItem>
                  <SelectItem value="month">30 hari</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-32 dark:bg-gray-800 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="date">Tanggal</SelectItem>
                  <SelectItem value="client">Klien</SelectItem>
                  <SelectItem value="document">Nomor</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 dark:border-gray-700"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>

          {/* Document List */}
          {historyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 border rounded-lg dark:border-gray-700"
                >
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedHistory.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {historySearchTerm || historyFilter !== "all"
                  ? "Tidak ada dokumen yang sesuai dengan filter"
                  : "Belum ada dokumen yang dibuat"}
              </p>
              {historySearchTerm || historyFilter !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHistorySearchTerm("");
                    setHistoryFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  Reset Filter
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedHistory.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-4 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium dark:text-gray-200">
                          {doc.clientName}
                        </h4>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                          {doc.documentNumber}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Dibuat:{" "}
                        {new Date(doc.createdAt).toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                        {doc.content?.replace(/<[^>]*>/g, "").substring(0, 100)}
                        ...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc)}
                        className="dark:border-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadExistingPDF(doc)}
                        disabled={isDownloading}
                        className="dark:border-gray-600"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDocumentToDelete(doc);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 dark:border-gray-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, filteredHistory.length)}{" "}
                  dari {filteredHistory.length} dokumen
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 h-8 dark:bg-gray-800 dark:border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="dark:border-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="dark:border-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Main render
  if (!isClient || isLoading) {
    return (
      <ClientOnly
        fallback={
          <SidebarProvider suppressHydrationWarning>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div
                  className="flex items-center gap-2 px-4"
                  suppressHydrationWarning
                >
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="/dashboard">
                          Dashboard
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="/documents">
                          Documents
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Surat Kuasa Khusus</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>

              <div
                className="flex flex-1 flex-col gap-4 p-4 pt-0"
                suppressHydrationWarning
              >
                <div className="max-w-4xl mx-auto w-full">
                  <div className="mb-6" suppressHydrationWarning>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-2/3"></div>
                  </div>

                  {/* Stepper Skeleton */}
                  <div
                    className="flex gap-2 mb-6 overflow-x-auto"
                    suppressHydrationWarning
                  >
                    {STEPS.map((s) => (
                      <div
                        key={s.id}
                        className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex-shrink-0 w-32"
                      ></div>
                    ))}
                  </div>

                  {/* Card Skeleton */}
                  <Card>
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/3"></div>
                    </CardHeader>
                    <CardContent>
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
        }
      >
        <SidebarProvider suppressHydrationWarning>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div
                className="flex items-center gap-2 px-4"
                suppressHydrationWarning
              >
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/documents">
                        Documents
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Surat Kuasa Khusus</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            <div
              className="flex flex-1 flex-col gap-4 p-4 pt-0"
              suppressHydrationWarning
            >
              <div className="max-w-4xl mx-auto w-full">
                <div className="mb-6" suppressHydrationWarning>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-2/3"></div>
                </div>

                {/* Stepper Skeleton */}
                <div
                  className="flex gap-2 mb-6 overflow-x-auto"
                  suppressHydrationWarning
                >
                  {STEPS.map((s) => (
                    <div
                      key={s.id}
                      className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex-shrink-0 w-32"
                    ></div>
                  ))}
                </div>

                {/* Card Skeleton */}
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
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
      </ClientOnly>
    );
  }

  return (
    <ClientOnly
      fallback={
        <SidebarProvider suppressHydrationWarning>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div
                className="flex items-center gap-2 px-4"
                suppressHydrationWarning
              >
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/documents">
                        Documents
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Surat Kuasa Khusus</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div
              className="flex flex-1 flex-col gap-4 p-4 pt-0"
              suppressHydrationWarning
            >
              <div className="max-w-4xl mx-auto w-full">
                <div className="mb-6">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-2/3"></div>
                </div>
                <div className="flex gap-2 mb-6 overflow-x-auto">
                  {STEPS.map((s) => (
                    <div
                      key={s.id}
                      className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex-shrink-0 w-32"
                    ></div>
                  ))}
                </div>
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
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
      }
    >
      <SidebarProvider suppressHydrationWarning>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div
              className="flex items-center gap-2 px-4"
              suppressHydrationWarning
            >
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

          <div
            className="flex flex-1 flex-col gap-4 p-4 pt-0"
            suppressHydrationWarning
          >
            <div className="max-w-4xl mx-auto w-full">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Surat Kuasa Khusus
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Buat surat kuasa khusus untuk klien dengan mudah
                </p>
              </div>

              {/* Progress Summary Card */}
              <Card className="mb-6 border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div
                      className={`p-2 rounded ${
                        selectedClientId
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div
                        className={`text-xl ${
                          selectedClientId ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {selectedClientId ? "✅" : "⏳"}
                      </div>
                      <div className="text-xs font-medium">Klien</div>
                    </div>
                    <div
                      className={`p-2 rounded ${
                        selectedDebtId
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div
                        className={`text-xl ${
                          selectedDebtId ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {selectedDebtId ? "✅" : "⏳"}
                      </div>
                      <div className="text-xs font-medium">Hutang</div>
                    </div>
                    <div
                      className={`p-2 rounded ${
                        documentNumber
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div
                        className={`text-xl ${
                          documentNumber ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {documentNumber ? "✅" : "⏳"}
                      </div>
                      <div className="text-xs font-medium">No. Surat</div>
                    </div>
                    <div
                      className={`p-2 rounded ${
                        selectedTemplateId
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      <div
                        className={`text-xl ${
                          selectedTemplateId
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedTemplateId ? "✅" : "⏳"}
                      </div>
                      <div className="text-xs font-medium">Template</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {renderStepper()}

              <Card>
                <CardHeader>
                  <CardTitle>
                    {STEPS.find((s) => s.id === step)?.title}
                  </CardTitle>
                  <CardDescription>
                    Langkah {step} dari {STEPS.length}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}
                  {step === 4 && renderStep4()}

                  {renderNavigation()}
                </CardContent>
              </Card>

              {/* Document History Section */}
              {renderDocumentHistory()}

              {/* Document View Dialog */}
              <Dialog
                open={isDocumentViewDialogOpen}
                onOpenChange={setIsDocumentViewDialogOpen}
              >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="dark:text-gray-200">
                      Detail Dokumen
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                      {selectedDocumentForView?.documentNumber} -{" "}
                      {selectedDocumentForView?.clientName}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Nomor Dokumen:</strong>{" "}
                        {selectedDocumentForView?.documentNumber}
                      </div>
                      <div>
                        <strong>Klien:</strong>{" "}
                        {selectedDocumentForView?.clientName}
                      </div>
                      <div>
                        <strong>Dibuat:</strong>{" "}
                        {selectedDocumentForView?.createdAt
                          ? new Date(
                              selectedDocumentForView.createdAt
                            ).toLocaleString("id-ID")
                          : ""}
                      </div>
                      <div>
                        <strong>Template:</strong>{" "}
                        {templates.find(
                          (t) => t.id === selectedDocumentForView?.templateId
                        )?.name || "Template tidak ditemukan"}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700 max-h-96 overflow-y-auto">
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert dark:text-gray-200"
                        dangerouslySetInnerHTML={{
                          __html: selectedDocumentForView?.content || "",
                        }}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDocumentViewDialogOpen(false)}
                    >
                      Tutup
                    </Button>
                    <Button
                      onClick={() =>
                        handleDownloadExistingPDF(selectedDocumentForView)
                      }
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? "Downloading..." : "Download PDF"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="dark:text-gray-200">
                      Konfirmasi Hapus
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                      Apakah Anda yakin ingin menghapus dokumen ini? Tindakan
                      ini tidak dapat dibatalkan.
                    </DialogDescription>
                  </DialogHeader>

                  {documentToDelete && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium dark:text-gray-200">
                        {documentToDelete.clientName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {documentToDelete.documentNumber}
                      </p>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        setDocumentToDelete(null);
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        documentToDelete &&
                        handleDeleteDocument(documentToDelete.id)
                      }
                    >
                      Hapus
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Document Preview Dialog */}
              <Dialog
                open={showDocumentPreview}
                onOpenChange={setShowDocumentPreview}
              >
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="dark:text-gray-200 flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Preview Dokumen Surat Kuasa Khusus
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                      Preview dokumen dengan format HTML sesuai rich text
                      editor. Anda dapat menyimpan ke database dan download PDF
                      dari sini.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Document Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                      <div>
                        <strong>Nomor Dokumen:</strong> {documentNumber}
                      </div>
                      <div>
                        <strong>Klien:</strong>{" "}
                        {selectedClient?.personalData.namaLengkap}
                      </div>
                      <div>
                        <strong>Jenis Hutang:</strong>{" "}
                        {selectedDebt?.jenisHutang}
                      </div>
                      <div>
                        <strong>Bank/Provider:</strong>{" "}
                        {selectedDebt?.bankProvider}
                      </div>
                    </div>

                    {/* Preview Content */}
                    <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 dark:border-gray-700 max-h-96 overflow-y-auto">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 border-b pb-2">
                        Preview Dokumen (Format HTML):
                      </div>
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert dark:text-gray-200"
                        style={{
                          fontFamily: "Arial, sans-serif",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          color: "#000",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: previewContent || "",
                        }}
                      />
                    </div>

                    {/* Loading States */}
                    {isGenerating && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            Menyimpan dokumen ke database...
                          </p>
                        </div>
                      </div>
                    )}

                    {isDownloading && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                            Membuat PDF...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDocumentPreview(false)}
                      disabled={isGenerating || isDownloading}
                    >
                      Tutup
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadPDFFromPreviewOnly}
                      disabled={
                        isGenerating || isDownloading || !previewContent
                      }
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {isDownloading ? "Downloading..." : "Download PDF Saja"}
                    </Button>
                    <Button
                      onClick={handleSaveAndDownloadPDFFromPreview}
                      disabled={
                        isGenerating || isDownloading || !previewContent
                      }
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      <Download className="h-4 w-4" />
                      {isGenerating || isDownloading
                        ? "Processing..."
                        : "Simpan & Download PDF"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ClientOnly>
  );
}
