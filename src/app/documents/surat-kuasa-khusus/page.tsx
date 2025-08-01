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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
  { id: 5, title: "Review" },
  { id: 6, title: "Generate" },
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
            <h2>SURAT KUASA KHUSUS</h2>
            <p>Nomor: {{nomor_surat}}</p>
            </div>
            
            <p>Yang bertanda tangan di bawah ini:</p>
            <table style="margin-bottom: 20px;">
              <tr><td style="width: 150px;"><strong>Nama</strong></td><td>: {{nama_klien}}</td></tr>
              <tr><td><strong>NIK</strong></td><td>: {{nik_klien}}</td></tr>
              <tr><td><strong>Jenis Kelamin</strong></td><td>: {{jenis_kelamin}}</td></tr>
              <tr><td><strong>Pekerjaan</strong></td><td>: {{pekerjaan}}</td></tr>
              <tr><td><strong>Alamat</strong></td><td>: {{alamat}}</td></tr>
              <tr><td><strong>RT/RW</strong></td><td>: {{rt_rw}}</td></tr>
              <tr><td><strong>Kelurahan</strong></td><td>: {{kelurahan}}</td></tr>
              <tr><td><strong>Kecamatan</strong></td><td>: {{kecamatan}}</td></tr>
              <tr><td><strong>Kota/Kabupaten</strong></td><td>: {{kota_kabupaten}}</td></tr>
              <tr><td><strong>Provinsi</strong></td><td>: {{provinsi}}</td></tr>
            </table>
            
            <p>Dengan ini memberikan kuasa kepada pihak hukum untuk menangani hutang:</p>
            <table style="margin-bottom: 20px;">
              <tr><td style="width: 150px;"><strong>Jenis Hutang</strong></td><td>: {{jenis_hutang}}</td></tr>
              <tr><td><strong>Bank/Provider</strong></td><td>: {{bank_provider}}</td></tr>
              <tr><td><strong>Nomor Kartu/Kontrak</strong></td><td>: {{nomor_kontrak}}</td></tr>
              <tr><td><strong>Outstanding</strong></td><td>: Rp {{outstanding}}</td></tr>
            </table>
            
            <p>Demikian surat kuasa ini dibuat dengan sebenarnya.</p>
            
            <div style="margin-top: 30px;">
              <p>{{kota_kabupaten}}, {{hari}}, {{tanggal_huruf}} {{bulan}} {{tahun_huruf}}</p>
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

  // Update search term when client is selected
  useEffect(() => {
    if (selectedClientId && selectedClient) {
      setClientSearchTerm(
        `${selectedClient.personalData.namaLengkap} (${selectedClient.personalData.nik})`
      );
      setShowClientDropdown(false);
    }
  }, [selectedClientId, selectedClient]);

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

  // Step 1: Pilih Klien
  const renderStep1 = () => (
    <div className="space-y-4">
      <Label htmlFor="client">Pilih Klien</Label>
      {clientsLoading ? (
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/2"></div>
          </div>
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

  // Step 2: Pilih Hutang
  const renderStep2 = () => {
    if (!selectedClient) {
      return (
        <p className="text-red-500 dark:text-red-400">
          Pilih klien terlebih dahulu
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <Label htmlFor="debt">Pilih Hutang</Label>
        <Select value={selectedDebtId} onValueChange={setSelectedDebtId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih hutang" />
          </SelectTrigger>
          <SelectContent>
            {selectedClient.debtData.debts.map((debt) => (
              <SelectItem key={debt.id} value={debt.id}>
                {debt.jenisHutang} - {debt.bankProvider} (Rp {debt.outstanding})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedDebt && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <h4 className="font-medium dark:text-gray-200">Hutang Dipilih:</h4>
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
        )}
      </div>
    );
  };

  // Step 3: Pengaturan Dokumen
  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium dark:text-gray-200">
          Pengaturan Nomor Surat
        </h3>

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
                <p className="font-mono text-lg dark:text-gray-300">
                  {documentNumber}
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    Format: no_surat/DOCS/huruf_kustom/SKK/bulan_romawi/tahun
                  </p>
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
            <Label>Edit Template</Label>
            <div className="border rounded-lg p-4 dark:border-gray-700">
              <RichEditor
                content={editorContent || selectedTemplate.content}
                onChange={setEditorContent}
              />
            </div>
          </div>
        )}

        {/* Template Preview */}
        {selectedTemplate && (
          <div className="space-y-4">
            <h4 className="font-medium dark:text-gray-200">Preview Dokumen</h4>
            <div className="border rounded-lg p-4 bg-white dark:bg-gray-900 dark:border-gray-700">
              <div
                className="dark:text-gray-200"
                dangerouslySetInnerHTML={{
                  __html: processTemplate(
                    editorContent || selectedTemplate.content
                  ),
                }}
              />
            </div>
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

  // Step 5: Review & Konfirmasi (previously step 4)
  const renderStep5 = () => {
    if (!selectedClient || !selectedDebt || !selectedTemplateId) {
      return (
        <p className="text-red-500 dark:text-red-400">
          Lengkapi data terlebih dahulu
        </p>
      );
    }

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium dark:text-gray-200">Review Data</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <h4 className="font-medium mb-3 dark:text-gray-200">Nomor Surat</h4>
            <p className="font-mono text-sm dark:text-gray-300">
              {documentNumber}
            </p>
          </div>

          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <h4 className="font-medium mb-3 dark:text-gray-200">
              Informasi Klien
            </h4>
            <div className="space-y-2 text-sm">
              <p className="dark:text-gray-300">
                <strong>Nama:</strong> {selectedClient.personalData.namaLengkap}
              </p>
              <p className="dark:text-gray-300">
                <strong>NIK:</strong> {selectedClient.personalData.nik}
              </p>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <h4 className="font-medium mb-3 dark:text-gray-200">
              Informasi Hutang
            </h4>
            <div className="space-y-2 text-sm">
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
        </div>

        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h4 className="font-medium mb-3 dark:text-gray-200">
            Template Dipilih
          </h4>
          <p className="text-sm dark:text-gray-300">{selectedTemplate?.name}</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium dark:text-gray-200">
            Preview Final Dokumen
          </h4>
          <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 dark:border-gray-700 max-h-96 overflow-y-auto">
            <div
              className="prose prose-sm max-w-none dark:prose-invert dark:text-gray-200"
              dangerouslySetInnerHTML={{
                __html: processTemplate(
                  editorContent || selectedTemplate?.content || ""
                ),
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Step 6: Generate dan Simpan (previously step 5)
  const renderStep6 = () => {
    // State hooks moved to top level component
    // const [isGenerating, setIsGenerating] = useState(false);
    // const [isDownloading, setIsDownloading] = useState(false);

    const handleGenerate = async () => {
      if (!selectedClient || !selectedDebt) {
        toast.error("Data tidak lengkap");
        return;
      }

      try {
        setIsGenerating(true);

        // Generate fresh document number for final document
        const finalDocumentNumber = await generateDocumentNumber();

        const finalContent = processTemplate(
          editorContent ||
            templates.find((t) => t.id === selectedTemplateId)?.content ||
            ""
        );

        const documentData = {
          documentNumber: finalDocumentNumber,
          clientId: selectedClientId,
          clientName: selectedClient.personalData.namaLengkap,
          debtId: selectedDebtId,
          templateId: selectedTemplateId,
          customLetter: customLetter,
          content: finalContent,
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
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal menyimpan dokumen");
      } finally {
        setIsGenerating(false);
      }
    };

    const handleDownloadPDF = () => {
      if (!selectedClient || !selectedDebt) {
        toast.error("Data tidak lengkap");
        return;
      }

      try {
        setIsDownloading(true);
        const finalContent = processTemplate(
          editorContent ||
            templates.find((t) => t.id === selectedTemplateId)?.content ||
            ""
        );

        const doc = new jsPDF();

        // Convert HTML to text for PDF (simple implementation)
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = finalContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";

        const lines = doc.splitTextToSize(textContent, 180);
        doc.text(lines, 15, 20);

        doc.save(
          `surat-kuasa-khusus-${selectedClient.personalData.namaLengkap}.pdf`
        );
        toast.success("PDF berhasil didownload");
      } catch (error) {
        console.error("Error:", error);
        toast.error("Gagal membuat PDF");
      } finally {
        setIsDownloading(false);
      }
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium dark:text-gray-200">
          Generate Dokumen
        </h3>

        <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h4 className="font-medium mb-2 dark:text-gray-200">Ringkasan:</h4>
          <div className="space-y-1 text-sm">
            <p className="dark:text-gray-300">
              <strong>Nomor Surat:</strong> {documentNumber}
            </p>
            <p className="dark:text-gray-300">
              <strong>Klien:</strong> {selectedClient?.personalData.namaLengkap}
            </p>
            <p className="dark:text-gray-300">
              <strong>Hutang:</strong> {selectedDebt?.jenisHutang} -{" "}
              {selectedDebt?.bankProvider}
            </p>
            <p className="dark:text-gray-300">
              <strong>Template:</strong>{" "}
              {templates.find((t) => t.id === selectedTemplateId)?.name}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleGenerate}
            className="flex items-center gap-2"
            disabled={isGenerating}
          >
            <Save className="h-4 w-4" />
            {isGenerating ? "Menyimpan..." : "Simpan ke Database"}
          </Button>

          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isDownloading}
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>

        {history.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium dark:text-gray-200">Riwayat Dokumen</h4>
            <div className="border rounded dark:border-gray-700">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 font-medium border-b dark:border-gray-700 dark:text-gray-200">
                Dokumen yang Telah Dibuat
              </div>
              <div className="max-h-40 overflow-y-auto">
                {history.map((doc, index) => (
                  <div
                    key={index}
                    className="p-3 border-b last:border-b-0 dark:border-gray-700"
                  >
                    <p className="font-medium dark:text-gray-200">
                      {doc.clientName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {doc.createdAt
                        ? new Date(
                            doc.createdAt.seconds * 1000
                          ).toLocaleDateString("id-ID")
                        : "Baru saja"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Stepper
  const renderStepper = () => (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {STEPS.map((s) => (
        <Button
          key={s.id}
          variant={step === s.id ? "default" : "outline"}
          onClick={() => setStep(s.id)}
          className="flex-shrink-0"
        >
          {s.id}. {s.title}
        </Button>
      ))}
    </div>
  );

  // Navigation buttons
  const renderNavigation = () => (
    <div className="flex justify-between mt-6 pt-4 border-t">
      <Button
        variant="outline"
        onClick={() => setStep(step - 1)}
        disabled={step === 1}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Sebelumnya
      </Button>

      <Button
        onClick={() => setStep(step + 1)}
        disabled={step === STEPS.length}
        className="flex items-center gap-2"
      >
        Selanjutnya
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

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
                  {step === 5 && renderStep5()}
                  {step === 6 && renderStep6()}

                  {renderNavigation()}
                </CardContent>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ClientOnly>
  );
}
