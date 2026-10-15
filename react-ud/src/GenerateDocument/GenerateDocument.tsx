/**
 * GenerateDocument 组件 - 生成认证文档（起始输入画面）
 * ------------------------------------------------------------------
 * 对应【詳細設計UD03.md】：
 *  - 画面布局：背景 + 居中卡片，卡片内为表单区（Chassis series / Chassis no /
 *    Document type）+ 按钮区（Submit / Reset / Help）+ error message area
 *  - 控件 2.1：
 *      1. Chassis series(textfield, 必须, MaxLength=5, 半角英字, 左对齐, 空)
 *      2. Chassis no(textfield, 必须, MaxLength=10, 半角数字, 左对齐, 空)
 *      3. Document type(pull-downList, 必须, 半角英数字+記号, 左对齐, 空)
 *      4. Submit(button, 居中, 活性)
 *      5. Reset(button, 居中, 活性)
 *      6. Help(button, 居中, 活性)
 *      7. error message area(label, Output, 左对齐, 动态显示)
 *  - 业务 3.1.1 Submit：迁移到 Generate document 画面，并传递
 *    Chassis series / Chassis no / userID
 *  - 业务 3.1.2 Reset：清除画面所有输入内容
 *  - 业务 3.1.3 Help：迁移到 User Guide 画面
 *  - 接口 4：无（本画面不调用任何后端 API）
 *  - 异常 5：网络断开 / 500 错误消息
 *
 * @component
 * @returns {React.JSX.Element} 生成认证文档输入画面
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CHASSIS_NO_MAX_LENGTH,
  CHASSIS_SERIES_MAX_LENGTH,
  ERROR_MESSAGES,
  filterChassisNo,
  filterChassisSeries,
  normalize,
  validateGenerateDocumentForm,
} from './utils/validators';
import backgroundImage from '../fTRYDXFAD.jpeg';
import './GenerateDocument.css';

/** 迁移目标路由：Generate document 画面（详细设计 3.1.1） */
const GENERATE_DOCUMENT_PATH = '/generate-document-result';
/** 迁移目标路由：User Guide 画面（详细设计 3.1.3） */
const USER_GUIDE_PATH = '/user-guide';

/** 认证成功后保存用户信息的 sessionStorage 键名（与 Login 保持一致） */
const USER_STORAGE_KEY = 'edb_user_info';
/** 上一次提交条件的本地存储键名（详细设计 7.1：输入项默认回显上一次条件） */
const LAST_CONDITION_STORAGE_KEY = 'edb_last_generate_condition';

/** Document type 下拉列表的默认数据源（详细设计 3.1.1 由 HDOC_DOCUMENT_LIST.DOCTYPE 提供） */
const DEFAULT_DOCUMENT_TYPES = ['Homologation', 'Type Approval', 'Certificate'];

/** 画面标题文案 */
const SCREEN_TITLE = 'Generate Homologation Document';

/**
 * Document type 下拉选项的类型定义
 */
interface DocumentTypeOption {
  /** 选项值（对应 HDOC_DOCUMENT_LIST.DOCTYPE） */
  value: string;
  /** 选项显示文案 */
  label: string;
}

/**
 * 上一次提交条件的类型定义（用于本地存储回显）
 */
interface LastCondition {
  /** Chassis series */
  chassisSeries: string;
  /** Chassis no */
  chassisNo: string;
  /** Document type */
  documentType: string;
}

/**
 * 从 sessionStorage 读取当前登录的 userID
 * ------------------------------------------------------------------
 * 对应详细设计 3.1.1：Submit 时需将 userID 传递到后续画面。
 * Login.tsx 以 JSON 字符串形式保存 userid，此处兼容纯文本形式。
 *
 * @returns {string} 登录 userID；未登录或解析失败时返回空字符串
 */
function readLoggedInUserId(): string {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return '';
    const parsed = raw.startsWith('"')
      ? (JSON.parse(raw) as unknown)
      : JSON.parse(raw)?.userid;
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    return '';
  }
}

/**
 * 从 localStorage 读取上一次成功提交的条件
 * ------------------------------------------------------------------
 * 对应详细设计 7.1：输入项默认回显上一次提交的条件。
 * 读取失败或数据格式非法时返回空条件，保证画面仍可正常显示。
 *
 * @returns {LastCondition} 上一次提交条件
 */
