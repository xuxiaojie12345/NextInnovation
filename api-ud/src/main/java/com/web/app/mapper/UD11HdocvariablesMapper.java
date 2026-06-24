package com.web.app.mapper;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse.VariableData;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

/**
 * UD11 HDOC变量搜索数据访问层
 *
 * 功能说明：执行HDOC变量的搜索查询操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD11HdocvariablesMapper {

    /**
     * 根据动态条件搜索HDOC变量
     *
     * @param request 搜索请求参数（所有字段可为空）
     * @return 变量数据列表
     */
    List<VariableData> searchVariables(UD11HdocvariablesRequest request);
}
