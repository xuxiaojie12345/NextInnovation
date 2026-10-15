import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { Holiday, HolidayKind } from '../data/yearStore';
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
 * 追加・編集・削除に加え、CSV 出力に対応する。
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
  const [newKind, setNewKind] = useState<HolidayKind>('会社休日');

  // 編集開始時にフォームへスクロールするための参照
  const formRef = useRef<HTMLDivElement>(null);

  const isEditing = editingId !== null;

  /** 選択中年度の休日のみを対象にした集計 */
  const summary = useMemo(() => {
    const list = holidays.filter((h) => dayjs(h.date).year() === year);
    return {
      year,
      total: list.length,
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
    setNewKind('会社休日');
  }, []);

  /** 追加 or 更新（日付・名称は必須 / 同一日付は登録不可） */
  const handleSubmit = () => {
    if (!newDate) {
      message.warning('日付を選択してください。');
      return;
    }
    const name = newName.trim();
    if (!name) {
      message.warning('休日名称を入力してください。');
      return;
    }
    const date = newDate.format('YYYY-MM-DD');
    const duplicate = holidays.find((h) => h.date === date && h.id !== editingId);
    if (duplicate) {
      message.warning(`${formatDate(date)} は既に登録されています。`);
      return;
    }

    if (editingId) {
      setHolidays((prev) =>
        prev.map((h) => (h.id === editingId ? { ...h, date, name, kind: newKind } : h)),
      );
      message.success(`${formatDate(date)}「${name}」を更新しました（モック）。`);
    } else {
      setHolidays((prev) => [
        ...prev,
        { id: `h-${Date.now()}`, date, name, kind: newKind },
      ]);
      message.success(`${formatDate(date)}「${name}」を追加しました（モック）。`);
    }
    handleResetForm();
  };

  /** 編集（選択した休日をフォームへ読み込む） */
  const handleEdit = useCallback((row: Holiday) => {
    setEditingId(row.id);
    setNewDate(dayjs(row.date));
    setNewName(row.name);
    setNewKind(row.kind);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** 削除 */
  const handleDelete = useCallback((row: Holiday) => {
    setHolidays((prev) => prev.filter((h) => h.id !== row.id));
    // 削除した行を編集中だった場合はフォームを初期化
    setEditingId((prev) => (prev === row.id ? null : prev));
    message.success(`${formatDate(row.date)}「${row.name}」を削除しました（モック）。`);
  }, []);

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
      },
      {
        title: '区分',
        dataIndex: 'kind',
        key: 'kind',
        width: 120,
        align: 'center',
        render: (v: HolidayKind) => <Tag color={KIND_COLOR[v]}>{v}</Tag>,
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
            <Button
              type='text'
              danger
              size='small'
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(row)}
            >
              削除
            </Button>
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
            稼働管理の対象となる休日（祝日・会社休日・振替休日）を登録します。休日は年度ごとのデータで、年度切替で表示が切り替わります。
          </Text>
        </div>
        <Tag color='orange'>フロント モック（バックエンド未接続）</Tag>
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
              <div className='form-label'>休日名称（必須）</div>
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
              <div className='form-label'>区分</div>
              <Select
                value={newKind}
                onChange={(v: HolidayKind) => setNewKind(v)}
                options={KIND_OPTIONS}
                style={{ width: 140 }}
              />
            </div>
            <Button
              type='primary'
              icon={<CheckOutlined />}
              onClick={handleSubmit}
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
          </Space>
        }
      >
        {/* CSV 出力 */}
        <div className='holiday-toolbar'>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            CSV出力
          </Button>
        </div>

        <Table<Holiday>
          rowKey='id'
          size='small'
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
