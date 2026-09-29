package com.web.app.tool;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Token 生成工具类
 * 采用 HmacSHA256 对「userid + username + 时间戳」签名生成令牌，
 * 避免引入额外的 JWT 依赖，同时保证令牌不可伪造。
 *
 * @author GitHub Copilot
 */
@Component
public class TokenTool {

  /** 签名算法 */
  private static final String ALGORITHM = "HmacSHA256";

  /** 签名密钥（生产环境应通过环境变量注入） */
  @Value("${app.token.secret:edb-engineering-database-secret-key}")
  private String secret;

  /** Token 有效期（毫秒），默认 2 小时 */
  @Value("${app.token.expire:7200000}")
  private long expireMillis;

  /**
   * 生成 Token
   *
   * @param userid   用户ID
   * @param username 用户名
   * @return Base64 编码的 Token 字符串
   */
  public String generateToken(String userid, String username) {
    long timestamp = System.currentTimeMillis();
    String payload = userid + "|" + username + "|" + timestamp;
    String signature = sign(payload);
    String raw = payload + "|" + signature;
    return Base64.getUrlEncoder().withoutPadding()
        .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }

  /**
   * 校验 Token 是否合法且未过期
   *
   * @param token 待校验的 Token
   * @return 合法返回 true
   */
  public boolean validateToken(String token) {
    if (token == null || token.isEmpty()) {
      return false;
    }
    try {
      String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
      // 格式：userid|username|timestamp|signature
      String[] parts = raw.split("\\|");
      if (parts.length != 4) {
        return false;
      }
      String payload = parts[0] + "|" + parts[1] + "|" + parts[2];
      // 校验签名
      if (!sign(payload).equals(parts[3])) {
        return false;
      }
      // 校验有效期
      long timestamp = Long.parseLong(parts[2]);
      return System.currentTimeMillis() - timestamp <= expireMillis;
    } catch (RuntimeException exception) {
      // Token 格式非法（Base64 解码失败、数字解析失败等）视为校验不通过
      return false;
    }
  }

  /**
   * 使用 HmacSHA256 计算签名
   *
   * @param payload 待签名内容
   * @return Base64 编码的签名
   */
  private String sign(String payload) {
    try {
      Mac mac = Mac.getInstance(ALGORITHM);
      SecretKeySpec keySpec =
          new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM);
      mac.init(keySpec);
      byte[] bytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    } catch (NoSuchAlgorithmException | InvalidKeyException exception) {
      // 算法或密钥异常属于系统级异常，转换为运行时异常由全局异常处理器统一处理
      throw new IllegalStateException("Token 生成失败", exception);
    }
  }
}
