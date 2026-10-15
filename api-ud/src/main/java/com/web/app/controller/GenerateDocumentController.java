package com.web.app.controller;

import com.web.app.dto.ApiResult;
import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;
import com.web.app.service.GenerateDocumentService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 生成认证文档控制器
 * 对应【詳細設計UD03.md（Generate Homologation Document 模块）】：
 *  - 2.1 控件 3：Document type 下拉列表数据源（HDOC_DOCUMENT_LIST.DOCTYPE）
 *  - 3.1.1 Submit：检索条件的前后端校验
 *
 * @author GitHub Copilot
 */
@Api(tags = "生成认证文档")
@RestController
@RequestMapping("/api/generate-document")
@CrossOrigin(origins = "*")
public class GenerateDocumentController {

  /** 生成认证文档服务 */
  @Resource
  private GenerateDocumentService generateDocumentService;

  /**
   * 查询 Document type 下拉列表选项
   * 前端画面初始化时调用，用于构建 Document type 下拉列表。
   *
   * @return 统一格式的文档类型选项响应
   */
  @ApiOperation("查询文档类型下拉列表")
  @GetMapping("/document-types")
  public ResponseEntity<ApiResult<GenerateDocumentResponse>> getDocumentTypes() {
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.getDocumentTypes();
    // 业务状态码与 HTTP 状态码保持一致，便于前端 axios 统一捕获
    return ResponseEntity.status(result.getCode()).body(result);
  }

  /**
   * 校验生成认证文档的检索条件
   * 前端点击 [Submit] 按钮时调用，校验通过后由前端迁移到 Generate document 画面。
   *
   * @param request 检索条件请求对象（Chassis series / Chassis no / Document type / userid）
   * @return 统一格式的条件校验响应
   */
  @ApiOperation("校验生成认证文档检索条件")
  @PostMapping("/submit")
  public ResponseEntity<ApiResult<GenerateDocumentResponse>> submitCondition(
      @RequestBody GenerateDocumentRequest request) {
    ApiResult<GenerateDocumentResponse> result = generateDocumentService.submitCondition(request);
    return ResponseEntity.status(result.getCode()).body(result);
  }
}
