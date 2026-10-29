import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import AppMenu from './Menu/Menu';
import type { MenuKey } from './Menu/Menu';
import Login from './Login/Login';
import HolidaySettingsScreen from './Holiday/HolidaySettingsScreen';
import DepartmentManagementScreen from './Department/DepartmentManagementScreen';
import PersonnelInfoScreen from './Personnel/PersonnelInfoScreen';
import ProjectManagementScreen from './Project/ProjectManagementScreen';
import JinanWorkRateScreen from './Statistics/JinanWorkRateScreen';
import WorkStatus from './WorkStatus/WorkStatus';
import YearSelectScreen from './YearSelect/YearSelectScreen';
import UserManagementScreen from './User/UserManagementScreen';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import { Department, Personnel, Project } from './WorkStatus/types';
import type { PersonnelImportRow } from './Personnel/personnelImport';
import { AuthUser, MOCK_USERS, defaultDepartmentsOf } from './data/mockUsers';
import {
  departmentNameOf,
  resolveDepartmentIdByName,
} from './data/departmentUtils';
import {
  countDepartmentReferences,
  departmentDeleteBlockMessage,
  departmentExists,
  hasMissingDepartment,
  nextDepartmentId,
} from './data/departmentRules';
import {
  AVAILABLE_YEARS,
  Holiday,
  YearStore,
  currentYear,
  getYearSummary,
} from './data/yearStore';
import { WorkStatusPayload, kadouRepository } from './data/kadouRepository';
import './App.css';

/** アプリが保持する年度（選択範囲 + 当年。当年が範囲外でも動くようにする） */
const INITIAL_YEARS: number[] = AVAILABLE_YEARS.includes(currentYear())
  ? AVAILABLE_YEARS
  : [...AVAILABLE_YEARS, currentYear()];

/** 年度切替 / ログアウト の保留アクション（未保存確認ダイアログ用） */
type PendingAction =
  | { type: 'year'; year: number }
  | { type: 'logout' }
  | null;

