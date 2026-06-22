/**
 * 用户信息接口定义
 */
export interface UserInfo {
  userId: string;
  userName: string;
  responsible?: string;
  userPosition?: string;
  email?: string;
}

/**
 * 从 sessionStorage 获取用户信息
 * @returns UserInfo 对象或 null
 */
export const getUserInfoFromSession = (): UserInfo | null => {
  const userId = sessionStorage.getItem("userId");
  const userName = sessionStorage.getItem("userName");

  // 如果必要字段不存在，返回 null
  if (!userId || !userName) {
    return null;
  }

  return {
    userId,
    userName,
    responsible: sessionStorage.getItem("responsible") || undefined,
    userPosition: sessionStorage.getItem("userPosition") || undefined,
    email: sessionStorage.getItem("email") || undefined,
  };
};

/**
 * 从 sessionStorage 获取用户ID
 * @returns 用户ID或空字符串
 */
export const getUserIdFromSession = (): string => {
  return sessionStorage.getItem("userId") || "";
};

/**
 * 从 sessionStorage 获取用户名
 * @returns 用户名或空字符串
 */
export const getUserNameFromSession = (): string => {
  return sessionStorage.getItem("userName") || "";
};

/**
 * 检查用户是否已登录
 * @returns boolean
 */
export const isLoggedIn = (): boolean => {
  const userId = sessionStorage.getItem("userId");
  const userName = sessionStorage.getItem("userName");
  return !!userId && !!userName;
};

/**
 * 清除 session 中的用户信息（用于登出）
 */
export const clearUserInfoFromSession = (): void => {
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("responsible");
  sessionStorage.removeItem("userPosition");
  sessionStorage.removeItem("email");
};
