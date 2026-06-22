package com.web.app.service.impl;

import com.web.app.domain.UD07VehicleSpecificationResponse;
import com.web.app.mapper.VehicleSpecificationMapper;
import com.web.app.service.UD07VehicleSpecificationService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

/**
 * UD07_VehicleSpecification 服务实现类
 */
@Service
public class UD07VehicleSpecificationServiceImpl implements UD07VehicleSpecificationService {

    private static final Logger logger = LogManager.getLogger(UD07VehicleSpecificationServiceImpl.class);

    @Autowired
    private VehicleSpecificationMapper vehicleSpecificationMapper;

    @Override
    public UD07VehicleSpecificationResponse getVehicleSpecification(String serie, String chassisNo) {
        logger.info("开始查询车辆规格信息，serie: {}, chassisNo: {}", serie, chassisNo);

        // 1. 查询车辆规格主数据
        LinkedHashMap<String, Object> specData = vehicleSpecificationMapper.selectVehicleSpecData(serie, chassisNo);

        if (specData == null || specData.isEmpty()) {
            logger.warn("未找到车辆规格数据，serie: {}, chassisNo: {}", serie, chassisNo);
            throw new RuntimeException("No data found for chassis: " + serie + chassisNo);
        }

        // 2. 提取 FAMILY_ID 和 VARIANT_ID 用于第二次查询
        String familyId = (String) specData.get("FAMILY_ID");
        String variantId = (String) specData.get("VARIANT_ID");

        // 3. 查询 KOLA Variant 格式化符号
        List<LinkedHashMap<String, Object>> kolaRecords = vehicleSpecificationMapper
                .selectKolaVariantByFamilyAndVariant(familyId, variantId);

        // 4. 格式化 SYMBOL_STR：多条用空格拼接
        String symbolStr = "";
        String description = "";
        if (kolaRecords != null && !kolaRecords.isEmpty()) {
            symbolStr = kolaRecords.stream()
                    .map(r -> (String) r.get("SYMBOL_STR"))
                    .collect(Collectors.joining(" "));

            // 取第一条记录的 DESCRIPTION
            description = (String) kolaRecords.get(0).get("DESCRIPTION");
        }

        // 5. 处理 BUILD 字段（BigDecimal → String）
        Object buildObj = specData.get("BUILD");
        String builtWeek = buildObj != null ? String.valueOf(buildObj) : "";

        // 6. 组装响应
        UD07VehicleSpecificationResponse response = new UD07VehicleSpecificationResponse();
        response.setModel((String) specData.get("MODEL"));
        response.setBuiltWeek(builtWeek);
        response.setProductType((String) specData.get("PRODUCT_TYPE"));
        response.setVin((String) specData.get("VIN"));
        response.setEngineNo((String)specData.get("SYMBOL"));
        response.setCountryOfOperation((String) specData.get("COUNTRY_OF_OPERATION"));
        response.setSymbolStr(symbolStr);
        response.setDescription(description);
        response.setSNoteNo((String) specData.get("CUSTOMER_ADAP"));

        logger.info("车辆规格信息查询成功，model: {}", response.getModel());
        return response;
    }
}
