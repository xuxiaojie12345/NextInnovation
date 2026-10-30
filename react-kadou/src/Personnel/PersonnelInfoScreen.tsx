import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
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
    line: r.line,
  }));

interface PersonnelInfoScreenProps {
  /** 表示する年度 */
  year: number;
  /** 要員一覧（社員番号で 役割・名前・所属 を引く。マスタを兼ねる） */
  personnel: Personnel[];
  /** 部門マスタ（所属の選択肢。部門管理画面で管理する） */
  departments: Department[];
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
   * 社員番号で突合し、既存は上書き（更新）・新規は追加する
   */
  onImport: (rows: PersonnelImportRow[]) => void;
  /**
   * 要員マスタの削除
   * 当年度の稼働表行・割当・BUFFER も削除する（他年度は変更しない）
   */
  onDelete: (employeeNo: string) => void;
  /** 当年度に稼働データ（行・割当・BUFFER）があるか（削除確認の表示判定） */
  hasWorkData: (employeeNo: string) => boolean;
}

/**
 * 要員情報 画面（メニュー「要員情報」で切り替わる画面）
 * 社員番号を入力すると、該当する要員の 役割・名前・所属 を表示する。
 * すべての項目は編集でき、存在しない社員番号は確認のうえで新規追加できる。
 */
