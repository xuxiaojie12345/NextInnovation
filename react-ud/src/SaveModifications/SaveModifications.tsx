import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SaveModifications.css';

/**
 * 路由参数类型
 * 从 ModifyDocument 页面跳转时传递
 */
interface LocationState {
  chassisNo: string;
  serie: string;
}

/**
 * 修改信息数据类型
 * 对应详细设计 DES-SaveModifications-001 2.1 控件属性
 */
interface SaveModificationsData {
  chassisSerie: string;
  chassisNumber: string;
  doctype: string;
  version: string;
  storing: {
    variable: string;
    newval: string;
  };
  foundUnreleasedVersion: string;
}

/**
 * 后端API基础地址
 */
const API_BASE_URL = 'http://localhost:8081';

/**
 * SaveModifications 组件 - 保存修改页面（UD06）
 *
 * 功能说明：
 * 1. 接收从 ModifyDocument 页面传递的 chassisNo 和 serie 参数
 * 2. 调用 UD06SaveModificationsApi 查询修改信息
 * 3. 展示 Doctype、Version、Storing、FOUND UNRELEASED VERSION 等信息
 * 4. 点击 Close 按钮返回前一页面
 *
 * 对应详细设计：DES-SaveModifications-001
 */
const SaveModifications: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // 从路由参数获取底盘信息（对应设计书 3.1.1 步骤2）
  const chassisNo = state?.chassisNo || '';
  const serie = state?.serie || '';

  // 页面数据状态
  const [data, setData] = useState<SaveModificationsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  /**
   * 页面初始化 - 调用 UD06SaveModificationsApi
   * 对应设计书 3.1.1 页面初始化流程
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!chassisNo) {
        setError('缺少必要的底盘信息');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 调用 UD06SaveModificationsApi（POST）
        // 对应设计书 4.1 接口定义
        const response = await axios.post(
          `${API_BASE_URL}/api/ud06/savemodifications/query`,
          {
            serie: serie,
            chno: chassisNo
          }
        );

        if (response.data.code === 200 && response.data.data) {
          setData(response.data.data);
        } else {
          // 对应设计书 3.2 校验 No.2
          setError(response.data.message || '未找到修改记录');
        }
      } catch (err: any) {
        if (err.response) {
          if (err.response.status === 404) {
            setError('未找到修改记录');
          } else {
            setError('系统异常，请联系管理员');
          }
        } else if (err.request) {
          setError('网络连接失败，请稍后重试');
        } else {
          setError('系统异常，请联系管理员');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chassisNo, serie]);

  /**
   * 点击 Close 按钮 - 关闭当前页面
   * 对应设计书 3.1.3 Close按钮点击处理
   */
  const handleClose = () => {
    navigate(-1);
  };

  // 加载中状态
  if (loading) {
    return (
      <div className='save-modifications-container'>
        <div className='page-header'>
          <h1 className='page-title'>HDoc - Save Modifications</h1>
        </div>
        <div className='loading-message'>加载中...</div>
      </div>
    );
  }

  return (
    <div className='save-modifications-container'>
      {/* 页面标题 */}
      <div className='page-header'>
        <h1 className='page-title'>HDoc - Save Modifications</h1>
      </div>

      {/* 错误消息区域 */}
      {error && (
        <div className='error-message-area'>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* 底盘信息区域（对应设计书 2.1 Chassis serie / Chassis number） */}
          <div className='vehicle-info-section'>
            <div className='info-item'>
              <label>Chassis serie :  {data.chassisSerie || '-'}</label>
            </div>
            <div className='info-item'>
              <label>Chassis number :  {data.chassisNumber || '-'}</label>
            </div>
          </div>

          {/* 修改信息区域（对应设计书 2.1 Doctype / Version / Storing） */}
          <div className='modification-info-section'>
            <div className='info-item item-doctype'>
              <label>Doctype :  {data.doctype || '-'}</label>
            </div>
            <div className='info-item item-version'>
              <label>Version :  {data.version || '-'}</label>
            </div>
            <div className='info-item'>
              <label>Storing :  {data.storing ? `${data.storing.variable}=${data.storing.newval}` : '-'}</label>
            </div>
          </div>

          {/* FOUND UNRELEASED VERSION 区域（对应设计书 2.1 FOUND UNRELEASED VERSION） */}
          <div className='found-version-section'>
            <label>FOUND UNRELEASED VERSION :  {data.foundUnreleasedVersion || '-'}</label>
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
