import {
  BookOpen,
  Frame,
  GalleryVerticalEnd,
  Map,
  Settings2,
  Code,
  PhoneIncomingIcon,
  Calculator,
  PieChartIcon,
  DollarSign,
  LayoutDashboard,
  Users,
} from "lucide-react";

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    // User Management moved to Settings submenu
    {
      title: "Telemarketing",
      url: "#",
      icon: PhoneIncomingIcon,
      items: [
        {
          title: "Prospects",
          url: "/telemarketing/prospects",
        },
        {
          title: "Scripts",
          url: "/telemarketing/scripts",
        },
        {
          title: "Phone Calls",
          url: "/telemarketing/calls",
        },
        {
          title: "Call Logs",
          url: "/telemarketing/call-logs",
        },
      ],
    },
    {
      title: "Estimations",
      url: "#",
      icon: Calculator,
      items: [
        {
          title: "Create Estimation",
          url: "/estimations/create",
        },
        {
          title: "Estimation History",
          url: "/estimations/history",
        },
      ],
    },
    {
      title: "Clients",
      url: "#",
      icon: PieChartIcon,
      items: [
        {
          title: "Data Entry",
          url: "/clients/data",
        },
        {
          title: "Clients List",
          url: "/clients/list",
        },
      ],
    },
    {
      title: "Documents",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Surat Kuasa Khusus",
          url: "/documents/surat-kuasa-khusus",
        },
        {
          title: "Surat Pernyataan 1",
          url: "/documents/surat-pernyataan-1",
        },
        {
          title: "Surat Pernyataan 2",
          url: "/documents/surat-pernyataan-2",
        },
        {
          title: "Perjanjian Jasa Hukum",
          url: "/documents/surat-perjanjian-jasa-hukum",
        },
      ],
    },
    {
      title: "Payments",
      url: "#",
      icon: DollarSign,
      items: [
        {
          title: "Create Invoice",
          url: "#",
        },
        {
          title: "Invoices History",
          url: "#",
        },
        {
          title: "Accounts Receivable",
          url: "#",
        },
      ],
    },
    {
      title: "After Sales",
      url: "#",
      icon: Frame,
      items: [
        {
          title: "Diversion Data",
          url: "#",
        },
        {
          title: "Collection Calls",
          url: "#",
        },
        {
          title: "Collection Visit",
          url: "#",
        },
        {
          title: "Client Payments (Lunas)",
          url: "#",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: Map,
      items: [
        {
          title: "Telemarketing Reports",
          url: "#",
        },
        {
          title: "Estimation Reports",
          url: "#",
        },
        {
          title: "Client Reports",
          url: "#",
        },
        {
          title: "Payment Reports",
          url: "#",
        },
        {
          title: "After Sales Reports",
          url: "#",
        },
      ],
    },
    {
      title: "Rich Editor",
      url: "#",
      icon: Code,
      items: [
        {
          title: "Rich Editor (WYSIWYG)",
          url: "/rich-editor-demo",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Application Settings",
          url: "/settings/application",
        },
        {
          title: "Firebase Settings",
          url: "/settings/firebase",
        },
        {
          title: "Roles & Permissions",
          url: "/settings/roles",
        },
        {
          title: "User Management",
          url: "/settings/user-management",
          icon: Users,
        },
        {
          title: "Telemarketing Settings",
          url: "/settings/telemarketing",
        },
        {
          title: "Estimation Settings",
          url: "/settings/estimation",
        },
      ],
    },
  ],
};