const PersonnelInfoScreen: React.FC<PersonnelInfoScreenProps> = ({
  year,
  personnel,
  departments,
  onSubmit,
  onImport,
  onDelete,
  hasWorkData,
}) => {
  // 入力中の社員番号
  const [employeeNo, setEmployeeNo] = useState('');
  // 役割（編集可）
  const [role, setRole] = useState('');
  // 名前（編集可）
  const [name, setName] = useState('');
  // 所属（編集可。部門マスタの departmentId）
  const [deptId, setDeptId] = useState<string | undefined>(undefined);
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

  /** 入力中の社員番号が、検索済みかつ DB に存在する要員か（更新／削除ボタンの表示に使用） */
  const isVerified = verifiedNo !== '' && verifiedNo === employeeNo.trim();
  const isExisting = isVerified && verifiedExists;

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
    (!isExisting &&
      original.deptId !==
        (deptId ?? departments[0]?.departmentId ?? undefined));

  /** 入力値を初期化 */
  const handleReset = () => {
    setEmployeeNo('');
    setRole('');
    setName('');
    setDeptId(undefined);
    setVerifiedNo('');
    setVerifiedExists(false);
    setOriginal(null);
  };
  /**
   * 表示中の要員を削除する（バックエンドの DB から削除）。
   *
   * NOTE: 誤操作防止のため、必ず確認ダイアログを表示してから削除する。
   *       当年度に稼働データ（行・割当・BUFFER）がある場合は、
   *       それらも削除される旨をあわせて表示する。
   */
  const handleDelete = () => {
    const no = employeeNo.trim();
    if (!no || !isExisting) return;
    const doDelete = async () => {
      try {
        await deletePersonnel(no, year);
        // 画面側（App の要員一覧）にも反映する
        onDelete(no);
        handleReset();
        message.success(`社員番号「${no}」を削除しました。`);
        await reloadPersonnelCount();
      } catch (e) {
        message.error(
          e instanceof Error
            ? `削除に失敗しました：${e.message}`
            : '削除に失敗しました。',
        );
      }
    };
    const withWorkData = hasWorkData(no);
    Modal.confirm({
      title: '要員の削除',
      content: withWorkData ? (
        <div>
          <div>
            社員番号「{no}」（{name.trim() || '－'}）を削除します。
          </div>
          <div style={{ marginTop: 8 }}>
            当年度の稼働表行・割当・BUFFERも削除されますが、よろしいでしょうか。
          </div>
        </div>
      ) : (
        <div>
          <div>
            社員番号「{no}」（{name.trim() || '－'}）を削除します。
          </div>
          <div style={{ marginTop: 8 }}>
            この操作は取り消せません。よろしいでしょうか。
          </div>
        </div>
      ),
      okText: '削除',
      cancelText: 'キャンセル',
      okButtonProps: { danger: true },
      onOk: doDelete,
    });
  };

  /**
   * 社員番号で要員情報を表示する（バックエンド API 経由）。
   * GET /api/kadou/personnel/{employeeNo}/{year}
   * マスタに存在しない場合（404）は、新規追加するか確認する。
   */
  const handleLookup = async (rawNo: string) => {
    const no = rawNo.trim();
    if (!no) {
      message.warning('社員番号を入力してください。');
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
        deptId: deptId ?? departments[0]?.departmentId ?? undefined,
      });
      message.success(`社員番号「${no}」の要員情報を表示しました。`);
    } catch (e) {
      // 該当なし（404 など）→ 新規追加するか確認する
      setEmployeeNo(no);
      setVerifiedNo(no);
      setVerifiedExists(false);
      Modal.confirm({
        title: '社員番号が存在しません',
        content:
          e instanceof Error && e.message.includes('見つかりません')
            ? e.message
            : `社員番号「${no}」は要員マスタに存在しません。新規要員として追加しますか？`,
        okText: '追加する',
        cancelText: 'キャンセル',
        onOk: () => {
          setRole('');
          setName('');
          setDeptId(undefined);
          message.info(
            `社員番号「${no}」を新規追加します。役割・名前・所属を入力してください。`,
          );
        },
      });
    } finally {
      setSearching(false);
    }
  };

  /** 要員を DB へ保存する（新規追加／更新。画面遷移はしない） */
  const save = async (no: string, isNew: boolean) => {
    setSaving(true);
    try {
      await savePersonnel(no, year, {
        name: name.trim(),
        departmentId: deptId ?? departments[0]?.departmentId ?? undefined,
        role: role.trim() || '要員',
      });

      // 画面側（App の要員一覧）にも反映する
      onSubmit({
        employeeNo: no,
        name: name.trim(),
        departmentId: deptId ?? departments[0]?.departmentId ?? '',
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
        deptId: deptId ?? departments[0]?.departmentId ?? undefined,
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
    if (!no) {
      message.warning('社員番号を入力してください。');
      return;
    }
    if (!name.trim()) {
      message.warning('名前を入力してください。');
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
          : undefined) ?? departments[0]?.departmentId;
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

    // DB に存在しない → 新規追加してよいか確認する
    Modal.confirm({
      title: '社員番号が存在しません',
      content: `社員番号「${no}」は要員マスタに存在しません。新規要員として追加しますか？`,
      okText: '追加する',
      cancelText: 'キャンセル',
      onOk: () => {
        void save(no, true);
      },
    });
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

      // 事前検証（DB へは書き込まない）
      const apiRows = toApiRows(parsed.rows);
      let check: PersonnelImportApiResult;
      try {
        check = await importPersonnelRows(year, apiRows, { dryRun: true });
        setImportCheck(check);
        setImportRows(parsed.rows);
      } catch (e) {
        if (e instanceof PersonnelImportAbortedError) {
          // 409 = ファイル全体中止。既存データとの重複は「上書きして取り込む」で
          // 続行できるため、その場合はプレビューを開いてボタンで選ばせる。
          setImportCheck(e.result);
          if (e.result.duplicated > 0) {
            setImportRows(parsed.rows);
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
    const hasDuplicates = (importCheck?.duplicated ?? 0) > 0;
    setSubmittingImport(true);
    try {
      // 年度 + 社員番号で判定し、存在すれば更新・なければ追加する（バックエンド側で実施）
      const result = await importPersonnelRows(year, toApiRows(importRows), {
        overwrite: hasDuplicates,
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

  /** 一括読み込み：部門マスタに存在しない所属（警告表示用） */
  const unknownDepartments = useMemo(() => {
    if (!importRows) return [];
    const names = new Set(departments.map((d) => d.name));
    return Array.from(
      new Set(
        importRows
          .map((r) => r.department)
          .filter((d) => d !== '' && !names.has(d)),
      ),
    );
  }, [departments, importRows]);

  /** 一括読み込み：プレビュー表の列 */
  const importColumns: TableColumnsType<PersonnelImportRow> = [
    {
      title: '区分',
      key: 'kind',
      width: 72,
      render: (_, row) =>
        masterByNo.has(row.employeeNo) ? (
          <Tag color='gold'>上書き</Tag>
        ) : (
          <Tag color='green'>追加</Tag>
        ),
    },
    { title: '社員番号', dataIndex: 'employeeNo', key: 'employeeNo', width: 110 },
    { title: '名前', dataIndex: 'name', key: 'name', width: 140 },
    { title: '役割', dataIndex: 'role', key: 'role', width: 100 },
    { title: '所属', dataIndex: 'department', key: 'department', width: 130 },
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
            <Tag color='green'>バックエンド連携</Tag>
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
                maxLength={10}
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
          </div>
          <div>
            <div className='form-label'>役割</div>
            <Input
              placeholder='例：T11E03'
              value={role}
              maxLength={30}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div>
            <div className='form-label'>名前（必須）</div>
            <Input
              placeholder='例：山田 花子'
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              onPressEnter={handleSubmit}
            />
          </div>
          <div>
            <div className='form-label'>所属</div>
            {/*
              新規追加時のみ選択可。検索で DB に存在した要員（isExisting）は
              所属の変更を禁止してグレーアウトする。
            */}
            <Select
              placeholder='所属を選択'
              value={deptId}
              onChange={(v?: string) => setDeptId(v)}
              options={departments.map((d) => ({
                value: d.departmentId,
                label: departmentLabelOf(departments, d.departmentId),
              }))}
              disabled={isExisting}
              style={{ width: '100%' }}
            />
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
                  ? `${importFileName}（${importSource}）を読み込みました。重複した社員番号は 名前・役割・所属 を上書きし、新規の社員番号は追加します。中止した場合は 1 件も反映されません。`
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
            {unknownDepartments.length > 0 && (
              <Alert
                type='info'
                showIcon
                message='部門マスタに無い所属があります'
                description={`${unknownDepartments.join(
                  '、',
                )}（取り込み自体は行います。部門管理画面で登録してください）`}
              />
            )}
            {importWarnings.length > 0 && (
              <Alert
                type='error'
                showIcon
                message={`取り込まなかった行：${importWarnings.length} 件`}
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
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default PersonnelInfoScreen;
