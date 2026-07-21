package com.web.app.service;

import com.web.app.dto.response.VehicleSpecificationResponse;
import java.util.Map;

public interface GenerateDocumentService {
    Map<String, Object> generateDocument(String chassisNo, String docType);
    VehicleSpecificationResponse getVehicleSpecification(String chassisNo);
}
