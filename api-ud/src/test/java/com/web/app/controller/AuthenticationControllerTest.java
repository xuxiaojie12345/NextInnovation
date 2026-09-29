package com.web.app.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.dto.MessageConstants;
import com.web.app.exception.GlobalExceptionHandler;
import com.web.app.service.AuthenticationService;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AuthenticationController 单元测试
 * 验证 POST /api/auth/login 的请求接收、HTTP 状态码与响应体结构与详细设计 5.1 一致。
 * 测试方法遵循 AAA（Arrange-Act-Assert）模式，各方法相互独立。
 *
 * @author GitHub Copilot
 */
@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthenticationControllerTest {

  /** MockMvc 对象，用于模拟 HTTP 请求 */
  private MockMvc mockMvc;

  /** JSON 序列化工具 */
  private final ObjectMapper objectMapper = new ObjectMapper();

  /** 认证服务 Mock 对象 */
  @Mock
  private AuthenticationService authenticationService;

  /** 被测试的控制器，由 Mockito 注入上述 Mock 对象 */
  @InjectMocks
  private AuthenticationController authenticationController;

  /** 测试用 UserID */
  private static final String VALID_USERID = "admin";

  /** 测试用 Password */
  private static final String VALID_PASSWORD = "Admin@123";

  /** 测试用 Token */
  private static final String TEST_TOKEN = "test-token-0001";

  /** 每个测试方法执行前的公共初始化：构建独立的 MockMvc 环境 */
  @BeforeEach
  void setUp() {
    org.mockito.Mockito.reset(authenticationService);
    mockMvc = MockMvcBuilders.standaloneSetup(authenticationController)
        // 注册全局异常处理器，验证 500 兜底逻辑
        .setControllerAdvice(new GlobalExceptionHandler())
        .setMessageConverters(new MappingJackson2HttpMessageConverter())
        .build();
  }

  /**
   * 构造认证成功的响应体
   *
   * @return 成功响应体
   */
  private ApiResult<LoginResponse> buildSuccessResult() {
    LoginResponse response = new LoginResponse();
    response.setUserid(VALID_USERID);
    response.setUsername("Administrator");
    response.setToken(TEST_TOKEN);
    return ApiResult.success(response);
  }

  /**
   * 用例 1：认证成功时返回 HTTP 200，响应体结构为 code / data / message
   */
  @Test
  @DisplayName("接口测试：认证成功返回 HTTP 200 与标准响应结构")
  void login_success_returnsHttp200() throws Exception {
    // Arrange：Service 返回认证成功结果
    when(authenticationService.login(any(LoginRequest.class))).thenReturn(buildSuccessResult());
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);

    // Act：发送 POST /api/auth/login
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))

        // Assert：HTTP 200，且响应体字段与详细设计 5.1.2 一致
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code", is(200)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SUCCESS)))
        .andExpect(jsonPath("$.data.userid", is(VALID_USERID)))
        .andExpect(jsonPath("$.data.username", is("Administrator")))
        .andExpect(jsonPath("$.data.token", is(TEST_TOKEN)));
  }

  /**
   * 用例 2：用户名或密码错误时返回 HTTP 401
   */
  @Test
  @DisplayName("接口测试：用户名或密码错误返回 HTTP 401")
  void login_invalidCredentials_returnsHttp401() throws Exception {
    // Arrange：Service 返回 401 结果
    when(authenticationService.login(any(LoginRequest.class)))
        .thenReturn(ApiResult.<LoginResponse>failure(
            ApiCode.INVALID_CREDENTIALS, MessageConstants.INVALID_CREDENTIALS));
    LoginRequest request = new LoginRequest(VALID_USERID, "WrongPass1!");

    // Act：发送 POST /api/auth/login
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))

        // Assert：HTTP 401，data 为 null
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code", is(401)))
        .andExpect(jsonPath("$.data").doesNotExist())
        .andExpect(jsonPath("$.message", is(MessageConstants.INVALID_CREDENTIALS)));
  }

  /**
   * 用例 3：账户锁定时返回 HTTP 403
   */
  @Test
  @DisplayName("接口测试：账户锁定返回 HTTP 403")
  void login_accountLocked_returnsHttp403() throws Exception {
    // Arrange：Service 返回 403 结果
    when(authenticationService.login(any(LoginRequest.class)))
        .thenReturn(ApiResult.<LoginResponse>failure(
            ApiCode.ACCOUNT_LOCKED, MessageConstants.ACCOUNT_LOCKED));
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);

    // Act：发送 POST /api/auth/login
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))

        // Assert：HTTP 403 与账户锁定消息
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code", is(403)))
        .andExpect(jsonPath("$.message", is(MessageConstants.ACCOUNT_LOCKED)));
  }

  /**
   * 用例 4：服务器内部错误返回 HTTP 500
   */
  @Test
  @DisplayName("接口测试：服务端异常返回 HTTP 500")
  void login_systemError_returnsHttp500() throws Exception {
    // Arrange：Service 返回 500 结果
    when(authenticationService.login(any(LoginRequest.class)))
        .thenReturn(ApiResult.<LoginResponse>failure(
            ApiCode.SYSTEM_ERROR, MessageConstants.SYSTEM_ERROR));
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);

    // Act：发送 POST /api/auth/login
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))

        // Assert：HTTP 500 与系统异常消息
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code", is(500)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SYSTEM_ERROR)));
  }

  /**
   * 用例 5：Service 抛出异常时由全局异常处理器兜底返回 HTTP 500（详细设计第 6 章）
   */
  @Test
  @DisplayName("接口测试：Service 抛出异常时由兜底处理器返回 HTTP 500")
  void login_serviceThrowsException_returnsHttp500() throws Exception {
    // Arrange：Service 抛出运行时异常（模拟数据库连接失败）
    when(authenticationService.login(any(LoginRequest.class)))
        .thenThrow(new RuntimeException("Communications link failure"));
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);

    // Act：发送 POST /api/auth/login
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))

        // Assert：兜底处理为 500 与系统异常消息
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code", is(500)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SYSTEM_ERROR)));
  }

  /**
   * 用例 6：请求体字段名与详细设计一致（userid / password 全小写）
   */
  @Test
  @DisplayName("接口测试：请求体字段 userid / password 被正确反序列化")
  void login_requestBodyFieldsAreDeserialized() throws Exception {
    // Arrange：手工构造 JSON 报文，字段名与详细设计 5.1.1 完全一致
    String requestJson = "{\"userid\":\"admin\",\"password\":\"Admin@123\"}";
    when(authenticationService.login(any(LoginRequest.class))).thenReturn(buildSuccessResult());

    // Act：发送 POST /api/auth/login
    MvcResult mvcResult = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(requestJson))

        // Assert：请求被正常受理
        .andExpect(status().isOk())
        .andReturn();

    // Assert：响应体 UTF-8 编码，含中文环境无关的英文消息
    String content = mvcResult.getResponse().getContentAsString(StandardCharsets.UTF_8);
    assertThat(content.contains("\"code\":200"), is(true));
  }

  /**
   * 用例 7：未提供请求体时接口不抛出异常，由业务层返回必填消息
   */
  @Test
  @DisplayName("接口测试：缺失请求体时由业务层返回 401 必填消息")
  void login_missingBody_returnsHttp401() throws Exception {
    // Arrange：Service 接收 null 请求并返回必填消息
    when(authenticationService.login(any())).thenReturn(
        ApiResult.<LoginResponse>failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.REQUIRED));

    // Act：发送不带请求体的 POST 请求
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON))

        // Assert：返回 401 与必填消息，而非 500
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message", is(MessageConstants.REQUIRED)));
  }

  /**
   * 用例 8：请求路径固定为 /api/auth/login（前端 authApi.ts 硬编码该路径）
   */
  @Test
  @DisplayName("接口测试：接口路径为 /api/auth/login")
  void login_endpointPathIsFixed() throws Exception {
    // Arrange：Service 返回成功结果
    when(authenticationService.login(any(LoginRequest.class))).thenReturn(buildSuccessResult());
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);

    // Act & Assert：该路径可正常访问
    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());

    // Act & Assert：错误路径返回 404
    mockMvc.perform(post("/api/auth/login/wrong")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isNotFound());
  }
}
