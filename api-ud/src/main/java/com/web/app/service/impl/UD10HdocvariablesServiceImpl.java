package com.web.app.service.impl;

import com.web.app.service.UD10HdocvariablesService;
import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.entity.HdocVariables;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Date;

@Service
public class UD10HdocvariablesServiceImpl implements UD10HdocvariablesService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public UD10HdocvariablesResponse addVariable(UD10HdocvariablesRequest request) {
        if (request.getVariable() == null || request.getVariable().isEmpty()) {
            return UD10HdocvariablesResponse.error("Variable is required");
        }
        if (request.getVariable().length() > 30) {
            return UD10HdocvariablesResponse.error("Variable length must not exceed 30 characters");
        }
        int count = hdocVariablesMapper.countByVariable(request.getVariable());
        if (count > 0) {
            return UD10HdocvariablesResponse.error("Variable already exists. Please enter the correct content");
        }
        HdocVariables entity = new HdocVariables();
        entity.setVariable(request.getVariable());
        entity.setTypeField(request.getType());
        entity.setDescription(request.getDescription());
        entity.setRegisterUser(request.getUser());
        entity.setRegisterDatetime(new Date());
        entity.setUpdateUser(request.getUser());
        entity.setUpdateDatetime(new Date());
        hdocVariablesMapper.insert(entity);
        return UD10HdocvariablesResponse.success();
    }

    @Override
    public UD10HdocvariablesResponse updateVariable(UD10HdocvariablesRequest request) {
        if (request.getVariable() == null || request.getVariable().isEmpty()) {
            return UD10HdocvariablesResponse.error("Variable is required");
        }
        int count = hdocVariablesMapper.countByVariable(request.getVariable());
        if (count == 0) {
            return UD10HdocvariablesResponse.error("Variable does not exist. Please enter the correct content");
        }
        HdocVariables entity = new HdocVariables();
        entity.setVariable(request.getVariable());
        entity.setTypeField(request.getType());
        entity.setDescription(request.getDescription());
        entity.setUpdateUser(request.getUser());
        entity.setUpdateDatetime(new Date());
        hdocVariablesMapper.updateByVariable(entity);
        return UD10HdocvariablesResponse.success();
    }

    @Override
    public UD10HdocvariablesResponse deleteVariable(UD10HdocvariablesRequest request) {
        if (request.getVariable() == null || request.getVariable().isEmpty()) {
            return UD10HdocvariablesResponse.error("Variable is required");
        }
        int count = hdocVariablesMapper.countByVariable(request.getVariable());
        if (count == 0) {
            return UD10HdocvariablesResponse.error("Variable does not exist. Please enter the correct content");
        }
        hdocVariablesMapper.deleteByVariable(request.getVariable());
        return UD10HdocvariablesResponse.success();
    }
}
