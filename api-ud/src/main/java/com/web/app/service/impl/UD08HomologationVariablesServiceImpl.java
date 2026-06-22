package com.web.app.service.impl;

import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.ProductClassMasterMapper;
import com.web.app.service.UD08HomologationVariablesService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * UD08_HomologationVariables 服务实现类
 */
@Service
public class UD08HomologationVariablesServiceImpl implements UD08HomologationVariablesService {

    private static final Logger logger = LogManager.getLogger(UD08HomologationVariablesServiceImpl.class);

    @Autowired
    private ProductClassMasterMapper productClassMasterMapper;

    @Autowired
    private MarketMasterMapper marketMasterMapper;

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public List<Map<String, Object>> selectProductClassMaster() {
        logger.info("查询产品类别列表");
        return productClassMasterMapper.selectAllProductClasses();
    }

    @Override
    public List<Map<String, Object>> selectMarketMaster() {
        logger.info("查询市场列表");
        return marketMasterMapper.selectAllMarkets();
    }

    @Override
    public boolean checkUserDefinedRuleExists(String pc, String number, String market) {
        logger.info("检查用户定义规则是否存在，pc: {}, number: {}, market: {}", pc, number, market);
        int count = hdocUserDefinedRulesMapper.countByPrimaryKey(pc, number, market);
        return count > 0;
    }

    @Override
    public boolean checkHdocVariableExists(String variable) {
        logger.info("检查HDOC Variable是否存在，variable: {}", variable);
        int count = hdocVariablesMapper.countByVariable(variable);
        return count > 0;
    }

    @Override
    public void addUserDefinedRule(Map<String, Object> params) {
        logger.info("新增用户定义规则");

        com.web.app.domain.HdocUserDefinedRules rules = new com.web.app.domain.HdocUserDefinedRules();
        rules.setPc((String) params.get("pc"));
        try {
            String numStr = (String) params.get("number");
            if (numStr != null && !numStr.trim().isEmpty()) {
                rules.setNum(new BigDecimal(numStr));
            }
        } catch (NumberFormatException e) {
            logger.error("Number格式转换失败: {}", params.get("number"), e);
            throw new IllegalArgumentException("Number must be a valid numeric value");
        }
        rules.setMarket((String) params.get("market"));
        rules.setVariable((String) params.get("variable"));
        rules.setVal((String) params.get("val"));
        rules.setVs((String) params.get("vs"));
        rules.setVs2((String) params.get("vs2"));
        rules.setComments((String) params.get("comments"));
        rules.setAddDate((String) params.get("addDate"));
        rules.setDeleteDate((String) params.get("deleteDate"));
        rules.setRegisterUser((String) params.get("updateUser"));
        rules.setRegisterDatetime(LocalDateTime.now());

        hdocUserDefinedRulesMapper.insertUserDefinedRule(rules);
    }

    @Override
    public void updateUserDefinedRule(Map<String, Object> params) {
        logger.info("更新用户定义规则");

        com.web.app.domain.HdocUserDefinedRules rules = new com.web.app.domain.HdocUserDefinedRules();
        rules.setPc((String) params.get("pc"));
        try {
            String numStr = (String) params.get("number");
            if (numStr != null && !numStr.trim().isEmpty()) {
                rules.setNum(new BigDecimal(numStr));
            }
        } catch (NumberFormatException e) {
            logger.error("Number格式转换失败: {}", params.get("number"), e);
            throw new IllegalArgumentException("Number must be a valid numeric value");
        }
        rules.setMarket((String) params.get("market"));
        rules.setVariable((String) params.get("variable"));
        rules.setVal((String) params.get("val"));
        rules.setVs((String) params.get("vs"));
        rules.setVs2((String) params.get("vs2"));
        rules.setComments((String) params.get("comments"));
        rules.setAddDate((String) params.get("addDate"));
        rules.setDeleteDate((String) params.get("deleteDate"));
        rules.setUpdateUser((String) params.get("updateUser"));
        rules.setUpdateDatetime(LocalDateTime.now());

        hdocUserDefinedRulesMapper.updateByPrimaryKey(rules);
    }

    @Override
    public void deleteUserDefinedRule(String pc, String number, String market) {
        logger.info("删除用户定义规则，pc: {}, number: {}, market: {}", pc, number, market);
        hdocUserDefinedRulesMapper.deleteByPrimaryKey(pc, number, market);
    }
}