function App() {
  // ログインユーザー一覧（ユーザー管理画面で編集する。年度に依存しない）
  const [users, setUsers] = useState<AuthUser[]>(MOCK_USERS);
  // ログイン中のユーザーID（null = 未ログイン）
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // 選択中の年度（既定 = 当年）
  const [selectedYear, setSelectedYear] = useState<number>(() => currentYear());
  // 年度ごとのデータ（＝保存済みデータ）
  const [stores, setStores] = useState<Record<number, YearStore>>(() =>
    kadouRepository.snapshot(INITIAL_YEARS),
  );
  // 表示中の画面
  const [activeView, setActiveView] = useState<MenuKey>('work-status');
  // 要員稼動管理に未保存の変更があるか
  const [dirty, setDirty] = useState(false);
  // 未保存確認ダイアログで保留中の操作
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  // 要員稼動管理の「保存」処理（WorkStatus から登録される）
  const saveHandlerRef = useRef<(() => void) | null>(null);
  // 「部門マスタに無い」注意を年度ごとに 1 回だけ出すためのキー
  const warnedDeptRef = useRef('');

  const currentUser = useMemo(
    () => users.find((u) => u.userId === currentUserId) ?? null,
    [users, currentUserId],
  );

  /** 選択中年度のデータ */
  const store = stores[selectedYear];

  /**
   * 年度選択画面に表示する年度ごとの概要。
   * 保存済みストア（＝編集中の内容）から作るため、マスタを編集すると件数も追随する。
   */
  const yearSummaries = useMemo(
    () => AVAILABLE_YEARS.map((y) => getYearSummary(y, stores[y])),
    [stores],
  );

  // ---- ログイン / ログアウト ----------------------------------------

  /** ログイン（年度は当年に戻す） */
  const handleLogin = useCallback((user: AuthUser) => {
    setCurrentUserId(user.userId);
    setSelectedYear(currentYear());
    setActiveView('work-status');
    setDirty(false);
  }, []);

  /** 実際のログアウト処理（年度は保持する） */
  const doLogout = useCallback(() => {
    setCurrentUserId(null);
    setActiveView('work-status');
    setDirty(false);
    setPendingAction(null);
  }, []);

  /** ログアウト（未保存があれば確認ダイアログを出す） */
  const requestLogout = useCallback(() => {
    if (dirty) {
      setPendingAction({ type: 'logout' });
      return;
    }
    doLogout();
  }, [dirty, doLogout]);

  // ---- 年度切替 ------------------------------------------------------

  /** 実際の年度切替（切替後は要員稼動管理へ移動する） */
  const applyYearChange = useCallback((year: number) => {
    setSelectedYear(year);
    setActiveView('work-status');
    setDirty(false);
    setPendingAction(null);
  }, []);

  /** 年度切替（未保存があれば確認ダイアログを出す） */
  const requestYearChange = useCallback(
    (year: number) => {
      if (year === selectedYear) return;
      if (dirty) {
        setPendingAction({ type: 'year', year });
        return;
      }
      applyYearChange(year);
    },
    [selectedYear, dirty, applyYearChange],
  );

  /** 未保存確認の「保存して続行」 */
  const handleSaveAndContinue = useCallback(() => {
    saveHandlerRef.current?.();
    const action = pendingAction;
    if (action?.type === 'year') {
      applyYearChange(action.year);
    } else if (action?.type === 'logout') {
      doLogout();
    } else {
      setPendingAction(null);
    }
  }, [pendingAction, applyYearChange, doLogout]);

  /** 未保存確認の「破棄して続行」 */
  const handleDiscardAndContinue = useCallback(() => {
    const action = pendingAction;
    setDirty(false);
    if (action?.type === 'year') {
      // 年度が変わるので WorkStatus は作り直され、下書きは破棄される
      applyYearChange(action.year);
      return;
    }
    if (action?.type === 'logout') {
      doLogout();
      return;
    }
    setPendingAction(null);
  }, [pendingAction, applyYearChange, doLogout]);

  // ---- 年度データの更新（マスタ系） ---------------------------------

  /** 選択中年度のストアを更新する */
  const updateStore = useCallback(
    (patch: Partial<YearStore>) => {
      setStores((prev) => ({
        ...prev,
        [selectedYear]: { ...prev[selectedYear], ...patch },
      }));
      void kadouRepository.saveMaster(selectedYear, patch);
    },
    [selectedYear],
  );

  /** 部門マスタ：追加（部門IDは年度内で再利用しない） */
  const handleAddDepartment = useCallback(
    (values: Pick<Department, 'name' | 'kind' | 'location'>) => {
      const current = stores[selectedYear];
      if (!current) return;
      const allocation = nextDepartmentId(current.departmentSeq ?? 0);
      updateStore({
        departments: [
          ...current.departments,
          { departmentId: allocation.departmentId, ...values },
        ],
        departmentSeq: allocation.seq,
      });
    },
    [stores, selectedYear, updateStore],
  );

  /** 部門マスタ：名称・拠点・種別の修正（部門IDは変更しない） */
  const handleEditDepartment = useCallback(
    (row: Department) => {
      const current = stores[selectedYear];
      if (!current) return;
      updateStore({
        departments: current.departments.map((d) =>
          d.departmentId === row.departmentId ? { ...d, ...row } : d,
        ),
      });
    },
    [stores, selectedYear, updateStore],
  );

  /**
   * 部門マスタ：削除。
   * 当年度の要員・プロジェクト・稼働表行（異動の旧行を含む）から
   * 参照されている場合は削除しない。
   */
  const handleDeleteDepartment = useCallback(
    (row: Department): { ok: boolean; message?: string } => {
      const current = stores[selectedYear];
      if (!current) {
        return { ok: false, message: '年度データがありません。' };
      }

      const references = countDepartmentReferences(row.departmentId, {
        personnel: current.personnel,
        projects: current.projects,
        workStatusRows: current.workStatus.rows,
      });
      const blockMessage = departmentDeleteBlockMessage(row, references);
      if (blockMessage) {
        return { ok: false, message: blockMessage };
      }

      updateStore({
        departments: current.departments.filter(
          (d) => d.departmentId !== row.departmentId,
        ),
      });
      return { ok: true };
    },
    [stores, selectedYear, updateStore],
  );

  /** プロジェクトマスタ（プロジェクト管理画面） */
  const setYearProjects = useCallback<
    React.Dispatch<React.SetStateAction<Project[]>>
  >(
    (action) => {
      const current = stores[selectedYear]?.projects ?? [];
      const next = typeof action === 'function' ? action(current) : action;
      updateStore({ projects: next });
    },
    [stores, selectedYear, updateStore],
  );

  /** 休日（休日設置画面） */
  const setYearHolidays = useCallback<
    React.Dispatch<React.SetStateAction<Holiday[]>>
  >(
    (action) => {
      const current = stores[selectedYear]?.holidays ?? [];
      const next = typeof action === 'function' ? action(current) : action;
      updateStore({ holidays: next });
    },
    [stores, selectedYear, updateStore],
  );

  /** 要員一覧（要員情報画面・一括読み込み） */
  const setYearPersonnel = useCallback(
    (updater: (prev: Personnel[]) => Personnel[]) => {
      const current = stores[selectedYear]?.personnel ?? [];
      updateStore({ personnel: updater(current) });
    },
    [stores, selectedYear, updateStore],
  );

  /**
   * 要員情報の登録（モック：画面上のみ保持）
   * 同じ社員番号が既にあれば氏名・役割のみ更新し、所属は変更しない。
   * 新規は所属必須で追加する。
   * ※追加しても要員稼動管理画面へは切り替えない
   */
  const handleSavePersonnel = useCallback(
    (values: {
      employeeNo: string;
      name: string;
      role: string;
      departmentId?: string;
    }) => {
      const current = stores[selectedYear]?.personnel ?? [];
      const existing = current.find(
        (p) => p.employeeNo === values.employeeNo,
      );

      // 既存の社員番号 → 氏名・役割のみ更新する（所属は異動でのみ変更する）
      if (existing) {
        if (hasMissingDepartment(existing)) {
          message.error(
            '所属が未設定のため保存できません。一括読み込みで所属を設定してください。',
          );
          return;
        }
        setYearPersonnel((prev) =>
          prev.map((p) =>
            p.employeeNo === values.employeeNo
              ? { ...p, name: values.name, role: values.role }
              : p,
          ),
        );
        return;
      }

      // 新規の社員番号 → 所属は必須
      const departmentId = values.departmentId;
      if (!departmentId) {
        message.error('所属を選択してください。');
        return;
      }
      const departments = stores[selectedYear]?.departments ?? [];
      if (!departmentExists(departments, departmentId)) {
        message.error('選択した所属は部門マスタに存在しません。');
        return;
      }

      setYearPersonnel((prev) => [
        ...prev,
        {
          employeeNo: values.employeeNo,
          name: values.name,
          role: values.role,
          departmentId,
        },
      ]);
    },
    [stores, selectedYear, setYearPersonnel],
  );

  /**
   * 要員マスタの削除。
   * 当年度の稼働表行・割当・BUFFER も削除する（他年度は変更しない）。
   */
  const handleDeletePersonnel = useCallback(
    (employeeNo: string) => {
      setStores((prev) => {
        const current = prev[selectedYear];
        if (!current) return prev;
        const assignment = { ...current.workStatus.assignment };
        delete assignment[employeeNo];
        const unpaid = { ...current.workStatus.unpaid };
        delete unpaid[employeeNo];
        return {
          ...prev,
          [selectedYear]: {
            ...current,
            personnel: current.personnel.filter(
              (p) => p.employeeNo !== employeeNo,
            ),
            workStatus: {
              rows: current.workStatus.rows.filter(
                (r) => r.employeeNo !== employeeNo,
              ),
              assignment,
              unpaid,
            },
          },
        };
      });
      void kadouRepository.deletePersonnel(selectedYear, employeeNo);
    },
    [selectedYear],
  );

  /**
   * 当年度に稼働データ（稼働表行・割当・BUFFER）があるか。
   * 要員マスタ削除の確認メッセージを出すかの判定に使う。
   */
  const hasWorkDataForPersonnel = useCallback(
    (employeeNo: string) => {
      const workStatus = stores[selectedYear]?.workStatus;
      if (!workStatus) return false;
      if (workStatus.rows.some((r) => r.employeeNo === employeeNo)) {
        return true;
      }
      const assignments = workStatus.assignment[employeeNo] ?? {};
      if (Object.keys(assignments).some((w) => assignments[w] != null)) {
        return true;
      }
      const buffer = workStatus.unpaid[employeeNo] ?? {};
      return Object.keys(buffer).some((w) => buffer[w] === true);
    },
    [stores, selectedYear],
  );

  /**
   * 要員マスタの項目（現在は退場予定）の更新。
   * 稼働表の備考欄から呼ばれる。マスタは即時保存する。
   */
  const handleUpdateLeavePlan = useCallback(
    (employeeNo: string, leavePlan: string) => {
      setYearPersonnel((prev) =>
        prev.map((p) =>
          p.employeeNo === employeeNo ? { ...p, leavePlan } : p,
        ),
      );
    },
    [setYearPersonnel],
  );

  /**
   * 社員情報（Excel / CSV）の一括読み込み（モック：画面上のみ保持）
   * 社員番号で突合し、既存は 名前・役割（所属は入力がある場合のみ）を上書き、
   * 新規は所属必須で追加する。
   */
  const handleImportPersonnel = useCallback(
    (rows: PersonnelImportRow[]) => {
      const departments = stores[selectedYear]?.departments ?? [];
      setYearPersonnel((prev) => {
        const indexByNo = new Map(prev.map((p, i) => [p.employeeNo, i]));
        const next = [...prev];

        rows.forEach((row) => {
          // 取込ファイルの「所属」は部門名のため、部門IDへ解決する
          const departmentName = row.department.trim();
          const resolvedDepartmentId =
            departmentName === ''
              ? null
              : resolveDepartmentIdByName(departments, departmentName);
          const index = indexByNo.get(row.employeeNo);
          if (index !== undefined) {
            // 既存の社員番号 → 氏名・役割を上書きし、所属は入力があるときだけ更新する
            // （退場予定 leavePlan は保持する）
            const current = next[index];
            next[index] = {
              ...current,
              name: row.name,
              role: row.role || current.role,
              departmentId:
                departmentName === ''
                  ? current.departmentId
                  : resolvedDepartmentId ?? current.departmentId,
            };
            return;
          }
          // 新規の社員番号 → 所属は必須（解決できない行は画面側で取り込みをブロックする）
          if (!resolvedDepartmentId) return;
          indexByNo.set(row.employeeNo, next.length);
          next.push({
            employeeNo: row.employeeNo,
            name: row.name,
            role: row.role || '要員',
            departmentId: resolvedDepartmentId,
          });
        });

        return next;
      });
    },
    [selectedYear, setYearPersonnel, stores],
  );

  // ---- 要員稼動管理の保存 -------------------------------------------

  /** 要員稼動管理の保存（表示行・割当・BUFFER と、異動による現在所属の更新） */
  const handleSaveWorkStatus = useCallback(
    (payload: WorkStatusPayload) => {
      const departmentByEmployee = new Map(
        (payload.departmentUpdates ?? []).map(
          (update) => [update.employeeNo, update.departmentId] as const,
        ),
      );
      setStores((prev) => {
        const current = prev[selectedYear];
        if (!current) return prev;
        const personnel =
          departmentByEmployee.size === 0
            ? current.personnel
            : current.personnel.map((p) => {
                const departmentId = departmentByEmployee.get(p.employeeNo);
                return departmentId ? { ...p, departmentId } : p;
              });
        return {
          ...prev,
          [selectedYear]: {
            ...current,
            personnel,
            workStatus: {
              rows: payload.rows,
              assignment: payload.assignment,
              unpaid: payload.unpaid,
            },
          },
        };
      });
      void kadouRepository.saveWorkStatus(selectedYear, payload);
      message.success(
        `${selectedYear}年度の内容を保存しました（モック：サーバー未接続）。`,
      );
    },
    [selectedYear],
  );

  /** 要員稼動管理の「保存」処理を WorkStatus から受け取る（未保存確認から呼ぶ） */
  const registerSaveHandler = useCallback((fn: (() => void) | null) => {
    saveHandlerRef.current = fn;
  }, []);

  /** 社員マスタ（社員番号 → 要員） */
  const employeeMaster = useMemo(
    () => new Map(store.personnel.map((p) => [p.employeeNo, p])),
    [store.personnel],
  );

  /** ログイン直後に絞り込む部門（部長＝自部門。その年度に存在しない場合は全部門） */
  const defaultDepartments = useMemo(() => {
    if (!currentUser) return [];
    const wanted = defaultDepartmentsOf(currentUser);
    if (wanted.length === 0) return [];
    const ids = new Set(store.departments.map((d) => d.departmentId));
    return wanted.filter((id) => ids.has(id));
  }, [currentUser, store.departments]);

  /** 部長の自部門がその年度の部門マスタに無い場合は 1 回だけ注意する */
  useEffect(() => {
    if (!currentUser) return;
    const wanted = defaultDepartmentsOf(currentUser);
    if (wanted.length === 0) return;
    const ids = new Set(store.departments.map((d) => d.departmentId));
    const missing = wanted.filter((id) => !ids.has(id));
    if (missing.length === 0) return;
    const key = `${selectedYear}:${currentUser.userId}`;
    if (warnedDeptRef.current === key) return;
    warnedDeptRef.current = key;
    message.warning(
      `${missing
        .map((id) => departmentNameOf(store.departments, id))
        .join('・')} は ${selectedYear}年度の部門マスタに存在しないため、全部門を表示します。`,
    );
  }, [currentUser, selectedYear, store.departments]);

  /** メニューキー → 画面の対応（メニューの並び順とは独立） */
  const views: Record<MenuKey, React.ReactNode> = {
    'year-select': (
      <YearSelectScreen
        selectedYear={selectedYear}
        onSelect={requestYearChange}
        summaries={yearSummaries}
      />
    ),
    'work-status': (
      <WorkStatus
        year={selectedYear}
        projects={store.projects}
        departments={store.departments}
        defaultDepartments={defaultDepartments}
        employeeMaster={employeeMaster}
        initialWorkStatus={store.workStatus}
        onSave={handleSaveWorkStatus}
        onUpdateLeavePlan={handleUpdateLeavePlan}
        onDirtyChange={setDirty}
        registerSaveHandler={registerSaveHandler}
      />
    ),
    'personnel-info': (
      <PersonnelInfoScreen
        year={selectedYear}
        personnel={store.personnel}
        departments={store.departments}
        onSubmit={handleSavePersonnel}
        onImport={handleImportPersonnel}
        onDelete={handleDeletePersonnel}
        hasWorkData={hasWorkDataForPersonnel}
      />
    ),
    'department-manage': (
      <DepartmentManagementScreen
        year={selectedYear}
        departments={store.departments}
        onAddDepartment={handleAddDepartment}
        onEditDepartment={handleEditDepartment}
        onDeleteDepartment={handleDeleteDepartment}
      />
    ),
    'project-manage': (
      <ProjectManagementScreen
        year={selectedYear}
        projects={store.projects}
        setProjects={setYearProjects}
        departments={store.departments}
      />
    ),
    'jinan-work-rate': (
      <JinanWorkRateScreen
        year={selectedYear}
        departments={store.departments}
        workStatus={store.workStatus}
        projects={store.projects}
      />
    ),
    'holiday-settings': (
      <HolidaySettingsScreen
        year={selectedYear}
        holidays={store.holidays}
        setHolidays={setYearHolidays}
      />
    ),
    'user-manage': (
      <UserManagementScreen
        users={users}
        setUsers={setUsers}
        currentUserId={currentUserId}
        departments={store.departments}
        allowManage={currentUser?.role === 'admin'}
      />
    ),
  };

  // 未ログイン時はログイン画面を表示する
  if (!currentUser) {
    return (
      <Login
        users={users}
        departments={store.departments}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className='app-shell'>
      {/* 共通メニュー（選択で画面を切り替える） */}
      <AppMenu
        activeKey={activeView}
        onSelect={setActiveView}
        user={currentUser}
        departmentName={
          currentUser.departmentId
            ? departmentNameOf(store.departments, currentUser.departmentId)
            : undefined
        }
        onLogout={requestLogout}
        year={selectedYear}
        onYearChange={requestYearChange}
      />

      {/* 年度が変わったら全画面を作り直す（画面内の状態を確実に切り替えるため） */}
      <div className='app-main' key={selectedYear}>
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

      {/* 未保存の変更がある状態で年度切替 / ログアウト をしようとしたとき */}
      <UnsavedChangesModal
        open={pendingAction !== null}
        year={selectedYear}
        onSave={handleSaveAndContinue}
        onDiscard={handleDiscardAndContinue}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

export default App;
