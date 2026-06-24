package com.web.app.service.impl;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;
import com.web.app.mapper.UD10HdocvariablesMapper;
import com.web.app.service.UD10HdocvariablesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * UD10 HDOC变量管理服务实现类
 *
 * 功能说明：实现HDOC变量的增删改业务逻辑
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Slf4j
@Service
public class UD10HdocvariablesServiceImpl implements UD10HdocvariablesService {

    @Autowired
    private UD10HdocvariablesMapper ud10Mapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD10HdocvariablesResponse addVariable(UD10HdocvariablesRequest request) {
        log.info("开始UD10新增变量, variable: {}", request.getVariable());
        try {
            if (!StringUtils.hasText(request.getVariable())) {
                return UD10HdocvariablesResponse.error(400, "变量名不能为空");
            }

            // 检查变量是否已存在
            Integer count = ud10Mapper.countByVariable(request.getVariable().trim());
            if (count != null && count > 0) {
                log.warn("UD10新增变量失败 - 变量已存在: {}", request.getVariable());
                return UD10HdocvariablesResponse.error(409,
                        "Variant already exists. Please enter the correct content.");
            }

            String user = StringUtils.hasText(request.getCreatedByUser()) ? request.getCreatedByUser() : "SYSTEM";

            ud10Mapper.insertVariable(
                    request.getVariable().trim(),
                    request.getType(),
                    request.getDescription(),
                    user,
                    user,
                    user);

            log.info("UD10新增变量成功: {}", request.getVariable());
            return UD10HdocvariablesResponse.success("添加成功");
        } catch (Exception e) {
            log.error("UD10新增变量失败", e);
            return UD10HdocvariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD10HdocvariablesResponse updateVariable(UD10HdocvariablesRequest request) {
        log.info("开始UD10更新变量, variable: {}", request.getVariable());
        try {
            if (!StringUtils.hasText(request.getVariable())) {
                return UD10HdocvariablesResponse.error(400, "变量名不能为空");
            }

            // 检查变量是否存在
            Integer count = ud10Mapper.countByVariable(request.getVariable().trim());
            if (count == null || count == 0) {
                log.warn("UD10更新变量失败 - 变量不存在: {}", request.getVariable());
                return UD10HdocvariablesResponse.error(404,
                        "Variant does not exists. Please enter the correct content.");
            }

            String user = StringUtils.hasText(request.getCreatedByUser()) ? request.getCreatedByUser() : "SYSTEM";

            ud10Mapper.updateVariable(
                    request.getVariable().trim(),
                    request.getType(),
                    request.getDescription(),
                    user);

            log.info("UD10更新变量成功: {}", request.getVariable());
            return UD10HdocvariablesResponse.success("更新成功");
        } catch (Exception e) {
            log.error("UD10更新变量失败", e);
            return UD10HdocvariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD10HdocvariablesResponse deleteVariable(UD10HdocvariablesRequest request) {
        log.info("开始UD10删除变量, variable: {}", request.getVariable());
        try {
            if (!StringUtils.hasText(request.getVariable())) {
                return UD10HdocvariablesResponse.error(400, "变量名不能为空");
            }

            // 检查变量是否存在
            Integer count = ud10Mapper.countByVariable(request.getVariable().trim());
            if (count == null || count == 0) {
                log.warn("UD10删除变量失败 - 变量不存在: {}", request.getVariable());
                return UD10HdocvariablesResponse.error(404,
                        "Variant does not exists. Please enter the correct content.");
            }

            ud10Mapper.deleteVariable(request.getVariable().trim());

            log.info("UD10删除变量成功: {}", request.getVariable());
            return UD10HdocvariablesResponse.success("删除成功");
        } catch (Exception e) {
            log.error("UD10删除变量失败", e);
            return UD10HdocvariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }
}
