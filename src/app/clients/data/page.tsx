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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Interfaces for form data
interface PersonalData {
  namaLengkap: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  statusPerkawinan: string;
  namaIbuKandung: string;
}

interface ContactData {
  noTelepon: string;
  email: string;
  provinsi: string;
  kotaKabupaten: string;
  kecamatan: string;
  kelurahanDesa: string;
  rtRw: string;
  alamat: string;
  domisiliSesuaiKtp: boolean;
  alamatDomisili?: string;
}

interface BillingData {
  terimaBillingTagihan: string;
  billingMelaluiTagihan: string;
}

interface JobData {
  jenisPekerjaan: string;
  namaPerusahaan: string;
  jabatan: string;
  alamatKantor: string;
  noTelpKantor: string;
  namaKontakDarurat: string;
  hubunganKontakDarurat: string;
}

interface DebtEntry {
  id: string;
  jenisHutang: "kartu-kredit" | "kta" | "pinjaman-online" | "";
  bankProvider: string;
  nomorKartuKontrak: string;
  outstanding: string;
}

interface DebtData {
  debts: DebtEntry[];
}

interface ClientFormData {
  personalData: PersonalData;
  contactData: ContactData;
  billingData: BillingData;
  jobData: JobData;
  debtData: DebtData;
}

const INITIAL_FORM_DATA: ClientFormData = {
  personalData: {
    namaLengkap: "",
    nik: "",
    tempatLahir: "",
    tanggalLahir: "",
    jenisKelamin: "",
    statusPerkawinan: "",
    namaIbuKandung: "",
  },
  contactData: {
    noTelepon: "",
    email: "",
    provinsi: "",
    kotaKabupaten: "",
    kecamatan: "",
    kelurahanDesa: "",
    rtRw: "",
    alamat: "",
    domisiliSesuaiKtp: true,
  },
  billingData: {
    terimaBillingTagihan: "",
    billingMelaluiTagihan: "",
  },
  jobData: {
    jenisPekerjaan: "",
    namaPerusahaan: "",
    jabatan: "",
    alamatKantor: "",
    noTelpKantor: "",
    namaKontakDarurat: "",
    hubunganKontakDarurat: "",
  },
  debtData: {
    debts: [
      {
        id: "1",
        jenisHutang: "",
        bankProvider: "",
        nomorKartuKontrak: "",
        outstanding: "",
      },
    ],
  },
};

const STEPS = [
  { id: 1, title: "Data Pribadi", icon: User },
  { id: 2, title: "Kontak & Alamat", icon: MapPin },
  { id: 3, title: "Billing Tagihan", icon: CreditCard },
  { id: 4, title: "Pekerjaan & Kontak Darurat", icon: Briefcase },
  { id: 5, title: "Rincian Hutang", icon: FileText },
];

