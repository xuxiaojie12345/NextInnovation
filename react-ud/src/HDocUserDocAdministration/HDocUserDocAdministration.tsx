import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../common/css/common.css';
import './HDocUserDocAdministration.css';

interface DocumentType {
  doctype: string;
  description: string;
}

const HDocUserDocAdministration: React.FC = () => {
  // ── 表单状态 ──
  const [userid, setUserid] = useState('');
  const [username, setUsername] = useState('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // ── UI 状态 ──
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 3000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // 页面初始化: 加载文档类型列表
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<DocumentType[]>('/document/types');
        if (res.code === 200 && res.data) {
          setDocumentTypes(res.data);
        }
      } catch {
        setMessage('System error. Please contact administrator.');
      }
    })();
  }, []);

  const clearMessages = () => {
    setMessage('');
    setSuccessMessage('');
  };

  // ── User Info ──
  const handleUserInfo = async () => {
    clearMessages();

    const trimmedId = userid.trim();
    if (!trimmedId) {
      setMessage('UserID is required');
      return;
    }

    setIsLoading(true);
    setUsername('');
    setSelectedDocs(new Set());

    try {
      // Step 1: 检查用户是否存在功能权限表中
      const authRes = await api.post<{ userId: string; authCount: number }>('/function/auth/count', {
        userid: trimmedId,
      });

      if (authRes.code !== 200) {
        setMessage('UserID is required');
        setIsLoading(false);
        return;
      }

      // Step 2: 获取用户文档权限
      const docRes = await api.post<{ userId: string; docTypeList: string[] }>('/user/doc/select', {
        userid: trimmedId,
      });

      if (docRes.code === 200 && docRes.data) {
        setUsername(trimmedId);
        const docList = docRes.data.docTypeList || [];
        setSelectedDocs(new Set(docList));
        setSuccessMessage('User info loaded successfully.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Update ──
  const handleUpdate = async () => {
    clearMessages();

    const trimmedId = userid.trim();
    if (!trimmedId) {
      setMessage('UserID is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<{ userId: string; docType: string[]; updateTime: string }>('/user/doc/update', {
        userid: trimmedId,
        doctype: Array.from(selectedDocs),
      });

      if (res.code === 200) {
        setSuccessMessage('用户文档权限更新成功');
      } else {
        setMessage(res.message || 'Failed to update document permissions.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="huda-container">
      <div className="huda-header">
        <h1>HDoc User Doc Administration</h1>
      </div>

      {message && <div className="huda-error">{message}</div>}
      {successMessage && <div className="huda-success">{successMessage}</div>}

      {/* ── UserID / User 输入区域 ── */}
      <table className="huda-input-table">
        <tbody>
          <tr>
            <td className="huda-label-cell">Userid:</td>
            <td>
              <input
                type="text"
                className="huda-input"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                maxLength={10}
                disabled={isLoading}
              />
            </td>
            <td>
              <button className="btn" onClick={handleUserInfo} disabled={isLoading}>
                User Info
              </button>
            </td>
          </tr>
          {/* {username && ( */}
            <tr>
              <td className="huda-label-cell">User:</td>
              <td colSpan={2} className="huda-value">{username}</td>
            </tr>
          {/* )} */}
        </tbody>
      </table>

      {/* ── 文档权限多选列表 ── */}
      {/* {username && ( */}
        <div className="huda-doc-section">
          <select
            className="huda-doc-listbox"
            multiple
            size={10}
            value={Array.from(selectedDocs)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
              setSelectedDocs(new Set(selected));
            }}
            disabled={isLoading}
          >
            {documentTypes.map((doc) => (
              <option key={doc.doctype} value={doc.doctype}>{doc.description}</option>
            ))}
          </select>
        </div>
      {/* )} */}

      {/* ── 操作按钮 ── */}
      {/* {username && ( */}
        <div className="huda-btn-row">
          <button className="btn" onClick={handleUpdate} disabled={isLoading}>
            UPDATE
          </button>
        </div>
      {/* )} */}
    </div>
  );
};

export default HDocUserDocAdministration;
