package com.web.app.service.impl;

import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.UD09HomologationVariablesResultService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * UD09_HomologationVariablesResult 服务实现类
 */
@Service
public class UD09HomologationVariablesResultServiceImpl implements UD09HomologationVariablesResultService {

    private static final Logger logger = LogManager.getLogger(UD09HomologationVariablesResultServiceImpl.class);

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public List<Map<String, Object>> searchUserDefinedRules(Map<String, Object> params) {
        logger.info("检索用户定义规则，参数: {}", params);
        return hdocUserDefinedRulesMapper.selectByConditions(params);
    }

    @Override
    public void deleteUserDefinedRule(String pc, String number, String market) {
        logger.info("删除用户定义规则，pc: {}, number: {}, market: {}", pc, number, market);
        hdocUserDefinedRulesMapper.deleteByPrimaryKey(pc, number, market);
    }
}
