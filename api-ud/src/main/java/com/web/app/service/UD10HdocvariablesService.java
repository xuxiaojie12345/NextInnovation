package com.web.app.service;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;

/**
 * UD10 - HDoc变量操作服务接口
 */
public interface UD10HdocvariablesService {

    /**
     * 新增变量
     */
    UD10HdocvariablesResponse addVariable(UD10HdocvariablesRequest request);

    /**
     * 更新变量
     */
    UD10HdocvariablesResponse updateVariable(UD10HdocvariablesRequest request);

    /**
     * 删除变量
     */
    UD10HdocvariablesResponse deleteVariable(UD10HdocvariablesRequest request);
}
