import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Popconfirm,
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
  DownloadOutlined,
  EditOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { Holiday, HolidayKind } from '../data/yearStore';
import {
  HOLIDAY_IMPORT_ACCEPT,
  HOLIDAY_IMPORT_FORMAT_HINT,
  parseHolidayFile,
} from './holidayImport';
import {
  HolidayApiError,
  addHoliday,
  deleteHoliday,
  importHolidays,
  loadHolidays,
  updateHoliday,
} from './holidayApi';
import './HolidaySettingsScreen.css';

const { Title, Text } = Typography;

/** 区分一覧 */
const KINDS: HolidayKind[] = ['祝日', '会社休日', '振替休日'];

/** 区分ごとの表示色 */
const KIND_COLOR: Record<HolidayKind, string> = {
  祝日: 'red',
  会社休日: 'blue',
  振替休日: 'orange',
};

/** 区分の選択肢 */
const KIND_OPTIONS = KINDS.map((k) => ({ value: k, label: k }));

/** 区分の表示色（未設定は既定色） */
const kindColor = (kind: HolidayKind | '') =>
  kind ? KIND_COLOR[kind] : 'default';

/** 区分の表示名（未設定を含む） */
const kindLabel = (kind: HolidayKind | '') => kind || '未設定';

/** メッセージ用の休日名称（未入力の場合の表記） */
const holidayNameLabel = (name: string) => name || '名称未設定';

/** CSV 出力の見出し */
const CSV_HEADER = '日付,名称,区分';

/** 日付の表示形式 */
const formatDate = (date: string) => dayjs(date).format('YYYY/MM/DD (ddd)');

/** CSV 出力用に値をエスケープする */
const csvEscape = (v: string): string =>
  /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

interface HolidaySettingsScreenProps {
  /** 表示する年度 */
  year: number;
  /** その年度の休日（App 側で年度ごとに保持） */
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
}

/**
 * 休日設置 画面（メニュー「休日設置」で切り替わる画面）
 * 追加・編集・削除に加え、CSV 出力と Excel / CSV の一括読み込みに対応する。
 * ※休日は年度ごとのデータ（年度切替で表示が切り替わる）
 */
