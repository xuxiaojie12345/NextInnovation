package com.web.app.tool;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.hamcrest.CoreMatchers.containsString;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.not;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.MatcherAssert.assertThat;

/**
 * TokenTool 单元测试
 * 验证 HmacSHA256 令牌的生成与校验逻辑，覆盖正常场景与各类异常边界。
 * 测试方法遵循 AAA（Arrange-Act-Assert）模式，各方法相互独立。
 *
 * <p>说明：TokenTool 通过 {@code @Value} 注入 secret 与 expireMillis，
 * 单元测试中不启动 Spring 容器，改用 ReflectionTestUtils 直接注入字段值，
 * 以便精确控制密钥与有效期边界。</p>
 *
 * @author GitHub Copilot
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TokenToolTest {

  /** 被测试的 Token 工具类 */
  private TokenTool tokenTool;

  /** 测试用签名单引 */
  private static final String TEST_SECRET = "unit-test-secret-key-0001";

  /** 测试用有效期（毫秒）：默认 2 小时 */
  private static final long TEST_EXPIRE_MILLIS = 7200000L;

  /** 测试用 UserID */
  private static final String TEST_USERID = "admin";

  /** 测试用用户名 */
  private static final String TEST_USERNAME = "Administrator";

  /** 每个测试方法执行前的公共初始化：构造实例并注入配置项 */
  @BeforeEach
  void setUp() {
    tokenTool = new TokenTool();
    ReflectionTestUtils.setField(tokenTool, "secret", TEST_SECRET);
    ReflectionTestUtils.setField(tokenTool, "expireMillis", TEST_EXPIRE_MILLIS);
  }

  /**
   * 构造指定载荷与有效期的原始 Token 字符串
   * 用于模拟签名错误、过期、格式非法等异常输入。
   *
   * @param userid      用户ID
   * @param username    用户名
   * @param timestamp   时间戳
   * @param signature   签名部分
   * @return Base64 URL 编码的 Token
   */
  private String buildRawToken(String userid, String username, String timestamp,
      String signature) {
    String raw = userid + "|" + username + "|" + timestamp + "|" + signature;
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }

  /**
   * 构造仅含任意部分的 Token（段数不足 4），用于验证格式校验分支。
   *
   * @param raw 未编码的原始字符串
   * @return Base64 URL 编码的 Token
   */
  private String encodeRaw(String raw) {
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }

  /* ===================== 正常场景 ===================== */

  /**
   * 校验 1：生成 Token 成功
   * 正常输入应返回非空字符串，且可通过 validateToken 校验。
   */
  @Test
  @DisplayName("生成 Token：正常输入返回非空且可自校验通过的 Token")
  void generateToken_normalInput_returnsValidToken() {
    // Arrange & Act
    String token = tokenTool.generateToken(TEST_USERID, TEST_USERNAME);

    // Assert
    assertThat("Token 不应为空", token, notNullValue());
    assertThat("Token 不应为空串", token.isEmpty(), is(false));
    assertThat("自生成 Token 应校验通过", tokenTool.validateToken(token), is(true));
  }

  /**
   * 校验 2：Token 结构正确
   * 解码后应为「userid|username|timestamp|signature」四段结构，且各段取值正确。
   */
  @Test
  @DisplayName("生成 Token：解码后为四段结构且 userid/username 正确")
  void generateToken_decodedPayload_hasFourParts() {
    // Arrange & Act
    String token = tokenTool.generateToken(TEST_USERID, TEST_USERNAME);
    String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
    String[] parts = raw.split("\\|");

    // Assert
    assertThat("解码后应为四段", parts.length, is(4));
    assertThat("第 1 段应为 UserID", parts[0], is(TEST_USERID));
    assertThat("第 2 段应为用户名", parts[1], is(TEST_USERNAME));
  }

  /**
   * 校验 3：Token 随签发时刻变化
   * 载荷中包含毫秒级时间戳，因此不同时刻签发的 Token 应不相同，可用于防重放。
   */
  @Test
  @DisplayName("生成 Token：不同时刻生成结果不同（含时间戳，防重放）")
  void generateToken_differentTimestamp_producesDifferentTokens() {
    // Arrange：用不同时间戳构造带真实签名的 Token，避免依赖真实时钟精度
    String first = buildSignedToken(TEST_USERID, TEST_USERNAME, "1700000000000");
    String second = buildSignedToken(TEST_USERID, TEST_USERNAME, "1700000000001");

    // Assert
    assertThat("不同时间戳的两个 Token 不应相同", second, is(not(first)));
  }

  /**
   * 校验 4：同一时刻签发的 Token 具备确定性
   * 相同载荷 + 相同时间戳 + 相同密钥 ⇒ 相同签名（HMAC 的确定性特征）。
   */
  @Test
  @DisplayName("生成 Token：相同载荷与时间戳时签名结果一致")
  void generateToken_sameTimestamp_producesSameToken() {
    // Arrange & Act
    String first = buildSignedToken(TEST_USERID, TEST_USERNAME, "1700000000000");
    String second = buildSignedToken(TEST_USERID, TEST_USERNAME, "1700000000000");

    // Assert
    assertThat("相同输入的 Token 应一致", second, is(first));
  }

  /**
   * 校验 5：不同用户生成不同 Token
   */
  @Test
  @DisplayName("生成 Token：不同 UserID 生成的 Token 不同")
  void generateToken_differentUserid_producesDifferentTokens() {
    // Arrange & Act
    String tokenOfAdmin = buildSignedToken("admin", TEST_USERNAME, "1700000000000");
    String tokenOfGuest = buildSignedToken("guest", TEST_USERNAME, "1700000000000");

    // Assert
    assertThat("不同用户 Token 不应相同", tokenOfGuest, is(not(tokenOfAdmin)));
  }

  /**
   * 校验 6：UserID 与用户名互换后 Token 不同
   * 验证分隔符拼接顺序正确，不存在字段错位导致的可伪造问题。
   */
  @Test
  @DisplayName("生成 Token：userid 与 username 互换后 Token 不同")
  void generateToken_useridUsernameSwapped_producesDifferentTokens() {
    // Arrange & Act
    String tokenA = buildSignedToken("alpha", "beta", "1700000000000");
    String tokenB = buildSignedToken("beta", "alpha", "1700000000000");

    // Assert
    assertThat("字段顺序不同应产生不同 Token", tokenB, is(not(tokenA)));
  }

  /**
   * 校验 7：签名不可伪造
   * 篡改任一字段后，原签名无法匹配，validateToken 必须返回 false。
   */
  @Test
  @DisplayName("校验 Token：篡改 userid 后签名不匹配，返回 false")
  void validateToken_tamperedUserid_returnsFalse() {
    // Arrange
    String token = tokenTool.generateToken(TEST_USERID, TEST_USERNAME);
    String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
    String[] parts = raw.split("\\|");
    // 保留原签名，但把 userid 换成 hacker
    String tampered = buildRawToken("hacker", parts[1], parts[2], parts[3]);

    // Act
    boolean actual = tokenTool.validateToken(tampered);

    // Assert
    assertThat("篡改 userid 后应校验失败", actual, is(false));
  }

  /**
   * 校验 7：篡改用户名后校验失败
   */
  @Test
  @DisplayName("校验 Token：篡改 username 后签名不匹配，返回 false")
  void validateToken_tamperedUsername_returnsFalse() {
    // Arrange
    String token = tokenTool.generateToken(TEST_USERID, TEST_USERNAME);
    String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
    String[] parts = raw.split("\\|");
    String tampered = buildRawToken(parts[0], "hacker", parts[2], parts[3]);

    // Act
    boolean actual = tokenTool.validateToken(tampered);

    // Assert
    assertThat("篡改 username 后应校验失败", actual, is(false));
  }

  /**
   * 校验 8：替换签名后校验失败
   */
  @Test
  @DisplayName("校验 Token：签名被替换为非法值时返回 false")
  void validateToken_invalidSignature_returnsFalse() {
    // Arrange
    String token = tokenTool.generateToken(TEST_USERID, TEST_USERNAME);
    String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
    String[] parts = raw.split("\\|");
    String tampered = buildRawToken(parts[0], parts[1], parts[2], "invalid-signature-value");

    // Act
    boolean actual = tokenTool.validateToken(tampered);

    // Assert
    assertThat("签名非法应校验失败", actual, is(false));
  }

  /**
   * 校验 9：不同密钥签发的 Token 无法通过校验
   * 验证签名确实与 secret 绑定，换密钥后旧 Token 立即失效。
   */
  @Test
  @DisplayName("校验 Token：使用其他密钥签发的 Token 返回 false")
  void validateToken_signedWithDifferentSecret_returnsFalse() {
    // Arrange
    TokenTool otherTool = new TokenTool();
    ReflectionTestUtils.setField(otherTool, "secret", "another-secret-key-9999");
    ReflectionTestUtils.setField(otherTool, "expireMillis", TEST_EXPIRE_MILLIS);
    String foreignToken = otherTool.generateToken(TEST_USERID, TEST_USERNAME);

    // Act
    boolean actual = tokenTool.validateToken(foreignToken);

    // Assert
    assertThat("异密钥 Token 应校验失败", actual, is(false));
    assertThat("异密钥签发方自身应可校验通过",
        otherTool.validateToken(foreignToken), is(true));
  }

  /* ===================== 有效期边界 ===================== */

  /**
   * 校验 10：未过期的 Token 通过校验（有效期内）
   * 用真实签名构造「1 小时前」签发的 Token，验证时间分支。
   */
  @Test
  @DisplayName("校验 Token：有效期内（时间戳为 1 小时前）返回 true")
  void validateToken_withinExpirePeriod_returnsTrue() {
    // Arrange
    long oneHourAgo = System.currentTimeMillis() - 3600000L;
    String realToken = buildSignedToken(TEST_USERID, TEST_USERNAME,
        String.valueOf(oneHourAgo));

    // Act
    boolean actual = tokenTool.validateToken(realToken);

    // Assert
    assertThat("有效期内应校验通过", actual, is(true));
  }

  /**
   * 校验 11：已过期的 Token 校验失败
   * 时间戳早于 expireMillis（2 小时）时，必须判定为失效。
   */
  @Test
  @DisplayName("校验 Token：已过期（时间戳为 3 小时前）返回 false")
  void validateToken_expired_returnsFalse() {
    // Arrange
    long threeHoursAgo = System.currentTimeMillis() - 10800000L;
    String expiredToken = buildSignedToken(TEST_USERID, TEST_USERNAME,
        String.valueOf(threeHoursAgo));

    // Act
    boolean actual = tokenTool.validateToken(expiredToken);

    // Assert
    assertThat("过期 Token 应校验失败", actual, is(false));
  }

  /**
   * 校验 12：时间戳为未来值时的边界处理
   * 时间戳在未来时，差值为负数，必然小于等于 expireMillis，属边界内的宽松处理；
   * 此处验证不会抛异常且行为确定。
   */
  @Test
  @DisplayName("校验 Token：时间戳为未来值时按未过期处理，返回 true")
  void validateToken_futureTimestamp_treatedAsValid() {
    // Arrange
    long oneHourLater = System.currentTimeMillis() + 3600000L;
    String futureToken = buildSignedToken(TEST_USERID, TEST_USERNAME,
        String.valueOf(oneHourLater));

    // Act
    boolean actual = tokenTool.validateToken(futureToken);

    // Assert
    assertThat("未来时间戳差值 <= 有效期，应返回 true", actual, is(true));
  }

  /**
   * 校验 13：自定义较短有效期生效
   * 将有效期改为 1 秒，验证配置项确实参与判断。
   */
  @Test
  @DisplayName("校验 Token：有效期为 1 秒时，5 秒前的 Token 失效")
  void validateToken_shortExpireMillis_returnsFalse() {
    // Arrange
    ReflectionTestUtils.setField(tokenTool, "expireMillis", 1000L);
    long fiveSecondsAgo = System.currentTimeMillis() - 5000L;
    String token = buildSignedToken(TEST_USERID, TEST_USERNAME,
        String.valueOf(fiveSecondsAgo));

    // Act
    boolean actual = tokenTool.validateToken(token);

    // Assert
    assertThat("超出 1 秒有效期应校验失败", actual, is(false));
  }

  /* ===================== 异常 / 边界输入 ===================== */

  /**
   * 校验 14：null 输入返回 false
   */
  @Test
  @DisplayName("校验 Token：入参为 null 时返回 false，不抛异常")
  void validateToken_null_returnsFalse() {
    // Arrange & Act
    boolean actual = tokenTool.validateToken(null);

    // Assert
    assertThat("null 应返回 false", actual, is(false));
  }

  /**
   * 校验 15：空字符串输入返回 false
   */
  @Test
  @DisplayName("校验 Token：入参为空串时返回 false")
  void validateToken_emptyString_returnsFalse() {
    // Arrange & Act
    boolean actual = tokenTool.validateToken("");

    // Assert
    assertThat("空串应返回 false", actual, is(false));
  }

  /**
   * 校验 16：非 Base64 字符输入返回 false（解码异常分支）
   */
  @Test
  @DisplayName("校验 Token：非法 Base64 字符入返回 false，不抛异常")
  void validateToken_malformedBase64_returnsFalse() {
    // Arrange & Act
    boolean actual = tokenTool.validateToken("!!!not-a-base64-string!!!");

    // Assert
    assertThat("非法 Base64 应返回 false", actual, is(false));
  }

  /**
   * 校验 17：分段数不足 4 时返回 false
   */
  @Test
  @DisplayName("校验 Token：分段数不足 4 时返回 false")
  void validateToken_tooFewParts_returnsFalse() {
    // Arrange
    String onlyThreeParts = encodeRaw("admin|Administrator|1234567890");
    String onlyOnePart = encodeRaw("admin");

    // Act & Assert
    assertThat("三段应返回 false", tokenTool.validateToken(onlyThreeParts), is(false));
    assertThat("一段应返回 false", tokenTool.validateToken(onlyOnePart), is(false));
  }

  /**
   * 校验 18：分段数超过 4 时返回 false
   * 防止通过额外拼接「|」绕过格式校验。
   */
  @Test
  @DisplayName("校验 Token：分段数超过 4 时返回 false")
  void validateToken_tooManyParts_returnsFalse() {
    // Arrange
    String fiveParts = encodeRaw("admin|Administrator|1234567890|sig|extra");

    // Act
    boolean actual = tokenTool.validateToken(fiveParts);

    // Assert
    assertThat("五段应返回 false", actual, is(false));
  }

  /**
   * 校验 19：时间戳非数字时返回 false（数字解析异常分支）
   */
  @Test
  @DisplayName("校验 Token：时间戳非数字时返回 false，不抛异常")
  void validateToken_nonNumericTimestamp_returnsFalse() {
    // Arrange
    String token = encodeRaw("admin|Administrator|not-a-number|dummy-signature");

    // Act
    boolean actual = tokenTool.validateToken(token);

    // Assert
    assertThat("非数字时间戳应返回 false", actual, is(false));
  }

  /**
   * 校验 20：空 userid / 空 username 仍能正常生成与校验
   * 验证边界输入不会导致异常，签名字段为空串时行为一致。
   */
  @Test
  @DisplayName("生成并校验：空 userid 与空 username 组合仍可自校验通过")
  void generateAndValidate_emptyFields_stillValid() {
    // Arrange & Act
    String token = tokenTool.generateToken("", "");

    // Assert
    assertThat("空字段组合仍应生成 Token", token, notNullValue());
    assertThat("空字段组合 Token 应可校验", tokenTool.validateToken(token), is(true));
  }

  /**
   * 校验 21：包含特殊字符的用户名可正常处理
   * 验证 UTF-8 编码与 Base64 URL 编码对中文/特殊字符的兼容性。
   */
  @Test
  @DisplayName("生成并校验：含中文与特殊字符的用户名可正常处理")
  void generateAndValidate_specialCharacters_works() {
    // Arrange
    String specialUsername = "管理者#01@テスト";

    // Act
    String token = tokenTool.generateToken(TEST_USERID, specialUsername);

    // Assert
    assertThat("应可校验通过", tokenTool.validateToken(token), is(true));
    String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
    assertThat("解码后应包含原用户名", raw, containsString(specialUsername));
  }

  /**
   * 校验 22：Token 中不含 Base64 补位符「=」
   * 确保使用 withoutPadding()，避免 URL 传输时被转义。
   */
  @Test
  @DisplayName("生成 Token：结果不含 Base64 补位符 '='（URL 安全）")
  void generateToken_noPadding_returnsUrlSafeToken() {
    // Arrange & Act
    String token = tokenTool.generateToken(TEST_USERID, TEST_USERNAME);

    // Assert
    assertThat("不应包含 '=' 补位符", token, not(containsString("=")));
    assertThat("不应包含 '+' 或 '/'（非 URL 安全字符）", token, not(containsString("+")));
    assertThat("不应包含 '/'（非 URL 安全字符）", token, not(containsString("/")));
  }

  /**
   * 使用当前配置的密钥为给定载荷生成带真实签名的 Token。
   * 借助被测对象的私有签名逻辑：通过反射调用 sign 方法，保证与生产逻辑一致。
   *
   * @param userid    用户ID
   * @param username  用户名
   * @param timestamp 时间戳字符串
   * @return 带正确签名的 Token
   */
  private String buildSignedToken(String userid, String username, String timestamp) {
    String payload = userid + "|" + username + "|" + timestamp;
    String signature = ReflectionTestUtils.invokeMethod(tokenTool, "sign", payload);
    return buildRawToken(userid, username, timestamp, signature);
  }

  /**
   * 校验 23：签名算法固定为 HmacSHA256（回归保护）
   * 若后续误改为其他算法，本用例可及时发现。
   */
  @Test
  @DisplayName("签名算法：同一载荷下签名长度稳定（HmacSHA256 → 32 字节 → 43 字符）")
  void sign_hmacSha256_producesStableLength() {
    // Arrange & Act
    String token = buildSignedToken(TEST_USERID, TEST_USERNAME, "1700000000000");
    String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
    String[] parts = raw.split("\\|");

    // Assert：HmacSHA256 输出 32 字节，Base64 URL 无补位编码后为 43 字符
    assertThat("签名段长度应为 43 字符", parts[3].length(), is(43));
  }
}
