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
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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

export default function AccountsReceivablePage() {
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
      inv.status !== "cancelled" &&
      inv.status !== "draft" &&
      (inv.nomorInvoice.toLowerCase().includes(search.toLowerCase()) ||
        inv.namaKlien.toLowerCase().includes(search.toLowerCase()) ||
        inv.status.toLowerCase().includes(search.toLowerCase()))
  );

  const markAsPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, "invoices", id), { status: "paid" });
    } catch {
      // Optionally handle error
    }
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
                  <BreadcrumbPage>Accounts Receivable</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="max-w-5xl mx-auto w-full">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Piutang (Accounts Receivable)</CardTitle>
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
                    Tidak ada piutang ditemukan
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
                              {inv.status !== "paid" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsPaid(inv.id)}
                                >
                                  Tandai Lunas
                                </Button>
                              )}
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
