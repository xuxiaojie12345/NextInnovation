package com.web.app.service.impl;

import com.web.app.mapper.VehicleSpecificationMapper;
import com.web.app.service.VehicleSpecificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class VehicleSpecificationServiceImpl implements VehicleSpecificationService {

    @Autowired
    private VehicleSpecificationMapper mapper;

    @Override
    public Map<String, Object> getVehicleSpecification(String serie, String chno) {
        Map<String, Object> baseData = mapper.selectVehicleBase(serie, chno);
        if (baseData == null || baseData.isEmpty()) {
            return null;
        }

        String familyId = (String) baseData.get("FAMILY_ID");
        String variantId = (String) baseData.get("VARIANT_ID");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("model", baseData.get("model") != null ? baseData.get("model") : baseData.get("MODEL"));
        result.put("build", baseData.get("BUILD"));
        result.put("productType", baseData.get("PRODUCT_TYPE"));
        result.put("vin", baseData.get("VIN"));
        result.put("symbolStr", baseData.get("SYMBOL_STR"));
        result.put("countryOfOperation", baseData.get("COUNTRY_OF_OPERATION"));
        result.put("customerAdap", baseData.get("CUSTOMER_ADAP"));
        result.put("familyId", familyId);
        result.put("variantId", variantId);

        if (familyId != null && variantId != null) {
            List<Map<String, Object>> kolaList = mapper.selectKolaList(familyId, variantId);
            // Transform DB column names (SYMBOL, DESCRIPTION) to camelCase (symbol, description)
            List<Map<String, Object>> transformedList = new ArrayList<>();
            if (kolaList != null) {
                for (Map<String, Object> item : kolaList) {
                    Map<String, Object> transformed = new LinkedHashMap<>();
                    transformed.put("symbol", item.get("SYMBOL"));
                    transformed.put("description", item.get("DESCRIPTION"));
                    transformedList.add(transformed);
                }
            }
            result.put("kolaList", transformedList);
        } else {
            result.put("kolaList", new ArrayList<>());
        }

        return result;
    }
}
