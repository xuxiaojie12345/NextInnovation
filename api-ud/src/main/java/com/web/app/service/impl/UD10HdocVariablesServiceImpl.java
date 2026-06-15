package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.UD10HdocVariablesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * UD10 Hdoc Variables Service Implementation
 * 实现HDOC变量的添加、更新、删除业务逻辑
 */
@Slf4j
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
        log.info("========== UD10 Service: Add Variable ==========");
        log.info("Request: variable={}, type={}, description={}",
                request.getVariable(), request.getType(), request.getDescription());

        try {
            // 4.4 参数合法性校验
            String variable = request.getVariable();
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error(400, "Variable不能为空");
            }
            variable = variable.trim();

            // 4.6 检查Variable字段长度是否符合数据库约束
            if (variable.length() > 20) {
                return ApiResponse.error(400, "Variable长度不能超过20");
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
                log.warn("Variable already exists: {}", variable);
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
                log.info("Variable added successfully: {}", variable);

                // 4.8 封装响应对象
                Map<String, Object> data = new HashMap<>();
                data.put("variable", variable);

                return ApiResponse.success("添加变量成功", data);
            } else {
                return ApiResponse.error(500, "添加变量失败，请重试");
            }

        } catch (Exception e) {
            log.error("Error adding variable", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 4.4 更新变量逻辑
     * 对请求参数进行非空、长度、格式等合法性校验
     */
    @Override
    public ApiResponse<?> updateVariable(HdocVariables request) {
        log.info("========== UD10 Service: Update Variable ==========");
        log.info("Request: variable={}, type={}, description={}",
                request.getVariable(), request.getType(), request.getDescription());

        try {
            // 4.4 参数合法性校验
            String variable = request.getVariable();
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error(400, "Variable不能为空");
            }
            variable = variable.trim();

            // 4.6 检查Variable字段长度是否符合数据库约束
            if (variable.length() > 20) {
                return ApiResponse.error(400, "Variable长度不能超过20");
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
                log.warn("Variable not found: {}", variable);
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
                log.info("Variable updated successfully: {}", variable);

                // 4.8 封装响应对象
                Map<String, Object> data = new HashMap<>();
                data.put("variable", variable);

                return ApiResponse.success("更新变量成功", data);
            } else {
                return ApiResponse.error(500, "更新变量失败，请重试");
            }

        } catch (Exception e) {
            log.error("Error updating variable", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }

    /**
     * 4.4 删除变量逻辑
     * 对Variable参数进行非空、格式等合法性校验
     */
    @Override
    public ApiResponse<?> deleteVariable(HdocVariables request) {
        log.info("========== UD10 Service: Delete Variable ==========");
        log.info("Request: variable={}", request.getVariable());

        try {
            // 4.4 参数合法性校验
            String variable = request.getVariable();
            if (variable == null || variable.trim().isEmpty()) {
                return ApiResponse.error(400, "Variable不能为空");
            }
            variable = variable.trim();

            // 4.6 检查Variable字段长度
            if (variable.length() > 20) {
                return ApiResponse.error(400, "Variable长度不能超过20");
            }

            // 4.5 检查记录是否存在
            int count = hdocVariablesMapper.countByVariable(variable);
            if (count == 0) {
                log.warn("Variable not found: {}", variable);
                return ApiResponse.error(400, "记录不存在");
            }

            // 4.7 执行删除操作（物理删除）
            int result = hdocVariablesMapper.deleteByVariable(variable);
            if (result > 0) {
                log.info("Variable deleted successfully: {}", variable);

                // 4.8 封装响应对象
                Map<String, Object> data = new HashMap<>();
                data.put("variable", variable);

                return ApiResponse.success("删除变量成功", data);
            } else {
                return ApiResponse.error(500, "删除变量失败，请重试");
            }

        } catch (Exception e) {
            log.error("Error deleting variable", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
}
