/**
 * EDBUserView 组件 - EDB用户查看页面（UD25）
 * 功能：获取并展示当前登录用户的详细信息，包括用户ID、负责人、职位和邮箱
 * 对应详细设计：详细设计/詳細設計UD25.md
 */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../config/api";
import "./EDBUserView.css";

/**
 * 用户信息数据类型
 * 对应详细设计 4.1 Response Success
 */
interface UserInfo {
  userid: string;
  responsible: string;
  userPosition: string;
  email: string;
}

/**
 * EDBUserView 组件
 * 展示当前登录用户的详细信息，所有字段为只读展示
 * 提供清空显示内容（Clear）和返回前页面（Back）功能
 */
const EDBUserView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 从导航状态或URL参数中获取userId
  // 支持两种方式：1) location.state.userId（SPA内导航） 2) URL查询参数（新窗口打开）
  const stateUserId = (location.state as { userId?: string })?.userId || "";
  const params = new URLSearchParams(location.search);
  const queryUserId = params.get("userId") || "";
  const userId = stateUserId || queryUserId;

  // 用户信息状态（对应详细设计 2.1 控件属性表）
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userid: "",
    responsible: "",
    userPosition: "",
    email: ""
  });
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  // 错误消息
  const [error, setError] = useState<string>("");

  /**
   * 页面初始化 - 调用 UD25AuthenticationApi 获取用户详细信息
   * 对应详细设计 3.1.1 页面初始化流程
   * 对应全体APIのプロンプト.txt 【UD25EduUserViewApi】
   * API Endpoint: GET /api/authentication/userinfo?userId=xxx
   */
  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError("");

      // 前置处理：校验userId是否为空
      if (!userId) {
        setError("User ID is required.");
        setLoading(false);
        return;
      }

      try {
        // 调用 UD25AuthenticationApi（GET /api/authentication/userinfo）
        // 传递userId作为请求参数
        const response = await api.get(
          `/api/authentication/userinfo`,
          {
            params: { userId }
          }
        );

        if (response.data.code === 200 && response.data.data) {
          // 成功：从响应中提取 userid、responsible、userPosition、email 字段
          const data: UserInfo = response.data.data;
          setUserInfo({
            userid: data.userid || "",
            responsible: data.responsible || "",
            userPosition: data.userPosition || "",
            email: data.email || ""
          });
        } else {
          // API返回非200状态，显示后端返回的具体错误消息
          setError(response.data.message || "Failed to load user information. Please try again.");
        }
      } catch (err) {
        // 异常处理：网络错误、超时或服务器错误
        setError("System error. Please contact administrator.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId]);

  /**
   * Clear 按钮处理 - 清空所有显示内容
   * 对应详细设计 3.1.2 Clear处理流程
   * 仅前端清空显示，不调用任何API
   */
  const handleClear = () => {
    setUserInfo({
      userid: "",
      responsible: "",
      userPosition: "",
      email: ""
    });
    setError("");
  };

  /**
   * Back 按钮处理 - 返回前一个页面
   * 对应详细设计 3.1.3 Back处理流程
   * 使用浏览器历史记录返回前画面
   */
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="ud25-container">
      {/* 页面标题 */}
      <h1 className="ud25-title">EDB Engineering Database - EDB User View</h1>

      {/* 按钮组 - 对应详细设计 2.1 Clear / Back */}
      <div className="ud25-button-group">
        <button type="button" className="ud25-btn" onClick={handleClear}>Clear</button>
        <button type="button" className="ud25-btn" onClick={handleBack}>Back</button>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="ud25-loading">Loading user information...</div>
      )}

      {/* 错误消息区域 */}
      {error && !loading && (
        <div className="ud25-error">{error}</div>
      )}

      {/* 用户信息表单 - 对应详细设计 2.1 控件属性表 */}
      {!loading && (
        <div className="ud25-form">
          {/* Userid */}
          <div className="ud25-field">
            <label className="ud25-label">Userid</label>
            <input type="text" className="ud25-input" value={userInfo.userid} readOnly />
          </div>

          {/* Responsible */}
          <div className="ud25-field">
            <label className="ud25-label">Responsible</label>
            <input type="text" className="ud25-input" value={userInfo.responsible} readOnly />
          </div>

          {/* User Position */}
          <div className="ud25-field">
            <label className="ud25-label">User Position</label>
            <input type="text" className="ud25-input" value={userInfo.userPosition} readOnly />
          </div>

          {/* E-mail */}
          <div className="ud25-field">
            <label className="ud25-label">E-mail</label>
            <input type="text" className="ud25-input" value={userInfo.email} readOnly />
          </div>
        </div>
      )}
    </div>
  );
};

export default EDBUserView;
