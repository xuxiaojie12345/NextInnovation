import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HDocUserDocAdministration.css";

interface DocItem {
  doctype: string;
  description: string;
}

const HDocUserDocAdministration: React.FC = () => {
  const navigate = useNavigate();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [userIDInput, setUserIDInput] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [documentList, setDocumentList] = useState<DocItem[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setSessionUserID(storedUserID);
    fetchDocumentList();
  }, [navigate]);

  const fetchDocumentList = async () => {
    try {
      const response = await fetch("/api/ud18/getdocumentlist");
      const data = await response.json();
      if (data.success && data.data) {
        setDocumentList(data.data);
      }
    } catch {
      // silent
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const clearMessages = () => {
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleUserInfo = async () => {
    const trimmedID = userIDInput.trim();
    if (!trimmedID) {
      setErrorMessage("User ID is required.");
      setSuccessMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setUserName("");
    setSelectedDocs(new Set());

    try {
      // 检查用户是否存在
      const checkResp = await fetch(`/api/ud18/checkuserexists?userId=${encodeURIComponent(trimmedID)}`);
      const checkData = await checkResp.json();

      if (!checkData.success || !checkData.data?.exists) {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        setIsLoading(false);
        return;
      }

      // 获取用户名
      const userResp = await fetch(`/api/ud18/getuserfromsaviynt?userId=${encodeURIComponent(trimmedID)}`);
      const userData = await userResp.json();
      if (userData.success && userData.data) {
        setUserName(userData.data.userName || trimmedID);
      }

      // 获取用户当前文档权限
      const permResp = await fetch(`/api/ud18/getuserpermissions?userId=${encodeURIComponent(trimmedID)}`);
      const permData = await permResp.json();
      if (permData.success && permData.data?.documents) {
        setSelectedDocs(new Set(permData.data.documents));
      }
    } catch {
      setErrorMessage("Failed to connect to Saviynt system.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserIDKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUserInfo();
    }
  };

  const handleDocCheckboxChange = (doctype: string, checked: boolean) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(doctype);
      } else {
        next.delete(doctype);
      }
      return next;
    });
    clearMessages();
  };

  const handleUpdate = async () => {
    const trimmedID = userIDInput.trim();
    if (!trimmedID) {
      setErrorMessage("User ID is required.");
      setSuccessMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 再次检查用户是否存在
      const checkResp = await fetch(`/api/ud18/checkuserexists?userId=${encodeURIComponent(trimmedID)}`);
      const checkData = await checkResp.json();

      if (!checkData.success || !checkData.data?.exists) {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        setIsLoading(false);
        return;
      }

      // 更新用户文档权限
      const updateResp = await fetch("/api/ud18/updateuserdocpermissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: trimmedID,
          documents: Array.from(selectedDocs),
        }),
      });

      const updateData = await updateResp.json();
      if (updateData.success) {
        setSuccessMessage("User document permissions updated successfully.");
      } else {
        setErrorMessage(updateData.message || "Update failed.");
      }
    } catch {
      setErrorMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hda-page">
      {/* 顶部导航栏 */}
      <header className="hda-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="hda-body">
        <div className="hda-content">
          <h1 className="hda-title">HDoc User Doc Administration</h1>

          {/* 消息 */}
          {errorMessage && <div className="hda-error">{errorMessage}</div>}
          {successMessage && <div className="hda-success">{successMessage}</div>}

          {/* UserID 输入行 */}
          <div className="hda-userid-row">
            <div className="hda-field hda-field-userid">
              <label className="hda-label">UserID</label>
              <input
                type="text"
                className="hda-input"
                value={userIDInput}
                onChange={(e) => { setUserIDInput(e.target.value.slice(0, 10)); clearMessages(); }}
                onKeyDown={handleUserIDKeyDown}
                disabled={isLoading}
                maxLength={10}
              />
            </div>
            <button className="hda-btn" onClick={handleUserInfo} disabled={isLoading}>
              User Info
            </button>
          </div>

          {/* User 名称 */}
          <div className="hda-user-row">
            <span className="hda-label">User</span>
            <span className="hda-user-name">{userName || "-"}</span>
          </div>

          {/* Document 列表 */}
          <div className="hda-doc-section">
            <div className="hda-doc-header">Document</div>
            <div className="hda-doc-list">
              {documentList.length === 0 ? (
                <div className="hda-doc-empty">No documents available.</div>
              ) : (
                documentList.map((doc, idx) => (
                  <label key={idx} className="hda-doc-item">
                    <input
                      type="checkbox"
                      className="hda-doc-checkbox"
                      checked={selectedDocs.has(doc.doctype)}
                      onChange={(e) => handleDocCheckboxChange(doc.doctype, e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="hda-doc-text">
                      {doc.description || doc.doctype}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 按钮 */}
          <div className="hda-buttons">
            <button className="hda-btn" onClick={handleUpdate} disabled={isLoading}>Update</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HDocUserDocAdministration;
