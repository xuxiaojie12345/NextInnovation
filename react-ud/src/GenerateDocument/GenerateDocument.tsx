import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GenerateDocument.css';

// 接收从GenerateHomologationDocument传递的参数
interface LocationState {
  chassisSeries: string;
  chassisNo: string;
  documentType: string;
}

// 后端API基础地址
const API_BASE_URL = 'http://localhost:8081';

/**
 * GenerateDocument 组件 - 文档生成页面（UD04）
 *
 * 显示底盘相关文档信息、ADCA变更状态、模板参数、文档下载等
 * 对应详细设计：DES-GenerateDocumentPage-001
 */
const GenerateDocument: React.FC = () => {
  // 获取路由参数（优先从URL参数获取，其次从state获取）
  const { chassisNo: routeChassisNo } = useParams<{ chassisNo: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // 使用路由参数或location.state中的参数
  const currentChassisNo = routeChassisNo || state?.chassisNo || '';
  const currentChassisSeries = state?.chassisSeries || '';
  const currentDocumentType = state?.documentType || '';

  // 页面数据状态
  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // 页面初始化时获取数据（对应设计书 3.1.1 页面初始化流程）
  useEffect(() => {
    const fetchData = async () => {
      if (!currentChassisNo) {
        setError('Chassis not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 步骤3：调用 UD04SelectGeneratedocumentApi（POST）
        // 对应设计书 4.1 接口定义
        // 请求参数包含 chassisSeries、chassisNo 和 documentType
        const response = await axios.post(`${API_BASE_URL}/api/ud04/selectgenerateddocument`, {
          chassisSeries: currentChassisSeries,
          chassisNo: currentChassisNo,
          documentType: currentDocumentType
        });

        if (response.data.code === 200 && response.data.data) {
          setDocumentData(response.data.data);
        } else {
          // 失败 - 底盘号不存在（对应设计书 3.2 校验 No.1）
          setError('Chassis not found');
        }
      } catch (err: any) {
        if (err.response) {
          if (err.response.status === 404) {
            setError('Chassis not found');
          } else {
            setError('System error. Please contact administrator.');
          }
        } else if (err.request) {
          setError('System error. Please contact administrator.');
        } else {
          setError('System error. Please contact administrator.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentChassisNo, currentChassisSeries, currentDocumentType]);

  // 判断是否有S-Note信息（对应设计书 2.1 S-Note Message）
  const hasSNoteInfo = !!(documentData?.sNoteNo || documentData?.sNoteMessage);

  // 判断ADCA变更是否激活（对应设计书 3.1.2 ADCA变更状态判断流程）
  const isAdcaActive = documentData?.modifyDocLink === 'ACTIVE' || documentData?.modifyDocLink === 'Y';

  // 点击 Modify Doc Link 跳转（对应设计书 3.1.2 步骤3）
  const handleModifyDocClick = useCallback(() => {
    if (isAdcaActive) {
      navigate('/Menu/ModifyDocument', {
        state: {
          chassisNo: currentChassisNo,
          serie: currentChassisSeries,
          market: documentData?.market || ''
        }
      });
    }
  }, [isAdcaActive, currentChassisSeries, currentChassisNo, currentDocumentType, navigate]);

  // Generated document 静态显示，link不实装具体功能

  // 点击 Analyze Rules
  const handleAnalyzeRulesClick = useCallback(() => {
    alert('Analyze Rules: This feature is under development.');
  }, []);

  // 加载中状态
  if (loading) {
    return (
      <div className='generate-document-container'>
        <div className='page-header'>
          <h1 className='page-title'>HDoc - Generate Document</h1>
        </div>
        <div className='loading-message'>Loading document data...</div>
      </div>
    );
  }

  return (
    <div className='generate-document-container'>
      {/* 页面标题 */}
      <div className='page-header'>
        <h1 className='page-title'>HDoc - Generate Document</h1>
      </div>

      {/* 错误消息区域（对应设计书 2.1 Error message area） */}
      {error && (
        <div className='error-message-area'>
          <p>{error}</p>
        </div>
      )}

      {/* OM 接收数据区域（对应设计书 2.1） */}
      <div className='vehicle-info-section'>
        <div className='info-item info-item-chassis'>
          <span className='chassis-label'>Chassis no:</span>
          <span className='chassis-value'>
            <strong className='chassis-series'>{currentChassisSeries || documentData?.serie || '-'}</strong>{' '}
            <u className='chassis-number'>{currentChassisNo || '-'}</u>
          </span>
        </div>
        <div className='info-item'>
          <label>Model:</label>
          <span>{documentData?.ordernumber || '-'}</span>
        </div>
        <div className='info-item'>
          <label>Spec week:</label>
          <span>{documentData?.specWeek || '-'}</span>
        </div>
        <div className='info-item'>
          <label>Market:</label>
          <span>{documentData?.market || '-'}</span>
        </div>
        <div className='info-item'>
          <label>Master Market:</label>
          <span>{documentData?.masterMarket || '-EU'}</span>
        </div>
      </div>

      {/* S-Note 信息区域 */}
      {hasSNoteInfo && (
        <div className='s-note-section'>
          <div className='s-note-content'>{documentData?.sNoteNo || documentData?.sNoteMessage || '-'}</div>
          <p className='s-note-warning'>
            The S-Notes above can affect homologation documents.
          </p>
        </div>
      )}

      {/* 轮胎信息区域 - Load Index */}
      <div className='info-item'>
        <label>Load Index:</label>
        <span>{documentData?.loadIndex || '-'}</span>
      </div>

      {/* Analyze Rules 链接（对应设计书 2.1 Analyze Rules） */}
      <div className='action-links'>
        <a href='#' className='link-item' onClick={(e) => { e.preventDefault(); handleAnalyzeRulesClick(); }}>
          Analyze Rules
        </a>
      </div>

      {/* ADCA 变更状态区域（对应设计书 3.1.2） */}
      {isAdcaActive ? (
        <p className='ad-change-warning' onClick={handleModifyDocClick}>
          After def change detected. Document need to be modified.
        </p>
      ) : (
        <p className='ad-change-inactive'>No ADCA change detected</p>
      )}

      {/* 模板信息（对应设计书 2.1 Using template）- 静态显示 */}
      <div className='template-info-section'>
        <div className='info-item'>
          <label>Using template:</label>
          <span>VIN_PLATE_TEMPLATE_V1</span>
        </div>
      </div>

      {/* 替换参数区域（对应设计书 2.1 Replacing parameters）- 从HDOC_ADCA_MODIFICATION取得Variable */}
      {isAdcaActive && (
        <div className='replacing-params-section'>
          <div className='info-item'>
            <label>Replacing parameters:</label>
            <span>{documentData?.replacingParameters || ''}</span>
          </div>
        </div>
      )}

      {/* Generated document（对应设计书 2.1）- Link类型，不实装功能 */}
      <div className='generated-doc-section'>
        <span className='generated-doc-link'>Generated document</span>
      </div>

      {/* 系统信息（对应设计书 2.1 Date / HDoc version） */}
      <div className='footer-info'>
        <div className='info-item'>
          <label>Date:</label>
          <span>{documentData?.date || '-'}</span>
        </div>
        <div className='info-item'>
          <label>HDoc version:</label>
          <span>{documentData?.hdocVersion || '-'}</span>
        </div>
      </div>
     
    </div>
  );
};

export default GenerateDocument;
