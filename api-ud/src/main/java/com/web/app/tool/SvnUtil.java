package com.web.app.tool;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * SVN 操作工具类
 * 通过命令行执行 SVN 操作（checkout、mkdir、add、commit、list、delete 等）
 * 
 * SVN 仓库地址：https://172.17.0.63:3307/svn/React2024SVN/99_個人フォルダ/wangjing/UD12_Upload&DeleteTemplate
 * 
 * 实现注意事项：
 * - 所有 SVN 操作通过命令行执行，不引入 SVNKit 库
 * - 使用 --non-interactive --trust-server-cert 选项跳过证书验证
 * - 工作副本目录临时存放于 ${svn.working.copy.path}
 */
@Component
public class SvnUtil {

    private static final Logger logger = LogManager.getLogger(SvnUtil.class);

    @Value("${svn.repo.url}")
    private String svnRepoUrl;

    @Value("${svn.username}")
    private String svnUsername;

    @Value("${svn.password}")
    private String svnPassword;

    @Value("${svn.working.copy.path}")
    private String workingCopyPath;

    /**
     * 获取 SVN 基础命令前缀
     */
    private String[] getSvnBaseCommand() {
        return new String[]{
            "svn",
            "--non-interactive",
            "--trust-server-cert",
            "--username", svnUsername,
            "--password", svnPassword
        };
    }

    /**
     * 获取 SVN 仓库下指定 Market 的完整远程路径
     * @param market 市场代码（如 JPN）
     * @return 完整远程路径
     */
    private String getMarketRemotePath(String market) {
        return svnRepoUrl + "/" + market;
    }

    /**
     * 获取工作副本中指定 Market 的本地路径
     * @param market 市场代码
     * @return 本地路径
     */
    private String getMarketLocalPath(String market) {
        return workingCopyPath + "/" + market;
    }

    /**
     * 执行命令行命令并返回输出结果
     * @param cmd 命令数组
     * @return 命令输出
     * @throws IOException 执行失败时抛出
     * @throws InterruptedException 线程中断时抛出
     */
    private String executeCommand(String... cmd) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();
        logger.info("SVN command executed. Exit code: {}. Output: {}", exitCode, output.toString().trim());

        if (exitCode != 0) {
            throw new IOException("SVN command failed with exit code " + exitCode + ": " + output.toString().trim());
        }

