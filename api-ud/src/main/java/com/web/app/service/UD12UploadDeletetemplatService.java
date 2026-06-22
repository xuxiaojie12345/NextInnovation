package com.web.app.service;

import java.util.List;
import java.util.Map;

/**
 * UD12_UploadDeletetemplat 服务接口
 * 提供文件上传/删除及市场列表查询功能
 */
public interface UD12UploadDeletetemplatService {

    /**
     * 获取市场列表
     *
     * @return 市场列表
     */
    List<Map<String, Object>> selectMarketMaster();

    /**
     * 上传文件
     *
     * @param market      市场
     * @param fileName    文件名
     * @param fileContent 文件内容（字节数组）
     */
    void uploadFile(String market, String fileName, byte[] fileContent);

    /**
     * 删除文件
     *
     * @param market   市场
     * @param template 模板文件名
     */
    void deleteFile(String market, String template);
}
