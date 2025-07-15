"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";

interface MenuState {
  activeMainItem: string | null;
  activeSubItem: string | null;
  openCollapsibles: Set<string>;
}

interface MenuContextType {
  menuState: MenuState;
  setActiveMainItem: (title: string) => void;
  setActiveSubItem: (title: string, mainItemTitle: string) => void;
  toggleCollapsible: (title: string) => void;
  isMainItemActive: (title: string) => boolean;
  isSubItemActive: (title: string) => boolean;
  isCollapsibleOpen: (title: string) => boolean;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuState, setMenuState] = useState<MenuState>({
    activeMainItem: null,
    activeSubItem: null,
    openCollapsibles: new Set(),
  });

  // Function to set active main item
  const setActiveMainItem = (title: string) => {
    setMenuState((prev) => ({
      ...prev,
      activeMainItem: title,
      activeSubItem: null, // Reset sub item when main item changes
    }));
  };

  // Function to set active sub item
  const setActiveSubItem = (title: string, mainItemTitle: string) => {
    setMenuState((prev) => ({
      ...prev,
      activeMainItem: mainItemTitle,
      activeSubItem: title,
      openCollapsibles: new Set([...prev.openCollapsibles, mainItemTitle]),
    }));
  };

  // Function to toggle collapsible state
  const toggleCollapsible = (title: string) => {
    setMenuState((prev) => {
      const newOpenCollapsibles = new Set(prev.openCollapsibles);
      if (newOpenCollapsibles.has(title)) {
        newOpenCollapsibles.delete(title);
      } else {
        newOpenCollapsibles.add(title);
      }
      return {
        ...prev,
        openCollapsibles: newOpenCollapsibles,
      };
    });
  };

  // Check if main item is active
  const isMainItemActive = (title: string) => {
    return menuState.activeMainItem === title;
  };

  // Check if sub item is active
  const isSubItemActive = (title: string) => {
    return menuState.activeSubItem === title;
  };

  // Check if collapsible is open
  const isCollapsibleOpen = (title: string) => {
    return menuState.openCollapsibles.has(title);
  };

  // Auto-detect active menu based on current pathname
  useEffect(() => {
    // Define URL to menu item mapping
    const urlToMenuMapping: Record<string, { main: string; sub?: string }> = {
      "/": { main: "Dashboard" },
      "/dashboard": { main: "Dashboard" },
      "/rich-editor-demo": {
        main: "Rich Editor",
        sub: "Rich Editor (WYSIWYG)",
      },
      "/settings/application": {
        main: "Settings",
        sub: "Application Settings",
      },
      "/settings/firebase": {
        main: "Settings",
        sub: "Firebase Settings",
      },
      "/settings/roles": {
        main: "Settings",
        sub: "Roles & Permissions",
      },
      "/settings/user-management": {
        main: "Settings",
        sub: "User Management",
      },
      "/dashboard/telemarketing/settings": {
        main: "Settings",
        sub: "Telemarketing Settings",
      },
      "/dashboard/telemarketing/prospects": {
        main: "Telemarketing",
        sub: "Prospects",
      },
      "/dashboard/telemarketing/scripts": {
        main: "Telemarketing",
        sub: "Scripts",
      },
      "/dashboard/telemarketing/calls": {
        main: "Telemarketing",
        sub: "Phone Calls",
      },
      "/dashboard/telemarketing/log": {
        main: "Telemarketing",
        sub: "Log Calls",
      },
      "/estimations/create": { main: "Estimations", sub: "Create Estimation" },
      "/estimations/history": {
        main: "Estimations",
        sub: "Estimations History",
      },
      "/clients/data": { main: "Clients", sub: "Clients Data" },
      "/payments/create": { main: "Payments", sub: "Create Invoice" },
      "/payments/history": { main: "Payments", sub: "Invoices History" },
      "/payments/receivable": { main: "Payments", sub: "Accounts Receivable" },
      "/reports/telemarketing": {
        main: "Reports",
        sub: "Telemarketing Reports",
      },
      "/reports/estimations": { main: "Reports", sub: "Estimation Reports" },
      "/reports/clients": { main: "Reports", sub: "Client Reports" },
      "/reports/payments": { main: "Reports", sub: "Payment Reports" },
      "/reports/aftersales": { main: "Reports", sub: "After Sales Reports" },
    };

    const currentMapping = urlToMenuMapping[pathname];
    if (currentMapping) {
      if (currentMapping.sub) {
        setActiveSubItem(currentMapping.sub, currentMapping.main);
      } else {
        setActiveMainItem(currentMapping.main);
      }
    }
  }, [pathname]);

  const contextValue: MenuContextType = {
    menuState,
    setActiveMainItem,
    setActiveSubItem,
    toggleCollapsible,
    isMainItemActive,
    isSubItemActive,
    isCollapsibleOpen,
  };

  return React.createElement(
    MenuContext.Provider,
    { value: contextValue },
    children
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}
