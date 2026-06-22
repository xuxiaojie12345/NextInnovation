package com.web.app.service.impl;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse;
import com.web.app.entity.HdocVariables;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.UD11HdocvariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * UD11 - HDoc变量搜索服务实现类
 */
@Service
public class UD11HdocvariablesServiceImpl implements UD11HdocvariablesService {

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public UD11HdocvariablesResponse searchVariables(UD11HdocvariablesRequest request) {
        UD11HdocvariablesResponse response = new UD11HdocvariablesResponse();

        // 构建查询参数
        HdocVariables params = new HdocVariables();
        params.setVariable(request.getVariable());
        params.setType(request.getType());
        params.setDescription(request.getDescription());

        // 查询
        List<HdocVariables> list = hdocVariablesMapper.searchVariables(params);

        List<Map<String, Object>> variables = new ArrayList<>();
        if (list != null) {
            for (HdocVariables v : list) {
                Map<String, Object> item = new HashMap<>();
                item.put("variable", v.getVariable());
                item.put("type", v.getType());
                item.put("description", v.getDescription());
                item.put("createdByUser", v.getCreatedByUser());
                item.put("date", v.getCreateDate());
                variables.add(item);
            }
        }

        UD11HdocvariablesResponse.UD11HdocvariablesData data = new UD11HdocvariablesResponse.UD11HdocvariablesData();
        data.setVariables(variables);
        data.setCount(variables.size());

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }
}
