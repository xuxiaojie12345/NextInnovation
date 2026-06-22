package com.web.app.service.impl;

import com.web.app.mapper.HdocSendDataVinPlateMapper;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * UD15_Selecthdocsenddatavinplate 服务实现类
 */
@Service
public class UD15SelecthdocsenddatavinplateServiceImpl implements UD15SelecthdocsenddatavinplateService {

    private static final Logger logger = LogManager.getLogger(UD15SelecthdocsenddatavinplateServiceImpl.class);

    @Autowired
    private HdocSendDataVinPlateMapper hdocSendDataVinPlateMapper;

    @Override
    public Map<String, Object> viewInfo(String chassisNumber) {
        logger.info("查看VIN Plate信息，chassisNumber: {}", chassisNumber);

        String serie = chassisNumber.replaceAll("[0-9]", "");
        String chnr = chassisNumber.replaceAll("[A-Za-z]", "");

        Map<String, Object> data = hdocSendDataVinPlateMapper.selectBySerieAndChnr(serie, chnr);
        if (data == null || data.isEmpty()) {
            throw new RuntimeException("Chassis number " + chassisNumber + " not found.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("chassisNumber", chassisNumber);
        result.put("type", data.get("TYPE"));
        result.put("status", data.get("STATUS"));
        result.put("message", data.get("MSG"));
        result.put("registerDatetime", data.get("REGISTER_DATETIME"));
        result.put("docReady", data.get("DOC_READY"));
        result.put("docSent", data.get("DOC_SENT"));
        result.put("xmlDoc", data.get("XML_DOC"));

        return result;
    }

    @Override
    public void setRegenerate(String chassisNumber) {
        logger.info("设置重新生成，chassisNumber: {}", chassisNumber);
        String serie = chassisNumber.replaceAll("[0-9]", "");
        String chnr = chassisNumber.replaceAll("[A-Za-z]", "");
        hdocSendDataVinPlateMapper.updateStatusToRegenerate(serie, chnr);
    }

    @Override
    public void setOk(String chassisNumber) {
        logger.info("设置完成，chassisNumber: {}", chassisNumber);
        String serie = chassisNumber.replaceAll("[0-9]", "");
        String chnr = chassisNumber.replaceAll("[A-Za-z]", "");
        hdocSendDataVinPlateMapper.updateStatusToOk(serie, chnr);
    }

    @Override
    public void changeToAdvanced(String chassisNumber) {
        logger.info("切换到高级信息，chassisNumber: {}", chassisNumber);
        String serie = chassisNumber.replaceAll("[0-9]", "");
        String chnr = chassisNumber.replaceAll("[A-Za-z]", "");
        hdocSendDataVinPlateMapper.updateToAdvancedInfo(serie, chnr);
    }
}
