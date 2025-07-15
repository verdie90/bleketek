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
    {
      title: "User Management",
      url: "/user-management",
      icon: Users,
    },
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
      ],
    },
    // Temporarily disabled - pages not implemented yet
    /*
    {
      title: "Clients",
      url: "#",
      icon: PieChartIcon,
      items: [
        {
          title: "Clients Data",
          url: "#",
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
          url: "#",
        },
        {
          title: "Surat Pernyataan 1",
          url: "#",
        },
        {
          title: "Surat Pernyataan 2",
          url: "#",
        },
        {
          title: "Perjanjian Jasa Hukum",
          url: "#",
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
    */
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
        },
        {
          title: "Telemarketing Settings",
          url: "/settings/telemarketing",
        },
      ],
    },
  ],
};
