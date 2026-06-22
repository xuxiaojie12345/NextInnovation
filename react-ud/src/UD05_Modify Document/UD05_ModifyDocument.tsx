import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./UD05_ModifyDocument.css";
import apiClient from "../api/config";

/**
 * UD05 修改文档页面组件
 * 
 * 功能说明：
 * - 根据前画面传入的数据，展示可以修正的变量数据
 * - 用户可以查看当前值并输入修改后的值，然后保存修改
 * - 提供清晰的DataTable展示，区分当前值和修改值
 * - 支持模板下载和跳转到车辆规格页面
 * 
 * 用户体验：
 * - DataTable四列清晰对齐（Variable、Description、Current value、Modified value）
 * - Current value 和 Modified value 对比显示
 * - 高亮显示有修改的行
 * - 按钮在加载期间禁用
 * 
 * 安全性：
 * - 所有API请求通过HTTPS发送
 * - Modified value长度限制为500字符
 * - 防止XSS攻击
 * 
 * @component
 * @returns {JSX.Element} 修改文档页面元素
 */
const UD05_ModifyDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  // 对应设计书 6.1 状态管理
  const [chassisNo, setChassisNo] = useState<string>("");                    // Chassis no（从前画面传入）
  const [market, setMarket] = useState<string>("");                          // Market（从前画面传入）
  const [chassisSerie, setChassisSerie] = useState<string>("");              // Chassis series（从前画面传入）
  
  // 变量列表数据
  interface VariableItem {
    variable: string;        // 变量名
    description: string;     // 描述
    currentValue: string;    // 当前值
    modifiedValue: string;   // 修改后的值
  }
  
  const [variables, setVariables] = useState<VariableItem[]>([]);           // 变量列表
  const [message, setMessage] = useState<string>("");                        // 错误消息
  const [isLoading, setIsLoading] = useState<boolean>(false);                // 加载状态标识

  // ==================== 常量定义 ====================
  const TEMPLATE_FILENAME = "VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf";        // 模板文件名
  const MAX_MODIFIED_VALUE_LENGTH = 500;                                     // Modified value最大长度

  // ==================== 生命周期 ====================

  /**
   * 组件加载时初始化
   * 1. 从路由参数获取 Chassis series、Chassis no 和 Market
   * 2. 立即调用API获取数据
   */
  useEffect(() => {
    // 从路由state获取前画面传来的参数
    const state = location.state as any;
    if (state) {
      setChassisSerie(state.chassisSerie || "");
      setChassisNo(state.chassisNo || "");
      setMarket(state.market || "");
    }

    // 调用API获取数据
    if (state?.chassisSerie && state?.chassisNo) {
      fetchModifyDocumentData(state.chassisSerie, state.chassisNo);
    }
  }, [location.state]);

  // ==================== API调用 ====================

  /**
   * 获取修改文档数据
   * 对应设计书 4.1 UD05SelectVariableModification - 获取数据
   * Method: POST, Endpoint: /api/ud05/selectmodifydocument
   * 
   * @param chassisSerie - 底盘系列
   * @param chassisNo - 底盘编号
   */
  const fetchModifyDocumentData = async (chassisSerie: string, chassisNo: string) => {
    setIsLoading(true);
    setMessage("");
    
    try {
      const response = await apiClient.post("/api/ud05/selectmodifydocument", {
        chassisSerie: chassisSerie,
        chassisNo: chassisNo
      });

      if (response.data.code === 200 && response.data.data) {
        // 解析返回数据，填充DataTable
        const data = response.data.data;
        
        // 将API返回的数据转换为前端需要的格式
        const variableList: VariableItem[] = [
          {
            variable: data.variable || "",
            description: data.description || "",
            currentValue: data.newval || "",
            modifiedValue: ""
          }
        ];
        
        setVariables(variableList);
      } else {
        // API返回失败
        setMessage("We can not get the data. Please try again.");
        setVariables([]);
      }
    } catch (error: any) {
      console.error("获取修改文档数据失败:", error);
      
      // 根据错误类型显示不同的消息
      if (error.code === "E001") {
        setMessage("We can not get the OM_data. Please try again.");
      } else {
        setMessage("System error. Please try again later.");
      }
      
      setVariables([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 更新修改文档数据
   * 对应设计书 4.2 UD05UpdateHdocAdcaModification - 更新数据
   * Method: POST, Endpoint: /api/ud05/updatemodifydocument
   * 
   * @param chassisSerie - 底盘系列
   * @param chassisNo - 底盘编号
   * @param description - 描述
   */
  const updateModifyDocumentData = async (chassisSerie: string, chassisNo: string, description: string) => {
    setIsLoading(true);
    setMessage("");
    
    try {
      const response = await apiClient.post("/api/ud05/updatemodifydocument", {
        chassisSerie: chassisSerie,
        chassisNo: chassisNo,
        description: description
      });

      if (response.data.code === 200) {
        // 更新成功，跳转到UD06 Save Modifications画面
        navigate("/UD06", {
          state: {
            chassisSerie: chassisSerie,
            chassisNo: chassisNo
          }
        });
      } else {
        // 更新失败
        setMessage("数据更新失败，请稍后重试");
      }
    } catch (error: any) {
      console.error("更新修改文档数据失败:", error);
      
      // 根据错误类型显示不同的消息
      if (error.code === "E001") {
        setMessage("We can not get the OM_data. Please try again.");
      } else {
        setMessage("System error. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Modified value 输入变化
   * 限制：最大长度500字符
   * 用户体验优化：用户重新输入时清空错误提示
   * 
   * @param index - 变量索引
   * @param value - 输入值
   */
  const handleModifiedValueChange = (index: number, value: string) => {
    // 长度校验
    if (value.length > MAX_MODIFIED_VALUE_LENGTH) {
      return;
    }
    
    const newVariables = [...variables];
    newVariables[index].modifiedValue = value;
    setVariables(newVariables);
    
    // 用户体验优化：用户重新输入时清空错误提示
    if (message) setMessage("");
  };

  /**
   * 点击 Save 按钮
   * 对应设计书 3.1.2 Save按钮处理流程
   * 
   * 处理流程：
   * 1. 收集所有Modified value的值
   * 2. 调用API更新数据
   * 3. 成功后跳转到UD06画面
   */
  const handleSaveClick = () => {
    if (!chassisSerie || !chassisNo) {
      setMessage("参数不完整，请返回上一页重新操作");
      return;
    }

    // 收集所有有修改的值
    const modifiedItems = variables.filter(item => item.modifiedValue.trim() !== "");
    
    if (modifiedItems.length === 0) {
      setMessage("没有需要保存的修改");
      return;
    }

    // 调用更新API（这里简化处理，只传递第一个修改项的描述）
    // 实际项目中可能需要批量更新多个变量
    updateModifyDocumentData(chassisSerie, chassisNo, modifiedItems[0].description);
  };

  /**
   * 点击 Templateファイル Link
   * 对应设计书 3.1.3 Templateファイル Link点击流程
   * 
   * 处理流程：
   * 1. 下载前画面生成的Templateファイル
   * 2. 保存到本地
   */
  const handleTemplateClick = () => {
    // TODO: 实现文件下载逻辑
    // 这里需要根据实际后端API来实现
    console.log("下载模板文件:", TEMPLATE_FILENAME);
    
    // 临时实现：创建一个虚拟下载链接
    const link = document.createElement("a");
    link.href = "#"; // 实际应该是后端提供的下载URL
    link.download = TEMPLATE_FILENAME;
    link.click();
    
    setMessage("模板文件下载功能待实现");
  };

  /**
   * 点击 Chassis no Link
   * 对应设计书 3.1.4 Chassis no Link点击流程
   * 
   * 处理流程：
   * 1. 将Chassis no作为参数传给下个画面
   * 2. 打开UD07 VDA - Vehicle Specification画面
   */
  const handleChassisNoClick = () => {
    navigate("/UD07", {
      state: {
        chassisSerie: chassisSerie,
        chassisNo: chassisNo
      }
    });
  };

  // ==================== 渲染 ====================
  return (
    <div className="ud05-container">
      {/* 页面标题 */}
      <h1 className="ud05-title">Modify Document</h1>

      {/* 错误消息显示 */}
      {message && (
        <div className="ud05-message">
          {message}
        </div>
      )}

      {/* 基本信息区域 */}
      <div className="ud05-info-section">
        <div className="ud05-info-item">
          <label className="ud05-info-label">Chassis no:</label>
          <span className="ud05-info-value ud05-link" onClick={handleChassisNoClick}>
            {chassisNo || "-"}
          </span>
        </div>
        <div className="ud05-info-item">
          <label className="ud05-info-label">Market:</label>
          <span className="ud05-info-value">{market || "-"}</span>
        </div>
        <div className="ud05-info-item">
          <label className="ud05-info-label">Templateファイル:</label>
          <span className="ud05-info-value ud05-link" onClick={handleTemplateClick}>
            {TEMPLATE_FILENAME}
          </span>
        </div>
      </div>

      {/* DataTable区域 */}
      <div className="ud05-table-section">
        <div className="ud05-button-section">
          <button
            className="ud05-btn ud05-btn-save"
            onClick={handleSaveClick}
            disabled={isLoading || variables.length === 0}
          >
            {isLoading ? "保存中..." : "Save"}
          </button>
        </div>
        <table className="ud05-table">
          <thead>
            <tr>
              <th className="ud05-th">Variable</th>
              <th className="ud05-th">Description</th>
              <th className="ud05-th">Current value</th>
              <th className="ud05-th">Modified value</th>
            </tr>
          </thead>
          <tbody>
            {variables.length > 0 ? (
              variables.map((item, index) => (
                <tr 
                  key={index}
                  className={item.modifiedValue ? "ud05-modified-row" : ""}
                >
                  <td className="ud05-td">{item.variable}</td>
                  <td className="ud05-td">{item.description}</td>
                  <td className="ud05-td">{item.currentValue || ""}</td>
                  <td className="ud05-td">
                    <input
                      type="text"
                      className="ud05-input"
                      value={item.modifiedValue}
                      onChange={(e) => handleModifiedValueChange(index, e.target.value)}
                      disabled={isLoading}
                      maxLength={MAX_MODIFIED_VALUE_LENGTH}
                      placeholder="请输入修改值"
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="ud05-empty">
                  {isLoading ? "加载中..." : "暂无数据"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 按钮区域（移动到表格上方以贴近原始页面样式） */}
    </div>
  );
};

export default UD05_ModifyDocument;
