import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './EdbUserView.css';

/**
 * EdbUserView组件 - 用户信息详情展示页面
 * 
 * @description 显示用户的详细信息，包括UserID、Responsible、User Position、E-mail。从前画面接收userId参数，调用API获取用户信息并显示。
 * @props 无Props
 */
const EdbUserView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [userId, setUserId] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [userPosition, setUserPosition] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * 画面初期表示 - 接收前画面传递的userId参数并调用API获取用户信息
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    // 从前画面接收userId参数 (对应设计书 7. 实现注意事项)
    if (location.state) {
      const state = location.state as any;
      if (state.userId) {
        fetchUserInfo(state.userId);
      } else {
        setErrorMessage('未接收到用户ID参数');
      }
    } else {
      setErrorMessage('未接收到用户ID参数');
    }
  }, [location.state]);

  /**
   * 调用AuthenticationApi获取用户详细信息
   * 对应设计书 5.1 AuthenticationApi - UD01Login
   */
  const fetchUserInfo = async (userId: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // API请求 - 获取用户信息 (对应设计书 5.1)
      const response = await axios.post('/api/UD01/login', {
        userId: userId,
        userName: '' // 可选参数
      });
      
      if (response.data.success) {
        const data = response.data.data || {};
        // 将用户信息显示在对应的TextField中 (对应设计书 2.1 控件属性表)
        setUserId(data.userid || '');
        setResponsible(data.responsible || '');
        setUserPosition(data.userPosition || '');
        setEmail(data.email || '');
      } else {
        setErrorMessage(response.data.message || '用户信息获取失败');
      }
    } catch (error: any) {
      console.error('获取用户信息失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear按钮点击处理 - 清空所有显示字段
   * 对应设计书 3.2 Clear按钮押下
   */
  const handleClearClick = () => {
    setUserId('');
    setResponsible('');
    setUserPosition('');
    setEmail('');
    setErrorMessage('');
  };

  /**
   * Back按钮点击处理 - 返回前画面
   * 对应设计书 3.3 Back按钮押下
   */
  const handleBackClick = () => {
    navigate(-1); // 返回前画面（通过history.back()或navigate(-1)）
  };

  return (
    <div className='euv-container'>
      <div className='euv-content'>
        {/* 标题区域 */}
        <h2 className='euv-title'>EDB User View</h2>
        <div className='euv-form-section'>
        {/* 按钮区域 - 浅蓝色背景 */}
        <div className='euv-button-row'>
          <button 
            className='euv-action-button' 
            onClick={handleClearClick}
            disabled={isLoading}
          >
            Clear
          </button>
          <button 
            className='euv-action-button' 
            onClick={handleBackClick}
            disabled={isLoading}
          >
            Back
          </button>
        </div>
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='euv-loading'>
            加载中...
          </div>
        )}
        
        {/* 表单区域 - 带边框 */}
        
          {/* Userid行 */}
          <div className='euv-form-row'>
            <label className='euv-label'>Userid</label>
            <select className='euv-select-operator' defaultValue=''>
              <option value='='>=</option>
              {/* <option value='!='>!=</option>
              <option value='>'>&gt;</option>
              <option value='<'>&lt;</option>
              <option value='&gt;='>=</option>
              <option value='&lt;='>&lt;=</option> */}
            </select>
            <input 
              type='text' 
              className='euv-input euv-input-userid'
              value={userId}
            />
          </div>
          
          {/* Responsible行 */}
          <div className='euv-form-row'>
            <label className='euv-label'>Responsible</label>
            <select className='euv-select-operator' defaultValue='='>
              <option value='='>=</option>
              
            </select>
            <input 
              type='text' 
              className='euv-input euv-input-responsible'
              value={responsible}
            />
          </div>
          
          {/* User Position行 */}
          <div className='euv-form-row'>
            <label className='euv-label'>User Position</label>
            <select className='euv-select-operator' defaultValue='='>
              <option value='='>=</option>
              
            </select>
            <input 
              type='text' 
              className='euv-input euv-input-userposition'
              value={userPosition}
            />
          </div>
          
          {/* E-mail行 */}
          <div className='euv-form-row'>
            <label className='euv-label'>E-mail</label>
            <select className='euv-select-operator' defaultValue='='>
              <option value='='>=</option>
            
            </select>
            <input 
              type='text' 
              className='euv-input euv-input-email'
              value={email} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdbUserView;
