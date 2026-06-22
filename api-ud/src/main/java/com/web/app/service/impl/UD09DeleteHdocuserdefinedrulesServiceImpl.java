package com.web.app.service.impl;

import com.web.app.mapper.HdocUserDefinedRulesMapper;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * UD09_DeleteHdocuserdefinedrules 服务实现类
 */
@Service
public class UD09DeleteHdocuserdefinedrulesServiceImpl implements UD09DeleteHdocuserdefinedrulesService {

    private static final Logger logger = LogManager.getLogger(UD09DeleteHdocuserdefinedrulesServiceImpl.class);

    @Autowired
    private HdocUserDefinedRulesMapper hdocUserDefinedRulesMapper;

    @Override
    public List<Map<String, Object>> search(Map<String, Object> params) {
        logger.info("搜索认证参数规则");
        return hdocUserDefinedRulesMapper.selectByConditions(params);
    }

    @Override
    public void deleteSelected(List<Map<String, Object>> selectedRecords) {
        logger.info("批量删除认证参数规则，共{}条", selectedRecords.size());
        for (Map<String, Object> record : selectedRecords) {
            String pc = (String) record.get("pc");
            String num = (String) record.get("num");
            String market = (String) record.get("market");
            hdocUserDefinedRulesMapper.deleteByPrimaryKey(pc, num, market);
        }
    }
}
