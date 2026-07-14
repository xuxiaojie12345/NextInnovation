import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../config/api';
import './SaveModifications.css';

/**
 * 从 ModifyDocument 页面跳转时传递的参数
 */
interface LocationState {
  chassisNo: string;
  serie: string;
  modifiedVariables?: { variable: string; modifiedValue: string }[];
}

/**
 * SaveModifications 组件 - 保存修改页面（UD06）
 *
 * 功能说明：
 * 1. 接收从 ModifyDocument 页面传递的 chassisNo、serie 和 modifiedVariables 参数
 * 2. 调用 UD06SaveModificationsApi 查询 Doctype / Version / FOUND UNRELEASED VERSION
 * 3. Storing 使用前一页面传递的 modifiedVariables 生成（逗号分隔）
 * 4. 点击 Close 按钮返回前一页面
 *
 * 对应详细设计：DES-SaveModifications-001
 */
const SaveModifications: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // 从路由参数获取底盘信息和修改变量列表（对应设计书 3.1.1 步骤2）
  const chassisNo = state?.chassisNo || '';
  const serie = state?.serie || '';
  const modifiedVariables = state?.modifiedVariables || [];

  // 生成 Storing 显示文本（逗号分隔）- 保持现有逻辑
  const storingText = modifiedVariables.length > 0
    ? modifiedVariables.map((v) => `${v.variable}=${v.modifiedValue}`).join(', ')
    : '-';

  // 页面数据状态
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [doctype, setDoctype] = useState<string>('-');
  const [version, setVersion] = useState<string>('-');
  const [foundUnreleasedVersion, setFoundUnreleasedVersion] = useState<string>('-');

  /**
   * 页面初始化 - 调用 UD06SaveModificationsApi
   * 对应设计书 3.1.1 页面初始化流程，4.1 UD06SaveModificationsApi
   */
  useEffect(() => {
    const fetchModifications = async () => {
      if (!chassisNo || !serie) {
        setError('缺少必要的底盘信息');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await api.post(
          `/api/ud06/savemodifications/query`,
          { serie, chno: chassisNo },
          { timeout: 10000 }
        );

        if (response.data.code === 200 && response.data.data) {
          const data = response.data.data;
          setDoctype(data.doctype || '-');
          setVersion(data.version || '-');
          setFoundUnreleasedVersion(data.foundUnreleasedVersion || '-');
        } else {
          setError(response.data.message || '未找到该底盘的修改记录');
        }
      } catch (err: any) {
        // 后端始终返回 HTTP 200，业务错误在 response.data.code 中处理
        if (err.code === 'ECONNABORTED') {
          setError('请求超时，请检查网络连接');
        } else {
          setError('系统异常，请联系管理员');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchModifications();
  }, [chassisNo, serie]);

  /**
   * 点击 Close 按钮 - 关闭当前页面
   * 对应设计书 3.1.2 Close按钮点击处理
   */
  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className='save-modifications-container'>
      {/* 页面标题 */}
      <div className='page-header'>
        <h1 className='page-title'>Save Modifications</h1>
      </div>

      {/* 加载中状态 */}
      {loading && (
        <div className='loading-message'>Loading...</div>
      )}

      {/* 错误消息区域 */}
      {error && !loading && (
        <div className='error-message-area'>
          <p>{error}</p>
        </div>
      )}

      {!error && !loading && (
        <>
          {/* 底盘信息区域（对应设计书 2.1 Chassis serie / Chassis number） */}
          <div className='vehicle-info-section'>
            <div className='info-item'>
              <label>Chassis serie :  {serie || '-'}</label>
            </div>
            <div className='info-item'>
              <label>Chassis number :  {chassisNo || '-'}</label>
            </div>
          </div>

          {/* 修改信息区域（对应设计书 2.1 Doctype / Version / Storing） */}
          <div className='modification-info-section'>
            <div className='info-item item-doctype'>
              <label>Doctype :  {doctype}</label>
            </div>
            <div className='info-item item-version'>
              <label>Version :  {version}</label>
            </div>
            <div className='info-item'>
              <label>Storing :  {storingText}</label>
            </div>
          </div>

          {/* FOUND UNRELEASED VERSION 区域（对应设计书 2.1 FOUND UNRELEASED VERSION） */}
          <div className='found-version-section'>
            <label>FOUND UNRELEASED VERSION :  {foundUnreleasedVersion}</label>
          </div>

          {/* Message 区域（对应设计书 2.1 Message - 固定显示） */}
          <div className='message-section'>
            <p className='release-message'>VERSION IS RELEASED</p>
          </div>
        </>
      )}

      {/* Close 按钮（对应设计书 2.1 Close） */}
      <div className='button-section'>
        <button
          className='close-button'
          onClick={handleClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SaveModifications;
