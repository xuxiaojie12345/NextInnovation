package com.web.app.service.impl;

import com.web.app.domain.VehicleSpecificationResponse;
import com.web.app.mapper.UD07Mapper;
import com.web.app.service.UD07Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;

/**
 * UD07业务逻辑实现类
 * 对应详细设计：DES-VehicleSpecification-001
 *
 * 查询逻辑：
 * 1. 根据SERIE和CHNR查询车辆基本信息（HDOC_REC_DATA_OM + HDOC_REC_DATA_VDA_GENERAL）
 * 2. 根据SERIE和CHNR查询发动机/符号信息
 *    （HDOC_REC_DATA_VDA_VARIANTS + HDOC_REC_DATA_KOLA_VARIANT）
 * 3. Engine no固定值"A01"
 * 4. SYMBOL_STR处理：取Symbol前8位，不足左补半角空格
 * 5. 排序：FUNCTION_GROUP（左补至4位）+ FAMILY_ID（3位）
 */
@Service
public class UD07ServiceImpl implements UD07Service {

    private static final Logger logger = LoggerFactory.getLogger(UD07ServiceImpl.class);

    @Autowired
    private UD07Mapper ud07Mapper;

    @Override
    public VehicleSpecificationResponse getVehicleSpecification(String serie, String chnr) {
        logger.info("UD07 getVehicleSpecification called - serie: {}, chnr: {}", serie, chnr);

        // 查询车辆基本信息
        VehicleSpecificationResponse.ChassisInfo chassisInfo = ud07Mapper.selectChassisInfo(serie, chnr);
        if (chassisInfo == null) {
            logger.warn("Chassis not found - serie: {}, chnr: {}", serie, chnr);
            return null;
        }

        // 构建响应对象
        VehicleSpecificationResponse response = new VehicleSpecificationResponse();
        response.setChassisInfo(chassisInfo);
        response.setSNotes(new ArrayList<>());

        // 查询发动机/符号信息
        VehicleSpecificationResponse.EngineInfo engineInfo = ud07Mapper.selectEngineInfo(serie, chnr);
        if (engineInfo == null) {
            // 无匹配记录时，Engine no设为默认值
            engineInfo = new VehicleSpecificationResponse.EngineInfo();
            engineInfo.setEngineNo("A01");
            engineInfo.setSymbolStr("");
            engineInfo.setDescription("");
            logger.warn("Engine info not found - serie: {}, chnr: {}", serie, chnr);
        }
        response.setEngineInfo(engineInfo);

        logger.info("UD07 query success for serie: {}, chnr: {}", serie, chnr);
        return response;
    }
}