function readLastCondition(): LastCondition {
  const emptyCondition: LastCondition = {
    chassisSeries: '',
    chassisNo: '',
    documentType: '',
  };
  try {
    const raw = localStorage.getItem(LAST_CONDITION_STORAGE_KEY);
    if (!raw) return emptyCondition;
    const parsed = JSON.parse(raw) as Partial<LastCondition>;
    return {
      chassisSeries: normalize(parsed.chassisSeries),
      chassisNo: normalize(parsed.chassisNo),
      documentType: normalize(parsed.documentType),
    };
  } catch {
    return emptyCondition;
  }
}

/**
 * 保存本次提交条件到 localStorage
 * @param condition 本次提交条件
 */
function saveLastCondition(condition: LastCondition): void {
  try {
    localStorage.setItem(
      LAST_CONDITION_STORAGE_KEY,
      JSON.stringify(condition),
    );
  } catch {
    // 存储不可用（隐私模式等）时静默失败，不影响主流程
  }
}

/**
 * GenerateDocument 组件本体
 * @returns {React.JSX.Element} 生成认证文档输入画面
 */
function GenerateDocument(): React.JSX.Element {
  /* ------------------------------ State 定义 ------------------------------ */
  // 详细设计 7.1：使用 React State 管理 chassisSeries / chassisNo / documentType / message
  /** Chassis series 输入值 */
  const [chassisSeries, setChassisSeries] = useState<string>('');
  /** Chassis no 输入值 */
  const [chassisNo, setChassisNo] = useState<string>('');
  /** Document type 选择值 */
  const [documentType, setDocumentType] = useState<string>('');
  /** 错误消息（空字符串时 error message area 不占位，详细设计 7.2） */
  const [message, setMessage] = useState<string>('');

  /** Chassis series 输入框引用：校验失败时用于焦点控制 */
  const chassisSeriesRef = useRef<HTMLInputElement>(null);
  /** Chassis no 输入框引用：校验失败时用于焦点控制 */
  const chassisNoRef = useRef<HTMLInputElement>(null);
  /** Document type 下拉框引用：校验失败时用于焦点控制 */
  const documentTypeRef = useRef<HTMLSelectElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* ---------------------- Document type 选项（下拉数据源） ---------------------- */
  /**
   * 下拉列表数据源：优先使用前画面通过 location.state 传入的列表，
   * 无传入值时使用默认列表（详细设计 3.1.1 由 HDOC_DOCUMENT_LIST.DOCTYPE 提供）。
   */
  const documentTypeOptions = useMemo<DocumentTypeOption[]>(() => {
    const passedTypes = (location.state as { documentTypes?: string[] } | null)
      ?.documentTypes;
    const types =
      Array.isArray(passedTypes) && passedTypes.length > 0
        ? passedTypes
        : DEFAULT_DOCUMENT_TYPES;
    // JSX 列表渲染必须设置 key（开发规约 16）
    return types.map((type) => ({ value: type, label: type }));
  }, [location.state]);

  /* ------------------------------ 生命周期 ------------------------------ */
  // 详细设计 7.1：输入项默认回显上一次提交的条件（测试用例 2）
  useEffect(() => {
    const lastCondition = readLastCondition();
    setChassisSeries(lastCondition.chassisSeries);
    setChassisNo(lastCondition.chassisNo);
    setDocumentType(lastCondition.documentType);
  }, []);

  /* ------------------------------ 事件处理 ------------------------------ */
  /**
   * Chassis series 变更处理
   * 详细设计 2.1：仅允许半角英字，最大 5 位（超长截断、非法字符过滤）
   * @param event 输入变更事件
   */
  const onChangeChassisSeries = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setChassisSeries(filterChassisSeries(event.target.value));
      setMessage('');
    },
    [],
  );

  /**
   * Chassis no 变更处理
   * 详细设计 2.1：仅允许半角数字，最大 10 位（超长截断、非法字符过滤）
   * @param event 输入变更事件
   */
  const onChangeChassisNo = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setChassisNo(filterChassisNo(event.target.value));
      setMessage('');
    },
    [],
  );

  /**
   * Document type 变更处理
   * @param event 下拉选择变更事件
   */
  const onChangeDocumentType = useCallback(
    (event: ChangeEvent<HTMLSelectElement>): void => {
      setDocumentType(event.target.value);
      setMessage('');
    },
    [],
  );

  /**
   * 统一设置错误消息，并将焦点移动到对应输入框
   * @param text 错误消息内容
   * @param focusField 需要聚焦的字段
   */
  const showError = useCallback(
    (
      text: string,
      focusField: 'chassisSeries' | 'chassisNo' | 'documentType' | '',
    ): void => {
      setMessage(text);
      if (focusField === 'chassisSeries') chassisSeriesRef.current?.focus();
      if (focusField === 'chassisNo') chassisNoRef.current?.focus();
      if (focusField === 'documentType') documentTypeRef.current?.focus();
    },
    [],
  );

  /**
   * Submit 按钮处理（详细设计 3.1.1 / 测试用例 12、13）
   * 流程：trim → 必填校验 → 保存提交条件 → 迁移到 Generate document 画面
   * 并传递 Chassis series / Chassis no / userID。
   * @param event 表单提交事件
   */
  const onSubmitForm = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();

      // 前置处理：去除首尾空格（详细设计 4.1）
      const values = {
        chassisSeries: normalize(chassisSeries),
        chassisNo: normalize(chassisNo),
        documentType: normalize(documentType),
      };

      // 空值校验（Frontend Check）：必填项未输入时不迁移
      const validation =
        validateGenerateDocumentForm(values);
      if (!validation.valid) {
        showError(validation.message, validation.focusField);
        return;
      }

      // 保存本次提交条件，供下次进入时回显
      saveLastCondition(values);

      // 结果处理：迁移到 Generate document 画面并传递参数
      navigate(GENERATE_DOCUMENT_PATH, {
        state: {
          chassisSeries: values.chassisSeries,
          chassisNo: values.chassisNo,
          documentType: values.documentType,
          userID: readLoggedInUserId(),
        },
      });
    },
    [chassisSeries, chassisNo, documentType, navigate, showError],
  );

  /**
   * Reset 按钮处理（详细设计 3.1.2 / 测试用例 14）
   * 清除画面所有输入内容，并恢复初始状态。
   */
  const onClickReset = useCallback((): void => {
    setChassisSeries('');
    setChassisNo('');
    setDocumentType('');
    setMessage('');
  }, []);

  /**
   * Help 按钮处理（详细设计 3.1.3 / 测试用例 15）
   * 迁移到 User Guide 画面。
   */
  const onClickHelp = useCallback((): void => {
    navigate(USER_GUIDE_PATH, { state: { userID: readLoggedInUserId() } });
  }, [navigate]);

  /* ------------------------------ 渲染 ------------------------------ */
  return (
    <div
      className="generate-document-画面"
      /* 背景图与 Login（UD01）/ Menu（UD02）保持一致 */
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="generate-document-卡片">
        <h1 className="generate-document-标题">{SCREEN_TITLE}</h1>

        <form
          className="generate-document-表单"
          onSubmit={onSubmitForm}
          noValidate
        >
          {/* 控件 1：Chassis series（必须 / 半角英字 / 最大 5 位） */}
          <div className="generate-document-项目">
            <label
              className="generate-document-ラベル"
              htmlFor="chassis-series"
            >
              Chassis series
            </label>
            <input
              id="chassis-series"
              className="generate-document-入力"
              type="text"
              value={chassisSeries}
              ref={chassisSeriesRef}
              maxLength={CHASSIS_SERIES_MAX_LENGTH}
              autoComplete="off"
              onChange={onChangeChassisSeries}
            />
          </div>

          {/* 控件 2：Chassis no（必须 / 半角数字 / 最大 10 位） */}
          <div className="generate-document-项目">
            <label className="generate-document-ラベル" htmlFor="chassis-no">
              Chassis no
            </label>
            <input
              id="chassis-no"
              className="generate-document-入力"
              type="text"
              value={chassisNo}
              ref={chassisNoRef}
              maxLength={CHASSIS_NO_MAX_LENGTH}
              autoComplete="off"
              onChange={onChangeChassisNo}
            />
          </div>

          {/* 控件 3：Document type（必须 / 下拉列表） */}
          <div className="generate-document-项目">
            <label
              className="generate-document-ラベル"
              htmlFor="document-type"
            >
              Document type
            </label>
            <select
              id="document-type"
              className="generate-document-選択"
              value={documentType}
              ref={documentTypeRef}
              onChange={onChangeDocumentType}
            >
              <option value="">-- Select --</option>
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 控件 7：error message area（动态显示，内容为空时不占位） */}
          {message && (
            <div className="generate-document-エラーメッセージ" role="alert">
              {message}
            </div>
          )}

          {/* 控件 4 / 5 / 6：Submit / Reset / Help（居中排列） */}
          <div className="generate-document-按钮区">
            <button
              className="generate-document-按钮 generate-document-按钮-主"
              type="submit"
            >
              Submit
            </button>
            <button
              className="generate-document-按钮"
              type="button"
              onClick={onClickReset}
            >
              Reset
            </button>
            <button
              className="generate-document-按钮"
              type="button"
              onClick={onClickHelp}
            >
              Help
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { ERROR_MESSAGES, readLoggedInUserId };
export default GenerateDocument;
