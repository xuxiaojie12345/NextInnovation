/**
 * Login 组件 - 用户登录页面
 * ------------------------------------------------------------------
 * 对应【Login_詳細設計.md】：
 *  - 画面布局 2.2：全屏背景图 + 左右分栏（左侧信息区 / 右侧登录表单区）
 *  - 控件 2.1：UserID(10)、Password(32)、Message(错误消息)、Login(按钮)
 *  - 业务 4.1：点击 Login → trim → 空值校验 → 调用 API → 结果处理
 *  - 接口 5.1：AuthenticationApi POST /api/auth/login
 *
 * @component
 * @returns {React.JSX.Element} 登录页面
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticationApi, mockAuthenticationApi } from './api/authApi';
import {
  ERROR_MESSAGES,
  normalize,
  validateLoginForm,
} from './utils/validators';
import type { LoginFormValidationResult } from './utils/validators';
import backgroundImage from '../fTRYDXFAD.jpeg';
import './Login.css';

/**
 * 是否使用本地 Mock 接口。
 * 后端 api-ud（Spring Boot，端口 8081）已提供 POST /api/auth/login，
 * 故置为 false 直接连接真实后端（由 vite.config.ts 的 /api 代理转发）。
 * 需要脱离后端独立演示时，改回 true 即可。
 */
const USE_MOCK = false;

/** 认证成功后保存 Token 的 sessionStorage 键名（详细设计 7.4） */
const TOKEN_STORAGE_KEY = 'edb_auth_token';
/** 认证成功后保存用户信息的 sessionStorage 键名 */
const USER_STORAGE_KEY = 'edb_user_info';

/** 备选登录链接（账户锁定场景提示使用，详细设计 1.3 / 6） */
const ALT_LOGIN_URL = 'https://support.tpi.example.com/alternative-login';
/** 支持邮箱（左侧信息区第三行，详细设计 2.2.2） */
const SUPPORT_MAIL = 'support@tpi.example.com';

/** 登录按钮的常规文案 */
const LOGIN_BUTTON_TEXT = 'Login';
/** 登录按钮的请求中文案 */
const LOGIN_BUTTON_LOADING_TEXT = 'Logging in...';

/**
 * 全角字符 → 半角字符 转换（可复用的纯函数）
 * ------------------------------------------------------------------
 * 详细设计 2.1 要求 UserID / Password 仅允许「半角」字符。
 * 中文输入法在未切换到英文状态时，敲出的字母/数字会是全角形式
 * （如 ａｄｍｉｎ），直接过滤会让用户觉得「打不进去」。
 * 此处先将全角字符归一化为半角，再交给过滤逻辑，可显著改善输入体验。
 *
 * 转换范围：
 *   - 全角英数字/符号（U+FF01–U+FF5E）→ 对应半角 ASCII（U+0021–U+007E）
 *   - 全角空格（U+3000）→ 半角空格（U+0020）
 *
 * @param value 原始输入值
 * @returns 半角化后的值
 */
const toHalfWidth = (value: string): string =>
  value
    .replace(/[\uFF01-\uFF5E]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0),
    )
    .replace(/\u3000/g, ' ');

/**
 * Login 组件本体
 * @returns {React.JSX.Element} 登录页面
 */
