"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMenu } from "@/hooks/use-menu";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const {
    isMainItemActive,
    isSubItemActive,
    isCollapsibleOpen,
    setActiveMainItem,
    setActiveSubItem,
    toggleCollapsible,
  } = useMenu();

  const handleMainItemClick = (item: any) => {
    if (item.items && item.items.length > 0) {
      // If it has sub-items, toggle collapsible
      toggleCollapsible(item.title);
    } else {
      // If no sub-items, set as active
      setActiveMainItem(item.title);
    }
  };

  const handleSubItemClick = (subItem: any, mainItem: any) => {
    setActiveSubItem(subItem.title, mainItem.title);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Handle items without sub-items
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isMainItemActive(item.title)}
                  asChild={!!(item.url && item.url !== "#")}
                >
                  {item.url && item.url !== "#" ? (
                    <Link
                      href={item.url}
                      onClick={() => setActiveMainItem(item.title)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  ) : (
                    <button onClick={() => handleMainItemClick(item)}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </button>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Handle items with sub-items
          return (
            <Collapsible
              key={item.title}
              open={isCollapsibleOpen(item.title)}
              onOpenChange={() => toggleCollapsible(item.title)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isMainItemActive(item.title)}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isSubItemActive(subItem.title)}
                        >
                          <Link
                            href={subItem.url}
                            onClick={() => handleSubItemClick(subItem, item)}
                          >
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
