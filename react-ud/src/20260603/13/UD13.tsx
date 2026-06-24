import React, { useState, useCallback } from "react";
import "./UD13.css";

const UD13 = React.memo(() => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [variableCount, setVariableCount] = useState<number>(0);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setSelectedFile(file);
      setErrorMessage("");
      setSuccessMessage("");
      setDownloadUrl("");
      setVariableCount(0);
    },
    [],
  );

  const extractVariables = (content: string): string[] => {
    const regex = /\$([^$]+)\$/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const varName = match[1].trim();
      if (varName) {
        variables.push(`$${varName}$`);
      }
    }
    return variables;
  };

  const handleCheck = useCallback(async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setDownloadUrl("");

    if (!selectedFile) {
      setErrorMessage("ERROR: Unable to access file!");
      return;
    }

    setIsLoading(true);

    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () =>
          reject(new Error("ERROR: Unable to access file!"));
        reader.readAsText(selectedFile);
      });

      const variables = extractVariables(content);

      if (variables.length === 0) {
        setErrorMessage("ERROR: The file content is incorrect!");
        setIsLoading(false);
        return;
      }

      setVariableCount(variables.length);
      setSuccessMessage("校验完成");
      setDownloadUrl(URL.createObjectURL(selectedFile));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "ERROR: Unable to access file!";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleDownload = useCallback(() => {
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "checked_template.rtf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [downloadUrl]);

  return (
    <div className="ud13-container">
      <main className="ud13-main">
        <div className="ud13-card">
          <h1 className="ud13-page-title">HDoc Template Check</h1>

          {errorMessage && (
            <div className="ud13-message ud13-error" role="alert">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="ud13-message ud13-success">{successMessage}</div>
          )}

          {/* Template File */}
          <div className="ud13-section">
            <div className="ud13-field-row">
              <label className="ud13-label">Template File</label>
              <input
                id="ud13-file-input"
                type="file"
                onChange={handleFileChange}
              />
            </div>
            <div className="ud13-field-row ud13-field-row-button">
              <label className="ud13-label"></label>
              <button
                className="ud13-btn"
                onClick={handleCheck}
                disabled={isLoading}
              >
                {isLoading ? "Checking..." : "Check"}
              </button>
            </div>
          </div>

          {/* Result Section */}
          {successMessage && variableCount > 0 && (
            <div className="ud13-result-box">
              <span
                className="ud13-download-link"
                role="button"
                tabIndex={0}
                onClick={handleDownload}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleDownload();
                }}
              >
                Download checked template
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD13;
