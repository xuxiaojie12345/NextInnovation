package com.web.app.service.impl;

import com.web.app.dto.VehicleSpecificationResponse;
import com.web.app.dto.KolaVariantResponse;
import com.web.app.mapper.HdocRecDataOmMapper;
import com.web.app.mapper.HdocRecDataKolaVariantMapper;
import com.web.app.service.UD07VehicleSpecificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class UD07VehicleSpecificationServiceImpl implements UD07VehicleSpecificationService {

    @Autowired
    private HdocRecDataOmMapper hdocRecDataOmMapper;
    @Autowired
    private HdocRecDataKolaVariantMapper hdocRecDataKolaVariantMapper;

    @Override
    public VehicleSpecificationResponse selectHdocRecDataOm(String serie, String chnr) {
        if (serie == null || chnr == null) {
            throw new IllegalArgumentException("SERIE和CHNR不能为空");
        }
        VehicleSpecificationResponse response = hdocRecDataOmMapper.selectVehicleSpecification(serie, chnr);
        if (response == null) {
            throw new RuntimeException("查询失败，没有找到车辆规格数据");
        }
        return response;
    }

    @Override
    public KolaVariantResponse selectHdocRecDataVdaAndKolVariants(String familyId, String variantId) {
        if (familyId == null || variantId == null) {
            return null;
        }
        return hdocRecDataKolaVariantMapper.selectByFamilyIdAndVariantId(familyId, variantId);
    }
}