export default function ClientDataPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ClientFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debtTypesData, setDebtTypesData] = useState<{
    creditCards: Array<{ id: string; name: string; bankName?: string }>;
    kta: Array<{ id: string; name: string; bankName?: string }>;
    onlineLoans: Array<{ id: string; name: string; providerName?: string }>;
  }>({
    creditCards: [],
    kta: [],
    onlineLoans: [],
  });
  const [debtTypesLoading, setDebtTypesLoading] = useState(true);

  const progress = (currentStep / STEPS.length) * 100;

  // Fetch different provider types from Firestore
  useEffect(() => {
    const fetchDebtTypes = async () => {
      setDebtTypesLoading(true);
      try {
        // Fetch data from all three collections
        const [ccSnap, ktaSnap, olSnap] = await Promise.all([
          getDocs(collection(db, "credit_cards")),
          getDocs(collection(db, "kta")),
          getDocs(collection(db, "online_loans")),
        ]);

        // Process credit cards
        let creditCards = ccSnap.docs
          .filter((doc) => doc.data().isActive !== false)
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.bankName || data.name || `Bank ${doc.id}`,
              bankName: data.bankName,
            };
          });

        // If no credit cards found, create default ones
        if (creditCards.length === 0) {
          const defaultCreditCards = [
            "BCA",
            "Mandiri",
            "BRI",
            "BNI",
            "CIMB Niaga",
            "Danamon",
            "Permata",
          ];
          creditCards = defaultCreditCards.map((name, index) => ({
            id: `cc-${index}`,
            name,
            bankName: name,
          }));
        }

        // Process KTA
        let kta = ktaSnap.docs
          .filter((doc) => doc.data().isActive !== false)
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.bankName || data.name || `Bank ${doc.id}`,
              bankName: data.bankName,
            };
          });

        // If no KTA found, create default ones
        if (kta.length === 0) {
          const defaultKta = [
            "BCA",
            "Mandiri",
            "BRI",
            "BNI",
            "CIMB Niaga",
            "Kredivo",
          ];
          kta = defaultKta.map((name, index) => ({
            id: `kta-${index}`,
            name,
            bankName: name,
          }));
        }

        // Process online loans
        let onlineLoans = olSnap.docs
          .filter((doc) => doc.data().isActive !== false)
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.providerName || data.name || `Provider ${doc.id}`,
              providerName: data.providerName,
            };
          });

        // If no online loans found, create default ones
        if (onlineLoans.length === 0) {
          const defaultOnlineLoans = [
            "Kredivo",
            "Akulaku",
            "Shopee PayLater",
            "OVO PayLater",
            "GoPay PayLater",
          ];
          onlineLoans = defaultOnlineLoans.map((name, index) => ({
            id: `ol-${index}`,
            name,
            providerName: name,
          }));
        }

        setDebtTypesData({
          creditCards,
          kta,
          onlineLoans,
        });

        setDebtTypesLoading(false);
      } catch (error) {
        console.error("Error fetching debt types:", error);
        toast.error("Gagal memuat data jenis hutang dari database");
        setDebtTypesLoading(false);

        // Set empty arrays for error state
        setDebtTypesData({
          creditCards: [],
          kta: [],
          onlineLoans: [],
        });
      }
    };

    fetchDebtTypes();
  }, []);

  // Validation functions
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        const personalValid = !!(
          formData.personalData.namaLengkap &&
          formData.personalData.nik &&
          formData.personalData.nik.length === 16 &&
          formData.personalData.tempatLahir &&
          formData.personalData.tanggalLahir &&
          formData.personalData.jenisKelamin &&
          formData.personalData.statusPerkawinan &&
          formData.personalData.namaIbuKandung
        );
        if (!personalValid && step === currentStep) {
          if (
            formData.personalData.nik &&
            formData.personalData.nik.length !== 16
          ) {
            toast.error("NIK harus 16 digit");
          }
        }
        return personalValid;
      case 2:
        const contactValid = !!(
          formData.contactData.noTelepon &&
          formData.contactData.noTelepon.length >= 10 &&
          formData.contactData.provinsi &&
          formData.contactData.kotaKabupaten &&
          formData.contactData.kecamatan &&
          formData.contactData.kelurahanDesa &&
          formData.contactData.rtRw &&
          formData.contactData.alamat
        );
        if (!contactValid && step === currentStep) {
          if (
            formData.contactData.noTelepon &&
            formData.contactData.noTelepon.length < 10
          ) {
            toast.error("Nomor telepon minimal 10 digit");
          }
        }
        return contactValid;
      case 3:
        return !!(
          formData.billingData.terimaBillingTagihan &&
          formData.billingData.billingMelaluiTagihan
        );
      case 4:
        return !!formData.jobData.jenisPekerjaan;
      case 5:
        return formData.debtData.debts.every(
          (debt) =>
            debt.jenisHutang &&
            debt.bankProvider &&
            debt.nomorKartuKontrak &&
            debt.outstanding
        );
      default:
        return true;
    }
  };

  const updateFormData = (section: keyof ClientFormData, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generatePDF = async () => {
    if (!formData.personalData.namaLengkap) {
      toast.error("Nama lengkap harus diisi untuk generate PDF");
      return;
    }

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text("Data Klien", 20, 20);
      doc.setFontSize(12);

      let yPosition = 40;

      // Personal Data Section
      doc.setFontSize(14);
      doc.text("Data Pribadi", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(
        `Nama Lengkap: ${formData.personalData.namaLengkap}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(`NIK: ${formData.personalData.nik}`, 20, yPosition);
      yPosition += 7;
      doc.text(
        `Tempat Lahir: ${formData.personalData.tempatLahir}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Tanggal Lahir: ${formData.personalData.tanggalLahir}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Jenis Kelamin: ${formData.personalData.jenisKelamin}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Status Perkawinan: ${formData.personalData.statusPerkawinan}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Nama Ibu Kandung: ${formData.personalData.namaIbuKandung}`,
        20,
        yPosition
      );
      yPosition += 15;

      // Contact Data Section
      doc.setFontSize(14);
      doc.text("Kontak & Alamat", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`No. Telepon: ${formData.contactData.noTelepon}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Email: ${formData.contactData.email}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Alamat: ${formData.contactData.alamat}`, 20, yPosition);
      yPosition += 7;
      doc.text(
        `${formData.contactData.kelurahanDesa}, ${formData.contactData.kecamatan}`,
        20,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `${formData.contactData.kotaKabupaten}, ${formData.contactData.provinsi}`,
        20,
        yPosition
      );
      yPosition += 15;

      // Job Data Section
      doc.setFontSize(14);
      doc.text("Pekerjaan", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Perusahaan: ${formData.jobData.namaPerusahaan}`, 20, yPosition);
      yPosition += 7;
      if (formData.jobData.jabatan) {
        doc.text(`Jabatan: ${formData.jobData.jabatan}`, 20, yPosition);
        yPosition += 7;
      }
      doc.text(
        `Alamat Kantor: ${formData.jobData.alamatKantor}`,
        20,
        yPosition
      );
      yPosition += 15;

      // Debt Data Section
      doc.setFontSize(14);
      doc.text("Rincian Hutang", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      formData.debtData.debts.forEach((debt, index) => {
        if (debt.jenisHutang) {
          doc.text(
            `${index + 1}. Jenis Hutang: ${debt.jenisHutang}`,
            20,
            yPosition
          );
          yPosition += 7;
          doc.text(`   Bank/Provider: ${debt.bankProvider}`, 20, yPosition);
          yPosition += 7;
          doc.text(
            `   Nomor Kartu/Kontrak: ${debt.nomorKartuKontrak}`,
            20,
            yPosition
          );
          yPosition += 7;
          doc.text(`   Sisa Hutang: Rp ${debt.outstanding}`, 20, yPosition);
          yPosition += 10;
        }
      });

      // Save PDF
      doc.save(`data-klien-${formData.personalData.namaLengkap}.pdf`);
      toast.success("PDF berhasil didownload");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Gagal membuat PDF");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const clientData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      };

      await addDoc(collection(db, "clients"), clientData);
      toast.success("Data klien berhasil disimpan");

      // Reset form
      setFormData(INITIAL_FORM_DATA);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error saving client data:", error);
      toast.error("Gagal menyimpan data klien");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonalDataStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="namaLengkap">Nama Lengkap (sesuai KTP) *</Label>
          <Input
            id="namaLengkap"
            value={formData.personalData.namaLengkap || ""}
            onChange={(e) =>
              updateFormData("personalData", { namaLengkap: e.target.value })
            }
            placeholder="Masukkan nama lengkap"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nik">NIK *</Label>
          <Input
            id="nik"
            value={formData.personalData.nik || ""}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d]/g, ""); // Only numbers
              if (value.length <= 16) {
                updateFormData("personalData", { nik: value });
              }
            }}
            placeholder="Masukkan NIK (16 digit)"
            maxLength={16}
            required
          />
          {formData.personalData.nik &&
            formData.personalData.nik.length !== 16 && (
              <p className="text-xs text-red-500">NIK harus 16 digit</p>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tempatLahir">Tempat Lahir *</Label>
          <Input
            id="tempatLahir"
            value={formData.personalData.tempatLahir || ""}
            onChange={(e) =>
              updateFormData("personalData", { tempatLahir: e.target.value })
            }
            placeholder="Masukkan tempat lahir"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tanggalLahir">Tanggal Lahir *</Label>
          <Input
            id="tanggalLahir"
            type="date"
            value={formData.personalData.tanggalLahir || ""}
            onChange={(e) =>
              updateFormData("personalData", { tanggalLahir: e.target.value })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jenisKelamin">Jenis Kelamin *</Label>
          <Select
            value={formData.personalData.jenisKelamin || ""}
            onValueChange={(value) =>
              updateFormData("personalData", { jenisKelamin: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="laki-laki">Laki-laki</SelectItem>
              <SelectItem value="perempuan">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="statusPerkawinan">Status Perkawinan *</Label>
          <Select
            value={formData.personalData.statusPerkawinan || ""}
            onValueChange={(value) =>
              updateFormData("personalData", { statusPerkawinan: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih status perkawinan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="belum-kawin">Belum Kawin</SelectItem>
              <SelectItem value="kawin">Kawin</SelectItem>
              <SelectItem value="cerai-hidup">Cerai Hidup</SelectItem>
              <SelectItem value="cerai-mati">Cerai Mati</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="namaIbuKandung">Nama Ibu Kandung *</Label>
        <Input
          id="namaIbuKandung"
          value={formData.personalData.namaIbuKandung || ""}
          onChange={(e) =>
            updateFormData("personalData", { namaIbuKandung: e.target.value })
          }
          placeholder="Masukkan nama ibu kandung"
          required
        />
      </div>
    </div>
  );

  const renderContactDataStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="noTelepon">No. Telepon *</Label>
          <Input
            id="noTelepon"
            value={formData.contactData.noTelepon || ""}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d]/g, ""); // Only numbers
              updateFormData("contactData", { noTelepon: value });
            }}
            placeholder="Masukkan nomor telepon (minimal 10 digit)"
            required
          />
          {formData.contactData.noTelepon &&
            formData.contactData.noTelepon.length < 10 && (
              <p className="text-xs text-red-500">
                Nomor telepon minimal 10 digit
              </p>
            )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.contactData.email || ""}
            onChange={(e) =>
              updateFormData("contactData", { email: e.target.value })
            }
            placeholder="Masukkan email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provinsi">Provinsi *</Label>
          <Input
            id="provinsi"
            value={formData.contactData.provinsi || ""}
            onChange={(e) =>
              updateFormData("contactData", { provinsi: e.target.value })
            }
            placeholder="Masukkan provinsi"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kotaKabupaten">Kota/Kabupaten *</Label>
          <Input
            id="kotaKabupaten"
            value={formData.contactData.kotaKabupaten || ""}
            onChange={(e) =>
              updateFormData("contactData", { kotaKabupaten: e.target.value })
            }
            placeholder="Masukkan kota/kabupaten"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kecamatan">Kecamatan *</Label>
          <Input
            id="kecamatan"
            value={formData.contactData.kecamatan || ""}
            onChange={(e) =>
              updateFormData("contactData", { kecamatan: e.target.value })
            }
            placeholder="Masukkan kecamatan"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kelurahanDesa">Kelurahan/Desa *</Label>
          <Input
            id="kelurahanDesa"
            value={formData.contactData.kelurahanDesa || ""}
            onChange={(e) =>
              updateFormData("contactData", { kelurahanDesa: e.target.value })
            }
            placeholder="Masukkan kelurahan/desa"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rtRw">RT/RW *</Label>
        <Input
          id="rtRw"
          value={formData.contactData.rtRw || ""}
          onChange={(e) =>
            updateFormData("contactData", { rtRw: e.target.value })
          }
          placeholder="Contoh: RT 01/RW 02"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alamat">Alamat Lengkap *</Label>
        <Textarea
          id="alamat"
          value={formData.contactData.alamat || ""}
          onChange={(e) =>
            updateFormData("contactData", { alamat: e.target.value })
          }
          placeholder="Masukkan alamat lengkap"
          rows={3}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="domisiliSesuaiKtp"
          checked={formData.contactData.domisiliSesuaiKtp}
          onCheckedChange={(checked) =>
            updateFormData("contactData", { domisiliSesuaiKtp: checked })
          }
        />
        <Label htmlFor="domisiliSesuaiKtp">
          Alamat domisili sesuai dengan KTP
        </Label>
      </div>

      {!formData.contactData.domisiliSesuaiKtp && (
        <div className="space-y-2">
          <Label htmlFor="alamatDomisili">Alamat Domisili</Label>
          <Textarea
            id="alamatDomisili"
            value={formData.contactData.alamatDomisili || ""}
            onChange={(e) =>
              updateFormData("contactData", { alamatDomisili: e.target.value })
            }
            placeholder="Masukkan alamat domisili"
            rows={3}
          />
        </div>
      )}
    </div>
  );

  const renderBillingDataStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="terimaBillingTagihan">Terima Billing Tagihan *</Label>
        <Select
          value={formData.billingData.terimaBillingTagihan || ""}
          onValueChange={(value) =>
            updateFormData("billingData", { terimaBillingTagihan: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih cara terima billing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="pos">Pos/Surat</SelectItem>
            <SelectItem value="tidak-perlu">Tidak Perlu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="billingMelaluiTagihan">Billing Melalui *</Label>
        <Select
          value={formData.billingData.billingMelaluiTagihan || ""}
          onValueChange={(value) =>
            updateFormData("billingData", { billingMelaluiTagihan: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih metode billing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
            <SelectItem value="virtual-account">Virtual Account</SelectItem>
            <SelectItem value="e-wallet">E-Wallet</SelectItem>
            <SelectItem value="cash">Cash/Tunai</SelectItem>
            <SelectItem value="auto-debit">Auto Debit</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderJobDataStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="jenisPekerjaan">Jenis Pekerjaan *</Label>
        <Select
          value={formData.jobData.jenisPekerjaan || ""}
          onValueChange={(value) =>
            updateFormData("jobData", { jenisPekerjaan: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis pekerjaan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="karyawan-swasta">Karyawan Swasta</SelectItem>
            <SelectItem value="pegawai-negeri">
              Pegawai Negeri Sipil (PNS)
            </SelectItem>
            <SelectItem value="tni-polri">TNI/POLRI</SelectItem>
            <SelectItem value="bumn-bumd">BUMN/BUMD</SelectItem>
            <SelectItem value="wiraswasta">Wiraswasta/Pengusaha</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="buruh-harian">Buruh Harian</SelectItem>
            <SelectItem value="petani">Petani</SelectItem>
            <SelectItem value="nelayan">Nelayan</SelectItem>
            <SelectItem value="pedagang">Pedagang</SelectItem>
            <SelectItem value="driver">Driver/Supir</SelectItem>
            <SelectItem value="ibu-rumah-tangga">Ibu Rumah Tangga</SelectItem>
            <SelectItem value="pelajar-mahasiswa">Pelajar/Mahasiswa</SelectItem>
            <SelectItem value="pensiunan">Pensiunan</SelectItem>
            <SelectItem value="tidak-bekerja">Tidak Bekerja</SelectItem>
            <SelectItem value="lainnya">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="namaPerusahaan">Nama Perusahaan (opsional)</Label>
          <Input
            id="namaPerusahaan"
            value={formData.jobData.namaPerusahaan || ""}
            onChange={(e) =>
              updateFormData("jobData", { namaPerusahaan: e.target.value })
            }
            placeholder="Masukkan nama perusahaan"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jabatan">Jabatan (opsional)</Label>
          <Input
            id="jabatan"
            value={formData.jobData.jabatan || ""}
            onChange={(e) =>
              updateFormData("jobData", { jabatan: e.target.value })
            }
            placeholder="Masukkan jabatan"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="alamatKantor">Alamat Kantor (opsional)</Label>
        <Textarea
          id="alamatKantor"
          value={formData.jobData.alamatKantor || ""}
          onChange={(e) =>
            updateFormData("jobData", { alamatKantor: e.target.value })
          }
          placeholder="Masukkan alamat kantor"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="noTelpKantor">No. Telepon Kantor (opsional)</Label>
        <Input
          id="noTelpKantor"
          value={formData.jobData.noTelpKantor || ""}
          onChange={(e) =>
            updateFormData("jobData", { noTelpKantor: e.target.value })
          }
          placeholder="Masukkan nomor telepon kantor"
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-4 dark:text-gray-200">
          Kontak Darurat (opsional)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="namaKontakDarurat">Nama Kontak Darurat</Label>
            <Input
              id="namaKontakDarurat"
              value={formData.jobData.namaKontakDarurat || ""}
              onChange={(e) =>
                updateFormData("jobData", { namaKontakDarurat: e.target.value })
              }
              placeholder="Masukkan nama kontak darurat"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hubunganKontakDarurat">Hubungan</Label>
            <Select
              value={formData.jobData.hubunganKontakDarurat || ""}
              onValueChange={(value) =>
                updateFormData("jobData", { hubunganKontakDarurat: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih hubungan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orangtua">Orang Tua</SelectItem>
                <SelectItem value="saudara">Saudara</SelectItem>
                <SelectItem value="pasangan">Pasangan</SelectItem>
                <SelectItem value="anak">Anak</SelectItem>
                <SelectItem value="teman">Teman</SelectItem>
                <SelectItem value="rekan-kerja">Rekan Kerja</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDebtDataStep = () => {
    const addDebtEntry = () => {
      // Use a deterministic ID based on the current debts array length
      const nextId = (formData.debtData.debts.length + 1).toString();
      const newDebt: DebtEntry = {
        id: nextId,
        jenisHutang: "",
        bankProvider: "",
        nomorKartuKontrak: "",
        outstanding: "",
      };
      setFormData((prev) => ({
        ...prev,
        debtData: {
          debts: [...prev.debtData.debts, newDebt],
        },
      }));
    };

    const removeDebtEntry = (id: string) => {
      setFormData((prev) => ({
        ...prev,
        debtData: {
          debts: prev.debtData.debts.filter((debt) => debt.id !== id),
        },
      }));
    };

    const updateDebtEntry = (
      id: string,
      field: keyof DebtEntry,
      value: string
    ) => {
      setFormData((prev) => ({
        ...prev,
        debtData: {
          debts: prev.debtData.debts.map((debt) => {
            if (debt.id === id) {
              // Jika jenisHutang berubah, reset bankProvider
              if (field === "jenisHutang" && debt.jenisHutang !== value) {
                return {
                  ...debt,
                  jenisHutang: value as DebtEntry["jenisHutang"],
                  bankProvider: "",
                };
              }
              return { ...debt, [field]: value };
            }
            return debt;
          }),
        },
      }));
    };

    const getProvidersForDebtType = (jenisHutang: DebtEntry["jenisHutang"]) => {
      let result: Array<{
        id: string;
        name: string;
        bankName?: string;
        providerName?: string;
      }> = [];
      switch (jenisHutang) {
        case "kartu-kredit":
          result = debtTypesData.creditCards;
          break;
        case "kta":
          result = debtTypesData.kta;
          break;
        case "pinjaman-online":
          result = debtTypesData.onlineLoans;
          break;
        default:
          result = [];
      }
      return result;
    };

    return (
      <div className="space-y-4">
        {formData.debtData.debts.map((debt, index) => {
          const providers = getProvidersForDebtType(debt.jenisHutang);
          return (
            <Card key={debt.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium dark:text-gray-200">
                  Hutang {index + 1}
                </h4>
                {formData.debtData.debts.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDebtEntry(debt.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`jenisHutang-${debt.id}`}>
                    Jenis Hutang *
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Pilih tipe hutang (Kartu Kredit, KTA, atau Pinjaman Online).
                  </span>
                  <Select
                    value={debt.jenisHutang || ""}
                    onValueChange={(value) =>
                      updateDebtEntry(debt.id, "jenisHutang", value)
                    }
                  >
                    <SelectTrigger
                      className={debt.jenisHutang ? "border-green-200" : ""}
                    >
                      <SelectValue placeholder="Pilih jenis hutang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kartu-kredit">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Kartu Kredit
                        </div>
                      </SelectItem>
                      <SelectItem value="kta">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          KTA (Kredit Tanpa Agunan)
                        </div>
                      </SelectItem>
                      <SelectItem value="pinjaman-online">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Pinjaman Online
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {debt.jenisHutang && (
                    <p className="text-xs text-green-600">
                      ✓ Jenis hutang dipilih:{" "}
                      {debt.jenisHutang === "kartu-kredit"
                        ? "Kartu Kredit"
                        : debt.jenisHutang === "kta"
                        ? "KTA"
                        : debt.jenisHutang === "pinjaman-online"
                        ? "Pinjaman Online"
                        : ""}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`bankProvider-${debt.id}`}>
                    Bank/Provider *
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Pilih bank atau provider sesuai jenis hutang.
                  </span>
                  <Select
                    value={debt.bankProvider || ""}
                    onValueChange={(value) =>
                      updateDebtEntry(debt.id, "bankProvider", value)
                    }
                    disabled={!debt.jenisHutang || debtTypesLoading}
                  >
                    <SelectTrigger
                      className={debt.bankProvider ? "border-green-200" : ""}
                    >
                      <SelectValue
                        placeholder={
                          debtTypesLoading
                            ? "Memuat data..."
                            : !debt.jenisHutang
                            ? "Pilih jenis hutang terlebih dahulu"
                            : providers.length === 0
                            ? `Tidak ada data untuk ${
                                debt.jenisHutang === "kartu-kredit"
                                  ? "kartu kredit"
                                  : debt.jenisHutang === "kta"
                                  ? "KTA"
                                  : debt.jenisHutang === "pinjaman-online"
                                  ? "pinjaman online"
                                  : ""
                              }`
                            : "Pilih bank/provider"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {debtTypesLoading ? (
                        <SelectItem value="loading" disabled>
                          Memuat data...
                        </SelectItem>
                      ) : !debt.jenisHutang ? (
                        <SelectItem value="no-type" disabled>
                          Pilih jenis hutang terlebih dahulu
                        </SelectItem>
                      ) : providers.length === 0 ? (
                        <SelectItem value="no-data" disabled>
                          Tidak ada data untuk{" "}
                          {debt.jenisHutang === "kartu-kredit"
                            ? "kartu kredit"
                            : debt.jenisHutang === "kta"
                            ? "KTA"
                            : debt.jenisHutang === "pinjaman-online"
                            ? "pinjaman online"
                            : ""}
                        </SelectItem>
                      ) : (
                        providers.map((provider, providerIndex) => (
                          <SelectItem
                            key={`${debt.id}-${debt.jenisHutang}-${provider.id}-${providerIndex}`}
                            value={provider.name}
                          >
                            {provider.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {debt.bankProvider && (
                    <p className="text-xs text-green-600">
                      ✓ Provider dipilih: {debt.bankProvider}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`nomorKartuKontrak-${debt.id}`}>
                    Nomor Kartu/Kontrak *
                  </Label>
                  <Input
                    id={`nomorKartuKontrak-${debt.id}`}
                    value={debt.nomorKartuKontrak || ""}
                    onChange={(e) => {
                      // Allow numbers, spaces, and dashes for card/contract numbers
                      const value = e.target.value.replace(/[^0-9\s-]/g, "");
                      updateDebtEntry(debt.id, "nomorKartuKontrak", value);
                    }}
                    placeholder={
                      debt.jenisHutang === "kartu-kredit"
                        ? "Masukkan nomor kartu kredit (16 digit)"
                        : debt.jenisHutang === "kta"
                        ? "Masukkan nomor kontrak KTA"
                        : debt.jenisHutang === "pinjaman-online"
                        ? "Masukkan nomor kontrak/akun"
                        : "Masukkan nomor kartu atau kontrak"
                    }
                    maxLength={
                      debt.jenisHutang === "kartu-kredit" ? 19 : undefined
                    }
                    className={debt.nomorKartuKontrak ? "border-green-200" : ""}
                    required
                  />
                  {debt.jenisHutang === "kartu-kredit" &&
                    debt.nomorKartuKontrak &&
                    debt.nomorKartuKontrak.replace(/\s/g, "").length === 16 && (
                      <p className="text-xs text-green-600">
                        ✓ Nomor kartu kredit valid
                      </p>
                    )}
                  {debt.jenisHutang === "kartu-kredit" &&
                    debt.nomorKartuKontrak &&
                    debt.nomorKartuKontrak.replace(/\s/g, "").length !== 16 && (
                      <p className="text-xs text-red-500">
                        Nomor kartu kredit harus 16 digit
                      </p>
                    )}
                  {debt.jenisHutang &&
                    debt.jenisHutang !== "kartu-kredit" &&
                    debt.nomorKartuKontrak && (
                      <p className="text-xs text-green-600">
                        ✓ Nomor kontrak diisi
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`outstanding-${debt.id}`}>
                    Outstanding (Rp) *
                  </Label>
                  <Input
                    id={`outstanding-${debt.id}`}
                    type="text"
                    value={debt.outstanding || ""}
                    onChange={(e) => {
                      // Format to currency
                      const value = e.target.value.replace(/[^\d]/g, "");
                      const formatted = value.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        "."
                      );
                      updateDebtEntry(debt.id, "outstanding", formatted);
                    }}
                    placeholder="Contoh: 5.000.000"
                    className={`${
                      debt.outstanding ? "border-green-200" : ""
                    } text-right`}
                  />
                  {debt.outstanding && (
                    <p className="text-xs text-green-600">
                      ✓ Outstanding: Rp {debt.outstanding}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Masukkan jumlah hutang yang tersisa dalam rupiah
                  </p>
                </div>
              </div>
            </Card>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={addDebtEntry}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Hutang
        </Button>
      </div>
    );
  };

  const getCurrentStepIcon = (stepId: number) => {
    const step = STEPS.find((s) => s.id === stepId);
    if (!step) return null;
    const Icon = step.icon;
    return <Icon className="h-5 w-5" />;
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalDataStep();
      case 2:
        return renderContactDataStep();
      case 3:
        return renderBillingDataStep();
      case 4:
        return renderJobDataStep();
      case 5:
        return renderDebtDataStep();
      default:
        return null;
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
                  <BreadcrumbPage>Data Entry</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-4xl mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Data Klien
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Lengkapi informasi klien dengan mengikuti langkah-langkah
                berikut
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Langkah {currentStep} dari {STEPS.length}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(progress)}% selesai
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps Navigation */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center cursor-pointer ${
                      step.id <= currentStep ? "text-blue-600" : "text-gray-400"
                    }`}
                    onClick={() => setCurrentStep(step.id)}
                  >
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 ${
                        step.id === currentStep
                          ? "border-blue-600 bg-blue-50"
                          : step.id < currentStep
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {getCurrentStepIcon(step.id)}
                    </div>
                    <span className="text-xs text-center max-w-20">
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCurrentStepIcon(currentStep)}
                  {STEPS.find((s) => s.id === currentStep)?.title}
                </CardTitle>
                <CardDescription>
                  Lengkapi informasi pada bagian ini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderCurrentStep()}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>

                  <div className="flex gap-2">
                    {currentStep === STEPS.length && (
                      <Button
                        variant="outline"
                        onClick={generatePDF}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    )}

                    {currentStep === STEPS.length ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                      </Button>
                    ) : (
                      <Button
                        onClick={nextStep}
                        className="flex items-center gap-2"
                      >
                        Selanjutnya
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Summary (Show on last step) */}
            {currentStep === STEPS.length && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Ringkasan Data</CardTitle>
                  <CardDescription>
                    Periksa kembali data yang telah diisi sebelum menyimpan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 dark:text-gray-200">
                        Data Pribadi
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.personalData.namaLengkap} -{" "}
                        {formData.personalData.nik}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 dark:text-gray-200">
                        Kontak
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.contactData.noTelepon} -{" "}
                        {formData.contactData.email}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 dark:text-gray-200">
                        Pekerjaan
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.jobData.namaPerusahaan} -{" "}
                        {formData.jobData.jabatan}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 dark:text-gray-200">
                        Hutang
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.debtData.debts.map((debt, index) => (
                          <p key={debt.id}>
                            {index + 1}. {debt.jenisHutang} -{" "}
                            {debt.bankProvider}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
