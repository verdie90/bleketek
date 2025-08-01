"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
  Eye,
  Edit,
  Trash2,
  Download,
  Plus,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Client interface
interface Client {
  id: string;
  personalData?: {
    namaLengkap?: string;
    nik?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    jenisKelamin?: string;
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
  billingData?: {
    terimaBillingTagihan?: string;
    billingMelaluiTagihan?: string;
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
  debtData?: {
    debts?: Array<{
      id: string;
      jenisHutang: string;
      bankProvider: string;
      nomorKartuKontrak: string;
    }>;
  };
  createdAt?: any;
  updatedAt?: any;
  status?: string;
}

export default function ClientListPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch clients from Firestore
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching clients from Firestore...");

        // Check if db is available
        if (!db) {
          console.error("Firebase database not initialized");
          toast.error("Database tidak tersedia");
          setIsLoading(false);
          return;
        }

        const q = query(
          collection(db, "clients"),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const clientsData: Client[] = [];
            console.log(
              "Received snapshot with",
              querySnapshot.size,
              "documents"
            );

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              console.log("Client document:", doc.id, data);

              // Ensure we have valid data before adding
              if (data && doc.id) {
                clientsData.push({
                  id: doc.id,
                  ...data,
                  // Set default values for required fields
                  status: data.status || "active",
                  createdAt: data.createdAt || new Date(),
                } as Client);
              }
            });

