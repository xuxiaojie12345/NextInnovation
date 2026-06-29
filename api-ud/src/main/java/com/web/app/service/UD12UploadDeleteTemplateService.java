package com.web.app.service;

import com.web.app.dto.UD12UploadDeleteTemplateResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * UD12 Upload&Delete Template 业务逻辑接口
 * 定义市场列表获取、文件上传、文件列表查询、文件删除等方法
 */
public interface UD12UploadDeleteTemplateService {

    /**
     * 获取所有市场列表
     * 从 MARKET_MASTER 表查询所有市场，同时从 SVN 服务器获取实际存在的市场
     * @return 统一响应对象，data 为市场列表
     */
    UD12UploadDeleteTemplateResponse getMarkets();

    /**
     * 上传模板文件到指定 Market
     * @param file 上传的文件
     * @param market 目标市场代码
     * @return 统一响应对象
     */
    UD12UploadDeleteTemplateResponse uploadFile(MultipartFile file, String market);

    /**
     * 获取指定 Market 下的模板文件列表
     * @param market 市场代码
     * @return 统一响应对象，data 为文件列表
     */
    UD12UploadDeleteTemplateResponse getFileList(String market);

    /**
     * 删除指定 Market 下的模板文件
     * @param templateFile 文件名
     * @param market 市场代码
     * @return 统一响应对象
     */
    UD12UploadDeleteTemplateResponse deleteFile(String templateFile, String market);
}
