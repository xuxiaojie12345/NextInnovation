// ModifyDocument.tsx
// 描述：Modify Document(文档修正)画面组件。
// 功能：由 GenerateDocument 画面的 [Modify Doc Link] 超链接跳转进入，接收 [chassisSeries, chassisNo]，
//       初期表示调用 API [UD05SelectVariableModification] 取得数据并以一览(DataTable)形式表示；
//       修正 [Modified value] 后点击 [Save] 调用 API [UD05UpdateHdocAdcaModification] 保存，
//       保存成功后迁移至 [Save Modifications] 画面；点击 [chassis no] 超链接迁移至 [Vehicle Specification] 画面。
//       (参照内部設計書 [Modify Document]_詳細設計.md)
// 备注：初期表示 [UD05SelectVariableModification] 与保存 [UD05UpdateHdocAdcaModification]
//       均调用后端真实 API（API 已经开发完成，不再使用假数据）。
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './ModifyDocument.css';
import SaveModifications from '../SaveModifications/SaveModifications';
import VehicleSpecification from '../VehicleSpecification/VehicleSpecification';

// ============================================
// API 定义（参照内部設計書 6. 接口定义）
// ============================================

/** API 基础地址（默认本地后端 8081，可用 .env 的 REACT_APP_API_BASE_URL 覆盖） */
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

/** Save Modifications 画面表示的版本号（FOUND UNRELEASED VERSION / Version） */
const SAVED_VERSION = 1;

/** 一览行数据（对应内部設計書 3.1 控件属性表 Variable / Description / Current value / Modified value） */
export interface VariableModificationItem {
  /** 变量名（HDOC_ADCA_MODIFICATION.VARIABLE） */
  variable: string;
  /** 变量说明（HDOC_VARIABLES.DESCRIPTION） */
  description: string;
  /** 当前值（取自 API 的 newval，画面显示保持不变） */
  currentValue: string;
  /** 修正值【入力控件，初期值取自 API 的 newval（Modified value 默认值），MaxLength 500】 */
  modifiedValue: string;
}

/** UD05SelectVariableModification 响应明细（后端 ModifyDocumentList 的元素） */
export interface VariableModificationItemResponse {
  /** 变量名 */
  variable: string;
  /** 变量说明 */
  description: string;
  /** 修正值（HDOC_ADCA_MODIFICATION.NEWVAL）；作为画面 [Modified value] 的默认值 */
  newval: string;
}

/** UD05SelectVariableModification 响应 data */
export interface VariableModificationData {
  /** 一览明细（后端仕様的 JSON key 为 ModifyDocumentList） */
  ModifyDocumentList?: VariableModificationItemResponse[];
  /** 市场（HDOC_REC_DATA_VDA_GENERAL.COUNTRY_OF_OPERATION；后端未返回时省略） */
  market?: string;
  /** Template 文件路径（后端未返回时省略） */
  templateFile?: string;
}

/** 后端统一响应格式（code / message / data） */
export interface VariableModificationResponse {
  code: number;
  message: string;
  data: VariableModificationData | null;
}

/** UD05UpdateHdocAdcaModification 请求参数（参照内部設計書 6.2 Request Body） */
export interface UpdateModificationRequest {
  /** 更新ユーザーID（Login 认证成功时保存于 localStorage） */
  userId: string;
  /** 底盘系列 */
  chassisSeries: string;
  /** 底盘编号 */
  chassisNo: string;
  /** 修正值 */
  modifiedValue: string;
}

/** UD05UpdateHdocAdcaModification 响应格式 */
export interface UpdateModificationResponse {
  code: number;
  message: string;
  data: Record<string, never> | null;
}

/**
 * 将 API 返回明细转换为画面一览行
 * @description [Variable]/[Description] 直接映射；
 *              API 的 newval 同时作为 [Current value] 与 [Modified value] 的初期值
 *              （[Current value] 显示保持不变，[Modified value] 作为入力默认值）。
 * @param list API 返回的一览明细
 * @returns VariableModificationItem[] 画面一览行
 */
const toModificationRows = (
  list: VariableModificationItemResponse[] | undefined,
): VariableModificationItem[] =>
  (list ?? []).map((item) => ({
    variable: item.variable ?? '',
    description: item.description ?? '',
    // [Current value]：取自 API 的 newval（HDOC_ADCA_MODIFICATION.NEWVAL），显示保持不变
    currentValue: item.newval ?? '',
    // [Modified value] 默认值：API 的 newval（HDOC_ADCA_MODIFICATION.NEWVAL）
    modifiedValue: item.newval ?? '',
  }));