const HolidaySettingsScreen: React.FC<HolidaySettingsScreenProps> = ({
  year,
  holidays,
  setHolidays,
}) => {
  // 編集中の休日ID（null = 新規追加モード）
  const [editingId, setEditingId] = useState<string | null>(null);

  // フォーム（新規追加 / 編集で共用）
  const [newDate, setNewDate] = useState<Dayjs | null>(null);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<HolidayKind | ''>('');

  // 編集開始時にフォームへスクロールするための参照
  const formRef = useRef<HTMLDivElement>(null);

  // 一括読み込み：ファイル解析中フラグ
  const [importing, setImporting] = useState(false);

  // 一覧取得中 / 登録中フラグ
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // setHolidays は App 側で年度や保存内容が変わるたびに作り直されるため、
  // 取得処理の依存配列から外すために最新の関数を参照で保持する
  const setHolidaysRef = useRef(setHolidays);

  useEffect(() => {
    setHolidaysRef.current = setHolidays;
  });

  /** 初期表示（および年度切替）時に、その年度の休日一覧を API から取得する */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadHolidays(year)
      .then((list) => {
        if (!cancelled) setHolidaysRef.current(list);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const detail =
          error instanceof Error ? error.message : '不明なエラー';
        message.error(
          `${year}年度の休日情報を取得できませんでした：${detail}`,
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const isEditing = editingId !== null;

  /** 選択中年度の休日のみを対象にした集計 */
  const summary = useMemo(() => {
    const list = holidays.filter((h) => dayjs(h.date).year() === year);
    return {
      year,
      total: list.length,
      unset: list.filter((h) => !h.kind).length,
      byKind: KINDS.map((k) => ({
        kind: k,
        count: list.filter((h) => h.kind === k).length,
      })),
    };
  }, [holidays, year]);

  /** 日付順に並べる */
  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [holidays],
  );

  /** 入力値を初期化（編集モードも解除） */
  const handleResetForm = useCallback(() => {
    setEditingId(null);
    setNewDate(null);
    setNewName('');
    setNewKind('');
  }, []);

  /** 追加 or 更新（日付のみ必須 / 名称・区分は任意 / 同一日付は登録不可） */
  const handleSubmit = async () => {
    if (!newDate) {
      message.warning('日付を選択してください。');
      return;
    }
    // 名称は任意のため、未入力（空文字）でも登録できる
    const name = newName.trim();
    const date = newDate.format('YYYY-MM-DD');
    const duplicate = holidays.find((h) => h.date === date && h.id !== editingId);
    if (duplicate) {
      message.warning(`${formatDate(date)} は既に登録されています。`);
      return;
    }

    if (editingId) {
      // 一括読み込みなどフロントのみの行は従来どおりローカル更新する
      if (!editingId.startsWith('db-')) {
        setHolidays((prev) =>
          prev.map((h) =>
            h.id === editingId ? { ...h, date, name, kind: newKind } : h,
          ),
        );
        message.success(
          `${formatDate(date)}「${holidayNameLabel(name)}」を更新しました（モック）。`,
        );
        handleResetForm();
        return;
      }

      // テーブル（JN_HOLIDAY_MASTER）のレコードを更新し、一覧を即時反映する
      setSubmitting(true);
      try {
        const updated = await updateHoliday(year, editingId.slice('db-'.length), {
          date,
          name,
          kind: newKind,
        });
        setHolidays((prev) =>
          prev.map((h) => (h.id === editingId ? updated : h)),
        );
        message.success(`${formatDate(date)}「${holidayNameLabel(name)}」を更新しました。`);
        handleResetForm();
      } catch (error) {
        if (error instanceof HolidayApiError && error.status === 409) {
          message.warning(error.message);
        } else {
          const detail =
            error instanceof Error ? error.message : '不明なエラー';
          message.error(`休日の更新に失敗しました：${detail}`);
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 新規追加：テーブル（JN_HOLIDAY_MASTER）に同一日付がなければ登録する。
    // 登録後は一覧へ即時反映する（重複はバックエンドが 409 で返す）。
    setSubmitting(true);
    try {
      const created = await addHoliday(year, { date, name, kind: newKind });
      setHolidays((prev) => [
        ...prev.filter((h) => h.date !== created.date),
        created,
      ]);
      message.success(`${formatDate(date)}「${holidayNameLabel(name)}」を登録しました。`);
      handleResetForm();
    } catch (error) {
      if (error instanceof HolidayApiError && error.status === 409) {
        message.warning(error.message);
      } else {
        const detail =
          error instanceof Error ? error.message : '不明なエラー';
        message.error(`休日の登録に失敗しました：${detail}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** 編集（選択した休日をフォームへ読み込む） */
  const handleEdit = useCallback((row: Holiday) => {
    setEditingId(row.id);
    setNewDate(dayjs(row.date));
    setNewName(row.name);
    setNewKind(row.kind);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** 削除（確認ダイアログで「削除」を押した後に実行） */
  const handleDelete = useCallback(
    async (row: Holiday) => {
      // 一括読み込みなどフロントのみの行はローカルから削除する
      if (!row.id.startsWith('db-')) {
        setHolidays((prev) => prev.filter((h) => h.id !== row.id));
        setEditingId((prev) => (prev === row.id ? null : prev));
        message.success(
          `${formatDate(row.date)}「${holidayNameLabel(row.name)}」を削除しました。`,
        );
        return;
      }

      // テーブル（JN_HOLIDAY_MASTER）から削除し、一覧を即時反映する
      try {
        await deleteHoliday(year, row.id.slice('db-'.length));
        setHolidays((prev) => prev.filter((h) => h.id !== row.id));
        // 削除した行を編集中だった場合はフォームを初期化
        setEditingId((prev) => (prev === row.id ? null : prev));
        message.success(
          `${formatDate(row.date)}「${holidayNameLabel(row.name)}」を削除しました。`,
        );
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : '不明なエラー';
        message.error(`休日の削除に失敗しました：${detail}`);
      }
    },
    [year, setHolidays],
  );

  /** CSV 出力（Excel で開けるよう BOM 付き UTF-8 / CRLF） */
  const handleExport = () => {
    const rows = sortedHolidays.map((h) =>
      [h.date, h.name, h.kind].map(csvEscape).join(','),
    );
    const csv = `\uFEFF${[CSV_HEADER, ...rows].join('\r\n')}\r\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `休日一覧_${dayjs().format('YYYYMMDD')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(`${sortedHolidays.length} 件を CSV 出力しました。`);
  };

  /**
   * 一括読み込み：休日情報ファイル（Excel / CSV）を解析し、
   * JN_HOLIDAY_MASTER へ一括登録する（同一日付は上書き・新規日付は追加）。
   */
  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const result = await parseHolidayFile(file, year);
      if (result.rows.length === 0) {
        const detail =
          result.warnings.length > 0
            ? `（${result.warnings[0]}${
                result.warnings.length > 1 ? ' ほか' : ''
              }）`
            : '';
        message.error(
          `一括読み込み：取り込める休日がありませんでした（${file.name}）${detail}`,
        );
        return;
      }

      // 読み込んだ休日をテーブル（JN_HOLIDAY_MASTER）へ一括登録する。
      // 同一日付の既存レコードは上書き、新規日付は追加される。
      const saved = await importHolidays(
        year,
        result.rows.map((row) => ({
          date: row.date,
          name: row.name,
          kind: row.kind,
        })),
      );

      // 登録後の一覧で画面を更新する
      setHolidays(saved.holidays);

      message.success(
        `休日を一括読み込みしました：追加 ${saved.added} 件 / 上書き ${saved.updated} 件。`,
      );

      if (result.warnings.length > 0) {
        message.warning(
          `取り込まなかった行などが ${result.warnings.length} 件あります（${result.warnings[0]}${
            result.warnings.length > 1 ? ' ほか' : ''
          }）。`,
        );
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

  const columns: TableColumnsType<Holiday> = useMemo(
    () => [
      {
        title: '日付',
        dataIndex: 'date',
        key: 'date',
        width: 200,
        render: (v: string) => formatDate(v),
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        render: (v: string) => v || <Text type='secondary'>未設定</Text>,
      },
      {
        title: '区分',
        dataIndex: 'kind',
        key: 'kind',
        width: 120,
        align: 'center',
        render: (v: HolidayKind | '') => (
          <Tag color={kindColor(v)}>{kindLabel(v)}</Tag>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 170,
        align: 'center',
        render: (_, row) => (
          <Space size={0}>
            <Button
              type='link'
              size='small'
              icon={<EditOutlined />}
              onClick={() => handleEdit(row)}
            >
              編集
            </Button>
            <Popconfirm
              title='削除の確認'
              description={`${formatDate(row.date)}「${holidayNameLabel(
                row.name,
              )}」を削除しますか？`}
              okText='削除'
              cancelText='キャンセル'
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(row)}
            >
              <Button
                type='text'
                danger
                size='small'
                icon={<DeleteOutlined />}
              >
                削除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [handleEdit, handleDelete],
  );

  return (
    <div className='screen-page'>
      {/* 画面ヘッダー */}
      <div className='screen-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {year}年度　休日設置
          </Title>
          <Text type='secondary'>
            稼働管理の対象となる休日（祝日・会社休日・振替休日）を登録します。日付のみ必須で、名称・区分は任意です。休日は年度ごとのデータで、年度切替で表示が切り替わります。
          </Text>
        </div>
        <Tag color='green'>
          バックエンド接続（一覧・一括読込・追加・編集・削除）
        </Tag>
      </div>

      <div ref={formRef}>
        {/* 追加 / 編集フォーム */}
        <Card
          title={isEditing ? '休日の編集' : '休日の追加'}
          className='screen-card'
          extra={isEditing ? <Tag color='blue'>編集中</Tag> : undefined}
        >
          <Space wrap align='end' size='middle'>
            <div>
              <div className='form-label'>日付（必須）</div>
              <DatePicker
                value={newDate}
                onChange={(d) => setNewDate(d)}
                format='YYYY/MM/DD'
                placeholder='日付を選択'
                style={{ width: 180 }}
              />
            </div>
            <div>
              <div className='form-label'>休日名称（任意）</div>
              <Input
                placeholder='例：創立記念日'
                value={newName}
                maxLength={30}
                onChange={(e) => setNewName(e.target.value)}
                onPressEnter={handleSubmit}
                style={{ width: 220 }}
              />
            </div>
            <div>
              <div className='form-label'>区分（任意）</div>
              <Select
                value={newKind || undefined}
                onChange={(v?: HolidayKind) => setNewKind(v ?? '')}
                options={KIND_OPTIONS}
                allowClear
                placeholder='未選択'
                style={{ width: 140 }}
              />
            </div>
            <Button
              type='primary'
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              loading={submitting}
            >
              {isEditing ? '更新する' : '追加する'}
            </Button>
            {isEditing && <Button onClick={handleResetForm}>キャンセル</Button>}
            <Button type='text' onClick={handleResetForm}>
              クリア
            </Button>
          </Space>
        </Card>
      </div>

      {/* 登録済み一覧 */}
      <Card
        title='登録済み休日'
        className='screen-card'
        style={{ marginTop: 12 }}
        extra={
          <Space size='small' wrap>
            <Text type='secondary'>
              {summary.year}年の休日：{summary.total} 件
            </Text>
            {summary.byKind.map((k) => (
              <Tag key={k.kind} color={KIND_COLOR[k.kind]}>
                {k.kind} {k.count}
              </Tag>
            ))}
            {summary.unset > 0 && <Tag>未設定 {summary.unset}</Tag>}
          </Space>
        }
      >
        {/* 一括読み込み / CSV 出力 */}
        <div className='holiday-toolbar'>
          <Upload
            accept={HOLIDAY_IMPORT_ACCEPT}
            showUploadList={false}
            multiple={false}
            disabled={importing}
            beforeUpload={(file) => {
              // ファイルはフロントで解析し、内容を API で一括登録する
              void handleImportFile(file);
              return false;
            }}
          >
            <Button
              type='primary'
              icon={<UploadOutlined />}
              loading={importing}
            >
              一括読み込む
            </Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            CSV出力
          </Button>
        </div>
        <Text type='secondary' className='holiday-import-hint'>
          {HOLIDAY_IMPORT_FORMAT_HINT}
        </Text>

        <Table<Holiday>
          rowKey='id'
          size='small'
          loading={loading}
          columns={columns}
          dataSource={sortedHolidays}
          rowClassName={(row) => (row.id === editingId ? 'holiday-row-editing' : '')}
          pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
        />
      </Card>
    </div>
  );
};

export default HolidaySettingsScreen;
