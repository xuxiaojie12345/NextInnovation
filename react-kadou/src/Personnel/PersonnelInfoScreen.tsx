import React, { useMemo, useState } from 'react';
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
import {
  departmentLabelOf,
  resolveDepartmentIdByName,
} from '../data/departmentUtils';
import {
  buildPersonnelSaveValues,
  departmentExists,
  hasMissingDepartment,
} from '../data/departmentRules';
import {
  PERSONNEL_IMPORT_ACCEPT,
  PERSONNEL_IMPORT_FORMAT_HINT,
  PersonnelImportRow,
  countPersonnelImport,
  parsePersonnelFile,
} from './personnelImport';

const { Title, Text } = Typography;

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
    role: string;
    /** 新規登録時のみ。既存の更新では指定しない（所属は異動でのみ変更する） */
    departmentId?: string;
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
  // 「新規追加してよい」と確認済みの社員番号（同じ番号での二重確認を防ぐ）
  const [confirmedNo, setConfirmedNo] = useState('');
  // 一括読み込み：ファイル解析中フラグ
  const [importing, setImporting] = useState(false);
  // 一括読み込み：解析結果（プレビュー用。null = ダイアログ非表示）
  const [importRows, setImportRows] = useState<PersonnelImportRow[] | null>(null);
  // 一括読み込み：ファイル名 / 読み取り元 / 取り込まなかった行の警告
  const [importFileName, setImportFileName] = useState('');
  const [importSource, setImportSource] = useState('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  /** 社員番号 → 要員（社員マスタ） */
  const masterByNo = useMemo(
    () => new Map(personnel.map((p) => [p.employeeNo, p])),
    [personnel],
  );

  /** 入力中の社員番号が既存の要員か（登録ボタンの表示切り替えに使用） */
  const isExisting = masterByNo.has(employeeNo.trim());

  /** 入力値を初期化 */
  const handleReset = () => {
    setEmployeeNo('');
    setRole('');
    setName('');
    setDeptId(undefined);
    setConfirmedNo('');
  };

  /**
   * 表示中の要員を削除する。
   * 当年度に稼働データ（行・割当・BUFFER）がある場合のみ確認する。
   */
  const handleDelete = () => {
    const no = employeeNo.trim();
    if (!no || !masterByNo.has(no)) return;
    const doDelete = () => {
      onDelete(no);
      handleReset();
      message.success(`社員番号「${no}」を削除しました。`);
    };
    if (hasWorkData(no)) {
      Modal.confirm({
        title: '要員の削除',
        content:
          '当年度の稼働表行・割当・BUFFERも削除されますが、よろしいでしょうか。',
        okText: '削除',
        cancelText: 'キャンセル',
        okButtonProps: { danger: true },
        onOk: doDelete,
      });
      return;
    }
    doDelete();
  };

  /**
   * 社員番号で要員情報を表示する。
   * マスタに存在しない場合は、新規追加するか確認する。
   */
  const handleLookup = (rawNo: string) => {
    const no = rawNo.trim();
    if (!no) {
      message.warning('社員番号を入力してください。');
      return;
    }

    const master = masterByNo.get(no);
    if (master) {
      // 既存の要員 → 役割・名前・所属 を表示する
      setEmployeeNo(no);
      setRole(master.role);
      setName(master.name);
      setDeptId(master.departmentId || undefined);
      setConfirmedNo('');
      message.success(`社員番号「${no}」の要員情報を表示しました。`);
      return;
    }

    // 存在しない社員番号 → 追加するか確認する
    setEmployeeNo(no);
    Modal.confirm({
      title: '社員番号が存在しません',
      content: `社員番号「${no}」は要員マスタに存在しません。新規要員として追加しますか？`,
      okText: '追加する',
      cancelText: 'キャンセル',
      onOk: () => {
        setRole('');
        setName('');
        setDeptId(undefined);
        setConfirmedNo(no);
        message.info(
          `社員番号「${no}」を新規追加します。役割・名前・所属を入力してください。`,
        );
      },
    });
  };

  /** 要員一覧へ反映する（追加／更新。画面遷移はしない） */
  const save = (no: string, isNew: boolean) => {
    onSubmit(
      buildPersonnelSaveValues(
        {
          employeeNo: no,
          name: name.trim(),
          role: role.trim() || '要員',
          departmentId: deptId,
        },
        isNew,
      ),
    );
    message.success(
      isNew
        ? `社員番号「${no}」の要員情報を追加しました（モック）。`
        : `社員番号「${no}」の要員情報を更新しました（モック）。`,
    );
    handleReset();
  };

  /** 登録（追加／更新）。未確認の新規社員番号は追加確認を行う */
  const handleSubmit = () => {
    const no = employeeNo.trim();
    if (!no) {
      message.warning('社員番号を入力してください。');
      return;
    }
    if (!name.trim()) {
      message.warning('名前を入力してください。');
      return;
    }

    const master = masterByNo.get(no);

    // 既存の要員 → 所属が未設定なら保存できない
    if (master) {
      if (hasMissingDepartment(master)) {
        message.error(
          '所属が未設定のため保存できません。一括読み込みで所属を設定してください。',
        );
        return;
      }
      save(no, false);
      return;
    }

    // 新規の要員 → 所属は必須
    if (!deptId) {
      message.warning('所属を選択してください。');
      return;
    }
    if (!departmentExists(departments, deptId)) {
      message.error('選択した所属は部門マスタに存在しません。');
      return;
    }

    // 確認済みの新規社員番号 → そのまま追加する
    if (confirmedNo === no) {
      save(no, true);
      return;
    }

    // 未確認の新規社員番号 → 追加確認を行う
    Modal.confirm({
      title: '社員番号が存在しません',
      content: `社員番号「${no}」は要員マスタに存在しません。新規要員として追加しますか？`,
      okText: '追加する',
      cancelText: 'キャンセル',
      onOk: () => {
        setConfirmedNo(no);
        save(no, true);
      },
    });
  };

  /** 一括読み込み：社員情報ファイル（Excel / CSV）を解析してプレビューを表示する */
  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const result = await parsePersonnelFile(file);
      if (result.rows.length === 0) {
        message.error(
          `一括読み込み：取り込める社員情報がありませんでした（${file.name}）。`,
        );
        return;
      }
      setImportFileName(file.name);
      setImportSource(result.source);
      setImportRows(result.rows);
      setImportWarnings(result.warnings);
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
    setImportWarnings([]);
    setImportFileName('');
    setImportSource('');
  };

  /** 一括読み込み：所属の解決エラー（1 件でもあれば取り込まない） */
  const importDepartmentErrors = useMemo(() => {
    if (!importRows) return [];
    const errors: string[] = [];
    importRows.forEach((row) => {
      const isNew = !masterByNo.has(row.employeeNo);
      const departmentName = row.department.trim();
      if (departmentName === '') {
        if (isNew) {
          errors.push(`社員番号 ${row.employeeNo}：新規社員は所属が必須です`);
        }
        return;
      }
      if (resolveDepartmentIdByName(departments, departmentName) === null) {
        errors.push(
          `社員番号 ${row.employeeNo}：所属「${departmentName}」が部門マスタに存在しないか、同名部門が複数あります`,
        );
      }
    });
    return errors;
  }, [departments, importRows, masterByNo]);

  /** 一括読み込み：プレビュー内容で要員一覧（モック DB）を上書きする */
  const handleImportConfirm = () => {
    if (!importRows) return;
    if (importDepartmentErrors.length > 0) {
      message.error(
        '所属が解決できない行があるため取り込みできません。内容を修正してください。',
      );
      return;
    }
    const { added, updated } = countPersonnelImport(personnel, importRows);
    onImport(importRows);
    message.success(
      `社員情報を一括読み込みしました：追加 ${added} 件 / 上書き ${updated} 件（モック）。`,
    );
    if (importWarnings.length > 0) {
      message.warning(
        `取り込まなかった行が ${importWarnings.length} 件あります（${importWarnings[0]}${
          importWarnings.length > 1 ? ' ほか' : ''
        }）。`,
      );
    }
    handleImportCancel();
  };

  /** 一括読み込み：追加／上書きの件数 */
  const importCounts = useMemo(
    () =>
      importRows
        ? countPersonnelImport(personnel, importRows)
        : { added: 0, updated: 0 },
    [personnel, importRows],
  );

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
            を表示します。役割・名前は編集できますが、所属は新規登録時のみ選択でき、
            変更は稼働表の「異動」で行います。存在しない社員番号は確認のうえで新規追加できます。
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
            <Tag color='blue'>フロント モック（バックエンド未接続）</Tag>
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
          <Text type='secondary'>現在の登録要員数：{personnel.length} 名</Text>
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
                  setEmployeeNo(e.target.value);
                  // 表示中の社員番号が変わったら「追加確認済み」を解除する
                  setConfirmedNo('');
                  // 別の社員の所属を引き継がないようにクリアする
                  setDeptId(undefined);
                }}
                onPressEnter={() => handleLookup(employeeNo)}
              />
              <Button
                icon={<SearchOutlined />}
                onClick={() => handleLookup(employeeNo)}
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
            {isExisting ? (
              <>
                <Input
                  value={
                    masterByNo.get(employeeNo.trim())?.departmentId
                      ? departmentLabelOf(
                          departments,
                          masterByNo.get(employeeNo.trim())?.departmentId ?? '',
                        )
                      : '（未設定）'
                  }
                  disabled
                />
                <Text type='secondary' className='personnel-import-hint'>
                  所属は稼働表の「異動」でのみ変更できます。
                </Text>
              </>
            ) : (
              <Select
                placeholder='所属を選択'
                value={deptId}
                onChange={(v?: string) => setDeptId(v)}
                options={departments.map((d) => ({
                  value: d.departmentId,
                  label: departmentLabelOf(departments, d.departmentId),
                }))}
                style={{ width: '100%' }}
              />
            )}
          </div>

          <Space wrap>
            <Button
              type='primary'
              icon={<CheckOutlined />}
              onClick={handleSubmit}
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

      {/* 一括読み込み：プレビュー（内容を確認してから上書きする） */}
      <Modal
        open={importRows !== null}
        title='社員情報の一括読み込み'
        okText='上書きする'
        cancelText='キャンセル'
        onOk={handleImportConfirm}
        onCancel={handleImportCancel}
        okButtonProps={{ disabled: importDepartmentErrors.length > 0 }}
        width={760}
      >
        {importRows && (
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <Alert
              type='warning'
              showIcon
              message='既存の要員情報を上書きします'
              description={`${importFileName}（${importSource}）を読み込みました。同じ社員番号の要員は 名前・役割・所属 を上書きし（所属列が空欄なら現在の所属を保持）、Excel に無い要員はそのまま残します。`}
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
            </Space>
            {importDepartmentErrors.length > 0 && (
              <Alert
                type='error'
                showIcon
                message={`所属を解決できない行：${importDepartmentErrors.length} 件`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {importDepartmentErrors.slice(0, 5).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                    {importDepartmentErrors.length > 5 && (
                      <li>ほか {importDepartmentErrors.length - 5} 件</li>
                    )}
                  </ul>
                }
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
