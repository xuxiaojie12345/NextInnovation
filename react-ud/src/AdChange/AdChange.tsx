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

  /**
   * 获取当前登录用户ID
   * TODO: 从JWT token或session中解析userId
   */
  const getCurrentUserId = (): string => {
    return localStorage.getItem('userId') || 'test_user';
  };

  /**
   * ADD按钮点击处理 - 新增底盘系列记录
   * 对应设计书 3.2 ADD按钮押下 和 4.1.2 ADD按钮押下
   */
  const handleAddClick = async () => {
    // 校验：Serie-Chnr和Desc不能为空
    if (!serieChnr.trim() || !desc.trim()) {
      setErrorMessage('请输入Serie-Chnr和Desc');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 步骤1：查询底盘系列是否存在 (对应设计书 4.1.2 步骤2)
      const checkResponse = await axios.get('/api/UD16/select-hdoc-adca-change', {
        params: { SerieChnr: serieChnr }
      });
      
      // 条件1：若底盘系列存在 (对应设计书 4.2 校验详细规格表 No.1)
      if (checkResponse.data.success && checkResponse.data.data?.serieChnr) {
        setErrorMessage('AFTER DEF CHANGE IS NOT ACTIVATED');
        return;
      }
      
      // 条件2：若底盘系列不存在，执行新增操作
      // 构建请求参数 (对应设计书 5.2 UD16AddHdocAdcaChangeApi)
      const requestData = {
        SerieChnr: serieChnr,
        Desc: desc,
        RegisterUser: getCurrentUserId(),
        RegisterDatetime: new Date().toISOString(),
        RegisterProcess: 'AdChange', // 当前画面ID
        UpdateUser: getCurrentUserId(),
        UpdateDatetime: new Date().toISOString(),
        UpdateProcess: 'AdChange' // 当前画面ID
      };
      
      // API请求 - 新增底盘系列记录 (对应设计书 5.2 UD16AddHdocAdcaChangeApi)
      const addResponse = await axios.post('/api/UD16/add-hdoc-adca-change', requestData);
      
      if (addResponse.data.success) {
        alert('新增成功');
        // 清空输入框
        setSerieChnr('');
        setDesc('');
      } else {
        setErrorMessage(addResponse.data.message || '新增失败');
      }
    } catch (error: any) {
      console.error('新增失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
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
      setErrorMessage('请输入Serie-Chnr');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 构建请求参数 (对应设计书 5.3 UD16DeleteHdocAdcaChangeApi)
      const requestData = {
        SerieChnr: serieChnr
      };
      
      // API请求 - 删除底盘系列记录 (对应设计书 5.3 UD16DeleteHdocAdcaChangeApi)
      const response = await axios.put('/api/UD16/delete-hdoc-adca-change', requestData);
      
      if (response.data.success) {
        alert('删除成功');
        // 清空输入框
        setSerieChnr('');
        setDesc('');
      } else {
        setErrorMessage(response.data.message || '删除失败');
      }
    } catch (error: any) {
      console.error('删除失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * CHECK按钮点击处理 - 检查功能（具体实现未知）
   * 对应设计书 3.4 CHECK按钮押下
   */
  const handleCheckClick = () => {
    // CHECK按钮的具体功能在需求文档中未明确
    // 根据设计书 7. 实现注意事项，预留接口或显示提示
    alert('CHECK功能开发中');
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
