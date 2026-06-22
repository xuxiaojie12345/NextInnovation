package com.web.app.service.impl;

import com.web.app.dto.UD14SearchresultistRequest;
import com.web.app.dto.UD14SearchresultistResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.service.UD14SearchresultistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD14 - 搜索结果列表服务实现类
 */
@Service
public class UD14SearchresultistServiceImpl implements UD14SearchresultistService {

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public UD14SearchresultistResponse selectMarketmaster() {
        List<MarketMaster> markets = marketMasterMapper.selectAll();

        Map<String, Object> data = new HashMap<>();
        data.put("markets", markets);

        UD14SearchresultistResponse response = new UD14SearchresultistResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD14SearchresultistResponse selectHdocuserdefinedrules(UD14SearchresultistRequest request) {
        UD14SearchresultistResponse response = new UD14SearchresultistResponse();

        // 参数校验
        if (request.getMarket() == null || request.getMarket().trim().isEmpty()) {
            response.setCode(400);
            response.setMsg("市场不能为空");
            return response;
        }

        // 查询
        List<String> variables = hdocUserDefinedRulesMapper.selectVariablesByMarket(request.getMarket());

        Map<String, Object> data = new HashMap<>();
        data.put("rules", variables);

        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }
}
