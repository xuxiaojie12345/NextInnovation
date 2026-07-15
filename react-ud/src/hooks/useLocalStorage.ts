import { useState, useCallback } from 'react';

/**
 * localStorage 状态 hook
 *
 * 将 localStorage 的读写封装为 React state，
 * 自动处理 JSON.parse / JSON.stringify 和 try-catch，
 * 避免各组件中重复实现 localStorage 存取逻辑。
 *
 * @param key    localStorage 键名
 * @param initialValue 初始值（localStorage 中无数据时使用）
 * @returns [value, setValue, removeValue]
 *
 * @example
 * const [userInfo, setUserInfo, removeUserInfo] = useLocalStorage('userInfo', null);
 * const [searchCond] = useLocalStorage('searchCondition', {});
 */
const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // 存储失败时静默处理（如 localStorage 已满）
        }
        return nextValue;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // 忽略
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
