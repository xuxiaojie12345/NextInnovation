// GenerateDocument.tsx
// 描述：GenerateDocument(生成文档表示)画面组件。
// 功能：画面初期表示时，根据上一画面(GenerateHomologationDocument)传入的底盘系列与底盘编号，
//       调用 UD04SelectGeneratedocument 接口取得数据并展示（参照内部設計 GenerateDocument_詳細設計.md 5.1 初期表示）。
//       另提供 [Modify Doc Link] 等画面导航（参照内部設計 4.2）。
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GenerateDocument.css';

// ============================================
// UD04SelectGeneratedocument（参照内部設計書 6. 接口定义）
// POST /api/GenerateDocument/UD04SelectGeneratedocument
// ============================================

/** 后端统一响应数据（对应 UD04SelectGeneratedocumentData） */
export interface GeneratedDocumentData {
  ordernumber?: string;
  build?: string;
  spec?: string;
  custrAdap?: string;
  countryOfOperation?: string;
  loadIndex?: string;
  act?: string;
  variable?: string;
}

/** 后端统一响应格式（UD04SelectGeneratedocumentResponse: code / message / data） */
export interface GeneratedDocumentResponse {
  code: number;
  message: string;
  data: GeneratedDocumentData | null;
}

/** API 基础地址（默认本地后端 8081，可用 .env 的 REACT_APP_API_BASE_URL 覆盖） */
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

/**
 * 调用后端获取生成文档数据的 API
 * @param chassisSeries 底盘系列
 * @param chassisNo     底盘编号
 * @returns GeneratedDocumentResponse（code: 200 成功 / 401 无权限 / 其他 系统错误）
 */
const fetchGeneratedDocument = async (
  chassisSeries: string,
  chassisNo: string,
): Promise<GeneratedDocumentResponse> => {
  const response = await axios.post<GeneratedDocumentResponse>(
    `${API_BASE_URL}/api/GenerateDocument/UD04SelectGeneratedocument`,
    { chassisSeries, chassisNo },
    { timeout: 10000 }, // API 超时 10 秒（对应内部設計書 7. 异常处理）
  );
  return response.data;
};

/**
 * 从请求异常中解析中文错误消息
 * @description 可复用的异常解析函数，依据异常类型返回对应的错误提示（参照内部設計書 7. 异常处理）。
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
    return 'System error. Please contact support.'; // 服务器异常
  }
  return 'System error. Please contact support.';
};

/** 单条信息展示行（标签 + 值）参数 */
interface InfoRowProps {
  label: string;
  value: string;
}

/**
 * 单条信息展示行
 * @description 以「标签: 值」的形式展示一条生成文档信息。
 */
const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => {
  return (
    <div className='generate-doc-row'>
      <span className='generate-doc-row__label'>{label}</span>
      <span className='generate-doc-row__value'>{value || '—'}</span>
    </div>
  );
};

/** 小节标题参数 */
interface SectionTitleProps {
  title: string;
}

/**
 * 小节标题
 * @description 以深蓝色加粗文字展示画面内的小节标题。
 */
const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  return <h2 className='generate-doc-section__title'>{title}</h2>;
};

/** GenerateDocument 画面 Props（支持嵌入 Menu 右侧区域显示） */
interface GenerateDocumentProps {
  /** 底盘系列（由检索画面 Submit 传入；缺省时回退路由 state / 演示默认值） */
  chassisSeries?: string;
  /** 底盘编号（由检索画面 Submit 传入；缺省时回退路由 state / 演示默认值） */
  chassisNo?: string;
  /** 返回回调：嵌入 Menu 右侧区域时返回检索画面；未提供时回退 navigate(-1) */
  onBack?: () => void;
  /** 点击 [Modify Doc Link] 时的回调（在本画面同一位置显示 [ModifyDocument]） */
  onShowModifyDocument?: () => void;
}

/**
 * GenerateDocument(生成文档表示)画面组件
 * @description 展示由底盘检索条件生成的文档信息；初期表示调用 UD04SelectGeneratedocument 接口。
 *              支持嵌入 Menu 右侧内容区域显示（通过 props 传入检索条件），也可作为独立路由画面使用。
 */
