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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Invoice {
  id: string;
  nomorInvoice: string;
  tanggalInvoice: string;
  namaKlien: string;
  alamatKlien: string;
  deskripsi: string;
  jumlah: number;
  status: "draft" | "sent" | "paid" | "cancelled";
  createdAt: any;
  updatedAt: any;
}

const INITIAL_FORM_DATA: Omit<Invoice, "id" | "createdAt" | "updatedAt"> = {
  nomorInvoice: "",
  tanggalInvoice: "",
  namaKlien: "",
  alamatKlien: "",
  deskripsi: "",
  jumlah: 0,
  status: "draft",
};

export default function CreateInvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: Invoice[] = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Invoice);
      });
      setInvoices(docs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const count = invoices.length + 1;
    return `INV/${String(count).padStart(3, "0")}/${month}/${year}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = {
        ...formData,
        nomorInvoice: formData.nomorInvoice || generateInvoiceNumber(),
        jumlah: Number(formData.jumlah),
        updatedAt: serverTimestamp(),
      };
      if (editingId) {
        await updateDoc(doc(db, "invoices", editingId), data);
        toast.success("Invoice berhasil diperbarui");
      } else {
        await addDoc(collection(db, "invoices"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast.success("Invoice berhasil dibuat");
      }
      setFormData(INITIAL_FORM_DATA);
      setEditingId(null);
    } catch (error) {
      toast.error("Gagal menyimpan invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setFormData(invoice);
    setEditingId(invoice.id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus invoice ini?")) {
      try {
        await deleteDoc(doc(db, "invoices", id));
        toast.success("Invoice dihapus");
      } catch {
        toast.error("Gagal menghapus invoice");
      }
    }
  };

  const generatePDF = (invoice: Invoice) => {
    const docPDF = new jsPDF();
    docPDF.setFontSize(16);
    docPDF.text("INVOICE", 105, 20, { align: "center" });
    docPDF.setFontSize(12);
    docPDF.text(`Nomor: ${invoice.nomorInvoice}`, 20, 35);
    docPDF.text(`Tanggal: ${invoice.tanggalInvoice}`, 20, 43);
    docPDF.text(`Kepada: ${invoice.namaKlien}`, 20, 55);
    docPDF.text(`Alamat: ${invoice.alamatKlien}`, 20, 63);
    docPDF.text(`Deskripsi: ${invoice.deskripsi}`, 20, 75);
    docPDF.text(`Jumlah: Rp ${invoice.jumlah.toLocaleString()}`, 20, 83);
    docPDF.text(`Status: ${invoice.status}`, 20, 91);
    docPDF.save(`invoice-${invoice.nomorInvoice.replace(/\//g, "-")}.pdf`);
    toast.success("PDF berhasil didownload");
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/payments">Payments</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Create Invoice</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-3xl mx-auto w-full">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingId ? "Edit Invoice" : "Buat Invoice"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nomor Invoice</Label>
                      <Input
                        value={formData.nomorInvoice}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            nomorInvoice: e.target.value,
                          }))
                        }
                        placeholder="Otomatis jika kosong"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Invoice *</Label>
                      <Input
                        type="date"
                        value={formData.tanggalInvoice}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            tanggalInvoice: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Klien *</Label>
                    <Input
                      value={formData.namaKlien}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          namaKlien: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat Klien *</Label>
                    <Textarea
                      value={formData.alamatKlien}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          alamatKlien: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi *</Label>
                    <Textarea
                      value={formData.deskripsi}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          deskripsi: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah (Rp) *</Label>
                    <Input
                      type="number"
                      value={formData.jumlah}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, jumlah: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="w-full border rounded px-2 py-1"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          status: e.target.value as Invoice["status"],
                        }))
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Terkirim</option>
                      <option value="paid">Lunas</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData(INITIAL_FORM_DATA);
                        setEditingId(null);
                      }}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Menyimpan..."
                        : editingId
                        ? "Update"
                        : "Simpan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Daftar Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Memuat data...
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada invoice
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1">No</th>
                          <th className="border px-2 py-1">Nomor</th>
                          <th className="border px-2 py-1">Tanggal</th>
                          <th className="border px-2 py-1">Klien</th>
                          <th className="border px-2 py-1">Jumlah</th>
                          <th className="border px-2 py-1">Status</th>
                          <th className="border px-2 py-1">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv, idx) => (
                          <tr key={inv.id}>
                            <td className="border px-2 py-1">{idx + 1}</td>
                            <td className="border px-2 py-1">
                              {inv.nomorInvoice}
                            </td>
                            <td className="border px-2 py-1">
                              {inv.tanggalInvoice}
                            </td>
                            <td className="border px-2 py-1">
                              {inv.namaKlien}
                            </td>
                            <td className="border px-2 py-1">
                              Rp {inv.jumlah.toLocaleString()}
                            </td>
                            <td className="border px-2 py-1">{inv.status}</td>
                            <td className="border px-2 py-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generatePDF(inv)}
                              >
                                PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(inv)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(inv.id)}
                                className="text-red-600"
                              >
                                Hapus
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