/**
 * 取得登录用户 ID
 * @description Login 认证成功时保存到 localStorage；后端 UD05Update API 需要该值为更新者。
 * @returns userId（未登录时为空白字符串）
 */
const getLoginUserId = (): string => localStorage.getItem('userId') ?? '';

/**
 * 调用后端取得文档修正一览数据的 API（UD05SelectVariableModificationApi）
 * POST /api/ModifyDocument/UD05SelectVariableModification
 * @param chassisSeries 底盘系列
 * @param chassisNo     底盘编号
 * @returns VariableModificationResponse（code: 200 成功 / 400 参数不足 / 404 无数据 / 500 系统错误）
 */
const selectVariableModificationApi = async (
  chassisSeries: string,
  chassisNo: string,
): Promise<VariableModificationResponse> => {
  const response = await axios.post<VariableModificationResponse>(
    `${API_BASE_URL}/api/ModifyDocument/UD05SelectVariableModification`,
    { chassisSeries, chassisNo },
    { timeout: 10000 }, // API 超时 10 秒（对应内部設計書 7. 异常处理）
  );
  return response.data;
};

/**
 * 调用后端保存文档修正数据的 API（UD05UpdateHdocAdcaModificationApi）
 * POST /api/ModifyDocument/UD05UpdateHdocAdcaModification
 * @param request 请求参数（userId / 底盘系列 / 底盘编号 / 修正值）
 * @returns UpdateModificationResponse（code: 200 成功 / 400 参数不足 / 404 更新対象なし / 500 系统错误）
 */
const updateHdocAdcaModificationApi = async (
  request: UpdateModificationRequest,
): Promise<UpdateModificationResponse> => {
  const response = await axios.post<UpdateModificationResponse>(
    `${API_BASE_URL}/api/ModifyDocument/UD05UpdateHdocAdcaModification`,
    request,
    { timeout: 10000 }, // API 超时 10 秒（对应内部設計書 7. 异常处理）
  );
  return response.data;
};

/**
 * 从请求异常中解析错误消息（可复用函数，参照内部設計書 7. 异常处理）
 * @param error 请求异常对象
 * @returns 错误消息字符串
 */
export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.'; // API 超时
    }
    if (!error.response) {
      return 'Network error. Please check your connection and try again.'; // 网络异常
    }
    return 'System error. Please contact support.'; // サーバ异常
  }
  return 'System error. Please contact support.';
};

/** 画面表示状态：main(修正一览) / saveResult(Save Modifications) / vehicleSpec(Vehicle Specification) */
type ModifyDocumentView = 'main' | 'saveResult' | 'vehicleSpec';

/** ModifyDocument 画面 Props（支持嵌入 Menu 右侧区域显示） */
interface ModifyDocumentProps {
  /** 底盘系列（由上一画面传入；缺省时回退路由 state / 演示默认值） */
  chassisSeries?: string;
  /** 底盘编号（由上一画面传入；缺省时回退路由 state / 演示默认值） */
  chassisNo?: string;
  /** 返回回调：嵌入 Menu 右侧区域时返回 GenerateDocument；未提供时不执行迁移 */
  onBack?: () => void;
}

/**
 * ModifyDocument(文档修正)画面组件
 * @description 一览显示对象车辆的 Variable / Description / Current value / Modified value，
 *              并根据修正结果调用 API 保存；支持嵌入 Menu 右侧内容区域显示，也可作为独立路由画面使用。
 * @param props 画面参数（chassisSeries / chassisNo / onBack）
 */
