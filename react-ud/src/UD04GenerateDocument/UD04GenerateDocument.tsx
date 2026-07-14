import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UD04GenerateDocument.css";

interface DocumentData {
  serie: string; // Chassis series
  chnr: string; // Chassis no
  spec: string; // Spec week
  ordernumber: string; // Ordernumber
  build: string; // Build week
  customerAdap: string; // S-Note NO
  countryOfOperation: string; // Market
  loadIndex: string; // Load Index
  act: string; // ADCA变更状态 (Y/N)
  variable: string; // Replacing parameters
  newval: string; // New value
  template: string; // Using template
  generatedFilePath: string; // Generated document path
  serverTime: string; // Server time
  programVersion: string; // Program version
}

const GenerateDocument: React.FC = () => {
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [chassisNo, setChassisNo] = useState("");

  // 页面初始化：获取底盘号并调用API
  useEffect(() => {
    fetchDocumentData();
  }, []);

  // 获取文档数据
  const fetchDocumentData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 从URL参数或localStorage获取底盘号
      const urlParams = new URLSearchParams(window.location.search);
      let fullChassisNo = urlParams.get("chassisNo");

      if (!fullChassisNo) {
        // 尝试从localStorage获取
        const lastSearchConditions = localStorage.getItem(
          "lastSearchConditions",
        );
        if (lastSearchConditions) {
          const conditions = JSON.parse(lastSearchConditions);
          // 合并 chassisSeries 和 chassisNo
          const series = conditions.chassisSeries || "";
          const no = conditions.chassisNo || "";
          fullChassisNo = `${series}${no}`;
        }
      }

      if (!fullChassisNo) {
        setErrorMessage("Chassis number is required.");
        setIsLoading(false);
        return;
      }

      // 设置完整的底盘号到 Chassis no 字段
      setChassisNo(fullChassisNo);

      // 拆分完整的底盘号为 Chassis series 和 Chassis no
      // 假设 Chassis series 是前4个字符，Chassis no 是剩余部分
      const chassisSeries = fullChassisNo.substring(0, 4);
      const chassisNoPart = fullChassisNo.substring(4);

      // 调用UD04 API（分开传递两个参数）
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";
      const response = await fetch(
        `${API_BASE_URL}/api/UD04/selectGeneratedocument?chassisSeries=${encodeURIComponent(chassisSeries)}&chassisNo=${encodeURIComponent(chassisNoPart)}`,
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

      if (data.code === 200 && data.data) {
        setDocumentData(data.data);
      } else {
        throw new Error(data.msg || "Failed to load document data");
      }
    } catch (error) {
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

  // 处理文档下载
  const handleDownloadDocument = async () => {
    if (!documentData?.generatedFilePath) {
      setErrorMessage("Document file not found");
      return;
    }

    try {
      // 使用 fetch 获取文件内容
      const response = await fetch(documentData.generatedFilePath);
      if (!response.ok) {
        throw new Error("File download failed");
      }
      const blob = await response.blob();
      // 创建 blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // 触发文件下载
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `VIN_PLATE_${documentData.chnr}.trf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 释放 blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setErrorMessage("Document file not found");
    }
  };

  // 跳转到Modify Document页面
  const handleModifyDocument = () => {
    if (documentData?.act === "Y") {
      // 使用完整的底盘号（serie + chnr）
      const fullChassisNo = `${documentData.serie || ""}${documentData.chnr || ""}`;

      // 获取market値（从UD04返回的countryOfOperation字段）
      const market = documentData.countryOfOperation || "";
      // 传递chassisNo和market参数
      navigate(
        `/modify-document?chassisNo=${encodeURIComponent(fullChassisNo)}&market=${encodeURIComponent(market)}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="gd-container">
        <div className="gd-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="gd-container">
      {/* 主内容区域 - 带边框的容器 */}
      <div className="gd-main-content">
        {/* 标题区域 */}
        <div className="gd-header">
          <h1 className="gd-title">Generate document</h1>
        </div>

        {/* 错误消息显示 */}
        {errorMessage && <div className="gd-error-message">{errorMessage}</div>}

        {/* Chassis no - 可点击的链接 */}
        <div className="gd-info-group">
          <span className="gd-label chassis-no-label">Chassis no:</span>
          <span className="gd-value">
            {chassisNo.substring(0, 4)}
            <span
              onClick={() => {
                if (chassisNo && chassisNo !== "-") {
                  navigate(
                    `/vehicle-specification?chassisNo=${encodeURIComponent(chassisNo)}`,
                  );
                }
              }}
              className="gd-link"
              style={{
                cursor: "pointer",
                color: "#0000ff",
                textDecoration: "underline",
              }}
            >
              {chassisNo.substring(4)}
            </span>
          </span>
          {/* Ordernumber */}
          <div className="gd-info-group">
            <span className="gd-label">Ordernumber:</span>
            <span className="gd-value">{documentData?.ordernumber || "-"}</span>
          </div>

          {/* Build week */}
          <div className="gd-info-group">
            <span className="gd-label">Build week:</span>
            <span className="gd-value">{documentData?.build || "-"}</span>
          </div>

          {/* Spec week */}
          <div className="gd-info-group">
            <span className="gd-label">Spec week:</span>
            <span className="gd-value">{documentData?.spec || "-"}</span>
          </div>

          {/* Market */}
          <div className="gd-info-group">
            <span className="gd-label">Market:</span>
            <span className="gd-value">
              {documentData?.countryOfOperation || "-"}
            </span>
          </div>

          {/* Master Market */}
          <div className="gd-info-group">
            <span className="gd-label">Master Market:</span>
            <span className="gd-value">-EU</span>
          </div>

          {/* S-Note NO */}
          <div className="gd-info-group gd-snote-section">
            <div className="gd-snote-no">
              {documentData?.customerAdap || "-"}
            </div>
          </div>

          {/* S-Note Message - 红色显示 */}
          {documentData?.customerAdap && documentData.customerAdap !== "-" && (
            <div className="gd-info-group gd-snote-message">
              The S-Notes above can affect homologation documents.
            </div>
          )}

          {/* Load Index */}
          <div className="gd-info-group">
            <span className="gd-label">Load index:</span>
            <span className="gd-value">{documentData?.loadIndex || "-"}</span>
          </div>

          {/* Analyze Rulesリンク */}
          <div className="gd-info-group">
            <span className="gd-link">Analyze Rules</span>
          </div>

          {/* ADCA变更提示 - 红色可点击リンク */}
          {documentData?.act === "Y" && (
            <div className="gd-info-group">
              <span
                className="gd-link gd-adca-warning-link"
                onClick={handleModifyDocument}
              >
                After def change detected. Document need to be modified.
              </span>
            </div>
          )}

          {/* Using template */}
          <div className="gd-info-group">
            <span className="gd-label">Using template:</span>
            <span className="gd-value">{documentData?.template || "-"}</span>
          </div>

          {/* Replacing parameters */}
          {documentData?.variable && documentData.variable !== "-" && (
            <div className="gd-info-group gd-replacing-params">
              <div className="gd-param-label">Replacing parameters</div>
              <div className="gd-param-value">
                {documentData.variable}: {documentData.newval}
              </div>
            </div>
          )}

          {/* Generated documentリンク */}
          <div className="gd-info-group">
            <span
              className="gd-link gd-download-link"
              onClick={handleDownloadDocument}
            >
              Generated document
            </span>
          </div>

          {/* 底部情報区域 - 在边框容器内 */}
          <div className="gd-footer">
            <div className="gd-info-group">
              <span className="gd-label">Date:</span>
              <span className="gd-value">
                {documentData?.serverTime || "-"}
              </span>
            </div>

            <div className="gd-info-group">
              <span className="gd-label">HDoc version:</span>
              <span className="gd-value">
                {documentData?.programVersion || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateDocument;
