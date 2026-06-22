package com.web.app.service.impl;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;
import com.web.app.entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.UD10HdocvariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * UD10 - HDoc变量操作服务实现类
 */
@Service
public class UD10HdocvariablesServiceImpl implements UD10HdocvariablesService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public UD10HdocvariablesResponse addVariable(UD10HdocvariablesRequest request) {
        UD10HdocvariablesResponse response = new UD10HdocvariablesResponse();

        // 参数校验
        if (request.getVariable() == null || request.getVariable().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("变量名不能为空");
            return response;
        }

        // 检查是否已存在
        int count = hdocVariablesMapper.countByVariable(request.getVariable());
        if (count > 0) {
            response.setCode(400);
            response.setMsg("Variant already exists. Please enter the correct content");
            return response;
        }

        // 新增
        HdocVariables variables = new HdocVariables();
        variables.setVariable(request.getVariable());
        variables.setType(request.getType());
        variables.setDescription(request.getDescription());
        variables.setCreatedByUser(request.getCreatedByUser());

        hdocVariablesMapper.insert(variables);

        response.setCode(200);
        response.setMsg("登录成功");
        return response;
    }

    @Override
    public UD10HdocvariablesResponse updateVariable(UD10HdocvariablesRequest request) {
        UD10HdocvariablesResponse response = new UD10HdocvariablesResponse();

        // 参数校验
        if (request.getVariable() == null || request.getVariable().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("变量名不能为空");
            return response;
        }

        // 检查是否存在
        int count = hdocVariablesMapper.countByVariable(request.getVariable());
        if (count == 0) {
            response.setCode(400);
            response.setMsg("Variant does not exists. Please enter the correct content");
            return response;
        }

        // 更新
        HdocVariables variables = new HdocVariables();
        variables.setVariable(request.getVariable());
        variables.setType(request.getType());
        variables.setDescription(request.getDescription());
        variables.setCreatedByUser(request.getCreatedByUser());

        hdocVariablesMapper.update(variables);

        response.setCode(200);
        response.setMsg("更新成功");
        return response;
    }

    @Override
    public UD10HdocvariablesResponse deleteVariable(UD10HdocvariablesRequest request) {
        UD10HdocvariablesResponse response = new UD10HdocvariablesResponse();

        // 参数校验
        if (request.getVariable() == null || request.getVariable().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("变量名不能为空");
            return response;
        }

        // 检查是否存在
        int count = hdocVariablesMapper.countByVariable(request.getVariable());
        if (count == 0) {
            response.setCode(400);
            response.setMsg("Variant does not exists. Please enter the correct content");
            return response;
        }

        // 删除
        hdocVariablesMapper.deleteByVariable(request.getVariable());

        response.setCode(200);
        response.setMsg("删除成功");
        return response;
    }
}
