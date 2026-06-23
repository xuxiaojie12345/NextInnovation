package com.web.app.service.impl;

import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.UD10HdocvariablesService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * UD10_Hdocvariables 服务实现类
 */
@Service
public class UD10HdocvariablesServiceImpl implements UD10HdocvariablesService {

    private static final Logger logger = LogManager.getLogger(UD10HdocvariablesServiceImpl.class);

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public boolean checkVariableExists(String variable) {
        return hdocVariablesMapper.countByVariable(variable) > 0;
    }

    @Override
    public void add(Map<String, Object> params) {
        logger.info("新增HDOC Variable: {}", params.get("variable"));

        com.web.app.domain.HdocVariables entity = new com.web.app.domain.HdocVariables();
        entity.setVariable((String) params.get("variable"));
        entity.setType((String) params.get("type"));
        entity.setDescription((String) params.get("description"));
        String useridVal = (String) params.get("userid");
        if (useridVal != null && !useridVal.trim().isEmpty()) {
            entity.setUserid(useridVal);
        }
        entity.setRegisterUser((String) params.get("user"));
        entity.setRegisterDatetime(LocalDateTime.now());

        hdocVariablesMapper.insertVariable(entity);
    }

    @Override
    public void update(Map<String, Object> params) {
        logger.info("更新HDOC Variable: {}", params.get("variable"));

        com.web.app.domain.HdocVariables entity = new com.web.app.domain.HdocVariables();
        entity.setVariable((String) params.get("variable"));
        entity.setType((String) params.get("type"));
        entity.setDescription((String) params.get("description"));
        entity.setUpdateUser((String) params.get("user"));
        entity.setUpdateDatetime(LocalDateTime.now());

        hdocVariablesMapper.updateByVariable(entity);
    }

    @Override
    public void delete(String variable) {
        logger.info("删除HDOC Variable: {}", variable);
        hdocVariablesMapper.deleteByVariable(variable);
    }
}
