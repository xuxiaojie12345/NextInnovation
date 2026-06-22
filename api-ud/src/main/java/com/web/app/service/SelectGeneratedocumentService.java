package com.web.app.service;

import com.web.app.dto.SelectGeneratedocumentRequest;
import com.web.app.dto.SelectGeneratedocumentResponse;

/**
 * UD04 - Generate document查询服务接口
 */
public interface SelectGeneratedocumentService {

    /**
     * 查询Generate document信息
     */
    SelectGeneratedocumentResponse selectGeneratedocument(SelectGeneratedocumentRequest request);
}
