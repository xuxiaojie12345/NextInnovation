package com.web.app.service.impl;

import com.web.app.dto.response.VariableSearchRecord;
import com.web.app.dto.response.SearchResultResponse;
import com.web.app.dto.request.UD10AddVariableRequest;
import com.web.app.dto.request.UD10UpdateVariableRequest;
import com.web.app.dto.request.UD10SearchRequest;
import com.web.app.entity.HdocVariables;
import com.web.app.exception.BusinessException;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.VariableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VariableServiceImpl implements VariableService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public SearchResultResponse<VariableSearchRecord> searchVariables(UD10SearchRequest request) {
        List<HdocVariables> list = hdocVariablesMapper.selectByCondition(
            request.getVariable(), request.getType(), request.getDescription(),
            request.getCreatedByUser(), request.getDateFrom(), request.getDateTo());
        List<VariableSearchRecord> records = list.stream().map(v -> {
            VariableSearchRecord rec = new VariableSearchRecord();
            rec.setVariable(v.getVariable());
            rec.setType(v.getType());
            rec.setDescription(v.getDescription());
            rec.setCreatedByUser(v.getRegisterUser());
            rec.setCreatedDate(v.getRegisterDatetime() != null ? v.getRegisterDatetime().toString() : null);
            return rec;
        }).collect(Collectors.toList());
        return new SearchResultResponse<>(records.size(), records);
    }

    @Override
    public void addVariable(UD10AddVariableRequest request) {
        if (hdocVariablesMapper.existsByVariable(request.getVariable()) > 0) {
            throw new BusinessException(409, "Variant already exists. Please enter the correct content.");
        }
        HdocVariables entity = new HdocVariables();
        entity.setVariable(request.getVariable());
        entity.setType(request.getType());
        entity.setDescription(request.getDescription());
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        entity.setRegisterDatetime(now);
        entity.setRegisterUser("system");
        entity.setRegisterProcess("UD10Add");
        entity.setUpdateDatetime(now);
        entity.setUpdateUser("system");
        entity.setUpdateProcess("UD10Add");
        hdocVariablesMapper.insert(entity);
    }

    @Override
    public void updateVariable(UD10UpdateVariableRequest request) {
        if (hdocVariablesMapper.existsByVariable(request.getVariable()) == 0) {
            throw new BusinessException(404, "Variant does not exist. Please enter the correct content.");
        }
        HdocVariables entity = new HdocVariables();
        entity.setVariable(request.getVariable());
        entity.setType(request.getType());
        entity.setDescription(request.getDescription());
        entity.setUpdateDatetime(java.time.LocalDateTime.now());
        entity.setUpdateUser("system");
        entity.setUpdateProcess("UD10Update");
        hdocVariablesMapper.update(entity);
    }

    @Override
    public void deleteVariable(String variable) {
        if (hdocVariablesMapper.existsByVariable(variable) == 0) {
            throw new BusinessException(404, "Variant does not exist. Please enter the correct content.");
        }
        hdocVariablesMapper.deleteByVariable(variable);
    }
}
