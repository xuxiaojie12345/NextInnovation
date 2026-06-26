package com.web.app.service.impl;

import com.web.app.dto.CountResponse;
import com.web.app.dto.HdocVariablesResponse;
import com.web.app.dto.Ud11SearchRequest;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.UD11HdocvariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UD11HdocvariablesServiceImpl implements UD11HdocvariablesService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public List<HdocVariablesResponse> searchHdocVariables(Ud11SearchRequest request) {
        List<HdocVariablesResponse> list = hdocVariablesMapper.searchVariables(
            request.getVariable(), request.getDescription());
        if (list == null) {
            return java.util.Collections.emptyList();
        }
        return list;
    }

    @Override
    public CountResponse countHdocVariables(Ud11SearchRequest request) {
        int count = hdocVariablesMapper.countVariables(request.getVariable(), request.getDescription());
        CountResponse response = new CountResponse();
        response.setCount(count);
        return response;
    }
}
