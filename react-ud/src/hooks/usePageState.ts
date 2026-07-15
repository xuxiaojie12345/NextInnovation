import { useState, useCallback } from 'react';

/**
 * 页面通用状态 hook
 *
 * 统一管理 loading / message / messageType 三个页面级状态，
 * 消除各组件中重复的 useState 声明。
 *
 * @param initialMessage 初始消息文本，默认 ""
 * @returns { loading, setLoading, message, setMessage, messageType, setMessageType, clearMessage }
 */
const usePageState = (initialMessage: string = '') => {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(initialMessage);
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  const clearMessage = useCallback(() => setMessage(''), []);

  return { loading, setLoading, message, setMessage, messageType, setMessageType, clearMessage };
};

export default usePageState;
