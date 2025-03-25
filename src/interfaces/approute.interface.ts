export interface AppRoute {
    path: string;
    element: React.ReactNode;
    title?: string;
    icon?: React.ReactNode;
    breadcrumb?: string;
    auth?: boolean;
    visibleInMenu?: boolean;
    children?: AppRoute[];
  }