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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function EstimationsCreatePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Estimations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Create Estimation</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Create Estimation
                  <Badge variant="secondary">Demo Page</Badge>
                </CardTitle>
                <CardDescription>
                  Halaman demo untuk menguji active state pada menu
                  "Estimations" → "Create Estimation"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Status Menu Saat Ini
                  </h3>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium">
                      ✅ Menu "Estimations" harus aktif
                    </p>
                    <p className="text-green-800">
                      ✅ Submenu "Create Estimation" harus tersorot
                    </p>
                    <p className="text-green-800">
                      ✅ Collapsible "Estimations" harus terbuka otomatis
                    </p>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2 text-blue-800">
                      Test Berbagai Menu:
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-blue-800 mb-2">
                          Menu Tunggal:
                        </p>
                        <ul className="space-y-1">
                          <li>
                            <a
                              href="/dashboard"
                              className="text-blue-600 hover:underline"
                            >
                              Dashboard
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 mb-2">
                          Menu dengan Submenu:
                        </p>
                        <ul className="space-y-1">
                          <li>
                            <a
                              href="/telemarketing/prospects"
                              className="text-blue-600 hover:underline"
                            >
                              Telemarketing → Prospects
                            </a>
                          </li>
                          <li>
                            <a
                              href="/settings/application"
                              className="text-blue-600 hover:underline"
                            >
                              Settings → Application
                            </a>
                          </li>
                          <li>
                            <a
                              href="/settings/roles"
                              className="text-blue-600 hover:underline"
                            >
                              Settings → Roles & Permissions
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
