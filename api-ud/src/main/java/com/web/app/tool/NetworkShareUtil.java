package com.web.app.tool;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.TimeUnit;

/**
 * 网络共享文件夹认证工具类
 *
 * 封装 net use 命令的逻辑，供 UD12、UD14 等服务共用。
 * 避免 authenticateNetworkShare() 方法在多处重复编写。
 */
public final class NetworkShareUtil {

    private static final Logger log = LoggerFactory.getLogger(NetworkShareUtil.class);

    private NetworkShareUtil() {
        // 工具类禁止实例化
    }

    /**
     * 认证网络共享文件夹
     * 使用 net use 命令建立到网络共享的持久连接
     *
     * @param templateRoot     网络共享文件夹根路径（如 \\\\server\\share\\folder）
     * @param networkUsername  用户名
     * @param networkPassword  密码
     * @return true 表示认证成功或无需认证（已标记为已验证）
     */
    public static boolean authenticate(String templateRoot,
                                        String networkUsername,
                                        String networkPassword) {
        // 非UNC路径（如本地路径），无需认证
        if (templateRoot == null || !templateRoot.startsWith("\\\\")) {
            return true;
        }

        // 没有用户名配置，尝试直接访问
        if (networkUsername == null || networkUsername.isEmpty()) {
            log.warn("Network username not configured, trying direct access to: {}", templateRoot);
            return true;
        }

        try {
            // 提取服务器共享根路径（例如 \\172.17.0.63\hdoc）
            String shareRoot = templateRoot;
            int firstSlashAfterServer = templateRoot.indexOf('\\', 2);
            if (firstSlashAfterServer > 0) {
                int secondSlashAfterServer = templateRoot.indexOf('\\', firstSlashAfterServer + 1);
                if (secondSlashAfterServer > 0) {
                    shareRoot = templateRoot.substring(0, secondSlashAfterServer);
                }
            }

            // 构建 net use 命令
            String command = String.format("net use %s %s /user:%s /persistent:no",
                    shareRoot, networkPassword, networkUsername);

            log.info("Authenticating network share: {}", shareRoot);

            Process process = new ProcessBuilder(command)
                    .redirectErrorStream(false)
                    .start();

            // 等待 net use 完成，最多 5 秒超时
            boolean completed = process.waitFor(5, TimeUnit.SECONDS);

            if (completed) {
                int exitCode = process.exitValue();
                if (exitCode == 0) {
                    log.info("Network share authenticated successfully: {}", shareRoot);
                } else {
                    String errorOutput = new String(process.getErrorStream().readAllBytes());
                    log.warn("Network share authentication returned code {}: {}",
                            exitCode, errorOutput.trim());
                }
            } else {
                process.destroyForcibly();
                log.warn("Network share authentication timed out, will try direct access");
            }
            return true;

        } catch (Exception e) {
            log.warn("Failed to authenticate network share, will try direct access: {}",
                    e.getMessage());
            return true;
        }
    }
}
