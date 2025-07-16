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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Building,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Types
interface CreditCard {
  id?: string;
  bankName: string;
  discount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface KTA {
  id?: string;
  bankName: string;
  discount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OnlineLoan {
  id?: string;
  providerName: string;
  discount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id?: string;
  email: string;
  displayName?: string;
  role: string;
}

export default function EstimationSettingsPage() {
  // State untuk data
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [ktas, setKtas] = useState<KTA[]>([]);
  const [onlineLoans, setOnlineLoans] = useState<OnlineLoan[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk modal
  const [isCreditCardModalOpen, setIsCreditCardModalOpen] = useState(false);
  const [isKTAModalOpen, setIsKTAModalOpen] = useState(false);
  const [isOnlineLoanModalOpen, setIsOnlineLoanModalOpen] = useState(false);

  // State untuk edit
  const [editingCreditCard, setEditingCreditCard] = useState<CreditCard | null>(
    null
  );
  const [editingKTA, setEditingKTA] = useState<KTA | null>(null);
  const [editingOnlineLoan, setEditingOnlineLoan] = useState<OnlineLoan | null>(
    null
  );

  // State untuk form
  const [creditCardForm, setCreditCardForm] = useState({
    bankName: "",
    discount: 0,
    isActive: true,
  });
  const [ktaForm, setKtaForm] = useState({
    bankName: "",
    discount: 0,
    isActive: true,
  });
  const [onlineLoanForm, setOnlineLoanForm] = useState({
    providerName: "",
    discount: 0,
    isActive: true,
  });

  // State untuk data marketing
  const [marketingUsers, setMarketingUsers] = useState<User[]>([]);

  // Load data dari Firebase
  useEffect(() => {
    let unsubCount = 0;
    setLoading(true);
    const unsubList: Array<() => void> = [];

    const unsubscribeCreditCards = onSnapshot(
      query(collection(db, "credit_cards"), orderBy("bankName")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as CreditCard[];
        setCreditCards(data);
        unsubCount++;
        if (unsubCount >= 3) setLoading(false);
      }
    );
    unsubList.push(unsubscribeCreditCards);

    const unsubscribeKTAs = onSnapshot(
      query(collection(db, "kta"), orderBy("bankName")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as KTA[];
        setKtas(data);
        unsubCount++;
        if (unsubCount >= 3) setLoading(false);
      }
    );
    unsubList.push(unsubscribeKTAs);

    const unsubscribeOnlineLoans = onSnapshot(
      query(collection(db, "online_loans"), orderBy("providerName")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as OnlineLoan[];
        setOnlineLoans(data);
        unsubCount++;
        if (unsubCount >= 3) setLoading(false);
      }
    );
    unsubList.push(unsubscribeOnlineLoans);

    const unsubscribeMarketingUsers = onSnapshot(
      query(collection(db, "users")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          displayName: doc.data().displayName || doc.data().email,
        })) as User[];
        setMarketingUsers(data);
      }
    );
    unsubList.push(unsubscribeMarketingUsers);

    return () => {
      unsubList.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
    };
  }, []);

