package com.web.app.service.impl;

import com.web.app.dto.UD08HomologationVariablesResponse;
import com.web.app.dto.UD08UserDefinedRulesRequest;
import com.web.app.entity.HdocUserDefinedRules;
import com.web.app.entity.HdocVariables;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.ProductClassMaster;
import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.ProductClassMasterMapper;
import com.web.app.service.UD08HomologationVariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * UD08 - Homologation Variables服务实现类
 */
@Service
public class UD08HomologationVariablesServiceImpl implements UD08HomologationVariablesService {

    @Autowired
    private ProductClassMasterMapper productClassMasterMapper;

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public UD08HomologationVariablesResponse selectProductclassmaster() {
        List<ProductClassMaster> list = productClassMasterMapper.selectAll();

        Map<String, Object> data = new HashMap<>();
        data.put("productClasses", list);

        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD08HomologationVariablesResponse selectMarketmaster() {
        List<MarketMaster> list = marketMasterMapper.selectAll();

        Map<String, Object> data = new HashMap<>();
        data.put("markets", list);

        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD08HomologationVariablesResponse selectHdocvariables() {
        // 查询所有变量
        HdocVariables params = new HdocVariables();
        List<HdocVariables> list = hdocVariablesMapper.searchVariables(params);

        Map<String, Object> data = new HashMap<>();
        data.put("variables", list);

        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    @Override
    public UD08HomologationVariablesResponse addUserDefinedRules(UD08UserDefinedRulesRequest request) {
        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();

        // 参数校验
        if (request.getProductClass() == null || request.getNumber() == null || request.getMarket() == null) {
            response.setCode(400);
            response.setMsg("参数不完整");
            return response;
        }

        // 存在性检查
        int count = hdocUserDefinedRulesMapper.countByCondition(
                request.getProductClass(), request.getNumber(), request.getMarket());
        if (count > 0) {
            response.setCode(400);
            response.setMsg("记录已存在");
            return response;
        }

        // Variable校验
        if (request.getVariable() != null) {
            int varCount = hdocVariablesMapper.countByVariable(request.getVariable());
            if (varCount == 0) {
                response.setCode(400);
                response.setMsg("Variable不存在");
                return response;
            }
        }

        // 构建实体
        HdocUserDefinedRules rules = new HdocUserDefinedRules();
        rules.setPc(request.getProductClass());
        rules.setNum(request.getNumber());
        rules.setMarket(request.getMarket());
        rules.setVariable(request.getVariable());
        rules.setVal(request.getValue());
        rules.setVs(request.getString1());
        rules.setVs2(request.getString2());
        rules.setComments(request.getComments());
        rules.setAddDate(request.getAdd());
        rules.setDeleteDate(request.getDelete());
        rules.setRegisterUser(request.getUser());
        rules.setRegisterDatetime(request.getDate());

        hdocUserDefinedRulesMapper.insert(rules);

        response.setCode(200);
        response.setMsg("登录成功");
        return response;
    }

    @Override
    public UD08HomologationVariablesResponse updateUserDefinedRules(UD08UserDefinedRulesRequest request) {
        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();

        // 参数校验
        if (request.getProductClass() == null || request.getNumber() == null || request.getMarket() == null) {
            response.setCode(400);
            response.setMsg("参数不完整");
            return response;
        }

        // 存在性检查
        int count = hdocUserDefinedRulesMapper.countByCondition(
                request.getProductClass(), request.getNumber(), request.getMarket());
        if (count == 0) {
            response.setCode(400);
            response.setMsg("记录不存在");
            return response;
        }

        // 构建实体
        HdocUserDefinedRules rules = new HdocUserDefinedRules();
        rules.setPc(request.getProductClass());
        rules.setNum(request.getNumber());
        rules.setMarket(request.getMarket());
        rules.setVariable(request.getVariable());
        rules.setVal(request.getValue());
        rules.setVs(request.getString1());
        rules.setVs2(request.getString2());
        rules.setComments(request.getComments());
        rules.setAddDate(request.getAdd());
        rules.setDeleteDate(request.getDelete());
        rules.setRegisterUser(request.getUser());
        rules.setRegisterDatetime(request.getDate());

        hdocUserDefinedRulesMapper.update(rules);

        response.setCode(200);
        response.setMsg("更新成功");
        return response;
    }

    @Override
    public UD08HomologationVariablesResponse deleteUserDefinedRules(UD08UserDefinedRulesRequest request) {
        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();

        // 参数校验
        if (request.getProductClass() == null || request.getNumber() == null || request.getMarket() == null) {
            response.setCode(400);
            response.setMsg("参数不完整");
            return response;
        }

        // 存在性检查
        int count = hdocUserDefinedRulesMapper.countByCondition(
                request.getProductClass(), request.getNumber(), request.getMarket());
        if (count == 0) {
            response.setCode(400);
            response.setMsg("记录不存在");
            return response;
        }

        hdocUserDefinedRulesMapper.deleteByCondition(
                request.getProductClass(), request.getNumber(), request.getMarket());

        response.setCode(200);
        response.setMsg("删除成功");
        return response;
    }
}
