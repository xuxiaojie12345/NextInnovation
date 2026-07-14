package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.UD10HdocVariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD10 Hdoc Variables Service Implementation
 * 实现HDOC变量的添加、更新、删除业务逻辑
 */
@Service
public class UD10HdocVariablesServiceImpl implements UD10HdocVariablesService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    /**
     * 4.4 添加变量逻辑
     * 对请求参数进行非空、长度、格式等合法性校验
     */
    @Override
    public ApiResponse<?> addVariable(HdocVariables request) {

        try {
            // 4.4 参数合法性校验
            String variable = request.getVariable();
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error(400, "Variable不能为空");
            }
            variable = variable.trim();

            // 4.6 检查Variable字段长度是否符合数据库约束
            if (variable.length() > 30) {
                return ApiResponse.error(400, "Variable长度不能超过30");
            }
            if (request.getType() != null && request.getType().length() > 50) {
                return ApiResponse.error(400, "Type长度不能超过50");
            }
            if (request.getDescription() != null && request.getDescription().length() > 200) {
                return ApiResponse.error(400, "Description长度不能超过200");
            }

            // 4.5 检查变量是否已存在
            int count = hdocVariablesMapper.countByVariable(variable);
            if (count > 0) {
                return ApiResponse.error(400, "变量已存在");
            }

            // 4.7 设置创建相关字段
            HdocVariables entity = new HdocVariables();
            entity.setVariable(variable);
            entity.setType(request.getType());
            entity.setDescription(request.getDescription());

            String currentUser = request.getCreatedByUser();
            if (currentUser == null || currentUser.trim().isEmpty()) {
                currentUser = "SYSTEM";
            }
            entity.setRegisterUser(currentUser);
            entity.setRegisterProcess("UD10_ADD");
            entity.setUpdateUser(currentUser);
            entity.setUpdateProcess("UD10_ADD");

            // 执行插入操作
            int result = hdocVariablesMapper.insert(entity);
            if (result > 0) {

                // 4.8 封装响应对象
                Map<String, Object> data = new HashMap<>();
                data.put("variable", variable);

                return ApiResponse.success("添加变量成功", data);
            } else {
                return ApiResponse.error(500, "添加变量失败，请重试");
            }

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 4.4 更新变量逻辑
     * 对请求参数进行非空、长度、格式等合法性校验
     */
    @Override
    public ApiResponse<?> updateVariable(HdocVariables request) {

        try {
            // 4.4 参数合法性校验
            String variable = request.getVariable();
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error(400, "Variable不能为空");
            }
            variable = variable.trim();

            // 4.6 检查Variable字段长度是否符合数据库约束
            if (variable.length() > 30) {
                return ApiResponse.error(400, "Variable长度不能超过30");
            }
            if (request.getType() != null && request.getType().length() > 50) {
                return ApiResponse.error(400, "Type长度不能超过50");
            }
            if (request.getDescription() != null && request.getDescription().length() > 200) {
                return ApiResponse.error(400, "Description长度不能超过200");
            }

            // 4.5 检查记录是否存在
            int count = hdocVariablesMapper.countByVariable(variable);
            if (count == 0) {
                return ApiResponse.error(400, "记录不存在");
            }

            // 4.7 设置更新相关字段
            HdocVariables entity = new HdocVariables();
            entity.setVariable(variable);
            entity.setType(request.getType());
            entity.setDescription(request.getDescription());

            String currentUser = request.getCreatedByUser();
            if (currentUser == null || currentUser.trim().isEmpty()) {
                currentUser = "SYSTEM";
            }
            entity.setUpdateUser(currentUser);
            entity.setUpdateProcess("UD10_UPDATE");

            // 执行更新操作
            int result = hdocVariablesMapper.update(entity);
            if (result > 0) {

                // 4.8 封装响应对象
                Map<String, Object> data = new HashMap<>();
                data.put("variable", variable);

                return ApiResponse.success("更新变量成功", data);
            } else {
                return ApiResponse.error(500, "更新变量失败，请重试");
            }

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 4.4 删除变量逻辑
     * 对Variable参数进行非空、格式等合法性校验
     */
    @Override
    public ApiResponse<?> deleteVariable(String variable) {

        try {
            // 4.4 参数合法性校验
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error(400, "Variable不能为空");
            }
            variable = variable.trim();

            // 4.6 检查Variable字段长度
            if (variable.length() > 30) {
                return ApiResponse.error(400, "Variable长度不能超过30");
            }

            // 4.5 检查记录是否存在
            int count = hdocVariablesMapper.countByVariable(variable);
            if (count == 0) {
                return ApiResponse.error(400, "记录不存在");
            }

            // 4.7 执行删除操作（物理删除）
            int result = hdocVariablesMapper.deleteByVariable(variable);
            if (result > 0) {

                // 4.8 封装响应对象
                Map<String, Object> data = new HashMap<>();
                data.put("variable", variable);

                return ApiResponse.success("删除变量成功", data);
            } else {
                return ApiResponse.error(500, "删除变量失败，请重试");
            }

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * UD11: 搜索变量
     * 对请求参数进行校验，调用Mapper执行查询
     */
    @Override
    public ApiResponse<?> searchVariables(HdocVariables request) {

        try {
            // 4.4 参数合法性校验
            String variable = request.getVariable();
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error(400, "Variable不能为空");
            }
            variable = variable.trim();

            // 4.6 验证Variable字段长度
            if (variable.length() > 30) {
                return ApiResponse.error(400, "Variable长度不能超过30");
            }

            // 4.6 映射操作符为XML安全的标识（eq / ne）
            String varOp = mapOperatorForXml(request.getVariableOperator());
            String typeOp = mapOperatorForXml(request.getTypeOperator());
            String descrOp = mapOperatorForXml(request.getDescriptionOperator());
            // Variable 用 eq（精确匹配），其他字段默认为 eq
            String userOp = "eq";
            String dateOp = "eq";

            // 4.6 对模糊查询参数进行转义处理，防止SQL注入
            String type = escapeLikeParam(request.getType());
            String description = escapeLikeParam(request.getDescription());
            String createdByUser = escapeLikeParam(request.getCreatedByUser());
            String date = escapeLikeParam(request.getDate());

            // 4.5 调用Mapper执行查询（传入各字段值及对应的操作符）
            List<HdocVariables> variablesList = hdocVariablesMapper.searchVariables(
                    variable, varOp,
                    type, typeOp,
                    description, descrOp,
                    createdByUser, userOp,
                    date, dateOp);

            // 4.7 构建响应数据（映射字段名以匹配前端）
            if (variablesList == null) {
                variablesList = new java.util.ArrayList<>();
            }

            List<Map<String, Object>> dataList = variablesList.stream().map(v -> {
                Map<String, Object> item = new HashMap<>();
                item.put("variable", v.getVariable());
                item.put("type", v.getType());
                item.put("description", v.getDescription());
                item.put("createdByUser", v.getRegisterUser());
                item.put("date", v.getRegisterDatetime());
                return item;
            }).collect(java.util.stream.Collectors.toList());

            // 4.8 封装响应对象
            return ApiResponse.success("搜索变量成功", dataList);

        } catch (Exception e) {
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 对模糊查询参数进行转义处理，防止SQL注入
     * 转义 LIKE 查询中的特殊字符 % 和 _
     *
     * @param param 原始参数
     * @return 转义后的参数，如果为空则返回null
     */
    private String escapeLikeParam(String param) {
        if (param == null || param.trim().isEmpty()) {
            return null;
        }
        // 转义 % 和 _ 字符
        return param.trim()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    /**
     * 将操作符映射为XML安全的字符串
     * "=" → "eq", "!=" → "ne"
     *
     * @param operator 原始操作符（=, !=）
     * @return XML安全的操作符标识（eq, ne），缺省返回 "eq"
     */
    private String mapOperatorForXml(String operator) {
        if (operator == null) {
            return "eq";
        }
        switch (operator.trim()) {
            case "!=": return "ne";
            case "=":
            default:   return "eq";
        }
    }
}
