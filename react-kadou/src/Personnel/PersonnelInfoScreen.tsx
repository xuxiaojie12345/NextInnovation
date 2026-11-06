import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Department, Personnel } from '../WorkStatus/types';
import { departmentLabelOf } from '../data/departmentUtils';
import { fetchDepartments } from '../api/departmentManagement';
import {
  PERSONNEL_IMPORT_ACCEPT,
  PERSONNEL_IMPORT_FORMAT_HINT,
  PersonnelImportRow,
  parsePersonnelFile,
} from './personnelImport';
import {
  PersonnelImportAbortedError,
  PersonnelImportApiResult,
  deletePersonnel,
  fetchPersonnelCount,
  fetchPersonnelInfo,
  fetchWeeklyCount,
  importPersonnelRows,
  savePersonnel,
} from './personnelApi';

const { Title, Text } = Typography;

/** 解析結果の行をバックエンドへ送る形式へ変換する */
const toApiRows = (rows: PersonnelImportRow[]) =>
  rows.map((r) => ({
    employeeNo: r.employeeNo,
    name: r.name,
    role: r.role,
    department: r.department,
    departmentAlias: r.departmentAlias,
    workLocation: r.workLocation,
    line: r.line,
  }));

interface PersonnelInfoScreenProps {
  /** 表示する年度 */
  year: number;
  /** 要員一覧（社員番号で 役割・名前・所属 を引く。マスタを兼ねる） */
  personnel: Personnel[];
  /** 操作者（登録・更新者）。リクエストヘッダー X-User-Id に付与する */
  operatorId?: string | null;
  /**
   * 登録実行（App 側で要員一覧へ追加／更新する）
   * ※追加しても画面遷移はしない
   */
  onSubmit: (values: {
    employeeNo: string;
    name: string;
    departmentId: string;
    role: string;
  }) => void;
  /**
   * 社員情報（Excel / CSV）の一括読み込みを実行する
   * 社員番号で突合し、既存は上書き（更新。所属は変更しない）・新規は追加する
   */
  onImport: (rows: PersonnelImportRow[]) => void;
  /**
   * 要員マスタの削除
   * 当年度の稼働表行・割当・BUFFER も削除する（他年度は変更しない）
   */
  onDelete: (employeeNo: string) => void;
  /**
   * 当年度に稼働データ（行・割当・BUFFER）があるか。
   *
   * NOTE: 削除確認は jn_weekly_assignment_table の実件数を
   *       fetchWeeklyCount() で取得して表示するように変更したため、
   *       この画面では現在未使用（App 側のインターフェース維持のため残す）。
   */
  hasWorkData?: (employeeNo: string) => boolean;
}

/**
 * 要員情報 画面（メニュー「要員情報」で切り替わる画面）
 * 社員番号を入力すると、該当する要員の 役割・名前・所属 を表示する。
 * すべての項目は編集でき、存在しない社員番号は確認のうえで新規追加できる。
 */
