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
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import jsPDF from "jspdf";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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

export default function InvoicesHistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
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

  const filtered = invoices.filter(
    (inv) =>
      inv.nomorInvoice.toLowerCase().includes(search.toLowerCase()) ||
      inv.namaKlien.toLowerCase().includes(search.toLowerCase()) ||
      inv.status.toLowerCase().includes(search.toLowerCase())
  );

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
                  <BreadcrumbPage>Invoices History</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-5xl mx-auto w-full">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Riwayat Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Cari nomor, klien, atau status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-4"
                />
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Memuat data...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Tidak ada invoice ditemukan
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
                        {filtered.map((inv, idx) => (
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
