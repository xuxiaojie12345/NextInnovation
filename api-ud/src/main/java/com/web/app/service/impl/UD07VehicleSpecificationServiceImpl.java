package com.web.app.service.impl;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD07VehicleSpecificationRequest;
import com.web.app.domain.UD07VehicleSpecificationResponse;
import com.web.app.mapper.HdocRecDataKolaVariantMapper;
import com.web.app.mapper.HdocRecDataOmMapper;
import com.web.app.service.UD07VehicleSpecificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * UD07 Vehicle Specification Service Implementation
 * 车辆规格信息查询服务实现类
 */
@Slf4j
@Service
public class UD07VehicleSpecificationServiceImpl implements UD07VehicleSpecificationService {
    
    @Autowired
    private HdocRecDataOmMapper hdocRecDataOmMapper;
    
    @Autowired
    private HdocRecDataKolaVariantMapper hdocRecDataKolaVariantMapper;
    
    /**
     * 获取车辆规格信息
     * 
     * @param request 请求对象，包含Chassis no
     * @return API响应，包含车辆基础信息和VDA变体信息
     */
    @Override
    public ApiResponse<UD07VehicleSpecificationResponse> getVehicleSpecification(UD07VehicleSpecificationRequest request) {
        log.info("========== UD07 Vehicle Specification API Call ==========");
        log.info("Received request - Chassis no: {}", request.getChassisNo());
        
        // 4.4 参数校验
        String validationResult = validateRequest(request);
        if (validationResult != null) {
            log.warn("Parameter validation failed: {}", validationResult);
            return ApiResponse.error(400, validationResult);
        }
        
        try {
            // 拆分Chassis no为SERIE和CHNR
            String chassisNo = request.getChassisNo().trim();
            String serie = chassisNo.substring(0, 4);
            String chnr = chassisNo.substring(4).trim();
            
            log.info("Split chassis no - SERIE: {}, CHNR: {}", serie, chnr);
            
            // 4.5-4.6 【① 基础车辆信息取得】
            Map<String, Object> vehicleBaseInfo = hdocRecDataOmMapper.selectVehicleBaseInfo(serie, chnr);
            
            if (vehicleBaseInfo == null || vehicleBaseInfo.isEmpty()) {
                log.warn("No vehicle base info found for SERIE: {}, CHNR: {}", serie, chnr);
                return ApiResponse.error(404, "未找到对应的车辆信息");
            }
            
            log.info("Query successful - Found vehicle base info");
            log.info("  Model: {}, BuiltWeek: {}, VIN: {}, ProductType: {}, CountryOfOperation: {}",
                    vehicleBaseInfo.get("model"),
                    vehicleBaseInfo.get("builtWeek"),
                    vehicleBaseInfo.get("vin"),
                    vehicleBaseInfo.get("productType"),
                    vehicleBaseInfo.get("countryOfOperation"));
            
            // 提取FAMILY_ID和VARIANT_ID
            String familyId = (String) vehicleBaseInfo.get("familyId");
            String variantId = (String) vehicleBaseInfo.get("variantId");
            
            // 4.5-4.6 【② VDA 变体信息取得】
            List<Map<String, Object>> variantList = new ArrayList<>();
            if (familyId != null && !familyId.trim().isEmpty() && 
                variantId != null && !variantId.trim().isEmpty()) {
                
                variantList = hdocRecDataKolaVariantMapper.selectVariantList(familyId, variantId);
                
                if (variantList == null || variantList.isEmpty()) {
                    log.warn("No variant info found for FAMILY_ID: {}, VARIANT_ID: {}", familyId, variantId);
                    variantList = new ArrayList<>();
                } else {
                    log.info("Query successful - Found {} variant records", variantList.size());
                }
            } else {
                log.warn("FAMILY_ID or VARIANT_ID is empty, skip variant query");
            }
            
            // 构建发动机编号（从第一个变体的symbol中获取）
            String engineNo = "N/A";
            if (!variantList.isEmpty()) {
                Map<String, Object> firstVariant = variantList.get(0);
                String symbolPrefix = (String) firstVariant.get("symbolPrefix");
                if (symbolPrefix != null && !symbolPrefix.trim().isEmpty()) {
                    engineNo = symbolPrefix.trim();
                }
            }
            
            // 4.7-4.8 封装响应对象
            UD07VehicleSpecificationResponse.VehicleInfo vehicleInfo = UD07VehicleSpecificationResponse.VehicleInfo.builder()
                    .model((String) vehicleBaseInfo.get("model"))
                    .builtWeek((String) vehicleBaseInfo.get("builtWeek"))
                    .customerAdap((String) vehicleBaseInfo.get("customerAdap"))
                    .productType((String) vehicleBaseInfo.get("productType"))
                    .vin((String) vehicleBaseInfo.get("vin"))
                    .countryOfOperation((String) vehicleBaseInfo.get("countryOfOperation"))
                    .familyId(familyId)
                    .variantId(variantId)
                    .build();
            
            // 构建变体列表
            List<UD07VehicleSpecificationResponse.VariantItem> variantItems = new ArrayList<>();
            for (Map<String, Object> variant : variantList) {
                UD07VehicleSpecificationResponse.VariantItem item = UD07VehicleSpecificationResponse.VariantItem.builder()
                        .symbol((String) variant.get("symbolPrefix"))
                        .description((String) variant.get("description"))
                        .functionGroup((String) variant.get("functionGroup"))
                        .build();
                variantItems.add(item);
            }
            
            UD07VehicleSpecificationResponse.VariantInfo variantInfo = UD07VehicleSpecificationResponse.VariantInfo.builder()
                    .list(variantItems)
                    .build();
            
            UD07VehicleSpecificationResponse response = UD07VehicleSpecificationResponse.builder()
                    .vehicleInfo(vehicleInfo)
                    .variantInfo(variantInfo)
                    .engineNo(engineNo)
                    .build();
            
            log.info("========== UD07 Vehicle Specification Query Completed ==========");
            return ApiResponse.success(response);
            
        } catch (Exception e) {
            log.error("System error occurred while querying vehicle specification", e);
            return ApiResponse.error(500, "系统内部错误，请联系管理员");
        }
    }
    
    /**
     * 校验请求参数
     * 
     * @param request 请求对象
     * @return 如果校验失败返回错误消息，否则返回null
     */
    private String validateRequest(UD07VehicleSpecificationRequest request) {
        // 检查Chassis no是否为空
        if (request.getChassisNo() == null || request.getChassisNo().trim().isEmpty()) {
            return "Chassis no不能为空";
        }
        
        String chassisNo = request.getChassisNo().trim();
        
        // 检查长度（至少需要4位用于SERIE）
        if (chassisNo.length() < 4) {
            return "Chassis no长度不足，至少需要4位";
        }
        
        // 检查格式（前4位应为字母，后面可以包含空格和数字）
        String serie = chassisNo.substring(0, 4);
        if (!serie.matches("[A-Za-z]{4}")) {
            return "Chassis no前4位必须为字母";
        }
        
        return null;
    }
}
