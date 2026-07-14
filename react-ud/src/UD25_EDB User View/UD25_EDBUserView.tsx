import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD25_EDBUserView.css';

/**
 * UD25_EDBUserView EDB用户信息展示页面组件
 *
 * 功能说明：
 * - 从UD09画面的"Created by user"链接跳转过来，接收userId参数
 * - 页面加载时调用API获取用户详细信息（Userid、Responsible、User Position、E-mail）
 * - 提供Clear（清空）和Back（返回）按钮
 *
 * @component
 * @returns {JSX.Element} EDB用户信息展示页面元素
 */
const UD25_EDBUserView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  const [userid, setUserid] = useState<string>('');           // 用户ID
  const [responsible, setResponsible] = useState<string>(''); // 负责人
  const [userPosition, setUserPosition] = useState<string>(''); // 用户职位
  const [email, setEmail] = useState<string>('');             // 邮箱
  const [message, setMessage] = useState<string>('');         // 消息
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(false); // 加载状态

  // ==================== 初始数据加载 ====================
  useEffect(() => {
    /**
     * 页面加载时执行用户信息获取
     *
     * 处理流程：
     * 1. 从location.state中获取userId参数
     * 2. 调用AuthenticationApi获取用户信息
     * 3. 将数据显示在对应的TextField控件中
     */
    const fetchUserInfo = async () => {
      // 获取前画面传递的userId
      const userId = (location.state as any)?.userId;
      if (!userId) {
        setMessage('未获取到用户ID');
        setMessageType('error');
        return;
      }

      setIsLoading(true);
      console.log('userId...'+userId);
      try {
        // 调用API获取用户信息
        // 注意：参数名须与后端 @RequestParam 一致（userId，非userID）
        const response = await apiClient.get('/api/ud01/authentication', {
          params: { userId: userId },
        });

        // 后端返回格式：{ code: 200, msg: "登录成功", data: { userId, username, responsible, userPosition, email } }
        if (response.data && response.data.code === 200 && response.data.data) {
          const data = response.data.data;
          setUserid(data.userId || '');
          setResponsible(data.responsible || '');
          setUserPosition(data.userPosition || '');
          setEmail(data.email || '');
          setMessage('');
        } else {
          // 响应数据为空
          setMessage(response.data?.msg || '未找到用户信息');
          setMessageType('error');
        }
      } catch (error) {
        // 对应设计书 3.2 校验详细规格表 - No.2 API调用失败
        console.error('获取用户信息失败:', error);
        setMessage('获取用户信息失败');
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [location.state]);

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Clear 按钮点击
   * 处理流程：
   * 1. 清空所有TextField控件的值
   * 2. 清除消息显示
   */
  const handleClear = useCallback(() => {
    setUserid('');
    setResponsible('');
    setUserPosition('');
    setEmail('');
    setMessage('');
    setMessageType('info');
  }, []);

  /**
   * 处理 Back 按钮点击
   * 处理流程：
   * 1. 执行画面迁移到前一个画面
   */
  const handleBack = useCallback(() => {
    navigate(-1); // 返回前一个画面
  }, [navigate]);

  // ==================== 渲染 ====================
  return (
    <div className="ud25-container">
      {/* 页面标题 */}
      <div className="ud25-title">EDB User View</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud25-message ud25-message--${messageType}`}>
          {message}
        </div>
      )}

      {/* 主内容区域 */}
      <div className="ud25-content">



        {/* 按钮区域 */}
        <div className="ud25-button-row">
          <button
            className="ud25-btn ud25-btn--default"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear
          </button>
          <button
            className="ud25-btn ud25-btn--primary"
            onClick={handleBack}
            disabled={isLoading}
          >
            Back
          </button>
        </div>

        {/* 用户ID */}
        <div className="ud25-form-group">
          <label>Userid</label>
          <select className="ud25-compare-select">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <input
            type="text"
            value={userid}
            readOnly
            placeholder={isLoading ? '加载中...' : ''}
          />
        </div>

        {/* 负责人 */}
        <div className="ud25-form-group">
          <label>Responsible</label>
          <select className="ud25-compare-select">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <input
            type="text"
            value={responsible}
            readOnly
            placeholder={isLoading ? '加载中...' : ''}
          />
        </div>

        {/* 用户职位 */}
        <div className="ud25-form-group">
          <label>User Position</label>
          <select className="ud25-compare-select">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <input
            type="text"
            value={userPosition}
            readOnly
            placeholder={isLoading ? '加载中...' : ''}
          />
        </div>

        {/* 邮箱 */}
        <div className="ud25-form-group">
          <label>E-mail</label>
          <select className="ud25-compare-select">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <input
            type="text"
            value={email}
            readOnly
            placeholder={isLoading ? '加载中...' : ''}
          />
        </div>

      </div>
    </div>
  );
};

export default UD25_EDBUserView;
