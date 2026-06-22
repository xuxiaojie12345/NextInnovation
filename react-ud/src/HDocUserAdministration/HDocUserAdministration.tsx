// HDocUserAdministration.tsx - UD17模块
import React, { useState, useEffect } from "react";
import "./HDocUserAdministration.css";

interface MarketItem {
  market: string;
  description: string;
}

interface UserInfo {
  userid: string;
  username: string;
  responsible: string;
  userposition: string;
  email: string;
}

interface PermissionData {
  functions: Array<{
    function: string;
    userid: string;
  }>;
  markets: Array<{
    userid: string;
    market: string;
    type: string;
    bu: string;
  }>;
}

interface FormData {
  userId: string;
  userName: string;
  // Standard User
  standardUserChecked: boolean;
  standardUserMarkets: string[];
  // Rule Admin
  ruleAdminChecked: boolean;
  ruleAdminMarkets: string[];
  // Template Admin
  templateAdminChecked: boolean;
  templateAdminMarkets: string[];
  // Document Auth Admin
  documentAuthAdminChecked: boolean;
  documentAuthAdminMarkets: string[];
  // User Admin
  userAdminChecked: boolean;
  // Adaptation user
  adaptationUserChecked: boolean;
  adaptationUserMarkets: string[];
  // Manage Variable List
  manageVariableListChecked: boolean;
  // Market Super User
  marketSuperUserMarkets: string[];
}

