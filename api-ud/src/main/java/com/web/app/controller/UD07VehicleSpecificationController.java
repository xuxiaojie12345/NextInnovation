package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD07VehicleSpecificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UD07VehicleSpecificationController {

    @Autowired
    private UD07VehicleSpecificationService vehicleSpecificationService;

    @PostMapping("/ud07/vehiclespecification")
    public ResponseEntity<ApiResponse<VehicleSpecificationResponse>> vehicleSpecification(
        @RequestBody VehicleSpecificationRequest request) {
        // 将ChassisNo拆分为SERIE和CHNR（如"JPCT013945" -> "JPCT" + "013945"）
        String chassisNo = request.getChassisNo();
        String serie = extractSerie(chassisNo);
        String chnr = extractChnr(chassisNo);

        VehicleSpecificationResponse omResponse = vehicleSpecificationService.selectHdocRecDataOm(serie, chnr);
        
        // 用FAMILY_ID和VARIANT_ID查询KOLA Variant
        KolaVariantResponse kolaResponse = vehicleSpecificationService
            .selectHdocRecDataVdaAndKolVariants(omResponse.getFamilyId(), omResponse.getVariantId());

        // 合并数据
        VehicleSpecificationResponse result = new VehicleSpecificationResponse();
        result.setModel(omResponse.getModel());
        result.setBuild(omResponse.getBuild());
        result.setProductType(omResponse.getProductType());
        result.setVin(omResponse.getVin());
        result.setCountryOfOperation(omResponse.getCountryOfOperation());
        if (kolaResponse != null) {
            result.setSymbol(kolaResponse.getSymbol());
            result.setDescription(kolaResponse.getDescription());
        }
        result.setCustomerAdap(omResponse.getCustomerAdap());
        result.setVariantId(omResponse.getVariantId());

        return ResponseEntity.ok(ApiResponse.success("查询成功", result));
    }

    private String extractSerie(String chassisNo) {
        if (chassisNo == null || chassisNo.length() < 4) return chassisNo;
        return chassisNo.replaceAll("[0-9]", "");  // 提取字母部分
    }

    private String extractChnr(String chassisNo) {
        if (chassisNo == null) return null;
        return chassisNo.replaceAll("[^0-9]", "");  // 提取数字部分
    }
}
