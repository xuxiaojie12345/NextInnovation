package com.web.app.service;

import com.web.app.domain.ApiResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * UD12 Service
 * 提供市场列表获取、模板文件上传/删除/下载业务逻辑
 */
public interface UD12Service {

    /**
     * 获取市场列表
     *
     * @return API响应，包含市场列表
     */
    ApiResponse<?> getMarketList();

    /**
     * 获取指定市场下的模板文件列表
     *
     * @param marketCode 市场代码
     * @return API响应，包含模板文件列表
     */
    ApiResponse<?> getTemplateFiles(String marketCode);

    /**
     * 上传模板文件
     *
     * @param file   上传的文件
     * @param market 市场代码
     * @return API响应，包含文件名和市场代码
     */
    ApiResponse<?> uploadFile(MultipartFile file, String market);

    /**
     * 删除模板文件
     *
     * @param market   市场代码
     * @param fileName 文件名
     * @return API响应，包含文件名和市场代码
     */
    ApiResponse<?> deleteFile(String market, String fileName);

    /**
     * 获取模板文件存储根目录
     *
     * @return 根目录路径
     */
    String getUploadDir();
}
