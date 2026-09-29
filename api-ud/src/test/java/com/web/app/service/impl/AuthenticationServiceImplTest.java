package com.web.app.service.impl;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.LoginRequest;
import com.web.app.dto.LoginResponse;
import com.web.app.dto.MessageConstants;
import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocMarketAuth;
import com.web.app.entity.HdocUserInfor;
import com.web.app.mapper.AuthenticationMapper;
import com.web.app.tool.TokenTool;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.hamcrest.CoreMatchers.containsString;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * AuthenticationServiceImpl 单元测试
 * 严格对应《Login_詳細設計.md》4.1 处理流程 / 4.2 校验详细规格表 / 5.1 接口定义。
 * 测试用例采用 AAA（Arrange-Act-Assert）模式编写，各测试方法相互独立。
 *
 * @author GitHub Copilot
 */
@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AuthenticationServiceImplTest {

  /** 被测试的服务实现类，由 Mockito 注入下方 Mock 对象 */
  @InjectMocks
  private AuthenticationServiceImpl authenticationService;

  /** 数据访问层 Mock 对象 */
  @Mock
  private AuthenticationMapper authenticationMapper;

  /** Token 工具 Mock 对象 */
  @Mock
  private TokenTool tokenTool;

  /** 测试用正确 UserID */
  private static final String VALID_USERID = "admin";

  /** 测试用正确 Password */
  private static final String VALID_PASSWORD = "Admin@123";

  /** 测试用 Token 值 */
  private static final String TEST_TOKEN = "test-token-0001";

  /**
   * 每个测试方法执行前的公共初始化
   * 说明：此处使用 lenient() 声明宽松桩。原因是本测试类同时覆盖
   * 「参数校验失败」与「认证成功」两类场景，校验失败的用例不会触达
   * Token 生成与权限查询，若使用严格模式会被判定为多余桩而报错。
   */
  @BeforeEach
  void setUp() {
    // 清空 Mock 调用记录，保证测试方法之间相互独立
    org.mockito.Mockito.reset(authenticationMapper, tokenTool);

    // 认证成功场景下 Token 生成与权限查询的通用桩（宽松模式）
    lenient().when(tokenTool.generateToken(anyString(), anyString())).thenReturn(TEST_TOKEN);
    lenient().when(authenticationMapper.selectFunctionAuthByUserid(anyString()))
        .thenReturn(Collections.emptyList());
    lenient().when(authenticationMapper.selectMarketAuthByUserid(anyString()))
        .thenReturn(Collections.emptyList());
  }

  /**
   * 构造用户信息实体
   *
   * @param userid   用户ID
   * @param password 数据库存储密码
   * @param username 用户名
   * @return 用户信息实体
   */
  private HdocUserInfor buildUser(String userid, String password, String username) {
    HdocUserInfor user = new HdocUserInfor();
    user.setUserid(userid);
    user.setPassword(password);
    user.setUsername(username);
    user.setRegisterDatetime(new Date());
    user.setRegisterUser("system");
    user.setRegisterProcess("batch");
    user.setUpdateDatetime(new Date());
    user.setUpdateUser("system");
    user.setUpdateProcess("batch");
    return user;
  }

  /* ===================== 正常场景（200） ===================== */

  /**
   * 校验 1：认证成功
   * 对应用例规范 No.1 —— 用户名与密码正确时返回 200 与 Token。
   */
  @Test
  @DisplayName("登录成功：用户名与密码正确时返回 200 及 Token")
  void login_success_returnsTokenAndUserInfo() {
    // Arrange：数据库中已存在匹配的用户
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, VALID_PASSWORD, "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：业务状态码 200，返回 Token 与用户信息
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    assertThat(result.getMessage(), is(MessageConstants.SUCCESS));
    assertThat(result.getData(), notNullValue());
    assertThat(result.getData().getUserid(), is(VALID_USERID));
    assertThat(result.getData().getUsername(), is("Administrator"));
    assertThat(result.getData().getToken(), is(TEST_TOKEN));
  }

  /**
   * 校验 2：认证成功时，UserID / Password 首尾空格被 trim 后参与查询
   * 对应详细设计 4.1 步骤 2「前置处理」。
   */
  @Test
  @DisplayName("前置处理：输入首尾空格被 trim 后再查询数据库")
  void login_success_trimsWhitespaceBeforeQuery() {
    // Arrange：请求参数携带首尾空格
    LoginRequest request = new LoginRequest("  " + VALID_USERID + "  ", "  " + VALID_PASSWORD + "  ");
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, VALID_PASSWORD, "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：以 trim 后的 UserID 查询数据库，且认证成功
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    verify(authenticationMapper, times(1)).selectUserByUserid(VALID_USERID);
  }

  /**
   * 校验 3：认证成功时返回用户功能权限与市场权限
   */
  @Test
  @DisplayName("认证成功：返回用户功能权限与市场权限列表")
  void login_success_returnsFunctionAndMarketAuth() {
    // Arrange：数据库中用户存在，且已配置功能权限与市场权限
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, VALID_PASSWORD, "Administrator"));

    HdocFunctionAuth functionAuth = new HdocFunctionAuth();
    functionAuth.setUserid(VALID_USERID);
    functionAuth.setFunction("UD12");
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID))
        .thenReturn(Arrays.asList(functionAuth));

    HdocMarketAuth marketAuth = new HdocMarketAuth();
    marketAuth.setUserid(VALID_USERID);
    marketAuth.setMarket("JP");
    when(authenticationMapper.selectMarketAuthByUserid(VALID_USERID))
        .thenReturn(Arrays.asList(marketAuth));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：权限列表被正确装配
    assertThat(result.getData().getFunctions().size(), is(1));
    assertThat(result.getData().getFunctions().get(0), is("UD12"));
    assertThat(result.getData().getMarkets().size(), is(1));
    assertThat(result.getData().getMarkets().get(0), is("JP"));
  }

  /**
   * 校验 4：无权限数据时返回空列表而非 null，避免前端解构失败
   */
  @Test
  @DisplayName("认证成功：无权限数据时返回空列表")
  void login_success_returnsEmptyAuthListWhenNoData() {
    // Arrange：用户存在但未配置任何权限
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, VALID_PASSWORD, "Administrator"));
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID)).thenReturn(null);
    when(authenticationMapper.selectMarketAuthByUserid(VALID_USERID)).thenReturn(null);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：权限列表为空集合，非 null
    assertThat(result.getData().getFunctions(), notNullValue());
    assertThat(result.getData().getFunctions().isEmpty(), is(true));
    assertThat(result.getData().getMarkets(), notNullValue());
    assertThat(result.getData().getMarkets().isEmpty(), is(true));
  }

  /* ===================== 空值校验（4.2 No.1 / No.2） ===================== */

  /**
   * 校验 5：UserID 为空时返回通用必填消息，且不查询数据库
   */
  @Test
  @DisplayName("空值校验：UserID 为空时提示必填并终止流程")
  void login_useridEmpty_returnsRequiredMessage() {
    // Arrange：UserID 为空字符串，密码正常
    LoginRequest request = new LoginRequest("", VALID_PASSWORD);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回必填消息，且未访问数据库
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.REQUIRED));
    assertThat(result.getData(), nullValue());
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 6：Password 为空时返回通用必填消息
   */
  @Test
  @DisplayName("空值校验：Password 为空时提示必填并终止流程")
  void login_passwordEmpty_returnsRequiredMessage() {
    // Arrange：UserID 正常，密码为空字符串
    LoginRequest request = new LoginRequest(VALID_USERID, "");

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回必填消息，且未访问数据库
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.REQUIRED));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 7：UserID 与 Password 均为空时返回通用必填消息
   */
  @Test
  @DisplayName("空值校验：UserID 与 Password 均为空时提示必填")
  void login_bothEmpty_returnsRequiredMessage() {
    // Arrange：两者均为空
    LoginRequest request = new LoginRequest("", "");

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回必填消息
    assertThat(result.getMessage(), is(MessageConstants.REQUIRED));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 8：仅包含空格的输入视为空值（trim 后为空）
   */
  @Test
  @DisplayName("空值校验：仅含空格的输入 trim 后视为空值")
  void login_blankOnlyInput_returnsRequiredMessage() {
    // Arrange：UserID 仅由空格组成
    LoginRequest request = new LoginRequest("   ", VALID_PASSWORD);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回必填消息
    assertThat(result.getMessage(), is(MessageConstants.REQUIRED));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 9：请求对象为 null 时不抛出异常，返回必填消息（接口容错）
   */
  @Test
  @DisplayName("异常容错：请求对象为 null 时返回必填消息而不抛出异常")
  void login_nullRequest_returnsRequiredMessage() {
    // Arrange：请求对象为 null
    LoginRequest request = null;

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回必填消息，程序未抛出异常
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.REQUIRED));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /* ===================== 格式校验（4.2 No.3 / No.4） ===================== */

  /**
   * 校验 10：UserID 含半角英数字以外的字符时返回格式错误
   */
  @Test
  @DisplayName("格式校验：UserID 含非法字符（下划线）时提示格式错误")
  void login_useridWithInvalidChar_returnsFormatMessage() {
    // Arrange：UserID 含下划线，不符合半角英数字规则
    LoginRequest request = new LoginRequest("ad_min", VALID_PASSWORD);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回 UserID 格式错误消息
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.USERID_FORMAT));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 11：UserID 为全角字符时返回格式错误
   */
  @Test
  @DisplayName("格式校验：UserID 为全角字符时提示格式错误")
  void login_useridFullWidth_returnsFormatMessage() {
    // Arrange：UserID 为全角字符 ａｄｍｉｎ
    LoginRequest request = new LoginRequest("ａｄｍｉｎ", VALID_PASSWORD);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回 UserID 格式错误消息
    assertThat(result.getMessage(), is(MessageConstants.USERID_FORMAT));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 12：UserID 超过 10 位时返回长度错误
   */
  @Test
  @DisplayName("格式校验：UserID 超过 10 位时提示长度超限")
  void login_useridTooLong_returnsLengthMessage() {
    // Arrange：UserID 长度为 11 位
    LoginRequest request = new LoginRequest("abcdefghijk", VALID_PASSWORD);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回 UserID 长度错误消息
    assertThat(result.getMessage(), is(MessageConstants.USERID_LENGTH));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 13：UserID 恰好 10 位时格式校验通过（边界值）
   */
  @Test
  @DisplayName("格式校验（边界值）：UserID 恰好 10 位时校验通过")
  void login_useridExactlyTenChars_passesFormatCheck() {
    // Arrange：UserID 恰好 10 位，数据库中不存在该用户
    String userid = "abcdefghij";
    LoginRequest request = new LoginRequest(userid, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(userid)).thenReturn(null);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：越过格式校验进入用户查询，最终返回 401 而不是格式错误
    assertThat(result.getMessage(), is(MessageConstants.INVALID_CREDENTIALS));
    verify(authenticationMapper, times(1)).selectUserByUserid(userid);
  }

  /**
   * 校验 14：Password 含空格时返回格式错误
   */
  @Test
  @DisplayName("格式校验：Password 含空格时提示包含非法字符")
  void login_passwordWithSpace_returnsFormatMessage() {
    // Arrange：密码中间含空格
    LoginRequest request = new LoginRequest(VALID_USERID, "Admin 123");

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回密码格式错误消息
    assertThat(result.getMessage(), is(MessageConstants.PASSWORD_FORMAT));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 15：Password 含全角字符时返回格式错误
   */
  @Test
  @DisplayName("格式校验：Password 含全角字符时提示包含非法字符")
  void login_passwordFullWidth_returnsFormatMessage() {
    // Arrange：密码含全角字符
    LoginRequest request = new LoginRequest(VALID_USERID, "Ａdmin@123");

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回密码格式错误消息
    assertThat(result.getMessage(), is(MessageConstants.PASSWORD_FORMAT));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 16：Password 超过 32 位时返回长度错误
   */
  @Test
  @DisplayName("格式校验：Password 超过 32 位时提示长度超限")
  void login_passwordTooLong_returnsLengthMessage() {
    // Arrange：构造 33 位密码
    StringBuilder builder = new StringBuilder();
    for (int index = 0; index < 33; index++) {
      builder.append("a");
    }
    LoginRequest request = new LoginRequest(VALID_USERID, builder.toString());

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回密码长度错误消息
    assertThat(result.getMessage(), is(MessageConstants.PASSWORD_LENGTH));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 17：Password 含符号时校验通过（符号属于允许范围）
   */
  @Test
  @DisplayName("格式校验：Password 含符号 !@#$% 时校验通过")
  void login_passwordWithSymbols_passesFormatCheck() {
    // Arrange：密码含多种 ASCII 符号
    LoginRequest request = new LoginRequest(VALID_USERID, "Abc!@#$%123");
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "Abc!@#$%123", "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：符号不被判为非法字符，认证成功
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
  }

  /* ===================== 认证失败（401） ===================== */

  /**
   * 校验 18：用户不存在时返回 401 通用消息
   */
  @Test
  @DisplayName("认证失败：用户不存在时返回 401 通用消息")
  void login_userNotExists_returnsInvalidCredentials() {
    // Arrange：数据库中查询不到该用户
    LoginRequest request = new LoginRequest("nouser", VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid("nouser")).thenReturn(null);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回 401 与通用错误消息，且不生成 Token
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.INVALID_CREDENTIALS));
    assertThat(result.getData(), nullValue());
    verify(tokenTool, never()).generateToken(anyString(), anyString());
  }

  /**
   * 校验 19：密码不正确时返回 401 通用消息（详细设计 4.2 No.5）
   */
  @Test
  @DisplayName("认证失败：密码不正确时返回 401 通用消息")
  void login_wrongPassword_returnsInvalidCredentials() {
    // Arrange：用户存在但密码不匹配
    LoginRequest request = new LoginRequest(VALID_USERID, "WrongPass1!");
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, VALID_PASSWORD, "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回 401 与通用错误消息，且不生成 Token
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.INVALID_CREDENTIALS));
    verify(tokenTool, never()).generateToken(anyString(), anyString());
  }

  /**
   * 校验 20：密码大小写不一致时认证失败（区分大小写）
   */
  @Test
  @DisplayName("认证失败：密码大小写不一致时返回 401")
  void login_passwordCaseMismatch_returnsInvalidCredentials() {
    // Arrange：输入的密码首字母为大写，数据库为小写
    LoginRequest request = new LoginRequest(VALID_USERID, "Admin@123");
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "admin@123", "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：密码区分大小写，认证失败
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getMessage(), is(MessageConstants.INVALID_CREDENTIALS));
  }

  /* ===================== 账户锁定（403） ===================== */

  /**
   * 校验 21：账户已锁定时返回 403 与锁定消息（详细设计 4.2 No.6）
   */
  @Test
  @DisplayName("账户锁定：密码字段带 LOCKED 前缀时返回 403 锁定消息")
  void login_accountLocked_returnsAccountLockedMessage() {
    // Arrange：数据库中密码以 LOCKED 前缀标记账号已锁定
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "LOCKED_Admin@123", "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：返回 403 与账户锁定消息
    assertThat(result.getCode(), is(ApiCode.ACCOUNT_LOCKED));
    assertThat(result.getMessage(), is(MessageConstants.ACCOUNT_LOCKED));
    assertThat(result.getData(), nullValue());
    verify(tokenTool, never()).generateToken(anyString(), anyString());
  }

  /**
   * 校验 22：账户锁定的判定优先于密码错误判定
   */
  @Test
  @DisplayName("账户锁定：锁定状态判定优先于密码比对")
  void login_accountLocked_hasPriorityOverPasswordCheck() {
    // Arrange：密码同样不正确，但账号处于锁定状态
    LoginRequest request = new LoginRequest(VALID_USERID, "AnyPass1!");
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "LOCKED_other", "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：应返回锁定消息而非密码错误消息
    assertThat(result.getCode(), is(ApiCode.ACCOUNT_LOCKED));
    assertThat(result.getMessage(), is(MessageConstants.ACCOUNT_LOCKED));
  }

  /* ===================== 异常场景（500） ===================== */

  /**
   * 校验 23：数据库访问抛出异常时向上抛出，由全局异常处理器转换为 500
   * 对应详细设计第 6 章「数据库连接失败」。
   */
  @Test
  @DisplayName("系统异常：数据库访问异常向上抛出，交由全局异常处理器返回 500")
  void login_databaseError_throwsException() {
    // Arrange：Mapper 查询抛出数据库异常
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenThrow(new RuntimeException("Communications link failure"));

    // Act & Assert：业务层不吞异常，直接向上抛出
    RuntimeException exception = org.junit.jupiter.api.Assertions.assertThrows(
        RuntimeException.class, () -> authenticationService.login(request));
    assertThat(exception.getMessage(), containsString("Communications link failure"));
  }

  /**
   * 校验 24：权限查询异常时同样向上抛出，不返回半成品响应
   */
  @Test
  @DisplayName("系统异常：权限查询异常时向上抛出")
  void login_authQueryError_throwsException() {
    // Arrange：用户查询正常，但权限查询抛出异常
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, VALID_PASSWORD, "Administrator"));
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID))
        .thenThrow(new RuntimeException("Table 'HDOC_FUNCTION_AUTH' doesn't exist"));

    // Act & Assert：异常向上抛出
    org.junit.jupiter.api.Assertions.assertThrows(
        RuntimeException.class, () -> authenticationService.login(request));
  }

  /* ===================== 安全性与返回值完整性 ===================== */

  /**
   * 校验 25：认证失败时响应体中不包含密码等敏感信息
   */
  @Test
  @DisplayName("安全性：认证失败时 data 为 null，不返回敏感信息")
  void login_failure_doesNotExposeSensitiveData() {
    // Arrange：密码错误场景
    LoginRequest request = new LoginRequest(VALID_USERID, "WrongPass1!");
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, VALID_PASSWORD, "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：data 必须为 null，消息中不包含数据库密码
    assertThat(result.getData(), nullValue());
    assertThat(result.getMessage().contains(VALID_PASSWORD), is(false));
  }

  /**
   * 校验 26：响应消息文案与详细设计完全一致（前端直接展示后端消息）
   */
  @Test
  @DisplayName("契约一致性：401 / 403 消息文案与详细设计完全一致")
  void login_errorMessages_matchDesignDocument() {
    // Arrange：分别准备用户不存在与账号锁定两种场景
    LoginRequest notFoundRequest = new LoginRequest("nouser", VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid("nouser")).thenReturn(null);

    // Act：调用登录方法
    ApiResult<LoginResponse> notFoundResult = authenticationService.login(notFoundRequest);

    // Assert：401 消息与设计书一致
    assertThat(notFoundResult.getMessage(),
        is("We didn't recognize the username or password you entered. Please try again."));

    // Arrange：账号锁定场景
    LoginRequest lockedRequest = new LoginRequest(VALID_USERID, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "LOCKED_x", "Administrator"));

    // Act：调用登录方法
    ApiResult<LoginResponse> lockedResult = authenticationService.login(lockedRequest);

    // Assert：403 消息与设计书一致
    assertThat(lockedResult.getMessage(),
        is("Your account is locked. Please contact your system administrator."));
  }

  /**
   * 校验 27：SQL 注入字符串被格式校验拦截，不会进入数据库层
   */
  @Test
  @DisplayName("安全性：SQL 注入字符串被格式校验拦截，未执行拼接 SQL")
  void login_queryUsesParameterizedUserid() {
    // Arrange：UserID 含注入片段，且长度控制在 10 位以内以命中格式校验
    LoginRequest request = new LoginRequest("admin'or'1", VALID_PASSWORD);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：非法字符（单引号）被格式校验拦截，未触碰数据库
    assertThat(result.getMessage(), is(MessageConstants.USERID_FORMAT));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 28：认证成功后权限列表顺序与数据库返回顺序一致
   */
  @Test
  @DisplayName("认证成功：功能权限顺序与数据库返回顺序一致")
  void login_success_preservesFunctionOrder() {
    // Arrange：数据库返回两个功能权限
    LoginRequest request = new LoginRequest(VALID_USERID, VALID_PASSWORD);
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, VALID_PASSWORD, "Administrator"));

    List<HdocFunctionAuth> authList = new ArrayList<>();
    HdocFunctionAuth first = new HdocFunctionAuth();
    first.setFunction("UD01");
    HdocFunctionAuth second = new HdocFunctionAuth();
    second.setFunction("UD12");
    authList.add(first);
    authList.add(second);
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID)).thenReturn(authList);

    // Act：调用登录方法
    ApiResult<LoginResponse> result = authenticationService.login(request);

    // Assert：顺序保持为 UD01、UD12
    assertThat(result.getData().getFunctions().get(0), is("UD01"));
    assertThat(result.getData().getFunctions().get(1), is("UD12"));
  }
}
