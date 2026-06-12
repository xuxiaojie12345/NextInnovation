package com.web.app.service;

import com.web.app.dto.UD07VehicleSpecificationRequest;
import com.web.app.dto.UD07VehicleSpecificationResponse;

public interface UD07VehicleSpecificationService {
    UD07VehicleSpecificationResponse getVehicleSpecification(UD07VehicleSpecificationRequest request);
}
