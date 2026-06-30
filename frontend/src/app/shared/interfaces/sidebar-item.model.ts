export interface SidebarItem {
  label: string;
  icon: string;
  path?: string;
  subItems?: SidebarSubItem[];
}

interface SidebarSubItem {
  label: string;
  path: string;
}
