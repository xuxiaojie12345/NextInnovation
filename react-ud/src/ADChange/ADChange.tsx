/**
 * ADChange 组件 - AD Change页面（UD16）
 * 
 * 业务概述：
 * AD (After Def) Change 是 EDB Engineering Database 中对售后市场变更（Serie-Chnr）
 * 进行管理的一个功能模块。用户可以对特定的 Serie-Chnr 组合执行三种操作：
 *   - ADD   : 添加一条新的 ADCA 变更记录
 *   - DELETE: 逻辑删除（标记为无效）一条已有的 ADCA 变更记录
 *   - CHECK : 查询指定 Serie-Chnr 是否存在变更记录，并显示详情
 * 
 * 调用后端 API：POST /api/adchange/process（统一接口，通过 operation 字段区分）
 * 对应详细设计：详细设计/詳細設計UD16.md
 */
import React, { useState } from "react";
import api, { API_BASE_URL } from "../config/api";
import "./ADChange.css";

/**
 * CHECK 操作成功后，后端返回的查询结果数据类型
 * 
 * 对应详细设计 4.1 Response Success 章节
 * 
 * @property serieChnr - ADCA 变更记录的唯一标识（系列-底盘号组合）
 * @property desc      - 变更描述文本
 * @property status    - 当前变更记录的状态标记（如 "ACTIVATED" / "INACTIVE"）
 */
interface CheckResult {
  serieChnr: string;
  desc: string;
  status: string;
}

/**
 * ADChange 组件
 * 
 * 提供 ADCA 变更记录的 ADD、DELETE、CHECK 三种操作。
 * 三种操作复用同一个后端 API 端点，通过请求体中的 operation 字段区分。
 * 所有操作在执行前都会先经过前端校验（空值校验、长度校验等），
 * 校验通过后才发起 API 请求。
 * 
 * @returns 渲染 AD Change 管理页面
 */
