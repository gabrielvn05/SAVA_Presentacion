export type SidebarNavLink = Readonly<{
  href: string;
  label: string;
}>;

export type SidebarNavGroup = Readonly<{
  type: "group";
  label: string;
  items: SidebarNavLink[];
}>;

export type SidebarNavSingle = Readonly<{
  type: "link";
  href: string;
  label: string;
}>;

export type SidebarNavItem = SidebarNavGroup | SidebarNavSingle;
