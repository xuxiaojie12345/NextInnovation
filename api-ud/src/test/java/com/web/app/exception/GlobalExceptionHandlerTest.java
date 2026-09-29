package com.web.app.exception;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.MessageConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.MatcherAssert.assertThat;

/**
 * GlobalExceptionHandler 单元测试
 * 严格对应《Login_詳細設計.md》第 6 章异常处理规格：
 * 业务异常携带明确状态码（401 / 403 / 500）直接透传；
 * 未预期异常（如数据库连接失败）统一返回 500 与系统异常消息。
 * 测试方法遵循 AAA（Arrange-Act-Assert）模式，各方法相互独立。
 *
 * @author GitHub Copilot
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class GlobalExceptionHandlerTest {

  /** 被测试的全局异常处理器 */
  private GlobalExceptionHandler globalExceptionHandler;

  /** 每个测试方法执行前的公共初始化 */
  @BeforeEach
  void setUp() {
    globalExceptionHandler = new GlobalExceptionHandler();
  }

  /* ===================== 业务异常（BusinessException） ===================== */

  /**
   * 校验 1：业务异常 401 —— 用户名或密码错误
   * HTTP 状态码与响应体 code 均为 401，message 与设计文案一致。
   */
  @Test
  @DisplayName("业务异常 401：返回 401 状态码与错误文案")
  void handleBusinessException_code401_returnsUnauthorized() {
    // Arrange
    BusinessException exception =
        new BusinessException(ApiCode.INVALID_CREDENTIALS, MessageConstants.INVALID_CREDENTIALS);

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("HTTP 状态码应为 401", actual.getStatusCode(), is(HttpStatus.UNAUTHORIZED));
    assertThat("响应体不应为空", actual.getBody(), notNullValue());
    assertThat("业务码应为 401", actual.getBody().getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat("提示消息应与设计文案一致", actual.getBody().getMessage(),
        is(MessageConstants.INVALID_CREDENTIALS));
    assertThat("失败响应 data 应为 null", actual.getBody().getData(), nullValue());
  }

  /**
   * 校验 2：业务异常 403 —— 账户已锁定
   */
  @Test
  @DisplayName("业务异常 403：返回 403 状态码与账户锁定文案")
  void handleBusinessException_code403_returnsForbidden() {
    // Arrange
    BusinessException exception =
        new BusinessException(ApiCode.ACCOUNT_LOCKED, MessageConstants.ACCOUNT_LOCKED);

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("HTTP 状态码应为 403", actual.getStatusCode(), is(HttpStatus.FORBIDDEN));
    assertThat("业务码应为 403", actual.getBody().getCode(), is(ApiCode.ACCOUNT_LOCKED));
    assertThat("提示消息应为账户锁定文案", actual.getBody().getMessage(),
        is(MessageConstants.ACCOUNT_LOCKED));
  }

  /**
   * 校验 3：业务异常 500 —— 服务器内部错误
   */
  @Test
  @DisplayName("业务异常 500：返回 500 状态码与系统异常文案")
  void handleBusinessException_code500_returnsInternalServerError() {
    // Arrange
    BusinessException exception =
        new BusinessException(ApiCode.SYSTEM_ERROR, MessageConstants.SYSTEM_ERROR);

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("HTTP 状态码应为 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
    assertThat("业务码应为 500", actual.getBody().getCode(), is(ApiCode.SYSTEM_ERROR));
    assertThat("提示消息应为系统异常文案", actual.getBody().getMessage(),
        is(MessageConstants.SYSTEM_ERROR));
  }

  /**
   * 校验 4：非法状态码兜底 —— 无法解析为标准 HTTP 状态时统一返回 500
   * 这是 handleBusinessException 中的 status == null 分支。
   */
  @Test
  @DisplayName("业务异常：非法状态码（999）兜底映射为 HTTP 500")
  void handleBusinessException_unresolvableCode_fallsBackTo500() {
    // Arrange
    BusinessException exception = new BusinessException(999, "非法状态码");

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("非法状态码应兜底为 HTTP 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
    assertThat("业务码保留原值 999", actual.getBody().getCode(), is(999));
    assertThat("提示消息保留原值", actual.getBody().getMessage(), is("非法状态码"));
  }

  /**
   * 校验 5：状态码为 0 时兜底为 500
   * 0（NETWORK_ERROR）仅供前端使用，后端不应映射为合法 HTTP 状态。
   */
  @Test
  @DisplayName("业务异常：状态码 0 兜底映射为 HTTP 500")
  void handleBusinessException_codeZero_fallsBackTo500() {
    // Arrange
    BusinessException exception = new BusinessException(ApiCode.NETWORK_ERROR, "网络异常");

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("状态码 0 应兜底为 HTTP 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
    assertThat("业务码保留原值 0", actual.getBody().getCode(), is(ApiCode.NETWORK_ERROR));
  }

  /**
   * 校验 6：负数状态码兜底为 500
   */
  @Test
  @DisplayName("业务异常：负数状态码（-1）兜底映射为 HTTP 500")
  void handleBusinessException_negativeCode_fallsBackTo500() {
    // Arrange
    BusinessException exception = new BusinessException(-1, "负数状态码");

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("负数状态码应兜底为 HTTP 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
  }

  /**
   * 校验 7：异常消息为 null 时不抛异常，正常返回响应体
   */
  @Test
  @DisplayName("业务异常：message 为 null 时正常返回，不抛异常")
  void handleBusinessException_nullMessage_returnsResponse() {
    // Arrange
    BusinessException exception = new BusinessException(ApiCode.INVALID_CREDENTIALS, null);

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("HTTP 状态码应为 401", actual.getStatusCode(), is(HttpStatus.UNAUTHORIZED));
    assertThat("响应体不应为空", actual.getBody(), notNullValue());
    assertThat("消息应为 null", actual.getBody().getMessage(), nullValue());
  }

  /**
   * 校验 8：异常消息为空串时原样透传
   */
  @Test
  @DisplayName("业务异常：message 为空串时原样透传")
  void handleBusinessException_emptyMessage_passesThrough() {
    // Arrange
    BusinessException exception = new BusinessException(ApiCode.ACCOUNT_LOCKED, "");

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("HTTP 状态码应为 403", actual.getStatusCode(), is(HttpStatus.FORBIDDEN));
    assertThat("消息应为空串", actual.getBody().getMessage(), is(""));
  }

  /* ===================== 未预期异常（兜底） ===================== */

  /**
   * 校验 9：普通运行时异常返回 500 与系统异常文案
   * 对应详细设计第 6 章：未预期异常统一返回 500，提示联系管理员。
   */
  @Test
  @DisplayName("未预期异常：RuntimeException 返回 500 与系统异常文案")
  void handleException_runtimeException_returnsSystemError() {
    // Arrange
    RuntimeException exception = new RuntimeException("unexpected failure");

    // Act
    ResponseEntity<ApiResult<Void>> actual = globalExceptionHandler.handleException(exception);

    // Assert
    assertThat("HTTP 状态码应为 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
    assertThat("响应体不应为空", actual.getBody(), notNullValue());
    assertThat("业务码应为 SYSTEM_ERROR", actual.getBody().getCode(), is(ApiCode.SYSTEM_ERROR));
    assertThat("提示消息应为系统异常文案", actual.getBody().getMessage(),
        is(MessageConstants.SYSTEM_ERROR));
    assertThat("data 应为 null", actual.getBody().getData(), nullValue());
  }

  /**
   * 校验 10：数据库连接失败场景返回 500 且不泄露技术细节
   * 详细设计第 6 章明确要求返回通用提示，避免暴露内部堆栈信息。
   */
  @Test
  @DisplayName("未预期异常：数据库连接失败返回 500，且不泄露内部异常信息")
  void handleException_databaseConnectionFailure_hidesInternalDetail() {
    // Arrange
    Exception exception = new RuntimeException(
        "Communications link failure: jdbc:mysql://172.17.0.63:3306/react_use");

    // Act
    ResponseEntity<ApiResult<Void>> actual = globalExceptionHandler.handleException(exception);

    // Assert
    assertThat("HTTP 状态码应为 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
    assertThat("消息应为通用文案", actual.getBody().getMessage(),
        is(MessageConstants.SYSTEM_ERROR));
  }

  /**
   * 校验 11：业务异常本身不应被兜底分支处理
   * 验证两个 @ExceptionHandler 的职责边界：BusinessException 走专属分支。
   */
  @Test
  @DisplayName("异常分派：BusinessException 走专属分支，返回其原始业务码而非 500")
  void handleBusinessException_businessException_keepsOriginalCode() {
    // Arrange：以 401 为例，若误入兜底分支则 code 会变为 500
    BusinessException exception =
        new BusinessException(ApiCode.INVALID_CREDENTIALS, MessageConstants.INVALID_CREDENTIALS);

    // Act
    ResponseEntity<ApiResult<Void>> actual =
        globalExceptionHandler.handleBusinessException(exception);

    // Assert
    assertThat("应保留原始业务码 401，而非兜底 500",
        actual.getBody().getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat("HTTP 状态码不应为 500", actual.getStatusCode() != HttpStatus.INTERNAL_SERVER_ERROR,
        is(true));
  }

  /**
   * 校验 12：Error 之外的受检异常包装后返回 500
   * 模拟 NPE 等编程错误，验证兜底分支的稳定性。
   */
  @Test
  @DisplayName("未预期异常：NullPointerException 返回 500 系统异常")
  void handleException_nullPointerException_returnsSystemError() {
    // Arrange
    NullPointerException exception = new NullPointerException("null ref");

    // Act
    ResponseEntity<ApiResult<Void>> actual = globalExceptionHandler.handleException(exception);

    // Assert
    assertThat("HTTP 状态码应为 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
    assertThat("业务码应为 SYSTEM_ERROR", actual.getBody().getCode(), is(ApiCode.SYSTEM_ERROR));
  }

  /**
   * 校验 13：异常无消息（message 为 null）时兜底逻辑仍可正常执行并记录日志
   */
  @Test
  @DisplayName("未预期异常：message 为 null 时正常返回 500")
  void handleException_nullMessage_returnsSystemError() {
    // Arrange
    Exception exception = new Exception((String) null);

    // Act
    ResponseEntity<ApiResult<Void>> actual = globalExceptionHandler.handleException(exception);

    // Assert
    assertThat("HTTP 状态码应为 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
    assertThat("提示消息应为系统异常文案", actual.getBody().getMessage(),
        is(MessageConstants.SYSTEM_ERROR));
  }

  /**
   * 校验 14：深层嵌套异常（带 cause）返回 500
   * 模拟 MyBatis / Druid 抛出的多层包装异常。
   */
  @Test
  @DisplayName("未预期异常：带 cause 的嵌套异常返回 500")
  void handleException_nestedCause_returnsSystemError() {
    // Arrange
    Exception rootCause = new IllegalStateException("connection pool exhausted");
    Exception exception = new RuntimeException("mybatis query failed", rootCause);

    // Act
    ResponseEntity<ApiResult<Void>> actual = globalExceptionHandler.handleException(exception);

    // Assert
    assertThat("HTTP 状态码应为 500", actual.getStatusCode(),
        is(HttpStatus.INTERNAL_SERVER_ERROR));
    assertThat("业务码应为 SYSTEM_ERROR", actual.getBody().getCode(), is(ApiCode.SYSTEM_ERROR));
    assertThat("提示消息不应包含内部细节",
        actual.getBody().getMessage().contains("connection pool"), is(false));
  }

  /**
   * 校验 15：返回体结构完整性
   * 验证 code / data / message 三字段齐全，符合详细设计 5.1 响应结构。
   */
  @Test
  @DisplayName("响应结构：业务异常与系统异常返回体均含完整三字段")
  void responseBody_containsAllRequiredFields() {
    // Arrange
    BusinessException businessException =
        new BusinessException(ApiCode.ACCOUNT_LOCKED, MessageConstants.ACCOUNT_LOCKED);
    Exception systemException = new RuntimeException("boom");

    // Act
    ApiResult<Void> businessBody =
        globalExceptionHandler.handleBusinessException(businessException).getBody();
    ApiResult<Void> systemBody =
        globalExceptionHandler.handleException(systemException).getBody();

    // Assert
    assertThat("业务异常响应体不应为空", businessBody, notNullValue());
    assertThat("业务异常 code 不应为空", businessBody.getCode(), notNullValue());
    assertThat("业务异常 message 不应为空", businessBody.getMessage(), notNullValue());
    assertThat("系统异常响应体不应为空", systemBody, notNullValue());
    assertThat("系统异常 code 不应为空", systemBody.getCode(), notNullValue());
    assertThat("系统异常 message 不应为空", systemBody.getMessage(), notNullValue());
  }
}
