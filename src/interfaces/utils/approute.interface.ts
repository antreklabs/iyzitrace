export interface AppRoute {
  path: string;
  element: React.ReactNode;
  name: string;
  title: string;
  icon?: string;
  showInMenu?: boolean;
  children?: AppRoute[];
}