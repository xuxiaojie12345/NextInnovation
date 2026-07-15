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
    public UD10HdocvariablesResponse UD10Add(UD10HdocvariablesRequest request) {
        try {
            String validationError = validateVariable(request);
            if (validationError != null) {
                return UD10HdocvariablesResponse.error(400, validationError);
            }

            // 检查变量是否已存在
            Integer count = ud10Mapper.countByVariable(request.getVariable().trim());
            if (count != null && count > 0) {
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

            return UD10HdocvariablesResponse.success("添加成功");
        } catch (Exception e) {
            return UD10HdocvariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD10HdocvariablesResponse UD10Update(UD10HdocvariablesRequest request) {
        try {
            String validationError = validateVariable(request);
            if (validationError != null) {
                return UD10HdocvariablesResponse.error(400, validationError);
            }

            // 检查变量是否存在
            Integer count = ud10Mapper.countByVariable(request.getVariable().trim());
            if (count == null || count == 0) {
                return UD10HdocvariablesResponse.error(404,
                        "Variant does not exists. Please enter the correct content.");
            }

            String user = StringUtils.hasText(request.getCreatedByUser()) ? request.getCreatedByUser() : "SYSTEM";

            ud10Mapper.updateVariable(
                    request.getVariable().trim(),
                    request.getType(),
                    request.getDescription(),
                    user);

            return UD10HdocvariablesResponse.success("更新成功");
        } catch (Exception e) {
            return UD10HdocvariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD10HdocvariablesResponse UD10Delete(UD10HdocvariablesRequest request) {
        try {
            String validationError = validateVariable(request);
            if (validationError != null) {
                return UD10HdocvariablesResponse.error(400, validationError);
            }

            // 检查变量是否存在
            Integer count = ud10Mapper.countByVariable(request.getVariable().trim());
            if (count == null || count == 0) {
                return UD10HdocvariablesResponse.error(404,
                        "Variant does not exists. Please enter the correct content.");
            }

            ud10Mapper.deleteVariable(request.getVariable().trim());

            return UD10HdocvariablesResponse.success("删除成功");
        } catch (Exception e) {
            return UD10HdocvariablesResponse.error(500, "系统繁忙，请稍后重试");
        }
    }

    private String validateVariable(UD10HdocvariablesRequest request) {
        if (!StringUtils.hasText(request.getVariable())) {
            return "变量名不能为空";
        }
        return null;
    }
}
