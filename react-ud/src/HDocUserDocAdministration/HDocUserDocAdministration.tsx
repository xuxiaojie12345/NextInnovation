/**
 * HDocUserDocAdministration 组件 - HDoc用户文档管理页面（UD18）
 * 功能：管理用户文档权限，包括查询用户信息、查询文档权限、更新文档权限（DELETE+INSERT）
 * 对应详细设计：详细设计/詳細設計UD18.md
 */
import React, { useState, useEffect, useCallback } from "react";
import api from "../config/api";
import "./HDocUserDocAdministration.css";

/** 文档类型数据类型（来自后端 UD20 API，列名为大写） */
interface DocTypeItem {
  DOCTYPE: string;
  REGISTER_USER?: string;
  REGISTER_DATETIME?: string;
}

/**
 * HDocUserDocAdministration 组件
 * 提供用户文档权限的查询和更新管理功能
 */
// HDocUserDocAdministration

const HDocUserDocAdministration: React.FC = () => {
  // -------- 状态管理 (对应详细设计 6. 实现注意事项) --------
  const [userid, setUserid] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [docTypeList, setDocTypeList] = useState<DocTypeItem[]>([]);
  // 已选中的文档类型列表
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState<boolean>(false);

  /** 清空消息 */
  const clearMessage = () => setMessage("");

  /**
   * 页面初始化 - 获取文档类型列表（对应详细设计 3.1.1 页面初始化流程）
   * 调用 UD20GetDocumentListApi（GET /api/ud20/marketdocumentsettings）
   */
  useEffect(() => {
    // fetchDocTypes

    const fetchDocTypes = async () => {
      try {
        // response

        const response = await api.get(
          `/api/ud20/marketdocumentsettings`
        );
        if (response.data.code === 200 && Array.isArray(response.data.data)) {
          // 后端MyBatis返回的列名大小写不确定（取决于JDBC驱动），统一标准化
          const normalized = response.data.data.map((item: Record<string, any>) => ({
            DOCTYPE: item.DOCTYPE || item.doctype || "",
            REGISTER_USER: item.REGISTER_USER || item.register_user || "",
            REGISTER_DATETIME: item.REGISTER_DATETIME || item.register_datetime || ""
          }));
          setDocTypeList(normalized);
        }
      } catch (err) {
        console.error("Failed to load document list:", err);
      }
    };
    fetchDocTypes();
  }, []);

  /**
   * 校验UserID是否为空（对应详细设计 3.2 No.1/3）
   */
  // validateUserid

  const validateUserid = (): boolean => {
    if (!userid || userid.trim() === "") {
      setMessage("UserID is required.");
      setMessageType("error");
      return false;
    }
    return true;
  };

  /**
   * 校验UserID是否只包含半角英数字（对应详细设计 3.2 No.2/4）
   */
  // validateAlphanumeric

  const validateAlphanumeric = (): boolean => {
    if (!/^[a-zA-Z0-9]*$/.test(userid.trim())) {
      setMessage("UserID must contain only alphanumeric characters.");
      setMessageType("error");
      return false;
    }
    return true;
  };

  /**
   * 处理UserID输入变化（对应详细设计 6. 实现注意事项 - 输入限制）
   * 只允许半角英数字（a-z, A-Z, 0-9），最大10字符
   */
  // handleUseridChange

  const handleUseridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // val

    const val = e.target.value;
    // 只允许半角英数字
    if (/^[a-zA-Z0-9]*$/.test(val) && val.length <= 10) {
      setUserid(val);
      if (message) clearMessage();
    }
  };

  /**
   * 处理Document多选列表变更
   * 对应详细设计 2.1 Document多选控件
   */
  // handleDocSelectChange

  const handleDocSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // options

    const options = e.target.options;
    // selected

    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedDocs(selected);
  };

  /**
   * User Info按钮处理 - 查询用户信息和文档权限（对应详细设计 3.1.2 User Info处理流程）
   * 步骤1: 校验UserID
   * 步骤2: 存在性检查（checkAuth）
   * 步骤3: 查询用户信息和文档权限（select）
   */
  // handleUserInfo

  const handleUserInfo = async () => {
    clearMessage();

    // 前端校验（对应详细设计 3.2 No.1/2）
    if (!validateUserid()) return;
    if (!validateAlphanumeric()) return;

    setLoading(true);

    try {
      // 存在性检查：调用checkAuth（对应详细设计 3.1.2 步骤3）
      const authResponse = await api.post(
        `/api/ud18/UD18HDocUserDocAdministrationApi`,
        {
          userid: userid.trim(),
          operation: "checkAuth"
        }
      );

      if (
        authResponse.data.code !== 200 ||
        !authResponse.data.data?.exists
      ) {
        // 用户不存在（对应详细设计 3.2 No.5）
        setMessage(
          "We didn't recognize the userid you entered. Please try again."
        );
        setMessageType("error");
        setLoading(false);
        return;
      }

      // 查询用户信息和文档权限（对应详细设计 3.1.2 步骤4）
      const selectResponse = await api.post(
        `/api/ud18/UD18HDocUserDocAdministrationApi`,
        {
          userid: userid.trim(),
          operation: "select"
        }
      );

      if (selectResponse.data.code === 200) {
        // data

        const data = selectResponse.data.data;
        // 显示用户名（对应详细设计 3.1.2 步骤5 - 成功）
        setUsername(data.username || "");

        // 设置已选中的文档权限
        if (Array.isArray(data.doctypes)) {
          setSelectedDocs(data.doctypes);
        } else {
          setSelectedDocs([]);
        }
      } else {
        setMessage(
          selectResponse.data.message ||
            "System error. Please contact administrator."
        );
        setMessageType("error");
      }
    } catch (err) {
      // 异常处理（对应详细设计 5. 异常处理）
      setMessage("System error. Please contact administrator.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update按钮处理 - 更新用户文档权限（对应详细设计 3.1.3 Update处理流程）
   * 先DELETE后INSERT（先删既有数据，再创建新权限）
   */
  // handleUpdate

  const handleUpdate = async () => {
    clearMessage();

    // 前端校验（对应详细设计 3.2 No.3/4）
    if (!validateUserid()) return;
    if (!validateAlphanumeric()) return;

    setLoading(true);

    try {
      // 存在性检查：先验证用户是否存在（对应详细设计 3.1.3 步骤3）
      const authResponse = await api.post(
        `/api/ud18/UD18HDocUserDocAdministrationApi`,
        {
          userid: userid.trim(),
          operation: "checkAuth"
        }
      );

      if (
        authResponse.data.code !== 200 ||
        !authResponse.data.data?.exists
      ) {
        // 用户不存在（对应详细设计 3.2 No.6）
        setMessage(
          "We didn't recognize the userid you entered. Please try again."
        );
        setMessageType("error");
        setLoading(false);
        return;
      }

      // 先删除旧权限（对应详细设计 3.1.3 步骤4）
      await api.post(
        `/api/ud18/UD18HDocUserDocAdministrationApi`,
        {
          userid: userid.trim(),
          operation: "delete"
        }
      );

      // 再创建新权限（对应详细设计 3.1.3 步骤5）
      const createResponse = await api.post(
        `/api/ud18/UD18HDocUserDocAdministrationApi`,
        {
          userid: userid.trim(),
          operation: "create",
          doctypes: selectedDocs
        }
      );

      if (createResponse.data.code === 200) {
        // 更新成功（对应详细设计 3.1.3 步骤6 - 成功）
        setMessage("Document permissions updated successfully.");
        setMessageType("success");
      } else {
        setMessage(
          createResponse.data.message ||
            "System error. Please contact administrator."
        );
        setMessageType("error");
      }
    } catch (err) {
      setMessage("System error. Please contact administrator.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ud18-container">
      {/* 页面标题 */}
      <h1 className="ud18-title">
        EDB Engineering Database - HDoc User Doc Administration
      </h1>

      {/* 消息提示（对应详细设计 5. 异常处理） */}
      {message && (
        <div className={`ud18-message ${messageType}`}>{message}</div>
      )}

      {loading && <div className="ud18-loading">Processing...</div>}

      {/* 表单区域 */}
      <div className="ud18-form">
        {/* UserID 输入行 + User Info 按钮（同一行） */}
        <div className="ud18-field">
          <label className="ud18-label">UserID</label>
          <input
            type="text"
            className="ud18-input ud18-input-short"
            value={userid}
            onChange={handleUseridChange}
            disabled={loading}
            maxLength={10}
            placeholder="Enter User ID"
          />
          <button
            type="button"
            className="ud18-btn ud18-btn-inline"
            onClick={handleUserInfo}
            disabled={loading}
          >
            User Info
          </button>
        </div>

        {/* 用户名显示 */}
        {username && (
          <div className="ud18-user-label">
            <strong>User:</strong> {username}
          </div>
        )}

        {/* Document 多选下拉列表 */}
        <div className="ud18-field">
          <label className="ud18-label">Document</label>
          <div className="ud18-select-wrapper">
            <select
              multiple
              className="ud18-multiselect"
              value={selectedDocs}
              onChange={handleDocSelectChange}
              disabled={loading}
            >
              {docTypeList.map((doc) => {
                // isAssigned

                const isAssigned = selectedDocs.includes(doc.DOCTYPE);
                return (
                  <option key={doc.DOCTYPE} value={doc.DOCTYPE}
                    className={isAssigned ? 'ud18-option-assigned' : ''}>
                    {isAssigned ? '✓ ' : '  '}{doc.DOCTYPE}
                    {doc.REGISTER_USER ? ` - ${doc.REGISTER_USER}` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Update 按钮 */}
        <div className="ud18-btn-bottom">
          <button
            type="button"
            className="ud18-btn"
            onClick={handleUpdate}
            disabled={loading}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

// HDocUserDocAdministration

export default HDocUserDocAdministration;
