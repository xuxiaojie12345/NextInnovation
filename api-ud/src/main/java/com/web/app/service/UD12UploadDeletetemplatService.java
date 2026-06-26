package com.web.app.service;

import com.web.app.dto.UD12UploadDeletetemplatRequest;
import com.web.app.dto.UD12UploadDeletetemplatResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * UD12 上传删除模板服务接口
 *
 * 功能说明：定义模板上传、删除及市场列表查询的业务方法
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
public interface UD12UploadDeletetemplatService {

    /**
     * 获取市场列表
     *
     * @return 响应对象
     */
    UD12UploadDeletetemplatResponse selectMarket();

    /**
     * 上传模板文件
     *
     * @param file   上传的文件
     * @param market 市场
     * @return 响应对象
     */
    UD12UploadDeletetemplatResponse uploadFile(MultipartFile file, String market);

    /**
     * 删除模板文件
     *
     * @param request 请求对象
     * @return 响应对象
     */
    UD12UploadDeletetemplatResponse deleteFile(UD12UploadDeletetemplatRequest request);

    /**
     * 获取指定Market文件夹下的模板文件列表
     *
     * @param market 市场
     * @return 响应对象（包含文件名列表）
     */
    UD12UploadDeletetemplatResponse getTemplateList(String market);
}
