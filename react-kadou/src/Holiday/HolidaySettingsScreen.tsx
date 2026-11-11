import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
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
  Upload,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import {
  HOLIDAY_KINDS as KINDS,
  HOLIDAY_KIND_OPTIONS as KIND_OPTIONS,
  HOLIDAY_KINDS_COUNT as KINDS_COUNT,
  formatDate,
  csvEscape,
  KIND_COLOR,
  HOLIDAY_IMPORT_ACCEPT,
} from "../constants/options";
import "./HolidaySettingsScreen.css";
import {
  HolidayInitApi,
  HolidayAddApi,
  HolidayUpdateApi,
  HolidayDeleteApi,
  HolidayImportApi,
} from "../api/holiday";
import {
  Holiday,
  HolidayKind,
  HolidaySettingsScreenProps,
} from "./HolidaySettingMode";
import { parseHolidayFile } from "./HolidayImport";
import { apiErrorMessage } from "../utils/errorMessage";
import { isApiError } from "../utils/ApiError";

const { Title, Text } = Typography;

/**
 * 休日設置 画面（メニュー「休日設置」で切り替わる画面）
 * 追加・編集・削除に加え、CSV 出力と Excel / CSV の一括読み込みに対応する。
 * ※休日は年度ごとのデータ（年度切替で表示が切り替わる）
 */
