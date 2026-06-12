package com.web.app.service.impl;

import com.web.app.service.UD07VehicleSpecificationService;
import com.web.app.dto.UD07VehicleSpecificationRequest;
import com.web.app.dto.UD07VehicleSpecificationResponse;
import com.web.app.mapper.*;
import com.web.app.entity.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UD07VehicleSpecificationServiceImpl implements UD07VehicleSpecificationService {

    @Autowired
    private HdocRecDataOmMapper hdocRecDataOmMapper;
    @Autowired
    private HdocRecDataVdaGeneralMapper hdocRecDataVdaGeneralMapper;
    @Autowired
    private HdocRecDataVdaVariantsMapper hdocRecDataVdaVariantsMapper;
    @Autowired
    private HdocRecDataKolaVariantMapper hdocRecDataKolaVariantMapper;

    @Override
    public UD07VehicleSpecificationResponse getVehicleSpecification(UD07VehicleSpecificationRequest request) {
        if (request == null || request.getChassisNo() == null) {
            return UD07VehicleSpecificationResponse.error("Invalid request parameters");
        }

        String serie = "";
        String chnr = request.getChassisNo();

        HdocRecDataOm om = hdocRecDataOmMapper.selectBySerieAndChnr(serie, chnr);
        HdocRecDataVdaGeneral general = hdocRecDataVdaGeneralMapper.selectBySerieAndChnr(serie, chnr);
        HdocRecDataVdaVariants variants = hdocRecDataVdaVariantsMapper.selectBySerieAndChnr(serie, chnr);

        UD07VehicleSpecificationResponse.DataInfo data = new UD07VehicleSpecificationResponse.DataInfo();
        data.setModel(om != null ? om.getModel() : "");
        data.setBuiltWeek(om != null && om.getBuild() != null ? String.valueOf(om.getBuild()) : "");
        data.setProductType(general != null ? general.getProductType() : "");
        data.setVin(general != null ? general.getVin() : "");
        data.setCountryOfOperation(general != null ? general.getCountryOfOperation() : "");

        if (variants != null) {
            List<HdocRecDataKolaVariant> kolaVariants = hdocRecDataKolaVariantMapper
                    .selectByFamilyIdAndVariantId(variants.getFamilyId(), variants.getVariantId());
            if (kolaVariants != null && !kolaVariants.isEmpty()) {
                HdocRecDataKolaVariant first = kolaVariants.get(0);
                String symbol = first.getSymbol();
                if (symbol != null) {
                    symbol = symbol.length() > 8 ? symbol.substring(0, 8) : String.format("%-8s", symbol);
                }
                data.setSymbolStr(symbol);
                data.setDescription(first.getDescription());
            }
        }

        return UD07VehicleSpecificationResponse.success(data);
    }
}
