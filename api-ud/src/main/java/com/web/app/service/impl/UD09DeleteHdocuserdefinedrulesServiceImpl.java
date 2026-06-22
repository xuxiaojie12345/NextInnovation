package com.web.app.service.impl;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.dto.UD09DeleteHdocuserdefinedrulesResponse;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD09 - 删除用户定义规则服务实现类
 */
@Service
public class UD09DeleteHdocuserdefinedrulesServiceImpl implements UD09DeleteHdocuserdefinedrulesService {

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public UD09DeleteHdocuserdefinedrulesResponse searchRules(UD09DeleteHdocuserdefinedrulesRequest request) {
        UD09DeleteHdocuserdefinedrulesResponse response = new UD09DeleteHdocuserdefinedrulesResponse();

        // 构建查询参数
        HdocUserDefinedRules params = new HdocUserDefinedRules();
        params.setPc(request.getProductClass());
        params.setNum(request.getNumber());
        params.setMarket(request.getMarket());
        params.setVariable(request.getVariable());
        params.setVal(request.getValue());
        params.setVs(request.getString1());
        params.setVs2(request.getString2());
        params.setComments(request.getComments());

        // 查询
        List<HdocUserDefinedRules> records = hdocUserDefinedRulesMapper.searchRules(params);

        Map<String, Object> data = new HashMap<>();
        data.put("records", records);
        data.put("count", records != null ? records.size() : 0);

        response.setCode(200);
        response.setMsg("Success");
        response.setData(data);
        return response;
    }

    @Override
    public UD09DeleteHdocuserdefinedrulesResponse deleteSelected(UD09DeleteHdocuserdefinedrulesRequest request) {
        UD09DeleteHdocuserdefinedrulesResponse response = new UD09DeleteHdocuserdefinedrulesResponse();

        // 参数校验
        if (request.getSelectedRecords() == null || request.getSelectedRecords().isEmpty()) {
            response.setCode(400);
            response.setMsg("请至少选择一条记录");
            return response;
        }

        // 逐条删除
        for (Map<String, String> record : request.getSelectedRecords()) {
            String pc = record.get("pc");
            String num = record.get("num");
            String market = record.get("market");
            hdocUserDefinedRulesMapper.deleteByCondition(pc, num, market);
        }

        response.setCode(200);
        response.setMsg("记录删除成功");
        return response;
    }
}
