package com.web.app.service.impl;

import com.web.app.dto.Ud10VariableRequest;
import com.web.app.entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.UD10HdocvariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UD10HdocvariablesServiceImpl implements UD10HdocvariablesService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public void updateVariable(Ud10VariableRequest request) {
        HdocVariables existing = hdocVariablesMapper.selectByVariable(request.getVariable());
        if (existing == null) {
            throw new RuntimeException("VARIABLE数据不存在，无法更新");
        }
        HdocVariables record = new HdocVariables();
        record.setVariable(request.getVariable());
        record.setType(request.getType());
        record.setDescription(request.getDescription());
        record.setUpdateDatetime(
            request.getUpdateDatetime() != null ? 
            java.time.LocalDateTime.parse(request.getUpdateDatetime().substring(0, 19)) : 
            java.time.LocalDateTime.now()
        );
        record.setUpdateUser(request.getUpdateUser());
        record.setUpdateProcess(request.getUpdateProcess());
        hdocVariablesMapper.updateByVariable(record);
    }

    @Override
    public void addVariable(Ud10VariableRequest request) {
        HdocVariables existing = hdocVariablesMapper.selectByVariable(request.getVariable());
        if (existing != null) {
            throw new RuntimeException("VARIABLE数据已存在，无法新增");
        }
        HdocVariables record = new HdocVariables();
        record.setVariable(request.getVariable());
        record.setType(request.getType());
        record.setDescription(request.getDescription());
        record.setRegisterDatetime(
            request.getRegisterDatetime() != null ? 
            java.time.LocalDateTime.parse(request.getRegisterDatetime().substring(0, 19)) : 
            java.time.LocalDateTime.now()
        );
        record.setRegisterUser(request.getRegisterUser());
        record.setRegisterProcess(request.getRegisterProcess());
        record.setUpdateDatetime(
            request.getUpdateDatetime() != null ? 
            java.time.LocalDateTime.parse(request.getUpdateDatetime().substring(0, 19)) : 
            java.time.LocalDateTime.now()
        );
        record.setUpdateUser(request.getUpdateUser());
        record.setUpdateProcess(request.getUpdateProcess());
        hdocVariablesMapper.insertVariable(record);
    }

    @Override
    public void deleteVariable(Ud10VariableRequest request) {
        HdocVariables existing = hdocVariablesMapper.selectByVariable(request.getVariable());
        if (existing == null) {
            throw new RuntimeException("VARIABLE数据不存在，无法删除");
        }
        hdocVariablesMapper.deleteByVariable(request.getVariable());
    }
}
