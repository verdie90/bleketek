import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Authentication System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Setup Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>
                Configure Firebase credentials in .env.local (see .env.example)
              </li>
              <li>Initialize the database with default roles and admin user</li>
              <li>Test the authentication flow</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild>
              <Link href="/setup">Database Setup</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">
              Features Included:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Email/password authentication (no registration page)</li>
              <li>
                • Enhanced roles & permissions with download/import actions
              </li>
              <li>• User management interface</li>
              <li>• Protected routes with role-based access</li>
              <li>• Session persistence with localStorage</li>
              <li>• Activity logging</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
