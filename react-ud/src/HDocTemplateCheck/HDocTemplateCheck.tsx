import React, { useState, useEffect, useRef } from 'react';
import './HDocTemplateCheck.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const HDocTemplateCheck: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [variableCount, setVariableCount] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [isCheckCompleted, setIsCheckCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!window.FileReader) {
      setMessage('Your browser does not support file reading.');
      setMessageType('error');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage('File size too large to read.');
      setMessageType('error');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setMessage('');
    setIsCheckCompleted(false);
    setVariableCount(0);
  };

  const handleCheck = () => {
    if (!selectedFile) {
      setMessage('ERROR: Unable to access file!');
      setMessageType('error');
      return;
    }

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'rtf') {
      setMessage('Only .rtf files are supported.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const regex = /\$([^$]+)\$/g;
        const matches = content.match(regex);

        if (!matches || matches.length === 0) {
          setMessage('ERROR: The file content is incorrect!');
          setMessageType('error');
          setIsCheckCompleted(false);
          setVariableCount(0);
          setIsLoading(false);
          return;
        }

        const count = matches.length;
        setVariableCount(count);
        setMessage(`Check completed. ${count} variable(s) found in template.`);
        setMessageType('success');
        setIsCheckCompleted(true);
        setIsLoading(false);
      } catch {
        setMessage('ERROR: Unable to access file!');
        setMessageType('error');
        setIsCheckCompleted(false);
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setMessage('ERROR: Unable to access file!');
      setMessageType('error');
      setIsCheckCompleted(false);
      setIsLoading(false);
    };

    reader.readAsText(selectedFile);
  };

  const handleDownload = () => {
    if (!selectedFile) {
      setMessage('ERROR: Unable to access file!');
      setMessageType('error');
      return;
    }

    try {
      const url = URL.createObjectURL(selectedFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedFile.name;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setMessage('ERROR: Unable to access file!');
      setMessageType('error');
    }
  };

  return (
    <div className="htc-container">
      <div className="htc-header">
        <h1 className="htc-header-title">HDoc - Template Check</h1>
      </div>

      <div className="htc-content">
        <div className="htc-card">
          {message && (
            <div className={`htc-message htc-message-${messageType}`}>{message}</div>
          )}

          <div className="htc-form-row">
            <div className="htc-field">
              <label className="htc-label">Template File</label>
              <input
                ref={fileInputRef}
                className="htc-file-input"
                type="file"
                onChange={handleFileChange}
                accept=".rtf"
              />
              {selectedFile && (
                <span className="htc-file-name">{selectedFile.name}</span>
              )}
            </div>
            <div className="htc-field htc-field-btn">
              <label className="htc-label">&nbsp;</label>
              <button
                className="htc-btn htc-btn-check"
                onClick={handleCheck}
                disabled={isLoading}
              >
                {isLoading ? 'Checking...' : 'Check'}
              </button>
            </div>
          </div>

          {isCheckCompleted && (
            <div className="htc-result">
              <div className="htc-variable-info">
                Variables found: {variableCount}
              </div>
              <div className="htc-download-link">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDownload();
                  }}
                >
                  Download checked template
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="htc-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="htc-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default HDocTemplateCheck;
