/**
 * MarketDocumentSettingsList 组件 - 市场文档设置列表页面（UD20）
 * 功能：以表格形式展示文档列表，支持RadioBox单选、Select返回、Print打印、User链接跳转
 * 对应详细设计：详细设计/詳細設計UD20.md
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../config/api";
import "./MarketDocumentSettingsList.css";

/** 文档列表项数据类型 */
interface DocumentListItem {
  documentType: string;
  bussinesUnit: string;
  user: string;
  date: string;
}

/**
 * MarketDocumentSettingsList 组件
 * 展示文档列表，支持单选、选择返回、打印、User链接查看等功能
 */
const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // -------- 状态管理（对应详细设计 2.1 控件属性表）--------
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [printTime, setPrintTime] = useState<string>("");

  /** 清空消息 */
  const clearMessage = () => setMessage("");

  /**
   * 页面初始化 - 获取文档列表（对应详细设计 3.1.1 页面初始化流程）
   * 调用 UD20SelectHdocDocumentList（GET /api/ud20/marketdocumentsettings）
   * 从URL参数中获取检索条件 documentType
   */
  useEffect(() => {
    const fetchDocumentList = async () => {
      setIsLoading(true);
      try {
        // 从URL参数中获取检索条件
        const params = new URLSearchParams(location.search);
        const documentType = params.get("documentType") || "";
        const userField = params.get("user") || "";
        const dateField = params.get("date") || "";
        const documentTypeOp = params.get("documentTypeOp") || "=";
        const userOp = params.get("userOp") || "=";
        const dateOp = params.get("dateOp") || "=";

        const response = await api.get(
          `/api/ud20/marketdocumentsettings`,
          { params: {
            documentType: documentType || undefined,
            documentTypeOp: documentTypeOp,
            user: userField || undefined,
            userOp: userOp,
            date: dateField || undefined,
            dateOp: dateOp
          } }
        );

        if (response.data.code === 200 && Array.isArray(response.data.data)) {
          // 标准化列名（后端返回的列名大小写不确定）
          const list = response.data.data.map((item: Record<string, any>) => ({
            documentType: item.DOCTYPE || item.doctype || item.documentType || "",
            user: item.UPDATE_USER || item.update_user || item.user || "",
            date: (item.REGISTER_DATETIME || item.register_datetime || item.UPDATE_DATETIME || item.update_datetime || item.date || "").split(' ')[0].split('T')[0]
          }));

          // 按日期降序排序（对应详细设计 6. 实现注意事项 - 排序）
          list.sort((a: DocumentListItem, b: DocumentListItem) => {
            return b.date.localeCompare(a.date);
          });

          setDocuments(list);

          if (list.length === 0) {
            // 对应详细设计 3.2 No.2 - 无数据
            setMessage("No data found");
            setMessageType("error");
          }
        } else {
          setMessage("No data found");
          setMessageType("error");
        }
      } catch (err) {
        setMessage("网络连接失败，请检查网络设置");
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentList();
  }, []);

  /**
   * 处理 RadioBox 选择变化（对应详细设计 2.1 - RadioBox单选模式）
   */
  const handleRadioChange = (index: number) => {
    setSelectedIndex(index);
    if (message) clearMessage();
  };

  /**
   * Select 按钮处理（对应详细设计 3.1.2 Select操作流程）
   * 校验是否有选中记录，将数据返回前画面
   */
  const handleSelect = () => {
    clearMessage();

    // 前端校验（对应详细设计 3.2 No.1）
    if (selectedIndex === null) {
      setMessage("No data found");
      setMessageType("error");
      return;
    }

    const selected = documents[selectedIndex];
    // 将选中数据带回前画面（MarketDocumentSettings）
    navigate("/Menu/MarketDocumentSettings", {
      state: {
        selectedData: {
          documentType: selected.documentType,
          bussinesUnit: selected.bussinesUnit,
          user: selected.user,
          date: selected.date
        }
      }
    });
  };

  /**
   * Back 按钮处理（对应详细设计 3.1.3 Back操作流程）
   * 返回前画面，不携带任何数据
   */
  const handleBack = () => {
    clearMessage();
    navigate("/Menu/MarketDocumentSettings");
  };

  /**
   * Print 按钮处理（对应详细设计 3.1.4 Print操作流程）
   * 调用浏览器打印功能
   */
  const handlePrint = () => {
    clearMessage();
    try {
      const now = new Date();
      setPrintTime(now.toLocaleString());
      // 延迟执行打印，确保打印时间已渲染
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (err) {
      setMessage("打印功能不可用");
      setMessageType("error");
    }
  };

  /**
   * User 链接点击处理（对应详细设计 3.1.5 User链接点击流程）
   * 打开新窗口跳转到EDB用户查看画面
   */
  const handleUserClick = (userId: string) => {
    if (!userId || userId === "-") return;
    window.open(`/Menu/EDBUserView?userId=${encodeURIComponent(userId)}`, "_blank");
  };

  return (
    <div className="ud20-container">
      {/* 页面标题 */}
      <h1 className="ud20-title">Market Document Settings</h1>

      {/* 工具栏按钮组 */}
      <div className="ud20-btn-group">
        <button type="button" className="action-button" onClick={handleSelect} disabled={isLoading}>Select</button>
        <button type="button" className="action-button" onClick={handleBack} disabled={isLoading}>Back</button>
        <button type="button" className="action-button" onClick={handlePrint} disabled={isLoading}>Print</button>
      </div>

      {/* 消息提示（对应详细设计 5. 异常处理） */}
      {message && (
        <div className={`ud20-message ${messageType === "error" ? "error" : "success"}`}>{message}</div>
      )}

      {isLoading && <div className="ud20-loading">Loading...</div>}

      {/* 数据表格区域（对应详细设计 2.1 DataTable） */}
      {!isLoading && (
        <div className="ud20-table-section">
          <div className="ud20-table-wrapper">
            <table className="ud20-table">
              <thead>
                <tr>
                  <th className="ud20-th-radio"></th>
                  <th>Document type</th>
                  <th>Bussines unit</th>
                  <th>User</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((doc, index) => (
                    <tr
                      key={index}
                      className={selectedIndex === index ? "ud20-row-selected" : ""}
                      onClick={() => handleRadioChange(index)}
                    >
                      <td className="ud20-td-radio">
                        <input
                          type="radio"
                          name="docSelect"
                          className="ud20-radio"
                          checked={selectedIndex === index}
                          onChange={() => handleRadioChange(index)}
                        />
                      </td>
                      <td>{doc.documentType}</td>
                      <td>BU</td>
                      <td>
                        {doc.user && doc.user !== "-" ? (
                          <span
                            className="ud20-user-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(doc.user);
                            }}
                          >
                            {doc.user}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{doc.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="ud20-empty-row">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 打印时间戳（对应详细设计 3.1.4 - 打印时显示） */}
      {printTime && (
        <div className="ud20-print-timestamp">
          Print Date: {printTime}
        </div>
      )}
    </div>
  );
};

export default MarketDocumentSettingsList;