        return output.toString().trim();
    }

    /**
     * 列出 SVN 仓库根目录下的所有 Market 文件夹
     * @return Market 列表（如 ["JPN", "CHN", "USD"]）
     * @throws Exception 操作失败时抛出
     */
    public List<String> listMarketsFromSvn() throws Exception {
        try {
            String[] cmd = { "svn", "list", svnRepoUrl, "--non-interactive", "--trust-server-cert",
                             "--username", svnUsername, "--password", svnPassword };
            String output = executeCommand(cmd);

            List<String> markets = new ArrayList<>();
            for (String line : output.split("\n")) {
                String trimmed = line.trim();
                // SVN list 返回的目录末尾带 "/"
                if (trimmed.endsWith("/")) {
                    markets.add(trimmed.substring(0, trimmed.length() - 1));
                }
            }
            return markets;
        } catch (Exception e) {
            logger.error("Failed to list markets from SVN: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * 列出指定 Market 下的所有文件
     * @param market 市场代码
     * @return 文件名列表
     * @throws Exception 操作失败时抛出
     */
    public List<String> listFiles(String market) throws Exception {
        try {
            String remotePath = getMarketRemotePath(market);
            String[] cmd = { "svn", "list", remotePath, "--non-interactive", "--trust-server-cert",
                             "--username", svnUsername, "--password", svnPassword };
            String output = executeCommand(cmd);

            List<String> files = new ArrayList<>();
            for (String line : output.split("\n")) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty() && !trimmed.endsWith("/")) {
                    files.add(trimmed);
                }
            }
            return files;
        } catch (IOException e) {
            // 如果目录不存在则返回空列表
            if (e.getMessage() != null && e.getMessage().contains("non-existent")) {
                return new ArrayList<>();
            }
            logger.error("Failed to list files for market {}: {}", market, e.getMessage());
            throw e;
        }
    }

    /**
     * 检查 SVN 上指定 Market 文件夹是否存在
     * @param market 市场代码
     * @return true=存在，false=不存在
     */
    public boolean marketExists(String market) {
        try {
            listFiles(market);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 在 SVN 上创建 Market 文件夹
     * @param market 市场代码
     * @throws Exception 创建失败时抛出
     */
    public void createMarketFolder(String market) throws Exception {
        try {
            // 先 checkout 根目录
            checkoutWorkingCopy();

            // 在本地创建工作副本目录
            File marketDir = new File(getMarketLocalPath(market));

            // 创建目录
            String[] mkdirCmd = { "svn", "mkdir", getMarketLocalPath(market), "--parents",
                                  "--non-interactive", "--trust-server-cert",
                                  "--username", svnUsername, "--password", svnPassword };
            executeCommand(mkdirCmd);

            // 提交
            commitWorkingCopy("Create market folder: " + market);
        } catch (Exception e) {
            logger.error("Failed to create market folder {}: {}", market, e.getMessage());
            throw e;
        }
    }

    /**
     * Checkout 工作副本
     * @throws Exception 操作失败时抛出
     */
    private void checkoutWorkingCopy() throws Exception {
        File wcDir = new File(workingCopyPath);
        if (!wcDir.exists()) {
            wcDir.mkdirs();
        }

        // 使用 --depth=empty 只 checkout 根目录，不下载文件
        String[] cmd = { "svn", "co", svnRepoUrl, workingCopyPath, "--depth=empty",
                         "--non-interactive", "--trust-server-cert",
                         "--username", svnUsername, "--password", svnPassword };
        executeCommand(cmd);
    }

    /**
     * 更新工作副本（svn update --set-depth=infinity）
     * @throws Exception 操作失败时抛出
     */
    private void updateWorkingCopy() throws Exception {
        String[] cmd = { "svn", "update", workingCopyPath, "--set-depth=infinity",
                         "--non-interactive", "--trust-server-cert",
                         "--username", svnUsername, "--password", svnPassword };
        executeCommand(cmd);
    }

    /**
     * 提交工作副本变更
     * @param message 提交消息
     * @throws Exception 操作失败时抛出
     */
    private void commitWorkingCopy(String message) throws Exception {
        String[] cmd = { "svn", "commit", workingCopyPath, "-m", message,
                         "--non-interactive", "--trust-server-cert",
                         "--username", svnUsername, "--password", svnPassword };
        executeCommand(cmd);
    }

    /**
     * 上传文件到指定 Market
     * @param market 市场代码
     * @param fileInputStream 文件输入流
     * @param originalFilename 原始文件名
     * @throws Exception 上传失败时抛出
     */
    public void uploadFile(String market, InputStream fileInputStream, String originalFilename) throws Exception {
        // 1. 确保 Market 文件夹存在
        if (!marketExists(market)) {
            createMarketFolder(market);
        }

        // 2. 更新工作副本（获取最新）
        updateWorkingCopy();

        // 3. 将文件写入工作副本目录
        File targetFile = new File(getMarketLocalPath(market), originalFilename);
        try (FileOutputStream fos = new FileOutputStream(targetFile)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fileInputStream.read(buffer)) != -1) {
                fos.write(buffer, 0, bytesRead);
            }
        }

        // 4. svn add（如果是新文件）
        String[] addCmd = { "svn", "add", targetFile.getAbsolutePath(), "--force",
                            "--non-interactive", "--trust-server-cert",
                            "--username", svnUsername, "--password", svnPassword };
        try {
            executeCommand(addCmd);
        } catch (Exception e) {
            // 如果文件已存在则会报错，忽略
            logger.warn("svn add warning (file may already exist): {}", e.getMessage());
        }

        // 5. svn commit
        commitWorkingCopy("Upload template file: " + originalFilename + " to market: " + market);
    }

    /**
     * 从 SVN 删除指定 Market 下的文件
     * @param market 市场代码
     * @param fileName 文件名
     * @throws Exception 删除失败时抛出
     */
    public void deleteFile(String market, String fileName) throws Exception {
        // 1. 更新工作副本
        updateWorkingCopy();

        // 2. 构建文件路径并执行 svn delete
        String filePath = getMarketLocalPath(market) + "/" + fileName;
        File file = new File(filePath);
        if (!file.exists()) {
            throw new FileNotFoundException("File not found in working copy: " + filePath);
        }

        String[] deleteCmd = { "svn", "delete", filePath,
                               "--non-interactive", "--trust-server-cert",
                               "--username", svnUsername, "--password", svnPassword };
        executeCommand(deleteCmd);

        // 3. svn commit
        commitWorkingCopy("Delete template file: " + fileName + " from market: " + market);
    }
}