            setClients(clientsData);
            setFilteredClients(clientsData);
            setIsLoading(false);
            console.log("Clients loaded:", clientsData.length);
          },
          (error) => {
            console.error("Firestore snapshot error:", error);
            toast.error("Gagal memuat data klien: " + error.message);
            setIsLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up Firestore listener:", error);
        toast.error("Gagal menghubungkan ke database");
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filter clients based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        (client) =>
          client.personalData?.namaLengkap
            ?.toLowerCase()
            ?.includes(searchTerm.toLowerCase()) ||
          client.personalData?.nik?.includes(searchTerm) ||
          client.contactData?.noTelepon?.includes(searchTerm) ||
          (client.contactData?.email &&
            client.contactData.email
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, clients]);

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  const handleDeleteClient = async (clientId: string) => {
    if (!clientId) {
      toast.error("ID klien tidak valid");
      return;
    }

    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus data klien ini? Tindakan ini tidak dapat dibatalkan."
    );
    if (!confirmDelete) return;

    try {
      console.log("Attempting to delete client with ID:", clientId);

      // Check if db is available
      if (!db) {
        throw new Error("Database tidak tersedia");
      }

      // Show loading state
      const deleteToast = toast.loading("Menghapus data klien...");

      await deleteDoc(doc(db, "clients", clientId));

      console.log("Client deleted successfully");
      toast.dismiss(deleteToast);
      toast.success("Data klien berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting client:", error);

      // Handle specific Firestore errors
      if (error.code === "permission-denied") {
        toast.error("Anda tidak memiliki izin untuk menghapus data ini");
      } else if (error.code === "not-found") {
        toast.error("Data klien tidak ditemukan");
      } else if (error.code === "unavailable") {
        toast.error("Database tidak tersedia, silakan coba lagi");
      } else {
        toast.error(
          "Gagal menghapus data klien: " + (error.message || "Unknown error")
        );
      }
    }
  };

  const handleEditClient = (clientId: string) => {
    if (!clientId) {
      toast.error("ID klien tidak valid");
      console.error("Attempted to edit client with invalid ID:", clientId);
      return;
    }

    console.log("Navigating to edit client with ID:", clientId);

    try {
      router.push(`/clients/data?edit=${clientId}`);
    } catch (error) {
      console.error("Error navigating to edit page:", error);
      toast.error("Gagal membuka halaman edit");

      // Fallback to window.location
      window.location.href = `/clients/data?edit=${clientId}`;
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };

  const exportClientToPDF = (client: Client) => {
    if (!client || !client.id) {
      toast.error("Data klien tidak valid");
      return;
    }

    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      const clientName = client.personalData?.namaLengkap || "Tidak Diketahui";
      doc.text(`Detail Klien - ${clientName}`, 20, 20);

      // Date
      doc.setFontSize(10);
      const exportDate = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
      doc.text(`Tanggal Export: ${exportDate}`, 20, 30);

      let yPosition = 50;

      // Personal Data
      doc.setFontSize(14);
      doc.text("Data Pribadi", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const personalData = [
        ["Nama Lengkap", client.personalData?.namaLengkap || "-"],
        ["NIK", client.personalData?.nik || "-"],
        ["Tempat Lahir", client.personalData?.tempatLahir || "-"],
        ["Tanggal Lahir", client.personalData?.tanggalLahir || "-"],
        ["Jenis Kelamin", client.personalData?.jenisKelamin || "-"],
        ["Status Perkawinan", client.personalData?.statusPerkawinan || "-"],
        ["Nama Ibu Kandung", client.personalData?.namaIbuKandung || "-"],
      ];

      personalData.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // Contact Data
      doc.setFontSize(14);
      doc.text("Kontak & Alamat", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const contactData = [
        ["No. Telepon", client.contactData?.noTelepon || "-"],
        ["Email", client.contactData?.email || "-"],
        ["Alamat", client.contactData?.alamat || "-"],
        ["Kelurahan/Desa", client.contactData?.kelurahanDesa || "-"],
        ["Kecamatan", client.contactData?.kecamatan || "-"],
        ["Kota/Kabupaten", client.contactData?.kotaKabupaten || "-"],
        ["Provinsi", client.contactData?.provinsi || "-"],
      ];

      contactData.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // Job Data
      doc.setFontSize(14);
      doc.text("Pekerjaan", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const jobData = [
        ["Jenis Pekerjaan", client.jobData?.jenisPekerjaan || "-"],
        ["Nama Perusahaan", client.jobData?.namaPerusahaan || "-"],
        ["Jabatan", client.jobData?.jabatan || "-"],
        ["Alamat Kantor", client.jobData?.alamatKantor || "-"],
        ["No. Telepon Kantor", client.jobData?.noTelpKantor || "-"],
      ];

      jobData.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 20, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // Debt Data
      doc.setFontSize(14);
      doc.text("Rincian Hutang", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      if (client.debtData?.debts && client.debtData.debts.length > 0) {
        client.debtData.debts.forEach((debt, index) => {
          doc.text(`Hutang ${index + 1}:`, 20, yPosition);
          yPosition += 7;
          doc.text(
            `  Jenis: ${formatDebtType(debt.jenisHutang)}`,
            20,
            yPosition
          );
          yPosition += 7;
          doc.text(
            `  Bank/Provider: ${debt.bankProvider || "-"}`,
            20,
            yPosition
          );
          yPosition += 7;
          doc.text(`  Nomor: ${debt.nomorKartuKontrak || "-"}`, 20, yPosition);
          yPosition += 10;
        });
      } else {
        doc.text("Tidak ada data hutang", 20, yPosition);
      }

      const fileName = `detail-klien-${
        clientName.replace(/\s+/g, "-").toLowerCase() || "unknown"
      }-${new Date().toISOString().split("T")[0]}.pdf`;

      doc.save(fileName);
      toast.success("PDF klien berhasil didownload");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      // Use a consistent format that doesn't depend on locale
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
    } catch (error) {
      return "-";
    }
  };

  const exportToPDF = () => {
    try {
      if (filteredClients.length === 0) {
        toast.error("Tidak ada data klien untuk diekspor");
        return;
      }

      const doc = new jsPDF();

      // Title
      doc.setFontSize(20);
      doc.text("Daftar Klien", 20, 20);

      // Date
      doc.setFontSize(10);
      const exportDate = new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
      doc.text(`Tanggal Export: ${exportDate}`, 20, 30);

      // Total info
      doc.text(`Total Klien: ${filteredClients.length}`, 20, 40);

      // Table data
      const tableData = filteredClients.map((client, index) => [
        index + 1,
        client.personalData?.namaLengkap || "-",
        client.personalData?.nik || "-",
        client.contactData?.noTelepon || "-",
        client.jobData?.namaPerusahaan || "-",
        client.debtData?.debts?.length || 0,
        formatDate(client.createdAt),
      ]);

      // Add table
      (doc as any).autoTable({
        head: [
          [
            "No",
            "Nama Lengkap",
            "NIK",
            "Telepon",
            "Perusahaan",
            "Jml Hutang",
            "Tanggal Dibuat",
          ],
        ],
        body: tableData,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { top: 50 },
      });

      const fileName = `daftar-klien-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);
      toast.success("PDF berhasil didownload");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF. Silakan coba lagi.");
    }
  };

  const getDebtTypeBadgeColor = (jenisHutang: string) => {
    switch (jenisHutang) {
      case "kartu-kredit":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "kta":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "pinjaman-online":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDebtType = (jenisHutang: string) => {
    switch (jenisHutang) {
      case "kartu-kredit":
        return "Kartu Kredit";
      case "kta":
        return "KTA";
      case "pinjaman-online":
        return "Pinjaman Online";
      default:
        return jenisHutang;
    }
  };

  // Prevent hydration issues by not rendering until mounted
  if (!isMounted) {
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
                    <BreadcrumbLink href="/clients">Clients</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Daftar Klien</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="max-w-7xl mx-auto w-full">
              <div className="mb-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-2/3"></div>
              </div>
              <div className="flex gap-2 mb-6 overflow-x-auto">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
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
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full"></div>
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
    <div suppressHydrationWarning>
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
                    <BreadcrumbLink href="/clients">Clients</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Daftar Klien</BreadcrumbPage>
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
                    <h1 className="text-3xl font-bold text-foreground">
                      Daftar Klien
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Kelola dan lihat semua data klien yang tersimpan
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={exportToPDF}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button
                      onClick={() => {
                        try {
                          router.push("/clients/data");
                        } catch (error) {
                          console.error(
                            "Error navigating to add client:",
                            error
                          );
                          // Fallback to window.location
                          window.location.href = "/clients/data";
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Klien
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Pencarian & Filter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Cari berdasarkan nama, NIK, telepon, atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="text-2xl font-bold">{clients.length}</div>
                      <div className="ml-auto text-muted-foreground">
                        Total Klien
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="text-2xl font-bold">
                        {
                          clients.filter(
                            (c) => c.status === "active" || !c.status
                          ).length
                        }
                      </div>
                      <div className="ml-auto text-muted-foreground">
                        Klien Aktif
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="text-2xl font-bold">
                        {clients.reduce(
                          (total, client) =>
                            total + (client.debtData?.debts?.length || 0),
                          0
                        )}
                      </div>
                      <div className="ml-auto text-muted-foreground">
                        Total Hutang
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Client Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Klien</CardTitle>
                  <CardDescription>
                    Daftar semua klien yang terdaftar dalam sistem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="text-muted-foreground">
                        Memuat data klien...
                      </div>
                    </div>
                  ) : currentClients.length === 0 ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm
                          ? "Tidak ada klien yang sesuai dengan pencarian"
                          : "Belum ada data klien"}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No</TableHead>
                            <TableHead>Nama Lengkap</TableHead>
                            <TableHead>NIK</TableHead>
                            <TableHead>Kontak</TableHead>
                            <TableHead>Perusahaan</TableHead>
                            <TableHead>Hutang</TableHead>
                            <TableHead>Tanggal Dibuat</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentClients.map((client, index) => (
                            <TableRow key={client.id}>
                              <TableCell>{startIndex + index + 1}</TableCell>
                              <TableCell className="font-medium">
                                {client.personalData?.namaLengkap || "-"}
                              </TableCell>
                              <TableCell>
                                {client.personalData?.nik || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {client.contactData?.noTelepon || "-"}
                                  </div>
                                  {client.contactData?.email && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      {client.contactData.email}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {client.jobData?.namaPerusahaan || "-"}
                                  </div>
                                  {client.jobData?.jabatan && (
                                    <div className="text-muted-foreground">
                                      {client.jobData.jabatan}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <div className="text-sm font-medium">
                                    {client.debtData?.debts?.length || 0} hutang
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {(client.debtData?.debts || [])
                                      .slice(0, 2)
                                      .map((debt, debtIndex) => (
                                        <Badge
                                          key={debtIndex}
                                          variant="secondary"
                                          className={`text-xs ${getDebtTypeBadgeColor(
                                            debt.jenisHutang
                                          )}`}
                                        >
                                          {formatDebtType(debt.jenisHutang)}
                                        </Badge>
                                      ))}
                                    {(client.debtData?.debts?.length || 0) >
                                      2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        +
                                        {(client.debtData?.debts?.length || 0) -
                                          2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(client.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    client.status === "active" || !client.status
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {client.status === "active" || !client.status
                                    ? "Aktif"
                                    : "Tidak Aktif"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      console.log(
                                        "View details clicked for client:",
                                        client.id
                                      );
                                      handleViewDetails(client);
                                    }}
                                    title="Lihat Detail"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      console.log(
                                        "Edit clicked for client:",
                                        client.id
                                      );
                                      handleEditClient(client.id);
                                    }}
                                    title="Edit Klien"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      console.log(
                                        "PDF export clicked for client:",
                                        client.id
                                      );
                                      exportClientToPDF(client);
                                    }}
                                    title="Download PDF"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      console.log(
                                        "Delete clicked for client:",
                                        client.id
                                      );
                                      handleDeleteClient(client.id);
                                    }}
                                    title="Hapus Klien"
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

              {/* Pagination */}
              {filteredClients.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {startIndex + 1} -{" "}
                    {Math.min(endIndex, filteredClients.length)} dari{" "}
                    {filteredClients.length} klien
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        )
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-muted-foreground">
                                ...
                              </span>
                            )}
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client Detail Modal */}
          <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detail Klien</DialogTitle>
                <DialogDescription>
                  Informasi lengkap klien{" "}
                  {selectedClient?.personalData?.namaLengkap || ""}
                </DialogDescription>
              </DialogHeader>
              {selectedClient && (
                <div className="space-y-6">
                  {/* Personal Data */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Data Pribadi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Nama Lengkap
                          </div>
                          <div className="font-medium">
                            {selectedClient.personalData?.namaLengkap || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            NIK
                          </div>
                          <div className="font-medium">
                            {selectedClient.personalData?.nik || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Tempat Lahir
                          </div>
                          <div className="font-medium">
                            {selectedClient.personalData?.tempatLahir || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Tanggal Lahir
                          </div>
                          <div className="font-medium">
                            {selectedClient.personalData?.tanggalLahir || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Jenis Kelamin
                          </div>
                          <div className="font-medium">
                            {selectedClient.personalData?.jenisKelamin || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Status Perkawinan
                          </div>
                          <div className="font-medium">
                            {selectedClient.personalData?.statusPerkawinan ||
                              "-"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Data */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Kontak & Alamat
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            No. Telepon
                          </div>
                          <div className="font-medium">
                            {selectedClient.contactData?.noTelepon || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Email
                          </div>
                          <div className="font-medium">
                            {selectedClient.contactData?.email || "-"}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground">
                            Alamat
                          </div>
                          <div className="font-medium">
                            {selectedClient.contactData?.alamat || "-"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedClient.contactData?.kelurahanDesa || ""},{" "}
                            {selectedClient.contactData?.kecamatan || ""},{" "}
                            {selectedClient.contactData?.kotaKabupaten || ""},{" "}
                            {selectedClient.contactData?.provinsi || ""}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Job Data */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Pekerjaan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Nama Perusahaan
                          </div>
                          <div className="font-medium">
                            {selectedClient.jobData?.namaPerusahaan || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Jabatan
                          </div>
                          <div className="font-medium">
                            {selectedClient.jobData?.jabatan || "-"}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm text-muted-foreground">
                            Alamat Kantor
                          </div>
                          <div className="font-medium">
                            {selectedClient.jobData?.alamatKantor || "-"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Debt Data */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Rincian Hutang
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(selectedClient.debtData?.debts || []).map(
                          (debt, index) => (
                            <div
                              key={debt.id}
                              className="border rounded-lg p-4 bg-muted/50"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">
                                  Hutang {index + 1}
                                </h4>
                                <Badge
                                  variant="secondary"
                                  className={getDebtTypeBadgeColor(
                                    debt.jenisHutang
                                  )}
                                >
                                  {formatDebtType(debt.jenisHutang)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm text-muted-foreground">
                                    Bank/Provider
                                  </div>
                                  <div className="font-medium">
                                    {debt.bankProvider || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">
                                    Nomor Kartu/Kontrak
                                  </div>
                                  <div className="font-medium">
                                    {debt.nomorKartuKontrak || "-"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                        {(!selectedClient.debtData?.debts ||
                          selectedClient.debtData.debts.length === 0) && (
                          <div className="text-center py-4 text-muted-foreground">
                            Tidak ada data hutang
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