const HolidaySettingsScreen: React.FC<HolidaySettingsScreenProps> = ({
  year,
  holidays,
  setHolidays,
  currentUserId,
}) => {
  useEffect(() => {
    // 初始化：请求后台接口、加载数据
    HolidayInitApi(year)
      .then((data) => {
        if (data) {
          setHolidays(data);
        }
      })
      .catch((err) => {
        message.error(apiErrorMessage(err));
      });
  }, [year]);

  const [editingId, setEditingId] = useState<string | null>(null);

  // フォーム（新規追加 / 編集で共用）
  const [newDate, setNewDate] = useState<Dayjs | null>(null);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<HolidayKind | null>(null);

  // 編集開始時にフォームへスクロールするための参照
  const formRef = useRef<HTMLDivElement>(null);

  // 一括読み込み：ファイル解析中フラグ
  const [importing, setImporting] = useState(false);

  const isEditing = editingId !== null;

  /** 選択中年度の休日のみを対象にした集計 */
  const summary = useMemo(() => {
    const list = holidays.filter((h) => dayjs(h.date).year() === year);
    return {
      year,
      total: list.length,
      byKind: KINDS_COUNT.map((k) => ({
        kind: k,
        count: list.filter((h) => h.kind === k).length,
      })),
      holidays,
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
    setNewName("");
    setNewKind(null);
  }, []);

  /** 追加 or 更新（日付・名称は必須 / 同一日付は登録不可） */
  const handleSubmit = () => {
    if (!newDate) {
      message.warning("日付を選択してください。");
      return;
    }
    const date = newDate.format("YYYY-MM-DD");
    const duplicate = holidays.find(
      (h) => h.date === date && h.id !== editingId,
    );

    if (duplicate) {
      message.warning(`${formatDate(date)} は既に登録されています。`);
      return;
    }

    if (editingId) {
      HolidayUpdateApi(year, currentUserId, {
        date: date,
        name: newName,
        kind: newKind,
        id: editingId,
      })
        .then((data) => {
          setHolidays(data);
          handleResetForm();
          message.success(`休日情報${formatDate(date)}を更新しました。`);
        })
        .catch((error) => {
          isApiError(error);
          message.error(apiErrorMessage(error));
        });
    } else {
      HolidayAddApi(year, currentUserId, {
        date: date,
        name: newName,
        kind: newKind,
        id: "0",
      })
        .then((data) => {
          setHolidays(data);
          handleResetForm();
          message.success(`休日情報${formatDate(date)}を追加しました。`);
        })
        .catch((error) => {
          message.error(apiErrorMessage(error));
        });
    }
    handleResetForm();
  };

  /** 編集（選択した休日をフォームへ読み込む） */
  const handleEdit = useCallback((row: Holiday) => {
    setEditingId(row.id);
    setNewDate(dayjs(row.date));
    setNewName(row.name);
    setNewKind(row.kind == "未指定" ? null : row.kind);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** 削除 */
  const handleDelete = useCallback(
    (row: Holiday) => {
      HolidayDeleteApi(year, row.id)
        .then((data) => {
          setHolidays(data);
          message.success(`休日情報${formatDate(row.date)}を削除しました。`);
        })
        .catch((error) => {
          isApiError(error);
          message.error(apiErrorMessage(error));
        });
    },
    [setHolidays],
  );

  /** CSV 出力（Excel で開けるよう BOM 付き UTF-8 / CRLF） */
  const handleExport = () => {
    const rows = sortedHolidays.map((h) => [h.date].map(csvEscape));
    const csv = `\uFEFF${[...rows].join("\r\n")}\r\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `休日一覧_${dayjs().format("YYYYMMDD")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(`${sortedHolidays.length} 件を CSV 出力しました。`);
  };

  /**
   * 一括読み込み：休日情報ファイル（Excel / CSV）を解析し、
   * 同一日付は上書き・新規日付は追加する（確認なし）。
   */
  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const result = await parseHolidayFile(file, year);

      if (result.error.length > 0) {
        message.error(
          `一括読み込み：解析に失敗しました（${file.name}）\n${result.error.join("\n")}`,
        );
        return;
      }

      if (result.rows.length === 0) {
        const detail =
          result.warnings.length > 0
            ? `（${result.warnings[0]}${
                result.warnings.length > 1 ? " ほか" : ""
              }）`
            : "";
        message.error(
          `一括読み込み：取り込める休日がありませんでした（${file.name}）${detail}`,
        );
        return;
      }

      // 既存日付は上書き、新規日付は追加する
      // 返回更新条数和新增条数

      const requestDatas: string[] = result.rows.map((Item) => Item.date);
      HolidayImportApi(year, currentUserId, requestDatas)
        .then((data) => {
          setHolidays(data);
          message.success(`休日を一括読み込みしました。`);
        })
        .catch((error) => {
          message.error(apiErrorMessage(error));
        });

      if (result.warnings.length > 0) {
        message.warning(
          `取り込まなかった行などが ${result.warnings.length} 件あります（${result.warnings[0]}${
            result.warnings.length > 1 ? " ほか" : ""
          }）。`,
        );
      }
    } catch (e) {
      message.error(
        e instanceof Error
          ? `一括読み込みに失敗しました：${e.message}`
          : "一括読み込みに失敗しました。",
      );
    } finally {
      setImporting(false);
    }
  };

  const columns: TableColumnsType<Holiday> = useMemo(
    () => [
      {
        title: "日付",
        dataIndex: "date",
        key: "date",
        width: 200,
        render: (v: string) => formatDate(v),
      },
      {
        title: "名称",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "区分",
        dataIndex: "kind",
        key: "kind",
        width: 120,
        align: "center",
        render: (v: HolidayKind) => <Tag color={KIND_COLOR[v]}>{v}</Tag>,
      },
      {
        title: "操作",
        key: "action",
        width: 170,
        align: "center",
        render: (_, row) => (
          <Space size={0}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(row)}
            >
              編集
            </Button>
            <Button
              type="text"
              danger
              size="small"
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
    <div className="screen-page">
      {/* 画面ヘッダー */}
      <div className="screen-header">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {year}年度　休日設置
          </Title>
          <Text type="secondary">
            稼働管理の対象となる休日（祝日・会社休日・振替休日）を登録します。休日は年度ごとのデータで、年度切替で表示が切り替わります。
          </Text>
        </div>
      </div>

      <div ref={formRef}>
        {/* 追加 / 編集フォーム */}
        <Card
          title={isEditing ? "休日の編集" : "休日の追加"}
          className="screen-card"
          extra={isEditing ? <Tag color="blue">編集中</Tag> : undefined}
        >
          <Space wrap align="end" size="middle">
            <div>
              <div className="form-label">日付（必須）</div>
              <DatePicker
                value={newDate}
                onChange={(d) => setNewDate(d)}
                format="YYYY/MM/DD"
                placeholder="日付を選択"
                style={{ width: 180 }}
              />
            </div>
            <div>
              <div className="form-label">休日名称</div>
              <Input
                placeholder="例：創立記念日"
                value={newName}
                maxLength={30}
                onChange={(e) => setNewName(e.target.value)}
                onPressEnter={handleSubmit}
                style={{ width: 220 }}
              />
            </div>
            <div>
              <div className="form-label">区分</div>
              <Select
                placeholder="例：会社休日"
                value={newKind}
                onChange={(v: HolidayKind) => setNewKind(v)}
                options={KIND_OPTIONS}
                style={{ width: 140 }}
              />
            </div>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
            >
              {isEditing ? "更新する" : "追加する"}
            </Button>
            {isEditing && <Button onClick={handleResetForm}>キャンセル</Button>}
            <Button type="text" onClick={handleResetForm}>
              クリア
            </Button>
          </Space>
        </Card>
      </div>

      {/* 登録済み一覧 */}
      <Card
        title="登録済み休日"
        className="screen-card"
        style={{ marginTop: 12 }}
        extra={
          <Space size="small" wrap>
            <Text type="secondary">
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
        {/* 一括読み込み / CSV 出力 */}
        <div className="holiday-toolbar">
          <Upload
            accept={HOLIDAY_IMPORT_ACCEPT}
            showUploadList={false}
            multiple={false}
            disabled={importing}
            beforeUpload={(file) => {
              // サーバーへは送信せず、フロントのみで解析する（モック）
              void handleImportFile(file);
              return false;
            }}
          >
            <Button
              type="primary"
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
        <Text type="secondary" className="holiday-import-hint">
          '形式：日付／名称／区分（1行目は見出し行）。日付は YYYY-MM-DD /
          YYYY/MM/DD、Excel の日付セルに対応。同じ日付は上書きします。'
        </Text>
        <Table<Holiday>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={sortedHolidays}
          rowClassName={(row) =>
            row.id === editingId ? "holiday-row-editing" : ""
          }
          pagination={{ pageSize: 8, size: "small", showSizeChanger: false }}
        />
      </Card>
    </div>
  );
};

export default HolidaySettingsScreen;