function Login(): React.JSX.Element {
  /* ------------------------------ State 定义 ------------------------------ */
  // 详细设计 7.1：使用 React State 管理 userID / password / message / isLoading
  /** UserID 输入值 */
  const [userID, setUserID] = useState<string>('');
  /** Password 输入值 */
  const [password, setPassword] = useState<string>('');
  /** 错误消息（空字符串时 Message 区域不占位） */
  const [message, setMessage] = useState<string>('');
  /** 请求中标志，为 true 时 Login 按钮 disabled */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /** 密码显示 / 隐藏切换 */
  const [showPassword, setShowPassword] = useState<boolean>(false);

  /** UserID 输入框引用：校验失败时用于焦点控制 */
  const userIDRef = useRef<HTMLInputElement>(null);
  /** Password 输入框引用：校验失败时用于焦点控制 */
  const passwordRef = useRef<HTMLInputElement>(null);
  /** 组件卸载标志：避免请求返回后对已卸载组件 setState */
  const mountedRef = useRef<boolean>(true);

  const navigate = useNavigate();

  /* ------------------------------ 生命周期 ------------------------------ */
  useEffect(() => {
    mountedRef.current = true;
    // 详细设计 7.4：未认证用户访问受保护页面时应重定向回 Login
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ------------------------------ 工具方法 ------------------------------ */
  /**
   * 统一设置错误消息，并可根据字段名将焦点移动到对应输入框
   * @param text 错误消息内容
   * @param focusField 需要聚焦的字段
   */
  const showError = useCallback(
    (text: string, focusField: 'userID' | 'password' | '' = ''): void => {
      setMessage(text);
      if (focusField === 'userID') userIDRef.current?.focus();
      if (focusField === 'password') passwordRef.current?.focus();
    },
    [],
  );

  /**
   * 清空错误消息（Message 区域高度归 0，不占位）
   */
  const clearError = useCallback((): void => setMessage(''), []);

  /* ------------------------------ 事件处理 ------------------------------ */
  /**
   * UserID 输入变更
   * 详细设计 6：输入非法字符时前端实时拦截，仅保留半角英数字，并限制最大长度 10。
   * @param event 变更事件
   */
  const handleUserIDChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      // 先做全角→半角归一化，再过滤非半角英数字字符
      const filtered = toHalfWidth(event.target.value).replace(
        /[^a-zA-Z0-9]/g,
        '',
      );
      setUserID(filtered.slice(0, 10));
      if (message) clearError();
    },
    [message, clearError],
  );

  /**
   * Password 输入变更
   * 详细设计 2.1：允许半角英数字 + 符号，最大长度 32。
   * @param event 变更事件
   */
  const handlePasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      // 先做全角→半角归一化，再允许 ASCII 可见字符（半角英数字 + 符号），过滤空白
      const filtered = toHalfWidth(event.target.value).replace(
        /[^\x21-\x7E]/g,
        '',
      );
      setPassword(filtered.slice(0, 32));
      if (message) clearError();
    },
    [message, clearError],
  );

  /**
   * 密码显示 / 隐藏切换
   * 详细设计 7.3：密码输入框 type="password"，显示为掩码（•）。
   */
  const handleTogglePassword = useCallback((): void => {
    setShowPassword((prev) => !prev);
  }, []);

  /**
   * 登录提交处理
   * 详细设计 4.1 处理流程：
   *   1. 获取 UserID / Password 并 trim
   *   2. 空值校验 → 不通过则显示消息并终止（不调用 API）
   *   3. 调用 AuthenticationApi
   *   4. 结果处理：成功跳转 / 401 / 403 / 500 / 网络异常
   * @param event 表单提交事件
   */
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();

      // 防重复提交：请求中直接忽略
      if (isLoading) return;

      clearError();

      // 前置处理：去除首尾空格
      const trimmedUserID = normalize(userID);
      const trimmedPassword = normalize(password);

      // 前端校验（空值 + 格式 + 长度）
      const {
        valid,
        message: errorText,
        focusField,
      }: LoginFormValidationResult = validateLoginForm({
        userId: trimmedUserID,
        password: trimmedPassword,
      });
      if (!valid) {
        showError(errorText, focusField);
        return; // 终止流程，不调用 API
      }

      setIsLoading(true);
      try {
        // API 调用：AuthenticationApi(userID, password)
        const api = USE_MOCK ? mockAuthenticationApi : authenticationApi;
        const result = await api(trimmedUserID, trimmedPassword);

        // 组件已卸载则不再更新状态
        if (!mountedRef.current) return;

        if (result.success) {
          // 成功（200）：保存 Token 并跳转 Menu 页面
          const token = result.data?.token || '';
          sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
          sessionStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(result.data?.userid || trimmedUserID),
          );
          clearError();
          navigate('/menu', { replace: true });
          return;
        }

        // 失败：按状态码显示对应消息（401 / 403 / 500 / 网络异常）
        showError(result.message || ERROR_MESSAGES.SYSTEM_ERROR);
        // 401 用户名或密码错误时清空密码框，便于重新输入
        if (result.code === 401) {
          setPassword('');
          passwordRef.current?.focus();
        }
      } catch {
        // 兜底异常处理：确保无控制台报错
        if (mountedRef.current) {
          showError(ERROR_MESSAGES.SYSTEM_ERROR);
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [isLoading, userID, password, clearError, showError, navigate],
  );

  /* ------------------------------ 渲染 ------------------------------ */
  return (
    <div
      className="login-screen"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="login-panel">
        {/* 左侧信息区（详细设计 2.2.2） */}
        <section className="login-info">
          <h1 className="login-info__title">
            <strong>EDB</strong> Engineering Database
          </h1>
          <p className="login-info__subtitle">Use Outlook id and password</p>
          <p className="login-info__support">
            Support, authorization request or improvement suggestions, send mail
            to:{' '}
            <a className="login-info__mail" href={`mailto:${SUPPORT_MAIL}`}>
              Support TPI
            </a>
          </p>
        </section>

        {/* 右侧登录表单区（详细设计 2.2.3） */}
        <section className="login-form-area">
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* 控件 1：UserID（必填 / 最大 10 / 半角英数字） */}
            <div className="login-field">
              <label className="login-field__label" htmlFor="userID">
                UserID
              </label>
              <input
                id="userID"
                name="userID"
                ref={userIDRef}
                className="login-field__input"
                type="text"
                value={userID}
                maxLength={10}
                autoComplete="username"
                autoFocus
                onChange={handleUserIDChange}
                /*
                  输入法引导（详细设计 2.1：UserID 仅允许半角英数字）
                  - lang="en"：向输入法声明此输入框为英文语境。
                  - inputMode="url"：移动端调出英文键盘布局。
                  - autoCapitalize / autoCorrect / spellCheck：关闭输入自动转换。
                */
                lang="en"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            {/* 控件 2：Password（必填 / 最大 32 / 掩码显示 + 显示切换） */}
            <div className="login-field">
              <label className="login-field__label" htmlFor="password">
                Password
              </label>
              <div className="login-field__password-wrap">
                <input
                  id="password"
                  name="password"
                  ref={passwordRef}
                  className="login-field__input login-field__input--password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  maxLength={32}
                  autoComplete="current-password"
                  onChange={handlePasswordChange}
                  /*
                    输入法引导（详细设计 2.1：Password 仅允许半角英数字 + 符号）
                    与 UserID 同理，通过 lang="en" 等属性保持输入法为英文状态。
                  */
                  lang="en"
                  inputMode="url"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="login-field__toggle"
                  onClick={handleTogglePassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {/*
                    密码显示 / 隐藏图标（内联 SVG，无需引入图标库）
                    - 睁眼：明文显示中，点击可隐藏
                    - 闭眼（带斜线）：掩码显示中，点击可显示
                  */}
                  <svg
                    className="login-field__eye"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    {showPassword ? (
                      <>
                        {/* 闭眼 + 斜线：表示当前为隐藏状态 */}
                        <path d="M3 3l18 18" />
                        <path d="M10.6 6.3A9.9 9.9 0 0 1 12 6.2c5 0 9 5.8 9 5.8a17.6 17.6 0 0 1-3.3 3.9" />
                        <path d="M6.6 7.9A17.4 17.4 0 0 0 3 12s4 5.8 9 5.8a9.5 9.5 0 0 0 3.4-.6" />
                        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      </>
                    ) : (
                      <>
                        {/* 睁眼：表示当前为明文显示状态 */}
                        <path d="M2.5 12S6.5 6.2 12 6.2 21.5 12 21.5 12 17.5 17.8 12 17.8 2.5 12 2.5 12Z" />
                        <circle cx="12" cy="12" r="3.1" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/*
              控件 3：Message 错误消息显示区域
              详细设计 7.3：仅在出错时显示红色文字，内容为空时高度为 0（不占位）
            */}
            <p
              className={`login-message${message ? ' login-message--visible' : ''}`}
              role="alert"
              aria-live="polite"
            >
              {message}
            </p>

            {/* 控件 4：Login 按钮（isLoading 期间 disabled，防止重复提交） */}
            <button
              className="login-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? LOGIN_BUTTON_LOADING_TEXT : LOGIN_BUTTON_TEXT}
            </button>
          </form>

          {/* 表单下方提示（详细设计 2.2.3 的三行提示词） */}
          <div className="login-hints">
            <p className="login-hints__line">
              If you get error message: &quot;Your account is locked. Please
              contact your system administrator.&quot;
            </p>
            <p className="login-hints__line">
              Please try this{' '}
              <a
                className="login-hints__link"
                href={ALT_LOGIN_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                alternative login link
              </a>{' '}
              before contacting support.
            </p>
            <p className="login-hints__line">
              We are working to find root cause of problem.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}



export default Login;   
