/**
 * API 基础配置
 */

// 后端 API 基础 URL
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

/**
 * 通用请求函数
 */
export const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
  data?: any,
  headers?: Record<string, string>,
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (data && (method === "POST" || method === "PUT")) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};

/**
 * 认证相关 API
 */
export const authApi = {
  // 用户登录
  login: (userId: string, password: string) =>
    apiRequest("/api/AuthenticationApi/login", "POST", { userId, password }),
};

/**
 * 文档相关 API
 */
export const documentApi = {
  // 获取文档类型列表
  getDocumentTypes: () =>
    apiRequest("/api/UD03SelectHdocdocumentlistApi/types", "POST"),
};

/**
 * 用户管理 API
 */
export const userApi = {
  // 查询用户信息
  getUserInfo: (userid: string) =>
    apiRequest("/api/UD17HDocUserAdministrationApi/UD17Userinfo", "POST", {
      userid,
    }),

  // 更新用户角色
  updateUserRole: (userid: string, permissions: string) =>
    apiRequest("/api/UD17HDocUserAdministrationApi/UD17UpdateRole", "POST", {
      userid,
      permissions,
    }),

  // 删除用户角色
  deleteUserRole: (userid: string) =>
    apiRequest("/api/UD17HDocUserAdministrationApi/UD17DeleteRole", "POST", {
      userid,
    }),
};

/**
 * HDoc 变量 API
 */
export const hdocVariablesApi = {
  // 搜索变量
  searchVariables: (params: any) =>
    apiRequest("/api/UD11HdocvariablesApi/UD11Search", "POST", params),

  // 新增变量
  addVariable: (params: any) =>
    apiRequest("/api/UD10HdocvariablesApi/UD10Add", "POST", params),

  // 更新变量
  updateVariable: (params: any) =>
    apiRequest("/api/UD10HdocvariablesApi/UD10Update", "POST", params),

  // 删除变量
  deleteVariable: (variable: string) =>
    apiRequest("/api/UD10HdocvariablesApi/UD10Delete", "POST", { variable }),
};

/**
 * ADCA 变更 API
 */
export const adcaApi = {
  // 查询 ADCA 变更
  selectAdcaChange: (serie_chnr: string, desc: string) =>
    apiRequest("/api/UD16ADChangeApi/UD16SelectHdocAdcaChange", "POST", {
      serie_chnr,
      desc,
    }),

  // 新增 ADCA 变更
  insertAdcaChange: (params: any) =>
    apiRequest("/api/UD16ADChangeApi/UD16InsertHdocAdcaChange", "POST", params),

  // 删除 ADCA 变更
  updateAdcaChange: (serie_chnr: string, desc: string) =>
    apiRequest("/api/UD16ADChangeApi/UD16UpdateHdocAdcaChange", "POST", {
      serie_chnr,
      desc,
    }),
};

/**
 * VIN Plate API
 */
export const vinPlateApi = {
  // 查看 VIN Plate 信息
  viewInfo: (chassisNumber: string) =>
    apiRequest(
      `/api/UD15SelecthdocsenddatavinplateApi/UD15ViewInfo?chassisNumber=${chassisNumber}`,
      "GET",
    ),

  // 设置为重新生成
  setRegenerate: (chassisNumber: string) =>
    apiRequest(
      "/api/UD15SelecthdocsenddatavinplateApi/UD15SetRegenerate",
      "POST",
      { chassisNumber },
    ),

  // 设置为完成
  setOk: (chassisNumber: string) =>
    apiRequest("/api/UD15SelecthdocsenddatavinplateApi/UD15SetOK", "POST", {
      chassisNumber,
    }),

  // 更改为基本信息
  changeToBasicInfo: (chassisNumber: string) =>
    apiRequest(
      "/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoBasicInfo",
      "POST",
      { chassisNumber },
    ),

  // 更改为高级信息
  changeToAdvancedInfo: (chassisNumber: string) =>
    apiRequest(
      "/api/UD15SelecthdocsenddatavinplateApi/UD15ChangetoAdvancedInfo",
      "POST",
      { chassisNumber },
    ),
};

/**
 * 市场文档设置 API
 */
export const marketDocumentApi = {
  // 获取文档列表
  getDocumentList: (documentType?: string) => {
    const url = documentType
      ? `/api/UD20MarketDocumentSettingsApi/document-list?documentType=${documentType}`
      : "/api/UD20MarketDocumentSettingsApi/document-list";
    return apiRequest(url, "GET");
  },

  // 更新文档设置
  updateDocument: (params: any) =>
    apiRequest("/api/UD20MarketDocumentSettingsApi/update", "POST", params),
};
