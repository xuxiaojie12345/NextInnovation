package com.web.app.service;

import com.web.app.dto.ApiResult;
import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;

/**
 * 生成认证文档服务接口
 * 对应【詳細設計UD03.md（Generate Homologation Document 模块）】的业务逻辑层定义。
 *
 * @author GitHub Copilot
 */
public interface GenerateDocumentService {

  /**
   * 查询 Document type 下拉列表选项
   * 业务逻辑（详细设计 2.1 控件 3 / 测试用例 3）：
   * 1. 查询 HDOC_DOCUMENT_LIST 的 DOCTYPE 与 DESCRIPTION
   * 2. 转换为下拉列表选项集合
   * 3. 无数据时返回空列表（画面侧下拉列表不显示任何选项）
   *
   * @return 统一格式的文档类型选项响应
   */
  ApiResult<GenerateDocumentResponse> getDocumentTypes();

  /**
   * 校验并接受生成认证文档的检索条件
   * 业务逻辑（详细设计 3.1.1 Submit / 测试用例 12、16、17）：
   * 1. Chassis series / Chassis no / Document type 非空校验
   * 2. Chassis series 仅允许半角英字且不超过 5 位
   * 3. Chassis no 仅允许半角数字且不超过 10 位
   * 4. 校验通过后返回去除首尾空格的条件值，供后续画面使用
   *
   * @param request 检索条件请求对象
   * @return 统一格式的条件校验响应
   */
  ApiResult<GenerateDocumentResponse> submitCondition(GenerateDocumentRequest request);
}
