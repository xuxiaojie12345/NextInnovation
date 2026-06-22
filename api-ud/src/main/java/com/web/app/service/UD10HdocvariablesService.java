package com.web.app.service;

import java.util.Map;

/**
 * UD10_Hdocvariables 服务接口
 * 提供HDOC Variables的新增/更新/删除操作
 */
public interface UD10HdocvariablesService {

    /**
     * 检查Variable是否已存在
     *
     * @param variable 变量名
     * @return 存在返回true
     */
    boolean checkVariableExists(String variable);

    /**
     * 新增HDOC Variable
     *
     * @param params 参数
     */
    void add(Map<String, Object> params);

    /**
     * 更新HDOC Variable
     *
     * @param params 参数
     */
    void update(Map<String, Object> params);

    /**
     * 删除HDOC Variable
     *
     * @param variable 变量名
     */
    void delete(String variable);
}
