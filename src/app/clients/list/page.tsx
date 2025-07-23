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
  personalData: {
    namaLengkap: string;
    nik: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: string;
    statusPerkawinan: string;
    namaIbuKandung: string;
  };
  contactData: {
    noTelepon: string;
    email?: string;
    provinsi: string;
    kotaKabupaten: string;
    kecamatan: string;
    kelurahanDesa: string;
    rtRw: string;
    alamat: string;
    domisiliSesuaiKtp: boolean;
    alamatDomisili?: string;
  };
  billingData: {
    terimaBillingTagihan: string;
    billingMelaluiTagihan: string;
  };
  jobData: {
    namaPerusahaan: string;
    jabatan?: string;
    alamatKantor: string;
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
    }>;
  };
  createdAt: any;
  updatedAt: any;
  status: string;
}

export default function ClientListPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch clients from Firestore
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "clients"),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const clientsData: Client[] = [];
          querySnapshot.forEach((doc) => {
            clientsData.push({
              id: doc.id,
              ...doc.data(),
            } as Client);
          });
          setClients(clientsData);
          setFilteredClients(clientsData);
          setIsLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Gagal memuat data klien");
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
  }, [searchTerm, clients]);

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data klien ini?")) {
      try {
        await deleteDoc(doc(db, "clients", clientId));
        toast.success("Data klien berhasil dihapus");
      } catch (error) {
        console.error("Error deleting client:", error);
        toast.error("Gagal menghapus data klien");
      }
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
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

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Daftar Klien", 20, 20);

    // Date
    doc.setFontSize(10);
    doc.text(
      `Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`,
      20,
      30
    );

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
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`daftar-klien-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF berhasil didownload");
  };

  const getDebtTypeBadgeColor = (jenisHutang: string) => {
    switch (jenisHutang) {
      case "kartu-kredit":
        return "bg-red-100 text-red-800";
      case "kta":
        return "bg-blue-100 text-blue-800";
      case "pinjaman-online":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
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
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Daftar Klien
                  </h1>
                  <p className="text-gray-600 mt-2">
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
                    onClick={() => (window.location.href = "/clients/data")}
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
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                      {filteredClients.length}
                    </div>
                    <div className="ml-auto text-muted-foreground">
                      Hasil Pencarian
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold">
                      {clients.filter((c) => c.status === "active").length}
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
                    <div className="text-gray-500">Memuat data klien...</div>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-gray-500">
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
                        {filteredClients.map((client, index) => (
                          <TableRow key={client.id}>
                            <TableCell>{index + 1}</TableCell>
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
                                  <div className="flex items-center gap-1 text-gray-500">
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
                                  <div className="text-gray-500">
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
                                  client.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {client.status === "active"
                                  ? "Aktif"
                                  : "Tidak Aktif"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(client)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    (window.location.href = `/clients/data?edit=${client.id}`)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteClient(client.id)}
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

        {/* Client Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Klien</DialogTitle>
              <DialogDescription>
                Informasi lengkap klien{" "}
                {selectedClient?.personalData.namaLengkap}
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
                        <div className="text-sm text-gray-500">
                          Nama Lengkap
                        </div>
                        <div className="font-medium">
                          {selectedClient.personalData?.namaLengkap || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">NIK</div>
                        <div className="font-medium">
                          {selectedClient.personalData?.nik || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Tempat Lahir
                        </div>
                        <div className="font-medium">
                          {selectedClient.personalData?.tempatLahir || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Tanggal Lahir
                        </div>
                        <div className="font-medium">
                          {selectedClient.personalData?.tanggalLahir || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Jenis Kelamin
                        </div>
                        <div className="font-medium">
                          {selectedClient.personalData?.jenisKelamin || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Status Perkawinan
                        </div>
                        <div className="font-medium">
                          {selectedClient.personalData?.statusPerkawinan || "-"}
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
                        <div className="text-sm text-gray-500">No. Telepon</div>
                        <div className="font-medium">
                          {selectedClient.contactData?.noTelepon || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium">
                          {selectedClient.contactData?.email || "-"}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm text-gray-500">Alamat</div>
                        <div className="font-medium">
                          {selectedClient.contactData?.alamat || "-"}
                        </div>
                        <div className="text-sm text-gray-600">
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
                        <div className="text-sm text-gray-500">
                          Nama Perusahaan
                        </div>
                        <div className="font-medium">
                          {selectedClient.jobData?.namaPerusahaan || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Jabatan</div>
                        <div className="font-medium">
                          {selectedClient.jobData?.jabatan || "-"}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm text-gray-500">
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
                            className="border rounded-lg p-4 bg-gray-50"
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
                                <div className="text-sm text-gray-500">
                                  Bank/Provider
                                </div>
                                <div className="font-medium">
                                  {debt.bankProvider || "-"}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">
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
                        <div className="text-center py-4 text-gray-500">
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
  );
}
