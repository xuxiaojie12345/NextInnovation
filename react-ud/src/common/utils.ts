/* ═══════════════════════════════════════════
   common/utils.ts — 通用工具函数
   各页面重复逻辑集中于此
   ═══════════════════════════════════════════ */

/**
 * 打印功能：打印前设置document.title，打印后还原。
 * @param title 打印时的标题
 */
export const sharedPrint = (title: string): void => {
  const prevTitle = document.title;
  document.title = title;
  window.print();
  document.title = prevTitle;
};

/**
 * 获取当前登录用户的ID。
 * 未登录时返回空字符串。
 */
export const getCurrentUserId = (): string => {
  return localStorage.getItem("userId") || "";
};
