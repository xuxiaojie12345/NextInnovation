import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UD16_ADChange.css';
import apiClient from '../api/config';

/**
 * UD16_ADChange - AD Change 管理页面组件
 *
 * @component
 * @returns {JSX.Element} AD Change管理页面元素
 */
const UD16_ADChange: React.FC = () => {
  const navigate = useNavigate();

  // 未登录时重定向到登录页面
  useEffect(() => {
    const userID = localStorage.getItem('userID');
    if (!userID) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // ==================== 状态管理 ====================
  const [serieChnr, setSerieChnr] = useState<string>('');  // Serie-Chnr输入值
  const [desc, setDesc] = useState<string>('');             // Desc描述输入值
  const [message, setMessage] = useState<string>('');        // 消息
  const [messageType, setMessageType] = useState<'success' | 'error'>('error'); // 消息类型
  const [isLoading, setIsLoading] = useState<boolean>(false); // 加载状态标识
  const [showModal, setShowModal] = useState<boolean>(false); // CHECK弹框显示状态
  const [modalMessage, setModalMessage] = useState<string>(''); // CHECK弹框消息内容
  const [showAddModal, setShowAddModal] = useState<boolean>(false); // ADD确认弹框显示状态

  // ==================== 常量定义 ====================
  const MAX_SERIE_CHNR_LENGTH = 16;    // Serie-Chnr最大长度
  const MAX_DESC_LENGTH = 4000;        // Desc最大长度

  // ==================== 工具函数 ====================

  /**
   * 从Serie-Chnr中拆分出SERIE和CHNR
   * Serie-Chnr的英文字母部分赋值给serie，数字部分赋值给chnr
   *
   * @param {string} value - 完整的Serie-Chnr值
   * @returns {{ serie: string, chnr: string }} 拆分后的系列和编号
   */
  const splitSerieChnr = (value: string) => {
    // 按连字符拆分，前半部分为serie，后半部分为chnr
    const parts = value.split('-');
    return {
      serie: parts[0] || '',
      chnr: parts.slice(1).join('-') || '',
    };
  };

  /**
   * 显示错误消息
   *
   * @param {string} msg - 消息内容
   */
  const showMessage = (msg: string, type: 'success' | 'error' = 'error') => {
    setMessage(msg);
    setMessageType(type);
  };

  // ==================== API调用 ====================

  /**
   * 点击ADD按钮处理流程
   */
  const handleAdd = async () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedSerieChnr = serieChnr.trim();
    const trimmedDesc = desc.trim();

    // 2. 空值校验（前端校验）
    if (!trimmedSerieChnr) {
      showMessage('请输入Serie-Chnr');
      return; // 终止流程
    }

    // 3. 拆分Serie-Chnr
    const { serie, chnr } = splitSerieChnr(trimmedSerieChnr);

    // 4. API调用
    setIsLoading(true);
    showMessage('');

    try {
      // POST /api/ud16/addchange
      const userId = localStorage.getItem('userID') || 'SYSTEM';
      const response = await apiClient.post('/api/ud16/addchange', {
        serie,
        chnr,
        desc: trimmedDesc,
        userId,
      });

      // 5. 结果处理
      if (response.data && response.data.code === 200) {
        // 添加成功
        showMessage('添加成功', 'success');
        // 清空输入框
        setSerieChnr('');
        setDesc('');
      } else {
        showMessage(response.data?.msg || '添加失败');
      }
    } catch (error: any) {
      // 异常处理

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.msg;

        // 记录已存在且ACT="U"的情况（HTTP 409 Conflict）
        if (statusCode === 400 && errorMsg === '记录已存在且已激活') {
          // 弹框显示警告消息，点击确定后终止流程
          setModalMessage('记录已存在且已激活');
          setShowModal(true);
        } else if (statusCode === 409 && errorMsg === 'AFTER DEF CHANGE IS NOT ACTIVATED') {
          // 弹框显示警告消息，点击确定后结束处理
          setModalMessage('AFTER DEF CHANGE IS NOT ACTIVATED');
          setShowAddModal(true);
        } else if (statusCode >= 500) {
          showMessage('服务器内部错误，请联系管理员');
        } else {
          showMessage(errorMsg || '添加失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        showMessage('网络连接失败，请检查网络设置');
      } else {
        showMessage('数据库插入失败，请联系管理员');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 点击DELETE按钮处理流程
   */
  const handleDelete = async () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedSerieChnr = serieChnr.trim();

    // 2. 空值校验（前端校验）
    if (!trimmedSerieChnr) {
      showMessage('请输入Serie-Chnr');
      return; // 终止流程
    }

    // 3. 拆分Serie-Chnr
    const { serie, chnr } = splitSerieChnr(trimmedSerieChnr);

    // 4. API调用
    setIsLoading(true);
    showMessage('');

    try {
      const response = await apiClient.delete('/api/ud16/deletechange', {
        data: {
          serie,
          chnr,
        },
      });

      // 5. 结果处理
      if (response.data && response.data.code === 200) {
        // 删除成功
        showMessage('删除成功', 'success');
        setSerieChnr('');
        setDesc('');
      } else {
        showMessage(response.data?.msg || '删除失败');
      }
    } catch (error: any) {
      // 异常处理

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.msg;

        if (statusCode === 404) {
          showMessage('记录不存在');
        } else if (statusCode >= 500) {
          showMessage('服务器内部错误，请联系管理员');
        } else {
          showMessage(errorMsg || '删除失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        showMessage('网络连接失败，请检查网络设置');
      } else {
        showMessage('数据库删除失败，请联系管理员');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 点击CHECK按钮处理流程
   */
  const handleCheck = async () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedSerieChnr = serieChnr.trim();

    // 2. 空值校验（前端校验）
    if (!trimmedSerieChnr) {
      showMessage('请输入Serie-Chnr');
      return; // 终止流程
    }

    // 3. 拆分Serie-Chnr
    const { serie, chnr } = splitSerieChnr(trimmedSerieChnr);

    // 4. API调用
    setIsLoading(true);
    showMessage('');

    try {
      const response = await apiClient.get('/api/ud16/checkchange', {
        params: {
          serie,
          chnr,
        },
      });

      // 5. 结果处理 - 弹框显示查询结果
      if (response.data && response.data.code === 200 && response.data.data) {
        if (response.data.data.exists) {
          // 记录存在 - 弹框显示
          setModalMessage('对应的数据存在');
          setShowModal(true);
        } else {
          setModalMessage('记录不存在');
          setShowModal(true);
        }
      } else {
        setModalMessage('记录不存在');
        setShowModal(true);
      }
    } catch (error: any) {
      // 异常处理

      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode >= 500) {
          showMessage('服务器内部错误，请联系管理员');
        } else {
          showMessage(error.response.data?.msg || '查询失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        showMessage('网络连接失败，请检查网络设置');
      } else {
        showMessage('数据库查询失败，请联系管理员');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 关闭CHECK弹框
   * 点击弹框中的"确定"按钮时调用，关闭弹框
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Serie-Chnr 输入变化
   * 限制：只允许半角英数字
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件对象
   */
  const handleSerieChnrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 半角英数字和连字符校验
    if (/^[a-zA-Z0-9-]*$/.test(val)) {
      setSerieChnr(val);
      // 用户重新输入时清空错误提示
      if (message) showMessage('');
    }
  };

  /**
   * 处理 Desc 输入变化
   *
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - 输入事件对象
   */
  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDesc(e.target.value);
    // 用户重新输入时清空错误提示
    if (message) showMessage('');
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud16-container'>
      <div className='ud16-content'>
        {/* 页面标题 */}
        <h1 className='ud16-title'>AD Change</h1>

        {/* 错误消息显示区域 */}
        {message && (
          <div className={`ud16-message ud16-message--${messageType}`}>
            {message}
          </div>
        )}
        
        {/* 输入区域 */}
        <div className='ud16-form-section'>
          {/* Serie-Chnr 输入框 */}
          <div className='ud16-form-group'>
            <label htmlFor='serieChnr'>
              Serie-Chnr
            </label>
            <input
              id='serieChnr'
              type='text'
              className='ud16-input'
              value={serieChnr}
              onChange={handleSerieChnrChange}
              placeholder='请输入Serie-Chnr'
              disabled={isLoading}
              maxLength={MAX_SERIE_CHNR_LENGTH}
            />
          </div>

          {/* Desc 输入框 */}
          <div className='ud16-form-group ud16-form-group-desc'>
            <label htmlFor='desc'>
              Desc
            </label>
            <textarea
              id='desc'
              className='ud16-textarea'
              value={desc}
              onChange={handleDescChange}
              placeholder='请输入描述'
              disabled={isLoading}
              maxLength={MAX_DESC_LENGTH}
              rows={1}
            />
          </div>
        </div>

        {/* 按钮区域 */}
        <div className='ud16-button-section'>
          <button
            className='ud16-btn ud16-btn-add'
            onClick={handleAdd}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : 'ADD'}
          </button>

          <button
            className='ud16-btn ud16-btn-delete'
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : 'DELETE'}
          </button>

          <button
            className='ud16-btn ud16-btn-check'
            onClick={handleCheck}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : 'CHECK'}
          </button>
        </div>

      </div>

      {/* 弹框遮罩层 - CHECK按钮查询结果显示 */}
      {showModal && (
        <div className='ud16-modal-overlay' onClick={handleCloseModal}>
          <div className='ud16-modal-dialog' onClick={(e) => e.stopPropagation()}>
            <div className='ud16-modal-content'>
              <p className='ud16-modal-message'>{modalMessage}</p>
            </div>
            <div className='ud16-modal-footer'>
              <button
                className='ud16-btn ud16-btn-modal-ok'
                onClick={handleCloseModal}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹框遮罩层 - ADD确认弹框 */}
      {showAddModal && (
        <div className='ud16-modal-overlay' onClick={() => setShowAddModal(false)}>
          <div className='ud16-modal-dialog' onClick={(e) => e.stopPropagation()}>
            <div className='ud16-modal-content'>
              <p className='ud16-modal-message'>AFTER DEF CHANGE IS NOT ACTIVATED</p>
            </div>
            <div className='ud16-modal-footer'>
              <button
                className='ud16-btn ud16-btn-modal-ok'
                onClick={() => setShowAddModal(false)}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UD16_ADChange;
