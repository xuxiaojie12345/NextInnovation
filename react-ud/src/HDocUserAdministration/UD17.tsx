import React, { useState, useCallback, useEffect } from "react";
import { userApi } from "../services/api";
import "./UD17.css";

interface RoleEntry {
  checked: boolean;
  market: string;
}

const createRoleMap = (): Record<string, RoleEntry> => ({
  "Standard User": { checked: false, market: "" },
  "Rule Admin": { checked: false, market: "" },
  "Template Admin": { checked: false, market: "" },
  "Document Auth Admin": { checked: false, market: "" },
  "User Admin": { checked: false, market: "" },
  "Adaptation user": { checked: false, market: "" },
});

const UD17 = React.memo(() => {
  const [userId, setUserId] = useState<string>("");
  const [userField1, setUserField1] = useState<string>("");
  const [roles, setRoles] = useState<Record<string, RoleEntry>>(createRoleMap);
  const [manageVarChecked, setManageVarChecked] = useState(false);
  const [superUserMarket, setSuperUserMarket] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [marketOptions, setMarketOptions] = useState<string[]>([]);

  // 从后台API获取Market列表
  useEffect(() => {
    userApi
      .getMarkets()
      .then((res: any) => {
        if (res?.code === 200 && res.data && Array.isArray(res.data.markets)) {
          const markets = res.data.markets.map(
            (item: any) => item.market || item,
          );
          setMarketOptions(markets);
        }
      })
      .catch(() => {
        // 静默失败
      });
  }, []);

  const clearMessage = useCallback(() => {
    setMessage("");
    setMessageType("");
  }, []);

  const roleList = [
    "Standard User",
    "Rule Admin",
    "Template Admin",
    "Document Auth Admin",
    "User Admin",
    "Adaptation user",
  ];

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
      const result = await userApi.getUserInfo(trimmed);
      if (result && result.code === 200 && result.data) {
        const fullName = result.data.username || result.data.name || "";
        const parts = fullName.split(" ", 2);
        setUserField1(parts[0] || fullName);
        const perms = result.data.permissions || [];
        const next = createRoleMap();
        if (Array.isArray(perms)) {
          for (const p of perms) {
            if (next[p.role]) {
              next[p.role].checked = true;
              if (p.markets && p.markets.length > 0) {
                next[p.role].market = p.markets[0];
              }
            }
            if (p.role === "Manage Variable List" && p.checked) {
              setManageVarChecked(true);
            }
          }
        }
        setRoles(next);
        setMessage("");
        setMessageType("");
      } else {
        setMessage(
          result?.msg ||
            "We didn't recognize the userid you entered. Please try again.",
        );
        setMessageType("error");
        setUserField1("");
        setRoles(createRoleMap());
      }
    } catch {
      setMessage("网络连接失败，请检查网络设置");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [userId, clearMessage]);

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
      const checkedRoles = roleList.filter((r) => roles[r]?.checked);
      const permissionsData = checkedRoles.map((r) => ({
        role: r,
        markets: roles[r]?.market ? [roles[r].market] : [],
      }));
      if (manageVarChecked) {
        permissionsData.push({ role: "Manage Variable List", markets: [] });
      }
      const result = await userApi.updateUserRole(trimmed, permissionsData);
      if (result && result.code === 200) {
        setMessage(result.msg || "权限更新成功");
        setMessageType("success");
      } else {
        setMessage(result?.msg || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch {
      setMessage("网络连接失败，请检查网络设置");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [userId, roles, clearMessage]);

  const handleDelete = useCallback(async () => {
    clearMessage();
    const trimmed = userId.trim();
    if (!trimmed) {
      setMessage("请输入用户ID");
      setMessageType("error");
      return;
    }
    if (!window.confirm("确定要删除该用户的所有权限吗？")) return;
    setIsLoading(true);
    try {
      const result = await userApi.deleteUserRole(trimmed);
      if (result && result.code === 200) {
        setMessage(result.msg || "权限删除成功");
        setMessageType("success");
        setRoles(createRoleMap());
        setManageVarChecked(false);
        setSuperUserMarket("");
        setUserField1("");
      } else {
        setMessage(result?.msg || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch {
      setMessage("网络连接失败，请检查网络设置");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [userId, clearMessage]);

  const setRole = useCallback(
    (role: string, field: keyof RoleEntry, value: boolean | string) => {
      setRoles((prev) => ({
        ...prev,
        [role]: { ...prev[role], [field]: value },
      }));
    },
    [],
  );

  return (
    <div className="ud17-container">
      <header className="ud17-header">
        <div className="ud17-header-logo"></div>
      </header>
      <main className="ud17-main">
        <div className="ud17-card">
          <h1 className="ud17-page-title">HDoc User Admin</h1>

          {message && (
            <div className={`ud17-msg ud17-${messageType}`} role="alert">
              {message}
            </div>
          )}

          {/* User ID */}
          <div className="ud17-sec">
            <div className="ud17-row">
              <label className="ud17-lbl" style={{ width: 70 }}>
                Userid
              </label>
              <input
                className="ud17-inp"
                type="text"
                maxLength={10}
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  clearMessage();
                }}
              />
              <button
                className="ud17-btn"
                onClick={handleUserInfo}
                disabled={isLoading}
              >
                USER INFO
              </button>
            </div>
            <div className="ud17-row">
              <label className="ud17-lbl" style={{ width: 70 }}>
                User
              </label>
              <input
                className="ud17-inp"
                type="text"
                value={userField1}
                onChange={(e) => setUserField1(e.target.value)}
                placeholder="First Name"
              />
            </div>
          </div>

          {/* Role grid: horizontal layout */}
          <div className="ud17-role-grid">
            {roleList.slice(0, 5).map((role) => (
              <div
                className="ud17-role-item"
                key={role}
                style={{ border: "none", background: "transparent" }}
              >
                <label className="ud17-chk-lbl">
                  <input
                    type="checkbox"
                    checked={roles[role]?.checked || false}
                    onChange={(e) => setRole(role, "checked", e.target.checked)}
                  />
                  {role}
                </label>
                {role !== "User Admin" && (
                  <div className="ud17-role-market">
                    {role === "Standard User" ? (
                      <select size={6} className="ud17-sel">
                        <option value="-EU">-EU</option>
                      </select>
                    ) : (
                      <select
                        size={6}
                        className="ud17-sel"
                        value={roles[role]?.market || ""}
                        onChange={(e) =>
                          setRole(role, "market", e.target.value)
                        }
                      >
                        {marketOptions.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Roles section */}
          <div className="ud17-sec ud17-roles-section">
            <div className="ud17-roles-label">
              <label className="ud17-lbl">Roles</label>
            </div>
            <div className="ud17-roles-content">
              {/* Adaptation user */}
              <div
                className="ud17-role-item"
                style={{
                  maxWidth: 260,
                  border: "none",
                  background: "transparent",
                }}
              >
                <label className="ud17-chk-lbl">
                  <input
                    type="checkbox"
                    checked={roles["Adaptation user"]?.checked || false}
                    onChange={(e) =>
                      setRole("Adaptation user", "checked", e.target.checked)
                    }
                  />
                  Adaptation user
                </label>
                <div className="ud17-role-market">
                  <select size={6} className="ud17-sel">
                    <option value="-EU">-EU</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Manage Variable List */}
          <div className="ud17-sec ud17-roles-section">
            <div className="ud17-roles-label">
              <label className="ud17-lbl">Manage Variable List</label>
            </div>
            <div className="ud17-roles-content">
              <input
                type="checkbox"
                className="ud17-mvl-chk"
                checked={manageVarChecked}
                onChange={(e) => setManageVarChecked(e.target.checked)}
              />
            </div>
          </div>

          {/* Market Super User */}
          <div className="ud17-sec">
            <div className="ud17-row">
              <label className="ud17-lbl" style={{ width: 120 }}>
                Market Super User
              </label>
              <select
                size={6}
                className="ud17-sel"
                value={superUserMarket}
                onChange={(e) => setSuperUserMarket(e.target.value)}
              >
                {marketOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="ud17-btns">
            <button
              className="ud17-btn"
              onClick={handleUpdate}
              disabled={isLoading}
            >
              Update Role
            </button>
            <button
              className="ud17-btn"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete Role
            </button>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD17;
