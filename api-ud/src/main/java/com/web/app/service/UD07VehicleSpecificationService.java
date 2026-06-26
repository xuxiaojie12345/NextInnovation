package com.web.app.service;

import com.web.app.dto.VehicleSpecificationResponse;
import com.web.app.dto.KolaVariantResponse;

public interface UD07VehicleSpecificationService {
    VehicleSpecificationResponse selectHdocRecDataOm(String serie, String chnr);
    KolaVariantResponse selectHdocRecDataVdaAndKolVariants(String familyId, String variantId);
}
