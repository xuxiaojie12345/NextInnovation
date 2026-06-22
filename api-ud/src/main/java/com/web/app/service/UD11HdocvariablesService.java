package com.web.app.service;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse;

/**
 * UD11 - HDoc变量搜索服务接口
 */
public interface UD11HdocvariablesService {

    /**
     * 搜索HDoc变量
     */
    UD11HdocvariablesResponse searchVariables(UD11HdocvariablesRequest request);
}
