import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import "../common/css/common.css";
import "./HDocUserDocAdministration.css";

interface DocumentType {
  doctype: string;
  description: string;
}

// 用户文档权限管理组件
const HDocUserDocAdministration: React.FC = () => {
  const [userid, setUserid] = useState("");
  const [username, setUsername] = useState("");
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 初始化：加载文档类型列表
  useEffect(() => {
    (async () => {
      try {
        const res = await api.post<{ documentList: any[] }>(
          "/ud20/getDocumentList",
          {},
        );
        if (res.code === 200 && res.data) {
          const list = (res.data.documentList || []).map((d: any) => ({
            doctype: d.DOCTYPE ?? "",
            description: d.DESCRIPTION ?? "",
          }));
          setDocumentTypes(list);
        }
      } catch (err: any) {
        setMessage(
          err?.message || "System error. Please contact administrator.",
        );
      }
    })();
  }, []);

  const clearMessages = () => {
    setMessage("");
    setSuccessMessage("");
  };

  const handleUserInfo = async () => {
    clearMessages();

    const trimmedId = userid.trim();
    if (!trimmedId) {
      setMessage("UserID is required");
      return;
    }

    setIsLoading(true);
    setUsername("");
    setSelectedDocs(new Set());

    try {
      // Step 1: 检查用户是否存在功能权限表中
      const authRes = await api.post<{ userId: string; authCount: number }>(
        "/function/auth/count",
        {
          userid: trimmedId,
        },
      );

      if (authRes.code === 200 && authRes.data?.authCount === 0) {
        throw new Error(
          "We didn't recognize the userid you entered. Please try again.",
        );
      }

      // Step 2: 调用 AuthenticationApi (/login) 取得用户名
      const loginRes = await api.post<{ userId: string; username: string }>(
        "/login",
        {
          userid: trimmedId,
          password: "",
        },
      );
      if (loginRes.code === 200 && loginRes.data) {
        setUsername(loginRes.data.username || trimmedId);
      } else {
        setUsername(trimmedId);
      }

      // Step 3: 调用 UD18SelectHdocUserDoc 获取文档权限
      const docRes = await api.post<{ userId: string; docTypeList: string[] }>(
        "/user/doc/select",
        {
          userid: trimmedId,
        },
      );

      if (docRes.code === 200 && docRes.data) {
        const docList = docRes.data.docTypeList || [];
        setSelectedDocs(new Set(docList));
      }
    } catch (err: any) {
      setUsername("");
      setSelectedDocs(new Set());
      setMessage(err?.message || "System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    clearMessages();

    const trimmedId = userid.trim();
    if (!trimmedId) {
      setMessage("UserID is required");
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = localStorage.getItem("userId") || "";

      // Step 1: 检查用户是否存在功能权限表中
      const authRes = await api.post<{ userId: string; authCount: number }>(
        "/function/auth/count",
        {
          userid: trimmedId,
        },
      );

      if (authRes.code === 200 && authRes.data?.authCount === 0) {
        throw new Error(
          "We didn't recognize the userid you entered. Please try again.",
        );
      }

      // Step 1: UD18DeleteHdocUserDoc - 删除用户文档权限
      const deleteRes = await api.post("/user/doc/delete", {
        userid: trimmedId,
      });
      if (deleteRes.code !== 200) {
        setMessage(
          deleteRes.message || "Failed to delete document permissions.",
        );
        setIsLoading(false);
        return;
      }

      // Step 2: UD18CreateHdocUserDoc - 新增用户文档权限
      for (const doctype of Array.from(selectedDocs)) {
        const createRes = await api.post("/user/doc/create", {
          userid: trimmedId,
          doctype: doctype,
          currentUser: currentUser,
        });
        if (createRes.code !== 200) {
          setMessage(
            createRes.message ||
              `Failed to add document permission: ${doctype}`,
          );
          setIsLoading(false);
          return;
        }
      }

      setSuccessMessage("用户文档权限更新成功");
    } catch (err: any) {
      setMessage(err?.message || "System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="huda-container panel panel-w600">
      <div className="huda-header panel-header">
        <h1>HDoc User Doc Administration</h1>
      </div>

      {message && <div className="huda-error msg-error">{message}</div>}
      {successMessage && <div className="huda-success msg-success">{successMessage}</div>}

      {/* 用户输入 */}
      <table className="huda-input-table">
        <tbody>
          <tr>
            <td className="huda-label-cell">Userid:</td>
            <td>
              <input
                type="text"
                className="huda-input"
                value={userid}
                onChange={(e) => setUserid(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                maxLength={10}
                disabled={isLoading}
              />
            </td>
            <td>
              <button
                className="btn"
                onClick={handleUserInfo}
                disabled={isLoading}
              >
                User Info
              </button>
            </td>
          </tr>
          <tr>
            <td className="huda-label-cell">User:</td>
            <td colSpan={2} className="huda-value">
              {username}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 文档类型选择 */}
      <div className="huda-doc-section">
        <select
          className="huda-doc-listbox"
          multiple
          size={10}
          value={Array.from(selectedDocs)}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              (opt) => opt.value,
            );
            setSelectedDocs(new Set(selected));
          }}
          disabled={isLoading}
        >
          {documentTypes.map((doc) => (
            <option key={doc.doctype} value={doc.doctype}>
              {doc.description}
            </option>
          ))}
        </select>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={handleUpdate} disabled={isLoading}>
          UPDATE
        </button>
      </div>
    </div>
  );
};

export default HDocUserDocAdministration;
