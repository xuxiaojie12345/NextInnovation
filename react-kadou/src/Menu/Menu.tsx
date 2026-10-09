import React from 'react';
import { Menu as AntMenu } from 'antd';
import type { MenuProps } from 'antd';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  IdcardOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import './Menu.css';

/** メニュー項目のキー = 表示する画面 */
export type MenuKey =
  | 'work-status'
  | 'personnel-info'
  | 'department-manage'
  | 'project-manage'
  | 'jinan-work-rate'
  | 'holiday-settings';

interface AppMenuProps {
  /** 現在表示中の画面（選択状態の表示に使用） */
  activeKey: MenuKey;
  /** メニュー項目が選択されたときの処理（画面切り替え） */
  onSelect: (key: MenuKey) => void;
}

/** メニュー項目（要員稼動管理 / 要員情報 / 部門管理 / プロジェクト管理 / 済南稼働率統計 / 休日設置） */
const MENU_ITEMS: MenuProps['items'] = [
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
];

/**
 * アプリ共通メニュー（ヘッダー）
 * 選択した項目に応じて、メイン領域の画面を切り替える（ポップアップではない）。
 */
const AppMenu: React.FC<AppMenuProps> = ({ activeKey, onSelect }) => (
  <header className='app-menu'>
    <div className='app-menu-brand'>
      <span className='app-menu-mark'>稼</span>
      <span className='app-menu-title'>要員稼動管理</span>
    </div>
    <AntMenu
      className='app-menu-list'
      mode='horizontal'
      items={MENU_ITEMS}
      selectedKeys={[activeKey]}
      onClick={({ key }) => onSelect(key as MenuKey)}
    />
  </header>
);

export default AppMenu;
