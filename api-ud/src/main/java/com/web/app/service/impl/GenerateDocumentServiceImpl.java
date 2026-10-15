package com.web.app.service.impl;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.DocumentTypeOption;
import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;
import com.web.app.dto.MessageConstants;
import com.web.app.entity.HdocDocumentList;
import com.web.app.mapper.GenerateDocumentMapper;
import com.web.app.service.GenerateDocumentService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * 生成认证文档服务实现类
 * 【詳細設計UD03.md（Generate Homologation Document 模块）】3.1 处理流程的实现：
 * 3.1.1 Submit：条件校验 → 返回规范化后的检索条件
 * 2.1 控件 3：Document type 下拉列表来源于 HDOC_DOCUMENT_LIST
 *
 * @author GitHub Copilot
 */
@Service
public class GenerateDocumentServiceImpl implements GenerateDocumentService {

  /** 日志对象 */
  private static final Logger logger =
      LogManager.getLogger(GenerateDocumentServiceImpl.class);

  /** Chassis series 最大长度（详细设计 2.1 控件 1：MaxLength=5） */
  private static final int CHASSIS_SERIES_MAX_LENGTH = 5;

  /** Chassis no 最大长度（详细设计 2.1 控件 2：MaxLength=10） */
  private static final int CHASSIS_NO_MAX_LENGTH = 10;

  /** Chassis series 合法字符正则：仅半角英字 [a-zA-Z] */
  private static final String CHASSIS_SERIES_PATTERN = "^[a-zA-Z]+$";

  /** Chassis no 合法字符正则：仅半角数字 [0-9] */
  private static final String CHASSIS_NO_PATTERN = "^[0-9]+$";

  /** 数据访问对象 */
  @Resource
  private GenerateDocumentMapper generateDocumentMapper;

  /**
   * 查询 Document type 下拉列表选项
   *
   * @return 统一格式的文档类型选项响应
   */
  @Override
  public ApiResult<GenerateDocumentResponse> getDocumentTypes() {
    // 步骤 1：查询 HDOC_DOCUMENT_LIST 的 DOCTYPE 与 DESCRIPTION
    List<HdocDocumentList> documentList = generateDocumentMapper.selectHdocDocumentList();

    // 步骤 2：转换为下拉列表选项集合
    List<DocumentTypeOption> options = new ArrayList<>();
    if (documentList != null) {
      for (HdocDocumentList document : documentList) {
        options.add(new DocumentTypeOption(document.getDoctype(), document.getDescription()));
      }
    }

    // 步骤 3：构建响应（无数据时为空列表，画面侧下拉列表不显示任何选项）
    GenerateDocumentResponse response = new GenerateDocumentResponse();
    response.setDocumentTypes(options);

    logger.info("文档类型下拉列表查询成功, 选项数 = {}", options.size());
    return ApiResult.success(response);
  }

  /**
   * 校验并接受生成认证文档的检索条件
   *
   * @param request 检索条件请求对象
   * @return 统一格式的条件校验响应
   */
  @Override
  public ApiResult<GenerateDocumentResponse> submitCondition(GenerateDocumentRequest request) {
    // 步骤 1：请求对象空值校验
    if (request == null) {
      logger.warn("生成认证文档条件校验失败：请求对象为空");
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.CHASSIS_SERIES_REQUIRED);
    }

    // 前置处理：去除首尾空格（详细设计 3.1.1）
    String chassisSeries = trim(request.getChassisSeries());
    String chassisNo = trim(request.getChassisNo());
    String documentType = trim(request.getDocumentType());

    // 步骤 2：Chassis series 必填校验
    if (!StringUtils.hasText(chassisSeries)) {
      logger.warn("生成认证文档条件校验失败：Chassis series 为空");
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.CHASSIS_SERIES_REQUIRED);
    }
    // 步骤 3：Chassis series 长度与字符范围校验（仅半角英字，最大 5 位）
    if (chassisSeries.length() > CHASSIS_SERIES_MAX_LENGTH
        || !chassisSeries.matches(CHASSIS_SERIES_PATTERN)) {
      logger.warn("生成认证文档条件校验失败：Chassis series 格式非法, value = {}", chassisSeries);
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.CHASSIS_SERIES_FORMAT);
    }

    // 步骤 4：Chassis no 必填校验
    if (!StringUtils.hasText(chassisNo)) {
      logger.warn("生成认证文档条件校验失败：Chassis no 为空");
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.CHASSIS_NO_REQUIRED);
    }
    // 步骤 5：Chassis no 长度与字符范围校验（仅半角数字，最大 10 位）
    if (chassisNo.length() > CHASSIS_NO_MAX_LENGTH || !chassisNo.matches(CHASSIS_NO_PATTERN)) {
      logger.warn("生成认证文档条件校验失败：Chassis no 格式非法, value = {}", chassisNo);
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.CHASSIS_NO_FORMAT);
    }

    // 步骤 6：Document type 必填校验
    if (!StringUtils.hasText(documentType)) {
      logger.warn("生成认证文档条件校验失败：Document type 为空");
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.DOCUMENT_TYPE_REQUIRED);
    }

    // 步骤 7：校验全部通过，构建响应
    GenerateDocumentResponse response = new GenerateDocumentResponse();
    response.setDocumentTypes(new ArrayList<>());

    logger.info("生成认证文档条件校验成功, chassisSeries = {}, chassisNo = {}, documentType = {}",
        chassisSeries, chassisNo, documentType);
    return ApiResult.success(response);
  }

  /**
   * 去除字符串首尾空格
   *
   * @param value 原始字符串
   * @return 去空格后的字符串；入参为 null 时返回空字符串
   */
  private String trim(String value) {
    return value == null ? "" : value.trim();
  }
}
