import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./MarketDocumentSettingsList.css";

interface DocumentItem {
  doctype: string;
  description?: string;
  registerUser: string;
  registerDatetime: string;
}

const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 从state中获取前画面传递的搜索条件
  const searchCriteria = (location.state as any)?.searchCriteria || {};

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 页面初始化：调用API获取文档列表
  useEffect(() => {
    fetchDocumentList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 调用UD20 API获取文档列表
  const fetchDocumentList = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const response = await fetch(`${API_BASE_URL}/api/ud20/getdocumentlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentType: searchCriteria.documentType || "",
          operator: searchCriteria.operator || "=",
        }),
      });

      if (!response.ok) {
        throw new Error("No data found");
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        setDocuments(result.data);
      } else {
        setDocuments([]);
        setErrorMessage("No data found");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "No data found");
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理单选选择
  const handleRadioChange = (index: number) => {
    setSelectedIndex(index);
  };

  // 点击Select按钮：返回前画面并填充选中记录
  const handleSelect = () => {
    if (selectedIndex === null) {
      setErrorMessage("No data found");
      return;
    }

    const selectedDocument = documents[selectedIndex];

    // 将选中记录的数据保存到state，返回到MarketDocumentSettings画面
    navigate("/market-document-settings", {
      state: {
        selectedDocument: {
          documentType: selectedDocument.doctype,
          bussinesUnit: "BU",
          user: selectedDocument.registerUser,
          date: selectedDocument.registerDatetime,
        },
        isFromSelection: true,
      },
    });
  };

  // 点击Back按钮：返回到MarketDocumentSettings画面
  const handleBack = () => {
    navigate("/market-document-settings");
  };

  // 点击Print按钮：打印当前页面
  const handlePrint = () => {
    window.print();
  };

  // 点击User链接：跳转到EDB User View页面，传递user值
  const handleUserClick = (username: string) => {
    if (!username || username === "-") {
      return;
    }
    navigate(`/edb-user-view/${encodeURIComponent(username)}`, {
      state: { userid: username },
    });
  };

  return (
    <div className='mdsl-container'>
      {/* 标题 */}
      <h1 className='mdsl-title'>HDoc - Market Document Settings</h1>

      {/* 错误消息 */}
      {errorMessage && <div className='mdsl-error-message'>{errorMessage}</div>}

      {/* 边框容器 */}
      <div className='mdsl-border-box'>
        {/* 按钮区域 */}
        <div className='mdsl-button-bar'>
          <button
            className='mdsl-btn'
            onClick={handleSelect}
            disabled={isLoading}
          >
            Select
          </button>
          <button
            className='mdsl-btn'
            onClick={handleBack}
            disabled={isLoading}
          >
            Back
          </button>
          <button
            className='mdsl-btn'
            onClick={handlePrint}
            disabled={isLoading}
          >
            Print
          </button>
        </div>

        {/* 数据表格 */}
        <div className='mdsl-table-container'>
          {isLoading ? (
            <div className='mdsl-loading'>Loading...</div>
          ) : (
            <table className='mdsl-table'>
              <thead>
                <tr>
                  <th className='mdsl-radio-col'></th>
                  <th className='mdsl-th'>Document type</th>
                  <th className='mdsl-th'>Bussines unit</th>
                  <th className='mdsl-th'>User</th>
                  <th className='mdsl-th'>Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='mdsl-no-data'>
                      No records found
                    </td>
                  </tr>
                ) : (
                  documents.map((item, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0 ? "mdsl-row-even" : "mdsl-row-odd"
                      }
                    >
                      <td className='mdsl-radio-col'>
                        <input
                          type='radio'
                          name='document-radio'
                          checked={selectedIndex === index}
                          onChange={() => handleRadioChange(index)}
                        />
                      </td>
                      <td className='mdsl-td'>{item.doctype}</td>
                      <td className='mdsl-td'>VBC</td>
                      <td className='mdsl-td mdsl-link'>
                        {item.registerUser && item.registerUser !== "-" ? (
                          <button
                            className='link-button'
                            onClick={() => handleUserClick(item.registerUser)}
                          >
                            {item.registerUser}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className='mdsl-td'>{item.registerDatetime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketDocumentSettingsList;
