"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useUsers } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { UserPlus, Shield, RefreshCw } from "lucide-react";

export function DatabaseInitializer() {
  const { initializeDefaultAdmin } = useUsers();
  const { initializeDefaultRoles } = useRoles();
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitializeData = async () => {
    setIsInitializing(true);

    try {
      // Initialize default roles first
      const rolesResult = await initializeDefaultRoles();

      if (rolesResult.success) {
        toast.success("Default roles berhasil dibuat");
      } else {
        toast.info("Default roles sudah ada atau error: " + rolesResult.error);
      }

      // Initialize default admin user
      const adminResult = await initializeDefaultAdmin();

      if (adminResult.success) {
        toast.success("Default admin user berhasil dibuat");
        toast.info(
          "Login dengan: email: admin@company.com, password: admin123"
        );
      } else {
        toast.info("Default admin sudah ada atau error: " + adminResult.error);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat inisialisasi database");
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-6 w-6" />
            Inisialisasi Database
          </CardTitle>
          <CardDescription>
            Setup initial data untuk sistem authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Yang akan dibuat:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Default roles (Administrator, Manager, Agent, Viewer)</li>
              <li>• Default admin user dengan email: admin@company.com</li>
              <li>• Default password: admin123</li>
            </ul>
          </div>

          <Button
            className="w-full"
            onClick={handleInitializeData}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Inisialisasi Database
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            <p>Setelah inisialisasi, Anda dapat login dengan:</p>
            <p className="font-mono bg-muted p-2 rounded mt-1">
              Email: admin@company.com
              <br />
              Password: admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
