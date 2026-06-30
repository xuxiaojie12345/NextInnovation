import React, { useState } from 'react';
import axios from 'axios';
import './AdChange.css';

/**
 * AdChange组件 - AD/CA Change（底盘系列变更）管理页面
 * 
 * @description 支持新增、删除底盘系列及其描述，提供Check功能
 * @props 无Props
 */
const AdChange: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [serieChnr, setSerieChnr] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const showMessage = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage('');

  /**
   * 获取当前登录用户ID
   */
  const getCurrentUserId = (): string => {
    return sessionStorage.getItem('userId') || '';
  };

  /**
   * ADD按钮点击处理 - 新增底盘系列记录
   * 对应设计书 3.2 ADD按钮押下 和 4.1.2 ADD按钮押下
   */
  const handleAddClick = async () => {
    // 校验：Serie-Chnr和Desc不能为空
    if (!serieChnr.trim() || !desc.trim()) {
      showMessage('请输入Serie-Chnr和Desc', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    
    try {
      // 步骤1：查询底盘系列是否存在 (对应设计书 4.1.2 步骤2)
      const checkResponse = await axios.post('http://localhost:8081/api/ud16/selecthdocadcachange', {
        SerieChnr: serieChnr
      });
      
      // 条件1：若底盘系列存在 (对应设计书 4.2 校验详细规格表 No.1)
      if (checkResponse.data.code === 200 && checkResponse.data.data?.serieChnr) {
        showMessage('AFTER DEF CHANGE IS NOT ACTIVATED', 'error');
        return;
      }
      
      // 条件2：若底盘系列不存在，执行新增操作
      const requestData = {
        SerieChnr: serieChnr,
        Desc: desc,
        RegisterUser: getCurrentUserId(),
        RegisterDatetime: new Date().toISOString(),
        RegisterProcess: 'AdChange',
        UpdateUser: getCurrentUserId(),
        UpdateDatetime: new Date().toISOString(),
        UpdateProcess: 'AdChange'
      };
      
      // API请求 - 新增底盘系列记录 (对应设计书 5.2 UD16AddHdocAdcaChangeApi)
      const addResponse = await axios.post('http://localhost:8081/api/ud16/inserthdocadcachange', requestData);
      
      if (addResponse.data.code === 200) {
        showMessage('新增成功', 'success');
        // 清空输入框
        setSerieChnr('');
        setDesc('');
      } else {
        showMessage(addResponse.data.msg || '新增失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * DELETE按钮点击处理 - 删除底盘系列记录
   * 对应设计书 3.3 DELETE按钮押下 和 4.1.3 DELETE按钮押下
   */
  const handleDeleteClick = async () => {
    // 校验：Serie-Chnr不能为空
    if (!serieChnr.trim()) {
      showMessage('请输入Serie-Chnr', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    
    try {
      // API请求 - 更新底盘系列ACT为N（软删除）(对应设计书 5.3)
      const response = await axios.put('http://localhost:8081/api/ud16/updatehdocadcachange', {
        SerieChnr: serieChnr,
        UpdateUser: getCurrentUserId(),
        UpdateProcess: 'AdChange'
      });
      
      if (response.data.code === 200) {
        showMessage('更新成功', 'success');
        // 清空输入框
        setSerieChnr('');
        setDesc('');
      } else {
        showMessage(response.data.msg || '删除失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * CHECK按钮点击处理 - 检查底盘系列是否存在
   * 对应设计书 3.4 CHECK按钮押下
   */
  const handleCheckClick = async () => {
    // 校验：Serie-Chnr不能为空
    if (!serieChnr.trim()) {
      showMessage('请输入Serie-Chnr', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    
    try {
      // 调用查询API检查底盘系列是否存在
      const response = await axios.post('http://localhost:8081/api/ud16/selecthdocadcachange', {
        SerieChnr: serieChnr
      });
      
      if (response.data.code === 200 && response.data.data?.serieChnr) {
        // 底盘系列存在
        showMessage('AFTER DEF CHANGE IS NOT ACTIVATED', 'error');
      } else {
        // 底盘系列不存在
        showMessage('底盘系列不存在', 'info');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='ac-container'>
      <div className='ac-content'>
        {/* 标题区域 */}
        <h2 className='ac-title'>AD Change</h2>
        <div className='ac-form-solid'>

        {/* 表单区域 */}
        <div className='ac-form-section'>
          {/* Serie-Chnr输入行 */}
          <div className='ac-form-row'>
            <label className='ac-label'>Serie-Chnr:</label>
            <input 
              type='text' 
              className='ac-input ac-input-short' 
              value={serieChnr}
              onChange={(e) => setSerieChnr(e.target.value)}
              maxLength={15}
              disabled={isLoading}
            />
          </div>
          
          {/* Desc输入行 */}
          <div className='ac-form-row'>
            <label className='ac-label'>Desc:</label>
            <input 
              type='text' 
              className='ac-input ac-input-long' 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={4000}
              disabled={isLoading}
            />
          </div>
        </div>
        
        {/* 按钮区域 */}
        <div className='ac-button-row'>
          <button 
            className='ac-action-button' 
            onClick={handleAddClick}
            disabled={isLoading}
          >
            ADD
          </button>
          <button 
            className='ac-action-button' 
            onClick={handleDeleteClick}
            disabled={isLoading}
          >
            DELETE
          </button>
          <button 
            className='ac-action-button' 
            onClick={handleCheckClick}
            disabled={isLoading}
          >
            CHECK
          </button>
            </div>
        </div>
        
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='ac-error-message'>
            {errorMessage}
          </div>
        )}
        
        {/* 消息显示区域 */}
        {message && (
          <div className={`message-display message-${messageType}`}>
            {message}
          </div>
        )}
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='ac-loading'>
            加载中...
          </div>
        )}
      </div>
    </div>
  );
};

export default AdChange;