const ADChange: React.FC = () => {
  // ── 输入字段状态 ──────────────────────────────────────────
  // serieChnr: 用户输入的 Serie-Chnr 组合，格式示例 "ABC-123456"
  const [serieChnr, setSerieChnr] = useState<string>("");
  // desc: 用户输入的变更描述文本（仅 ADD 操作使用）
  const [desc, setDesc] = useState<string>("");

  // ── CHECK 结果弹窗状态 ─────────────────────────────────────
  // checkResult: 后端返回的 CHECK 查询结果（有数据时为对象，无数据时为 null）
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  // checkMessage: CHECK 无数据时显示的提示文本（如 "数据不存在"）
  const [checkMessage, setCheckMessage] = useState<string>("");
  // showCheckModal: 控制 CHECK 结果弹窗的显示/隐藏
  const [showCheckModal, setShowCheckModal] = useState<boolean>(false);

  // ── 通用 UI 状态 ───────────────────────────────────────────
  // message: 页面中的提示消息文本（操作成功/失败时更新）
  const [message, setMessage] = useState<string>("");
  // messageType: 消息类型，控制样式（error=红色错误消息, success=绿色成功消息）
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  // loading: 请求进行中标记，为 true 时禁用按钮和输入框（防止重复提交）
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * 清空当前页面中的所有消息提示
   * 在用户开始新的操作前调用，清除上次操作的遗留消息
   */
  const clearMessage = () => setMessage("");

  /**
   * 校验 Serie-Chnr 输入是否为空
   * 
   * 三种操作（ADD / DELETE / CHECK）的前置共用校验逻辑。
   * 详细设计 3.1 "共同前置处理" 规定：所有操作必须先检查 Serie-Chnr 是否为空。
   * 
   * @returns {boolean} - true=校验通过（不为空）, false=校验失败（为空）
   */
  const validateSerieChnr = (): boolean => {
    if (!serieChnr || serieChnr.trim() === "") {
      return false;
    }
    return true;
  };

  /**
   * ADD 操作 - 添加新的 ADCA 变更记录
   * 
   * 调用流程：
   *   1. 清空此前残留的消息和 CHECK 结果
   *   2. 【前端校验】Serie-Chnr 为空校验（详细设计 3.2 No.1）
   *   3. 【前端校验】Serie-Chnr 长度校验，上限 15 字符（详细设计 3.2 No.2）
   *   4. 【前端校验】Desc 长度校验，上限 4000 字符（详细设计 3.2 No.3）
   *   5. 发起 POST /api/adchange/process { operation: "ADD", ... }
   *   6. 【后端响应】code=200 → 添加成功，清空输入框
   *   7. 【后端响应】code=409 → 记录已存在（详细设计 3.2 No.4）
   *   8. 【异常捕获】网络错误等 → 提示用户重试
   * 
   * 对应详细设计 3.1.2 ADD操作流程
   */
  const handleAdd = async () => {
    // 步骤1：清空此前操作残留的状态
    clearMessage();
    setCheckResult(null);

    // 步骤2：校验 Serie-Chnr 是否为空白（详细设计 3.2 No.1）
    if (!validateSerieChnr()) {
      setMessage("请输入Serie-Chnr");
      setMessageType("error");
      return;
    }

    // 步骤3：校验 Serie-Chnr 长度不超过 15 字符（详细设计 3.2 No.2）
    if (serieChnr.trim().length > 15) {
      setMessage("Serie-Chnr长度不能超过15字符");
      setMessageType("error");
      return;
    }

    // 步骤4：校验 Desc 长度不超过 4000 字符（详细设计 3.2 No.3）
    if (desc.length > 4000) {
      setMessage("描述长度不能超过4000字符");
      setMessageType("error");
      return;
    }

    // 步骤5：发起 API 请求（加锁防止重复提交）
    setLoading(true);
    try {
      const response = await api.post(
        '/api/adchange/process',
        {
          operation: "ADD",          // 操作类型：添加
          serieChnr: serieChnr.trim(), // 去除首尾空格后提交
          desc: desc.trim()            // 去除首尾空格后提交
        }
      );

      // 步骤6/7：根据后端返回的 code 处理结果
      if (response.data.code === 200) {
        // 步骤6：添加成功 → 清空输入框，显示成功消息
        setSerieChnr("");
        setDesc("");
        setMessage("添加成功");
        setMessageType("success");
      } else if (response.data.code === 409) {
        // 步骤7：记录已存在 → 提示特定错误信息（详细设计 3.2 No.4）
        setMessage("AFTER DEF CHANGE IS NOT ACTIVATED");
        setMessageType("error");
      } else {
        setMessage(response.data.message || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch (err) {
      // 步骤8：网络异常 / 服务器无响应等异常情况
      setMessage("操作失败，请稍后重试");
      setMessageType("error");
    } finally {
      // 无论成功/失败，最终释放操作锁
      setLoading(false);
    }
  };

  /**
   * DELETE 操作 - 逻辑删除 ADCA 变更记录
   * 
   * 调用流程：
   *   1. 清空此前残留的消息和 CHECK 结果
   *   2. 【前端校验】Serie-Chnr 为空校验（详细设计 3.2 No.5）
   *   3. 发起 POST /api/adchange/process { operation: "DELETE", ... }
   *   4. 【后端响应】code=200 → 删除成功，清空输入框
   *   5. 【异常捕获】失败时提示用户重试
   * 
   * 注意：DELETE 操作为逻辑删除（标记记录为无效），非物理删除数据。
   * 对应详细设计 3.1.3 DELETE操作流程
   */
  const handleDelete = async () => {
    clearMessage();
    setCheckResult(null);

    // 校验 Serie-Chnr 是否为空白（详细设计 3.2 No.5）
    if (!validateSerieChnr()) {
      setMessage("请输入要删除的Serie-Chnr");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        '/api/adchange/process',
        {
          operation: "DELETE",         // 操作类型：删除
          serieChnr: serieChnr.trim(), // 要删除的记录标识
          user: "admin",               // 操作人（当前固定为 admin）
          process: "UD16"              // 来源画面标识（UD16=本页面）
        }
      );

      if (response.data.code === 200) {
        // 删除成功 → 清空输入框
        setSerieChnr("");
        setDesc("");
        setMessage("删除成功");
        setMessageType("success");
      } else {
        setMessage(response.data.message || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("操作失败，请稍后重试");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * CHECK 操作 - 检查 ADCA 变更记录的存在性
   * 
   * 调用流程：
   *   1. 清空此前残留的消息和 CHECK 结果
   *   2. 【前端校验】Serie-Chnr 为空校验（详细设计 3.2 No.6）
   *   3. 发起 POST /api/adchange/process { operation: "CHECK", ... }
   *   4. 【有数据】弹出弹窗展示记录详情（详细设计 3.2 No.7）
   *   5. 【无数据】弹窗提示"数据不存在"（详细设计 3.2 No.8）
   *   6. 【异常捕获】失败时在页面显示错误消息
   * 
   * 对应详细设计 3.1.4 CHECK操作流程
   */
  const handleCheck = async () => {
    clearMessage();
    setCheckResult(null);

    // 校验 Serie-Chnr 是否为空白（详细设计 3.2 No.6）
    if (!validateSerieChnr()) {
      setMessage("请输入要检查的Serie-Chnr");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        '/api/adchange/process',
        {
          operation: "CHECK",          // 操作类型：查询
          serieChnr: serieChnr.trim()  // 要查询的记录标识
        }
      );

      if (response.data.code === 200) {
        if (response.data.data) {
          // 步骤4：记录存在 → 保存数据并显示在弹窗中（详细设计 3.2 No.7）
          const data: CheckResult = response.data.data;
          setCheckResult(data);
          setCheckMessage("");
        } else {
          // 步骤5：记录不存在 → 弹窗中显示"数据不存在"（详细设计 3.2 No.8）
          setCheckResult(null);
          setCheckMessage("数据不存在");
        }
        setShowCheckModal(true);
      } else {
        setMessage(response.data.message || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("操作失败，请稍后重试");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 关闭 CHECK 结果弹窗
   * 
   * 同时清除弹窗内的数据，下次打开时保证显示全新的查询结果。
   * 弹窗支持两种关闭方式：
   *   - 点击弹窗右上角 × 按钮
   *   - 点击弹窗背景的半透明遮罩层（onClick={closeCheckModal}）
   */
  const closeCheckModal = () => {
    setShowCheckModal(false);  // 隐藏弹窗
    setCheckResult(null);       // 清空查询结果（下次打开时重新加载）
    setCheckMessage("");        // 清空无数据提示
  };

  return (
    <div className="ud16-container">
      {/* ── 页面标题 ── */}
      <h1 className="ud16-title">AD Change</h1>

      {/* 
        ── 加载中遮罩 ──
        当 loading 为 true 时，显示 "Processing..." 提示，
        此时所有按钮和输入框均为 disabled 状态，防止重复操作。
      */}
      {loading && <div className="ud16-loading">Processing...</div>}

      {/* ── 表单区域 ── */}
      <div className="ud16-form">
        {/* Serie-Chnr 输入字段 */}
        <div className="ud16-field">
          <label className="ud16-label">Serie-Chnr</label>
          <input
            type="text"
            className="ud16-input"
            value={serieChnr}
            onChange={(e) => { setSerieChnr(e.target.value); if (message) clearMessage(); }}
            disabled={loading}            maxLength={15}
            placeholder="Enter Serie-Chnr"
          />
        </div>
        {/* Desc 输入字段（多行文本，仅 ADD 操作需要填写） */}
        <div className="ud16-field">
          <label className="ud16-label">Desc</label>
          <textarea
            className="ud16-textarea"
            value={desc}
            onChange={(e) => { setDesc(e.target.value); if (message) clearMessage(); }}
            disabled={loading}
            maxLength={4000}
            placeholder="Enter description"
            rows={4}
          />
        </div>

        {/* 
          ── 消息提示区域 ──
          显示在 Desc 下方，message 不为空时渲染。
          通过 messageType 控制样式：error=红色背景，success=绿色背景。
        */}
        {message && (
          <div className={`ud16-message ${messageType}`}>{message}</div>
        )}

        {/* 
          ── 操作按钮组 ──
          三个按钮水平排列，分别对应 ADD / DELETE / CHECK 三种操作。
          当 loading 为 true 时，所有按钮置灰不可点击。
        */}
        <div className="ud16-btn-group">
          <button type="button" className="ud16-btn" onClick={handleAdd} disabled={loading}>ADD</button>
          <button type="button" className="ud16-btn" onClick={handleDelete} disabled={loading}>DELETE</button>
          <button type="button" className="ud16-btn" onClick={handleCheck} disabled={loading}>CHECK</button>
        </div>
      </div>

      {/* 
        ── CHECK 结果弹窗 ──
        点击 CHECK 按钮且后端返回结果后弹出（showCheckModal === true）。
        对应详细设计 3.1.4 步骤5。
        
        弹窗结构：
        - 遮罩层：点击可关闭弹窗
        - 弹窗本体：包含标题栏、内容区、底部按钮
        - 内容区根据是否有数据显示不同内容：
          * 有数据 → 表格展示 Serie-Chnr / Desc / Status 三个字段
          * 无数据 → 显示 "数据不存在" 提示文本
      */}
      {showCheckModal && (
        <div className="ud16-modal-overlay" onClick={closeCheckModal}>
          <div className="ud16-modal" onClick={(e) => e.stopPropagation()}>
            {/* 弹窗标题栏 */}
            <div className="ud16-modal-header">
              <h3>CHECK Result</h3>
              <button className="ud16-modal-close" onClick={closeCheckModal}>&times;</button>
            </div>
            {/* 弹窗内容区 */}
            <div className="ud16-modal-body">
              {checkResult ? (
                /* 有数据：以只读表格展示查询结果 */
                <table className="ud16-check-table">
                  <tbody>
                    <tr>
                      <td className="ud16-check-label">Serie-Chnr</td>
                      <td className="ud16-check-value">{checkResult.serieChnr}</td>
                    </tr>
                    <tr>
                      <td className="ud16-check-label">Desc</td>
                      <td className="ud16-check-value">{checkResult.desc}</td>
                    </tr>
                    <tr>
                      <td className="ud16-check-label">Status</td>
                      <td className="ud16-check-value">{checkResult.status}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* 无数据：显示提示消息 */
                <p className="ud16-check-not-found">{checkMessage}</p>
              )}
            </div>
            {/* 弹窗底部关闭按钮 */}
            <div className="ud16-modal-footer">
              <button type="button" className="ud16-btn" onClick={closeCheckModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADChange;
