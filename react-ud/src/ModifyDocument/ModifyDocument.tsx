// ModifyDocument.tsx - UD05模块
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ModifyDocument.css";

interface VariableData {
  variable: string;
  description: string;
  currentValue: string;
  modifiedValue: string;
}

const ModifyDocument = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chassisNo, setChassisNo] = useState("");
  const [market, setMarket] = useState("");
  const [template, setTemplate] = useState("");
  const [variables, setVariables] = useState<VariableData[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [documentData, setDocumentData] = useState<any>(null); // 存储从UD04获取的文档数据，包含generatedFilePath

  // 页面初始化：获取底盘号和market参数并加载数据
  useEffect(() => {
    const chassisNoParam = searchParams.get("chassisNo");
    const marketParam = searchParams.get("market");

    if (chassisNoParam) {
      setChassisNo(chassisNoParam);

      // 如果URL中有market参数，直接使用；否则从API获取
      if (marketParam) {
        setMarket(marketParam);
        console.log("Market value from URL:", marketParam);
      }

      fetchDocumentData(chassisNoParam, marketParam || "");
    } else {
      setErrorMessage("Chassis number is required.");
      setIsLoading(false);
    }
  }, [searchParams]);

  // 获取文档数据
  const fetchDocumentData = async (chassisNo: string, marketFromUrl: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 拆分完整的底盘号为 Chassis series 和 Chassis no
      const chassisSeries = chassisNo.substring(0, 4);
      const chassisNoPart = chassisNo.substring(4);

      console.log("Full chassis number:", chassisNo);
      console.log("Chassis series:", chassisSeries);
      console.log("Chassis no part:", chassisNoPart);
      console.log("Market from URL:", marketFromUrl);

      const API_BASE_URL = "http://localhost:8081";

      // 先调用UD04 API获取generatedFilePath（用于下载template）
      console.log("Fetching document data from UD04...");
      const ud04Response = await fetch(
        `${API_BASE_URL}/api/UD04/selectGeneratedocument?chassisSeries=${encodeURIComponent(chassisSeries)}&chassisNo=${encodeURIComponent(chassisNoPart)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (ud04Response.ok) {
        const ud04Data = await ud04Response.json();
        if (ud04Data.code === 200 && ud04Data.data) {
          setDocumentData(ud04Data.data);
          console.log("UD04 data loaded, generatedFilePath:", ud04Data.data.generatedFilePath);
        }
      } else {
        console.warn("Failed to fetch UD04 data, template download may not work");
      }

      // 调用UD05 API - 初期表示（只获取variables，不获取market和template）
      console.log("Fetching variables from UD05...");
      const response = await fetch(
        `${API_BASE_URL}/api/UD05/modifyDocumentUnit?chassisSeries=${encodeURIComponent(chassisSeries)}&chassisNo=${encodeURIComponent(chassisNoPart)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Chassis not found");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("UD05 API response:", data);

      if (data.code === 200 && data.data) {
        // 使用从URL传递过来的market值，而不是从后端获取
        if (marketFromUrl) {
          setMarket(marketFromUrl);
        } else {
          // 如果URL中没有market，则使用后端返回的值或默认值
          setMarket(data.data.market || "-");
        }

        setTemplate(data.data.template || "-");

        // 将后端返回的newval字段映射为modifiedValue
        const variablesWithModifiedValue = (data.data.variables || []).map(
          (v: any) => ({
            variable: v.variable,
            description: v.description,
            currentValue: v.currentValue || v.newval || "",
            modifiedValue: "", // 初始化为空，用户输入新值
          }),
        );

        setVariables(variablesWithModifiedValue);
      } else {
        throw new Error(data.msg || "Failed to load document data");
      }
    } catch (error) {
      console.error("Fetch document data error:", error);
      if (error instanceof Error) {
        if (error.message === "Chassis not found") {
          setErrorMessage("Chassis not found");
        } else {
          setErrorMessage("System error. Please contact administrator.");
        }
      } else {
        setErrorMessage("System error. Please contact administrator.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理Modified value输入变化
  const handleModifiedValueChange = (index: number, value: string) => {
    setVariables((prevVariables) =>
      prevVariables.map((variable, i) =>
        i === index ? { ...variable, modifiedValue: value } : variable,
      ),
    );
  };

  // Save按钮处理
  const handleSave = async () => {
    // 验证是否有修改的值
    const hasModifiedValues = variables.some(
      (v) => v.modifiedValue && v.modifiedValue.trim() !== "",
    );

    if (!hasModifiedValues) {
      setErrorMessage("NO UNRELEASED VERSION EXISTS!");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // 拆分完整的底盘号为 Chassis series 和 Chassis no
      const chassisSeries = chassisNo.substring(0, 4);
      const chassisNoPart = chassisNo.substring(4);

      // 构建请求体
      const requestBody = {
        chassisSeries: chassisSeries,
        chassisNo: chassisNoPart,
        updateUser: "CURRENT_USER", // TODO: 从用户会话中获取
        variables: variables
          .filter((v) => v.modifiedValue && v.modifiedValue.trim() !== "")
          .map((v) => ({
            variable: v.variable,
            newval: v.modifiedValue,
          })),
      };

      console.log("Save request body:", requestBody);

      const API_BASE_URL = "http://localhost:8081";
      const response = await fetch(
        `${API_BASE_URL}/api/UD05/modifyDocumentSave`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Save response:", data);

      if (data.code === 200) {
        alert("Document updated successfully!");
        
        // 拆分完整的底盘号为 Chassis series 和 Chassis no
        const chassisSeries = chassisNo.substring(0, 4);
        const chassisNoPart = chassisNo.substring(4);
        
        console.log("Navigating to Save Modifications with:");
        console.log("  Chassis serie:", chassisSeries);
        console.log("  Chassis number:", chassisNoPart);
        
        // 跳转到UD06 Save Modifications页面，传递Chassis serie和Chassis number参数
        navigate(
          `/save-modifications?chassisSerie=${encodeURIComponent(chassisSeries)}&chassisNumber=${encodeURIComponent(chassisNoPart)}`,
        );
      } else {
        throw new Error(data.msg || "Failed to update document");
      }
    } catch (error) {
      console.error("Save error:", error);
      setErrorMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel按钮处理
  const handleCancel = () => {
    // 返回到Generate Document页面
    navigate(`/generate-document?chassisNo=${encodeURIComponent(chassisNo)}`);
  };

  // Template链接点击处理 - 下载Vin Plate的.trf文件
  const handleDownloadTemplate = () => {
    if (!documentData?.generatedFilePath) {
      setErrorMessage("Document file not found. Please try again later.");
      console.error("No generatedFilePath available in documentData");
      return;
    }

    // 触发文件下载
    const link = document.createElement("a");
    link.href = documentData.generatedFilePath;
    link.download = `VIN_PLATE_${chassisNo}.trf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Downloading template file:", documentData.generatedFilePath);
    console.log("Downloaded filename:", `VIN_PLATE_${chassisNo}.trf`);
  };

  if (isLoading) {
    return (
      <div className='md-container'>
        <div className='md-loading'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='md-container'>
      {/* 标题区域 */}
      <div className='md-header'>
        <h1 className='md-title'>Modify Document</h1>
      </div>

      {/* 基本信息区域 */}
      <div className='md-info-section'>
        <div className='md-info-group'>
          <span className='md-label'>Chassis no:</span>
          <span className='md-value md-chassis-no'>
            {chassisNo.substring(0, 4)}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault(); // 阻止默认行为
                if (chassisNo && chassisNo !== "-") {
                  console.log("Navigating to Vehicle Specification with chassis no:", chassisNo);
                  navigate(`/vehicle-specification?chassisNo=${encodeURIComponent(chassisNo)}`);
                }
              }}
              className='md-link'
              style={{ cursor: 'pointer', color: '#0000ff', textDecoration: 'underline' }}
            >
              {chassisNo.substring(4)}
            </a>
          </span>
        </div>
        <div className='md-info-group'>
          <span className='md-label'>Market:</span>
          <span className='md-value'>{market}</span>
        </div>
        <div className='md-info-group'>
          <span className='md-label'>Template:</span>
          <a href='#' className='md-link' onClick={handleDownloadTemplate}>
            {template}
          </a>
        </div>
      </div>

      {/* 错误消息显示 */}
      {errorMessage && <div className='md-error-message'>{errorMessage}</div>}

      {/* 表格区域 */}
      <div className='md-table-container'>
        {/* Save按钮 */}
        <div className='md-button-bar'>
          <button
            type='button'
            onClick={handleSave}
            disabled={isLoading}
            className='md-save-btn'
          >
            Save
          </button>
        </div>

        {/* 数据表格 */}
        <table className='md-table'>
          <thead>
            <tr>
              <th className='md-th'>Variable</th>
              <th className='md-th'>Description</th>
              <th className='md-th'>Current value</th>
              <th className='md-th'>Modified value</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "md-tr-even" : "md-tr-odd"}
              >
                <td className='md-td'>{variable.variable}</td>
                <td className='md-td'>{variable.description}</td>
                <td className='md-td'>{variable.currentValue}</td>
                <td className='md-td'>
                  <input
                    type='text'
                    value={variable.modifiedValue}
                    onChange={(e) =>
                      handleModifiedValueChange(index, e.target.value)
                    }
                    className='md-input'
                    placeholder=''
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModifyDocument;
