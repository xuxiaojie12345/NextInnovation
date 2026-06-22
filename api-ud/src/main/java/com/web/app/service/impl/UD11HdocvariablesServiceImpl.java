package com.web.app.service.impl;

import com.web.app.mapper.HdocVariablesMapper;
import com.web.app.service.UD11HdocvariablesService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * UD11_Hdocvariables 服务实现类
 */
@Service
public class UD11HdocvariablesServiceImpl implements UD11HdocvariablesService {

    private static final Logger logger = LogManager.getLogger(UD11HdocvariablesServiceImpl.class);

    @Autowired
    private HdocVariablesMapper hdocVariablesMapper;

    @Override
    public List<Map<String, Object>> search(Map<String, Object> params) {
        logger.info("搜索HDOC Variables");
        return hdocVariablesMapper.searchByConditions(params);
    }
}