const ModifyDocument: React.FC<ModifyDocumentProps> = ({
  chassisSeries: chassisSeriesProp,
  chassisNo: chassisNoProp,
  onBack,
}) => {
  const location = useLocation();
  // 检索条件：优先使用 props（Menu 右侧区域嵌入时由上一画面传入），其次路由 state，否则演示默认值
  const routeState = (location.state ?? {}) as {
    chassisSeries?: string;
    chassisNo?: string;
  };
  const [series] = useState<string>(
    chassisSeriesProp ?? routeState.chassisSeries ?? 'JPCT',
  );
  const [no] = useState<string>(
    chassisNoProp ?? routeState.chassisNo ?? '028321',
  );

  // 画面显示状态（main / saveResult / vehicleSpec）
  const [view, setView] = useState<ModifyDocumentView>('main');
  // Market / Template 文件（初期表示 API 取得）
  const [market, setMarket] = useState<string>('');
  const [templateFile, setTemplateFile] = useState<string>('');
  // 一览数据（DataTable 行）
  const [rows, setRows] = useState<VariableModificationItem[]>([]);
  // 数据取得 / 保存处理中标志
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 错误消息（以 Label 形式在画面内显示，避免频繁弹窗）
  const [message, setMessage] = useState<string>('');
  // 保存成功后 [Save Modifications] 画面显示的存储信息（例：Storing: SEAT_NO 4）
  const [storedMessages, setStoredMessages] = useState<string[]>([]);

  // chassis no 表示值（内部設計書 3.1：前画面.ChassisSeries + 前画面.ChassisNo）
  const chassisNoLabel = useMemo(() => `${series} ${no}`, [series, no]);

  /**
   * 初期表示：取得文档修正一览数据
   * 对应内部設計書 5.1 初期表示：
   *  1. 取得前画面传入的 [chassisSeries, chassisNo]；
   *  2. 将检索条件传入 API [UD05SelectVariableModification]；
   *  3. 成功时进行一览表示，失败时显示错误信息。
   */
  const loadModificationData = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const result = await selectVariableModificationApi(series, no);
      if (result.code === 200 && result.data) {
        // 取得成功：进行画面初期表示
        // 注：Market / Template 后端未返回时为空白（当前 UD05 API 仅返回一览明细）
        setMarket(result.data.market ?? '');
        setTemplateFile(result.data.templateFile ?? '');
        setRows(toModificationRows(result.data.ModifyDocumentList));
      } else {
        // 取得失败：不进行初期表示并显示错误信息
        setRows([]);
        setMessage(result.message || 'No modification data found.');
      }
    } catch (error) {
      // 网络 / 超时 / 系统异常处理（对应内部設計書 7. 异常处理）
      setRows([]);
      setMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [series, no]);

  // 画面初期表示：进入画面后加载一次数据
  useEffect(() => {
    loadModificationData();
  }, [loadModificationData]);

  /**
   * 修改 [Modified value] 输入
   * 对应内部設計書 3.1：Modified value 为入力控件，MaxLength 500。
   */
  const handleChangeModifiedValue = (index: number, value: string) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, modifiedValue: value } : row,
      ),
    );
    // 用户体验优化：重新输入时清空错误提示
    if (message) setMessage('');
  };

  /**
   * 点击 [Save] 按钮
   * 对应内部設計書 4.2 / 5.2：
   *  1. 取得画面入力的 [Modified value]；
   *  2. 空值校验：未输入任何修正值时显示错误消息并终止流程；
   *  3. 调用 API [UD05UpdateHdocAdcaModification] 保存；
   *  4. 成功后迁移至 [Save Modifications] 画面。
   */
  const handleClickSave = async () => {
    // 5.2.1 获取画面入力数据：仅提取已输入 [Modified value] 的行
    const modifiedRows = rows.filter((row) => row.modifiedValue.trim() !== '');

    // 5.2.2.1 空值校验：修正值全部为空时显示错误消息并终止（不调用 API）
    if (modifiedRows.length === 0) {
      setMessage('NO UNRELEASED VERSION EXISTS!');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      // 5.2.3 API 调用：保存修正数据
      // userId 为更新者，由 Login 认证成功时保存到 localStorage（后端 UD05Update API 必须）
      const userId = getLoginUserId();
      const results = await Promise.all(
        modifiedRows.map((row) =>
          updateHdocAdcaModificationApi({
            userId,
            chassisSeries: series,
            chassisNo: no,
            modifiedValue: row.modifiedValue.trim(),
          }),
        ),
      );

      // 5.2.4 结果处理：保存失败时不迁移并显示错误信息
      const failed = results.find((result) => result.code !== 200);
      if (failed) {
        setMessage(failed.message || 'System error. Please contact support.');
        return;
      }

      // 保存成功：生成 [Save Modifications] 画面的存储信息并迁移
      setStoredMessages(
        modifiedRows.map(
          (row) => `Storing: ${row.variable} ${row.modifiedValue.trim()}`,
        ),
      );
      setView('saveResult');
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 点击 [chassis no] 超链接
   * 对应内部設計書 4.3：将 [chassisSeries, chassisNo] 传入并迁移至 [Vehicle Specification] 画面。
   */
  const handleClickChassisNoLink = () => {
    setView('vehicleSpec');
  };

  /** 点击 Template 文件超链接（文档表示处理，后续功能扩展） */
  const handleClickTemplateLink = () => {
    // 打开模板文件（后续实现）
  };

  /**
   * 关闭 [Save Modifications] 画面
   * 对应内部設計書 4.2 结果处理：返回 GenerateDocument 画面。
   */
  const handleClickCloseSaveModifications = () => {
    setView('main');
    if (onBack) onBack();
  };

  /** 从 [Vehicle Specification] 画面返回修正一览画面 */
  const handleBackFromVehicleSpecification = () => {
    setView('main');
  };

  // 画面状态分支：[Save Modifications] 画面
  if (view === 'saveResult') {
    return (
      <SaveModifications
        chassisSeries={series}
        chassisNo={no}
        version={SAVED_VERSION}
        storedMessages={storedMessages}
        onClose={handleClickCloseSaveModifications}
      />
    );
  }

  // 画面状态分支：[Vehicle Specification] 画面
  if (view === 'vehicleSpec') {
    return (
      <VehicleSpecification
        chassisNo={chassisNoLabel}
        onBack={handleBackFromVehicleSpecification}
      />
    );
  }

  // 画面状态分支：Modify Document 修正一览画面
  return (
    <div className='modify-doc'>
      <div className='modify-doc__card'>
        {/* 画面标题 */}
        <h1 className='modify-doc__title'>Modify Document</h1>

        {/* Chassis no / Market 信息（内部設計書 3.1：Output 控件，采用 Generate document 同款 label/value 行） */}
        <div className='modify-doc__info'>
          <div className='modify-doc-row'>
            <span className='modify-doc-row__label'>Chassis no</span>
            <button
              type='button'
              className='modify-doc__chassis-link'
              onClick={handleClickChassisNoLink}
            >
              {chassisNoLabel}
            </button>
          </div>
          {/* Market：API 返回时显示（当前 UD05 API 未返回该值时隐藏） */}
          {market && (
            <div className='modify-doc-row'>
              <span className='modify-doc-row__label'>Market</span>
              <span className='modify-doc-row__value'>{market}</span>
            </div>
          )}
        </div>

        {/* Template 文件超链接（内部設計書 3.1：Link 控件）
            API 返回 Template 文件时显示（当前 UD05 API 未返回该值时隐藏） */}
        {templateFile && (
          <div className='modify-doc__info'>
            <div className='modify-doc-row'>
              <span className='modify-doc-row__label'>Template</span>
              <button
                type='button'
                className='modify-doc__link'
                onClick={handleClickTemplateLink}
              >
                {templateFile}
              </button>
            </div>
          </div>
        )}

        {/* Save 按钮（内部設計書 3.1：Action 控件） */}
        <div className='modify-doc__action'>
          <button
            type='button'
            className='modify-doc__button'
            onClick={handleClickSave}
            disabled={isLoading}
          >
            Save
          </button>
        </div>

        {/* 错误消息 Label（内部設計書 3.1 注：以 Label 形式在画面内显示） */}
        {message && <div className='modify-doc__message'>{message}</div>}

        {/* 数据取得状态 */}
        {isLoading && <div className='modify-doc__status'>Loading...</div>}

        {/* Variable / Description / Current value / Modified value 一览（DataTable） */}
        <table className='modify-doc__table'>
          <thead>
            <tr>
              <th className='modify-doc__th'>Variable</th>
              <th className='modify-doc__th'>Description</th>
              <th className='modify-doc__th'>Current value</th>
              <th className='modify-doc__th'>Modified value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className='modify-doc__tr' key={row.variable}>
                <td className='modify-doc__td'>{row.variable}</td>
                <td className='modify-doc__td'>{row.description}</td>
                <td className='modify-doc__td'>{row.currentValue}</td>
                <td className='modify-doc__td'>
                  {/* Modified value：入力控件，MaxLength 500 */}
                  <input
                    className='modify-doc__input'
                    type='text'
                    value={row.modifiedValue}
                    maxLength={500}
                    aria-label={`Modified value of ${row.variable}`}
                    onChange={(event) =>
                      handleChangeModifiedValue(index, event.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModifyDocument;
