export interface MenuItem {
  label: string;
  route: string;
  screenId: number;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const menuSections: MenuSection[] = [
  {
    title: 'Generate',
    items: [
      { label: 'Generate Doc', route: 'generate-document', screenId: 3 },
      { label: 'Generate in Batch', route: 'generate-in-batch', screenId: 4 },
      { label: 'Regdata Archive', route: 'regdata-archive', screenId: 5 },
      { label: 'Regdata Batch', route: 'regdata-batch', screenId: 6 }
    ]
  },
  {
    title: 'Admin',
    items: [
      { label: 'Update user defined variables (rules)', route: 'update-user-defined-variables-rules', screenId: 8 },
      { label: 'Update user defined variables (UNICODE rules)', route: 'update-user-defined-variables-unicode', screenId: 9 },
      { label: 'Existing HDoc variables', route: 'existing-hdoc-variables', screenId: 10 },
      { label: 'Unlock Document', route: 'unlock-document', screenId: 11 },
      { label: 'HDoc Number Series', route: 'hdoc-number-series', screenId: 12 },
      { label: 'Upload/Delete template', route: 'upload-delete-template', screenId: 13 },
      { label: 'List available templates', route: 'list-available-templates', screenId: 14 },
      { label: 'VPPS Vin plate', route: 'vin-plate', screenId: 15 },
      { label: 'AD/CA Change', route: 'ad-ca-change', screenId: 16 }
    ]
  },
  {
    title: 'User Administration',
    items: [
      { label: 'HDoc User Administration', route: 'hdoc-user-admin', screenId: 17 },
      { label: 'HDoc User Doc Administration', route: 'hdoc-user-doc-admin', screenId: 18 },
      { label: 'Search User', route: 'search-user', screenId: 19 },
      { label: 'Change Password', route: 'change-password', screenId: 20 },
      { label: 'User Position', route: 'user-position', screenId: 21 }
    ]
  },
  {
    title: 'Archive',
    items: [
      { label: 'Search', route: 'archive-search', screenId: 22 },
      { label: 'Upload Document', route: 'upload-document', screenId: 23 }
    ]
  },
  {
    title: 'Documentation',
    items: [
      { label: 'User Guide', route: 'user-guide', screenId: 24 },
      { label: 'AD/CA Change Guide', route: 'ad-ca-change-guide', screenId: 25 },
      { label: 'Vin plate Guide FM/FH', route: 'vin-plate-guide-fm-fh', screenId: 26 },
      { label: 'Archive Guide', route: 'archive-guide', screenId: 27 },
      { label: 'Privacy', route: 'privacy', screenId: 28 }
    ]
  }
];
