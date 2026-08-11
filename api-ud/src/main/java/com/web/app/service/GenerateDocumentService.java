package com.web.app.service;

import com.web.app.dto.response.DocumentDataResponse;
import com.web.app.dto.response.VehicleSpecificationResponse;

public interface GenerateDocumentService {
    DocumentDataResponse generateDocument(String chassisNo, String docType);
    VehicleSpecificationResponse getVehicleSpecification(String chassisNo);
}
