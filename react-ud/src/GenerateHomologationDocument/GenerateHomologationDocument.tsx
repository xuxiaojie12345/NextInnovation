import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Select } from 'antd';
import { z } from 'zod';
import axios from 'axios';
import './GenerateHomologationDocument.css';

interface DocumentType {
  code: string;
  description: string;
}

const GenerateHomologationDocument: React.FC = () => {
  const [chassisSeries, setChassisSeries] = useState<string>('');
  const [chassisNo, setChassisNo] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDocTypesLoading, setIsDocTypesLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  // 使用Zod定义表单校验规则
  const formSchema = z.object({
    chassisSeries: z
      .string()
      .min(1, 'Chassis series, Chassis no and Document type are required.')
      .regex(/^[A-Za-z]{1,5}$/, 'Chassis series must be 1-5 alphabetic characters.'),
    chassisNo: z
      .string()
      .min(1, 'Chassis series, Chassis no and Document type are required.')
      .regex(/^[0-9]{1,10}$/, 'Chassis no must be 1-10 numeric digits.'),
    documentType: z
      .string()
      .min(1, 'Chassis series, Chassis no and Document type are required.'),
  });

  // 执行表单验证
  const validateForm = (): boolean => {
    const result = formSchema.safeParse({
      chassisSeries: chassisSeries.trim(),
      chassisNo: chassisNo.trim(),
      documentType,
    });
    if (!result.success) {
      const firstError = result.error.errors[0];
      setErrorMessage(firstError.message);
      return false;
    }
    return true;
  };

  // 从API获取文档类型列表
  const fetchDocumentTypes = useCallback(async () => {
    setIsDocTypesLoading(true);
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD03SelectHdocdocumentlistApi', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success' && response.data.data?.documentTypes) {
        setDocumentTypes(response.data.data.documentTypes);
      } else {
        setDocumentTypes([]);
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        } else if (error.response.status >= 500) {
          setErrorMessage('System error. Please contact support.');
        } else {
          setErrorMessage('Failed to load document types. Please refresh.');
        }
      } else if (error.request) {
        setErrorMessage('Failed to load document types. Please refresh.');
      } else {
        setErrorMessage('Failed to load document types. Please refresh.');
      }
      setDocumentTypes([]);
    } finally {
      setIsDocTypesLoading(false);
    }
  }, [navigate]);

  // 从localStorage读取上次保存的搜索条件
  const loadSavedConditions = useCallback(() => {
    try {
      const saved = localStorage.getItem('generateHomologationConditions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.chassisSeries) setChassisSeries(parsed.chassisSeries);
        if (parsed.chassisNo) setChassisNo(parsed.chassisNo);
        if (parsed.documentType) setDocumentType(parsed.documentType);
      }
    } catch {
      // 忽略localStorage读写异常
    }
  }, []);

  // 保存搜索条件到localStorage
  const saveConditions = () => {
    try {
      localStorage.setItem(
        'generateHomologationConditions',
        JSON.stringify({
          chassisSeries: chassisSeries.trim(),
          chassisNo: chassisNo.trim(),
          documentType,
        })
      );
    } catch {
      // 忽略localStorage读写异常
    }
  };

  // 组件初始化时加载上次条件和文档类型列表
  useEffect(() => {
    loadSavedConditions();
    fetchDocumentTypes();
  }, [loadSavedConditions, fetchDocumentTypes]);

  // 处理Submit按钮点击事件 — 仅前端校验
  const handleSubmit = () => {
    setErrorMessage('');
    if (!validateForm()) {
      return;
    }
    saveConditions();
    navigate('/generate-document', {
      state: {
        chassisSeries: chassisSeries.trim(),
        chassisNo: chassisNo.trim(),
        documentType,
      },
    });
  };

  // 处理Reset按钮点击事件
  const handleReset = () => {
    setChassisSeries('');
    setChassisNo('');
    setDocumentType('');
    setErrorMessage('');
    try {
      localStorage.removeItem('generateHomologationConditions');
    } catch {
      // 忽略localStorage读写异常
    }
  };

  // 处理Help按钮点击事件
  const handleHelp = () => {
    // 在新窗口中打开HDoc帮助页面
    window.open('/user-guide', '_blank');
  };

  // 处理键盘按键事件支持回车键提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="generate-homologation-container">
      {/* 顶部标题栏 */}
      <div className="gh-header">
        <h1 className="gh-header-title">HDoc - Generate Homologation Document</h1>
      </div>

      {/* 表单内容区域 */}
      <div className="gh-content">
        <div className="gh-form">
          {/* Chassis series 输入框 */}
          <div className="gh-field">
            <label className="gh-label">
              Chassis series <span className="gh-required">*</span>
            </label>
            <Input
              className="gh-input"
              placeholder=""
              value={chassisSeries}
              onChange={(e) => {
                setChassisSeries(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              onKeyDown={handleKeyDown}
              maxLength={5}
            />
          </div>

          {/* Chassis no 输入框 */}
          <div className="gh-field">
            <label className="gh-label">
              Chassis no <span className="gh-required">*</span>
            </label>
            <Input
              className="gh-input"
              placeholder=""
              value={chassisNo}
              onChange={(e) => {
                setChassisNo(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              onKeyDown={handleKeyDown}
              maxLength={10}
            />
          </div>

          {/* Document type 下拉框 */}
          <div className="gh-field">
            <label className="gh-label">
              Document type <span className="gh-required">*</span>
            </label>
            <Select
              className="gh-select"
              placeholder=""
              value={documentType || undefined}
              onChange={(value) => {
                setDocumentType(value);
                if (errorMessage) setErrorMessage('');
              }}
              disabled={isDocTypesLoading}
              loading={isDocTypesLoading}
              options={documentTypes.map((dt) => ({
                value: dt.code,
                label: dt.description,
              }))}
              notFoundContent={isDocTypesLoading ? 'Loading...' : 'No data'}
            />
          </div>

          {/* 错误消息显示区域 */}
          {errorMessage && (
            <div className="gh-error-message">{errorMessage}</div>
          )}

          {/* 按钮区域 */}
          <div className="gh-buttons">
            <Button
              type="primary"
              className="gh-button gh-button-submit"
              onClick={handleSubmit}
            >
              Submit
            </Button>
            <Button
              className="gh-button gh-button-reset"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              className="gh-button gh-button-help"
              onClick={handleHelp}
            >
              Help
            </Button>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <div className="gh-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="gh-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default GenerateHomologationDocument;
