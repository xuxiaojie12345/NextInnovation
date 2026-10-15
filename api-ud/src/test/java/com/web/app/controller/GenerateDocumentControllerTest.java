package com.web.app.controller;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.DocumentTypeOption;
import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;
import com.web.app.dto.MessageConstants;
import com.web.app.exception.GlobalExceptionHandler;
import com.web.app.service.GenerateDocumentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.Collections;

import static org.hamcrest.CoreMatchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GenerateDocumentController 单元测试
 * 验证 GET /api/generate-document/document-types 与
 * POST /api/generate-document/submit 的请求接收、HTTP 状态码与响应体结构
 * 与【詳細設計UD03.md（Generate Homologation Document 模块）】的一致性。
 * 测试方法遵循 AAA（Arrange-Act-Assert）模式，各方法相互独立。
 *
 * @author GitHub Copilot
 */
@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class GenerateDocumentControllerTest {

  /** MockMvc 对象，用于模拟 HTTP 请求 */
  private MockMvc mockMvc;

  /** 生成认证文档服务 Mock 对象 */
  @Mock
  private GenerateDocumentService generateDocumentService;

  /** 被测试的控制器，由 Mockito 注入上述 Mock 对象 */
  @InjectMocks
  private GenerateDocumentController generateDocumentController;

  /** JSON 序列化工具 */
  private final ObjectMapper objectMapper = new ObjectMapper();

  /** 正常条件：Chassis series */
  private static final String VALID_CHASSIS_SERIES = "JPCT";

  /** 正常条件：Chassis no */
  private static final String VALID_CHASSIS_NO = "15101319";

  /** 正常条件：Document type */
  private static final String VALID_DOCUMENT_TYPE = "Homologation";

  /** 每个测试方法执行前的公共初始化：构建独立的 MockMvc 环境 */
  @BeforeEach
  void setUp() {
    org.mockito.Mockito.reset(generateDocumentService);
    mockMvc = MockMvcBuilders.standaloneSetup(generateDocumentController)
        // 注册全局异常处理器，验证 500 兜底逻辑
        .setControllerAdvice(new GlobalExceptionHandler())
        .setMessageConverters(new MappingJackson2HttpMessageConverter())
        .build();
  }

  /**
   * 构造下拉列表查询成功的响应体
   *
   * @return 成功响应体
   */
  private ApiResult<GenerateDocumentResponse> buildDocumentTypesResult() {
    GenerateDocumentResponse response = new GenerateDocumentResponse();
    response.setDocumentTypes(Arrays.asList(
        new DocumentTypeOption("Homologation", "Homologation Document"),
        new DocumentTypeOption("Type Approval", "Type Approval Document")));
    return ApiResult.success(response);
  }

  /**
   * 构造条件请求对象
   *
   * @return 条件请求对象
   */
  private GenerateDocumentRequest buildRequest() {
    GenerateDocumentRequest request = new GenerateDocumentRequest();
    request.setChassisSeries(VALID_CHASSIS_SERIES);
    request.setChassisNo(VALID_CHASSIS_NO);
    request.setDocumentType(VALID_DOCUMENT_TYPE);
    request.setUserid("admin");
    return request;
  }

  /** 用例 3：下拉列表查询成功时返回 HTTP 200 与标准响应结构 */
  @Test
  @DisplayName("接口测试：下拉列表查询成功返回 HTTP 200 与标准响应结构")
  void getDocumentTypes_success_returnsHttp200() throws Exception {
    // Arrange：Service 返回查询成功结果
    when(generateDocumentService.getDocumentTypes()).thenReturn(buildDocumentTypesResult());

    // Act：发送 GET /api/generate-document/document-types
    mockMvc.perform(get("/api/generate-document/document-types"))

        // Assert：HTTP 200，且响应体字段与详细设计保持一致
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code", is(200)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SUCCESS)))
        .andExpect(jsonPath("$.data.documentTypes.length()", is(2)))
        .andExpect(jsonPath("$.data.documentTypes[0].doctype", is("Homologation")));
  }

  /** 用例 3 补充：下拉列表无数据时返回 HTTP 200 与空列表 */
  @Test
  @DisplayName("接口测试：下拉列表无数据返回 HTTP 200 与空列表")
  void getDocumentTypes_noData_returnsHttp200WithEmptyList() throws Exception {
    // Arrange：Service 返回空选项列表
    GenerateDocumentResponse response = new GenerateDocumentResponse();
    response.setDocumentTypes(Collections.emptyList());
    when(generateDocumentService.getDocumentTypes()).thenReturn(ApiResult.success(response));

    // Act & Assert：HTTP 200 且列表长度为 0
    mockMvc.perform(get("/api/generate-document/document-types"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.documentTypes.length()", is(0)));
  }

  /** 用例 12：条件校验成功时返回 HTTP 200 */
  @Test
  @DisplayName("接口测试：条件校验成功返回 HTTP 200")
  void submitCondition_success_returnsHttp200() throws Exception {
    // Arrange：Service 返回校验成功结果
    GenerateDocumentResponse response = new GenerateDocumentResponse();
    response.setDocumentTypes(Collections.emptyList());
    when(generateDocumentService.submitCondition(any(GenerateDocumentRequest.class)))
        .thenReturn(ApiResult.success(response));

    // Act：发送 POST /api/generate-document/submit
    mockMvc.perform(post("/api/generate-document/submit")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(buildRequest())))

        // Assert：HTTP 200 与成功消息
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code", is(200)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SUCCESS)));
  }

  /** 用例 13：必填项未输入时返回 HTTP 401 与必填消息 */
  @Test
  @DisplayName("接口测试：必填项未输入返回 HTTP 401 与必填消息")
  void submitCondition_requiredMissing_returnsHttp401() throws Exception {
    // Arrange：Service 返回 401 失败结果
    when(generateDocumentService.submitCondition(any(GenerateDocumentRequest.class)))
        .thenReturn(ApiResult.failure(ApiCode.INVALID_CREDENTIALS,
            MessageConstants.CHASSIS_SERIES_REQUIRED));

    // Act & Assert：HTTP 401，data 为 null
    mockMvc.perform(post("/api/generate-document/submit")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"chassisSeries\":\"\",\"chassisNo\":\"\",\"documentType\":\"\"}"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code", is(401)))
        .andExpect(jsonPath("$.message", is(MessageConstants.CHASSIS_SERIES_REQUIRED)))
        .andExpect(jsonPath("$.data").doesNotExist());
  }

  /** 用例 17：Service 抛出异常时由全局异常处理器返回 HTTP 500 */
  @Test
  @DisplayName("接口测试：Service 异常时返回 HTTP 500 系统错误")
  void submitCondition_serviceThrows_returnsHttp500() throws Exception {
    // Arrange：Service 抛出运行时异常
    when(generateDocumentService.submitCondition(any(GenerateDocumentRequest.class)))
        .thenThrow(new RuntimeException("数据库连接失败"));

    // Act & Assert：HTTP 500，消息为系统异常文案（详细设计 5 异常处理）
    mockMvc.perform(post("/api/generate-document/submit")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(buildRequest())))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code", is(500)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SYSTEM_ERROR)));
  }

  /** 用例 16：下拉列表查询时 Service 抛出异常同样返回 HTTP 500 */
  @Test
  @DisplayName("接口测试：下拉列表查询异常返回 HTTP 500 系统错误")
  void getDocumentTypes_serviceThrows_returnsHttp500() throws Exception {
    // Arrange：Service 抛出运行时异常
    when(generateDocumentService.getDocumentTypes())
        .thenThrow(new RuntimeException("数据库连接失败"));

    // Act & Assert：HTTP 500 与系统异常消息
    mockMvc.perform(get("/api/generate-document/document-types"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code", is(500)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SYSTEM_ERROR)));
  }
}