const GenerateDocument: React.FC<GenerateDocumentProps> = ({
  chassisSeries: chassisSeriesProp,
  chassisNo: chassisNoProp,
  onBack,
  onShowModifyDocument,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 检索条件：优先使用 props（Menu 右侧区域嵌入时由检索画面传入），其次路由 state，否则演示默认值
  const routeState = (location.state ?? {}) as { chassisSeries?: string; chassisNo?: string };
  const [chassisSeries] = useState<string>(
    chassisSeriesProp ?? routeState.chassisSeries ?? 'JPCT',
  );
  const [chassisNo] = useState<string>(
    chassisNoProp ?? routeState.chassisNo ?? '013945',
  );

  // 画面状态（对应内部設計書 6. 实现注意事项）
  const [data, setData] = useState<GeneratedDocumentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * 初期表示：取得生成文档数据
   * @description 对应内部設計書 5.1 初期表示：
   *  1. 获取上一画面传入的 [chassisSeries, chassisNo]；
   *  2. 将检索条件传入 API [UD04SelectGeneratedocument]；
   *  3. 取得 API 返回的数据并进行画面表示，失败时显示错误信息。
   */
  const loadDocumentData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await fetchGeneratedDocument(chassisSeries, chassisNo);
      if (result.code === 200 && result.data) {
        // 取得成功：进行画面初期表示
        setData(result.data);
      } else {
        // 取得失败（无数据等）：显示后端错误消息
        setData(null);
        setErrorMessage(result.message || 'No chassis data found.');
      }
    } catch (error) {
      // 网络 / 超时 / 系统异常处理（对应内部設計書 7. 异常处理）
      setData(null);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [chassisSeries, chassisNo]);

  // 画面初期表示：进入画面后加载一次数据
  useEffect(() => {
    loadDocumentData();
  }, [loadDocumentData]);

  /** 点击 Analyze Rules 链接 */
  const handleClickAnalyzeRules = () => {
    // 分析规则处理（后续功能扩展，此处暂不做迁移）
  };

  /**
   * 点击 Modify Doc Link 链接
   * @description 对应内部設計書 4.2 超链接[Modify Doc Link]压下：迁移至 Modify Document 画面，
   *              并携带底盘检索条件。嵌入 Menu 右侧区域时在本画面同一位置显示。
   */
  const handleClickModifyDocLink = () => {
    if (onShowModifyDocument) {
      // 在 Menu 右侧内容区域（与本画面同一位置）显示 [ModifyDocument] 画面
      onShowModifyDocument();
    } else {
      navigate('/ModifyDocument', { state: { chassisSeries, chassisNo } });
    }
  };

  /** 点击 Generated document 链接 */
  const handleClickGeneratedDocument = () => {
    // 打开由 VIN Plate 生成批次创建的文档文件（后续实现）
  };

  /**
   * 点击 Quit 按钮
   * @description 退出本画面：嵌入 Menu 右侧区域时返回检索画面，否则返回上一画面。
   */
  const handleClickQuit = () => {
    if (onBack) {
      // 嵌入 Menu 右侧内容区域时返回检索画面
      onBack();
    } else {
      navigate(-1);
    }
  };

  /** 点击 Archive 按钮 */
  const handleClickArchive = () => {
    // 归档处理（后续实现）
  };

  /** 点击 Archive & Distribute 按钮 */
  const handleClickArchiveAndDistribute = () => {
    // 归档与分发处理（后续实现）
  };

  // 是否存在 S-Note 信息：存在时显示固定提示文案（参照内部設計 S-Note Message 备注）
  const hasSNote = Boolean(data?.custrAdap && data.custrAdap.trim().length > 0);
  // S-Note 列表：按逗号拆分（画面式样中可能出现多条 S-Note）
  const sNoteList = data?.custrAdap
    ? data.custrAdap.split(',').filter((item) => item.trim().length > 0)
    : [];

  return (
    <div className='generate-doc'>
      <div className='generate-doc__card'>
        {/* 画面标题 */}
        <h1 className='generate-doc__title'>Generate document</h1>

        {/* 错误消息区：初期表示失败时显示 */}
        {errorMessage && (
          <div className='generate-doc__error-message'>{errorMessage}</div>
        )}

        {/* 基本信息区块（对应内部設計：Chassis no / Ordernumber / Build week / Spec week / Market / Master Market） */}
        <section className='generate-doc__section'>
          <InfoRow label='Chassis no' value={chassisNo} />
          <InfoRow label='Ordernumber' value={data?.ordernumber ?? ''} />
          <InfoRow label='Build week' value={data?.build ?? ''} />
          <InfoRow label='Spec week' value={data?.spec ?? ''} />
          <InfoRow label='Market' value={data?.countryOfOperation ?? ''} />
          {/* Master Market：固定显示为 -EU（参照内部設計备注） */}
          <InfoRow label='Master Market' value='-EU' />
          {/* Language：固定显示（画面式样） */}
          <InfoRow label='Language' value='ENG' />
        </section>

        {/* 数据取得状态提示 */}
        {isLoading && <div className='generate-doc__status'>Loading...</div>}

        {/* S-Notes 区块 */}
        {hasSNote && (
          <section className='generate-doc__section'>
            <SectionTitle title='S-Notes' />
            <div className='generate-doc__snote-list'>
              {sNoteList.map((snote, index) => (
                <div className='generate-doc__snote-item' key={`snote-${index}`}>
                  {snote.trim()}
                </div>
              ))}
            </div>
            {/* S-Note Message：存在 S-Note 时固定显示的红色提示文案 */}
            <div className='generate-doc__warning'>
              The S-Notes above can affect homologation documents.
            </div>
          </section>
        )}

        {/* Load Index 区块（对应内部設計 Load Index 控件） */}
        <section className='generate-doc__section'>
          <SectionTitle title='Load Index' />
          <InfoRow label='Load index' value={data?.loadIndex ?? ''} />
        </section>

        {/* Analyze Rules 链接 */}
        <section className='generate-doc__section'>
          <button
            type='button'
            className='generate-doc__link'
            onClick={handleClickAnalyzeRules}
          >
            Analyze Rules
          </button>
        </section>

        {/* Modify Doc Link 区块：AD-Change 活性时显示的红色提示与链接 */}
        <section className='generate-doc__section'>
          <div className='generate-doc__warning'>
            After def change detected. Document need to be modified.
          </div>
          <button
            type='button'
            className='generate-doc__link'
            onClick={handleClickModifyDocLink}
          >
            Modify Doc Link
          </button>
        </section>

        {/* 模板与替换参数区块（固定显示示例，对应内部設計 Using template / Replacing parameters） */}
        <section className='generate-doc__section'>
          <InfoRow
            label='Using template:'
            value='_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf'
          />
          <div className='generate-doc-row'>
            <span className='generate-doc-row__label'>Replacing parameters</span>
          </div>
          <div className='generate-doc__replacing-item'>
            AD Change. Modifying: AXLE_CONF
          </div>
          <div className='generate-doc__replacing-item'>
            AD Change. Modifying: WB_MM
          </div>
        </section>

        {/* 生成的文档区块（对应内部設計 Generated document；Convert to PDF / Email / Comment 已删除） */}
        <section className='generate-doc__section'>
          <button
            type='button'
            className='generate-doc__link'
            onClick={handleClickGeneratedDocument}
          >
            Generated document
          </button>

          {/* 操作按钮组（Quit / Archive / Archive & Distribute） */}
          <div className='generate-doc__button-group'>
            <button
              type='button'
              className='generate-doc__button'
              onClick={handleClickQuit}
            >
              Quit
            </button>
            <button
              type='button'
              className='generate-doc__button'
              onClick={handleClickArchive}
            >
              Archive
            </button>
            <button
              type='button'
              className='generate-doc__button'
              onClick={handleClickArchiveAndDistribute}
            >
              Archive &amp; Distribute
            </button>
          </div>
        </section>

        {/* 底部信息（固定显示，对应内部設計 Date / HDoc version） */}
        <footer className='generate-doc__footer'>
          <span>Date: 2022-12-06 07:30:31</span>
          <span>HDoc version: 4.2.1</span>
          <span>EDB version: 34307</span>
        </footer>
      </div>
    </div>
  );
};

export default GenerateDocument;
