import React, { useState } from 'react';
import './Menu.css';
import GenerateDoc, {
  GenerateDocumentParams,
} from '../GenerateHomologationDocument​/GenerateDoc';
import GenerateDocument from '../GenerateDocument/GenerateDocument';
import ModifyDocument from '../ModifyDocument/ModifyDocument';
import Help from '../Help/Help';

/**
 * 菜单画面コンポーネント
 *
 * 機能：画面固定左侧不动，点击超链接后，右侧画面刷新并加载对应的功能画面。
 *
 * 対応する内部設計（Menu_詳細設計.md）：
 * - 画面項目定義：11 個の超链接（Link）控件，按模块分组显示在左侧
 * - 機能説明：初期表示 → 左侧固定显示菜单，右侧显示默认画面；点击超链接 → 右侧刷新加载对应画面
 * - 業務ロジック：点击超链接后根据所选菜单项切换右侧内容区域
 */
interface MenuItem {
  /** 菜单项显示文本 */
  label: string;
  /** 点击后右侧加载的画面名称 */
  screen: string;
  /** 所属模块 */
  module: string;
}

interface MenuSection {
  /** 菜单分类标题 */
  title: string;
  items: MenuItem[];
}

/**
 * 菜单数据定义（内部設計 2.1 控件属性表）
 * 按模块分组：Generate / Admin / User Administration / Documentation
 */
const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Generate",
    items: [
      { label: "Generate Doc", screen: "GenerateHomologationDocument", module: "Generate" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Update user defined variables (rules)", screen: "HomologationVariables", module: "Admin" },
      { label: "Existing HDoc variables", screen: "ExistingHDocVariables", module: "Admin" },
      { label: "Upload/Delete template", screen: "HDocTemplateUpload&Delete", module: "Admin" },
      { label: "List available templates", screen: "ListTemplates", module: "Admin" },
      { label: "VPPS Vin plate", screen: "VinPlate", module: "Admin" },
      { label: "AD/CA Change", screen: "ADChange", module: "Admin" },
    ],
  },
  {
    title: "User Administration",
    items: [
      { label: "HDoc User Administration", screen: "HDocUserAdmin", module: "User Administration" },
      { label: "HDoc User Doc Administration", screen: "HDocUserDocAdministration", module: "User Administration" },
      { label: "Search User", screen: "SearchHDocUser", module: "User Administration" },
    ],
  },
  {
    title: "Documentation",
    items: [
      { label: "User Guide", screen: "HDocHelp", module: "Documentation" },
    ],
  },
];

const Menu: React.FC = () => {
  // 当前选中的菜单项（内部設計 3.1 初期表示：默认显示第一个菜单项对应画面）
  const [selected, setSelected] = useState<MenuItem>(MENU_SECTIONS[0].items[0]);
  // 是否在右侧内容区域显示 [Help] 画面（GenerateDoc 点击 Help 后与本画面同一位置显示）
  const [showHelp, setShowHelp] = useState<boolean>(false);
  // 是否在右侧内容区域显示 [GenerateDocument] 画面（GenerateDoc 点击 Submit 后与本画面同一位置显示）
  const [docParams, setDocParams] = useState<GenerateDocumentParams | null>(null);
  // 是否在右侧内容区域显示 [ModifyDocument] 画面（GenerateDocument 点击 [Modify Doc Link] 后在本画面同一位置显示）
  const [showModifyDocument, setShowModifyDocument] = useState<boolean>(false);

  /**
   * 菜单项点击处理（内部設計 3.2 超链接点击）
   * 左侧菜单区域保持固定不动，右侧画面区域刷新并加载对应的功能画面。
   */
  const handleMenuItemClick = (item: MenuItem) => {
    setSelected(item);
    // 切换菜单时退出 Help / GenerateDocument / ModifyDocument 画面
    setShowHelp(false);
    setDocParams(null);
    setShowModifyDocument(false);
  };

  return (
    <div className="menu-layout">
      {/* 左侧：固定菜单区域（内部設計 3.2：左侧固定不动） */}
      <aside className="menu-sidebar">
        <div className="menu-header">
          <img
            src="/volvo-logo.png"
            alt="VOLVO"
            className="volvo-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const textLogo = document.createElement("div");
                textLogo.className = "text-logo";
                textLogo.textContent = "VOLVO";
                parent.appendChild(textLogo);
              }
            }}
          />
        </div>

        <nav className="menu-content">
          {MENU_SECTIONS.map((section, index) => (
            <div key={index} className="menu-section">
              <h3 className="section-title">{section.title}</h3>
              <ul className="menu-list">
                {section.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className={`menu-item${selected.screen === item.screen ? " active" : ""}`}
                    onClick={() => handleMenuItemClick(item)}
                  >
                    <span className="menu-arrow">»</span>
                    <span className="menu-label">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* 右侧：内容区域（内部設計 3.2：点击超链接后刷新并加载对应画面） */}
      <main className="menu-main">
        <div className="content-header">
          <h2 className="content-title">{selected.label}</h2>
        </div>
        {/* Generate Doc 超链接：加载 [GenerateHomologationDocument] 画面（内部設計 3.2） */}
        {selected.screen === "GenerateHomologationDocument" ? (
          // ModifyDocument / GenerateDocument / Help / GenerateDoc 画面均在右侧内容区域同一位置显示
          docParams ? (
            showModifyDocument ? (
              <div className="content-body generate-doc-body">
                <ModifyDocument
                  chassisSeries={docParams.chassisSeries}
                  chassisNo={docParams.chassisNo}
                  onBack={() => setShowModifyDocument(false)}
                />
              </div>
            ) : (
              <div className="content-body generate-doc-body">
                <GenerateDocument
                  chassisSeries={docParams.chassisSeries}
                  chassisNo={docParams.chassisNo}
                  onShowModifyDocument={() => setShowModifyDocument(true)}
                  onBack={() => {
                    setDocParams(null);
                    setShowModifyDocument(false);
                  }}
                />
              </div>
            )
          ) : showHelp ? (
            <div className="content-body generate-doc-body">
              <Help onBack={() => setShowHelp(false)} />
            </div>
          ) : (
            <div className="content-body generate-doc-body">
              <GenerateDoc
                onShowHelp={() => setShowHelp(true)}
                onShowGenerateDocument={(params) => setDocParams(params)}
              />
            </div>
          )
        ) : (
          <div className="content-body">
            {/* 加载选中的功能画面（当前以占位画面显示，后续接入对应模块组件） */}
            <p className="content-placeholder">
              [{selected.screen}] 画面加载区域
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Menu;
