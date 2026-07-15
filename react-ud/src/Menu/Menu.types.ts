export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
}

export interface MenuResponse {
  code: number;
  msg: string;
  data: MenuItem[] | null;
}
