// HDocUserAdministration.tsx - UD17模块
import React, { useState, useEffect } from "react";
import "./HDocUserAdministration.css";

/** 市场数据类型 - API返回MARKET(大写) 映射为market(小写) */
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
  // USER INFO检索后置为true，此时才将选中market置顶；正常勾选时不排序
  const [searched, setSearched] = useState(false);

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
        `${API_BASE_URL}/api/ud17/markets`,
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
      console.log("【marketList】response:", JSON.stringify(data));
      if (data.code === 200 && data.data) {
        // API返回大写字段(MARKET, DESCRIPTION)，映射为小写(market, description)
        const mapped = data.data.map((item: any) => ({
          market: item.MARKET || item.market,
          description: item.DESCRIPTION || item.description,
        }));
        setMarketList(mapped);
        console.log("【marketList】count:", mapped.length);
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
    setSearched(false); // 输入变化时取消置顶模式
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
      const userid = formData.userId.trim();

      const response = await fetch(
        `${API_BASE_URL}/api/ud17/UD17HDocUserAdministrationApi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "userinfo",
            userid: userid
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        const permissionData: PermissionData = data.data;
        const userName = permissionData.username || "";

        // 解析并填充表单数据
        const updatedFormData = {
          ...formData,
          userName: userName,
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
            "RULE ADMIN": "R",
            TEMPLATE: "T",
            "TEMPLATE ADMIN": "T",
            USER: "U",
            "STANDARD USER": "U",
            DOCUMENT: "D",
            "DOCUMENT AUTH ADMIN": "D",
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

        console.log("【formData result】selected markets:", {
          standardUser: updatedFormData.standardUserMarkets,
          ruleAdmin: updatedFormData.ruleAdminMarkets,
          templateAdmin: updatedFormData.templateAdminMarkets,
          docAuthAdmin: updatedFormData.documentAuthAdminMarkets,
          adaptationUser: updatedFormData.adaptationUserMarkets,
          marketSuperUser: updatedFormData.marketSuperUserMarkets,
        });
        setFormData(updatedFormData);
        setSearched(true); // 检索完成，允许market置顶
      } else {
        setErrorMessage(
          "We didn't recognize the userid you entered. Please try again.",
        );
        setSearched(false);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setErrorMessage(
        "We didn't recognize the userid you entered. Please try again.",
      );
      setSearched(false);
    } finally {
      setIsLoading(false);
    }
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
    setSearched(false); // 手动勾选时取消置顶
  };

  // 处理Market多选下拉框变化
  const handleMarketSelectChange = (
    role: keyof FormData,
    selectedValues: string[],
  ) => {
    setFormData({ ...formData, [role]: selectedValues });
    setSearched(false); // 手动选择时取消置顶
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
      const API_BASE_URL = "http://localhost:8081";
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const currentUser = userInfo.userid || userInfo.username || "admin";

      // 收集选中的功能权限
      const functions: string[] = [];
      if (formData.standardUserChecked) functions.push("USER");
      if (formData.ruleAdminChecked) functions.push("RULES");
      if (formData.templateAdminChecked) functions.push("TEMPLATE");
      if (formData.documentAuthAdminChecked) functions.push("Document");
      if (formData.userAdminChecked) functions.push("User Administrator");
      if (formData.adaptationUserChecked) functions.push("ADAPTATION DOC");
      if (formData.manageVariableListChecked) functions.push("Manage Variable List");

      // 收集市场权限
      const roleMap: Array<{ key: string; typeCode: string; markets: string[] }> = [
        { key: "standardUser", typeCode: "U", markets: formData.standardUserMarkets },
        { key: "ruleAdmin", typeCode: "R", markets: formData.ruleAdminMarkets },
        { key: "templateAdmin", typeCode: "T", markets: formData.templateAdminMarkets },
        { key: "documentAuthAdmin", typeCode: "D", markets: formData.documentAuthAdminMarkets },
        { key: "adaptationUser", typeCode: "DOCMOD", markets: formData.adaptationUserMarkets },
        { key: "marketSuperUser", typeCode: "MCSU", markets: formData.marketSuperUserMarkets },
      ];

      const markets: Array<{ market: string; type: string; bu: string }> = [];
      roleMap.forEach((role) => {
        role.markets.forEach((mkt) => {
          if (mkt) markets.push({ market: mkt, type: role.typeCode, bu: "" });
        });
      });

      // 调用后端API（单次调用，后端自动先删后增）
      const response = await fetch(
        `${API_BASE_URL}/api/ud17/UD17HDocUserAdministrationApi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "updateRole",
            userid: formData.userId.trim(),
            functions: functions,
            markets: markets,
            updateUser: currentUser,
            updateProcess: "UD17"
          }),
        },
      );
      const result = await response.json();

      if (result.code === 200 && result.data?.success) {
        setSuccessMessage("权限更新成功");
      } else {
        setErrorMessage(result.data?.message || "更新失败，请联系管理员");
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

      const response = await fetch(
        `${API_BASE_URL}/api/ud17/UD17HDocUserAdministrationApi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "deleteRole",
            userid: formData.userId.trim()
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

  // 市场列表排序：检索后才将选中的排前面，正常勾选时保持原序
  const getSortedMarketList = (selectedMarkets: string[]) => {
    if (!searched) return marketList;
    return [...marketList].sort((a, b) => {
      const aSelected = selectedMarkets.includes(a.market);
      const bSelected = selectedMarkets.includes(b.market);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  };

  if (isLoading) {
    return <div className='hvua-loading' style={{padding:20,color:'#666',fontSize:13}}>Loading...</div>;
  }

  return (
    <div className='hvua-container'>
      <div className='hvua-card'>
        <h1 className='hvua-title'>HDoc User Admin</h1>

      {/* 错误消息 */}
      {errorMessage && <div className='hvua-msg hvua-error'>{errorMessage}</div>}

      {/* 成功消息 */}
      {successMessage && (
        <div className='hvua-msg hvua-success'>{successMessage}</div>
      )}

        {/* 搜索区域 */}
        <div className='hvua-section'>
          <div className='hvua-row'>
            <label className='hvua-label'>Userid</label>
            <input
              type='text'
              className='hvua-input'
              value={formData.userId}
              onChange={handleUserIdChange}
            />
            <button className='hvua-btn' onClick={handleUserInfo}>
              USER INFO
            </button>
          </div>

          <div className='hvua-row'>
            <label className='hvua-label'>User</label>
            <input
              type='text'
              className='hvua-input hvua-input-readonly'
              value={formData.userName}
              readOnly
            />
          </div>
        </div>

        {/* 角色权限配置区域 - 横向排列 */}
        <div className='hvua-section'>
          <div className='hvua-role-grid'>
          {/* Standard User */}
          <div className='hvua-role-item'>
            <label className='hvua-chk-lbl'>
              <input
                type='checkbox'
                checked={formData.standardUserChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange(
                    "standardUserChecked",
                    e.target.checked,
                  )
                }
              />
              Standard User
            </label>
            <select
              multiple
              className='hvua-select-multi'
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
            >
              <option value='-EU'>-EU</option>
            </select>
          </div>

          {/* Rule Admin */}
          <div className='hvua-role-item'>
            <label className='hvua-chk-lbl'>
              <input
                type='checkbox'
                checked={formData.ruleAdminChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange("ruleAdminChecked", e.target.checked)
                }
              />
              Rule Admin
            </label>
            <select
              multiple
              className='hvua-select-multi'
              value={formData.ruleAdminMarkets}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                ).map((option) => option.value);
                handleMarketSelectChange("ruleAdminMarkets", selectedOptions);
              }}
            >
              {getSortedMarketList(formData.ruleAdminMarkets).map((market) => (
                <option key={market.market} value={market.market}>
                  {market.market}
                </option>
              ))}
            </select>
          </div>

          {/* Template Admin */}
          <div className='hvua-role-item'>
            <label className='hvua-chk-lbl'>
              <input
                type='checkbox'
                checked={formData.templateAdminChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange(
                    "templateAdminChecked",
                    e.target.checked,
                  )
                }
              />
              Template Admin
            </label>
            <select
              multiple
              className='hvua-select-multi'
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
          <div className='hvua-role-item'>
            <label className='hvua-chk-lbl'>
              <input
                type='checkbox'
                checked={formData.documentAuthAdminChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange(
                    "documentAuthAdminChecked",
                    e.target.checked,
                  )
                }
              />
              Document Auth Admin
            </label>
            <select
              multiple
              className='hvua-select-multi'
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
          <div className='hvua-role-item'>
            <label className='hvua-chk-lbl'>
              <input
                type='checkbox'
                id='userAdmin'
                checked={formData.userAdminChecked}
                onChange={(e) =>
                  handleRoleCheckboxChange("userAdminChecked", e.target.checked)
                }
              />
              User Admin
            </label>
          </div>

        </div>
      </div>

        {/* Adaptation user - 单独一排 */}
        <div className='hvua-section'>
          <div className='hvua-row'>
            <label className='hvua-chk-lbl'>
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
              Adaptation use
            </label>
            <select
              multiple
              className='hvua-select-multi'
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
            >
              <option value='-EU'>-EU</option>
            </select>
          </div>
        </div>

        {/* Manage Variable List */}
        <div className='hvua-section'>
          <div className='hvua-row'>
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
        <div className='hvua-super-section'>
          <p className='hvua-super-title'>Market super user</p>
          <select
            multiple
            className='hvua-select-multi'
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

        {/* 操作按钮区域 */}
        <div className='hvua-btn-bar'>
          <button
            className='hvua-btn'
            onClick={handleUpdateRole}
            disabled={isLoading}
          >
            Update Role
          </button>
          <button
            className='hvua-btn'
            onClick={handleDeleteRole}
            disabled={isLoading}
          >
            Delete Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default HDocUserAdministration;
