import React, { useState } from 'react';
import './HdocTemplateCheck.css';

/**
 * HdocTemplateCheck组件 - RTF模板校验页面
 * 
 * @description 对.rtf格式的模板文件进行预检查，验证文件中是否包含正确的变量定义（以$符号包裹的变量），并生成检查结果供用户下载
 * @props 无Props
 */
const HdocTemplateCheck: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checkResult, setCheckResult] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCheckPassed, setIsCheckPassed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 处理文件选择
   * 
   * @param e 文件选择事件
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    // 清空之前的错误信息和检查结果
    setErrorMessage('');
    setCheckResult('');
    setIsCheckPassed(false);
  };

  /**
   * Check按钮点击处理 - 执行模板校验操作
   * 对应设计书 3.1 HDoc Template Check 和 4.1.1 画面的HDoc Template Check区域选择文档时
   */
  const handleCheckClick = async () => {
    // 校验1：Template File未选择文件 (对应设计书 4.2 校验详细规格表 No.1)
    if (!selectedFile) {
      setErrorMessage('ERROR: Unable to access file!');
      setIsCheckPassed(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setCheckResult('');
    setIsCheckPassed(false);

    try {
      // 使用FileReader读取文件内容
      const fileContent = await readFileContent(selectedFile);
      
      // 获取$之间的内容，计数变量的个数 (对应设计书 7. 实现注意事项)
      const variables = extractVariables(fileContent);
      
      // 校验2：文件中变量不存在 (对应设计书 4.2 校验详细规格表 No.2)
      if (variables.length === 0) {
        setErrorMessage('ERROR: The file content is incorrect!');
        setIsCheckPassed(false);
        return;
      }
      
      // 校验通过，生成检查结果 (对应设计书 4.2 校验详细规格表 No.3)
      const resultText = generateCheckResult(variables);
      setCheckResult(resultText);
      setIsCheckPassed(true);
    } catch (error: any) {
      console.error('校验失败:', error);
      setErrorMessage(error.message || '校验过程中发生错误');
      setIsCheckPassed(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 读取文件内容
   * 
   * @param file 要读取的文件
   * @returns 文件内容字符串
   */
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsText(file);
    });
  };

  /**
   * 提取文件中的变量（以$符号包裹的内容）
   * 对应设计书 7. 实现注意事项 - 使用正则表达式匹配所有以$符号包裹的变量
   * 
   * @param content 文件内容
   * @returns 变量数组
   */
  const extractVariables = (content: string): string[] => {
    // 使用正则表达式 /\$\w+\$/g 匹配所有以$符号包裹的变量
    const regex = /\$\w+\$/g;
    const matches = content.match(regex);
    return matches ? Array.from(new Set(matches)) : []; // 去重
  };

  /**
   * 生成检查结果文本
   * 
   * @param variables 变量数组
   * @returns 检查结果文本
   */
  const generateCheckResult = (variables: string[]): string => {
    let result = `=== RTF Template Check Result ===\n\n`;
    result += `Total Variables Found: ${variables.length}\n\n`;
    result += `Variable List:\n`;
    result += `${'='.repeat(30)}\n`;
    
    variables.forEach((variable, index) => {
      result += `${index + 1}. ${variable}\n`;
    });
    
    result += `\n${'='.repeat(30)}\n`;
    result += `Check Status: PASSED\n`;
    result += `Check Date: ${new Date().toLocaleString()}\n`;
    
    return result;
  };

  /**
   * Download checked template链接点击处理 - 下载检查结果文件
   * 对应设计书 3.2 Download Checked template 和 7. 实现注意事项 - 结果下载
   */
  const handleDownloadClick = () => {
    if (!checkResult) {
      alert('没有可下载的检查结果');
      return;
    }
    
    // 将检查结果转换为Blob
    const blob = new Blob([checkResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_check_result_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放URL对象
    URL.revokeObjectURL(url);
  };

  return (
    <div className='htc-container'>
      <div className='htc-content'>
        {/* HDoc Template Check区域 */}
        <div className='htc-section'>
          <h2 className='htc-section-title'>HDoc Template Check</h2>
          <div className='htc-section-solid'>

          <div className='htc-form-group'>
            <label className='htc-label'>Template File:</label>
            <input 
              type='file' 
              id='htc-template-file-input'
              className='htc-file-input' 
              onChange={handleFileChange}
              accept='.rtf,.txt'
            />
            {/* <span className='htc-file-status'>
              {selectedFile ? 'ファイルを選択' : '選択されていません'}
            </span> */}
          </div>
          
          <div className='htc-button-row'>
            <button 
              className='htc-action-button' 
              onClick={handleCheckClick}
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Check'}
            </button>
          </div>
          </div>
        </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='htc-error-message'>
            {errorMessage}
          </div>
        )}
        
        {/* Download checked template链接 */}
        {isCheckPassed && (
          <div className='htc-download-section'>
            <a 
              href='#' 
              className='htc-download-link'
              onClick={(e) => {
                e.preventDefault();
                handleDownloadClick();
              }}
            >
              Download checked template
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HdocTemplateCheck;
