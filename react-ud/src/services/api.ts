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
  // 获取文档类型列表（POST方式）
  getDocumentTypes: () =>
    apiRequest("/api/UD03SelectHdocdocumentlistApi/types", "POST"),

  // 获取文档类型列表（GET方式 - 根据内部设计UD03规格）
  getDocumentTypesGet: () =>
    apiRequest("/api/UD03SelectHdocdocumentlistApi/types", "GET"),

  // UD04 - 获取车辆铭牌生成结果
  getSelectGeneratedocument: (params: {
    chassisSeries: string;
    chassisNo: string;
    documentType: string;
  }) =>
    apiRequest(
      "/api/UD04SelectGeneratedocumentApi/SelectGeneratedocument",
      "POST",
      params,
    ),

  // UD05 - 查询变量修改信息
  getSelectVariableModification: (params: { serie: string; chno: string }) =>
    apiRequest(
      "/api/UD05ModifyDocumentApi/UD05SelectVariableModification",
      "POST",
      params,
    ),

  // UD06 - 获取修改状态信息
  getSelectHdocAdcaModification: (params: {
    chassisSerie: string;
    chassisNumber: string;
  }) =>
    apiRequest(
      "/api/UD06SaveModificationsApi/UD06SelectHdocAdcaModification",
      "POST",
      params,
    ),

  // UD05 - 提交文档修改
  // UD07 - 获取VDA车辆规格信息
  getVehicleSpecification: (chassisNo: string) =>
    apiRequest(
      "/api/UD07VehicleSpecificationApi/Select/" +
        encodeURIComponent(chassisNo),
      "GET",
    ),

  updateHdocAdcaModification: (params: {
    chassisNo: string;
    market: string;
    templateFile: string;
    modifications: Array<{
      variable: string;
      currentValue: string;
      modifiedValue: string;
    }>;
  }) =>
    apiRequest(
      "/api/UD05ModifyDocumentApi/UD05UpdateHdocAdcaModification",
      "POST",
      params,
    ),
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
  // 查询 ADCA 变更 (CHECK)
  selectAdcaChange: (serieChnr: string) =>
    apiRequest("/api/UD16ADChangeApi/UD16SelectHdocAdcaChange", "POST", {
      serieChnr,
    }),

  // 新增 ADCA 变更 (ADD)
  insertAdcaChange: (serieChnr: string, desc: string, user: string) =>
    apiRequest("/api/UD16ADChangeApi/UD16InsertHdocAdcaChange", "POST", {
      serieChnr,
      desc,
      user,
    }),

  // 删除 ADCA 变更 (DELETE)
  deleteAdcaChange: (serieChnr: string, user: string) =>
    apiRequest("/api/UD16ADChangeApi/UD16UpdateHdocAdcaChange", "POST", {
      serieChnr,
      user,
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

/**
 * UD08 - 认证参数管理 (Homologation Variables) API
 */
export const homologationVariablesApi = {
  // 获取 Product Class 下拉列表
  getProductClassMaster: () =>
    apiRequest(
      "/api/UD08HomologationVariablesApi/UD08SelectProductclassmaster",
      "GET",
    ),

  // 获取 Market 下拉列表
  getMarketMaster: () =>
    apiRequest(
      "/api/UD08HomologationVariablesApi/UD08SelectMarketmaster",
      "GET",
    ),

  // 获取 HDoc Variables 下拉列表
  getHdocVariables: () =>
    apiRequest(
      "/api/UD08HomologationVariablesApi/UD08SelectHdocvariables",
      "GET",
    ),

  // 新增记录
  add: (params: any) =>
    apiRequest("/api/UD08HomologationVariablesApi/UD08Add", "POST", params),

  // 更新记录
  update: (params: any) =>
    apiRequest("/api/UD08HomologationVariablesApi/UD08Update", "POST", params),

  // 删除记录
  delete: (params: any) =>
    apiRequest("/api/UD08HomologationVariablesApi/UD08Delete", "POST", params),

  // UD09 - 搜索认证参数列表
  searchList: (params: any) =>
    apiRequest(
      "/api/UD09DeleteHdocuserdefinedrulesApi/UD09Seach",
      "POST",
      params,
    ),

  // UD09 - 批量删除选中的记录
  deleteSelected: (params: any) =>
    apiRequest(
      "/api/UD09DeleteHdocuserdefinedrulesApi/UD09DeleteSelected",
      "POST",
      params,
    ),
};

/**
 * UD12 - 模板上传/删除 API
 */
export const templateApi = {
  // 获取市场列表
  selectMarket: () =>
    apiRequest("/api/UD12UploadDeletetemplatApi/UD12SelectMarket", "POST"),

  // 上传文件（使用 FormData）
  uploadFile: (file: File, market: string) => {
    const url = `${API_BASE_URL}/api/UD12UploadDeletetemplatApi/UD12UploadFlie`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("market", market);
    return fetch(url, { method: "POST", body: formData }).then((res) =>
      res.json(),
    );
  },

  // 删除文件
  deleteFile: (market: string, templateName: string) =>
    apiRequest("/api/UD12UploadDeletetemplatApi/UD12DeleteFlie", "POST", {
      market,
      templateName,
    }),

  // 根据市场列出模板文件列表
  listTemplates: (market: string) =>
    apiRequest("/api/UD12UploadDeletetemplatApi/UD12ListTemplates", "POST", {
      market,
    }),
};

/**
 * UD14 - 模板文件列表 API
 */
export const templateListApi = {
  // 获取市场列表
  selectMarket: () =>
    apiRequest("/api/UD14SearchresultistApi/UD14SelectMarketmaster", "POST"),

  // 获取指定市场的模板文件列表
  selectTemplateFiles: (market: string) =>
    apiRequest(
      "/api/UD14SearchresultistApi/UD14SelectMarketmasterFileList",
      "POST",
      { market },
    ),

  // 获取指定市场的规则变量列表
  selectHdocuserdefinedrules: (market: string) =>
    apiRequest(
      "/api/UD14SearchresultistApi/UD14SelectHdocuserdefinedrules",
      "POST",
      { market },
    ),

  // 下载模板文件
  downloadFile: (market: string, filename: string) =>
    `${API_BASE_URL}/api/UD14SearchresultistApi/UD14DownloadFile?market=${encodeURIComponent(market)}&filename=${encodeURIComponent(filename)}`,
};

/**
 * UD25 - EDB 用户信息 API
 */
export const edbUserApi = {
  // 获取用户信息（调用 AuthenticationApi/login，仅传userId不传密码）
  getUserInfo: (userid: string) =>
    apiRequest("/api/AuthenticationApi/login", "POST", { userId: userid }),
};
