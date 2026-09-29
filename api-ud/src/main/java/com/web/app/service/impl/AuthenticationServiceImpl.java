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
import com.web.app.service.AuthenticationService;
import com.web.app.tool.TokenTool;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 认证服务实现类
 * 详细设计 4.1 处理流程的实现：
 * 1. 参数 trim 与非空校验
 * 2. 格式与长度校验
 * 3. 查询用户信息 → 判断用户是否存在
 * 4. 密码比对 → 判断密码是否正确
 * 5. 账号锁定判定（403）
 * 6. 生成 Token 并返回用户基础信息
 *
 * @author GitHub Copilot
 */
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

  /** 日志对象 */
  private static final Logger logger = LogManager.getLogger(AuthenticationServiceImpl.class);

  /** UserID 合法字符正则：仅半角英数字 */
  private static final Pattern USERID_PATTERN = Pattern.compile("^[a-zA-Z0-9]+$");

  /** Password 合法字符正则：ASCII 可见字符（! 到 ~，不含空白） */
  private static final Pattern PASSWORD_PATTERN = Pattern.compile("^[!-~]+$");

  /** UserID 最大长度 */
  private static final int USERID_MAX_LENGTH = 10;

  /** Password 最大长度 */
  private static final int PASSWORD_MAX_LENGTH = 32;

  /** 账户锁定标志：数据库中密码字段以该前缀开头表示账号被锁定 */
  private static final String LOCKED_PASSWORD_PREFIX = "LOCKED";

  /** 数据访问对象 */
  @Resource
  private AuthenticationMapper authenticationMapper;

  /** Token 工具类 */
  @Resource
  private TokenTool tokenTool;

  /**
   * 用户登录认证
   *
   * @param request 登录请求对象
   * @return 统一格式的认证结果
   */
  @Override
  public ApiResult<LoginResponse> login(LoginRequest request) {
    // 步骤 1：获取 UserID / Password 并执行 trim（详细设计 4.1 前置处理）
    String userid = normalize(request == null ? null : request.getUserid());
    String password = normalize(request == null ? null : request.getPassword());

    // 步骤 2：空值校验，不通过则直接返回参数异常响应，不查询数据库
    String requiredMessage = validateRequired(userid, password);
    if (requiredMessage != null) {
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, requiredMessage);
    }

    // 步骤 3：格式与长度校验
    String formatMessage = validateFormat(userid, password);
    if (formatMessage != null) {
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, formatMessage);
    }

    // 步骤 4：根据用户ID查询用户信息（参数化查询，防止 SQL 注入）
    HdocUserInfor user = authenticationMapper.selectUserByUserid(userid);

    // 步骤 5：判断用户是否存在，不存在返回 401（避免暴露账号是否存在，使用统一文案）
    if (user == null) {
      logger.warn("认证失败：用户不存在, userid = {}", userid);
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.INVALID_CREDENTIALS);
    }

    // 步骤 6：账号锁定判定（详细设计 4.1 结果处理 403）
    if (isAccountLocked(user)) {
      logger.warn("认证失败：账户已锁定, userid = {}", userid);
      return ApiResult.failure(ApiCode.ACCOUNT_LOCKED, MessageConstants.ACCOUNT_LOCKED);
    }

    // 步骤 7：密码比对（详细设计 7.2：日志中禁止输出明文密码）
    if (!isPasswordMatched(password, user.getPassword())) {
      logger.warn("认证失败：密码不正确, userid = {}", userid);
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.INVALID_CREDENTIALS);
    }

    // 步骤 8：认证通过，生成 Token 并构建响应数据
    String token = tokenTool.generateToken(user.getUserid(), user.getUsername());
    LoginResponse response = new LoginResponse();
    response.setUserid(user.getUserid());
    response.setUsername(user.getUsername());
    response.setToken(token);
    response.setFunctions(loadFunctions(user.getUserid()));
    response.setMarkets(loadMarkets(user.getUserid()));

    logger.info("认证成功, userid = {}", user.getUserid());
    return ApiResult.success(response);
  }

  /**
   * 去除字符串首尾空格
   *
   * @param value 原始值
   * @return 去空格后的值；入参为 null 时返回空字符串
   */
  private String normalize(String value) {
    return value == null ? "" : value.trim();
  }

  /**
   * 空值校验（详细设计 4.2 No.1 / No.2）
   *
   * @param userid   用户ID
   * @param password 密码
   * @return 校验不通过返回错误消息；通过返回 null
   */
  private String validateRequired(String userid, String password) {
    if (!StringUtils.hasText(userid) || !StringUtils.hasText(password)) {
      return MessageConstants.REQUIRED;
    }
    return null;
  }

  /**
   * 格式与长度校验（详细设计 4.2 No.3 / No.4）
   *
   * @param userid   用户ID
   * @param password 密码
   * @return 校验不通过返回错误消息；通过返回 null
   */
  private String validateFormat(String userid, String password) {
    if (userid.length() > USERID_MAX_LENGTH) {
      return MessageConstants.USERID_LENGTH;
    }
    if (!USERID_PATTERN.matcher(userid).matches()) {
      return MessageConstants.USERID_FORMAT;
    }
    if (password.length() > PASSWORD_MAX_LENGTH) {
      return MessageConstants.PASSWORD_LENGTH;
    }
    if (!PASSWORD_PATTERN.matcher(password).matches()) {
      return MessageConstants.PASSWORD_FORMAT;
    }
    return null;
  }

  /**
   * 账号锁定判定
   * 约定：数据库中密码字段以 LOCKED 前缀开头表示该账号已锁定。
   *
   * @param user 用户信息实体
   * @return 已锁定返回 true
   */
  private boolean isAccountLocked(HdocUserInfor user) {
    String storedPassword = user.getPassword();
    return storedPassword != null && storedPassword.startsWith(LOCKED_PASSWORD_PREFIX);
  }

  /**
   * 密码比对
   * 当前为明文比对（开发阶段），生产环境应替换为 BCrypt 等单向哈希比对。
   *
   * @param inputPassword  前端输入密码
   * @param storedPassword 数据库存储密码
   * @return 一致返回 true
   */
  private boolean isPasswordMatched(String inputPassword, String storedPassword) {
    return storedPassword != null && storedPassword.equals(inputPassword);
  }

  /**
   * 查询用户功能权限
   *
   * @param userid 用户ID
   * @return 功能权限名列表；查询失败或无数据时返回空列表
   */
  private List<String> loadFunctions(String userid) {
    List<String> functions = new ArrayList<>();
    List<HdocFunctionAuth> authList = authenticationMapper.selectFunctionAuthByUserid(userid);
    if (authList != null) {
      for (HdocFunctionAuth auth : authList) {
        functions.add(auth.getFunction());
      }
    }
    return functions;
  }

  /**
   * 查询用户市场权限
   *
   * @param userid 用户ID
   * @return 市场代码列表；查询失败或无数据时返回空列表
   */
  private List<String> loadMarkets(String userid) {
    List<String> markets = new ArrayList<>();
    List<HdocMarketAuth> authList = authenticationMapper.selectMarketAuthByUserid(userid);
    if (authList != null) {
      for (HdocMarketAuth auth : authList) {
        markets.add(auth.getMarket());
      }
    }
    return markets;
  }
}
