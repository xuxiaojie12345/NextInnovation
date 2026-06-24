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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
        // 查询所有变量名（仅VARIABLE字段）
        List<HdocVariables> list = hdocVariablesMapper.selectAllVariables();

        Map<String, Object> data = new HashMap<>();
        data.put("hdocVariables", list);

        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();
        response.setCode(200);
        response.setMsg("查询成功");
        response.setData(data);
        return response;
    }

    /**
     * 生成随机字符串（用于自动采番）
     * 格式: PREFIX + 8位随机字符
     */
    private String generateAutoValue(String prefix) {
        String suffix = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8);
        return prefix + suffix;
    }

    /**
     * 获取当前时间字符串 yyyy-MM-dd HH:mm:ss
     */
    private String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    @Override
    public UD08HomologationVariablesResponse addUserDefinedRules(UD08UserDefinedRulesRequest request) {
        UD08HomologationVariablesResponse response = new UD08HomologationVariablesResponse();

        // 参数校验（主键必须）
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
            response.setMsg("Primary key conflict, Please enter the correct content");
            return response;
        }

        // Variable校验（仅当前端提供值时校验）
        if (request.getVariable() != null && !request.getVariable().isEmpty()) {
            int varCount = hdocVariablesMapper.countByVariable(request.getVariable());
            if (varCount == 0) {
                response.setCode(400);
                response.setMsg("Variant does not exist, Please enter the correct content");
                return response;
            }
        }

        String currentTime = now();

        // 构建实体 - NOT NULL字段自动采番
        HdocUserDefinedRules rules = new HdocUserDefinedRules();
        rules.setPc(request.getProductClass());
        rules.setNum(request.getNumber());
        rules.setMarket(request.getMarket());

        // VS: 不可为空，未传入时自动采番（V + 8位随机，符合VARCHAR(100)）
        rules.setVs(request.getString1() != null && !request.getString1().isEmpty()
                ? request.getString1() : generateAutoValue("V"));

        // VARIABLE: 不可为空，未传入时自动采番（VAR_ + 8位随机，符合VARCHAR(20)）
        rules.setVariable(request.getVariable() != null && !request.getVariable().isEmpty()
                ? request.getVariable() : generateAutoValue("VAR_"));

        // VAL: 不可为空，未传入时默认"0"
        rules.setVal(request.getValue() != null && !request.getValue().isEmpty()
                ? request.getValue() : "0");

        // VS2: 可为空
        rules.setVs2(request.getString2());

        // COMMENTS: 可为空
        rules.setComments(request.getComments());

        // USERID / UP_DATE: 可为空
        rules.setUserId(request.getUser());
        rules.setUpDate(null);

        // ADD_DATE / DELETE_DATE: 可为空
        rules.setAddDate(request.getAdd());
        rules.setDeleteDate(request.getDelete());

        // 注册信息（自动填充）
        rules.setRegisterDatetime(currentTime);
        rules.setRegisterUser(request.getUser() != null ? request.getUser() : "SYSTEM");
        rules.setRegisterProcess("UD08Add");

        // 更新信息（初始与注册相同）
        rules.setUpdateDatetime(currentTime);
        rules.setUpdateUser(request.getUser() != null ? request.getUser() : "SYSTEM");
        rules.setUpdateProcess("UD08Add");

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

        // 构建实体 - 前台传入什么值就用什么值，不自动采番
        HdocUserDefinedRules rules = new HdocUserDefinedRules();
        rules.setPc(request.getProductClass());
        rules.setNum(request.getNumber());
        rules.setMarket(request.getMarket());

        rules.setVs(request.getString1());
        rules.setVariable(request.getVariable());
        rules.setVal(request.getValue());
        rules.setVs2(request.getString2());
        rules.setComments(request.getComments());
        rules.setUserId(request.getUser());
        rules.setAddDate(request.getAdd());
        rules.setDeleteDate(request.getDelete());

        rules.setUpdateDatetime(now());
        rules.setUpdateUser(request.getUser());
        rules.setUpdateProcess("UD08Update");

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
