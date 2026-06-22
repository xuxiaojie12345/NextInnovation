package com.web.app.service;

import java.util.Map;

public interface VehicleSpecificationService {
    Map<String, Object> getVehicleSpecification(String serie, String chno);
}
