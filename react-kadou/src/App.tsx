import React, { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import AppMenu from './Menu/Menu';
import type { MenuKey } from './Menu/Menu';
import HolidaySettingsScreen from './Holiday/HolidaySettingsScreen';
import DepartmentManagementScreen from './Department/DepartmentManagementScreen';
import PersonnelInfoScreen from './Personnel/PersonnelInfoScreen';
import ProjectManagementScreen from './Project/ProjectManagementScreen';
import JinanWorkRateScreen from './Statistics/JinanWorkRateScreen';
import WorkStatus from './WorkStatus/WorkStatus';
import { MOCK_DEPARTMENTS, MOCK_PERSONNEL, MOCK_PROJECTS } from './data/mockData';
import { Department, Personnel, Project } from './WorkStatus/types';
import type { PersonnelImportRow } from './Personnel/personnelImport';
import './App.css';

function App() {
  // 部門マスタ（画面「部門管理」で 新規登録 / 修正 / 削除 する）
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  // 要員一覧（画面「要員情報」で追加・更新される）
  const [personnel, setPersonnel] = useState<Personnel[]>(MOCK_PERSONNEL);
  // プロジェクト一覧（画面「プロジェクト管理」で 新規登録 / 修正 / 削除 する）
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  // 表示中の画面（メニューで切り替える）
  const [activeView, setActiveView] = useState<MenuKey>('work-status');

  /**
   * 要員情報の登録（モック：画面上のみ保持）
   * 同じ社員番号が既にあれば更新、なければ新規追加する。
   * ※追加しても要員稼動管理画面へは切り替えない
   */
  const handleSavePersonnel = useCallback(
    (values: {
      employeeNo: string;
      name: string;
      department: string;
      role: string;
    }) => {
      setPersonnel((prev) => {
        const index = prev.findIndex(
          (p) => p.employeeNo === values.employeeNo,
        );
        // 既存の社員番号 → 役割・名前・所属 を更新する
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...values };
          return next;
        }
        // 新規の社員番号 → 要員一覧へ追加する
        return [...prev, { id: `p-${Date.now()}`, ...values }];
      });
    },
    [],
  );

  /**
   * 社員情報（Excel / CSV）の一括読み込み（モック：画面上のみ保持）
   * 社員番号で突合し、既存は 名前・役割・所属 を上書き、新規は追加する。
   * ※Excel の解析はフロント側（Personnel/personnelImport.ts）で行う。
   *   バックエンド実装時は API（multipart/form-data）に置き換える。
   */
  const handleImportPersonnel = useCallback((rows: PersonnelImportRow[]) => {
    setPersonnel((prev) => {
      const indexByNo = new Map(prev.map((p, i) => [p.employeeNo, i]));
      const next = [...prev];

      rows.forEach((row, i) => {
        const index = indexByNo.get(row.employeeNo);
        if (index !== undefined) {
          // 既存の社員番号 → 社員情報の項目のみ上書きする
          // （案件所属 projectKey / 退場予定 leavePlan は保持する）
          const current = next[index];
          next[index] = {
            ...current,
            name: row.name,
            role: row.role || current.role,
            department: row.department || current.department,
          };
          return;
        }
        // 新規の社員番号 → 要員一覧へ追加する
        indexByNo.set(row.employeeNo, next.length);
        next.push({
          id: `p-imp-${row.employeeNo}-${i}`,
          employeeNo: row.employeeNo,
          name: row.name,
          role: row.role || '要員',
          department: row.department,
        });
      });

      return next;
    });
  }, []);

  /** 社員マスタ（社員番号で 役割・名前・所属(項目) を引く） */
  const employeeMaster = useMemo(
    () => new Map(MOCK_PERSONNEL.map((p) => [p.employeeNo, p])),
    [],
  );

  /**
   * 要員稼動管理画面の「社員番号」入力時
   * 社員マスタから 役割・名前・所属 を取得して自動セットする
   *
   * 戻り値: true = 採用 / false = 処理中止（一覧内で社員番号が重複した場合）
   */
  const handleChangePersonnelEmployeeNo = useCallback(
    (personId: string, employeeNo: string): boolean => {
      const no = employeeNo.trim();

      // 重複チェック：一覧内の他の行で既に使われている社員番号は登録できない
      if (
        no !== '' &&
        personnel.some((p) => p.id !== personId && p.employeeNo === no)
      ) {
        message.error(
          `社員番号「${no}」は一覧に既に登録されているため、処理を中止しました。`,
        );
        return false;
      }

      const master = employeeMaster.get(no);
      if (!master) {
        if (no !== '') {
          message.warning(`社員番号「${no}」は社員マスタに存在しません。`);
        }
        // マスタにない場合は 役割・名前・所属 をクリアする
        setPersonnel((prev) =>
          prev.map((p) =>
            p.id === personId
              ? {
                  ...p,
                  employeeNo: no,
                  name: '',
                  role: '',
                  department: '',
                  projectKey: undefined,
                }
              : p,
          ),
        );
        return true;
      }
      setPersonnel((prev) =>
        prev.map((p) =>
          p.id === personId
            ? {
                ...p,
                employeeNo: no,
                name: master.name,
                role: master.role,
                department: master.department,
                projectKey: master.projectKey,
              }
            : p,
        ),
      );
      return true;
    },
    [employeeMaster, personnel],
  );

  /** 要員稼動管理画面の「退場予定」列で退場予定を変更したとき */
  const handleChangePersonnelLeavePlan = useCallback(
    (personId: string, leavePlan: string) => {
      setPersonnel((prev) =>
        prev.map((p) => (p.id === personId ? { ...p, leavePlan } : p)),
      );
    },
    [],
  );

  /** 要員稼動管理画面の「行追加」（全項目が空の行を追加する） */
  const handleAddPersonnelRow = useCallback(() => {
    setPersonnel((prev) => [
      ...prev,
      {
        id: `p-new-${Date.now()}`,
        employeeNo: '',
        name: '',
        role: '',
        department: '',
      },
    ]);
    message.success('空の行を追加しました（社員番号を入力してください）。');
  }, []);

  /** 要員稼動管理画面の「行削除」 */
  const handleDeletePersonnelRow = useCallback((personId: string) => {
    setPersonnel((prev) => prev.filter((p) => p.id !== personId));
    message.success('行を削除しました（モック）。');
  }, []);

  /** メニューキー → 画面の対応（メニューの並び順とは独立） */
  const views: Record<MenuKey, React.ReactNode> = {
    'work-status': (
      <WorkStatus
        personnel={personnel}
        projects={projects}
        departments={departments}
        onChangePersonnelEmployeeNo={handleChangePersonnelEmployeeNo}
        onChangePersonnelLeavePlan={handleChangePersonnelLeavePlan}
        onAddRow={handleAddPersonnelRow}
        onDeleteRow={handleDeletePersonnelRow}
      />
    ),
    'personnel-info': (
      <PersonnelInfoScreen
        personnel={personnel}
        departments={departments}
        onSubmit={handleSavePersonnel}
        onImport={handleImportPersonnel}
      />
    ),
    'department-manage': (
      <DepartmentManagementScreen
        departments={departments}
        setDepartments={setDepartments}
      />
    ),
    'project-manage': (
      <ProjectManagementScreen
        projects={projects}
        setProjects={setProjects}
        departments={departments}
      />
    ),
    'jinan-work-rate': <JinanWorkRateScreen />,
    'holiday-settings': <HolidaySettingsScreen />,
  };

  return (
    <div className='app-shell'>
      {/* 共通メニュー（選択で画面を切り替える） */}
      <AppMenu activeKey={activeView} onSelect={setActiveView} />

      <div className='app-main'>
        {/* 全画面を常時マウントしておき、表示/非表示のみ切り替える
            （月移動・絞り込み・セル編集・入力中の値などの画面状態を保持するため） */}
        {(Object.keys(views) as MenuKey[]).map((key) => (
          <div
            key={key}
            className={
              activeView === key ? 'app-view' : 'app-view app-view-hidden'
            }
          >
            {views[key]}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
