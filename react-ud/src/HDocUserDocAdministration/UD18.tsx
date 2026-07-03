import React, { useState, useCallback, useEffect, useMemo } from "react";
import { userDocApi } from "../services/api";
import "./UD18.css";

interface DocumentItem {
  doctype: string;
  description: string;
}

const UD18 = React.memo(() => {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [allDocs, setAllDocs] = useState<DocumentItem[]>([]);
  const [userDocs, setUserDocs] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const clearMessage = useCallback(() => {
    setMessage("");
    setMessageType("");
  }, []);

  // 初期表示：获取全部文档列表
  useEffect(() => {
    (async () => {
      try {
        const result = await userDocApi.getDocumentList();
        if (result && result.code === 200 && result.data?.documents) {
          setAllDocs(result.data.documents);
        }
      } catch {
        // 静默失败
      }
    })();
  }, []);

  const handleUserInfo = useCallback(async () => {
    clearMessage();
    const trimmed = userId.trim();
    if (!trimmed) {
      setMessage("请输入用户ID");
      setMessageType("error");
      return;
    }
    setIsLoading(true);
    try {
      const result = await userDocApi.getUserDoc(trimmed);
      if (result && result.code === 200 && result.data) {
        setUserName(result.data.userid || "");
        const matchedDoctypes: string[] = result.data.doctypes || [];
        setUserDocs(new Set(matchedDoctypes));
        setMessage("");
        setMessageType("");
      } else {
        setMessage(
          result?.msg ||
            "We didn't recognize the userid you entered. Please try again.",
        );
        setMessageType("error");
        setUserName("");
        setUserDocs(new Set());
      }
    } catch {
      setMessage("网络连接失败，请检查网络设置");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [userId, clearMessage]);

  // 匹配项置顶排序：userDocs中的项排前面
  const sortedDocs = useMemo(() => {
    const matched: DocumentItem[] = [];
    const unmatched: DocumentItem[] = [];
    for (const doc of allDocs) {
      if (userDocs.has(doc.doctype)) {
        matched.push(doc);
      } else {
        unmatched.push(doc);
      }
    }
    return [...matched, ...unmatched];
  }, [allDocs, userDocs]);

  const handleUpdate = useCallback(async () => {
    clearMessage();
    const trimmed = userId.trim();
    if (!trimmed) {
      setMessage("请输入用户ID");
      setMessageType("error");
      return;
    }
    setIsLoading(true);
    try {
      const documents = Array.from(userDocs).map((doctype) => ({
        doctype,
      }));
      const result = await userDocApi.updateUserDoc(trimmed, documents);
      if (result && result.code === 200) {
        setMessage(result.msg || "更新成功");
        setMessageType("success");
      } else {
        setMessage(
          result?.msg ||
            "We didn't recognize the userid you entered. Please try again.",
        );
        setMessageType("error");
      }
    } catch {
      setMessage("网络连接失败，请检查网络设置");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [userId, userDocs, clearMessage]);

  return (
    <div className="ud18-container">
      <header className="ud18-header">
        <div className="ud18-header-logo"></div>
      </header>
      <main className="ud18-main">
        <div className="ud18-card">
          <h1 className="ud18-page-title">HDoc Document Authorization</h1>

          {message && (
            <div className={`ud18-msg ud18-${messageType}`} role="alert">
              {message}
            </div>
          )}

          {/* User ID + User Info */}
          <div className="ud18-row">
            <label className="ud18-lbl" style={{ width: 60 }}>
              Userid
            </label>
            <input
              className="ud18-inp"
              type="text"
              maxLength={10}
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                clearMessage();
              }}
            />
            <button
              className="ud18-btn"
              onClick={handleUserInfo}
              disabled={isLoading}
            >
              User Info
            </button>
          </div>

          {/* User Name */}
          <div className="ud18-row">
            <label className="ud18-lbl" style={{ width: 60 }}>
              User
            </label>
            <input
              className="ud18-inp ud18-ro"
              type="text"
              value={userName}
              readOnly
              placeholder="User Name"
            />
          </div>

          {/* Document List */}
          {allDocs.length > 0 && (
            <div className="ud18-doc-list">
              {sortedDocs.map((doc) => (
                <div
                  className="ud18-doc-item"
                  key={doc.doctype}
                  onClick={() => {
                    setUserDocs((prev) => {
                      const next = new Set(prev);
                      if (next.has(doc.doctype)) {
                        next.delete(doc.doctype);
                      } else {
                        next.add(doc.doctype);
                      }
                      return next;
                    });
                  }}
                  style={
                    userDocs.has(doc.doctype)
                      ? {
                          background: "#dce8f0",
                          fontWeight: 500,
                          cursor: "pointer",
                        }
                      : { cursor: "pointer" }
                  }
                >
                  <span className="ud18-doc-lbl">
                    {doc.description || doc.doctype}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="ud18-btns">
            <button
              className="ud18-btn"
              onClick={handleUpdate}
              disabled={isLoading}
            >
              UPDATE
            </button>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD18;
