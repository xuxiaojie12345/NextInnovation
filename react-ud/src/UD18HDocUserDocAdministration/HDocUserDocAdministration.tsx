import React, { useState } from "react";
import "./HDocUserDocAdministration.css";

interface DocumentItem {
  description: string;
}

const HDocUserDocAdministration: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [documentList, setDocumentList] = useState<DocumentItem[]>([]);
  const [authorizedDocuments, setAuthorizedDocuments] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

  // 页面初始化：加载文档列表
  React.useEffect(() => {
    fetchDocumentList();
  }, []);

  // 获取所有可用文档列表
  const fetchDocumentList = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/api/ud18HDocUserDocAdministration/getDocumentList`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch document list");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        setDocumentList(data.data);
      } else {
        setErrorMessage("获取文档列表失败，请联系管理员");
      }
    } catch (error) {
      setErrorMessage("系统内部错误，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  // User Info按钮处理
  const handleUserInfo = async () => {
    // 清空之前的消息
    setErrorMessage("");
    setSuccessMessage("");

    // 校验UserID是否为空
    if (!userId || userId.trim() === "") {
      setErrorMessage("请输入UserID");
      return;
    }

    try {
      setIsLoading(true);

      // 调用API查询用户信息和文档权限
      const response = await fetch(
        `${API_BASE_URL}/api/ud18HDocUserDocAdministration/getUserFunctionsAndDocuments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        // 设置用户名
        setUserName(data.data.username || "");

        // 设置已授权的文档列表
        if (data.data.documents && Array.isArray(data.data.documents)) {
          const docDescriptions = data.data.documents.map(
            (doc: any) => doc.doctype || doc.description,
          );
          setAuthorizedDocuments(docDescriptions);
        } else {
          setAuthorizedDocuments([]);
        }

        setHasQueried(true);
        setSuccessMessage("用户信息查询成功");
      } else {
        // 检查是否是用户不存在的错误
        const errMsg = data.msg || data.message || "";
        if (errMsg.includes("recognize")) {
          setErrorMessage(
            "We didn't recognize the userid you entered. Please try again.",
          );
        } else {
          setErrorMessage(errMsg || "获取用户信息失败，请联系管理员");
        }
        setUserName("");
        setAuthorizedDocuments([]);
        setHasQueried(false);
      }
    } catch (error: any) {
      // 判断是否是网络错误
      if (error.message === "Failed to fetch") {
        setErrorMessage("无法连接到后端服务，请确认后端服务已启动");
      } else {
        setErrorMessage("系统内部错误，请联系管理员");
      }

      setUserName("");
      setAuthorizedDocuments([]);
      setHasQueried(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Update按钮处理
  const handleUpdate = async () => {
    // 清空之前的消息
    setErrorMessage("");
    setSuccessMessage("");

    // 检查是否已查询到用户
    if (!hasQueried) {
      setErrorMessage("请先查询用户信息");
      return;
    }

    try {
      setIsLoading(true);

      // 调用API更新用户文档权限
      const response = await fetch(
        `${API_BASE_URL}/api/ud18HDocUserDocAdministration/updateUserDocuments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId.trim(),
            documentTypes: authorizedDocuments,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update user documents");
      }

      const data = await response.json();

      if (data.code === 200) {
        setSuccessMessage("文档权限更新成功");
      } else {
        // 检查是否是用户不存在的错误
        const errMsg = data.msg || data.message || "";
        if (errMsg.includes("recognize")) {
          setErrorMessage(
            "We didn't recognize the userid you entered. Please try again.",
          );
        } else {
          setErrorMessage(errMsg || "更新失败，请联系管理员");
        }
      }
    } catch (error: any) {
      // 判断是否是网络错误
      if (error.message === "Failed to fetch") {
        setErrorMessage("无法连接到后端服务，请确认后端服务已启动");
      } else {
        setErrorMessage("系统内部错误，请联系管理员");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文档选择变化
  const handleDocumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value,
    );
    setAuthorizedDocuments(selectedOptions);
  };

  return (
    <div className='hudua-container'>
      {/* 标题 */}
      <h1 className='hudua-title'>HDoc Document Authorization</h1>

      {/* 边框容器 */}
      <div className='hudua-border-box'>
        {/* UserID和User Info区域 */}
        <div className='hudua-userid-section'>
          <label className='hudua-label'>Userid:</label>
          <input
            type='text'
            className='hudua-input-userid'
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            maxLength={10}
            disabled={isLoading}
          />
          <button
            className='hudua-button'
            onClick={handleUserInfo}
            disabled={isLoading}
          >
            User Info
          </button>
        </div>

        {/* User显示区域 */}
        <div className='hudua-user-section'>
          <label className='hudua-label'>User:</label>
          <span className='hudua-user-name'>{userName}</span>
        </div>

        {/* Document多选列表区域 */}
        <div className='hudua-document-section'>
          <select
            className='hudua-document-list'
            multiple
            value={authorizedDocuments}
            onChange={handleDocumentChange}
            disabled={isLoading}
            size={15}
          >
            {documentList.map((doc, index) => (
              <option key={index} value={doc.description}>
                {doc.description}
              </option>
            ))}
          </select>
        </div>

        {/* Update按钮区域 */}
        <div className='hudua-update-section'>
          <button
            className='hudua-button-update'
            onClick={handleUpdate}
            disabled={isLoading}
          >
            UPDATE
          </button>
        </div>

        {/* 错误消息显示 */}
        {errorMessage && (
          <div className='hudua-error-message'>{errorMessage}</div>
        )}

        {/* 成功消息显示 */}
        {successMessage && (
          <div className='hudua-success-message'>{successMessage}</div>
        )}
      </div>
    </div>
  );
};

export default HDocUserDocAdministration;
