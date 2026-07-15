import React, { useState, useEffect } from "react";
import "./HDocUserAdministration.css";

interface MarketItem {
  market: string;
  description: string;
}

interface PermissionData {
  functions: Array<any>;
  markets: Array<any>;
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

const HDocUserAdministration: React.FC = () => {
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

  // 页面初始化：加载市场列表数据
  useEffect(() => {
    fetchMarketList();
  }, []);

  // 获取市场列表
  const fetchMarketList = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/getMarketList`,
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
    } finally {
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
      setErrorMessage("");
      setSuccessMessage("");

      // 调用API获取用户信息
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/getUserInfo`,
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

        // 获取用户权限配置（传入userName防止被覆盖）
        await fetchUserPermissions(currentUserId, userName);
      } else {
        setErrorMessage(
          "We didn't recognize the userid you entered. Please try again.",
        );
      }
    } finally {
    }
  };

  // 获取用户权限配置
  const fetchUserPermissions = async (userId: string, userName?: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/getUserPermissions`,
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

        // 辅助函数：将FUNCTION/TYPE的值统一转换为代码
        // FUNCTION存的是描述名称(User Administrator、RULES等)
        // TYPE存的是代码(A、R、T等)或"代码:描述"格式(U:USER、A：User Administrator等)
        const toCode = (val: string) => {
          const trimmed = val.trim();
          // 尝试提取冒号前的代码前缀
          const parts = trimmed.split(/[：:]/);
          const first = parts[0].trim().toUpperCase();
          // 常见FUNCTION描述名称 → 代码映射
          const descToCode: Record<string, string> = {
            "USER ADMINISTRATOR": "A",
            RULES: "R",
            TEMPLATE: "T",
            USER: "U",
            DOCUMENT: "D",
            "ADAPTATION DOC": "DOCMOD",
            "MARKET SUPER USER": "MCSU",
          };
          return descToCode[first] || first;
        };

        // 解析functions数组
        // FUNCTION列的值: User Administrator, RULES, TEMPLATE, USER, Document, ADAPTATION DOC, market super user
        if (permissionData.functions) {
          permissionData.functions.forEach((func: any) => {
            const functionCode = toCode(func.FUNCTION || func.function || "");
            switch (functionCode) {
              case "U":
                updatedFormData.standardUserChecked = true;
                break;
              case "R":
                updatedFormData.ruleAdminChecked = true;
                break;
              case "T":
                updatedFormData.templateAdminChecked = true;
                break;
              case "D":
                updatedFormData.documentAuthAdminChecked = true;
                break;
              case "A":
                updatedFormData.userAdminChecked = true;
                break;
              case "DOCMOD":
                updatedFormData.adaptationUserChecked = true;
                break;
              case "MCSU":
                // MCSU是Market Super User，market用別枠管理
                break;
            }
          });
        }

        // 解析markets数组
        // TYPE列的值: A, R, T, D, DOCMOD, MCSU（纯代码）
        if (permissionData.markets) {
          permissionData.markets.forEach((market: any) => {
            const marketCode = market.MARKET || market.market;
            const marketType = toCode(market.TYPE || market.type || "");
            switch (marketType) {
              case "U":
                if (!updatedFormData.standardUserMarkets.includes("-EU")) {
                  updatedFormData.standardUserMarkets = ["-EU"];
                }
                break;
              case "R":
                if (!updatedFormData.ruleAdminMarkets.includes(marketCode)) {
                  updatedFormData.ruleAdminMarkets.push(marketCode);
                }
                break;
              case "T":
                if (
                  !updatedFormData.templateAdminMarkets.includes(marketCode)
                ) {
                  updatedFormData.templateAdminMarkets.push(marketCode);
                }
                break;
              case "D":
                if (
                  !updatedFormData.documentAuthAdminMarkets.includes(marketCode)
                ) {
                  updatedFormData.documentAuthAdminMarkets.push(marketCode);
                }
                break;
              case "DOCMOD":
                if (!updatedFormData.adaptationUserMarkets.includes("-EU")) {
                  updatedFormData.adaptationUserMarkets = ["-EU"];
                }
                break;
              case "MCSU":
                if (
                  !updatedFormData.marketSuperUserMarkets.includes(marketCode)
                ) {
                  updatedFormData.marketSuperUserMarkets.push(marketCode);
                }
                break;
            }
          });
        }

        setFormData(updatedFormData);
      }
    } catch (err) {}
  };

  // 处理角色复选框变化
  const handleRoleCheckboxChange = (role: keyof FormData, checked: boolean) => {
    // Standard User / Adaptation use 勾选时自动设置 "-EU"
    const isStandardOrAdapt =
      role === "standardUserChecked" || role === "adaptationUserChecked";
    const marketsKey =
      role === "standardUserChecked"
        ? "standardUserMarkets"
        : "adaptationUserMarkets";

    setFormData({
      ...formData,
      [role]: checked,
      ...(isStandardOrAdapt && checked
        ? { [marketsKey]: ["-EU"] }
        : isStandardOrAdapt && !checked
          ? { [marketsKey]: [] }
          : {}),
    });
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
      setErrorMessage("");
      setSuccessMessage("");

      // 构建请求数据
      const currentUser = localStorage.getItem("currentUser") || "";

      // 角色→TYPE代码(MARKET_AUTH) / FUNCTION描述(FUNCTION_AUTH) 映射
      const roleMap: Array<{
        key: string;
        typeCode: string;
        funcDesc: string;
        markets: string[];
        hasMarkets: boolean;
      }> = [
        {
          key: "standardUser",
          typeCode: "U",
          funcDesc: "USER",
          markets: formData.standardUserMarkets,
          hasMarkets: true,
        },
        {
          key: "ruleAdmin",
          typeCode: "R",
          funcDesc: "RULES",
          markets: formData.ruleAdminMarkets,
          hasMarkets: true,
        },
        {
          key: "templateAdmin",
          typeCode: "T",
          funcDesc: "TEMPLATE",
          markets: formData.templateAdminMarkets,
          hasMarkets: true,
        },
        {
          key: "documentAuthAdmin",
          typeCode: "D",
          funcDesc: "Document",
          markets: formData.documentAuthAdminMarkets,
          hasMarkets: true,
        },
        {
          key: "adaptationUser",
          typeCode: "DOCMOD",
          funcDesc: "ADAPTATION DOC",
          markets: formData.adaptationUserMarkets,
          hasMarkets: true,
        },
        {
          key: "marketSuperUser",
          typeCode: "MCSU",
          funcDesc: "market super user",
          markets: formData.marketSuperUserMarkets,
          hasMarkets: true,
        },
      ];

      // Step1: 先删除该用户的所有权限
      const deleteResponse = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/deleteRole`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: formData.userId,
            updateUser: currentUser,
          }),
        },
      );
      const deleteResult = await deleteResponse.json();
      if (deleteResult.code !== 200) {
        throw new Error("Delete existing roles failed");
      }

      // Step2: 再添加当前勾选的权限
      const roleUpdatePromises: Promise<Response>[] = [];

      // 有market的角色（勾选+选了market才发）
      roleMap.forEach((role) => {
        const checked =
          role.key === "marketSuperUser"
            ? formData.marketSuperUserMarkets.length > 0
            : (formData as any)[`${role.key}Checked`] === true;

        if (checked && role.hasMarkets && role.markets.length > 0) {
          role.markets.forEach((market) => {
            roleUpdatePromises.push(
              fetch(
                `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: formData.userId,
                    market,
                    type: role.typeCode,
                    bu: "",
                    function: role.funcDesc,
                    updateUser: currentUser,
                  }),
                },
              ),
            );
          });
        } else if (checked && !role.hasMarkets) {
          // 有market但没选market → 只注册FUNCTION
          roleUpdatePromises.push(
            fetch(
              `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: formData.userId,
                  market: "",
                  type: "",
                  bu: "",
                  function: role.funcDesc,
                  updateUser: currentUser,
                }),
              },
            ),
          );
        }
      });

      // User Admin（无market）
      if (formData.userAdminChecked) {
        roleUpdatePromises.push(
          fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: formData.userId,
                market: "",
                type: "",
                bu: "",
                function: "User Administrator",
                updateUser: currentUser,
              }),
            },
          ),
        );
      }

      // Manage Variable List（无market）
      if (formData.manageVariableListChecked) {
        roleUpdatePromises.push(
          fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/updateRole`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: formData.userId,
                market: "",
                type: "",
                bu: "",
                function: "Manage Variable List",
                updateUser: currentUser,
              }),
            },
          ),
        );
      }

      if (roleUpdatePromises.length === 0) {
        setErrorMessage("请至少选择一个角色权限");
        return;
      }

      const responses = await Promise.all(roleUpdatePromises);
      const results = await Promise.all(responses.map((r) => r.json()));
      const allSuccess = results.every((r) => r.code === 200);

      if (allSuccess) {
        setSuccessMessage("权限更新成功");
      } else {
        setErrorMessage("部分权限更新失败，请联系管理员");
      }
    } finally {
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
      setErrorMessage("");
      setSuccessMessage("");
      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud17HDocUserAdministration/deleteRole`,
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
    } finally {
    }
  };

  // 市场列表排序：选中的排前面
  const getSortedMarketList = (selectedMarkets: string[]) => {
    return [...marketList].sort((a, b) => {
      const aSelected = selectedMarkets.includes(a.market);
      const bSelected = selectedMarkets.includes(b.market);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  };

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
              className='hvua-select-single'
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
              <option value='-EU'>-EU</option>
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
              {getSortedMarketList(formData.ruleAdminMarkets).map((market) => (
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
              {getSortedMarketList(formData.templateAdminMarkets).map(
                (market) => (
                  <option key={market.market} value={market.market}>
                    {market.market}
                  </option>
                ),
              )}
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
              {getSortedMarketList(formData.documentAuthAdminMarkets).map(
                (market) => (
                  <option key={market.market} value={market.market}>
                    {market.market}
                  </option>
                ),
              )}
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
              className='hvua-select-single'
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
              <option value='-EU'>-EU</option>
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
              {getSortedMarketList(formData.marketSuperUserMarkets).map(
                (market) => (
                  <option key={market.market} value={market.market}>
                    {market.market}
                  </option>
                ),
              )}
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