const PersonnelInfoScreen: React.FC<PersonnelInfoScreenProps> = ({
  year,
  personnel,
  operatorId,
  onSubmit,
  onImport,
  onDelete,
}) => {
  /**
   * 部門マスタ（所属の選択肢）。
   *
   * NOTE: この画面は要員を DB へ直接登録するため、所属も DB の
   *       jn_department_master から取得する（App の store.departments は
   *       モックで、departmentId が 'dept-0001' 形式のため使えない）。
   */
  const [departments, setDepartments] = useState<Department[]>([]);
  /** 部門マスタ取得中フラグ（所属が選べない理由を画面に出すため） */
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  /** 部門マスタの取得に失敗したか（空との区別。再取得ボタンの表示に使う） */
  const [departmentsError, setDepartmentsError] = useState(false);
  /** 部門マスタの再取得トリガー（「再読み込み」ボタンで加算する） */
  const [reloadKey, setReloadKey] = useState(0);

  // 年度が変わったら部門マスタを取り直す
  useEffect(() => {
    let alive = true;
    setLoadingDepartments(true);
    setDepartmentsError(false);

    (async () => {
      try {
        const list = await fetchDepartments(year);
        if (!alive) return;
        setDepartments(list);
      } catch {
        // 取得できなかった場合は空にする（所属が必須のため登録はできない）
        if (!alive) return;
        setDepartments([]);
        setDepartmentsError(true);
      } finally {
        // NOTE: アンマウント済みでもフラグは必ず戻す。
        //       （alive 判定で return してしまうと loading のまま固まる）
        if (alive) setLoadingDepartments(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [year, reloadKey]);

  // 入力中の社員番号
  const [employeeNo, setEmployeeNo] = useState('');
  // 役割（編集可）
  const [role, setRole] = useState('');
  // 名前（編集可）
  const [name, setName] = useState('');
  // 所属（編集可。部門マスタの departmentId）
  const [deptId, setDeptId] = useState<string | undefined>(undefined);
  /**
   * 所属の未選択エラーを表示するか。
   * 登録（保存）を押したときに未選択だった場合だけ true にする。
   * 所属を選択すると解除する。
   */
  const [deptError, setDeptError] = useState(false);
  // 一括読み込み：ファイル解析中フラグ
  const [importing, setImporting] = useState(false);
  // 一括読み込み：解析結果（プレビュー用。null = ダイアログ非表示）
  const [importRows, setImportRows] = useState<PersonnelImportRow[] | null>(null);
  // 一括読み込み：ファイル名 / 読み取り元 / 取り込まなかった行の警告
  const [importFileName, setImportFileName] = useState('');
  const [importSource, setImportSource] = useState('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  /**
   * 一括取り込みの事前検証（dryRun）結果。
   * 重複がある場合は「上書きして取り込む／中止」を選ばせる。
   * null = 未検証
   */
  const [importCheck, setImportCheck] =
    useState<PersonnelImportApiResult | null>(null);
  // 登録要員数（jn_personnel_master の件数。バックエンドから取得）
  const [personnelCount, setPersonnelCount] = useState<number | null>(null);
  // 検索（バックエンド呼び出し）中フラグ
  const [searching, setSearching] = useState(false);
  // 一括取り込みをバックエンドへ送信中フラグ
  const [submittingImport, setSubmittingImport] = useState(false);
  // 保存（バックエンド呼び出し）中フラグ
  const [saving, setSaving] = useState(false);
  /**
   * 削除確認ダイアログの対象（null = ダイアログ非表示）。
   * weeklyCount は jn_weekly_assignment_table の当該年度・社員番号の件数。
   */
  const [deleteTarget, setDeleteTarget] = useState<{
    employeeNo: string;
    name: string;
    weeklyCount: number;
  } | null>(null);
  /** 削除確認ダイアログで「要員稼動管理の情報も削除する」が選ばれているか */
  const [deleteWeekly, setDeleteWeekly] = useState(false);
  /** 削除処理（件数取得・実行）中フラグ */
  const [deleting, setDeleting] = useState(false);
  /**
   * 入力チェック結果（入力欄の下に赤字で表示する）。
   * '' = エラーなし。フォーカスが外れたタイミングで判定する。
   */
  const [employeeNoError, setEmployeeNoError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [nameError, setNameError] = useState('');

  /**
   * 直近の検索（または保存）が成功した社員番号。
   * 入力欄の社員番号がこれと一致している間だけ「DB で確認済み」とみなす。
   * 入力内容が変わると無効になる（＝ボタンの表示が「保存する」に戻る）。
   */
  const [verifiedNo, setVerifiedNo] = useState('');
  /** verifiedNo の社員番号が DB に存在したか（true: 更新／削除が可能） */
  const [verifiedExists, setVerifiedExists] = useState(false);
  /**
   * 検索（または保存）時点の入力内容のスナップショット。
   * 「更新する」を押したときに変更があったかを判定するために使う。
   * null = 未検索（比較対象なし）
   */
  const [original, setOriginal] = useState<{
    name: string;
    role: string;
    deptId: string | undefined;
  } | null>(null);

  /** 登録要員数をバックエンドから取得する */
  const reloadPersonnelCount = useCallback(async () => {
    try {
      const count = await fetchPersonnelCount(year);
      setPersonnelCount(count);
    } catch {
      // 取得できなかった場合は 0 件ではなく「-」を表示する
      setPersonnelCount(null);
    }
  }, [year]);

  // 年度が変わったら要員数を取り直す
  useEffect(() => {
    void reloadPersonnelCount();
  }, [reloadPersonnelCount]);

  /** 部門名 → 部門ID（一括取り込み後の表示用。部門マスタから引く） */
  const deptIdByName = useMemo(
    () => new Map(departments.map((d) => [d.name, d.departmentId])),
    [departments],
  );

  /** 社員番号 → 要員（社員マスタ） */
  const masterByNo = useMemo(
    () => new Map(personnel.map((p) => [p.employeeNo, p])),
    [personnel],
  );

  /**
   * 一括取り込み：「E 列（所属部門）× N 列（労働関係所属地）」で部門マスタを照合する。
   *
   * 照合ルール（仕様）：
   *   E 列 → 部門マスタの「部門別名（department_alisa）」
   *   N 列 → 部門マスタの「拠点（location）」
   *   両方が一致した部門だけを候補とする（完全一致・全半角/大文字小文字は正規化）。
   *
   * 一致した場合は所属（部門名称）と部門ID を確定して「ロック」する。
   * 一致しない場合は department を空にして、プレビュー上で手動選択させる。
   */
  const resolveImportDepartment = useCallback(
    (row: PersonnelImportRow): PersonnelImportRow => {
      const normalize = (v: string | undefined) =>
        (v ?? '').replace(/\u3000/g, ' ').trim().toLowerCase();
      const alias = normalize(row.departmentAlias);
      const loc = normalize(row.workLocation);

      const hit = departments.filter(
        (d) =>
          normalize(d.alisa) === alias && normalize(d.location) === loc,
      );

      // 一致が 1 件に絞れたときだけ確定する（同名・同拠点が複数ある場合は選ばせる）
      if (hit.length === 1) {
        return {
          ...row,
          department: hit[0].name,
          departmentId: hit[0].departmentId,
          departmentAutoMatched: true,
        };
      }
      return {
        ...row,
        department: '',
        departmentId: undefined,
        departmentAutoMatched: false,
      };
    },
    [departments],
  );

  /** 一括取り込み：プレビュー行の所属を手動で選び直す（一致しなかった行のみ） */
  const handleImportDepartmentChange = useCallback(
    (employeeNo: string, departmentId: string) => {
      const dept = departments.find((d) => d.departmentId === departmentId);
      setImportRows((prev) =>
        prev
          ? prev.map((r) =>
              r.employeeNo === employeeNo
                ? {
                    ...r,
                    departmentId,
                    department: dept?.name ?? '',
                    // 手動選択はプルダウンのまま維持する（自動確定とは区別）
                    departmentAutoMatched: false,
                  }
                : r,
            )
          : prev,
      );
    },
    [departments],
  );

  /**
   * 一括取り込みで「既存データと重複（＝上書き）」となる社員番号。
   *
   * NOTE: 画面の personnel（App のストア）はモックで DB と一致しないため、
   *       判定にはバックエンドの事前検証（dryRun）の結果を使う。
   */
  const importDuplicatedNos = useMemo(
    () => new Set(importCheck?.duplicatedEmployeeNos ?? []),
    [importCheck],
  );

  /**
   * 上書き（既存データと重複）行の「DB 上の所属部門名」。
   * 上書き時は所属を更新しないため、プレビューはこの値をグレー表示する。
   */
  const importDuplicatedDepartments =
    importCheck?.duplicatedDepartments ?? {};

  /** 入力中の社員番号が、検索済みかつ DB に存在する要員か（更新／削除ボタンの表示に使用） */
  const isVerified = verifiedNo !== '' && verifiedNo === employeeNo.trim();
  const isExisting = isVerified && verifiedExists;

  // --- 入力チェック -----------------------------------------------
  /** 社員番号：5 桁以内の半角数字のみ */
  const validateEmployeeNo = (v: string): string => {
    const t = v.trim();
    if (t === '') return '社員番号を入力してください。';
    if (!/^[0-9]{1,5}$/.test(t)) {
      return '社員番号は5桁以内の半角数字で入力してください。';
    }
    return '';
  };

  /** 役割：必須・6 桁の半角英数字のみ */
  const validateRole = (v: string): string => {
    const t = v.trim();
    if (t === '') return '役割を入力してください。';
    if (!/^[a-zA-Z0-9]{6}$/.test(t)) {
      return '役割は6桁の半角英数字で入力してください。';
    }
    return '';
  };

  /** 名前：20 文字以内 */
  const validateName = (v: string): string => {
    if (v.trim().length > 20) {
      return '名前は20文字以内で入力してください。';
    }
    return '';
  };

  /** 社員番号の入力チェック（フォーカスアウト時に呼ぶ） */
  const handleEmployeeNoBlur = () => {
    // 空欄は blurred 時にエラーにしない（必須エラーは送信時に出す）
    if (employeeNo.trim() === '') {
      setEmployeeNoError('');
      return;
    }
    setEmployeeNoError(validateEmployeeNo(employeeNo));
  };

  /** 役割の入力チェック（フォーカスアウト時に呼ぶ） */
  const handleRoleBlur = () => {
    // 空欄はフォーカスアウト時にエラーにしない（必須エラーは送信時に出す）
    if (role.trim() === '') {
      setRoleError('');
      return;
    }
    setRoleError(validateRole(role));
  };

  /** 名前の入力チェック（フォーカスアウト時に呼ぶ） */
  const handleNameBlur = () => {
    setNameError(validateName(name));
  };

  /**
   * 検索結果から変更があったか。
   * 未検索（original が null）の場合は true（＝比較対象なし）。
   * 保存ボタンの補助表示に使う。
   *
   * NOTE: 登録済み（isExisting）の要員は所属が変更できないため、
   *       所属は比較対象に含めない。
   */
  const isDirty =
    original === null ||
    original.name !== name.trim() ||
    original.role !== (role.trim() || '要員') ||
    (!isExisting && original.deptId !== deptId);

  /** 所属を選択したら未選択エラーを解除する */
  const handleDeptChange = (v?: string) => {
    setDeptId(v);
    if (v) setDeptError(false);
  };

  /** 入力値を初期化 */
  const handleReset = () => {
    setEmployeeNo('');
    setRole('');
    setName('');
    setDeptId(undefined);
    setDeptError(false);
    setEmployeeNoError('');
    setRoleError('');
    setNameError('');
    setVerifiedNo('');
    setVerifiedExists(false);
    setOriginal(null);
  };
  /**
   * 表示中の要員を削除する（バックエンドの DB から削除）。
   *
   * NOTE: 誤操作防止のため、必ず確認ダイアログを表示してから削除する。
   *       ダイアログでは「要員稼動管理（jn_weekly_assignment_table）の情報も
   *       削除するか」をチェックボックスで選ばせる。
   *       週割当の削除条件は「年度 + 社員番号」。
   */
  const handleDelete = async () => {
    const no = employeeNo.trim();
    if (!no || !isExisting) return;

    // 削除対象の週割当件数を事前に取得する（ダイアログに表示するため）
    setDeleting(true);
    let weeklyCount = 0;
    try {
      weeklyCount = await fetchWeeklyCount(no, year);
    } catch {
      // 件数が取れない場合も削除操作自体は続行できるようにする（0 件扱い）
      weeklyCount = 0;
    } finally {
      setDeleting(false);
    }

    setDeleteTarget({ employeeNo: no, name: name.trim(), weeklyCount });
  };

  /** 削除確認ダイアログで「削除」を押したときの実処理 */
  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const { employeeNo: no } = deleteTarget;
    const alsoWeekly = deleteWeekly;
    setDeleting(true);
    try {
      const result = await deletePersonnel(no, year, alsoWeekly);
      // 画面側（App の要員一覧）にも反映する
      onDelete(no);
      handleReset();
      setDeleteTarget(null);
      setDeleteWeekly(false);
      message.success(
        alsoWeekly && result.deletedWeeklyCount > 0
          ? `社員番号「${no}」を削除しました（週割当 ${result.deletedWeeklyCount} 件も削除）。`
          : `社員番号「${no}」を削除しました。`,
      );
      await reloadPersonnelCount();
    } catch (e) {
      message.error(
        e instanceof Error
          ? `削除に失敗しました：${e.message}`
          : '削除に失敗しました。',
      );
    } finally {
      setDeleting(false);
    }
  };

  /**
   * 社員番号で要員情報を表示する（バックエンド API 経由）。
   * GET /api/kadou/personnel/{employeeNo}/{year}
   * マスタに存在しない場合（404）は、新規追加するか確認する。
   */
  const handleLookup = async (rawNo: string) => {
    const no = rawNo.trim();
    if (!no) {
      setEmployeeNoError('社員番号を入力してください。');
      return;
    }
    // 形式チェック（5 桁の半角数字）。NG の場合は検索しない
    const noError = validateEmployeeNo(no);
    if (noError) {
      setEmployeeNoError(noError);
      return;
    }

    setSearching(true);
    try {
      const info = await fetchPersonnelInfo(no, year);

      // 既存の要員 → 役割・名前・所属 を入力欄へ反映する
      setEmployeeNo(info.employeeNo || no);
      setRole(info.role ?? '');
      setName(info.name ?? '');
      // 所属は部門マスタの ID で管理するため、部門名から ID へ変換する
      const deptId = info.department
        ? deptIdByName.get(info.department)
        : undefined;
      setDeptId(deptId);
      // 検索で DB に存在したことを記録する（ボタンが「更新する」＋削除表示になる）
      setVerifiedNo(no);
      setVerifiedExists(true);
      // 変更あり判定用に、検索時点の値をスナップショットしておく
      setOriginal({
        name: (info.name ?? '').trim(),
        role: (info.role ?? '').trim() || '要員',
        deptId,
      });
      message.success(`社員番号「${no}」の要員情報を表示しました。`);
    } catch {
      // 該当なし（404 など）→ ダイアログは出さず、そのまま新規登録の入力状態にする
      // NOTE: 入力中の 役割・名前・所属 と各入力欄下のエラー表示は消さない
      setEmployeeNo(no);
      setVerifiedNo(no);
      setVerifiedExists(false);
      message.info(`社員番号「${no}」は未登録です。`);
    } finally {
      setSearching(false);
    }
  };

  /** 要員を DB へ保存する（新規追加／更新。画面遷移はしない） */
  const save = async (no: string, isNew: boolean) => {
    // 入力チェック（不正な値は送信しない）
    const noError = validateEmployeeNo(no);
    const rError = validateRole(role);
    const nError = name.trim() === '' ? '名前を入力してください。' : validateName(name);
    setEmployeeNoError(noError);
    setRoleError(rError);
    setNameError(nError);
    if (noError || rError || nError) {
      return;
    }

    // 所属は必須（未選択のまま送信しない）
    if (!deptId) {
      setDeptError(true);
      return;
    }

    setSaving(true);
    try {
      await savePersonnel(
        no,
        year,
        {
          name: name.trim(),
          departmentId: deptId,
          role: role.trim() || '要員',
        },
        operatorId,
      );

      // 画面側（App の要員一覧）にも反映する
      onSubmit({
        employeeNo: no,
        name: name.trim(),
        departmentId: deptId,
        role: role.trim() || '要員',
      });

      // 保存できたので「DB に存在する社員番号」として記録する
      // （入力欄はクリアせず、そのまま「更新する」「削除する」が使える状態にする）
      setEmployeeNo(no);
      setVerifiedNo(no);
      setVerifiedExists(true);
      // 保存後の値を新しい基準値にする（次回の「変更なし」判定用）
      setOriginal({
        name: name.trim(),
        role: role.trim() || '要員',
        deptId,
      });

      message.success(
        isNew
          ? `社員番号「${no}」の要員情報を追加しました。`
          : `社員番号「${no}」の要員情報を更新しました。`,
      );
      await reloadPersonnelCount();
    } catch (e) {
      message.error(
        e instanceof Error
          ? `保存に失敗しました：${e.message}`
          : '保存に失敗しました。',
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * 登録（追加／更新）。
   *
   * NOTE: 「DB に存在するか」は state の履歴に頼らず、送信時に必ず DB を引き直す。
   *       （入力内容を変えた直後に state が古いままだと、誤って更新扱いになるため）
   */
  const handleSubmit = async () => {
    const no = employeeNo.trim();
    // 入力チェック（空欄・形式 NG はまとめて判定し、入力欄の下に赤字で表示する）
    const noError = validateEmployeeNo(no);
    const rError = validateRole(role);
    const nError = name.trim() === ''
      ? '名前を入力してください。'
      : validateName(name);
    // 所属は必須（登録済みの要員は所属変更不可のため対象外）
    const dError = !isExisting && !deptId ? '所属を選択してください。' : '';
    setEmployeeNoError(noError);
    setRoleError(rError);
    setNameError(nError);
    setDeptError(dError !== '');
    if (noError || rError || nError || dError) {
      return;
    }

    // --- 送信時点の DB の状態を必ず確認する ---
    setSaving(true);
    let existing: Awaited<ReturnType<typeof fetchPersonnelInfo>> | null = null;
    try {
      existing = await fetchPersonnelInfo(no, year);
    } catch {
      // 404（存在しない）や通信エラーは「存在しない」として扱う
      existing = null;
    } finally {
      setSaving(false);
    }

    if (existing) {
      // DB に既に存在する → 変更が無ければそのまま終了する
      const savedDeptId =
        (existing.department
          ? deptIdByName.get(existing.department)
          : undefined) ?? undefined;
      // NOTE: 登録済みの要員は所属を変更できないため、所属は比較対象に含めない
      const noChange =
        name.trim() === (existing.name ?? '').trim() &&
        (role.trim() || '要員') === ((existing.role ?? '').trim() || '要員');

      if (noChange) {
        // 入力内容を DB の値に揃えて「検索済み」状態に戻す
        setVerifiedNo(no);
        setVerifiedExists(true);
        setOriginal({
          name: (existing.name ?? '').trim(),
          role: (existing.role ?? '').trim() || '要員',
          deptId: savedDeptId,
        });
        Modal.info({
          title: '変更内容がありません',
          content: `社員番号「${no}」の情報は変更されていません。更新する項目を変更してください。`,
          okText: '閉じる',
        });
        return;
      }
    }

    // DB の状態を検証結果として確定させる
    // （入力欄は user が変更できるので、ここで上書きしてよい）
    setVerifiedNo(no);
    setVerifiedExists(existing !== null);

    if (existing) {
      // DB に既に存在する → 更新してよいか確認する
      Modal.confirm({
        title: '社員番号は既に登録されています',
        content: `社員番号「${no}」は既に登録されています（${existing.name}）。このデータを更新しますか？`,
        okText: '更新する',
        cancelText: 'キャンセル',
        onOk: () => {
          // 入力中の所属が未選択なら、DB の所属を引き継ぐ
          if (!deptId && existing?.department) {
            const dept = deptIdByName.get(existing.department);
            if (dept) setDeptId(dept);
          }
          void save(no, false);
        },
      });
      return;
    }

    // DB に存在しない → 確認ダイアログは出さず、そのまま新規追加する
    // （存在しない場合は「保存する」ボタンでの新規登録が既定の動作）
    void save(no, true);
  };

  /**
   * 一括読み込み：社員情報ファイル（Excel / CSV）を解析し、
   * バックエンドで事前検証（dryRun）してからプレビューを表示する。
   */
  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const parsed = await parsePersonnelFile(file);
      if (parsed.rows.length === 0) {
        message.error(
          `一括読み込み：取り込める社員情報がありませんでした（${file.name}）。`,
        );
        return;
      }

      setImportFileName(file.name);
      setImportSource(parsed.source);
      setImportWarnings(parsed.warnings);

      // E 列（所属部門）× N 列（労働関係所属地）で部門マスタを照合し、所属を確定する
      const resolved = parsed.rows.map(resolveImportDepartment);

      // 事前検証（DB へは書き込まない）
      const apiRows = toApiRows(resolved);
      let check: PersonnelImportApiResult;
      try {
        check = await importPersonnelRows(year, apiRows, {
          dryRun: true,
          opUser: operatorId,
        });
        setImportCheck(check);
        setImportRows(resolved);
      } catch (e) {
        if (e instanceof PersonnelImportAbortedError) {
          // 409 = ファイル全体中止。既存データとの重複は「上書きして取り込む」で
          // 続行できるため、その場合はプレビューを開いてボタンで選ばせる。
          setImportCheck(e.result);
          if (e.result.duplicated > 0) {
            setImportRows(resolved);
            return;
          }

          // ファイル内重複など、上書きしても続行できない中止
          setImportRows(null);
          Modal.error({
            title: '取り込みを中止しました',
            width: 620,
            content: (
              <Space direction='vertical' style={{ width: '100%' }}>
                <Text>{e.message}</Text>
                {e.result.warnings.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 220, overflow: 'auto' }}>
                    {e.result.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
              </Space>
            ),
          });
          return;
        }
        throw e;
      }
    } catch (e) {
      message.error(
        e instanceof Error
          ? `一括読み込みに失敗しました：${e.message}`
          : '一括読み込みに失敗しました。',
      );
    } finally {
      setImporting(false);
    }
  };

  /** 一括読み込み：プレビューを閉じる */
  const handleImportCancel = () => {
    setImportRows(null);
    setImportCheck(null);
    setImportWarnings([]);
    setImportFileName('');
    setImportSource('');
  };

  /**
   * 一括読み込み：プレビュー内容をバックエンドへ送信して DB を更新する。
   * 既存データと重複がある場合は「上書き」を指定して送信する。
   */
  const handleImportConfirm = async () => {
    if (!importRows) return;
    // 新規追加行は所属が必須。既存データの上書き行は所属を更新しないので不要
    const unresolved = importRows.filter(
      (r) => !r.departmentId && !importDuplicatedNos.has(r.employeeNo),
    );
    if (unresolved.length > 0) {
      message.error(
        `E 列（所属部門）× N 列（労働関係所属地）で部門を特定できない行が ${unresolved.length} 件あります。プレビュー上で所属を選択してください。`,
      );
      return;
    }
    // 所属が必須のため、不備があるファイルは 1 件も反映しない
    if (importBlocked) {
      message.error(
        '所属が空欄、または部門マスタに無い所属があるため取り込みできません。',
      );
      return;
    }
    const hasDuplicates = (importCheck?.duplicated ?? 0) > 0;
    setSubmittingImport(true);
    try {
      // 年度 + 社員番号で判定し、存在すれば更新・なければ追加する（バックエンド側で実施）
      const result = await importPersonnelRows(year, toApiRows(importRows), {
        overwrite: hasDuplicates,
        opUser: operatorId,
      });

      // 画面側（App の要員一覧）にも反映する
      onImport(importRows);

      message.success(
        `社員情報を一括読み込みしました：追加 ${result.added} 件 / 上書き ${result.updated} 件` +
          (result.skipped > 0 ? ` / スキップ ${result.skipped} 件` : '') +
          '。',
      );

      const warnings = [...importWarnings, ...result.warnings];
      if (result.skipped > 0 && warnings.length === 0) {
        warnings.push(`取り込まなかった行が ${result.skipped} 件あります。`);
      }
      if (warnings.length > 0) {
        message.warning(
          `警告が ${warnings.length} 件あります（${warnings[0]}${
            warnings.length > 1 ? ' ほか' : ''
          }）。`,
        );
      }

      // 取り込み後の登録要員数を取り直す
      await reloadPersonnelCount();
      handleImportCancel();
    } catch (e) {
      if (e instanceof PersonnelImportAbortedError) {
        message.error(e.message);
        return;
      }
      message.error(
        e instanceof Error
          ? `一括読み込みに失敗しました：${e.message}`
          : '一括読み込みに失敗しました。',
      );
    } finally {
      setSubmittingImport(false);
    }
  };

  /** 一括読み込み：プレビュー表に出す追加／上書き件数（事前検証の結果を使う） */
  const importCounts = useMemo(
    () => ({
      added: importCheck?.added ?? 0,
      updated: importCheck?.updated ?? 0,
      duplicated: importCheck?.duplicated ?? 0,
    }),
    [importCheck],
  );

  /**
   * 一括読み込み：所属が未確定の行（E 列×N 列で部門マスタに一致しなかった）。
   * プレビュー上で手動選択すれば解消する。
   *
   * NOTE: 既存データと重複する行（＝上書き）は所属を更新しないため、
   *       未確定でも取り込みを止めない。
   */
  const unresolvedRows = useMemo(
    () =>
      (importRows ?? []).filter(
        (r) => !r.departmentId && !importDuplicatedNos.has(r.employeeNo),
      ),
    [importRows, importDuplicatedNos],
  );

  /**
   * 一括読み込み：ファイル全体の取り込みを中止したか。
   *
   * 所属は必須なため、次のいずれかがあれば 1 件も反映しない。
   *   - ファイル解析で警告が出た行がある
   *   - 所属が未確定（E 列×N 列が部門マスタに一致しない）行がある
   */
  const importBlocked =
    importWarnings.length > 0 || unresolvedRows.length > 0;

  /** 一括読み込み：プレビュー表の列 */
  const importColumns: TableColumnsType<PersonnelImportRow> = [
    {
      title: '区分',
      key: 'kind',
      width: 72,
      render: (_, row) =>
        importDuplicatedNos.has(row.employeeNo) ? (
          <Tag color='gold'>上書き</Tag>
        ) : (
          <Tag color='green'>追加</Tag>
        ),
    },
    { title: '社員番号', dataIndex: 'employeeNo', key: 'employeeNo', width: 110 },
    { title: '名前', dataIndex: 'name', key: 'name', width: 140 },
    { title: '役割', dataIndex: 'role', key: 'role', width: 100 },
    {
      title: '所属',
      dataIndex: 'department',
      key: 'department',
      width: 180,
      /**
       * 所属の表示：
       *   1) 既存データと重複（＝上書き）行 → 所属は更新しないのでグレー表示
       *      （表示値は DB に登録済みの所属部門名。「DB」バッジで由来を示す）
       *   2) 新規追加で E 列×N 列の自動照合が成功した行 → 黒字のテキスト表示
       *   3) 上記以外（照合できなかった行）→ プルダウンで選択させる。
       *      手動で選んでもプルダウンのまま残す（誤選択を修正できるようにする）。
       */
      render: (_: string, row) => {
        const isUpdate = importDuplicatedNos.has(row.employeeNo);
        if (isUpdate) {
          const existing = importDuplicatedDepartments[row.employeeNo] ?? '';
          return (
            <Space size={4}>
              <Text type='secondary' style={{ color: '#bfbfbf' }}>
                {existing || '－'}
              </Text>
              <Tooltip title='DB に登録済みの所属です（ファイルの値では更新されません）'>
                <Tag
                  color='default'
                  style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}
                >
                  既存
                </Tag>
              </Tooltip>
            </Space>
          );
        }
        // 自動照合で確定した行だけテキスト表示
        if (row.departmentAutoMatched) {
          return row.department || '－';
        }
        return (
          <Select
            size='small'
            showSearch
            optionFilterProp='label'
            placeholder='所属を選択'
            status={row.departmentId ? undefined : 'error'}
            style={{ width: '100%' }}
            value={row.departmentId || undefined}
            options={departments.map((d) => ({
              value: d.departmentId,
              label: d.name,
            }))}
            onChange={(v: string) =>
              handleImportDepartmentChange(row.employeeNo, v)
            }
          />
        );
      },
    },
  ];

  return (
    <div className='screen-page'>
      {/* 画面ヘッダー */}
      <div className='screen-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {year}年度　要員情報
          </Title>
          <Text type='secondary'>
            社員番号を入力すると、該当する要員の 役割・名前・所属
            を表示します。すべての項目は編集でき、存在しない社員番号は確認のうえで新規追加できます。
          </Text>
        </div>

        {/* 右上：社員情報（Excel / CSV）の一括読み込み */}
        <div className='personnel-header-side'>
          <Space size={8} wrap align='center'>
            <Text strong>社員情報</Text>
            <Upload
              accept={PERSONNEL_IMPORT_ACCEPT}
              showUploadList={false}
              multiple={false}
              disabled={importing}
              beforeUpload={(file) => {
                // サーバーへは送信せず、フロントのみで解析する（モック）
                void handleImportFile(file);
                return false;
              }}
            >
              <Button type='primary' icon={<UploadOutlined />} loading={importing}>
                一括読み込む
              </Button>
            </Upload>
          </Space>
          <Text type='secondary' className='personnel-import-hint'>
            {PERSONNEL_IMPORT_FORMAT_HINT}
          </Text>
        </div>
      </div>

      {/* 入力フォーム */}
      <Card
        title='要員情報'
        className='screen-card'
        extra={
          <Text type='secondary'>
            現在の登録要員数：{personnelCount === null ? '-' : personnelCount} 名
          </Text>
        }
      >
        <Space
          direction='vertical'
          style={{ width: '100%', maxWidth: 480 }}
          size='middle'
        >
          <div>
            <div className='form-label'>社員番号（必須）</div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder='例：10001'
                value={employeeNo}
                maxLength={20}
                status={employeeNoError ? 'error' : undefined}
                onChange={(e) => {
                  const next = e.target.value;
                  setEmployeeNo(next);
                  // 検索済みの社員番号と変わったら「確認済み」状態を解除する
                  // （＝ボタンが「保存する」に戻り、削除ボタンも隠れる）
                  if (next.trim() !== verifiedNo) {
                    setVerifiedNo('');
                    setVerifiedExists(false);
                  }
                }}
                onBlur={handleEmployeeNoBlur}
                onPressEnter={() => void handleLookup(employeeNo)}
              />
              <Button
                icon={<SearchOutlined />}
                loading={searching}
                onClick={() => void handleLookup(employeeNo)}
              >
                検索
              </Button>
            </Space.Compact>
            {employeeNoError && (
              <Text type='danger' style={{ fontSize: 12 }}>
                {employeeNoError}
              </Text>
            )}
          </div>
          <div>
            <div className='form-label'>役割（必須）</div>
            <Input
              placeholder='例：T11E03'
              value={role}
              maxLength={20}
              status={roleError ? 'error' : undefined}
              onChange={(e) => setRole(e.target.value)}
              onBlur={handleRoleBlur}
            />
            {roleError && (
              <Text type='danger' style={{ fontSize: 12 }}>
                {roleError}
              </Text>
            )}
          </div>
          <div>
            <div className='form-label'>名前（必須）</div>
            <Input
              placeholder='例：山田 花子'
              value={name}
              maxLength={50}
              status={nameError ? 'error' : undefined}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              onPressEnter={handleSubmit}
            />
            {nameError && (
              <Text type='danger' style={{ fontSize: 12 }}>
                {nameError}
              </Text>
            )}
          </div>
          <div>
            <div className='form-label'>所属（必須）</div>
            {/*
              新規追加時のみ選択可。検索で DB に存在した要員（isExisting）は
              所属の変更を禁止してグレーアウトする。
            */}
            <Select
              placeholder={loadingDepartments ? '所属を読み込み中...' : '所属を選択'}
              value={deptId}
              onChange={handleDeptChange}
              loading={loadingDepartments}
              notFoundContent={
                loadingDepartments ? '読み込み中...' : '部門が登録されていません'
              }
              options={departments.map((d) => ({
                value: d.departmentId,
                label: departmentLabelOf(departments, d.departmentId),
              }))}
              disabled={isExisting}
              status={!isExisting && deptError ? 'error' : undefined}
              style={{ width: '100%' }}
            />
            {!isExisting && !loadingDepartments && departments.length === 0 && (
              <Space direction='vertical' size={2} style={{ marginTop: 4 }}>
                <Text type='danger' style={{ fontSize: 12 }}>
                  {departmentsError
                    ? '部門マスタを取得できませんでした。'
                    : '部門マスタに部門が登録されていません。'}
                </Text>
                {departmentsError && (
                  <Button
                    size='small'
                    onClick={() => setReloadKey((k) => k + 1)}
                  >
                    再読み込み
                  </Button>
                )}
              </Space>
            )}
            {!isExisting && deptError && (
              <Text type='danger' style={{ fontSize: 12 }}>
                所属を選択してください。
              </Text>
            )}
            {isExisting && (
              <Text type='secondary' style={{ fontSize: 12 }}>
                登録済みの要員は所属を変更できません。
              </Text>
            )}
          </div>

          <Space wrap>
            <Button
              type={isExisting && !isDirty ? 'default' : 'primary'}
              icon={<CheckOutlined />}
              loading={saving}
              onClick={() => void handleSubmit()}
            >
              {isExisting ? '更新する' : '保存する'}
            </Button>
            <Button type='text' onClick={handleReset}>
              クリア
            </Button>
            {isExisting && (
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                削除する
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      {/* 一括読み込み：プレビュー（内容を確認してから取り込む） */}
      <Modal
        open={importRows !== null}
        title='社員情報の一括読み込み'
        okText={
          importCounts.duplicated > 0
            ? '重複を上書きして取り込む'
            : '取り込む'
        }
        cancelText='中止'
        confirmLoading={submittingImport}
        okButtonProps={{ disabled: importBlocked }}
        onOk={() => void handleImportConfirm()}
        onCancel={handleImportCancel}
        width={760}
      >
        {importRows && (
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <Alert
              type={importCounts.duplicated > 0 ? 'warning' : 'info'}
              showIcon
              message={
                importCounts.duplicated > 0
                  ? `重複が ${importCounts.duplicated} 件あります`
                  : '取り込み内容の確認'
              }
              description={
                importCounts.duplicated > 0
                  ? `${importFileName}（${importSource}）を読み込みました。重複した社員番号は 名前・役割 を上書きし（所属は変更できません）、新規の社員番号は所属を含めて追加します。中止した場合は 1 件も反映されません。`
                  : `${importFileName}（${importSource}）を読み込みました。新規 ${importCounts.added} 件を追加します。`
              }
            />
            <Space size='large' wrap>
              <Text>
                対象 <Text strong>{importRows.length}</Text> 件
              </Text>
              <Text>
                追加{' '}
                <Text strong style={{ color: '#389e0d' }}>
                  {importCounts.added}
                </Text>{' '}
                件
              </Text>
              <Text>
                上書き{' '}
                <Text strong style={{ color: '#d48806' }}>
                  {importCounts.updated}
                </Text>{' '}
                件
              </Text>
              {importCounts.duplicated > 0 && (
                <Text>
                  重複{' '}
                  <Text strong style={{ color: '#cf1322' }}>
                    {importCounts.duplicated}
                  </Text>{' '}
                  件
                </Text>
              )}
            </Space>
            {unresolvedRows.length > 0 && (
              <Alert
                type='error'
                showIcon
                message={`所属を特定できない行が ${unresolvedRows.length} 件あります`}
                description={`E 列（所属部門）× N 列（労働関係所属地）が部門マスタ（部門別名・拠点）に一致しませんでした。プレビュー表の「所属」で選択してください。未選択のままでは取り込めません。`}
              />
            )}
            {importWarnings.length > 0 && (
              <Alert
                type='error'
                showIcon
                message={`取り込めない行があります：${importWarnings.length} 件（取り込みは中止されます）`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {importWarnings.slice(0, 5).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                    {importWarnings.length > 5 && (
                      <li>ほか {importWarnings.length - 5} 件</li>
                    )}
                  </ul>
                }
              />
            )}
            <Table<PersonnelImportRow>
              rowKey='employeeNo'
              size='small'
              columns={importColumns}
              dataSource={importRows}
              pagination={{ pageSize: 5, size: 'small', showSizeChanger: false }}
            />
            {importCounts.duplicated > 0 && (
              <Text type='secondary' style={{ fontSize: 12 }}>
                グレー表示の所属は更新されません（上書き時は 名前・役割 のみ更新）。
              </Text>
            )}
          </Space>
        )}
      </Modal>

      {/* 削除確認：要員稼動管理（jn_weekly_assignment_table）も消すか選ばせる */}
      <Modal
        open={deleteTarget !== null}
        title='要員の削除'
        okText='削除'
        cancelText='キャンセル'
        okButtonProps={{ danger: true }}
        confirmLoading={deleting}
        onOk={() => void handleDeleteConfirmed()}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteWeekly(false);
        }}
        width={560}
      >
        {deleteTarget && (
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <div>
              社員番号「{deleteTarget.employeeNo}」（
              {deleteTarget.name || '－'}）を削除します。
              この操作は取り消せません。
            </div>

            <div
              style={{
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: 4,
                padding: '8px 12px',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                要員稼動管理の情報も削除しますか？
              </div>
              <div style={{ fontSize: 12, color: '#595959', marginBottom: 8 }}>
                対象テーブル：jn_weekly_assignment_table
                <br />
                検索条件：年度＝{year}、社員番号＝{deleteTarget.employeeNo}
              </div>
              {deleteTarget.weeklyCount > 0 ? (
                <Checkbox
                  checked={deleteWeekly}
                  onChange={(e) => setDeleteWeekly(e.target.checked)}
                >
                  要員稼動管理の情報（週割当 {deleteTarget.weeklyCount} 件）も
                  削除する
                </Checkbox>
              ) : (
                <Text type='secondary' style={{ fontSize: 12 }}>
                  当年度の週割当データは登録されていません。
                </Text>
              )}
            </div>

            {deleteTarget.weeklyCount === 0 && (
              <Text type='secondary' style={{ fontSize: 12 }}>
                ※ 要員情報（jn_personnel_master）のみ削除されます。
              </Text>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default PersonnelInfoScreen;
