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
import { useAppTheme } from "@/hooks/use-app-theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FormPageSkeleton } from "@/components/ui/page-skeletons";
import { usePageLoading } from "@/hooks/use-page-loading";

export default function SuratKuasaKhususPage() {
  const { isDark } = useAppTheme();
  const isLoading = usePageLoading();

  if (isLoading) {
    return <FormPageSkeleton />;
  }

  return (
    <SidebarProvider>
      <AppSidebar>
        <SidebarInset>
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>Surat Kuasa Khusus</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
              <BreadcrumbSeparator />
            </Breadcrumb>
            <ThemeToggle />
          </div>
          <Separator className="my-4" />
        </SidebarInset>
      </AppSidebar>
    </SidebarProvider>
  );
}
