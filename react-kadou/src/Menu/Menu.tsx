import React from 'react';
import { Button, Menu as AntMenu, Select, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  IdcardOutlined,
  LogoutOutlined,
  ProjectOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { AuthUser } from '../types/user';
import { AVAILABLE_YEARS } from '../data/yearStore';
import './Menu.css';

/** メニュー項目のキー = 表示する画面 */
export type MenuKey =
  | 'year-select'
  | 'work-status'
  | 'personnel-info'
  | 'department-manage'
  | 'project-manage'
  | 'jinan-work-rate'
  | 'holiday-settings'
  | 'user-manage';

interface AppMenuProps {
  /** 現在表示中の画面（選択状態の表示に使用） */
  activeKey: MenuKey;
  /** メニュー項目が選択されたときの処理（画面切り替え） */
  onSelect: (key: MenuKey) => void;
  /** ログイン中のユーザー */
  user: AuthUser;
  /** ログイン中のユーザーの担当部門名（未設定 = 全部門） */
  departmentName?: string;
  /** ログアウト */
  onLogout: () => void;
  /** 選択中の年度 */
  year: number;
  /** 年度を切り替える（未保存チェックは App 側で実施） */
  onYearChange: (year: number) => void;
}

/** メニュー項目の型（key を必ず持つように明示する） */
type AppMenuItem = NonNullable<MenuProps['items']>[number];

/** メニュー項目（年度選択 / 要員稼動管理 / ... / ユーザー管理） */
const MENU_ITEMS: AppMenuItem[] = [
  {
    key: 'year-select',
    icon: <FieldTimeOutlined />,
    label: '年度選択',
  },
  {
    key: 'work-status',
    icon: <AppstoreOutlined />,
    label: '要員稼動管理',
  },
  {
    key: 'personnel-info',
    icon: <IdcardOutlined />,
    label: '要員情報',
  },
  {
    key: 'department-manage',
    icon: <ApartmentOutlined />,
    label: '部門管理',
  },
  {
    key: 'project-manage',
    icon: <ProjectOutlined />,
    label: 'プロジェクト管理',
  },
  {
    key: 'jinan-work-rate',
    icon: <BarChartOutlined />,
    label: '済南稼働率統計',
  },
  {
    key: 'holiday-settings',
    icon: <CalendarOutlined />,
    label: '休日設置',
  },
  {
    key: 'user-manage',
    icon: <TeamOutlined />,
    label: 'ユーザー管理',
  },
];

/** 管理者のみ表示するメニュー項目 */
const ADMIN_ONLY_KEYS: string[] = ['user-manage'];

/** 年度の選択肢 */
const YEAR_OPTIONS = AVAILABLE_YEARS.map((y) => ({
  value: y,
  label: `${y}年度`,
}));

/** ロール → Tag の色 */
const ROLE_COLOR: Record<AuthUser['role'], string> = {
  bucho: 'blue',
  'jigyo-bucho': 'geekblue',
  admin: 'red',
};

/**
 * アプリ共通メニュー（ヘッダー）
 * 選択した項目に応じて、メイン領域の画面を切り替える（ポップアップではない）。
 */
const AppMenu: React.FC<AppMenuProps> = ({
  activeKey,
  onSelect,
  user,
  departmentName,
  onLogout,
  year,
  onYearChange,
}) => {
  // 管理者以外には「ユーザー管理」を出さない
  const items = MENU_ITEMS.filter(
    (item): item is Exclude<AppMenuItem, null> =>
      item !== null &&
      (item.key === undefined ||
        !ADMIN_ONLY_KEYS.includes(String(item.key)) ||
        user.role === 'admin'),
  );

  return (
    <header className='app-menu'>
      <div className='app-menu-brand'>
        <span className='app-menu-mark'>稼</span>
        <span className='app-menu-title'>要員稼動管理</span>
      </div>
      <AntMenu
        className='app-menu-list'
        mode='horizontal'
        items={items}
        selectedKeys={[activeKey]}
        onClick={(info: { key: string }) => onSelect(info.key as MenuKey)}
      />
      <div className='app-menu-right'>
        <Select
          className='app-menu-year'
          size='small'
          value={year}
          options={YEAR_OPTIONS}
          onChange={(v: number) => onYearChange(v)}
          popupMatchSelectWidth={false}
        />
        <div className='app-menu-user'>
          <span className='app-menu-user-name'>{user.name}</span>
          <Tag color={ROLE_COLOR[user.role]}>
            {user.roleLabel}
            {departmentName ? `／${departmentName}` : ''}
          </Tag>
          <Button size='small' icon={<LogoutOutlined />} onClick={onLogout}>
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppMenu;