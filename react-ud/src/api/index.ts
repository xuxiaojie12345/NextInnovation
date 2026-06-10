import apiClient from "./config";
import type { AxiosResponse } from "axios";

// 登录请求参数类型（后端 LoginRequest 字段：userId, password）
export interface LoginRequest {
  userId: string;
  password: string;
}

// 用户信息类型
export interface UserInfo {
  userId: string;
  userName: string;
  email: string;
}

// 登录响应数据类型
export interface LoginData {
  token: string;
  userInfo: UserInfo;
}

// API响应通用类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * 后端通用响应格式
 * 对应 Java 端 { code, msg, data }
 * 用于 LoginResponse / UploadDeleteTemplateResponse
 */
export interface BackendResponse {
  code: number;
  msg: string;
  data: any;
}

/**
 * 后端登录响应中的 Data 嵌套结构
 */
export interface LoginResponseData {
  token: string;
  userId: string;
  username: string;
}

/**
 * 认证相关API
 * 后端路径映射：AuthController @RequestMapping("/api")
 */
export const authApi = {
  /**
   * 用户登录
   * 后端 POST /api/login，接收 { userId, password }
   * 返回 { code, msg, data: { token, userId, username } }
   */
  login: async (data: LoginRequest): Promise<ApiResponse<LoginData>> => {
    const response: AxiosResponse<BackendResponse> = await apiClient.post(
      "/api/login",
      {
        userId: data.userId,
        password: data.password,
      },
    );

    const body = response.data;

    if (body.code === 200 && body.data) {
      const loginData = body.data as LoginResponseData;
      return {
        success: true,
        message: body.msg,
        data: {
          token: loginData.token,
          userInfo: {
            userId: loginData.userId,
            userName: loginData.username,
            email: "",
          },
        },
      };
    }

    return {
      success: false,
      message: body.msg || "登录失败",
      data: null,
    };
  },
};

/**
 * 将 File 转换为 Base64 字符串
 * 后端 UploadDeleteTemplateController 接收 Base64 编码的文件内容
 * @param file - 要转换的文件
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // 去掉 Data URL 前缀（如 "data:application/pdf;base64,"）
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
};

/**
 * 模板管理相关API
 * 后端路径映射：UploadDeleteTemplateController @RequestMapping("/api/ud12")
 */
export const templateApi = {
  /**
   * 获取Market列表
   * 根据详细设计文档5.1.1节，调用UD12SelectMarket方法
   * 后端路径：GET /api/ud12/markets
   * 后端返回格式：{ code: 200, msg: "获取成功", data: { markets: string[], count: number } }
   */
  getMarkets: async (): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<BackendResponse> =
      await apiClient.get("/api/ud12/markets");
    // 将后端响应格式转为前端统一格式
    return {
      success: response.data.code === 200,
      message: response.data.msg,
      data: response.data.data, // 返回完整的 data 对象 { markets: [], count: number }
    };
  },

  /**
   * 根据Market获取模板列表
   * 根据详细设计文档4.2节，调用getTemplates方法
   * 后端路径：GET /api/ud12/templates/{market}
   * 后端返回格式：{ code: 200, msg: "获取成功", data: ["template1.docx", "template2.pdf"] }
   * @param market - 市场标识（如 JPN, USA 等）
   */
  getTemplates: async (market: string): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<BackendResponse> = await apiClient.get(
      `/api/ud12/templates/${encodeURIComponent(market)}`
    );

    return {
      success: response.data.code === 200,
      message: response.data.msg,
      data: response.data.data,
    };
  },

  /**
   * 上传模板文件
   * 根据详细设计文档5.1.2节实现
   * 后端接收 JSON：{ templateFile: Base64字符串, market: string, fileName: string }
   * @param file - 要上传的文件
   * @param market - 市场标识（如 JPN, USA 等）
   */
  uploadTemplate: async (
    file: File,
    market: string,
  ): Promise<ApiResponse<any>> => {
    // 先将文件转为 Base64 字符串
    const base64Content = await fileToBase64(file);

    const response: AxiosResponse<BackendResponse> = await apiClient.post(
      "/api/ud12/upload",
      {
        templateFile: base64Content,
        market: market,
        fileName: file.name,
      },
    );

    return {
      success: response.data.code === 200,
      message: response.data.msg,
      data: response.data.data,
    };
  },

  /**
   * 删除模板文件
   * 根据详细设计文档5.1.2节实现
   * 后端接收 JSON：{ market: string, templateName: string }
   * @param market - 市场标识
   * @param templateName - 模板文件名
   */
  deleteTemplate: async (
    market: string,
    templateName: string,
  ): Promise<ApiResponse<any>> => {
    const response: AxiosResponse<BackendResponse> = await apiClient.post(
      "/api/ud12/delete",
      {
        market: market,
        templateName: templateName,
      },
    );

    return {
      success: response.data.code === 200,
      message: response.data.msg,
      data: response.data.data,
    };
  },
};
