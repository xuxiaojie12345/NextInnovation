package com.web.app.service;

import com.web.app.dto.UD12UploadDeletetemplatRequest;
import com.web.app.dto.UD12UploadDeletetemplatResponse;

/**
 * UD12 - 上传/删除模板服务接口
 */
public interface UD12UploadDeletetemplatService {

    /**
     * 查询市场列表（初期表示）
     */
    UD12UploadDeletetemplatResponse selectMarket();

    /**
     * 上传模板文件
     */
    UD12UploadDeletetemplatResponse uploadFile(UD12UploadDeletetemplatRequest request);

    /**
     * 删除模板文件
     */
    UD12UploadDeletetemplatResponse deleteFile(UD12UploadDeletetemplatRequest request);

    /**
     * 根据市场列出模板文件列表
     */
    UD12UploadDeletetemplatResponse listTemplates(String market);
}
