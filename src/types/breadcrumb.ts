export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  isActive?: boolean;
  isDisabled?: boolean;
  permissions?: string[];
}

export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ComponentType<any>;
  permissions?: string[];
  parent?: string;
  dynamic?: boolean;
  labelGenerator?: (params: Record<string, string>) => string;
}

export interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  removeBreadcrumb: (href: string) => void;
  clearBreadcrumbs: () => void;
}