  // Credit Card Functions
  const handleAddCreditCard = async () => {
    try {
      if (!creditCardForm.bankName.trim()) {
        toast.error("Nama bank harus diisi");
        return;
      }

      const docData = {
        bankName: creditCardForm.bankName.trim(),
        discount: creditCardForm.discount,
        isActive: creditCardForm.isActive,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, "credit_cards"), docData);
      toast.success("Kartu kredit berhasil ditambahkan");
      setIsCreditCardModalOpen(false);
      resetCreditCardForm();
    } catch (error) {
      console.error("Error adding credit card:", error);
      toast.error("Gagal menambahkan kartu kredit");
    }
  };

  const handleEditCreditCard = async () => {
    try {
      if (!editingCreditCard?.id) return;

      const docRef = doc(db, "credit_cards", editingCreditCard.id);
      await updateDoc(docRef, {
        bankName: creditCardForm.bankName.trim(),
        discount: creditCardForm.discount,
        isActive: creditCardForm.isActive,
        updatedAt: Timestamp.now(),
      });

      toast.success("Kartu kredit berhasil diperbarui");
      setIsCreditCardModalOpen(false);
      setEditingCreditCard(null);
      resetCreditCardForm();
    } catch (error) {
      console.error("Error updating credit card:", error);
      toast.error("Gagal memperbarui kartu kredit");
    }
  };

  const handleDeleteCreditCard = async (id: string) => {
    try {
      await deleteDoc(doc(db, "credit_cards", id));
      toast.success("Kartu kredit berhasil dihapus");
    } catch (error) {
      console.error("Error deleting credit card:", error);
      toast.error("Gagal menghapus kartu kredit");
    }
  };

  // KTA Functions
  const handleAddKTA = async () => {
    try {
      if (!ktaForm.bankName.trim()) {
        toast.error("Nama bank harus diisi");
        return;
      }

      const docData = {
        bankName: ktaForm.bankName.trim(),
        discount: ktaForm.discount,
        isActive: ktaForm.isActive,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, "kta"), docData);
      toast.success("KTA berhasil ditambahkan");
      setIsKTAModalOpen(false);
      resetKTAForm();
    } catch (error) {
      console.error("Error adding KTA:", error);
      toast.error("Gagal menambahkan KTA");
    }
  };

  const handleEditKTA = async () => {
    try {
      if (!editingKTA?.id) return;

      const docRef = doc(db, "kta", editingKTA.id);
      await updateDoc(docRef, {
        bankName: ktaForm.bankName.trim(),
        discount: ktaForm.discount,
        isActive: ktaForm.isActive,
        updatedAt: Timestamp.now(),
      });

      toast.success("KTA berhasil diperbarui");
      setIsKTAModalOpen(false);
      setEditingKTA(null);
      resetKTAForm();
    } catch (error) {
      console.error("Error updating KTA:", error);
      toast.error("Gagal memperbarui KTA");
    }
  };

  const handleDeleteKTA = async (id: string) => {
    try {
      await deleteDoc(doc(db, "kta", id));
      toast.success("KTA berhasil dihapus");
    } catch (error) {
      console.error("Error deleting KTA:", error);
      toast.error("Gagal menghapus KTA");
    }
  };

  // Online Loan Functions
  const handleAddOnlineLoan = async () => {
    try {
      if (!onlineLoanForm.providerName.trim()) {
        toast.error("Nama provider harus diisi");
        return;
      }

      const docData = {
        providerName: onlineLoanForm.providerName.trim(),
        discount: onlineLoanForm.discount,
        isActive: onlineLoanForm.isActive,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, "online_loans"), docData);
      toast.success("Pinjaman online berhasil ditambahkan");
      setIsOnlineLoanModalOpen(false);
      resetOnlineLoanForm();
    } catch (error) {
      console.error("Error adding online loan:", error);
      toast.error("Gagal menambahkan pinjaman online");
    }
  };

  const handleEditOnlineLoan = async () => {
    try {
      if (!editingOnlineLoan?.id) return;

      const docRef = doc(db, "online_loans", editingOnlineLoan.id);
      await updateDoc(docRef, {
        providerName: onlineLoanForm.providerName.trim(),
        discount: onlineLoanForm.discount,
        isActive: onlineLoanForm.isActive,
        updatedAt: Timestamp.now(),
      });

      toast.success("Pinjaman online berhasil diperbarui");
      setIsOnlineLoanModalOpen(false);
      setEditingOnlineLoan(null);
      resetOnlineLoanForm();
    } catch (error) {
      console.error("Error updating online loan:", error);
      toast.error("Gagal memperbarui pinjaman online");
    }
  };

  const handleDeleteOnlineLoan = async (id: string) => {
    try {
      await deleteDoc(doc(db, "online_loans", id));
      toast.success("Pinjaman online berhasil dihapus");
    } catch (error) {
      console.error("Error deleting online loan:", error);
      toast.error("Gagal menghapus pinjaman online");
    }
  };

  // Form Reset Functions
  const resetCreditCardForm = () => {
    setCreditCardForm({
      bankName: "",
      discount: 0,
      isActive: true,
    });
  };

  const resetKTAForm = () => {
    setKtaForm({
      bankName: "",
      discount: 0,
      isActive: true,
    });
  };

  const resetOnlineLoanForm = () => {
    setOnlineLoanForm({
      providerName: "",
      discount: 0,
      isActive: true,
    });
  };

  // Edit Handlers
  const openEditCreditCard = (creditCard: CreditCard) => {
    setEditingCreditCard(creditCard);
    setCreditCardForm({
      bankName: creditCard.bankName,
      discount: creditCard.discount,
      isActive: creditCard.isActive,
    });
    setIsCreditCardModalOpen(true);
  };

  const openEditKTA = (kta: KTA) => {
    setEditingKTA(kta);
    setKtaForm({
      bankName: kta.bankName,
      discount: kta.discount,
      isActive: kta.isActive,
    });
    setIsKTAModalOpen(true);
  };

  const openEditOnlineLoan = (onlineLoan: OnlineLoan) => {
    setEditingOnlineLoan(onlineLoan);
    setOnlineLoanForm({
      providerName: onlineLoan.providerName,
      discount: onlineLoan.discount,
      isActive: onlineLoan.isActive,
    });
    setIsOnlineLoanModalOpen(true);
  };

  // Fungsi untuk mendapatkan data bank/provider berdasarkan jenis utang
  const getDebtProviders = (debtType: string) => {
    switch (debtType) {
      case "credit-card":
        return creditCards;
      case "kta":
        return ktas;
      case "online-loan":
        return onlineLoans;
      default:
        return [];
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
                    <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Estimation Settings</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Card>
              <CardHeader>
                <CardTitle>Estimation Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">Loading...</div>
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
                  <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Estimation Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Estimation Settings</CardTitle>
              <p className="text-muted-foreground">
                Kelola pengaturan estimasi untuk kartu kredit, KTA, dan pinjaman
                online.
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="credit-cards" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="credit-cards"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Kartu Kredit
                  </TabsTrigger>
                  <TabsTrigger value="kta" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    KTA
                  </TabsTrigger>
                  <TabsTrigger
                    value="online-loans"
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Pinjaman Online
                  </TabsTrigger>
                </TabsList>

                {/* Credit Cards Tab */}
                <TabsContent value="credit-cards" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Kartu Kredit</h3>
                    <Dialog
                      open={isCreditCardModalOpen}
                      onOpenChange={setIsCreditCardModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingCreditCard(null);
                            resetCreditCardForm();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Kartu Kredit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingCreditCard
                              ? "Edit Kartu Kredit"
                              : "Tambah Kartu Kredit"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingCreditCard ? "Perbarui" : "Tambahkan"} data
                            kartu kredit.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="bankName">Nama Bank</Label>
                            <Input
                              id="bankName"
                              value={creditCardForm.bankName}
                              onChange={(e) =>
                                setCreditCardForm({
                                  ...creditCardForm,
                                  bankName: e.target.value,
                                })
                              }
                              placeholder="Masukkan nama bank"
                            />
                          </div>
                          <div>
                            <Label htmlFor="discount">Diskon (%)</Label>
                            <Input
                              id="discount"
                              type="number"
                              min="0"
                              max="100"
                              value={creditCardForm.discount}
                              onChange={(e) =>
                                setCreditCardForm({
                                  ...creditCardForm,
                                  discount: Number(e.target.value),
                                })
                              }
                              placeholder="Masukkan diskon"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsCreditCardModalOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            onClick={
                              editingCreditCard
                                ? handleEditCreditCard
                                : handleAddCreditCard
                            }
                          >
                            {editingCreditCard ? "Perbarui" : "Tambah"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Bank</TableHead>
                        <TableHead>Diskon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditCards.map((creditCard) => (
                        <TableRow key={creditCard.id}>
                          <TableCell className="font-medium">
                            {creditCard.bankName}
                          </TableCell>
                          <TableCell>{creditCard.discount}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                creditCard.isActive ? "default" : "secondary"
                              }
                            >
                              {creditCard.isActive ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditCreditCard(creditCard)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Hapus Kartu Kredit
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus kartu
                                      kredit "{creditCard.bankName}"? Tindakan
                                      ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteCreditCard(creditCard.id!)
                                      }
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {creditCards.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            Belum ada data kartu kredit
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* KTA Tab */}
                <TabsContent value="kta" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      KTA (Kredit Tanpa Agunan)
                    </h3>
                    <Dialog
                      open={isKTAModalOpen}
                      onOpenChange={setIsKTAModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingKTA(null);
                            resetKTAForm();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah KTA
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingKTA ? "Edit KTA" : "Tambah KTA"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingKTA ? "Perbarui" : "Tambahkan"} data KTA.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="ktaBankName">Nama Bank</Label>
                            <Input
                              id="ktaBankName"
                              value={ktaForm.bankName}
                              onChange={(e) =>
                                setKtaForm({
                                  ...ktaForm,
                                  bankName: e.target.value,
                                })
                              }
                              placeholder="Masukkan nama bank"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ktaDiscount">Diskon (%)</Label>
                            <Input
                              id="ktaDiscount"
                              type="number"
                              min="0"
                              max="100"
                              value={ktaForm.discount}
                              onChange={(e) =>
                                setKtaForm({
                                  ...ktaForm,
                                  discount: Number(e.target.value),
                                })
                              }
                              placeholder="Masukkan diskon"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsKTAModalOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            onClick={editingKTA ? handleEditKTA : handleAddKTA}
                          >
                            {editingKTA ? "Perbarui" : "Tambah"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Bank</TableHead>
                        <TableHead>Diskon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ktas.map((kta) => (
                        <TableRow key={kta.id}>
                          <TableCell className="font-medium">
                            {kta.bankName}
                          </TableCell>
                          <TableCell>{kta.discount}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={kta.isActive ? "default" : "secondary"}
                            >
                              {kta.isActive ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditKTA(kta)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Hapus KTA
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus KTA "
                                      {kta.bankName}"? Tindakan ini tidak dapat
                                      dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteKTA(kta.id!)}
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {ktas.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            Belum ada data KTA
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Online Loans Tab */}
                <TabsContent value="online-loans" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Pinjaman Online</h3>
                    <Dialog
                      open={isOnlineLoanModalOpen}
                      onOpenChange={setIsOnlineLoanModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditingOnlineLoan(null);
                            resetOnlineLoanForm();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Pinjaman Online
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingOnlineLoan
                              ? "Edit Pinjaman Online"
                              : "Tambah Pinjaman Online"}
                          </DialogTitle>
                          <DialogDescription>
                            {editingOnlineLoan ? "Perbarui" : "Tambahkan"} data
                            pinjaman online.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="providerName">Nama Provider</Label>
                            <Input
                              id="providerName"
                              value={onlineLoanForm.providerName}
                              onChange={(e) =>
                                setOnlineLoanForm({
                                  ...onlineLoanForm,
                                  providerName: e.target.value,
                                })
                              }
                              placeholder="Masukkan nama provider"
                            />
                          </div>
                          <div>
                            <Label htmlFor="onlineLoanDiscount">
                              Diskon (%)
                            </Label>
                            <Input
                              id="onlineLoanDiscount"
                              type="number"
                              min="0"
                              max="100"
                              value={onlineLoanForm.discount}
                              onChange={(e) =>
                                setOnlineLoanForm({
                                  ...onlineLoanForm,
                                  discount: Number(e.target.value),
                                })
                              }
                              placeholder="Masukkan diskon"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsOnlineLoanModalOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            onClick={
                              editingOnlineLoan
                                ? handleEditOnlineLoan
                                : handleAddOnlineLoan
                            }
                          >
                            {editingOnlineLoan ? "Perbarui" : "Tambah"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Provider</TableHead>
                        <TableHead>Diskon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {onlineLoans.map((onlineLoan) => (
                        <TableRow key={onlineLoan.id}>
                          <TableCell className="font-medium">
                            {onlineLoan.providerName}
                          </TableCell>
                          <TableCell>{onlineLoan.discount}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                onlineLoan.isActive ? "default" : "secondary"
                              }
                            >
                              {onlineLoan.isActive ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditOnlineLoan(onlineLoan)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Hapus Pinjaman Online
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus pinjaman
                                      online "{onlineLoan.providerName}"?
                                      Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteOnlineLoan(onlineLoan.id!)
                                      }
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {onlineLoans.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            Belum ada data pinjaman online
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
