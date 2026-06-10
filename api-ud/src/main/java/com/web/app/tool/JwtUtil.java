package com.web.app.tool;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.UUID;

/**
 * JWT工具类
 * 注意：当前为简化实现，生产环境建议使用jjwt等标准库
 */
@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret:hdoc-secret-key}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private long expiration;

    /**
     * 生成Token
     *
     * @param userId   用户ID
     * @param username 用户名
     * @return Token字符串
     */
    public String generateToken(String userId, String username) {
        long currentTime = System.currentTimeMillis();
        String payload = userId + ":" + username + ":" + currentTime + ":" + (currentTime + expiration);
        String signature = Base64.getEncoder().encodeToString((payload + ":" + secret).getBytes());
        return Base64.getEncoder().encodeToString(payload.getBytes()) + "." + signature;
    }

    /**
     * 从Token中提取用户ID
     *
     * @param token Token字符串
     * @return 用户ID
     */
    public String getUserIdFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length == 2) {
                byte[] decoded = Base64.getDecoder().decode(parts[0]);
                String payload = new String(decoded);
                return payload.split(":")[0];
            }
        } catch (Exception e) {
            logger.error("解析Token失败", e);
        }
        return null;
    }

    /**
     * 验证Token是否有效
     *
     * @param token Token字符串
     * @return 是否有效
     */
    public boolean validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) {
                return false;
            }
            String expectedSignature = Base64.getEncoder().encodeToString(
                    (new String(Base64.getDecoder().decode(parts[0])) + ":" + secret).getBytes());
            return expectedSignature.equals(parts[1]);
        } catch (Exception e) {
            logger.error("验证Token失败", e);
            return false;
        }
    }
}
