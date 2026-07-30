import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HDocUserAdministration.css";

interface RoleState {
  checked: boolean;
  market: string;
}

type Roles = Record<string, RoleState>;

const ROLE_NAMES = [
  "Standard User",
  "Rule Admin",
  "Template Admin",
  "Document Auth Admin",
  "User Admin",
  "Adaptation user",
  "Manage Variable List",
  "Show change variants fields",
  "Market Super User",
];

const DEFAULT_MARKETS: Record<string, string> = {
  "Standard User": "-EU",
  "Adaptation user": "-EU",
};

const HDocUserAdministration: React.FC = () => {
  const navigate = useNavigate();

  const [userID, setUserID] = useState<string>("");
  const [userIDInput, setUserIDInput] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [marketOptions, setMarketOptions] = useState<string[]>([]);

  // 初始化角色状态
  const initRoles = (): Roles => {
    const roles: Roles = {};
    ROLE_NAMES.forEach((name) => {
      roles[name] = {
        checked: false,
        market: DEFAULT_MARKETS[name] || "",
      };
    });
    return roles;
  };

  const [roles, setRoles] = useState<Roles>(initRoles);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);
    fetchMarkets();
  }, [navigate]);

  const fetchMarkets = async () => {
    try {
      const response = await fetch("/api/admin/markets");
      const data = await response.json();
      if (data.code === 200 && data.data) {
        setMarketOptions(data.data.map((m: any) => m.market || m.code || m));
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
      setErrorMessage("Please enter a UserID.");
      setSuccessMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 获取用户基本信息
      const userResp = await fetch(`/api/admin/users/${encodeURIComponent(trimmedID)}`);
      const userData = await userResp.json();

      if (userResp.ok || userData.code === 200) {
        setUserName(userData.data?.userName || userData.userName || trimmedID);
      } else {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        setIsLoading(false);
        return;
      }

      // 获取用户角色
      const rolesResp = await fetch(`/api/admin/users/${encodeURIComponent(trimmedID)}/roles`);
      const rolesData = await rolesResp.json();

      if (rolesData.code === 200 && rolesData.data?.roles) {
        const newRoles = { ...initRoles() };
        rolesData.data.roles.forEach((r: { roleName: string; market: string }) => {
          if (newRoles[r.roleName]) {
            newRoles[r.roleName] = {
              checked: true,
              market: r.market || DEFAULT_MARKETS[r.roleName] || "",
            };
          }
        });
        setRoles(newRoles);
      } else {
        // 无角色，保持初始状态
        setRoles(initRoles());
      }
    } catch {
      setErrorMessage("Failed to connect to Saviynt system.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (roleName: string, checked: boolean) => {
    setRoles((prev) => ({
      ...prev,
      [roleName]: {
        ...prev[roleName],
        checked,
        market: checked && DEFAULT_MARKETS[roleName] ? DEFAULT_MARKETS[roleName] : prev[roleName].market,
      },
    }));
    clearMessages();
  };

  const handleMarketChange = (roleName: string, market: string) => {
    setRoles((prev) => ({
      ...prev,
      [roleName]: { ...prev[roleName], market },
    }));
    clearMessages();
  };

  const handleUpdateRole = async () => {
    if (!userIDInput.trim()) {
      setErrorMessage("Please enter a UserID.");
      setSuccessMessage("");
      return;
    }

    const selectedRoles = Object.entries(roles)
      .filter(([, state]) => state.checked)
      .map(([roleName, state]) => ({
        roleName,
        market: state.market,
      }));

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userIDInput.trim())}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: selectedRoles }),
      });

      const data = await response.json();
      if (response.ok || data.code === 200) {
        setSuccessMessage("Role updated successfully.");
      } else {
        setErrorMessage(data.message || "We didn't recognize the userid you entered. Please try again.");
      }
    } catch {
      setErrorMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!userIDInput.trim()) {
      setErrorMessage("Please enter a UserID.");
      setSuccessMessage("");
      return;
    }

    if (!window.confirm("Are you sure you want to delete all roles for this user?")) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userIDInput.trim())}/roles`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (response.ok || data.code === 200) {
        setSuccessMessage("All roles deleted successfully.");
        setRoles(initRoles());
        setUserName("");
      } else {
        setErrorMessage(data.message || "Failed to delete roles.");
      }
    } catch {
      setErrorMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserIDKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUserInfo();
    }
  };

  return (
    <div className="hua-page">
      {/* 顶部导航栏 */}
      <header className="hua-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="hua-body">
        <div className="hua-content">
          <h1 className="hua-title">HDoc User Administration</h1>

          {/* 消息 */}
          {errorMessage && <div className="hua-error">{errorMessage}</div>}
          {successMessage && <div className="hua-success">{successMessage}</div>}

          {/* UserID 输入行 */}
          <div className="hua-userid-row">
            <div className="hua-field hua-field-userid">
              <label className="hua-label">UserID</label>
              <input
                type="text"
                className="hua-input"
                value={userIDInput}
                onChange={(e) => { setUserIDInput(e.target.value.slice(0, 10)); clearMessages(); }}
                onKeyDown={handleUserIDKeyDown}
                disabled={isLoading}
                maxLength={10}
              />
            </div>
            <button className="hua-btn" onClick={handleUserInfo} disabled={isLoading}>
              User Info
            </button>
          </div>

          {/* User 名称 */}
          <div className="hua-user-row">
            <span className="hua-label">User</span>
            <span className="hua-user-name">{userName || "-"}</span>
          </div>

          {/* 权限表格 */}
          <table className="hua-role-table">
            <thead>
              <tr>
                <th className="hua-th-role">Role</th>
                <th className="hua-th-check">Select</th>
                <th className="hua-th-market">Market</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_NAMES.map((roleName) => (
                <tr key={roleName} className="hua-role-row">
                  <td className="hua-td-role">{roleName}</td>
                  <td className="hua-td-check">
                    <input
                      type="checkbox"
                      className="hua-checkbox"
                      checked={roles[roleName]?.checked || false}
                      onChange={(e) => handleCheckboxChange(roleName, e.target.checked)}
                      disabled={isLoading}
                    />
                  </td>
                  <td className="hua-td-market">
                    <select
                      className="hua-select"
                      value={roles[roleName]?.market || ""}
                      onChange={(e) => handleMarketChange(roleName, e.target.value)}
                      disabled={isLoading || !roles[roleName]?.checked}
                    >
                      <option value=""></option>
                      <option value="-EU">-EU</option>
                      {marketOptions.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 按钮行 */}
          <div className="hua-buttons">
            <button className="hua-btn" onClick={handleUpdateRole} disabled={isLoading}>Update Role</button>
            <button className="hua-btn hua-btn-delete" onClick={handleDeleteRole} disabled={isLoading}>Delete Role</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HDocUserAdministration;
