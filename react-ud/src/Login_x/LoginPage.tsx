import React, { useState } from "react";
import "./LoginPage.css";

// 定义表单数据类型
interface LoginFormData {
  UserID: string;
  Password: string;
}

// 定义消息状态类型
interface MessageState {
  text: string;
  type: "warning" | "error" | "";
}

const LoginPage: React.FC = () => {
  // --- 状态管理 ---
  const [formData, setFormData] = useState<LoginFormData>({
    UserID: "",
    Password: "",
  });

  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // --- 正则表达式定义 ---
  // UserID: 仅允许半角英文字母和数字
  const REGEX_USER_ID = /^[a-zA-Z0-9]*$/;
  // Password: 仅允许半角英文字母、数字和常见符号 (根据需求"符号"通常指ASCII可见非字母数字字符，这里涵盖常见键盘符号)
  // 注意：如果"符号"有特定范围（如仅限 !@#$%），请调整此正则。此处使用通用的 printable ASCII 非控制字符范围或常见符号集合。
  // 这里使用一个较宽泛的符号集合：半角英数 + !@#$%^&*()_+-=[]{}|;:',.<>?/~`
  const REGEX_PASSWORD = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]*$/;

  // --- 事件处理 ---

  // 输入框变化处理（增加字符过滤逻辑）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let filteredValue = value;

    // 1. 根据字段名应用不同的正则过滤
    if (name === "UserID") {
      // 如果新输入的值不符合 UserID 规则，则截断或忽略非法字符
      // 这里采用：只保留符合规则的字符
      if (!REGEX_USER_ID.test(value)) {
        // 简单做法：如果整体不匹配，通常是因为最后输入的字符非法。
        // 更稳健的做法是使用 replace 移除非法字符，但为了保持输入流畅性，
        // 我们通常允许输入，但在提交时报错，或者实时替换。
        // 此处采用实时替换非法字符为空的方式，确保 state 中永远只有合法字符
        filteredValue = value.replace(/[^a-zA-Z0-9]/g, "");
      }
    } else if (name === "Password") {
      // 同理，移除 Password 中不允许的字符
      if (!REGEX_PASSWORD.test(value)) {
        // 移除所有非 半角英数+指定符号 的字符
        // 注意：正则中的 ^ 在 [] 内表示取反
        filteredValue = value.replace(
          /[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g,
          "",
        );
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: filteredValue,
    }));

    // 用户开始输入时，清除之前的错误/警告信息
    if (message.text) {
      setMessage({ text: "", type: "" });
    }
  };

  // 前端校验逻辑
  const validateForm = (): boolean => {
    const { UserID, Password } = formData;

    // 1. 检查 UserID 是否为空
    if (!UserID.trim()) {
      setMessage({
        text: "Username and password are required.",
        type: "warning",
      });
      return false;
    }

    // 2. 检查 Password 是否为空
    if (!Password.trim()) {
      setMessage({
        text: "Username and password are required.",
        type: "warning",
      });
      return false;
    }

    // 3. (可选) 再次确认格式，虽然输入时已过滤，但作为双重保险
    if (!REGEX_USER_ID.test(UserID)) {
      setMessage({
        text: "User ID contains invalid characters.",
        type: "error",
      });
      return false;
    }

    if (!REGEX_PASSWORD.test(Password)) {
      setMessage({
        text: "Password contains invalid characters.",
        type: "error",
      });
      return false;
    }

    return true;
  };

  // 模拟 API 调用 (AuthenticationApi)
  const callAuthenticationApi = async (
    userId: string,
    password: string,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟逻辑
        if (password.toLowerCase().includes("error")) {
          resolve(false);
        } else {
          resolve(true);
        }
      }, 800);
    });
  };

  // 登录按钮点击事件
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const isSuccess = await callAuthenticationApi(
        formData.UserID,
        formData.Password,
      );

      if (isSuccess) {
        console.log("Login Success");
        alert("Login Successful! Redirecting...");
      } else {
        setMessage({
          text: "We didn't recognize the username or password you entered. Please try again.",
          type: "error",
        });
        setFormData((prev) => ({ ...prev, Password: "" }));
      }
    } catch (err) {
      console.error(err);
      setMessage({
        text: "System error. Please try again later.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 渲染 UI ---
  return (
    <div className="login-page-container">
      {/* 左侧：信息展示区 */}
      <div className="left-section">
        <div className="info-box">
          <h1 className="main-title">
            <strong>EDB</strong> Engineering Database
          </h1>
          <p className="sub-title">Use Outlook id and password</p>
          <p className="support-text">
            Support, authorization request or improvement suggestions, send mail
            to: Support TPI
          </p>
        </div>
      </div>

      {/* 右侧：登录交互区 */}
      <div className="right-section">
        <div className="form-wrapper">
          {/* UserID 输入框 */}
          <div className="input-group">
            <input
              type="text"
              name="UserID"
              className="form-input"
              placeholder="User ID"
              maxLength={10}
              value={formData.UserID}
              onChange={handleInputChange}
              disabled={isLoading}
              aria-label="User ID"
              // 提示用户允许的字符类型（可选，增强UX）
              title="Allowed: Alphanumeric characters only"
            />
          </div>

          {/* Password 输入框 */}
          <div className="input-group">
            <input
              type="password"
              name="Password"
              className="form-input"
              placeholder="Password"
              maxLength={32}
              value={formData.Password}
              onChange={handleInputChange}
              disabled={isLoading}
              aria-label="Password"
              title="Allowed: Alphanumeric and symbols"
            />
          </div>

          {/* Login 按钮 (居中显示) */}
          <div className="button-container">
            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>

          {/* 动态消息提示 (Message Label) */}
          {message.text && (
            <div className={`dynamic-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* 静态红色提示信息 (居左) */}
          <div className="static-help-info">
            <p>
              If you get error message: "Your account is locked. Please contact
              your system administrator"
            </p>
            <p>
              Please try this alternative login link before contacting support{" "}
              <span className="fake-link">Login</span>
            </p>
            <p>We are working to find root cause of problem</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
