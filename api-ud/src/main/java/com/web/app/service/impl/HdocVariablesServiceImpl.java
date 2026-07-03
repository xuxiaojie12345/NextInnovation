package com.web.app.service.impl;

import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.HdocVariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class HdocVariablesServiceImpl implements HdocVariablesService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public int addVariable(String variable, String type, String description, String currentUser) {
        if (currentUser == null || currentUser.trim().isEmpty()) {
            currentUser = "SYSTEM";
        }
        return hdocVariablesMapper.insertVariable(variable, type, description, currentUser);
    }

    @Override
    public int updateVariable(String variable, String type, String description, String currentUser) {
        if (currentUser == null || currentUser.trim().isEmpty()) {
            currentUser = "SYSTEM";
        }
        return hdocVariablesMapper.updateVariable(variable, type, description, currentUser);
    }

    @Override
    public int deleteVariable(String variable) {
        return hdocVariablesMapper.deleteVariable(variable);
    }

    @Override
    public List<Map<String, Object>> searchVariables(String variable, String variableOp,
                                                      String type, String typeOp,
                                                      String description, String descriptionOp,
                                                      String registerUser, String registerUserOp,
                                                      String registerDatetime, String registerDatetimeOp) {
        return hdocVariablesMapper.searchVariables(variable, variableOp,
            type, typeOp,
            description, descriptionOp,
            registerUser, registerUserOp,
            registerDatetime, registerDatetimeOp);
    }
}
