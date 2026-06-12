package com.web.app.service.impl;

import com.web.app.service.UD11HdocvariablesService;
import com.web.app.dto.UD11SearchRequest;
import com.web.app.dto.UD11SearchResponse;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.entity.HdocVariables;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class UD11HdocvariablesServiceImpl implements UD11HdocvariablesService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public UD11SearchResponse searchVariables(UD11SearchRequest request) {
        String variable = request != null ? request.getVariable() : null;
        String type = request != null ? request.getType() : null;
        String description = request != null ? request.getDescription() : null;

        List<HdocVariables> list = hdocVariablesMapper.selectByCondition(variable, type, description);
        List<UD11SearchResponse.VariableInfo> variables = new ArrayList<>();
        for (HdocVariables v : list) {
            UD11SearchResponse.VariableInfo info = new UD11SearchResponse.VariableInfo();
            info.setVariable(v.getVariable());
            info.setType(v.getTypeField());
            info.setDescription(v.getDescription());
            info.setCreatedByUser(v.getRegisterUser());
            info.setDate(v.getRegisterDatetime() != null ? v.getRegisterDatetime().toString() : "");
            variables.add(info);
        }
        return UD11SearchResponse.success(variables, variables.size());
    }
}