const HDocUserAdministration = () => {
  const [formData, setFormData] = useState<FormData>({
    userId: "",
    userName: "",
    standardUserChecked: false,
    standardUserMarkets: [],
    ruleAdminChecked: false,
    ruleAdminMarkets: [],
    templateAdminChecked: false,
    templateAdminMarkets: [],
    documentAuthAdminChecked: false,
    documentAuthAdminMarkets: [],
    userAdminChecked: false,
    adaptationUserChecked: false,
    adaptationUserMarkets: [],
    manageVariableListChecked: false,
    marketSuperUserMarkets: [],
  });

  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 页面初始化：加载市场列表数据
  useEffect(() => {
    fetchMarketList();
  }, []);

  // 获取市场列表
  const fetchMarketList = async () => {
    try {
      setIsLoading(true);
      const API_BASE_URL = "http://localhost:8081";
      const response = await fetch(
        `${API_BASE_URL}/api/ud17HDocUserAdministration/getMarketList`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch market list");
      }

      const data = await response.json();
      if (data.code === 200 && data.data) {
        setMarketList(data.data);
      } else {
        setErrorMessage("获取市场列表失败，请联系管理员");
      }
    } catch (error) {
      console.error("Error fetching market list:", error);
      setErrorMessage("系统内部错误，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理UserID输入变化
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, userId: e.target.value });
    setErrorMessage("");
    setSuccessMessage("");
  };

  // User Info按钮点击 - 查询用户信息
  const handleUserInfo = async () => {
    if (!formData.userId.trim()) {
      setErrorMessage("请输入UserID");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const API_BASE_URL = "http://localhost:8081";

      // 调用API获取用户信息
      const response = await fetch(
        `${API_BASE_URL}/api/ud17HDocUserAdministration/getUserInfo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: formData.userId,
            userName: formData.userName,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        // 设置用户名
        const currentUserId = formData.userId.trim();
        const userName = data.data.username || "";
        setFormData({ ...formData, userName });

        // 获取用户权限配置（传入userName防止被覆盖）
        await fetchUserPermissions(currentUserId, userName);
      } else {
        setErrorMessage(
          "We didn't recognize the userid you entered. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setErrorMessage(
        "We didn't recognize the userid you entered. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 获取用户权限配置
  const fetchUserPermissions = async (userId: string, userName?: string) => {
    try {
      const API_BASE_URL = "http://localhost:8081";
      const response = await fetch(
        `${API_BASE_URL}/api/ud17HDocUserAdministration/getUserPermissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user permissions");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        const permissionData: PermissionData = data.data;

        // 解析并填充表单数据（保留传入的userName）
        const updatedFormData = {
          ...formData,
          userName: userName || formData.userName,
        };

        // 解析functions数组
        if (permissionData.functions) {
          permissionData.functions.forEach((func) => {
            switch (func.function) {
              case "Standard User":
                updatedFormData.standardUserChecked = true;
                break;
              case "Rule Admin":
                updatedFormData.ruleAdminChecked = true;
                break;
              case "Template Admin":
                updatedFormData.templateAdminChecked = true;
                break;
              case "Document Auth Admin":
                updatedFormData.documentAuthAdminChecked = true;
                break;
              case "User Admin":
                updatedFormData.userAdminChecked = true;
                break;
              case "Adaptation user":
                updatedFormData.adaptationUserChecked = true;
                break;
              case "Manage Variable List":
                updatedFormData.manageVariableListChecked = true;
                break;
            }
          });
        }

        // 解析markets数组
        if (permissionData.markets) {
          permissionData.markets.forEach((market) => {
            switch (market.type) {
              case "Standard User":
                if (
                  !updatedFormData.standardUserMarkets.includes(market.market)
                ) {
                  updatedFormData.standardUserMarkets.push(market.market);
                }
                break;
              case "Rule Admin":
                if (!updatedFormData.ruleAdminMarkets.includes(market.market)) {
                  updatedFormData.ruleAdminMarkets.push(market.market);
                }
                break;
              case "Template Admin":
                if (
                  !updatedFormData.templateAdminMarkets.includes(market.market)
                ) {
                  updatedFormData.templateAdminMarkets.push(market.market);
                }
                break;
              case "Document Auth Admin":
                if (
                  !updatedFormData.documentAuthAdminMarkets.includes(
                    market.market,
                  )
                ) {
                  updatedFormData.documentAuthAdminMarkets.push(market.market);
                }
                break;
              case "Adaptation user":
                if (
                  !updatedFormData.adaptationUserMarkets.includes(market.market)
                ) {
                  updatedFormData.adaptationUserMarkets.push(market.market);
                }
                break;
              case "Market Super User":
                if (
                  !updatedFormData.marketSuperUserMarkets.includes(
                    market.market,
                  )
                ) {
                  updatedFormData.marketSuperUserMarkets.push(market.market);
                }
                break;
            }
          });
        }

        setFormData(updatedFormData);
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      setErrorMessage("获取用户权限失败，请联系管理员");
    }
  };

  // 处理角色复选框变化
  const handleRoleCheckboxChange = (role: keyof FormData, checked: boolean) => {
    setFormData({ ...formData, [role]: checked });
  };

  // 处理Market多选下拉框变化
  const handleMarketSelectChange = (
    role: keyof FormData,
    selectedValues: string[],
  ) => {
    setFormData({ ...formData, [role]: selectedValues });
  };

  // Update Role按钮点击 - 更新用户权限
  const handleUpdateRole = async () => {
    if (!formData.userId.trim()) {
      setErrorMessage("请先查询用户信息");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // 构建请求数据
      const requestData = {
        userId: formData.userId,
        roles: {
          standardUser: formData.standardUserChecked
            ? formData.standardUserMarkets
            : [],
          ruleAdmin: formData.ruleAdminChecked ? formData.ruleAdminMarkets : [],
          templateAdmin: formData.templateAdminChecked
            ? formData.templateAdminMarkets
            : [],
          documentAuthAdmin: formData.documentAuthAdminChecked
            ? formData.documentAuthAdminMarkets
            : [],
          userAdmin: formData.userAdminChecked,
          adaptationUser: formData.adaptationUserChecked
            ? formData.adaptationUserMarkets
            : [],
          manageVariableList: formData.manageVariableListChecked,
          marketSuperUser: formData.marketSuperUserMarkets,
        },
      };

      const API_BASE_URL = "http://localhost:8081";
      const currentUser = localStorage.getItem("currentUser") || "";

      // 将前端角色数据转换为后端API格式并逐个发送
      const roleUpdatePromises: Promise<Response>[] = [];

      // Standard User
      if (
        requestData.roles.standardUser &&
        Array.isArray(requestData.roles.standardUser)
      ) {
        requestData.roles.standardUser.forEach((market: string) => {
          roleUpdatePromises.push(
            fetch(`${API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: requestData.userId,
                market,
                type: "Standard User",
                bu: "",
                function: "Standard User",
                updateUser: currentUser,
              }),
            }),
          );
        });
      }

      // Rule Admin
      if (
        requestData.roles.ruleAdmin &&
        Array.isArray(requestData.roles.ruleAdmin)
      ) {
        requestData.roles.ruleAdmin.forEach((market: string) => {
          roleUpdatePromises.push(
            fetch(`${API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: requestData.userId,
                market,
                type: "Rule Admin",
                bu: "",
                function: "Rule Admin",
                updateUser: currentUser,
              }),
            }),
          );
        });
      }

      // Template Admin
      if (
        requestData.roles.templateAdmin &&
        Array.isArray(requestData.roles.templateAdmin)
      ) {
        requestData.roles.templateAdmin.forEach((market: string) => {
          roleUpdatePromises.push(
            fetch(`${API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: requestData.userId,
                market,
                type: "Template Admin",
                bu: "",
                function: "Template Admin",
                updateUser: currentUser,
              }),
            }),
          );
        });
      }

      // Document Auth Admin
      if (
        requestData.roles.documentAuthAdmin &&
        Array.isArray(requestData.roles.documentAuthAdmin)
      ) {
        requestData.roles.documentAuthAdmin.forEach((market: string) => {
          roleUpdatePromises.push(
            fetch(`${API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: requestData.userId,
                market,
                type: "Document Auth Admin",
                bu: "",
                function: "Document Auth Admin",
                updateUser: currentUser,
              }),
            }),
          );
        });
      }

      // User Admin（无市场）
      if (requestData.roles.userAdmin === true) {
        roleUpdatePromises.push(
          fetch(`${API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: requestData.userId,
              market: "",
              type: "",
              bu: "",
              function: "User Admin",
              updateUser: currentUser,
            }),
          }),
        );
      }

      // Adaptation user
      if (
        requestData.roles.adaptationUser &&
        Array.isArray(requestData.roles.adaptationUser)
      ) {
        requestData.roles.adaptationUser.forEach((market: string) => {
          roleUpdatePromises.push(
            fetch(`${API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: requestData.userId,
                market,
                type: "Adaptation user",
                bu: "",
                function: "Adaptation user",
                updateUser: currentUser,
              }),
            }),
          );
        });
      }

      // Manage Variable List（无市场）
      if (requestData.roles.manageVariableList === true) {
        roleUpdatePromises.push(
          fetch(`${API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: requestData.userId,
              market: "",
              type: "",
              bu: "",
              function: "Manage Variable List",
              updateUser: currentUser,
            }),
          }),
        );
      }

      // Market Super User
      if (
        requestData.roles.marketSuperUser &&
        Array.isArray(requestData.roles.marketSuperUser)
      ) {
        requestData.roles.marketSuperUser.forEach((market: string) => {
          roleUpdatePromises.push(
            fetch(`${API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: requestData.userId,
                market,
                type: "Market Super User",
                bu: "",
                function: "Market Super User",
                updateUser: currentUser,
              }),
            }),
          );
        });
      }

      const responses = await Promise.all(roleUpdatePromises);
      const results = await Promise.all(responses.map((r) => r.json()));
      const allSuccess = results.every((r) => r.code === 200);

      if (allSuccess) {
        setSuccessMessage("权限更新成功");
      } else {
        setErrorMessage("部分权限更新失败，请联系管理员");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setErrorMessage("系统内部错误，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Role按钮点击 - 删除用户权限
  const handleDeleteRole = async () => {
    if (!formData.userId.trim()) {
      setErrorMessage("请先查询用户信息");
      return;
    }

    // 确认对话框
    if (!window.confirm("确定要删除该用户的所有权限吗？")) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const API_BASE_URL = "http://localhost:8081";
      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(
        `${API_BASE_URL}/api/ud17HDocUserAdministration/deleteRole`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: formData.userId,
            updateUser: currentUser,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete role");
      }

      const data = await response.json();

      if (data.code === 200) {
        setSuccessMessage("权限删除成功");
        // 清空所有表单数据
        setFormData({
          userId: formData.userId,
          userName: "",
          standardUserChecked: false,
          standardUserMarkets: [],
          ruleAdminChecked: false,
          ruleAdminMarkets: [],
          templateAdminChecked: false,
          templateAdminMarkets: [],
          documentAuthAdminChecked: false,
          documentAuthAdminMarkets: [],
          userAdminChecked: false,
          adaptationUserChecked: false,
          adaptationUserMarkets: [],
          manageVariableListChecked: false,
          marketSuperUserMarkets: [],
        });
      } else {
        setErrorMessage("删除失败，请联系管理员");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      setErrorMessage("系统内部错误，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className='hvua-loading'>加载中...</div>;
  }

  return (
    <div className='hvua-container'>
      {/* 标题 */}
      <h2 className='hvua-title'>HDoc User Admin</h2>

      {/* 错误消息 */}
      {errorMessage && <div className='hvua-error-message'>{errorMessage}</div>}

      {/* 成功消息 */}
      {successMessage && (
        <div className='hvua-success-message'>{successMessage}</div>
      )}

      {/* 边框容器 */}
      <div className='hvua-border-box'>
        {/* 搜索区域 */}
        <div className='hvua-search-section'>
          <div className='hvua-form-row'>
            <label className='hvua-label-required'>Userid</label>
            <input
              type='text'
              className='hvua-input-short'
              value={formData.userId}
              onChange={handleUserIdChange}
              placeholder='v0c6900'
            />
            <button className='hvua-btn hvua-btn-info' onClick={handleUserInfo}>
              USER INFO
            </button>
          </div>

          <div className='hvua-form-row'>
            <label className='hvua-label-required'>User</label>
            <input
              type='text'
              className='hvua-input-medium'
              value={formData.userName}
              readOnly
            />
          </div>
        </div>

        {/* 角色权限配置区域 - 横向排列 */}
        <div className='hvua-roles-section'>
          {/* Standard User */}
          <div className='hvua-role-group'>
            <div className='hvua-form-row'>
              <input
                type='checkbox'
                id='standardUser'
                checked={formData.standardUserChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange(
                    "standardUserChecked",
                    e.target.checked,
                  )
                }
              />
              <label htmlFor='standardUser' className='hvua-checkbox-label'>
                Standard User
              </label>
            </div>
            <select
              multiple
              className='hvua-select-multiple'
              value={formData.standardUserMarkets}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                ).map((option) => option.value);
                handleMarketSelectChange(
                  "standardUserMarkets",
                  selectedOptions,
                );
              }}
              disabled={!formData.standardUserChecked}
            >
              {marketList.map((market) => (
                <option key={market.market} value={market.market}>
                  {market.market}
                </option>
              ))}
            </select>
          </div>

          {/* Rule Admin */}
          <div className='hvua-role-group'>
            <div className='hvua-form-row'>
              <input
                type='checkbox'
                id='ruleAdmin'
                checked={formData.ruleAdminChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange("ruleAdminChecked", e.target.checked)
                }
              />
              <label htmlFor='ruleAdmin' className='hvua-checkbox-label'>
                Rule Admin
              </label>
            </div>
            <select
              multiple
              className='hvua-select-multiple'
              value={formData.ruleAdminMarkets}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                ).map((option) => option.value);
                handleMarketSelectChange("ruleAdminMarkets", selectedOptions);
              }}
              disabled={!formData.ruleAdminChecked}
            >
              {marketList.map((market) => (
                <option key={market.market} value={market.market}>
                  {market.market}
                </option>
              ))}
            </select>
          </div>

          {/* Template Admin */}
          <div className='hvua-role-group'>
            <div className='hvua-form-row'>
              <input
                type='checkbox'
                id='templateAdmin'
                checked={formData.templateAdminChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange(
                    "templateAdminChecked",
                    e.target.checked,
                  )
                }
              />
              <label htmlFor='templateAdmin' className='hvua-checkbox-label'>
                Template Admin
              </label>
            </div>
            <select
              multiple
              className='hvua-select-multiple'
              value={formData.templateAdminMarkets}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                ).map((option) => option.value);
                handleMarketSelectChange(
                  "templateAdminMarkets",
                  selectedOptions,
                );
              }}
              disabled={!formData.templateAdminChecked}
            >
              {marketList.map((market) => (
                <option key={market.market} value={market.market}>
                  {market.market}
                </option>
              ))}
            </select>
          </div>

          {/* Document Auth Admin */}
          <div className='hvua-role-group'>
            <div className='hvua-form-row'>
              <input
                type='checkbox'
                id='documentAuthAdmin'
                checked={formData.documentAuthAdminChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange(
                    "documentAuthAdminChecked",
                    e.target.checked,
                  )
                }
              />
              <label
                htmlFor='documentAuthAdmin'
                className='hvua-checkbox-label'
              >
                Document Auth Admin
              </label>
            </div>
            <select
              multiple
              className='hvua-select-multiple'
              value={formData.documentAuthAdminMarkets}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                ).map((option) => option.value);
                handleMarketSelectChange(
                  "documentAuthAdminMarkets",
                  selectedOptions,
                );
              }}
              disabled={!formData.documentAuthAdminChecked}
            >
              {marketList.map((market) => (
                <option key={market.market} value={market.market}>
                  {market.market}
                </option>
              ))}
            </select>
          </div>

          {/* User Admin */}
          <div className='hvua-role-group'>
            <div className='hvua-form-row'>
              <input
                type='checkbox'
                id='userAdmin'
                checked={formData.userAdminChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange("userAdminChecked", e.target.checked)
                }
              />
              <label htmlFor='userAdmin' className='hvua-checkbox-label'>
                User Admin
              </label>
            </div>
          </div>

          {/* Adaptation user */}
          <div className='hvua-role-group'>
            <div className='hvua-form-row'>
              <input
                type='checkbox'
                id='adaptationUser'
                checked={formData.adaptationUserChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange(
                    "adaptationUserChecked",
                    e.target.checked,
                  )
                }
              />
              <label htmlFor='adaptationUser' className='hvua-checkbox-label'>
                Adaptation use
              </label>
            </div>
            <select
              multiple
              className='hvua-select-multiple'
              value={formData.adaptationUserMarkets}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                ).map((option) => option.value);
                handleMarketSelectChange(
                  "adaptationUserMarkets",
                  selectedOptions,
                );
              }}
              disabled={!formData.adaptationUserChecked}
            >
              {marketList.map((market) => (
                <option key={market.market} value={market.market}>
                  {market.market}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Manage Variable List */}
        <div className='hvua-function-section'>
          <div className='hvua-form-row'>
            <label className='hvua-label'>Manage Variable List</label>
            <input
              type='checkbox'
              checked={formData.manageVariableListChecked}
              onChange={(e) =>
                handleRoleCheckboxChange(
                  "manageVariableListChecked",
                  e.target.checked,
                )
              }
            />
          </div>
        </div>

        {/* Market super user */}
        <div className='hvua-super-user-section'>
          <div className='hvua-form-row'>
            <label className='hvua-label'>Market super user</label>
            <select
              multiple
              className='hvua-select-multiple'
              value={formData.marketSuperUserMarkets}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                ).map((option) => option.value);
                handleMarketSelectChange(
                  "marketSuperUserMarkets",
                  selectedOptions,
                );
              }}
            >
              {marketList.map((market) => (
                <option key={market.market} value={market.market}>
                  {market.market}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className='hvua-button-bar'>
          <button
            className='hvua-btn hvua-btn-primary'
            onClick={handleUpdateRole}
          >
            Update Role
          </button>
          <button
            className='hvua-btn hvua-btn-danger'
            onClick={handleDeleteRole}
          >
            Delete Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default HDocUserAdministration;
